import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  newPassword!: string;

  @IsString()
  token!: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor (private authService: AuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() req) {
    const identifier = req.username || req.email;
    this.logger.debug(`Login attempt: ${identifier}`);
    const user = await this.authService.validateUser(identifier, req.password);
    if (!user) {
      this.logger.warn(`Failed login for: ${identifier}`);
      throw new UnauthorizedException('Unauthorized');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() createUserDto: any) {
    this.logger.debug(`Registration attempt: ${createUserDto.username}`);
    return this.authService.register(createUserDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    this.logger.debug(`Password reset requested for: ${dto.email}`);
    await this.authService.requestPasswordReset(dto.email);
    // Always return success — don't reveal if email exists
    return { message: 'If the email exists, a reset link has been generated.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    this.logger.debug('Password reset attempt with token');
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password updated successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    this.logger.debug(`Profile requested for user: ${req.user?.username}`);
    return req.user;
  }
}
