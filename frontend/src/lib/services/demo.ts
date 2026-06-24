// frontend/src/lib/services/demo.ts
// Client-side (localStorage) operations for demo mode.
// These mirror the API operations but work without a backend, so the
// entire app is usable when the user is not authenticated.

import { browser } from "$app/environment";
import { trips } from "$lib/stores/data";
import { demoPhotos } from "$lib/stores/demoData";
import type { DemoPhoto } from "$lib/stores/demoData";
import { get } from "svelte/store";
import { getToken } from "./auth";

const DEMO_PHOTOS_KEY = "travelmap_demo_photos";
const SEEDED_KEY = "travelmap_demo_seeded_v2";
const MAX_PHOTO_SIZE_MB = 5;

// ---------------------------------------------------------------------------
// localStorage helpers for demo photos
// ---------------------------------------------------------------------------

/** Read all demo photos persisted in localStorage. Seeds from static data on first call. */
function getDemoPhotos(): DemoPhoto[] {
  if (!browser) return [];
  try {
    // Check if we need to re-seed (version changed or first load)
    const seeded = localStorage.getItem(SEEDED_KEY);
    if (!seeded && !getToken()) {
      // Seed fresh demo photos (overwrites any stale data from prior version)
      localStorage.setItem(DEMO_PHOTOS_KEY, JSON.stringify(demoPhotos));
      localStorage.setItem(SEEDED_KEY, "true");
      return [...demoPhotos];
    }

    const stored = localStorage.getItem(DEMO_PHOTOS_KEY);
    if (stored) {
      return JSON.parse(stored) as DemoPhoto[];
    }

    // Fallback: no stored data but already seeded — return empty
    return [];
  } catch {
    return [];
  }
}

/** Persist the full demo-photos array back to localStorage. Catches quota errors gracefully. */
function saveDemoPhotos(photos: DemoPhoto[]) {
  if (browser) {
    try {
      localStorage.setItem(DEMO_PHOTOS_KEY, JSON.stringify(photos));
    } catch (e) {
      console.error("Failed to save demo photos (quota exceeded?)", e);
    }
  }
}

/**
 * Convert a browser File to a base64 data URL.
 * Rejects files larger than MAX_PHOTO_SIZE_MB.
 */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      reject(new Error(`File too large (max ${MAX_PHOTO_SIZE_MB}MB)`));
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("Only image files are allowed"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Demo CRUD service
// ---------------------------------------------------------------------------

export const demoService = {
  /** Get all photos belonging to a trip. */
  getTripPhotos(tripId: string): DemoPhoto[] {
    return getDemoPhotos().filter((p) => p.tripId === tripId);
  },

  /** Get all photos that should appear as map markers. */
  getMapPhotos(): DemoPhoto[] {
    return getDemoPhotos().filter(
      (p) => p.showOnMap && p.metadata?.exif?.latitude,
    );
  },

  /**
   * Upload one or more local File objects as demo photos.
   * Files are stored as base64 data URLs inside localStorage, so they
   * survive page refreshes in demo mode.
   */
  async uploadLocalPhoto(
    tripId: string,
    files: File | File[],
  ): Promise<DemoPhoto[]> {
    const fileArray = Array.isArray(files) ? files : [files];
    const newPhotos: DemoPhoto[] = [];

    for (const file of fileArray) {
      const id = `demo-photo-${crypto.randomUUID()}`;
      const dataUrl = await fileToDataURL(file);
      const photo: DemoPhoto = {
        id,
        url: dataUrl,
        thumbUrl: dataUrl,
        provider: "demo",
        showOnMap: false,
        isCover: false,
        isHidden: false,
        tripId,
        metadata: {},
      };
      newPhotos.push(photo);
    }

    const all = getDemoPhotos();
    saveDemoPhotos([...all, ...newPhotos]);
    return newPhotos;
  },

  /**
   * Link an external photo (e.g. from Immich or any public URL).
   * In demo mode we simply persist a metadata record pointing at the
   * remote URL.
   */
  /** Validates that a URL is a safe http(s) image URL. */
  isSafeImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  async linkExternalPhoto(
    tripId: string,
    url: string,
    externalId: string,
    exifInfo?: any,
  ): Promise<DemoPhoto> {
    if (!this.isSafeImageUrl(url)) {
      throw new Error("Invalid or unsafe image URL");
    }
    const id = `demo-ext-${crypto.randomUUID()}`;
    const photo: DemoPhoto = {
      id,
      url,
      thumbUrl: url,
      provider: "demo",
      showOnMap: false,
      isCover: false,
      isHidden: false,
      tripId,
      externalId,
      metadata: exifInfo ? { exif: exifInfo } : {},
    };
    const all = getDemoPhotos();
    saveDemoPhotos([...all, photo]);
    return photo;
  },

  /** Update one or more properties on a single photo. */
  async updatePhoto(photoId: string, data: any): Promise<DemoPhoto> {
    const all = getDemoPhotos();
    const idx = all.findIndex((p) => p.id === photoId);
    if (idx === -1) throw new Error("Photo not found");

    all[idx] = { ...all[idx], ...data };
    saveDemoPhotos(all);
    return all[idx];
  },

  /** Apply the same patch to multiple photos at once. */
  async batchUpdatePhotos(photoIds: string[], data: any): Promise<DemoPhoto[]> {
    const all = getDemoPhotos();
    const updated: DemoPhoto[] = [];
    for (const id of photoIds) {
      const idx = all.findIndex((p) => p.id === id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...data };
        updated.push(all[idx]);
      }
    }
    saveDemoPhotos(all);
    return updated;
  },

  /** Delete a single photo from localStorage. */
  async deletePhoto(photoId: string): Promise<void> {
    const all = getDemoPhotos();
    saveDemoPhotos(all.filter((p) => p.id !== photoId));
  },

  /**
   * Convenience: read the trips store synchronously.
   * Not a photo operation, but useful for callers that want a single
   * import for all demo-mode utilities.
   */
  getTripsSnapshot() {
    return get(trips);
  },
};
