import { Injectable, NotFoundException } from '@nestjs/common';
import { Photo } from './entities/photo.entity';
import { Trip } from '../trips/entities/trip.entity';
import * as path from 'path';

@Injectable()
export class MediaService {
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
      .where({ tripId, userId })
      .orderBy('created_at', 'desc');
  }

  /**
   * Modifica propiedades lógicas de la foto (si se muestra en mapa o es la portada)
   */
  async updatePhoto(id: string, userId: number, data: { showOnMap?: boolean, isCover?: boolean, isHidden?: boolean }): Promise<Photo> {
    const photo = await Photo.query().findOne({ id, userId });

    if (!photo) {
      throw new NotFoundException('Foto no encontrada');
    }

    // Si tratamos de establecerla como portada exclusiva
    if (data.isCover === true && photo.tripId) {
      // 1. Quitar portada a las anteriores de ese viaje
      await Photo.query()
        .where('tripId', photo.tripId)
        .patch({ isCover: false });

      // 2. Acoplar al Trip principal (opcional / fallback para old views)
      await Trip.query().findById(photo.tripId).patch({
        coverImage: photo.url
      });
    }

    // Actualizar foto concreta
    return photo.$query().patchAndFetch(data);
  }

  async deletePhoto(id: string, userId: number): Promise<boolean> {
    const photo = await Photo.query().findOne({ id, userId });
    if (!photo) throw new NotFoundException('Foto no encontrada');

    await photo.$query().delete();
    // Físicamente borrar local file aquí (omitido en MVP standard para prevención)
    return true;
  }
}
