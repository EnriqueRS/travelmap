import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  async findOne(username: string): Promise<User | undefined> {
    return User.query().where('username', username).first();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return User.query().where('email', email).first();
  }

  async create(data: Partial<User>): Promise<User> {
    // passwordHash is expected to be already set by AuthService (hashed there)
    return User.query().insert(data);
  }

  async findByIdWithData(id: number): Promise<User | undefined> {
    const { Location } = await import('../locations/entities/location.entity');

    return User.query()
      .findById(id)
      .withGraphFetched({
        trips: true,
        locations: {
          photos: true,
          country: true,
        },
        countryStatuses: true
      });
  }

  async updateProfile(
    userId: number,
    payload: {
      name?: string;
      bio?: string;
      avatar?: string;
      homeCountry?: string;
      homeProvince?: string;
      homeLocationLat?: number;
      homeLocationLng?: number;
    },
  ): Promise<User> {
    const patch: Partial<User> = {};

    if (typeof payload.name === 'string' && payload.name.trim()) {
      // Use the single display name as username for now
      patch.username = payload.name.trim();
    }

    if (typeof payload.bio === 'string') {
      patch.bio = payload.bio;
    }

    if (typeof payload.avatar === 'string') {
      patch.avatarUrl = payload.avatar;
    }

    if (typeof payload.homeCountry === 'string') {
      patch.homeCountry = payload.homeCountry;
    }

    if (typeof payload.homeProvince === 'string') {
      patch.homeProvince = payload.homeProvince;
    }

    if (typeof payload.homeLocationLat === 'number') {
      patch.homeLocationLat = payload.homeLocationLat;
    }

    if (typeof payload.homeLocationLng === 'number') {
      patch.homeLocationLng = payload.homeLocationLng;
    }

    if (Object.keys(patch).length === 0) {
      // Nothing to update, return current user as-is
      return User.query().findById(userId);
    }

    return User.query().patchAndFetchById(userId, patch);
  }
}
