import { API_URL } from "$lib/services/auth";

/**
 * Returns the correct image URL for a trip cover.
 * If coverImage is already a full URL (starts with http), use it directly.
 * Otherwise, treat it as a photo ID and construct the API URL.
 */
export function getTripCoverUrl(trip: { coverImage: string; coverImageUrl?: string }): string | null {
  if (trip.coverImageUrl) return trip.coverImageUrl;
  if (trip.coverImage?.startsWith("http")) return trip.coverImage;
  if (trip.coverImage && trip.coverImage.length > 5) {
    return `${API_URL}/media/photos/${trip.coverImage}/image`;
  }
  return null;
}

/**
 * Returns a displayable URL for a location image.
 * The images array may contain full URLs (demo mode) or photo IDs (API mode).
 */
export function getLocationImageUrl(image: string): string {
  if (image?.startsWith("http")) return image;
  if (image && image.length > 5) return `${API_URL}/media/photos/${image}/image`;
  return "";
}

/**
 * Returns the image URL for a photo object. Works with AppPhoto and DemoPhoto.
 */
export function getPhotoUrl(photo: { url?: string; id: string; provider?: string }): string {
  if (photo.url?.startsWith("http")) return photo.url;
  if (photo.url) return `${API_URL}${photo.url}`;
  return `${API_URL}/media/photos/${photo.id}/image`;
}

/**
 * Checks if a string is a valid, displayable image URL
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("http")) return true;
  if (url.length > 5) return true; // Could be a valid ID
  return false;
}
