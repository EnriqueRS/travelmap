// utils/constants.ts - Constantes para la aplicación

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const MAP_STYLES = {
  DARK: "https://api.maptiler.com/maps/streets-v2/style.json?key=YOUR_API_KEY",
  LIGHT:
    "https://api.maptiler.com/maps/streets-v2-light/style.json?key=YOUR_API_KEY",
  SATELLITE:
    "https://api.maptiler.com/maps/satellite/style.json?key=YOUR_API_KEY",
  OUTDOORS:
    "https://api.maptiler.com/maps/outdoor-v2/style.json?key=YOUR_API_KEY",
};

export const MAP_CONTROLS = {
  NAVIGATION: "top-right",
  ATTRIBUTION: "bottom-left",
  SCALE: "bottom-left",
};

export const COUNTRY_STATUS_COLORS = {
  visited: "#00d9ff", // Cyan
  planned: "#ffd700", // Gold
  wishlist: "#ff6b6b", // Red
  default: "#1a1a2e", // Dark gray
};

export const LOCATION_CATEGORIES = [
  { value: "city", label: "Ciudad", icon: "🏙️" },
  { value: "layover", label: "Ciudad de escala", icon: "✈️" },
  { value: "landmark", label: "Monumento", icon: "🏛️" },
  { value: "nature", label: "Naturaleza", icon: "🏔️" },
  { value: "restaurant", label: "Restaurante", icon: "🍽️" },
  { value: "accommodation", label: "Alojamiento", icon: "🏨" },
  { value: "transport", label: "Transporte", icon: "🚗" },
  { value: "activity", label: "Actividad", icon: "🎯" },
  { value: "shopping", label: "Compras", icon: "🛍️" },
  { value: "nightlife", label: "Vida Nocturna", icon: "🌃" },
  { value: "cultural", label: "Cultural", icon: "🎭" },
];

export const TRIP_STATUS = {
  PLANNED: "planned",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const PHOTO_FORMATS = {
  THUMBNAIL: { width: 300, height: 200, quality: 80 },
  MEDIUM: { width: 800, height: 600, quality: 85 },
  LARGE: { width: 1920, height: 1080, quality: 90 },
};

export const DATE_FORMATS = {
  DISPLAY: "DD/MM/YYYY",
  API: "YYYY-MM-DD",
  DATETIME_DISPLAY: "DD/MM/YYYY HH:mm",
  DATETIME_API: "YYYY-MM-DD HH:mm:ss",
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const CACHE_KEYS = {
  USER_PROFILE: "user_profile",
  TRIPS_LIST: "trips_list",
  COUNTRIES_DATA: "countries_data",
  MAP_STATE: "map_state",
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  MAP: "/map",
  TRIPS: "/trips",
  TRIP_NEW: "/trips/new",
  TRIP_EDIT: "/trips/[id]/edit",
  PROFILE: "/profile",
  SETTINGS: "/settings",
};

export const BREAKPOINTS = {
  SM: "640px",
  MD: "768px",
  LG: "1024px",
  XL: "1280px",
  XXL: "1536px",
};

export const ANIMATIONS = {
  DURATION_FAST: "150ms",
  DURATION_NORMAL: "300ms",
  DURATION_SLOW: "500ms",
  EASING_EASE: "ease",
  EASING_IN: "ease-in",
  EASING_OUT: "ease-out",
  EASING_IN_OUT: "ease-in-out",
};
