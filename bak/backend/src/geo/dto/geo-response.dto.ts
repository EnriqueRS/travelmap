import { Country } from '../entities/country.entity';

export interface CountryWithStatus extends Country {
  status: string;
}

export interface CountriesGeoJSONResponse {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      id: string;
      name: string;
      isoAlpha2: string;
      isoAlpha3: string;
      continent: string;
      status?: string;
    };
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: number[][][] | number[][][][];
    };
  }>;
}

export interface UserCountriesResponse {
  visited: string[];
  planned: string[];
  wishlist: string[];
  countries?: CountryWithStatus[];
  statistics?: {
    total: number;
    visited: number;
    planned: number;
    wantToVisit: number;
    lived: number;
  };
}

export interface CountryStatisticsResponse {
  id: string;
  name: string;
  totalLocations: number;
  totalTrips: number;
  countriesVisited: number;
  firstVisitDate?: string;
  lastVisitDate?: string;
}