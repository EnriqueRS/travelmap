import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { UserIntegration } from '../users/user-integration.entity';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  /**
   * Validates and stores Immich credentials.
   * Verifies the API Key against the provided URL by testing an Immich endpoint.
   */
  async setupImmich(userId: number, url: string, apiKey: string): Promise<UserIntegration> {
    // Normalize URL (remove trailing slash and ensure http/https)
    let baseUrl = url.trim();
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    // Inject /api if not provided or incorrectly provided
    if (!baseUrl.endsWith('/api')) {
      baseUrl = `${baseUrl}/api`;
    }

    try {
      // Validate connection by pinging /server/ping (Immich standard)
      const response = await axios.get(`${baseUrl}/server/ping`, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 5000 // 5s timeout
      });

      if (response.data.res !== 'pong') {
        throw new BadRequestException('Server response was not "pong"');
      }

      // Validate API key by checking user info
      await axios.get(`${baseUrl}/users/me`, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        }
      });

    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;

      this.logger.error(`Immich validation error: ${error.message}`);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new BadRequestException('API Key is invalid or without permissions.');
      }
      throw new BadRequestException('Could not establish connection with the specified server.');
    }

    this.logger.debug(`Immich connection validated successfully for user ${userId}`);
    // Upsert database record
    let integration = await UserIntegration.query().findOne({ user_id: userId, provider: 'immich' });

    if (integration) {
      integration = await integration.$query().patchAndFetch({
        url: baseUrl,
        accessToken: apiKey
      });
      this.logger.debug(`Updated Immich integration for user ${userId}`);
    } else {
      this.logger.debug(`Creating new Immich integration for user ${userId}`);
      const { v4: uuidv4 } = require('uuid');
      integration = await UserIntegration.query().insert({
        id: uuidv4(),
        userId,
        provider: 'immich',
        url: baseUrl,
        accessToken: apiKey
      });
      this.logger.debug(`Created Immich integration for user ${userId}`);
    }

    return integration;
  }

  /**
   * Get active connection for a user and provider.
   */
  async getIntegration(userId: number, provider: 'immich' | 'instagram'): Promise<UserIntegration> {
    const integration = await UserIntegration.query().findOne({ user_id: userId, provider });
    if (!integration) {
      throw new NotFoundException(`No connection found for ${provider}`);
    }
    return integration;
  }

  /**
   * Get albums from Immich.
   */
  async getImmichAlbums(userId: number): Promise<any[]> {
    const integration = await this.getIntegration(userId, 'immich');

    try {
      const response = await axios.get(`${integration.url}/albums`, {
        headers: { 'x-api-key': integration.accessToken }
      });
      return response.data;
    } catch (error) {
      throw new BadRequestException('Could not contact Immich to get albums.');
    }
  }

  /**
   * Get album assets from Immich.
   */
  async getImmichAlbumAssets(userId: number, albumId: string): Promise<any[]> {
    const integration = await this.getIntegration(userId, 'immich');

    try {
      // In Immich, we get the album which contains its assets
      const response = await axios.get(`${integration.url}/albums/${albumId}`, {
        headers: { 'x-api-key': integration.accessToken }
      });
      return response.data.assets || [];
    } catch (error) {
      throw new BadRequestException('Could not contact Immich to get album assets.');
    }
  }

  // ─── Instagram Integration ───────────────────────────────────────────────────

  /**
   * Returns the Instagram OAuth authorization URL for the user to grant access.
   */
  getInstagramAuthUrl(): string {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new BadRequestException('Instagram integration is not configured on this server.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code',
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Handles the Instagram OAuth callback: exchanges the code for tokens and stores them.
   */
  async handleInstagramCallback(userId: number, code: string): Promise<UserIntegration> {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Instagram integration is not configured on this server.');
    }

    // Step 1: Exchange code for short-lived access token
    let shortLivedToken: string;
    let instagramUserId: string;

    try {
      const formData = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      });

      const tokenResponse = await axios.post(
        'https://api.instagram.com/oauth/access_token',
        formData.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000,
        }
      );

      shortLivedToken = tokenResponse.data.access_token;
      instagramUserId = String(tokenResponse.data.user_id);
    } catch (error: any) {
      this.logger.error(`Instagram token exchange error: ${error.message}`);
      throw new BadRequestException('Failed to exchange Instagram authorization code. It may have expired.');
    }

    // Step 2: Exchange short-lived token for long-lived token (60 days)
    let longLivedToken: string;
    let expiresIn: number;

    try {
      const longLivedResponse = await axios.get('https://graph.instagram.com/access_token', {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: clientSecret,
          access_token: shortLivedToken,
        },
        timeout: 10000,
      });

      longLivedToken = longLivedResponse.data.access_token;
      expiresIn = longLivedResponse.data.expires_in; // seconds (typically 5184000 = 60 days)
    } catch (error: any) {
      this.logger.error(`Instagram long-lived token exchange error: ${error.message}`);
      throw new BadRequestException('Failed to obtain long-lived Instagram token.');
    }

    // Calculate token expiration date
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Upsert database record
    let integration = await UserIntegration.query().findOne({ user_id: userId, provider: 'instagram' });

    if (integration) {
      integration = await integration.$query().patchAndFetch({
        accessToken: longLivedToken,
        providerUserId: instagramUserId,
        tokenExpiresAt,
      });
      this.logger.debug(`Updated Instagram integration for user ${userId}`);
    } else {
      const { v4: uuidv4 } = require('uuid');
      integration = await UserIntegration.query().insert({
        id: uuidv4(),
        userId,
        provider: 'instagram',
        accessToken: longLivedToken,
        providerUserId: instagramUserId,
        tokenExpiresAt,
      });
      this.logger.debug(`Created Instagram integration for user ${userId}`);
    }

    return integration;
  }

  /**
   * Refreshes the Instagram long-lived token (must be done before it expires).
   */
  async refreshInstagramToken(userId: number): Promise<UserIntegration> {
    const integration = await this.getIntegration(userId, 'instagram');

    try {
      const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: integration.accessToken,
        },
        timeout: 10000,
      });

      const newToken = response.data.access_token;
      const expiresIn = response.data.expires_in;
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      const updated = await integration.$query().patchAndFetch({
        accessToken: newToken,
        tokenExpiresAt,
      });

      this.logger.debug(`Refreshed Instagram token for user ${userId}`);
      return updated;
    } catch (error: any) {
      this.logger.error(`Instagram token refresh error: ${error.message}`);
      throw new BadRequestException('Failed to refresh Instagram token. You may need to reconnect.');
    }
  }

  /**
   * Fetches recent media from the user's Instagram account.
   */
  async getInstagramMedia(userId: number): Promise<any[]> {
    const integration = await this.getIntegration(userId, 'instagram');

    // Check if token might be expired
    if (integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < new Date()) {
      throw new BadRequestException('Instagram token has expired. Please refresh or reconnect.');
    }

    try {
      const response = await axios.get('https://graph.instagram.com/me/media', {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink',
          access_token: integration.accessToken,
          limit: 50,
        },
        timeout: 15000,
      });

      return response.data.data || [];
    } catch (error: any) {
      this.logger.error(`Instagram media fetch error: ${error.message}`);
      if (error.response?.status === 401 || error.response?.status === 190) {
        throw new BadRequestException('Instagram token is invalid. Please reconnect your account.');
      }
      throw new BadRequestException('Could not fetch media from Instagram.');
    }
  }

  /**
   * Disconnects the Instagram integration for a user.
   */
  async disconnectInstagram(userId: number): Promise<void> {
    const integration = await UserIntegration.query().findOne({ user_id: userId, provider: 'instagram' });

    if (!integration) {
      throw new NotFoundException('No Instagram connection found.');
    }

    await integration.$query().delete();
    this.logger.debug(`Disconnected Instagram for user ${userId}`);
  }
}
