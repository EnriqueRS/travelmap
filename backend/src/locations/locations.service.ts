import { Injectable, Logger } from '@nestjs/common';
import { Location } from './entities/location.entity';
import { Country } from '../geo/entities/country.entity';
import { Photo } from '../media/entities/photo.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  async createLocation(userId: number, createData: any): Promise<Location> {
    let latitude = 0;
    let longitude = 0;

    if (createData.coordinates && createData.coordinates.length === 2) {
      latitude = createData.coordinates[0];
      longitude = createData.coordinates[1];
    }

    const backendPayload: any = {
      id: createData.id || uuidv4(),
      userId,
      name: createData.name,
      description: createData.description || '',
      category: createData.category?.toLowerCase() || 'city',
      rating: createData.rating || 5,
      visitDate: createData.visitedDate,
      tripId: createData.tripId || null,
      countryId: createData.country ? (await Country.query()
        .where('iso_alpha2', createData.country.toUpperCase())
        .orWhere('name', createData.country)
        .select('id')
        .first())?.id || null : null,
      latitude,
      longitude,
      admin_area_1: createData.adminArea1 || null,
      admin_area_2: createData.adminArea2 || null,
    };
    const location = await Location.query().insert(backendPayload);
    this.logger.debug(`Location created: ${location.id} for user ${userId}`);

    // Link photos if provided
    if (createData.images && createData.images.length > 0) {
      const { Photo } = await import('../media/entities/photo.entity');
      await Photo.query()
        .patch({ locationId: location.id, showOnMap: true } as any)
        .whereIn('id', createData.images)
        .where('user_id', userId);
      this.logger.debug(`Linked ${createData.images.length} photos to location ${location.id}`);
    }

    return location;
  }

  async updateLocation(userId: number, id: string, updateData: any): Promise<Location> {
    const location = await Location.query().findOne({ id, userId });
    if (!location) {
      throw new Error('Location not found or unauthorized');
    }
    let countryId = updateData.country ? await Country.query()
        .where('iso_alpha2', updateData.country.toUpperCase())
        .orWhere('name', updateData.country)
        .select('id')
        .first() : null;
    const patchData: any = {};
    if (updateData.name !== undefined) patchData.name = updateData.name;
    if (updateData.description !== undefined) patchData.description = updateData.description;
    if (updateData.category !== undefined) patchData.category = updateData.category;
    if (updateData.rating !== undefined) patchData.rating = updateData.rating;
    if (updateData.visitDate !== undefined) patchData.visitDate = updateData.visitDate;
    if (updateData.tripId !== undefined) patchData.tripId = updateData.tripId;
    if (updateData.latitude !== undefined) patchData.latitude = updateData.latitude;
    if (updateData.longitude !== undefined) patchData.longitude = updateData.longitude;
    if (updateData.country !== undefined) patchData.countryId = countryId?.id || null;
    if (updateData.adminArea1 !== undefined) patchData.adminArea1 = updateData.adminArea1;
    if (updateData.adminArea2 !== undefined) patchData.adminArea2 = updateData.adminArea2;

    const updated = await Location.query().patchAndFetchById(id, patchData);

    // Link photos if provided
    if (updateData.images && Array.isArray(updateData.images)) {
      const { Photo } = await import('../media/entities/photo.entity');
      
      // Optionally unlink old ones if you want, or just link new ones.
      // Usually it's better to explicitly set the ones we want.
      // For now, let's just link the new ones (and maybe unlink all previous for this location then re-link)
      await Photo.query()
        .patch({ locationId: null } as any)
        .where('location_id', id)
        .where('user_id', userId);

      if (updateData.images.length > 0) {
        await Photo.query()
          .patch({ locationId: id, showOnMap: true } as any)
          .whereIn('id', updateData.images)
          .where('user_id', userId);
        this.logger.debug(`Linked ${updateData.images.length} photos to location ${id}`);
      }
    }

    this.logger.debug(`Location updated: ${id} for user ${userId}`);
    return updated;
  }

  async deleteLocation(userId: number, id: string): Promise<{ success: boolean }> {
    const location = await Location.query().findOne({ id, user_id: userId });
    if (!location) {
      // Could throw NotFoundException but let's just throw Error or return false
      throw new Error('Location not found or unauthorized');
    }

    // Unlink photos
    await Photo.query()
      .patch({ locationId: null } as any)
      .where('location_id', id)
      .where('user_id', userId);

    // Delete the location
    await Location.query().deleteById(id);
    this.logger.debug(`Location deleted: ${id} for user ${userId}`);

    return { success: true };
  }

  async getUserLocations(userId: number): Promise<Location[]> {
    return Location.query()
      .where('user_id', userId)
      .withGraphFetched('photos')
      .orderBy('visit_date', 'desc');
  }
}
