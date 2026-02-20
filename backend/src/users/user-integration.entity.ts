import { Model } from 'objection';
import { User } from './user.entity';

export interface UserIntegrationProperties {
  id: string; // UUID
  userId: number;
  provider: 'immich';
  url?: string;
  access_token?: string;
  created_at: Date;
  updated_at: Date;
}

export class UserIntegration extends Model implements UserIntegrationProperties {
  id!: string; // UUID
  userId!: number;
  provider!: 'immich';
  url?: string;
  access_token?: string;
  created_at!: Date;
  updated_at!: Date;

  static get tableName() {
    return 'user_integrations';
  }

  static get idColumn() {
    return 'id';
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
        access_token: { type: 'string', maxLength: 1000 },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'user_integrations.userId',
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
    this.created_at = new Date();
    this.updated_at = new Date();
  }

  async $beforeUpdate() {
    await super.$beforeUpdate({}, {} as any);
    this.updated_at = new Date();
  }
}
