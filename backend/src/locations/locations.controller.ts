import { Controller, Post, Patch, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocationsService } from './locations.service';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  async createLocation(@Request() req, @Body() createData: any) {
    return this.locationsService.createLocation(req.user.userId, createData);
  }

  @Patch(':id')
  async updateLocation(@Request() req, @Param('id') id: string, @Body() updateData: any) {
    return this.locationsService.updateLocation(req.user.userId, id, updateData);
  }

  @Get()
  async getLocations(@Request() req) {
    return this.locationsService.getUserLocations(req.user.userId);
  }

  @Delete(':id')
  async deleteLocation(@Request() req, @Param('id') id: string) {
    return this.locationsService.deleteLocation(req.user.userId, id);
  }
}
