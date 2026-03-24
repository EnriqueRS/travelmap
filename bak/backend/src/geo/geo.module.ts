// backend/src/geo/geo.module.ts
import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { DatabaseModule } from '../database/database.module';
import { KnexModule } from 'nest-knexjs';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    KnexModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          client: 'pg',
          connection: {
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            user: configService.get('DB_USER', 'travelmap_user'),
            password: configService.get('DB_PASSWORD', 'password'),
            database: configService.get('DB_NAME', 'travelmap'),
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
        },
      }),
    }),
  ],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}