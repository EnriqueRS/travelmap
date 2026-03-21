import { Injectable, NotFoundException } from '@nestjs/common';
import { Photo } from './entities/photo.entity';
import { Trip } from '../trips/entities/trip.entity';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { IntegrationsService } from '../integrations/integrations.service';
import axios from 'axios';

@Injectable()
export class MediaService {
  constructor (private readonly integrationsService: IntegrationsService) { }

  /**
   * Obtiene todas las fotos del usuario que deben mostrarse en el mapa.
   */
  async getMapPhotos(userId: number): Promise<Photo[]> {
    return Photo.query()
      .where('user_id', userId)
      .andWhere('show_on_map', true)
      .orderBy('created_at', 'desc');
  }

  /**
   * Guarda un registro local para una foto externa subida con Immich o Google
   */
  async addExternalPhoto(tripId: string, userId: number, externalData: any): Promise<Photo> {
    const { v4: uuidv4 } = require('uuid');
    const photo = await Photo.query().insert({
      id: uuidv4(),
      userId,
      tripId,
      url: externalData.url,
      provider: externalData.provider,
      externalId: externalData.externalId,
      showOnMap: externalData.showOnMap || false,
      isCover: false,
      isHidden: false,
      metadata: {
        size: 0,
        format: 'external',
        exif: externalData.exifInfo
      }
    });
    return photo;
  }

  /**
   * Registra una foto local almacenada por Multer
   */
  async addLocalPhoto(tripId: string, userId: number, file: Express.Multer.File): Promise<Photo> {
    const { v4: uuidv4 } = require('uuid');
    const photoUrl = `/uploads/photos/${file.filename}`;

    // Si queremos parsear EXIF location para rellenar locationId iría aquí o en fondo...
    const photo = await Photo.query().insert({
      id: uuidv4(),
      userId,
      tripId,
      provider: 'local',
      url: photoUrl,
      showOnMap: false,
      isCover: false,
      isHidden: false,
      metadata: {
        size: file.size,
        format: path.extname(file.originalname).replace('.', '')
      }
    });

    return photo;
  }

  /**
   * Obtiene todas las fotos vinculadas a un viaje
   */
  async getTripPhotos(tripId: string, userId: number): Promise<Photo[]> {
    return Photo.query()
      .where({ trip_id: tripId, user_id: userId })
      .orderBy('created_at', 'desc');
  }

  /**
   * Modifica propiedades lógicas de la foto (si se muestra en mapa o es la portada)
   */
  async updatePhoto(id: string, userId: number, data: { showOnMap?: boolean, isCover?: boolean, isHidden?: boolean, metadata?: any }): Promise<Photo> {
    const photo = await Photo.query().findOne({ id, user_id: userId });

    if (!photo) {
      throw new NotFoundException('Foto no encontrada');
    }

    // Si tratamos de establecerla como portada exclusiva
    if (data.isCover === true && photo.tripId) {
      // 1. Quitar portada a las anteriores de ese viaje
      await Photo.query()
        .where('trip_id', photo.tripId)
        .patch({ isCover: false });

      // 2. Acoplar al Trip principal (opcional / fallback para old views)
      await Trip.query().findById(photo.tripId).patch({
        coverImage: photo.id
      });
    }

    // Actualizar foto concreta
    return photo.$query().patchAndFetch(data);
  }

  /**
   * Actualiza propiedades (ej. ubicación GPS en metadatos) para múltiples fotos a la vez
   */
  async batchUpdatePhotos(userId: number, photoIds: string[], data: any): Promise<Photo[]> {
    if (!photoIds || !photoIds.length) return [];
    
    const photos = await Photo.query().whereIn('id', photoIds).andWhere('user_id', userId);
    const updatedPhotos = [];
    
    for (const photo of photos) {
      const patchData = { ...data };
      // Si estamos actualizando metadata, unimos con la metadata existente
      if (data.metadata) {
        patchData.metadata = {
          ...(photo.metadata || {}),
          ...data.metadata,
          exif: {
            ...((photo.metadata || {}).exif || {}),
            ...(data.metadata.exif || {})
          }
        };
      }
      const updated = await photo.$query().patchAndFetch(patchData);
      updatedPhotos.push(updated);
    }
    
    return updatedPhotos;
  }

  async deletePhoto(id: string, userId: number): Promise<boolean> {
    const photo = await Photo.query().findOne({ id, userId });
    if (!photo) throw new NotFoundException('Foto no encontrada');

    await photo.$query().delete();
    // Físicamente borrar local file aquí (omitido en MVP standard para prevención)
    return true;
  }

  /**
   * Stream a photo directly to the response, bypassing CORS.
   */
  async streamPhotoImage(id: string, res: Response) {
    const photo = await Photo.query().findById(id);

    if (!photo) {
      throw new NotFoundException('Foto no encontrada');
    }

    if (photo.provider === 'local') {
      const filePath = path.join(process.cwd(), photo.url);
      if (fs.existsSync(filePath)) {
        return fs.createReadStream(filePath).pipe(res);
      } else {
        throw new NotFoundException('Archivo local no encontrado');
      }
    } else if (photo.provider === 'immich') {
      try {
        const integration = await this.integrationsService.getIntegration(photo.userId, 'immich');
        const assetUrl = photo.url; // This should be the direct API URL without CORS proxying on the frontend

        const response = await axios.get(assetUrl, {
          headers: {
            'x-api-key': integration.accessToken,
            'Accept': 'image/*'
          },
          responseType: 'stream'
        });

        // Optional: pipe the precise content type if we have it
        res.set('Content-Type', response.headers['content-type']);
        return response.data.pipe(res);
      } catch (error) {
        console.error('Error proxying Immich image:', error);
        throw new NotFoundException('Error obtaining image from Immich');
      }
    } else {
      throw new NotFoundException('Proveedor de fotos no soportado');
    }
  }
}
