import { Model } from 'objection';
import { Trip } from '../../trips/entities/trip.entity';
import { Location } from '../../locations/entities/location.entity';
import { Photo } from '../../media/entities/photo.entity';

export interface ItineraryDayProperties {
  id: string;
  tripId: string;
  dayNumber: number;
  date: Date;
  title?: string;
  description?: string;
  notes?: string;
  estimatedBudget?: number;
  actualBudget?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ItineraryDay extends Model implements ItineraryDayProperties {
  id!: string;
  tripId!: string;
  dayNumber!: number;
  date!: Date;
  title?: string;
  description?: string;
  notes?: string;
  estimatedBudget?: number;
  actualBudget?: number;
  createdAt!: Date;
  updatedAt!: Date;

  static get tableName() {
    return 'itinerary_days';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['id', 'tripId', 'dayNumber', 'date'],
      properties: {
        id: { type: 'string' },
        tripId: { type: 'string' },
        dayNumber: { type: 'integer', minimum: 1 },
        date: { type: 'string', format: 'date' },
        title: { type: 'string', maxLength: 200 },
        description: { type: 'string', maxLength: 2000 },
        notes: { type: 'string' },
        estimatedBudget: { type: 'number', minimum: 0 },
        actualBudget: { type: 'number', minimum: 0 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      trip: {
        relation: Model.BelongsToOneRelation,
        modelClass: Trip,
        join: {
          from: 'itinerary_days.tripId',
          to: 'trips.id'
        }
      },
      locations: {
        relation: Model.HasManyRelation,
        modelClass: Location,
        join: {
          from: 'itinerary_days.id',
          to: 'locations.itineraryDayId'
        }
      },
      photos: {
        relation: Model.HasManyRelation,
        modelClass: Photo,
        join: {
          from: 'itinerary_days.id',
          to: 'photos.itineraryDayId'
        }
      }
    };
  }

  async $beforeInsert() {
    await super.$beforeInsert({} as any);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async $beforeUpdate() {
    await super.$beforeUpdate({}, {} as any);
    this.updatedAt = new Date();
  }
}