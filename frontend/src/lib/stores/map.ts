// stores/map.ts - Estado global del mapa
import { writable, derived } from 'svelte/store';
import type { Map } from 'maplibre-gl';

// Tipos para el store
export type CountryStatus = 'visited' | 'planned' | 'wishlist';

export interface MapState {
  map: Map | null;
  currentZoom: number;
  currentCenter: [number, number];
  isDarkMode: boolean;
  selectedCountry: string | null;
  selectedLocation: string | null;
}

export interface CountriesState {
  visited: string[];
  planned: string[];
  wishlist: string[];
  loading: boolean;
  error: string | null;
}

export interface LocationsState {
  locations: Array<{
    id: string;
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    rating?: number;
    category?: string;
    visitDate?: string;
  }>;
  loading: boolean;
  error: string | null;
}

// Store principal del mapa
export const mapStore = writable<MapState>({
  map: null,
  currentZoom: 1.5,
  currentCenter: [0, 20],
  isDarkMode: true,
  selectedCountry: null,
  selectedLocation: null
});

// Store de países visitados
export const countriesStore = writable<CountriesState>({
  visited: [],
  planned: [],
  wishlist: [],
  loading: false,
  error: null
});

// Store de ubicaciones
export const locationsStore = writable<LocationsState>({
  locations: [],
  loading: false,
  error: null
});

// Acciones para el store de países
export const countriesActions = {
  async loadCountries() {
    countriesStore.update(state => ({ ...state, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/trips/user-countries/');
      const data = await response.json();
      
      countriesStore.set({
        visited: data.visited || [],
        planned: data.planned || [],
        wishlist: data.wishlist || [],
        loading: false,
        error: null
      });
    } catch (error) {
      countriesStore.update(state => ({
        ...state,
        loading: false,
        error: 'Error loading countries data'
      }));
    }
  },
  
  async updateCountryStatus(countryCode: string, status: CountryStatus) {
    try {
      const response = await fetch('/api/trips/countries/update/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ countryCode, status })
      });
      
      if (response.ok) {
        countriesStore.update(state => {
          // Remover de otros estados
          const visited = state.visited.filter(code => code !== countryCode);
          const planned = state.planned.filter(code => code !== countryCode);
          const wishlist = state.wishlist.filter(code => code !== countryCode);
          
          // Añadir al nuevo estado
          if (status === 'visited') {
            visited.push(countryCode);
          } else if (status === 'planned') {
            planned.push(countryCode);
          } else if (status === 'wishlist') {
            wishlist.push(countryCode);
          }
          
          return { visited, planned, wishlist, loading: false, error: null };
        });
      }
    } catch (error) {
      console.error('Error updating country status:', error);
    }
  }
};

// Acciones para el store de ubicaciones
export const locationsActions = {
  async loadLocations(tripId?: string) {
    locationsStore.update(state => ({ ...state, loading: true, error: null }));
    
    try {
      const url = tripId 
        ? `/api/locations/?trip=${tripId}`
        : '/api/locations/user/';
      
      const response = await fetch(url);
      const data = await response.json();
      
      locationsStore.set({
        locations: data.results || data || [],
        loading: false,
        error: null
      });
    } catch (error) {
      locationsStore.update(state => ({
        ...state,
        loading: false,
        error: 'Error loading locations'
      }));
    }
  },
  
  async addLocation(location: {
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    rating?: number;
    category?: string;
    visitDate?: string;
    tripId?: string;
  }) {
    try {
      const response = await fetch('/api/locations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(location)
      });
      
      if (response.ok) {
        const newLocation = await response.json();
        
        locationsStore.update(state => ({
          locations: [...state.locations, newLocation],
          loading: false,
          error: null
        }));
        
        return newLocation;
      }
    } catch (error) {
      console.error('Error adding location:', error);
      throw error;
    }
  }
};

// Acciones para el store del mapa
export const mapActions = {
  setMap(map: Map) {
    mapStore.update(state => ({ ...state, map }));
  },
  
  flyToCountry(countryCode: string) {
    mapStore.subscribe(state => {
      if (state.map) {
        // Buscar coordenadas del país y hacer zoom
        // Esto podría venir de una API de geocodificación
        state.map.flyTo({
          center: [0, 0], // Placeholder - debería buscar coords reales
          zoom: 4,
          essential: true
        });
      }
    });
  },
  
  setDarkMode(isDark: boolean) {
    mapStore.update(state => ({ ...state, isDarkMode: isDark }));
  },
  
  selectCountry(countryCode: string | null) {
    mapStore.update(state => ({ ...state, selectedCountry: countryCode }));
  },
  
  selectLocation(locationId: string | null) {
    mapStore.update(state => ({ ...state, selectedLocation: locationId }));
  }
};