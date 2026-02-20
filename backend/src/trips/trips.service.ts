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
}
