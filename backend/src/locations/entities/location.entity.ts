import { Model, snakeCaseMappers } from 'objection';
import { User } from '../../users/user.entity';
import { Trip } from '../../trips/entities/trip.entity';
import { Country } from '../../geo/entities/country.entity';
import { Photo } from '../../media/entities/photo.entity';

export interface LocationProperties {
  id: string; // UUID
  tripId?: string;
  userId: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  countryId?: number;
  visitDate?: Date;
  rating?: number; // 1-5
  category: string;
  elevation?: number; // meters
  timezone?: string;
  adminArea1?: string;
  adminArea2?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Location extends Model implements LocationProperties {
  id!: string; // UUID
  tripId?: string;
  userId!: number;
  name!: string;
  description?: string;
  latitude!: number;
  longitude!: number;
  countryId?: number;
  visitDate?: Date;
  rating?: number; // 1-5
  category!: string;
  elevation?: number; // meters
  timezone?: string;
  adminArea1?: string;
  adminArea2?: string;
  createdAt!: Date;
  updatedAt!: Date;

  static get tableName() {
    return 'locations';
  }

  static get idColumn() {
    return 'id';
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id', 'userId', 'name', 'latitude', 'longitude', 'category'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        tripId: { type: ['string', 'null'] },
        userId: { type: 'integer' },
        name: { type: 'string', minLength: 1, maxLength: 200 },
        description: { type: ['string', 'null'], maxLength: 1000 },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        countryId: { type: ['integer', 'null'] },
        visitDate: { type: ['string', 'null'] },
        rating: { type: ['integer', 'null'], minimum: 1, maximum: 5 },
        category: {
          type: 'string',
          enum: ['city', 'landmark', 'nature', 'restaurant', 'accommodation', 'transport', 'activity', 'shopping', 'nightlife', 'cultural'],
          default: 'city'
        },
        elevation: { type: ['number', 'null'] },
        timezone: { type: ['string', 'null'], maxLength: 50 },
        adminArea1: { type: ['string', 'null'], maxLength: 100 },
        adminArea2: { type: ['string', 'null'], maxLength: 100 },
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
          from: 'locations.user_id',
          to: 'users.id'
        }
      },
      trip: {
        relation: Model.BelongsToOneRelation,
        modelClass: Trip,
        join: {
          from: 'locations.trip_id',
          to: 'trips.id'
        }
      },
      country: {
        relation: Model.BelongsToOneRelation,
        modelClass: Country,
        join: {
          from: 'locations.country_id',
          to: 'countries.id'
        }
      },
      photos: {
        relation: Model.HasManyRelation,
        modelClass: Photo,
        join: {
          from: 'locations.id',
          to: 'photos.location_id'
        }
      }
    };
  }

  // Hooks
  async $beforeInsert() {
    await super.$beforeInsert({} as any);
    if (!this.id) {
      // Generate UUID if not provided
      const { v4: uuidv4 } = require('uuid');
      this.id = uuidv4();
    }

    // Country detection is handled by the frontend via Nominatim reverse geocoding.
    // The ST_Contains query does not work with geography columns, so we skip it here.

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async $beforeUpdate() {
    await super.$beforeUpdate({}, {} as any);
    // Country detection is handled by the frontend via Nominatim reverse geocoding.
    this.updatedAt = new Date();
  }

  // Convertir a GeoJSON Feature
  toGeoJSONFeature(): any {
    return {
      type: 'Feature',
      id: this.id,
      geometry: {
        type: 'Point',
        coordinates: [this.longitude, this.latitude],
      },
      properties: {
        id: this.id,
        name: this.name,
        description: this.description,
        rating: this.rating,
        category: this.category,
        visitDate: this.visitDate?.toISOString(),
        countryId: this.countryId,
        countryName: (this as any).country?.name,
        adminArea1: this.adminArea1,
        adminArea2: this.adminArea2
      }
    };
  }

  // Get nearby locations using simple distance calculation (no PostGIS)
  async getNearbyLocations(radiusKm: number = 50): Promise<Location[]> {
    const knex = (this.constructor as any).knex();
    const degreeRadius = radiusKm / 111.320;
    const result = await knex.raw(`
      SELECT *,
        SQRT(POW(latitude - ?, 2) + POW(longitude - ?, 2)) as distance
      FROM locations
      WHERE id != ?
      AND ABS(latitude - ?) < ?
      AND ABS(longitude - ?) < ?
      ORDER BY distance
      LIMIT 10
    `, [
      this.latitude, this.longitude,
      this.id,
      this.latitude, degreeRadius,
      this.longitude, degreeRadius,
    ]);

    return result.rows;
  }

  // Get user location statistics
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

  // Get coordinates as object
  getCoordinates(): { lng: number; lat: number } {
    return {
      lng: this.longitude || 0,
      lat: this.latitude || 0,
    };
  }

  // Set coordinates
  setCoordinates(lng: number, lat: number): void {
    this.longitude = lng;
    this.latitude = lat;
  }

  // Find locations within bounds
  static async findByBounds(
    userId: number,
    bounds: {
      southwest: { lng: number; lat: number };
      northeast: { lng: number; lat: number };
    }
  ): Promise<Location[]> {
    return await Location.query()
      .where('userId', userId)
      .where('latitude', '>=', bounds.southwest.lat)
      .where('latitude', '<=', bounds.northeast.lat)
      .where('longitude', '>=', bounds.southwest.lng)
      .where('longitude', '<=', bounds.northeast.lng)
      .orderBy('visitDate', 'desc');
  }

  // Search locations by text
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