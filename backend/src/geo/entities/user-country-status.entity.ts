// backend/src/geo/entities/user-country-status.entity.ts
import { Model } from 'objection';
import { Country } from './country.entity';

export interface UserCountryStatusProperties {
  id: number;
  userId: number;
  countryId: number;
  status: 'visited' | 'planned' | 'wishlist';
  visitDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserCountryStatus extends Model implements UserCountryStatusProperties {
  id!: number;
  userId!: number;
  countryId!: number;
  status!: 'visited' | 'planned' | 'wishlist';
  visitDate?: Date;
  notes?: string;
  createdAt!: Date;
  updatedAt!: Date;

  static get tableName() {
    return 'user_country_statuses';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'countryId', 'status'],
      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        countryId: { type: 'integer' },
        status: { 
          type: 'string', 
          enum: ['visited', 'planned', 'wishlist'],
          default: 'wishlist'
        },
        visitDate: { type: 'string', format: 'date' },
        notes: { type: 'string', maxLength: 1000 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      country: {
        relation: Model.BelongsToOneRelation,
        modelClass: Country,
        join: {
          from: 'user_country_statuses.countryId',
          to: 'countries.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: require('../auth/entities/user.entity').User,
        join: {
          from: 'user_country_statuses.userId',
          to: 'users.id'
        }
      }
    };
  }

  // Hooks para validaciones adicionales
  async $beforeInsert() {
    await super.$beforeInsert({} as any);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async $beforeUpdate() {
    await super.$beforeUpdate({}, {} as any);
    this.updatedAt = new Date();
  }

  // Método estático para obtener países por estado
  static async getCountriesByStatus(userId: number, status: 'visited' | 'planned' | 'wishlist'): Promise<Country[]> {
    return await Country.query()
      .join('user_country_statuses', 'countries.id', 'user_country_statuses.countryId')
      .where('user_country_statuses.userId', userId)
      .where('user_country_statuses.status', status)
      .select('countries.*');
  }

  // Método estático para obtener todos los países con estados del usuario
  static async getAllCountriesWithStatus(userId: number): Promise<Array<Country & { status: string }>> {
    const results = await Country.query()
      .leftJoin(
        'user_country_statuses',
        builder => {
          builder
            .on('countries.id', '=', 'user_country_statuses.countryId')
            .andOn('user_country_statuses.userId', '=', userId.toString());
        }
      )
      .select(
        'countries.*',
        'user_country_statuses.status as status'
      );
    
    return results as Array<Country & { status: string }>;
  }

  
}