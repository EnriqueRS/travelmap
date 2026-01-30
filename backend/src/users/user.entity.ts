// backend/src/auth/entities/user.entity.ts
import { Model } from 'objection';
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
  homeLocation?: any; // GeoJSON Point
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
  homeLocation?: any;
  createdAt!: Date;
  updatedAt!: Date;

  static get tableName() {
    return 'users';
  }

  static get idColumn() {
    return 'id';
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
        avatarUrl: { type: 'string', maxLength: 500 },
        bio: { type: 'string', maxLength: 1000 },
        isPublic: { type: 'boolean', default: false },
        themePreference: {
          type: 'string',
          enum: ['light', 'dark', 'auto'],
          default: 'auto'
        },
        homeLocation: { type: ['object', 'null'] },
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
          to: 'trips.userId'
        }
      },
      locations: {
        relation: Model.HasManyRelation,
        modelClass: Location,
        join: {
          from: 'users.id',
          to: 'locations.userId'
        }
      },
      photos: {
        relation: Model.HasManyRelation,
        modelClass: Photo,
        join: {
          from: 'users.id',
          to: 'photos.userId'
        }
      },
      countryStatuses: {
        relation: Model.HasManyRelation,
        modelClass: UserCountryStatus,
        join: {
          from: 'users.id',
          to: 'user_country_statuses.userId'
        }
      },
      statistics: {
        relation: Model.HasOneRelation,
        modelClass: UserStatistics,
        join: {
          from: 'users.id',
          to: 'user_statistics.userId'
        }
      }
    };
  }

  // Hooks para timestamps
  async $beforeInsert() {
    await super.$beforeInsert({} as any);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async $beforeUpdate() {
    await super.$beforeUpdate({}, {} as any);
    this.updatedAt = new Date();
  }

  // Método para obtener nombre completo
  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.username;
  }

  // Método para obtener países visitados
  async getVisitedCountries(): Promise<any[]> {
    const { Country } = await import('../geo/entities/country.entity');
    return await Country.query()
      .join('user_country_statuses', 'countries.id', 'user_country_statuses.countryId')
      .where('user_country_statuses.userId', this.id)
      .where('user_country_statuses.status', 'visited')
      .select('countries.*');
  }

  // Método para obtener estadísticas básicas
  async getBasicStats(): Promise<any> {
    const [tripsCount, locationsCount, countriesCount] = await Promise.all([
      Trip.query().where('userId', this.id).count('* as count').first(),
      Location.query().where('userId', this.id).count('* as count').first(),
      UserCountryStatus.query()
        .where('userId', this.id)
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

  // Método para verificar si un país está en un estado específico
  async hasCountryStatus(countryId: number, status: 'visited' | 'planned' | 'wishlist'): Promise<boolean> {
    const result = await UserCountryStatus.query()
      .where('userId', this.id)
      .where('countryId', countryId)
      .where('status', status)
      .first();

    return !!result;
  }

  // Método para obtener perfil público
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