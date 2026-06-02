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
    const [tripsCompletedCount, totalTripsCount, locationsCount, countriesFromStatuses, photosCount, userTrips] = await Promise.all([
      Trip.query().where('user_id', this.id).where('status', 'Completado').count('* as count').first(),
      Trip.query().where('user_id', this.id).count('* as count').first(),
      Location.query().where('user_id', this.id).count('* as count').first(),
      UserCountryStatus.query()
        .where('user_id', this.id)
        .where('status', 'visited')
        .count('* as count')
        .first(),
      Photo.query().where('user_id', this.id).count('* as count').first(),
      Trip.query().where('user_id', this.id).select('countries')
    ]);

    // Count unique countries from both user_country_statuses AND trip countries arrays
    const countriesFromStatusesCount = parseInt((countriesFromStatuses as any)?.count || '0');

    // Collect unique country codes from trips
    const tripCountryCodes = new Set<string>();
    for (const trip of userTrips) {
      if (Array.isArray(trip.countries)) {
        for (const code of trip.countries) {
          if (code) tripCountryCodes.add(code.toUpperCase());
        }
      }
    }

    // Get country codes from user_country_statuses to merge with trip countries
    let statusCountryCodes: string[] = [];
    if (countriesFromStatusesCount > 0) {
      const statusResults = await UserCountryStatus.query()
        .where('user_country_statuses.user_id', this.id)
        .where('user_country_statuses.status', 'visited')
        .join('countries', 'user_country_statuses.country_id', 'countries.id')
        .select('countries.iso_alpha2 as code');
      statusCountryCodes = statusResults.map((r: any) => (r.code || '').toUpperCase());
    }

    // Merge both sets for total unique countries visited
    const allVisitedCountries = new Set([...tripCountryCodes, ...statusCountryCodes]);

    // Calculate furthest place from home location (considering locations, photos with EXIF GPS, AND visited countries)
    let furthestPlace: { name: string; distance: number } | null = null;
    if (this.homeLocationLat && this.homeLocationLng) {
      // Get all locations with valid coordinates (exclude 0,0 which means unset)
      const userLocations = await Location.query()
        .where('user_id', this.id)
        .whereNotNull('latitude')
        .whereNotNull('longitude')
        .whereNot(function () {
          this.where('latitude', 0).andWhere('longitude', 0);
        })
        .select('name', 'latitude', 'longitude');

      // Get photos with EXIF GPS that are NOT linked to a location
      const photosWithGps = await Photo.query()
        .where('user_id', this.id)
        .whereNull('location_id')
        .whereNotNull('metadata')
        .select('id', 'caption', 'metadata');

      // Get visited countries with their centroids
      const knex = (this.constructor as typeof User).knex();
      let visitedCountriesWithCentroids: any = { rows: [] };
      if (allVisitedCountries.size > 0) {
        visitedCountriesWithCentroids = await knex.raw(`
          SELECT c.name,
            COALESCE(c.centroid_lat, ST_Y(ST_Centroid(ST_GeomFromGeoJSON(c.geometry_json)))) as lat,
            COALESCE(c.centroid_lng, ST_X(ST_Centroid(ST_GeomFromGeoJSON(c.geometry_json)))) as lng
          FROM countries c
          WHERE c.iso_alpha2 = ANY(?)
        `, [Array.from(allVisitedCountries)]);
      }

      let maxDist = 0;
      let placeName = '';
      let furthestIsPhoto = false;
      let furthestPhotoCoords: { lat: number; lng: number } | null = null;

      // Check locations
      for (const loc of userLocations) {
        const dist = this.haversineDistance(
          this.homeLocationLat, this.homeLocationLng,
          loc.latitude, loc.longitude
        );
        if (dist > maxDist) {
          maxDist = dist;
          placeName = loc.name;
          furthestIsPhoto = false;
          furthestPhotoCoords = null;
        }
      }

      // Check photos with EXIF GPS
      for (const photo of photosWithGps) {
        const exif = (photo.metadata as any)?.exif;
        if (exif && exif.latitude && exif.longitude) {
          const dist = this.haversineDistance(
            this.homeLocationLat, this.homeLocationLng,
            exif.latitude, exif.longitude
          );
          if (dist > maxDist) {
            maxDist = dist;
            placeName = photo.caption || '';
            furthestIsPhoto = true;
            furthestPhotoCoords = { lat: exif.latitude, lng: exif.longitude };
          }
        }
      }

      // Check visited countries (by centroid)
      for (const country of (visitedCountriesWithCentroids.rows || [])) {
        if (country.lat && country.lng) {
          const dist = this.haversineDistance(
            this.homeLocationLat, this.homeLocationLng,
            parseFloat(country.lat), parseFloat(country.lng)
          );
          if (dist > maxDist) {
            maxDist = dist;
            placeName = country.name;
            furthestIsPhoto = false;
            furthestPhotoCoords = null;
          }
        }
      }

      if (maxDist > 0) {
        // If the furthest place came from a photo, reverse geocode to get city + country
        if (furthestIsPhoto && furthestPhotoCoords) {
          const geoName = await this.reverseGeocodePlace(furthestPhotoCoords.lat, furthestPhotoCoords.lng);
          if (geoName) {
            placeName = geoName;
          } else if (!placeName) {
            placeName = `${furthestPhotoCoords.lat.toFixed(2)}, ${furthestPhotoCoords.lng.toFixed(2)}`;
          }
        }
        furthestPlace = { name: placeName, distance: Math.round(maxDist) };
      }
    }

    return {
      tripsCompleted: parseInt((tripsCompletedCount as any)?.count || '0'),
      totalTrips: parseInt((totalTripsCount as any)?.count || '0'),
      locationsCount: parseInt((locationsCount as any)?.count || '0'),
      countriesVisited: allVisitedCountries.size,
      photosCount: parseInt((photosCount as any)?.count || '0'),
      furthestPlace
    };
  }

  // Haversine formula for distance calculation
  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Reverse geocode coordinates to get "City (Country)" format
  private async reverseGeocodePlace(lat: number, lng: number): Promise<string | null> {
    try {
      const axios = require('axios');
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat,
          lon: lng,
          format: 'json',
          zoom: 10,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'TravelMap/1.0'
        },
        timeout: 5000
      });

      const address = response.data?.address;
      if (!address) return null;

      const city = address.city || address.town || address.village || address.municipality || address.state;
      const country = address.country;

      if (city && country) {
        return `${city} (${country})`;
      } else if (country) {
        return country;
      }
      return null;
    } catch {
      return null;
    }
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