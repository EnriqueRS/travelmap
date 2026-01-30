// backend/src/locations/entities/location.entity.ts
import { Model } from 'objection';
import { User } from '../../auth/entities/user.entity';
import { Trip } from '../../trips/entities/trip.entity';
import { Country } from '../../geo/entities/country.entity';
import { Photo } from '../../media/entities/photo.entity';

export interface LocationProperties {
  id: string; // UUID
  tripId?: string;
  userId: number;
  name: string;
  description?: string;
  coordinates: any; // PostGIS Point
  countryId?: number;
  visitDate?: Date;
  rating?: number; // 1-5
  category: string;
  elevation?: number; // metros
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Location extends Model implements LocationProperties {
  id!: string; // UUID
  tripId?: string;
  userId!: number;
  name!: string;
  description?: string;
  coordinates!: any; // PostGIS Point
  countryId?: number;
  visitDate?: Date;
  rating?: number; // 1-5
  category!: string;
  elevation?: number; // metros
  timezone?: string;
  createdAt!: Date;
  updatedAt!: Date;

  static get tableName() {
    return 'locations';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id', 'userId', 'name', 'coordinates', 'category'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        tripId: { type: 'string', format: 'uuid' },
        userId: { type: 'integer' },
        name: { type: 'string', minLength: 1, maxLength: 200 },
        description: { type: 'string', maxLength: 1000 },
        coordinates: { type: 'object' }, // PostGIS Point
        countryId: { type: 'integer' },
        visitDate: { type: 'string', format: 'date' },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        category: { 
          type: 'string', 
          enum: ['city', 'landmark', 'nature', 'restaurant', 'accommodation', 'transport', 'activity', 'shopping', 'nightlife', 'cultural'],
          default: 'city'
        },
        elevation: { type: 'number' }, // metros sobre el nivel del mar
        timezone: { type: 'string', maxLength: 50 }, // timezone database
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'locations.userId',
          to: 'users.id'
        }
      },
      trip: {
        relation: Model.BelongsToOneRelation,
        modelClass: Trip,
        join: {
          from: 'locations.tripId',
          to: 'trips.id'
        }
      },
      country: {
        relation: Model.BelongsToOneRelation,
        modelClass: Country,
        join: {
          from: 'locations.countryId',
          to: 'countries.id'
        }
      },
      photos: {
        relation: Model.HasManyRelation,
        modelClass: Photo,
        join: {
          from: 'locations.id',
          to: 'photos.locationId'
        }
      }
    };
  }

  // Hooks
  async $beforeInsert() {
    await super.$beforeInsert({} as any);
    if (!this.id) {
      // Generar UUID si no existe
      const { v4: uuidv4 } = require('uuid');
      this.id = uuidv4();
    }
    
    // Determinar país automáticamente si no está establecido
    if (this.coordinates && !this.countryId) {
      await this.determineCountry();
    }
    
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async $beforeUpdate() {
    await super.$beforeUpdate({}, {} as any);
    // Determinar país si las coordenadas cambiaron
    if (this.coordinates && !this.countryId) {
      await this.determineCountry();
    }
    this.updatedAt = new Date();
  }

  // Método para determinar el país basado en coordenadas
  private async determineCountry(): Promise<void> {
    const knex = (this.constructor as any).knex();
    const result = await knex.raw(`
      SELECT id 
      FROM countries 
      WHERE ST_Contains(geometry, ST_SetSRID(ST_MakePoint(?, ?), 4326))
      LIMIT 1
    `, [
      this.coordinates.coordinates[0], // longitude
      this.coordinates.coordinates[1]  // latitude
    ]);

    if (result.rows.length > 0) {
      this.countryId = result.rows[0].id;
    }
  }

  // Convertir a GeoJSON Feature
  toGeoJSONFeature(): any {
    return {
      type: 'Feature',
      id: this.id,
      geometry: this.coordinates,
      properties: {
        id: this.id,
        name: this.name,
        description: this.description,
        rating: this.rating,
        category: this.category,
        visitDate: this.visitDate?.toISOString(),
        countryId: this.countryId,
        countryName: (this as any).country?.name
      }
    };
  }

  // Método para obtener ubicaciones cercanas
  async getNearbyLocations(radiusKm: number = 50): Promise<Location[]> {
    const knex = (this.constructor as any).knex();
    const result = await knex.raw(`
      SELECT *,
      ST_Distance(
        coordinates,
        ST_SetSRID(ST_MakePoint(?, ?), 4326)
      ) as distance
      FROM locations
      WHERE id != ?
      AND ST_DWithin(
        coordinates,
        ST_SetSRID(ST_MakePoint(?, ?), 4326),
        ?
      )
      ORDER BY distance
      LIMIT 10
    `, [
      this.coordinates.coordinates[0],
      this.coordinates.coordinates[1],
      this.id,
      this.coordinates.coordinates[0],
      this.coordinates.coordinates[1],
      radiusKm / 111.320 // Convertir km a grados (aproximado)
    ]);

    return result.rows;
  }

  // Método para obtener estadísticas del usuario en esta ubicación
  async getUserLocationStats(): Promise<any> {
    const [sameCategoryCount, sameCountryCount] = await Promise.all([
      Location.query()
        .where('userId', this.userId)
        .where('category', this.category)
        .count('* as count')
        .first(),
      
      Location.query()
        .where('userId', this.userId)
        .where('countryId', this.countryId)
        .count('* as count')
        .first()
    ]);

    return {
      sameCategoryLocations: parseInt((sameCategoryCount as any)?.count || '0'),
      sameCountryLocations: parseInt((sameCountryCount as any)?.count || '0'),
      isFirstInCountry: parseInt((sameCountryCount as any)?.count || '0') === 1
    };
  }

  // Método para obtener coordenadas como objeto
  getCoordinates(): { lng: number; lat: number } {
    if (!this.coordinates || !this.coordinates.coordinates) {
      return { lng: 0, lat: 0 };
    }
    
    return {
      lng: this.coordinates.coordinates[0],
      lat: this.coordinates.coordinates[1]
    };
  }

  // Método para establecer coordenadas desde objetos
  setCoordinates(lng: number, lat: number): void {
    this.coordinates = {
      type: 'Point',
      coordinates: [lng, lat]
    };
  }

  // Método estático para buscar ubicaciones por bounds
  static async findByBounds(
    userId: number,
    bounds: { 
      southwest: { lng: number; lat: number };
      northeast: { lng: number; lat: number };
    }
  ): Promise<Location[]> {
    const result = await this.knex().raw(`
      SELECT * FROM locations
      WHERE userId = ?
      AND ST_Within(
        coordinates,
        ST_MakeEnvelope(?, ?, ?, ?, 4326)
      )
      ORDER BY visitDate DESC
    `, [
      userId,
      bounds.southwest.lng,
      bounds.southwest.lat,
      bounds.northeast.lng,
      bounds.northeast.lat
    ]);

    return result.rows;
  }

  // Método estático para búsqueda por texto y ubicación
  static async search(
    userId: number,
    query: string,
    limit: number = 20
  ): Promise<Location[]> {
    return await Location.query()
      .where('userId', userId)
      .where('name', 'ilike', `%${query}%`)
      .orWhere('description', 'ilike', `%${query}%`)
      .withGraphFetched('country')
      .limit(limit)
      .orderBy('visitDate', 'desc');
  }
}