import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  private readonly logger = new Logger(TripsController.name);

  constructor (private readonly tripsService: TripsService) { }

  @Post()
  async createTrip(@Request() req, @Body() createData: any) {
    this.logger.debug(`Creating trip for user ${req.user.userId}: ${createData.name}`);
    return this.tripsService.createTrip(req.user.userId, createData);
  }

  @Get()
  async getTrips(@Request() req) {
    this.logger.debug(`Fetching trips for user ${req.user.userId}`);
    return this.tripsService.getUserTrips(req.user.userId);
  }

  @Patch(':id')
  async updateTrip(@Request() req, @Param('id') id: string, @Body() updateData: any) {
    this.logger.debug(`Updating trip ${id} for user ${req.user.userId}`);
    return this.tripsService.updateTrip(req.user.userId, id, updateData);
  }

  @Delete(':id')
  async deleteTrip(@Request() req, @Param('id') id: string) {
    this.logger.debug(`Deleting trip ${id} for user ${req.user.userId}`);
    return this.tripsService.deleteTrip(req.user.userId, id);
  }
}
