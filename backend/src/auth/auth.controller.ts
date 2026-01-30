import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor (private authService: AuthService) { }

  @Post('login')
  async login(@Body() req) {
    // Ideally use LocalAuthGuard but for simplicity we can validate here or use the service
    const user = await this.authService.validateUser(req.username, req.password);
    if (!user) {
      return { status: 401, message: 'Unauthorized' };
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() createUserDto: any) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
