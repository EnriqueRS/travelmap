import { Injectable, Logger } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async findOne(username: string): Promise<User | undefined> {
    this.logger.debug(`Finding user by username: ${username}`);
    return User.query().where('username', username).first();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    this.logger.debug(`Finding user by email: ${email}`);
    return User.query().where('email', email).first();
  }

  async create(data: Partial<User>): Promise<User> {
    const user = await User.query().insert(data);
    this.logger.debug(`User created: ${user.id}`);
    return user;
  }

  async findByIdWithData(id: number): Promise<User | undefined> {
    this.logger.debug(`Finding user with data: ${id}`);
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
      this.logger.debug(`No fields to update for user ${userId}`);
      return User.query().findById(userId);
    }

    const updated = await User.query().patchAndFetchById(userId, patch);
    this.logger.debug(`User profile updated: ${userId}`);
    return updated;
  }
}
