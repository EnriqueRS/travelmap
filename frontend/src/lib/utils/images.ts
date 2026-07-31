import { API_URL, getToken } from "$lib/services/auth";

/** UUID regex — solo aceptamos IDs con este formato para fotos del backend */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Append auth token as query param so <img> tags can authenticate */
function addToken(url: string): string {
  const token = getToken();
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

/**
 * Returns the correct image URL for a trip cover.
 * If coverImage is already a full URL (starts with http), use it directly.
 * Otherwise, treat it as a photo ID and construct the API URL.
 */
export function getTripCoverUrl(trip: { coverImage: string; coverImageUrl?: string }): string | null {
  if (trip.coverImageUrl) return trip.coverImageUrl;
  if (trip.coverImage?.startsWith("http")) return trip.coverImage;
  // Solo construir URL si coverImage es un UUID válido
  if (trip.coverImage && UUID_RE.test(trip.coverImage.trim())) {
    return addToken(`${API_URL}/media/photos/${trip.coverImage.trim()}/image`);
  }
  return null;
}

/**
 * Returns a displayable URL for a location image.
 * The images array may contain full URLs (demo mode) or photo IDs (API mode).
 */
export function getLocationImageUrl(image: string): string {
  if (image?.startsWith("http")) return image;
  if (image && UUID_RE.test(image.trim())) return addToken(`${API_URL}/media/photos/${image.trim()}/image`);
  return "";
}

/**
 * Returns the image URL for a photo object. Works with AppPhoto and DemoPhoto.
 * Immich photos must go through the backend proxy which adds the x-api-key header,
 * because browsers cannot send custom headers with <img> tags.
 */
export function getPhotoUrl(photo: { url?: string; id: string; provider?: string }): string {
  if (photo.provider === 'immich') {
    return addToken(`${API_URL}/media/photos/${photo.id}/image`);
  }
  if (photo.url?.startsWith("http")) return photo.url;
  if (photo.url) return addToken(`${API_URL}${photo.url}`);
  // Solo si el id es un UUID válido
  if (UUID_RE.test(photo.id)) return addToken(`${API_URL}/media/photos/${photo.id}/image`);
  return "";
}

/**
 * Checks if a string is a valid, displayable image URL
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("http")) return true;
  return UUID_RE.test(url);
}
