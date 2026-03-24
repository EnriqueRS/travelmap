import { Module, Global } from '@nestjs/common';
import { Knex } from 'knex';
import { knex } from 'knex';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Model } from 'objection';

export const KNEX_CONNECTION = 'KNEX_CONNECTION';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: KNEX_CONNECTION,
      useFactory: async (configService: ConfigService): Promise<Knex> => {
        const knexConfig = {
          client: 'pg',
          connection: {
            host: configService.get('DB_HOST') || 'localhost',
            port: parseInt(configService.get('DB_PORT') || '5432'),
            user: configService.get('DB_USER') || 'travelmap_user',
            password: configService.get('DB_PASSWORD') || 'password',
            database: configService.get('DB_NAME') || 'travelmap',
          },
          pool: {
            min: 2,
            max: 10,
          },
          migrations: {
            directory: './src/database/migrations',
            tableName: 'knex_migrations',
          },
          seeds: {
            directory: './src/database/seeds',
          },
          searchPath: ['public', 'postgis'],
        };

        const knexInstance = knex(knexConfig);
        Model.knex(knexInstance);
        return knexInstance;
      },
      inject: [ConfigService],
    },
  ],
  exports: [KNEX_CONNECTION],
})
export class DatabaseModule { }