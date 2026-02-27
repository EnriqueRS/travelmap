import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, Res, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('media')
export class MediaController {
  constructor (private readonly mediaService: MediaService) { }

  @Get('map')
  @UseGuards(JwtAuthGuard)
  async getMapPhotos(@Request() req) {
    return this.mediaService.getMapPhotos(req.user.userId);
  }

  @Get('trips/:tripId/photos')
  @UseGuards(JwtAuthGuard)
  async getTripPhotos(@Request() req, @Param('tripId') tripId: string) {
    return this.mediaService.getTripPhotos(tripId, req.user.userId);
  }

  @Post('trips/:tripId/photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Request() req,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any // for external cases
  ) {
    if (file) {
      return this.mediaService.addLocalPhoto(tripId, req.user.userId, file);
    }

    if (body.provider === 'immich' && body.url && body.externalId) {
      return this.mediaService.addExternalPhoto(tripId, req.user.userId, body);
    }

    throw new BadRequestException('Se requiere un archivo local o datos de un proveedor externo.');
  }

  @Patch('photos/:id')
  @UseGuards(JwtAuthGuard)
  async updatePhoto(
    @Request() req,
    @Param('id') id: string,
    @Body() data: { showOnMap?: boolean; isCover?: boolean; isHidden?: boolean; metadata?: any }
  ) {
    return this.mediaService.updatePhoto(id, req.user.userId, data);
  }

  @Delete('photos/:id')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(@Request() req, @Param('id') id: string) {
    return this.mediaService.deletePhoto(id, req.user.userId);
  }

  @Get('photos/:id/image')
  async getPhotoImage(@Param('id') id: string, @Res() res: Response) {
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
