import axios from 'axios';
import { API_URL, getToken } from './auth';

export const tripsService = {
  async createTrip(tripData: any) {
    const token = getToken();
    if (!token) throw new Error('No authentication token found');

    const response = await axios.post(`${API_URL}/trips`, tripData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  },

  // Aquí se podrían añadir getTrips, updateTrip, deleteTrip en el futuro si son necesarios
};
