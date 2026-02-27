import axios from "axios";
import { API_URL, getToken } from "./auth";

export interface AppPhoto {
  id: string;
  url: string;
  provider: "local" | "immich";
  showOnMap: boolean;
  isCover: boolean;
  isHidden: boolean;
  externalId?: string;
  tripId?: string;
  metadata?: {
    size?: number;
    format?: string;
    width?: number;
    height?: number;
    exif?: any;
  };
}

export const mediaService = {
  getTripPhotos: async (tripId: string): Promise<AppPhoto[]> => {
    const token = getToken();
    if (!token) throw new Error("No token");
    const res = await axios.get(`${API_URL}/media/trips/${tripId}/photos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  getMapPhotos: async (): Promise<AppPhoto[]> => {
    const token = getToken();
    if (!token) throw new Error("No token");
    const res = await axios.get(`${API_URL}/media/map`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  uploadLocalPhoto: async (tripId: string, file: File): Promise<AppPhoto> => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(
      `${API_URL}/media/trips/${tripId}/photos`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  },

  linkExternalPhoto: async (
    tripId: string,
    url: string,
    externalId: string,
    exifInfo?: any
  ): Promise<AppPhoto> => {
    const token = getToken();
    const res = await axios.post(
      `${API_URL}/media/trips/${tripId}/photos`,
      {
        provider: "immich",
        url,
        externalId,
        showOnMap: false,
        exifInfo,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  updatePhoto: async (
    photoId: string,
    data: { showOnMap?: boolean; isCover?: boolean; isHidden?: boolean; metadata?: any }
  ): Promise<AppPhoto> => {
    const token = getToken();
    const res = await axios.patch(`${API_URL}/media/photos/${photoId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  deletePhoto: async (photoId: string): Promise<void> => {
    const token = getToken();
    await axios.delete(`${API_URL}/media/photos/${photoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
