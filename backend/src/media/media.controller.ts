import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor (private readonly mediaService: MediaService) { }

  @Get('trips/:tripId/photos')
  async getTripPhotos(@Request() req, @Param('tripId') tripId: string) {
    return this.mediaService.getTripPhotos(tripId, req.user.userId);
  }

  @Post('trips/:tripId/photos')
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
  async updatePhoto(
    @Request() req,
    @Param('id') id: string,
    @Body() data: { showOnMap?: boolean; isCover?: boolean }
  ) {
    return this.mediaService.updatePhoto(id, req.user.userId, data);
  }

  @Delete('photos/:id')
  async deletePhoto(@Request() req, @Param('id') id: string) {
    return this.mediaService.deletePhoto(id, req.user.userId);
  }
}
