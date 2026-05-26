import { Controller, Post, Get, Delete, Body, UseGuards, Request, Param, Logger, BadRequestException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor (private readonly integrationsService: IntegrationsService) { }

  // ─── Immich ─────────────────────────────────────────────────────────────────

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

  // ─── Instagram ──────────────────────────────────────────────────────────────

  @Get('instagram/auth-url')
  async getInstagramAuthUrl(@Request() req) {
    this.logger.debug(`Getting Instagram auth URL for user ${req.user.userId}`);
    const url = this.integrationsService.getInstagramAuthUrl();
    return { url };
  }

  @Post('instagram/callback')
  async handleInstagramCallback(
    @Request() req,
    @Body('code') code: string
  ) {
    this.logger.debug(`Handling Instagram callback for user ${req.user.userId}`);
    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }
    const integration = await this.integrationsService.handleInstagramCallback(req.user.userId, code);
    return {
      message: 'Instagram connected successfully.',
      provider: integration.provider,
      providerUserId: integration.providerUserId,
    };
  }

  @Post('instagram/refresh')
  async refreshInstagramToken(@Request() req) {
    this.logger.debug(`Refreshing Instagram token for user ${req.user.userId}`);
    const integration = await this.integrationsService.refreshInstagramToken(req.user.userId);
    return {
      message: 'Instagram token refreshed successfully.',
      tokenExpiresAt: integration.tokenExpiresAt,
    };
  }

  @Get('instagram/media')
  async getInstagramMedia(@Request() req) {
    this.logger.debug(`Fetching Instagram media for user ${req.user.userId}`);
    return this.integrationsService.getInstagramMedia(req.user.userId);
  }

  @Delete('instagram')
  async disconnectInstagram(@Request() req) {
    this.logger.debug(`Disconnecting Instagram for user ${req.user.userId}`);
    await this.integrationsService.disconnectInstagram(req.user.userId);
    return { message: 'Instagram disconnected successfully.' };
  }

  // ─── Status ─────────────────────────────────────────────────────────────────

  @Get('status')
  async getStatus(@Request() req) {
    this.logger.debug(`Checking integration status for user ${req.user.userId}`);
    const status: any = { immich: false, instagram: false };

    try {
      const immich = await this.integrationsService.getIntegration(req.user.userId, 'immich');
      status.immich = true;
      status.url = immich.url;
    } catch {
      // Immich not connected
    }

    try {
      const instagram = await this.integrationsService.getIntegration(req.user.userId, 'instagram');
      status.instagram = true;
      status.instagramUserId = instagram.providerUserId;
    } catch {
      // Instagram not connected
    }

    return status;
  }
}
