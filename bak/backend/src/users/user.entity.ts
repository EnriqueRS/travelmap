import { Model, snakeCaseMappers } from 'objection';
import { Trip } from '../trips/entities/trip.entity';
import { Location } from '../locations/entities/location.entity';
import { Photo } from '../media/entities/photo.entity';
import { UserCountryStatus } from '../geo/entities/user-country-status.entity';
import { UserStatistics } from '../statistics/entities/user-statistics.entity';

export interface UserProperties {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  isPublic: boolean;
  themePreference: 'light' | 'dark' | 'auto';
  homeLocationLat?: number;
  homeLocationLng?: number;
  homeCountry?: string;
  homeProvince?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Model implements UserProperties {
  id!: number;
  username!: string;
  email!: string;
  passwordHash!: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  isPublic!: boolean;
  themePreference!: 'light' | 'dark' | 'auto';
  homeLocationLat?: number;
  homeLocationLng?: number;
  homeCountry?: string;
  homeProvince?: string;
  createdAt!: Date;
  updatedAt!: Date;

  static get tableName() {
    return 'users';
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
      required: ['username', 'email', 'passwordHash'],
      properties: {
        id: { type: 'integer' },
        username: { type: 'string', minLength: 3, maxLength: 50 },
        email: { type: 'string', format: 'email', maxLength: 255 },
        passwordHash: { type: 'string', minLength: 60 }, // bcrypt hash
        firstName: { type: 'string', maxLength: 100 },
        lastName: { type: 'string', maxLength: 100 },
        avatarUrl: { type: 'string' },
        bio: { type: 'string', maxLength: 1000 },
        isPublic: { type: 'boolean', default: false },
        themePreference: {
          type: 'string',
          enum: ['light', 'dark', 'auto'],
          default: 'auto'
        },
        homeLocationLat: { type: ['number', 'null'] },
        homeLocationLng: { type: ['number', 'null'] },
        homeCountry: { type: ['string', 'null'], maxLength: 2 },
        homeProvince: { type: ['string', 'null'], maxLength: 100 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      trips: {
        relation: Model.HasManyRelation,
        modelClass: Trip,
        join: {
          from: 'users.id',
          to: 'trips.user_id'
        }
      },
      locations: {
        relation: Model.HasManyRelation,
        modelClass: Location,
        join: {
          from: 'users.id',
          to: 'locations.user_id'
        }
      },
      photos: {
        relation: Model.HasManyRelation,
        modelClass: Photo,
        join: {
          from: 'users.id',
          to: 'photos.user_id'
        }
      },
      countryStatuses: {
        relation: Model.HasManyRelation,
        modelClass: UserCountryStatus,
        join: {
          from: 'users.id',
          to: 'user_country_statuses.user_id'
        }
      },
      statistics: {
        relation: Model.HasOneRelation,
        modelClass: UserStatistics,
        join: {
          from: 'users.id',
          to: 'user_statistics.user_id'
        }
      }
    };
  }

  // Hooks for timestamps
  async $beforeInsert() {
    await super.$beforeInsert({} as any);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async $beforeUpdate() {
    await super.$beforeUpdate({}, {} as any);
    this.updatedAt = new Date();
  }

  // Get full name method
  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.username;
  }

  // Get visited countries method
  async getVisitedCountries(): Promise<any[]> {
    const { Country } = await import('../geo/entities/country.entity');
    return await Country.query()
      .join('user_country_statuses', 'countries.id', 'user_country_statuses.country_id')
      .where('user_country_statuses.user_id', this.id)
      .where('user_country_statuses.status', 'visited')
      .select('countries.*');
  }

  // Get basic stats method
  async getBasicStats(): Promise<any> {
    const [tripsCount, locationsCount, countriesCount] = await Promise.all([
      Trip.query().where('user_id', this.id).count('* as count').first(),
      Location.query().where('user_id', this.id).count('* as count').first(),
      UserCountryStatus.query()
        .where('user_id', this.id)
        .where('status', 'visited')
        .count('* as count')
        .first()
    ]);

    return {
      tripsCount: parseInt((tripsCount as any)?.count || '0'),
      locationsCount: parseInt((locationsCount as any)?.count || '0'),
      countriesVisited: parseInt((countriesCount as any)?.count || '0')
    };
  }

  // Method to check if a country is in a specific status
  async hasCountryStatus(countryId: number, status: 'visited' | 'planned' | 'wishlist'): Promise<boolean> {
    const result = await UserCountryStatus.query()
      .where('user_id', this.id)
      .where('country_id', countryId)
      .where('status', status)
      .first();

    return !!result;
  }

  // Get public profile method
  getPublicProfile(): Partial<UserProperties> {
    return {
      id: this.id,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      isPublic: this.isPublic,
      createdAt: this.createdAt
    };
  }
}