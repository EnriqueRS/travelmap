import axios from "axios";
import { API_URL, getToken } from "./auth";
import { locations } from "$lib/stores/data";
import type { Location } from "$lib/stores/data";
import { get } from "svelte/store";

/** True when the user has an auth token (backend mode); false in demo mode. */
function isAuthenticated(): boolean {
  return !!getToken();
}

// Maps frontend Spanish category names to backend English enum values
const categoryToBackend: Record<string, string> = {
  Monumento: "landmark",
  Naturaleza: "nature",
  Ciudad: "city",
  "Ciudad de escala": "transport",
  Playa: "nature",
  Montaña: "nature",
  Cultura: "cultural",
  Otro: "activity",
};

export const locationsService = {
  async getLocation(id: string) {
    if (!isAuthenticated()) {
      const all = get(locations);
      const loc = all.find((l) => l.id === id);
      if (!loc) throw new Error("Location not found");
      return loc;
    }

    const token = getToken();
    const response = await axios.get(`${API_URL}/locations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async createLocation(locationData: any) {
    if (!isAuthenticated()) {
      const newLoc: Location = {
        ...locationData,
        id: crypto.randomUUID(),
        category: locationData.category || "Otro",
        images: locationData.images || [],
      };
      // The caller is also responsible for updating the trips store if needed
      locations.update((locs) => [...locs, newLoc]);
      return newLoc;
    }

    const token = getToken();
    const payload: any = {
      ...locationData,
      category: categoryToBackend[locationData.category] || "city",
    };

    if (locationData.coordinates) {
      payload.latitude = locationData.coordinates[0];
      payload.longitude = locationData.coordinates[1];
      delete payload.coordinates;
    }

    const response = await axios.post(`${API_URL}/locations`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  },

  async updateLocation(id: string, locationData: any) {
    if (!isAuthenticated()) {
      locations.update((locs) =>
        locs.map((l) => (l.id === id ? { ...l, ...locationData } : l)),
      );
      return { id, ...locationData };
    }

    const token = getToken();
    const payload: any = { ...locationData };
    if (locationData.category) {
      payload.category =
        categoryToBackend[locationData.category] || locationData.category;
    }
    if (locationData.coordinates) {
      payload.latitude = locationData.coordinates[0];
      payload.longitude = locationData.coordinates[1];
      delete payload.coordinates;
    }

    const response = await axios.patch(`${API_URL}/locations/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  },

  async deleteLocation(id: string) {
    if (!isAuthenticated()) {
      locations.update((locs) => locs.filter((l) => l.id !== id));
      return { success: true };
    }

    const token = getToken();
    const response = await axios.delete(`${API_URL}/locations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
