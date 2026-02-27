import { Injectable } from '@nestjs/common';
import { Trip } from './entities/trip.entity';

@Injectable()
export class TripsService {
  async createTrip(userId: number, createData: any): Promise<Trip> {
    const { v4: uuidv4 } = require('uuid');

    let mappedStatus: 'Planificado' | 'En curso' | 'Completado' | 'Cancelado' = 'Planificado';
    if (['Planificado', 'En curso', 'Completado', 'Cancelado'].includes(createData.status)) {
      mappedStatus = createData.status;
    }

    const backendPayload = {
      id: uuidv4(),
      userId,
      name: createData.name || 'Sin nombre',
      description: createData.description,
      startDate: createData.startDate,
      endDate: createData.endDate,
      status: mappedStatus,
      countries: Array.isArray(createData.countries) ? createData.countries : [],
      currency: 'EUR',
      coverImage: createData.coverImage
    };

    const trip = await Trip.query().insert(backendPayload);

    return trip;
  }

  async getUserTrips(userId: number): Promise<Trip[]> {
    return Trip.query().where('userId', userId);
  }

  async updateTrip(userId: number, id: string, updateData: any): Promise<Trip> {
    const trip = await Trip.query().findOne({ id, userId });

    if (!trip) {
      throw new Error('Trip not found or unauthorized');
    }

    const updatedTrip = await Trip.query().patchAndFetchById(id, {
      name: updateData.name,
      description: updateData.description,
      startDate: updateData.startDate,
      endDate: updateData.endDate,
      status: updateData.status,
      countries: updateData.countries,
      coverImage: updateData.coverImage
    });

    return updatedTrip;
  }
}
