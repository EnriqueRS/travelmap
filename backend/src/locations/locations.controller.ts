import { Controller, Post, Patch, Get, Delete, Body, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocationsService } from './locations.service';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  private readonly logger = new Logger(LocationsController.name);

  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  async createLocation(@Request() req, @Body() createData: any) {
    this.logger.debug(`Creating location for user ${req.user.userId}: ${createData.name}`);
    return this.locationsService.createLocation(req.user.userId, createData);
  }

  @Patch(':id')
  async updateLocation(@Request() req, @Param('id') id: string, @Body() updateData: any) {
    this.logger.debug(`Updating location ${id} for user ${req.user.userId}`);
    return this.locationsService.updateLocation(req.user.userId, id, updateData);
  }

  @Get()
  async getLocations(@Request() req) {
    this.logger.debug(`Fetching locations for user ${req.user.userId}`);
    return this.locationsService.getUserLocations(req.user.userId);
  }

  @Delete(':id')
  async deleteLocation(@Request() req, @Param('id') id: string) {
    this.logger.debug(`Deleting location ${id} for user ${req.user.userId}`);
    return this.locationsService.deleteLocation(req.user.userId, id);
  }
}
