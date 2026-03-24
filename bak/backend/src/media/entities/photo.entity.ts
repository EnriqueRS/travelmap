import { Model, snakeCaseMappers } from 'objection';
import { User } from '../../users/user.entity';
import { Location } from '../../locations/entities/location.entity';
import { Trip } from '../../trips/entities/trip.entity';

export interface PhotoProperties {
  id: string;
  url: string;
  caption?: string;
  userId: number;
  locationId?: string;
  tripId?: string;
  metadata?: {
    size: number;
    format: string;
    width?: number;
    height?: number;
    exif?: any;
  };
  provider: 'local' | 'immich';
  externalId?: string;
  showOnMap: boolean;
  isCover: boolean;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Photo extends Model implements PhotoProperties {
  id!: string;
  url!: string;
  caption?: string;
  userId!: number;
  locationId?: string;
  tripId?: string;
  metadata?: {
    size: number;
    format: string;
    width?: number;
    height?: number;
    exif?: any;
  };
  provider!: 'local' | 'immich';
  externalId?: string;
  showOnMap!: boolean;
  isCover!: boolean;
  isHidden!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static get tableName() {
    return 'photos';
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
      required: ['id', 'url', 'userId'],
      properties: {
        id: { type: 'string' },
        url: { type: 'string', maxLength: 500 },
        caption: { type: 'string', maxLength: 1000 },
        userId: { type: 'integer' },
        locationId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        tripId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        metadata: { type: 'object' },
        provider: { type: 'string', enum: ['local', 'immich'], default: 'local' },
        externalId: { type: 'string', maxLength: 255 },
        showOnMap: { type: 'boolean', default: false },
        isCover: { type: 'boolean', default: false },
        isHidden: { type: 'boolean', default: false },
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
          from: 'photos.user_id',
          to: 'users.id'
        }
      },
      location: {
        relation: Model.BelongsToOneRelation,
        modelClass: Location,
        join: {
          from: 'photos.location_id',
          to: 'locations.id'
        }
      },
      trip: {
        relation: Model.BelongsToOneRelation,
        modelClass: Trip,
        join: {
          from: 'photos.trip_id',
          to: 'trips.id'
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