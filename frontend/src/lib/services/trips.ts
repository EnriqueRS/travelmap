import axios from "axios";
import { API_URL, getToken } from "./auth";
import { trips } from "$lib/stores/data";

/** True when the user has an auth token (backend mode); false in demo mode. */
function isAuthenticated(): boolean {
  return !!getToken();
}

export const tripsService = {
  async createTrip(tripData: any) {
    if (!isAuthenticated()) {
      // Client-side: create a trip with a UUID and add it to the local
      // persisted store. No backend round-trip needed.
      const newTrip = {
        ...tripData,
        id: crypto.randomUUID(),
        userId: "local_user",
        locations: tripData.locations || [],
      };
      trips.update((current) => [...current, newTrip]);
      return newTrip;
    }

    const token = getToken();
    const response = await axios.post(`${API_URL}/trips`, tripData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async updateTrip(id: string, tripData: any) {
    if (!isAuthenticated()) {
      trips.update((all) =>
        all.map((t) => (t.id === id ? { ...t, ...tripData } : t)),
      );
      return { id, ...tripData };
    }

    const token = getToken();
    const response = await axios.patch(`${API_URL}/trips/${id}`, tripData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async deleteTrip(id: string) {
    if (!isAuthenticated()) {
      trips.update((current) => current.filter((t) => t.id !== id));
      return { success: true };
    }

    const token = getToken();
    const response = await axios.delete(`${API_URL}/trips/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
