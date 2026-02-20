import { Controller, Get, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor (private readonly usersService: UsersService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Request() req) {
    if (!req.user || !req.user.userId) {
      throw new UnauthorizedException();
    }
    const user = await this.usersService.findByIdWithData(req.user.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Get real-time stats
    const basicStats = await user.getBasicStats();

    // Exclude password hash
    const { passwordHash, ...result } = user;

    return {
      ...result,
      statistics: {
        countriesVisited: basicStats.countriesVisited,
        tripsCompleted: basicStats.tripsCount,
        placesVisited: basicStats.locationsCount,
        photosUploaded: 0
      }
    };
  }
}
