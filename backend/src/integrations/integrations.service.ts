import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { UserIntegration } from '../users/user-integration.entity';

@Injectable()
export class IntegrationsService {
  /**
   * Valida y guarda las credenciales de Immich.
   * Verifica la API Key contra la URL proporcionada probando un endpoint de Immich.
   */
  async setupImmich(userId: number, url: string, apiKey: string): Promise<UserIntegration> {
    // Normalizar URL (quitar slash final y asegurar http/https)
    let baseUrl = url.trim();
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    // Inyectar /api si no la han puesto o lo han puesto mal
    if (!baseUrl.endsWith('/api')) {
      baseUrl = `${baseUrl}/api`;
    }

    try {
      console.log(`${baseUrl}/server/ping`);
      // Validar conexión haciendo ping a /server/ping (Immich standard)
      const response = await axios.get(`${baseUrl}/server/ping`, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        },
        timeout: 5000 // 5s timeout
      });

      if (response.data.res !== 'pong') {
        throw new BadRequestException('El servidor respondió pero no parece ser una instancia de Immich válida.');
      }

      // Validar API key probando el endpoint de información del usuario
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
        throw new BadRequestException('API Key inválida o sin permisos.');
      }
      throw new BadRequestException('No se pudo establecer conexión con el servidor especificado.');
    }

    // Upsert database record
    let integration = await UserIntegration.query().findOne({ userId, provider: 'immich' });

    if (integration) {
      integration = await integration.$query().patchAndFetch({
        url: baseUrl,
        access_token: apiKey
      });
    } else {
      integration = await UserIntegration.query().insert({
        userId,
        provider: 'immich',
        url: baseUrl,
        access_token: apiKey
      });
    }

    return integration;
  }

  /**
   * Obtiene la conexión activa de un usuario para un provider.
   */
  async getIntegration(userId: number, provider: 'immich'): Promise<UserIntegration> {
    const integration = await UserIntegration.query().findOne({ userId, provider });
    if (!integration) {
      throw new NotFoundException(`No hay conexión activa con ${provider}`);
    }
    return integration;
  }

  /**
   * Obtiene los álbumes del usuario desde su servidor de Immich.
   */
  async getImmichAlbums(userId: number): Promise<any[]> {
    const integration = await this.getIntegration(userId, 'immich');

    try {
      const response = await axios.get(`${integration.url}/albums`, {
        headers: { 'x-api-key': integration.access_token }
      });
      return response.data;
    } catch (error) {
      throw new BadRequestException('Error al contactar con Immich para obtener álbumes.');
    }
  }

  /**
   * Obtiene las fotos de un álbum específico de Immich.
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
      throw new BadRequestException('Error al contactar con Immich para obtener las fotos del álbum.');
    }
  }
}
