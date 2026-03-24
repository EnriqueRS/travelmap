import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor (private readonly integrationsService: IntegrationsService) { }

  @Post('immich')
  async setupImmich(
    @Request() req,
    @Body('url') url: string,
    @Body('apiKey') apiKey: string
  ) {
    const integration = await this.integrationsService.setupImmich(req.user.userId, url, apiKey);
    return {
      message: 'Conexión con Immich establecida correctamente.',
      provider: integration.provider,
      url: integration.url
    };
  }

  @Get('immich/albums')
  async getAlbums(@Request() req) {
    return this.integrationsService.getImmichAlbums(req.user.userId);
  }

  @Get('immich/albums/:albumId/assets')
  async getAlbumAssets(@Request() req, @Param('albumId') albumId: string) {
    return this.integrationsService.getImmichAlbumAssets(req.user.userId, albumId);
  }

  @Get('status')
  async getStatus(@Request() req) {
    try {
      const integration = await this.integrationsService.getIntegration(req.user.userId, 'immich');
      return { immich: true, url: integration.url };
    } catch {
      return { immich: false };
    }
  }
}
