import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { UserIntegration } from '../users/user-integration.entity';

@Injectable()
export class IntegrationsService {
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

      console.error('Immich Validation Error:', error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new BadRequestException('API Key is invalid or without permissions.');
      }
      throw new BadRequestException('Could not establish connection with the specified server.');
    }

    console.log('Immich connection validated successfully.');
    // Upsert database record
    let integration = await UserIntegration.query().findOne({ userId, provider: 'immich' });

    if (integration) {
      integration = await integration.$query().patchAndFetch({
        url: baseUrl,
        access_token: apiKey
      });
    } else {
      console.log('Immich integration not found, creating new one.');
      const { v4: uuidv4 } = require('uuid');
      integration = await UserIntegration.query().insert({
        id: uuidv4(),
        userId,
        provider: 'immich',
        url: baseUrl,
        access_token: apiKey
      });
    }

    return integration;
  }

  /**
   * Get active connection for a user and provider.
   */
  async getIntegration(userId: number, provider: 'immich'): Promise<UserIntegration> {
    const integration = await UserIntegration.query().findOne({ userId, provider });
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
        headers: { 'x-api-key': integration.access_token }
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
        headers: { 'x-api-key': integration.access_token }
      });
      return response.data.assets || [];
    } catch (error) {
      throw new BadRequestException('Could not contact Immich to get album assets.');
    }
  }
}
