import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor (private authService: AuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() req) {
    this.logger.debug(`Login attempt: ${req.username}`);
    const user = await this.authService.validateUser(req.username, req.password);
    if (!user) {
      this.logger.warn(`Failed login for: ${req.username}`);
      throw new UnauthorizedException('Unauthorized');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() createUserDto: any) {
    this.logger.debug(`Registration attempt: ${createUserDto.username}`);
    return this.authService.register(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    this.logger.debug(`Profile requested for user: ${req.user?.username}`);
    return req.user;
  }
}
