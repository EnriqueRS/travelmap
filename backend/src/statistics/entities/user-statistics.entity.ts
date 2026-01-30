import { Model } from 'objection';
import { User } from '../../users/user.entity';

export interface UserStatisticsProperties {
  id: number;
  userId: number;
  totalTrips: number;
  totalLocations: number;
  countriesVisited: number;
  totalDistance: number;
  averageTripDuration: number;
  lastActiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserStatistics extends Model implements UserStatisticsProperties {
  id!: number;
  userId!: number;
  totalTrips!: number;
  totalLocations!: number;
  countriesVisited!: number;
  totalDistance!: number;
  averageTripDuration!: number;
  lastActiveDate!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  static get tableName() {
    return 'user_statistics';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId'],
      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        totalTrips: { type: 'integer', default: 0 },
        totalLocations: { type: 'integer', default: 0 },
        countriesVisited: { type: 'integer', default: 0 },
        totalDistance: { type: 'number', default: 0 },
        averageTripDuration: { type: 'number', default: 0 },
        lastActiveDate: { type: 'string', format: 'date-time' },
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
          from: 'user_statistics.userId',
          to: 'users.id'
        }
      }
    };
  }

  async $beforeInsert() {
    await super.$beforeInsert({} as any);
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.lastActiveDate = new Date();
  }

  async $beforeUpdate() {
    await super.$beforeUpdate({}, {} as any);
    this.updatedAt = new Date();
  }

  static async calculateForUser(userId: number): Promise<UserStatistics> {
    // This would calculate statistics based on user's trips, locations, etc.
    // For now, return a basic statistics object
    return await UserStatistics.query().findOne({ userId }) ||
      await UserStatistics.query().insert({
        userId,
        totalTrips: 0,
        totalLocations: 0,
        countriesVisited: 0,
        totalDistance: 0,
        averageTripDuration: 0,
        lastActiveDate: new Date()
      });
  }
}