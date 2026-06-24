import axios from "axios";
import { API_URL, getToken } from "./auth";
import { demoService } from "./demo";

export interface AppPhoto {
  id: string;
  url: string;
  provider: "local" | "immich" | "demo";
  showOnMap: boolean;
  isCover: boolean;
  isHidden: boolean;
  externalId?: string;
  tripId?: string;
  locationId?: string;
  metadata?: {
    size?: number;
    format?: string;
    width?: number;
    height?: number;
    exif?: any;
  };
}

/** True when the user has an auth token (backend mode); false in demo mode. */
function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Map a DemoPhoto (localStorage-internal) to the normalised AppPhoto shape
 * used by the rest of the UI.
 */
function demoPhotoToAppPhoto(p: ReturnType<typeof demoService.getTripPhotos>[number]): AppPhoto {
  return {
    id: p.id,
    url: p.url,
    provider: "demo" as const,
    showOnMap: p.showOnMap,
    isCover: p.isCover,
    isHidden: p.isHidden,
    externalId: p.externalId,
    tripId: p.tripId,
    locationId: p.locationId,
    metadata: p.metadata,
  };
}

export const mediaService = {
  getTripPhotos: async (tripId: string): Promise<AppPhoto[]> => {
    if (!isAuthenticated()) {
      return demoService.getTripPhotos(tripId).map(demoPhotoToAppPhoto);
    }

    const token = getToken();
    const res = await axios.get(`${API_URL}/media/trips/${tripId}/photos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  getMapPhotos: async (): Promise<AppPhoto[]> => {
    if (!isAuthenticated()) {
      return demoService.getMapPhotos().map(demoPhotoToAppPhoto);
    }

    const token = getToken();
    const res = await axios.get(`${API_URL}/media/map`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  uploadLocalPhoto: async (
    tripId: string,
    files: File | File[],
  ): Promise<AppPhoto[] | AppPhoto> => {
    if (!isAuthenticated()) {
      const result = await demoService.uploadLocalPhoto(tripId, files);
      const mapped = result.map(demoPhotoToAppPhoto);
      return Array.isArray(files) ? mapped : mapped[0];
    }

    const token = getToken();
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach((file) => formData.append("file", file));

    const res = await axios.post(
      `${API_URL}/media/trips/${tripId}/photos`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res.data;
  },

  linkExternalPhoto: async (
    tripId: string,
    url: string,
    externalId: string,
    exifInfo?: any,
  ): Promise<AppPhoto> => {
    if (!isAuthenticated()) {
      const result = await demoService.linkExternalPhoto(
        tripId,
        url,
        externalId,
        exifInfo,
      );
      return demoPhotoToAppPhoto(result);
    }

    const token = getToken();
    const res = await axios.post(
      `${API_URL}/media/trips/${tripId}/photos`,
      { provider: "immich", url, externalId, showOnMap: false, exifInfo },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data;
  },

  updatePhoto: async (photoId: string, data: any): Promise<AppPhoto> => {
    if (!isAuthenticated()) {
      const result = await demoService.updatePhoto(photoId, data);
      return demoPhotoToAppPhoto(result);
    }

    const token = getToken();
    const res = await axios.patch(`${API_URL}/media/photos/${photoId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  deletePhoto: async (photoId: string): Promise<void> => {
    if (!isAuthenticated()) {
      await demoService.deletePhoto(photoId);
      return;
    }

    const token = getToken();
    await axios.delete(`${API_URL}/media/photos/${photoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  batchUpdatePhotos: async (
    photoIds: string[],
    data: any,
  ): Promise<AppPhoto[]> => {
    if (!isAuthenticated()) {
      const results = await demoService.batchUpdatePhotos(photoIds, data);
      return results.map(demoPhotoToAppPhoto);
    }

    const token = getToken();
    const res = await axios.patch(
      `${API_URL}/media/batch/photos`,
      { photoIds, data },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data;
  },
};
