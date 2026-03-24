// backend/src/geo/geo.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  UseGuards, 
  Request,
  Query,
  Body,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GeoService } from './geo.service';
import { UpdateCountryStatusDto } from './dto/update-country-status.dto';
import { CountriesGeoJSONResponse, UserCountriesResponse } from './dto/geo-response.dto';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('countries')
  @ApiOperation({ 
    summary: 'Get all countries as GeoJSON',
    description: 'Returns all countries with their geometries and user status if authenticated'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Countries GeoJSON data'
  })
  async getCountriesGeoJSON(@Request() req): Promise<CountriesGeoJSONResponse> {
    const userId = req.user?.id;
    return await this.geoService.getCountriesGeoJSON(userId);
  }

  @Get('user-countries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get user countries by status',
    description: 'Returns user countries grouped by status (visited, planned, wishlist)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User countries data'
  })
  async getUserCountries(@Request() req): Promise<UserCountriesResponse> {
    const userId = req.user.id;
    return await this.geoService.getUserCountries(userId);
  }

  @Post('countries/update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update country status',
    description: 'Updates the status of a country for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Country status updated successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request data' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Country not found' 
  })
  async updateCountryStatus(
    @Request() req,
    @Body() updateCountryStatusDto: UpdateCountryStatusDto
  ): Promise<{ success: boolean }> {
    const userId = req.user.id;
    await this.geoService.updateCountryStatus(
      userId,
      updateCountryStatusDto.countryCode!,
      updateCountryStatusDto.status as any
    );
    
    return { success: true };
  }

  @Get('countries/nearby')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get nearby countries',
    description: 'Returns countries within a specified radius from a point'
  })
  async getNearbyCountries(
    @Query('lng') lng: number,
    @Query('lat') lat: number,
    @Query('radius') radius: number = 500
  ): Promise<any[]> {
    return await this.geoService.getNearbyCountries(lng, lat, radius);
  }

  @Get('countries/by-continent')
  @ApiOperation({ 
    summary: 'Get countries statistics by continent',
    description: 'Returns statistics of countries grouped by continent'
  })
  async getCountriesByContinent(): Promise<any[]> {
    return await this.geoService.getCountriesByContinent();
  }

  @Get('user/geographic-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get user geographic statistics',
    description: 'Returns geographic statistics for the authenticated user'
  })
  async getUserGeographicStats(@Request() req): Promise<any> {
    const userId = req.user.id;
    return await this.geoService.getUserGeographicStats(userId);
  }

  @Get('countries/search')
  @ApiOperation({ 
    summary: 'Search countries',
    description: 'Search countries by name or ISO code'
  })
  async searchCountries(
    @Query('q') query: string,
    @Query('limit') limit: number = 10
  ): Promise<any[]> {
    return await this.geoService.searchCountries(query, limit);
  }
}