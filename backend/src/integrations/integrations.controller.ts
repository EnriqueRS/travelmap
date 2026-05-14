import { Controller, Post, Get, Body, UseGuards, Request, Param, Logger } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor (private readonly integrationsService: IntegrationsService) { }

  @Post('immich')
  async setupImmich(
    @Request() req,
    @Body('url') url: string,
    @Body('apiKey') apiKey: string
  ) {
    this.logger.debug(`Setting up Immich integration for user ${req.user.userId}`);
    const integration = await this.integrationsService.setupImmich(req.user.userId, url, apiKey);
    return {
      message: 'Conexión con Immich establecida correctamente.',
      provider: integration.provider,
      url: integration.url
    };
  }

  @Get('immich/albums')
  async getAlbums(@Request() req) {
    this.logger.debug(`Fetching Immich albums for user ${req.user.userId}`);
    return this.integrationsService.getImmichAlbums(req.user.userId);
  }

  @Get('immich/albums/:albumId/assets')
  async getAlbumAssets(@Request() req, @Param('albumId') albumId: string) {
    this.logger.debug(`Fetching Immich album ${albumId} assets for user ${req.user.userId}`);
    return this.integrationsService.getImmichAlbumAssets(req.user.userId, albumId);
  }

  @Get('status')
  async getStatus(@Request() req) {
    this.logger.debug(`Checking integration status for user ${req.user.userId}`);
    try {
      const integration = await this.integrationsService.getIntegration(req.user.userId, 'immich');
      return { immich: true, url: integration.url };
    } catch {
      return { immich: false };
    }
  }
}
