// backend/src/geo/entities/country.entity.ts
import { Model } from 'objection';
import { UserCountryStatus } from './user-country-status.entity';

export interface CountryProperties {
  id: number;
  isoAlpha2: string;
  isoAlpha3: string;
  name: string;
  continent: string;
  capital?: string;
  population?: number;
  areaSqKm?: number;
  geometry: any; // PostGIS geometry
  centroid?: any; // PostGIS point
  createdAt: Date;
  updatedAt: Date;
}

export class Country extends Model implements CountryProperties {
  id!: number;
  isoAlpha2!: string;
  isoAlpha3!: string;
  name!: string;
  continent!: string;
  capital?: string;
  population?: number;
  areaSqKm?: number;
  geometry!: any; // PostGIS geometry
  centroid?: any; // PostGIS point
  createdAt!: Date;
  updatedAt!: Date;

  static get tableName() {
    return 'countries';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['isoAlpha2', 'isoAlpha3', 'name', 'geometry'],
      properties: {
        id: { type: 'integer' },
        isoAlpha2: { type: 'string', minLength: 2, maxLength: 2 },
        isoAlpha3: { type: 'string', minLength: 3, maxLength: 3 },
        name: { type: 'string', minLength: 1, maxLength: 100 },
        continent: { type: 'string', maxLength: 50 },
        capital: { type: 'string', maxLength: 100 },
        population: { type: 'integer' },
        areaSqKm: { type: 'number' },
        geometry: { type: 'object' }, // PostGIS geometry
        centroid: { type: 'object' }, // PostGIS point
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      userStatuses: {
        relation: Model.HasManyRelation,
        modelClass: UserCountryStatus,
        join: {
          from: 'countries.id',
          to: 'user_country_statuses.countryId'
        }
      }
    };
  }

  // Convertir a GeoJSON Feature
  toGeoJSONFeature(includeStatus = false, userId?: number): any {
    const feature: any = {
      type: 'Feature',
      id: this.isoAlpha2,
      geometry: this.geometry,
      properties: {
        isoAlpha2: this.isoAlpha2,
        isoAlpha3: this.isoAlpha3,
        name: this.name,
        continent: this.continent,
        capital: this.capital,
        population: this.population,
        areaSqKm: this.areaSqKm
      }
    };

    if (includeStatus && userId) {
      // Esto se manejará en el service para incluir el estado del usuario
      feature.properties.status = 'default';
    }

    return feature;
  }

  // Verificar si un punto está dentro del país
  async containsPoint(longitude: number, latitude: number): Promise<boolean> {
    const result = await this.$query()
      .select('id')
      .whereRaw('ST_Contains(geometry, ST_SetSRID(ST_MakePoint(?, ?), 4326))', [longitude, latitude])
      .first();
    
    return !!result;
  }

  // Calcular distancia a un punto
  async distanceToPoint(longitude: number, latitude: number): Promise<number> {
    const result = await this.$query()
      .select('id')
      .select('ST_Distance(geometry, ST_SetSRID(ST_MakePoint(?, ?), 4326)) as distance', [longitude, latitude])
      .where('id', this.id)
      .first();
    
    return (result as any)?.distance || 0;
  }
}