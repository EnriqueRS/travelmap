import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Request, UseInterceptors, UploadedFiles, BadRequestException, Res, NotFoundException, Logger } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor (private readonly mediaService: MediaService) { }

  @Get('map')
  @UseGuards(JwtAuthGuard)
  async getMapPhotos(@Request() req) {
    this.logger.debug(`Fetching map photos for user ${req.user.userId}`);
    return this.mediaService.getMapPhotos(req.user.userId);
  }

  @Get('trips/:tripId/photos')
  @UseGuards(JwtAuthGuard)
  async getTripPhotos(@Request() req, @Param('tripId') tripId: string) {
    this.logger.debug(`Fetching photos for trip ${tripId}, user ${req.user.userId}`);
    return this.mediaService.getTripPhotos(tripId, req.user.userId);
  }

  @Post('trips/:tripId/photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('file', 25)) // max 25 archivos
  async uploadPhoto(
    @Request() req,
    @Param('tripId') tripId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any // for external cases
  ) {
    this.logger.debug(`Uploading ${files?.length || 0} photos for trip ${tripId}, user ${req.user.userId}`);

    // Caso 1: Archivos locales múltiples
    if (files && files.length > 0) {
      const photos = await this.mediaService.addLocalPhotos(tripId, req.user.userId, files);
      return photos; // Devolvemos array de fotos
    }

    // Caso 2: Foto externa (Immich) - mantiene compatibilidad
    if (body.provider === 'immich' && body.url && body.externalId) {
      return this.mediaService.addExternalPhoto(tripId, req.user.userId, body);
    }

    throw new BadRequestException('Se requiere al menos un archivo local o datos de un proveedor externo.');
  }

  @Patch('batch/photos')
  @UseGuards(JwtAuthGuard)
  async batchUpdatePhotos(
    @Request() req,
    @Body() body: { photoIds: string[]; data: any }
  ) {
    this.logger.debug(`Batch updating ${body.photoIds?.length || 0} photos for user ${req.user.userId}`);
    return this.mediaService.batchUpdatePhotos(req.user.userId, body.photoIds, body.data);
  }

  @Patch('photos/:id')
  @UseGuards(JwtAuthGuard)
  async updatePhoto(
    @Request() req,
    @Param('id') id: string,
    @Body() data: { showOnMap?: boolean; isCover?: boolean; isHidden?: boolean; metadata?: any }
  ) {
    this.logger.debug(`Updating photo ${id} for user ${req.user.userId}`);
    return this.mediaService.updatePhoto(id, req.user.userId, data);
  }

  @Delete('photos/:id')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(@Request() req, @Param('id') id: string) {
    this.logger.debug(`Deleting photo ${id} for user ${req.user.userId}`);
    return this.mediaService.deletePhoto(id, req.user.userId);
  }

  @Get('photos/:id/image')
  async getPhotoImage(@Param('id') id: string, @Res() res: Response) {
    this.logger.debug(`Streaming photo image: ${id}`);
    try {
      await this.mediaService.streamPhotoImage(id, res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Error interno del servidor al procesar la imagen' });
      }
    }
  }
}
