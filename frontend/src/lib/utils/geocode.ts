/**
 * Geocoding via OpenStreetMap Nominatim (free, no API key).
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 * - Max 1 request per second; use a descriptive User-Agent.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
  "TravelMap/1.0 (https://github.com/travelmap; contact@example.com)";

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocode(query: string): Promise<GeocodeResult | null> {
  if (!query?.trim()) return null;

  const params = new URLSearchParams({
    q: query.trim(),
    format: "json",
    limit: "1",
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const first = data[0];
  const lat = parseFloat(first.lat);
  const lon = parseFloat(first.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  return {
    lat,
    lng: lon,
    displayName: first.display_name ?? `${lat}, ${lon}`,
  };
}
