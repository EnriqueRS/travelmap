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
        locations: true,
        countryStatuses: true
      });
  }
}
