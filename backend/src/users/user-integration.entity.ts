import { Model, snakeCaseMappers } from 'objection';
import { User } from './user.entity';

export interface UserIntegrationProperties {
  id: string; // UUID
  userId: number;
  provider: 'immich';
  url?: string;
  accessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserIntegration extends Model implements UserIntegrationProperties {
  id!: string; // UUID
  userId!: number;
  provider!: 'immich';
  url?: string;
  accessToken?: string;
  createdAt!: Date;
  updatedAt!: Date;

  static get tableName() {
    return 'user_integrations';
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
      required: ['id', 'userId', 'provider'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        userId: { type: 'integer' },
        provider: { type: 'string', enum: ['immich'] },
        url: { type: 'string', maxLength: 1000 },
        accessToken: { type: 'string', maxLength: 1000 },
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
          from: 'user_integrations.user_id',
          to: 'users.id'
        }
      }
    };
  }

  async $beforeInsert() {
    await super.$beforeInsert({} as any);
    if (!this.id) {
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
}
