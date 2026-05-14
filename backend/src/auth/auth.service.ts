import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor (
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      this.logger.debug(`User validated: ${username}`);
      return result;
    }
    this.logger.warn(`Failed validation attempt for user: ${username}`);
    return null;
  }

  async login(user: any) {
    this.logger.debug(`User logged in: ${user.username}`);
    const payload = { username: user.username, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isPublic: user.isPublic,
        homeLocation: user.homeLocation
      }
    };
  }

  async register(userDto: any) {
    this.logger.debug(`Registering new user: ${userDto.username}`);
    // Check if user exists
    const existingUser = await this.usersService.findOne(userDto.username);
    if (existingUser) {
      throw new UnauthorizedException('Username already exists');
    }
    const existingEmail = await this.usersService.findByEmail(userDto.email);
    if (existingEmail) {
      throw new UnauthorizedException('Email already exists');
    }

    // Hash password and build entity-shaped data for UsersService
    const { password, homeLocation, ...rest } = userDto;
    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt());
    const toCreate: Partial<User> = { ...rest, passwordHash, homeLocationLat: homeLocation.coordinates[0], homeLocationLng: homeLocation.coordinates[1] };
    const user = await this.usersService.create(toCreate);

    // Login the user immediately
    return this.login(user);
  }
}
