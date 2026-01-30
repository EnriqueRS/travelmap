import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Tipos
export interface Location {
  id: string;
  name: string;
  description: string;
  country: string;
  category: 'Naturaleza' | 'Ciudad' | 'Playa' | 'Montaña' | 'Cultura' | 'Otro';
  coordinates: [number, number]; // [lat, lng]
  rating: number;
  visitedDate: string;
  images: string[];
  tripId?: string;
}

export interface Trip {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  countries: string[];
  status: 'Planificado' | 'En curso' | 'Completado';
  coverImage: string;
  locations: string[]; // IDs de ubicaciones
}

export interface UserProfile {
  name: string;
  bio: string;
  avatar: string;
  coverImage: string;
  stats: {
    countriesVisited: number;
    tripsCompleted: number;
    placesVisited: number;
    photosUploaded: number;
  };
  homeLocation?: {
    name: string;
    coordinates: [number, number];
  };
}

// Datos iniciales de ejemplo
const initialTrips: Trip[] = [
  {
    id: '1',
    name: 'Eurotrip 2024',
    description: 'Viaje de verano por las principales capitales europeas.',
    startDate: '2024-06-01',
    endDate: '2024-06-20',
    countries: ['España', 'Francia', 'Italia'],
    status: 'Completado',
    coverImage: 'europe-cover', // Placeholder key
    locations: ['1', '2']
  },
  {
    id: '2',
    name: 'Aventura en Japón',
    description: 'Explorando la cultura y gastronomía nipona.',
    startDate: '2025-04-10',
    endDate: '2025-04-25',
    countries: ['Japón'],
    status: 'Planificado',
    coverImage: 'japan-cover', // Placeholder key
    locations: []
  }
];

const initialLocations: Location[] = [
  {
    id: '1',
    name: 'Torre Eiffel',
    description: 'El icono de París y una de las estructuras más famosas del mundo.',
    country: 'Francia',
    category: 'Ciudad',
    coordinates: [48.8584, 2.2945],
    rating: 5,
    visitedDate: '2024-06-05',
    images: ['eiffel-1'],
    tripId: '1'
  },
  {
    id: '2',
    name: 'Coliseo Romano',
    description: 'El anfiteatro más grande construido durante el Imperio Romano.',
    country: 'Italia',
    category: 'Cultura',
    coordinates: [41.8902, 12.4922],
    rating: 5,
    visitedDate: '2024-06-12',
    images: ['colosseum-1'],
    tripId: '1'
  }
];

const initialProfile: UserProfile = {
  name: 'Alex Viajero',
  bio: 'Apasionado por descubrir nuevos lugares y culturas. Fotógrafo aficionado.',
  avatar: 'avatar-1',
  coverImage: 'profile-cover',
  stats: {
    countriesVisited: 12,
    tripsCompleted: 8,
    placesVisited: 45,
    photosUploaded: 120
  },
  homeLocation: {
    name: 'Madrid',
    coordinates: [40.4168, -3.7038]
  }
};

// Stores con persistencia
const createPersistentStore = <T>(key: string, startValue: T) => {
  const storedValue = browser ? localStorage.getItem(key) : null;
  const initial = storedValue ? JSON.parse(storedValue) : startValue;

  const store = writable<T>(initial);

  if (browser) {
    store.subscribe(value => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }

  return store;
};

export const trips = createPersistentStore<Trip[]>('travelmap_trips', initialTrips);
export const locations = createPersistentStore<Location[]>('travelmap_locations', initialLocations);
export const userProfile = createPersistentStore<UserProfile>('travelmap_profile', initialProfile);

// Helpers
export const getCategoryEmoji = (category: string) => {
  const map: Record<string, string> = {
    'Naturaleza': '🌲',
    'Ciudad': '🏙️',
    'Playa': '🏖️',
    'Montaña': '🏔️',
    'Cultura': '🏛️',
    'Otro': '📍'
  };
  return map[category] || '📍';
};

export const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    'Planificado': 'blue',
    'En curso': 'green',
    'Completado': 'gray'
  };
  return map[status] || 'gray';
};
