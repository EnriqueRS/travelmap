import { Injectable } from '@nestjs/common';
import { Trip } from './entities/trip.entity';

@Injectable()
export class TripsService {
  // Función para calcular el estado dinámico basado en fechas
  private calculateDynamicStatus(startDate?: Date, endDate?: Date): 'Planificado' | 'En curso' | 'Completado' {
    if (!startDate || !endDate) {
      return 'Planificado';
    }
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Resetear la hora para comparar solo fechas
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (now < start) {
      return 'Planificado';
    } else if (now > end) {
      return 'Completado';
    } else {
      return 'En curso';
    }
  }

  async createTrip(userId: number, createData: any): Promise<Trip> {
    const { v4: uuidv4 } = require('uuid');

    // Si no se especifica status o no es 'Cancelado', calcular basado en fechas
    let finalStatus: 'Planificado' | 'En curso' | 'Completado' | 'Cancelado';
    if (createData.status === 'Cancelado') {
      finalStatus = 'Cancelado';
    } else {
      finalStatus = this.calculateDynamicStatus(createData.startDate, createData.endDate);
    }

    const backendPayload = {
      id: uuidv4(),
      userId,
      name: createData.name || 'Sin nombre',
      description: createData.description,
      startDate: createData.startDate,
      endDate: createData.endDate,
      status: finalStatus,
      countries: Array.isArray(createData.countries) ? createData.countries : [],
      provinces: Array.isArray(createData.provinces) ? createData.provinces : [],
      currency: 'EUR',
      coverImage: createData.coverImage
    };

    const trip = await Trip.query().insert(backendPayload);

    return trip;
  }

  async getUserTrips(userId: number): Promise<Trip[]> {
    const trips = await Trip.query().where('user_id', userId);
    
    // Recalcular el estado dinámico para cada viaje que no esté cancelado
    for (const trip of trips) {
      if (trip.status !== 'Cancelado') {
        trip.status = this.calculateDynamicStatus(trip.startDate, trip.endDate);
      }
    }
    
    return trips;
  }

  async updateTrip(userId: number, id: string, updateData: any): Promise<Trip> {
    const trip = await Trip.query().findOne({ id, user_id: userId });

    if (!trip) {
      throw new Error('Trip not found or unauthorized');
    }

    // Determinar el status a guardar
    let finalStatus: 'Planificado' | 'En curso' | 'Completado' | 'Cancelado';
    
    if (updateData.status === 'Cancelado') {
      // El usuario explícitamente quiere cancelar
      finalStatus = 'Cancelado';
    } else if (trip.status === 'Cancelado' && updateData.status === undefined) {
      // El viaje ya estaba cancelado y no se está cambiando el status, mantenerlo
      finalStatus = 'Cancelado';
    } else {
      // Calcular estado dinámico basado en fechas (usar nuevas fechas si se proporcionan)
      const startDate = updateData.startDate !== undefined ? updateData.startDate : trip.startDate;
      const endDate = updateData.endDate !== undefined ? updateData.endDate : trip.endDate;
      finalStatus = this.calculateDynamicStatus(startDate, endDate);
    }

    // Solo incluir status en el patch si ha cambiado o debemos forzarlo
    const patchData: any = {
      name: updateData.name,
      description: updateData.description,
      startDate: updateData.startDate,
      endDate: updateData.endDate,
      countries: updateData.countries,
      provinces: updateData.provinces,
      coverImage: updateData.coverImage
    };
    
    // Siempre actualizar el estado dinámico (excepto si es Cancelado y ya lo era)
    patchData.status = finalStatus;

    const updatedTrip = await Trip.query().patchAndFetchById(id, patchData);

    return updatedTrip;
  }

  async deleteTrip(userId: number, id: string): Promise<{ deleted: boolean }> {
    const trip = await Trip.query().findOne({ id, user_id: userId });

    if (!trip) {
      throw new Error('Trip not found or unauthorized');
    }

    // Import dynamically to avoid issues
    const { Location } = await import('../locations/entities/location.entity');

    // Delete all locations associated with this trip
    await Location.query().where('trip_id', id).delete();

    // Delete the trip
    await Trip.query().deleteById(id);

    return { deleted: true };
  }

}
