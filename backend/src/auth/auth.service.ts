import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor (
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async validateUser(identifier: string, pass: string): Promise<any> {
    // Try username first, then email
    let user = await this.usersService.findOne(identifier);
    if (!user) {
      user = await this.usersService.findByEmail(identifier);
    }
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      this.logger.debug(`User validated: ${identifier}`);
      return result;
    }
    this.logger.warn(`Failed validation attempt for user: ${identifier}`);
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

  /**
   * Generate a password reset token and log the reset link (dev mode — no email).
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists — but log it for dev
      this.logger.warn(`Password reset requested for unknown email: ${email}`);
      return;
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.usersService.setResetToken(user.id, token, expires);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    this.logger.log('═══════════════════════════════════════════════════');
    this.logger.log(`PASSWORD RESET REQUESTED for user: ${user.username} (${email})`);
    this.logger.log(`Reset link (valid 1 hour):`);
    this.logger.log(`  ${resetLink}`);
    this.logger.log('═══════════════════════════════════════════════════');
  }

  /**
   * Validate a reset token and update the password.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (user.resetExpires && new Date(user.resetExpires) < new Date()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, await bcrypt.genSalt());
    await this.usersService.updatePassword(user.id, passwordHash);
    await this.usersService.clearResetToken(user.id);

    this.logger.log(`Password reset completed for user: ${user.username}`);
  }
}
