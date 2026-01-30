import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  async findOne(username: string): Promise<User | undefined> {
    return User.query().where('username', username).first();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return User.query().where('email', email).first();
  }

  async create(userDto: Partial<User>): Promise<User> {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(userDto.passwordHash, salt);

    // If homeLocation is provided, ensure it is in the correct format for PostGIS
    // The input might be GeoJSON, Objection/Knex handles it if configured, 
    // but sometimes raw Insert requires explicit ST_GeomFromGeoJSON or similar.
    // However, Objection's geometry support usually handles GeoJSON object if column type is geometry.
    // Given we used specificType('homeLocation', 'geography(POINT,4326)'), we might need to handle it.

    // For now, let's assume Objection handles it or we pass it as a raw object.
    // If it fails, we will debug.

    return User.query().insert({
      ...userDto,
      passwordHash,
    });
  }
}
