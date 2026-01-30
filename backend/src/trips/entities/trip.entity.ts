// backend/src/trips/entities/trip.entity.ts
import { Model } from 'objection';
import { User } from '../../users/user.entity';
import { Location } from '../../locations/entities/location.entity';
import { Photo } from '../../media/entities/photo.entity';
import { ItineraryDay } from '../../itinerary/entities/itinerary-day.entity';

export interface TripProperties {
  id: string; // UUID
  userId: number;
  title: string;
  description?: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  totalCost?: number;
  currency: string;
  isPublic: boolean;
  coverImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Trip extends Model implements TripProperties {
  id!: string; // UUID
  userId!: number;
  title!: string;
  description?: string;
  status!: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  totalCost?: number;
  currency!: string;
  isPublic!: boolean;
  coverImageUrl?: string;
  createdAt!: Date;
  updatedAt!: Date;

  static get tableName() {
    return 'trips';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id', 'userId', 'title', 'status', 'currency'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'integer' },
        title: { type: 'string', minLength: 1, maxLength: 200 },
        description: { type: 'string', maxLength: 2000 },
        status: {
          type: 'string',
          enum: ['planned', 'ongoing', 'completed', 'cancelled'],
          default: 'planned'
        },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        totalCost: { type: 'number', minimum: 0 },
        currency: { type: 'string', minLength: 3, maxLength: 3, default: 'USD' },
        isPublic: { type: 'boolean', default: false },
        coverImageUrl: { type: 'string', maxLength: 500 },
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
          from: 'trips.userId',
          to: 'users.id'
        }
      },
      locations: {
        relation: Model.HasManyRelation,
        modelClass: Location,
        join: {
          from: 'trips.id',
          to: 'locations.tripId'
        }
      },
      photos: {
        relation: Model.HasManyRelation,
        modelClass: Photo,
        join: {
          from: 'trips.id',
          to: 'photos.tripId'
        }
      },
      itineraryDays: {
        relation: Model.HasManyRelation,
        modelClass: ItineraryDay,
        join: {
          from: 'trips.id',
          to: 'itinerary_days.tripId'
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
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async $beforeUpdate() {
    await super.$beforeUpdate({}, {} as any);
    this.updatedAt = new Date();
  }

  // Método para obtener duración en días
  get durationInDays(): number {
    if (!this.startDate || !this.endDate) return 0;
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // Método para verificar si el viaje está en curso
  get isOngoing(): boolean {
    if (!this.startDate || !this.endDate) return false;
    const now = new Date();
    return now >= new Date(this.startDate) && now <= new Date(this.endDate);
  }

  // Método para obtener el número de países visitados en este viaje
  async getUniqueCountriesCount(): Promise<number> {
    const Location = require('../locations/entities/location.entity').Location;

    const result = await Location.query()
      .where('tripId', this.id)
      .whereNotNull('countryId')
      .distinct('countryId')
      .count('countryId as count')
      .first();

    return parseInt(result?.count || '0');
  }

  // Método para obtener todas las ubicaciones con país
  async getLocationsWithCountry(): Promise<Array<Location & { countryName?: string }>> {
    return await Location.query()
      .where('tripId', this.id)
      .leftJoin('countries', 'locations.countryId', 'countries.id')
      .select(
        'locations.*',
        'countries.name as countryName'
      )
      .orderBy('locations.visitDate', 'asc');
  }

  // Método para obtener resumen del viaje
  async getSummary(): Promise<any> {
    const [locationsCount, photosCount, countriesCount, totalDistance] = await Promise.all([
      Location.query().where('tripId', this.id).count('* as count').first(),
      Photo.query().where('tripId', this.id).count('* as count').first(),
      this.getUniqueCountriesCount(),
      this.calculateTotalDistance()
    ]);

    return {
      locationsCount: parseInt((locationsCount as any)?.count || '0'),
      photosCount: parseInt((photosCount as any)?.count || '0'),
      countriesVisited: countriesCount,
      totalDistanceKm: Math.round(totalDistance * 100) / 100,
      durationDays: this.durationInDays
    };
  }

  // Método para calcular distancia total del viaje
  private async calculateTotalDistance(): Promise<number> {
    const locations = await Location.query()
      .where('tripId', this.id)
      .whereNotNull('coordinates')
      .orderBy('visitDate', 'asc');

    if (locations.length < 2) return 0;

    let totalDistance = 0;
    const knex = (this.constructor as any).knex();
    for (let i = 1; i < locations.length; i++) {
      const result = await knex.raw(`
        SELECT ST_Distance(
          ST_SetSRID(ST_MakePoint(?, ?), 4326),
          ST_SetSRID(ST_MakePoint(?, ?), 4326)
        ) as distance
      `, [
        locations[i - 1].coordinates.coordinates[0],
        locations[i - 1].coordinates.coordinates[1],
        locations[i].coordinates.coordinates[0],
        locations[i].coordinates.coordinates[1]
      ]);

      totalDistance += parseFloat(result.rows[0].distance);
    }

    return totalDistance * 111320; // Convertir de grados a kilómetros (aproximado)
  }
}