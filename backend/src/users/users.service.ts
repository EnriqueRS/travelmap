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
}
