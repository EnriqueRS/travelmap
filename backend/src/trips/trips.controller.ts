import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor (private readonly tripsService: TripsService) { }

  @Post()
  async createTrip(@Request() req, @Body() createData: any) {
    return this.tripsService.createTrip(req.user.userId, createData);
  }

  @Get()
  async getTrips(@Request() req) {
    return this.tripsService.getUserTrips(req.user.userId);
  }

  @Patch(':id')
  async updateTrip(@Request() req, @Param('id') id: string, @Body() updateData: any) {
    return this.tripsService.updateTrip(req.user.userId, id, updateData);
  }
}
