// backend/src/geo/geo.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { Country } from './entities/country.entity';
import { UserCountryStatus } from './entities/user-country-status.entity';
import { Location } from '../locations/entities/location.entity';
import { CountriesGeoJSONResponse, UserCountriesResponse } from './dto/geo-response.dto';
import { KNEX_CONNECTION } from '../database/database.module';

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  constructor(@Inject(KNEX_CONNECTION) private knex: Knex) {}

  /**
   * Obtiene todos los países como GeoJSON con el estado del usuario
   */
  async getCountriesGeoJSON(userId?: number): Promise<CountriesGeoJSONResponse> {
    this.logger.debug(`Fetching countries GeoJSON${userId ? ` for user ${userId}` : ''}`);
    let query = `
      SELECT 
        c.*,
        COALESCE(ucs.status, 'default') as status
      FROM countries c
      LEFT JOIN user_country_statuses ucs ON c.id = ucs.country_id AND ucs.user_id = ?
      ORDER BY c.name
    `;

    const params = userId ? [userId] : [null];
    const countries = await this.knex.raw(query, params);

    const features = countries.rows.map((country: any) => {
      // Convertir geometría PostGIS a GeoJSON
      let geometry = country.geometry;
      if (typeof geometry === 'string') {
        geometry = JSON.parse(geometry);
      }

      return {
        type: 'Feature',
        id: country.iso_alpha2,
        geometry,
        properties: {
          isoAlpha2: country.iso_alpha2,
          isoAlpha3: country.iso_alpha3,
          name: country.name,
          continent: country.continent,
          capital: country.capital,
          population: country.population,
          areaSqKm: country.area_sq_km,
          status: country.status
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Obtiene los países del usuario agrupados por estado
   */
  async getUserCountries(userId: number): Promise<UserCountriesResponse> {
    const result = await this.knex.raw(`
      SELECT 
        status,
        JSON_AGG(c.iso_alpha2) as countries
      FROM user_country_statuses ucs
      JOIN countries c ON ucs.country_id = c.id
      WHERE ucs.user_id = ?
      GROUP BY status
    `, [userId]);

    const response: UserCountriesResponse = {
      visited: [],
      planned: [],
      wishlist: []
    };

    result.rows.forEach((row: any) => {
      if (row.countries) {
        response[row.status] = row.countries;
      }
    });

    this.logger.debug(`User ${userId} countries: visited=${response.visited.length}, planned=${response.planned.length}, wishlist=${response.wishlist.length}`);
    return response;
  }

  /**
   * Actualiza el estado de un país para un usuario
   */
  async updateCountryStatus(
    userId: number, 
    countryCode: string, 
    status: 'visited' | 'planned' | 'wishlist',
    visitDate?: Date,
    notes?: string
  ): Promise<void> {
    // Obtener ID del país
    const country = await this.knex('countries')
      .where('iso_alpha2', countryCode)
      .first();

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    // Eliminar estado anterior si existe
    await this.knex('user_country_statuses')
      .where({
        user_id: userId,
        country_id: country.id
      })
      .del();

    // Crear nuevo estado
    await this.knex('user_country_statuses').insert({
      user_id: userId,
      country_id: country.id,
      status,
      visit_date: visitDate || (status === 'visited' ? new Date() : null),
      notes,
      created_at: new Date(),
      updated_at: new Date()
    });

    this.logger.debug(`Country status updated: ${countryCode} -> ${status} for user ${userId}`);

    // Actualizar estadísticas del usuario
    await this.updateUserStatistics(userId);
  }

  /**
   * Obtiene países cercanos a un punto
   */
  async getNearbyCountries(
    lng: number, 
    lat: number, 
    radiusKm: number = 500
  ): Promise<any[]> {
    const result = await this.knex.raw(`
      SELECT 
        c.*,
        ST_Distance(
          c.geometry,
          ST_SetSRID(ST_MakePoint(?, ?), 4326)
        ) as distance
      FROM countries c
      WHERE ST_DWithin(
        c.geometry,
        ST_SetSRID(ST_MakePoint(?, ?), 4326),
        ?
      )
      ORDER BY distance
      LIMIT 20
    `, [lng, lat, lng, lat, radiusKm / 111.320]);

    return result.rows.map((country: any) => ({
      ...country,
      isoAlpha2: country.iso_alpha2,
      isoAlpha3: country.iso_alpha3,
      areaSqKm: country.area_sq_km,
      distanceKm: Math.round(country.distance * 111320 * 100) / 100
    }));
  }

  /**
   * Obtiene estadísticas de países por continente
   */
  async getCountriesByContinent(): Promise<any[]> {
    const result = await this.knex.raw(`
      SELECT 
        continent,
        COUNT(*) as country_count,
        AVG(area_sq_km) as avg_area,
        SUM(population) as total_population
      FROM countries
      WHERE continent IS NOT NULL
      GROUP BY continent
      ORDER BY country_count DESC
    `);

    return result.rows.map((row: any) => ({
      continent: row.continent,
      countryCount: parseInt(row.country_count),
      avgAreaSqKm: Math.round(row.avg_area || 0),
      totalPopulation: parseInt(row.total_population || 0)
    }));
  }

  /**
   * Obtiene estadísticas geográficas del usuario
   */
  async getUserGeographicStats(userId: number): Promise<any> {
    // Países visitados por continente
    const visitedByContinent = await this.knex.raw(`
      SELECT 
        c.continent,
        COUNT(*) as count
      FROM user_country_statuses ucs
      JOIN countries c ON ucs.country_id = c.id
      WHERE ucs.user_id = ? AND ucs.status = 'visited'
      GROUP BY c.continent
      ORDER BY count DESC
    `, [userId]);

    // Estadísticas básicas
    const [countriesVisited, totalLocations] = await Promise.all([
      this.knex('user_country_statuses')
        .where({ user_id: userId, status: 'visited' })
        .count('* as count')
        .first(),
      
      this.knex('locations')
        .where({ user_id: userId })
        .count('* as count')
        .first()
    ]);

    // Centroide de todas las ubicaciones del usuario
    const centroid = await this.knex.raw(`
      SELECT 
        ST_X(ST_Centroid(ST_Collect(coordinates))) as lng,
        ST_Y(ST_Centroid(ST_Collect(coordinates))) as lat
      FROM locations
      WHERE user_id = ? AND coordinates IS NOT NULL
    `, [userId]);

    // Distancia total viajada
    const totalDistance = await this.calculateTotalTravelDistance(userId);

    return {
      visitedByContinent: visitedByContinent.rows,
      totalDistanceKm: Math.round(totalDistance * 100) / 100,
      centroid: centroid.rows[0] || { lng: 0, lat: 0 },
      totalLocations: parseInt((totalLocations?.count || '0') as string),
      countriesVisited: parseInt((countriesVisited?.count || '0') as string)
    };
  }

  /**
   * Busca países por nombre o código
   */
  async searchCountries(query: string, limit: number = 10): Promise<any[]> {
    const result = await this.knex.raw(`
      SELECT 
        id,
        iso_alpha2 as "isoAlpha2",
        iso_alpha3 as "isoAlpha3",
        name,
        continent,
        capital,
        population
      FROM countries
      WHERE 
        LOWER(name) LIKE LOWER(?) OR
        LOWER(iso_alpha2) LIKE LOWER(?) OR
        LOWER(iso_alpha3) LIKE LOWER(?)
      ORDER BY 
        CASE 
          WHEN LOWER(name) LIKE LOWER(?) THEN 1
          WHEN LOWER(iso_alpha2) LIKE LOWER(?) THEN 2
          ELSE 3
        END,
        population DESC
      LIMIT ?
    `, [
      `%${query}%`, `%${query}%`, `%${query}%`,
      `${query}%`, `${query}%`,
      limit
    ]);

    return result.rows;
  }

  /**
   * Calcula la distancia total viajada por un usuario
   */
  private async calculateTotalTravelDistance(userId: number): Promise<number> {
    const result = await this.knex.raw(`
      WITH ordered_locations AS (
        SELECT 
          coordinates,
          ROW_NUMBER() OVER (ORDER BY visit_date ASC NULLS LAST, created_at ASC) as rn
        FROM locations
        WHERE user_id = ? AND coordinates IS NOT NULL
      )
      SELECT COALESCE(SUM(distance), 0) as total_distance
      FROM (
        SELECT 
          ST_Distance(
            l1.coordinates,
            l2.coordinates
          ) as distance
        FROM ordered_locations l1
        JOIN ordered_locations l2 ON l1.rn = l2.rn - 1
      ) distances
    `, [userId]);

    const totalDistanceDegrees = parseFloat(result.rows[0]?.total_distance || '0');
    return totalDistanceDegrees * 111320; // Convertir a kilómetros
  }

  /**
   * Actualiza las estadísticas del usuario
   */
  private async updateUserStatistics(userId: number): Promise<void> {
    const [countriesVisited, totalLocations, totalTrips] = await Promise.all([
      this.knex('user_country_statuses')
        .where({ user_id: userId, status: 'visited' })
        .countDistinct('country_id as count')
        .first(),

      this.knex('locations')
        .where({ user_id: userId })
        .count('* as count')
        .first(),

      this.knex('trips')
        .where({ user_id: userId, status: 'completed' })
        .count('* as count')
        .first()
    ]);

    await this.knex('user_statistics')
      .insert({
        user_id: userId,
        countries_visited: parseInt((countriesVisited?.count || '0') as string),
        total_locations: parseInt((totalLocations?.count || '0') as string),
        total_trips: parseInt((totalTrips?.count || '0') as string),
        last_calculated: new Date()
      })
      .onConflict('user_id')
      .merge();
  }
}