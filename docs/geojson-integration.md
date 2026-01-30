# Manejo de GeoJSON para Países Visitados

## Backend: Django Models y Serializers

### models.py (app geo)
```python
from django.contrib.gis.db import models
from django.contrib.gis.geos import Polygon, MultiPolygon
import json

class Country(models.Model):
    iso_alpha2 = models.CharField(max_length=2, unique=True)
    iso_alpha3 = models.CharField(max_length=3, unique=True)
    name = models.CharField(max_length=100)
    continent = models.CharField(max_length=50)
    geometry = models.MultiPolygonField()  # PostGIS para polígonos
    
    def to_geojson_feature(self):
        """Convertir país a feature GeoJSON"""
        return {
            "type": "Feature",
            "id": self.iso_alpha2,
            "geometry": json.loads(self.geometry.geojson),
            "properties": {
                "iso_alpha2": self.iso_alpha2,
                "iso_alpha3": self.iso_alpha3,
                "name": self.name,
                "continent": self.continent
            }
        }

class UserCountryStatus(models.Model):
    """Estado de países por usuario"""
    STATUS_CHOICES = [
        ('visited', 'Visited'),
        ('planned', 'Planned'),
        ('wishlist', 'Wishlist')
    ]
    
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'country', 'status']
```

### views.py (app geo)
```python
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import Distance as DistanceMeasure
from .models import Country, UserCountryStatus
from trips.models import Location

class CountriesGeoJSONView(APIView):
    """Endpoint para obtener GeoJSON de todos los países"""
    
    def get(self, request):
        # Obtener estados de países del usuario
        user_countries = UserCountryStatus.objects.filter(
            user=request.user
        ).select_related('country')
        
        # Crear diccionario de estados
        country_status = {}
        for uc in user_countries:
            country_status[uc.country.iso_alpha2] = uc.status
        
        # Generar GeoJSON con estados
        features = []
        for country in Country.objects.all():
            feature = country.to_geojson_feature()
            feature['properties']['status'] = country_status.get(
                country.iso_alpha2, 'default'
            )
            features.append(feature)
        
        return Response({
            "type": "FeatureCollection",
            "features": features
        })

class UserCountriesView(APIView):
    """Endpoint para obtener países del usuario por estado"""
    
    def get(self, request):
        user_countries = UserCountryStatus.objects.filter(
            user=request.user
        ).select_related('country')
        
        result = {
            'visited': [],
            'planned': [],
            'wishlist': []
        }
        
        for uc in user_countries:
            result[uc.status].append(uc.country.iso_alpha2)
        
        return Response(result)

class UpdateCountryStatusView(APIView):
    """Endpoint para actualizar estado de un país"""
    
    def post(self, request):
        country_code = request.data.get('countryCode')
        status = request.data.get('status')
        
        if not country_code or not status:
            return Response(
                {'error': 'countryCode and status are required'},
                status=400
            )
        
        try:
            country = Country.objects.get(iso_alpha2=country_code)
            
            # Eliminar estado anterior si existe
            UserCountryStatus.objects.filter(
                user=request.user,
                country=country
            ).delete()
            
            # Crear nuevo estado
            UserCountryStatus.objects.create(
                user=request.user,
                country=country,
                status=status
            )
            
            return Response({'success': True})
            
        except Country.DoesNotExist:
            return Response(
                {'error': 'Country not found'},
                status=404
            )
```

### urls.py
```python
from django.urls import path
from .views import (
    CountriesGeoJSONView,
    UserCountriesView,
    UpdateCountryStatusView
)

urlpatterns = [
    path('countries/', CountriesGeoJSONView.as_view(), name='countries-geojson'),
    path('user-countries/', UserCountriesView.as_view(), name='user-countries'),
    path('countries/update/', UpdateCountryStatusView.as_view(), name='update-country'),
]
```

## Frontend: Integración con MapLibre

### services/geo.ts
```typescript
export interface CountryFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    iso_alpha2: string;
    iso_alpha3: string;
    name: string;
    continent: string;
    status: 'visited' | 'planned' | 'wishlist' | 'default';
  };
}

export interface CountriesGeoJSON {
  type: 'FeatureCollection';
  features: CountryFeature[];
}

class GeoService {
  private baseUrl = '/api/geo';
  
  async getCountriesGeoJSON(): Promise<CountriesGeoJSON> {
    const response = await fetch(`${this.baseUrl}/countries/`);
    if (!response.ok) {
      throw new Error('Failed to load countries data');
    }
    return response.json();
  }
  
  async getUserCountries(): Promise<{
    visited: string[];
    planned: string[];
    wishlist: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/user-countries/`);
    if (!response.ok) {
      throw new Error('Failed to load user countries');
    }
    return response.json();
  }
  
  async updateCountryStatus(
    countryCode: string,
    status: 'visited' | 'planned' | 'wishlist'
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/countries/update/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': this.getCSRFToken()
      },
      body: JSON.stringify({ countryCode, status })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update country status');
    }
  }
  
  private getCSRFToken(): string {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    
    return '';
  }
}

export const geoService = new GeoService();
```

### components/map/CountryLayer.svelte
```typescript
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Map } from 'maplibre-gl';
  import { geoService } from '$lib/services/geo';
  import { COUNTRY_STATUS_COLORS } from '$lib/utils/constants';
  
  export let map: Map;
  export let onCountryClick: (feature: any) => void;
  
  let countriesLoaded = false;
  
  onMount(async () => {
    await loadCountriesLayer();
    setupEventListeners();
  });
  
  async function loadCountriesLayer() {
    try {
      const geoData = await geoService.getCountriesGeoJSON();
      
      // Añadir fuente de países
      map.addSource('countries', {
        type: 'geojson',
        data: geoData,
        generateId: true
      });
      
      // Capa de relleno con colores dinámicos
      map.addLayer({
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': [
            'match',
            ['get', 'status'],
            'visited', COUNTRY_STATUS_COLORS.visited,
            'planned', COUNTRY_STATUS_COLORS.planned,
            'wishlist', COUNTRY_STATUS_COLORS.wishlist,
            COUNTRY_STATUS_COLORS.default
          ],
          'fill-outline-color': '#0f3460',
          'fill-opacity': 0.8
        }
      });
      
      // Capa de bordes
      map.addLayer({
        id: 'countries-borders',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': '#0f3460',
          'line-width': 0.5,
          'line-opacity': 0.8
        }
      });
      
      // Capa hover
      map.addLayer({
        id: 'countries-hover',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': '#e94560',
          'fill-opacity': 0.3
        },
        filter: ['==', false, false]
      });
      
      countriesLoaded = true;
      
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  }
  
  function setupEventListeners() {
    // Click en países
    map.on('click', 'countries-fill', (e) => {
      if (e.features.length > 0) {
        onCountryClick(e.features[0]);
      }
    });
    
    // Hover en países
    map.on('mousemove', 'countries-fill', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      
      if (e.features.length > 0) {
        map.setFilter('countries-hover', ['==', ['id'], e.features[0].id]);
      }
    });
    
    map.on('mouseleave', 'countries-fill', () => {
      map.getCanvas().style.cursor = '';
      map.setFilter('countries-hover', ['==', false, false]);
    });
  }
  
  // Función para actualizar colores dinámicamente
  export function updateCountryColors() {
    if (!countriesLoaded || !map) return;
    
    // Forzar repintado de la capa
    map.setPaintProperty('countries-fill', 'fill-opacity', 0.8);
  }
  
  onDestroy(() => {
    if (map && map.getLayer('countries-fill')) {
      map.removeLayer('countries-fill');
      map.removeLayer('countries-borders');
      map.removeLayer('countries-hover');
      map.removeSource('countries');
    }
  });
</script>
```

### components/map/CountryPopup.svelte
```typescript
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { geoService } from '$lib/services/geo';
  
  export let feature: any;
  export let coordinates: [number, number];
  
  const dispatch = createEventDispatcher();
  
  $: countryName = feature?.properties?.name || '';
  $: countryCode = feature?.properties?.iso_alpha2 || '';
  $: currentStatus = feature?.properties?.status || 'default';
  
  async function handleStatusChange(newStatus: string) {
    try {
      await geoService.updateCountryStatus(
        countryCode,
        newStatus as 'visited' | 'planned' | 'wishlist'
      );
      
      // Notificar al componente padre
      dispatch('statusChanged', {
        countryCode,
        newStatus
      });
      
    } catch (error) {
      console.error('Error updating country status:', error);
    }
  }
</script>

<div class="country-popup">
  <div class="popup-header">
    <h3>{countryName}</h3>
    <span class="country-code">{countryCode}</span>
  </div>
  
  <div class="popup-content">
    <p class="current-status">
      Estado actual: <strong>{currentStatus}</strong>
    </p>
    
    <div class="status-actions">
      <button 
        class="status-btn visited"
        class:active={currentStatus === 'visited'}
        on:click={() => handleStatusChange('visited')}
      >
        ✅ Visitado
      </button>
      
      <button 
        class="status-btn planned"
        class:active={currentStatus === 'planned'}
        on:click={() => handleStatusChange('planned')}
      >
        📅 Planeado
      </button>
      
      <button 
        class="status-btn wishlist"
        class:active={currentStatus === 'wishlist'}
        on:click={() => handleStatusChange('wishlist')}
      >
        ⭐ Deseado
      </button>
    </div>
  </div>
</div>

<style>
  .country-popup {
    background: rgba(26, 26, 46, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 217, 255, 0.3);
    border-radius: 8px;
    color: #ffffff;
    padding: 16px;
    min-width: 200px;
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .popup-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  .country-code {
    background: rgba(0, 217, 255, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .current-status {
    margin: 8px 0;
    font-size: 14px;
  }
  
  .status-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }
  
  .status-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
  }
  
  .status-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  .status-btn.active {
    background: rgba(0, 217, 255, 0.3);
    border-color: #00d9ff;
  }
  
  .status-btn.visited.active {
    background: rgba(0, 217, 255, 0.3);
  }
  
  .status-btn.planned.active {
    background: rgba(255, 215, 0, 0.3);
    border-color: #ffd700;
  }
  
  .status-btn.wishlist.active {
    background: rgba(255, 107, 107, 0.3);
    border-color: #ff6b6b;
  }
</style>
```

## Flujo de Integración

1. **Carga Inicial**: El mapa carga el GeoJSON de todos los países desde `/api/geo/countries/`
2. **Coloreado Dinámico**: Cada feature incluye el estado del usuario (`visited`, `planned`, `wishlist`)
3. **Interacción**: Click en país muestra popup para cambiar estado
4. **Actualización en Tiempo Real**: Cambio de estado actualiza el mapa inmediatamente
5. **Persistencia**: Estado se guarda en la base de datos PostgreSQL con PostGIS

## Optimizaciones

- **Caching**: GeoJSON de países cacheado (cambia raramente)
- **Lazy Loading**: Cargar detalles de países bajo demanda
- **Clustering**: Agrupar ubicaciones cercanas para mejor rendimiento
- **Vector Tiles**: Para producción, usar vector tiles en lugar de GeoJSON completo