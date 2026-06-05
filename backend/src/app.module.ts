import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeoModule } from './geo/geo.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { MediaModule } from './media/media.module';
import { LocationsModule } from './locations/locations.module';
import { LoggerModule } from './logger/logger.module';

import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule,
    DatabaseModule,
    HealthModule,
    GeoModule,
    AuthModule,
    UsersModule,
    TripsModule,
    IntegrationsModule,
    MediaModule,
    LocationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }