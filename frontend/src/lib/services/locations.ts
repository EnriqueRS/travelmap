import axios from "axios";
import { API_URL, getToken } from "./auth";

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
  async createLocation(locationData: any) {
    const token = getToken();
    if (!token) throw new Error("No authentication token found");

    const payload = {
      ...locationData,
      category: categoryToBackend[locationData.category] || "city",
    };

    const response = await axios.post(`${API_URL}/locations`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  },

  async updateLocation(id: string, locationData: any) {
    const token = getToken();
    if (!token) throw new Error("No authentication token found");

    const payload = {
      ...locationData,
      category: locationData.category
        ? categoryToBackend[locationData.category] || locationData.category
        : undefined,
    };

    // Convert frontend coordinates to backend latitude/longitude
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
    const token = getToken();
    if (!token) throw new Error("No authentication token found");

    const response = await axios.delete(`${API_URL}/locations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
};
