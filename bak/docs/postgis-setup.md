# Configuración de PostGIS para Datos Geográficos

## Instalación y Configuración

### 1. Instalar PostgreSQL con PostGIS
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis

# macOS con Homebrew
brew install postgresql
brew install postgis

# Iniciar PostgreSQL
sudo systemctl start postgresql
# o
brew services start postgresql
```

### 2. Crear Base de Datos con PostGIS
```sql
-- Conectarse a PostgreSQL
sudo -u postgres psql

-- Crear base de datos
CREATE DATABASE travelmap;

-- Conectarse a la nueva base de datos
\c travelmap

-- Habilitar extensiones PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar instalación
SELECT PostGIS_Version();
```

### 3. Configuración Django (settings/base.py)
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'travelmap',
        'USER': 'travelmap_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Instalaciones requeridas
INSTALLED_APPS = [
    # ... apps de Django
    'django.contrib.gis',
    # ... apps personalizadas
]

# Configuración de PostGIS
POSTGIS_VERSION = '3.0'
```

## Models con PostGIS

### apps/geo/models.py
```python
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point, Polygon, MultiPolygon
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import Distance as DistanceMeasure
import json

class Country(models.Model):
    """Modelo para países con geometría PostGIS"""
    iso_alpha2 = models.CharField(max_length=2, unique=True)
    iso_alpha3 = models.CharField(max_length=3, unique=True)
    name = models.CharField(max_length=100)
    continent = models.CharField(max_length=50)
    capital = models.CharField(max_length=100, blank=True)
    population = models.BigIntegerField(null=True, blank=True)
    area_sq_km = models.FloatField(null=True, blank=True)
    
    # Geometría PostGIS - MultiPolygon para países con islas
    geometry = models.MultiPolygonField(
        geography=True,  # Usar coordenadas geográficas
        spatial_index=True
    )
    
    # Centroide para zoom del mapa
    centroid = models.PointField(geography=True, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['iso_alpha2']),
            models.Index(fields=['continent']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.iso_alpha2})"
    
    def save(self, *args, **kwargs):
        # Calcular centroide automáticamente si no existe
        if not self.centroid and self.geometry:
            self.centroid = self.geometry.centroid
        super().save(*args, **kwargs)
    
    def to_geojson_feature(self, include_status=False, user=None):
        """Convertir a feature GeoJSON"""
        feature = {
            "type": "Feature",
            "id": self.iso_alpha2,
            "geometry": json.loads(self.geometry.geojson),
            "properties": {
                "iso_alpha2": self.iso_alpha2,
                "iso_alpha3": self.iso_alpha3,
                "name": self.name,
                "continent": self.continent,
                "capital": self.capital,
                "population": self.population,
                "area_sq_km": self.area_sq_km
            }
        }
        
        if include_status and user:
            # Añadir estado del usuario
            status = UserCountryStatus.objects.filter(
                user=user, 
                country=self
            ).first()
            
            feature["properties"]["status"] = status.status if status else "default"
        
        return feature
    
    def contains_point(self, longitude: float, latitude: float):
        """Verificar si un punto está dentro del país"""
        point = Point(longitude, latitude, srid=4326)
        return self.geometry.contains(point)
    
    def distance_to_point(self, longitude: float, latitude: float):
        """Calcular distancia a un punto"""
        point = Point(longitude, latitude, srid=4326)
        return self.geometry.distance(point)

class UserCountryStatus(models.Model):
    """Estado de países por usuario"""
    STATUS_CHOICES = [
        ('visited', 'Visited'),
        ('planned', 'Planned'),
        ('wishlist', 'Wishlist')
    ]
    
    user = models.ForeignKey(
        'auth.User', 
        on_delete=models.CASCADE,
        related_name='country_statuses'
    )
    country = models.ForeignKey(
        Country, 
        on_delete=models.CASCADE,
        related_name='user_statuses'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    visit_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'country']
        indexes = [
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.country.name} ({self.status})"

class Location(models.Model):
    """Ubicaciones con coordenadas PostGIS"""
    CATEGORIES = [
        ('city', 'City'),
        ('landmark', 'Landmark'),
        ('nature', 'Nature'),
        ('restaurant', 'Restaurant'),
        ('accommodation', 'Accommodation'),
        ('transport', 'Transport'),
        ('activity', 'Activity'),
        ('shopping', 'Shopping'),
        ('nightlife', 'Nightlife'),
        ('cultural', 'Cultural')
    ]
    
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='locations'
    )
    trip = models.ForeignKey(
        'trips.Trip',
        on_delete=models.CASCADE,
        related_name='locations',
        null=True,
        blank=True
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Coordenadas PostGIS
    coordinates = models.PointField(geography=True, spatial_index=True)
    
    # País calculado automáticamente
    country = models.ForeignKey(
        Country,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    visit_date = models.DateField(null=True, blank=True)
    rating = models.IntegerField(
        choices=[(i, f'{i} stars') for i in range(1, 6)],
        null=True,
        blank=True
    )
    category = models.CharField(max_length=50, choices=CATEGORIES, blank=True)
    
    # Metadatos
    elevation = models.FloatField(null=True, blank=True)  # metros
    timezone = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'visit_date']),
            models.Index(fields=['category']),
            models.Index(fields=['rating']),
        ]
    
    def save(self, *args, **kwargs):
        # Determinar país automáticamente basado en coordenadas
        if self.coordinates and not self.country:
            self.country = self.determine_country()
        super().save(*args, **kwargs)
    
    def determine_country(self):
        """Determinar el país basado en las coordenadas"""
        # Buscar país que contenga el punto
        countries = Country.objects.filter(
            geometry__contains=self.coordinates
        )
        return countries.first() if countries.exists() else None
    
    def nearby_locations(self, radius_km=50):
        """Obtener ubicaciones cercanas"""
        radius = DistanceMeasure(km=radius_km)
        return Location.objects.filter(
            coordinates__distance_lte=(self.coordinates, radius)
        ).exclude(id=self.id)
    
    def to_geojson_feature(self):
        """Convertir a feature GeoJSON"""
        return {
            "type": "Feature",
            "id": str(self.id),
            "geometry": {
                "type": "Point",
                "coordinates": [self.coordinates.x, self.coordinates.y]
            },
            "properties": {
                "id": str(self.id),
                "name": self.name,
                "description": self.description,
                "rating": self.rating,
                "category": self.category,
                "visitDate": self.visit_date.isoformat() if self.visit_date else None,
                "country": self.country.name if self.country else None
            }
        }
```

## Management Commands para Datos Geográficos

### apps/geo/management/commands/import_countries.py
```python
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import MultiPolygon
from django.contrib.gis.gdal import DataSource
import json
import requests
from apps.geo.models import Country

class Command(BaseCommand):
    help = 'Import countries from Natural Earth GeoJSON'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            default='https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/data/world.geojson',
            help='URL del GeoJSON de países'
        )
    
    def handle(self, *args, **options):
        source_url = options['source']
        
        self.stdout.write(f'Importing countries from {source_url}...')
        
        try:
            # Descargar GeoJSON
            response = requests.get(source_url)
            response.raise_for_status()
            
            geojson_data = response.json()
            
            imported = 0
            updated = 0
            
            for feature in geojson_data['features']:
                properties = feature['properties']
                geometry = feature['geometry']
                
                # Extraer datos básicos
                name = properties.get('name', '')
                iso_alpha2 = properties.get('iso_a2', '')
                iso_alpha3 = properties.get('iso_a3', '')
                
                if not name or not iso_alpha2:
                    continue
                
                # Convertir geometría a PostGIS
                if geometry['type'] == 'Polygon':
                    # Convertir Polygon a MultiPolygon
                    polygon_coords = geometry['coordinates']
                    multi_polygon_coords = [polygon_coords]
                    geometry_obj = MultiPolygon(multi_polygon_coords, srid=4326)
                elif geometry['type'] == 'MultiPolygon':
                    geometry_obj = MultiPolygon(geometry['coordinates'], srid=4326)
                else:
                    continue
                
                # Crear o actualizar país
                country, created = Country.objects.update_or_create(
                    iso_alpha2=iso_alpha2,
                    defaults={
                        'iso_alpha3': iso_alpha3,
                        'name': name,
                        'geometry': geometry_obj,
                        'continent': properties.get('continent', ''),
                        'capital': properties.get('capital', ''),
                        'population': properties.get('pop_est'),
                        'area_sq_km': properties.get('area_km2')
                    }
                )
                
                if created:
                    imported += 1
                else:
                    updated += 1
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully imported {imported} countries, updated {updated}'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error importing countries: {str(e)}')
            )
```

### apps/geo/management/commands/seed_user_countries.py
```python
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.geo.models import Country, UserCountryStatus
import random

class Command(BaseCommand):
    help = 'Seed user countries for testing'
    
    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, required=True)
        parser.add_argument('--visited', type=int, default=10)
        parser.add_argument('--planned', type=int, default=5)
        parser.add_argument('--wishlist', type=int, default=8)
    
    def handle(self, *args, **options):
        username = options['username']
        visited_count = options['visited']
        planned_count = options['planned']
        wishlist_count = options['wishlist']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User {username} not found')
            )
            return
        
        # Limpiar estados existentes
        UserCountryStatus.objects.filter(user=user).delete()
        
        # Obtener países aleatorios
        all_countries = list(Country.objects.all())
        random.shuffle(all_countries)
        
        # Asignar países visitados
        for i in range(min(visited_count, len(all_countries))):
            country = all_countries[i]
            UserCountryStatus.objects.create(
                user=user,
                country=country,
                status='visited',
                visit_date=random_date()
            )
        
        # Asignar países planeados
        start_idx = visited_count
        for i in range(start_idx, min(start_idx + planned_count, len(all_countries))):
            country = all_countries[i]
            UserCountryStatus.objects.create(
                user=user,
                country=country,
                status='planned'
            )
        
        # Asignar países deseados
        start_idx = visited_count + planned_count
        for i in range(start_idx, min(start_idx + wishlist_count, len(all_countries))):
            country = all_countries[i]
            UserCountryStatus.objects.create(
                user=user,
                country=country,
                status='wishlist'
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded {visited_count} visited, {planned_count} planned, '
                f'{wishlist_count} wishlist countries for {username}'
            )
        )

def random_date():
    """Generar fecha aleatoria en los últimos 5 años"""
    from datetime import datetime, timedelta
    import random
    
    start_date = datetime.now() - timedelta(days=5*365)
    end_date = datetime.now()
    
    random_days = random.randint(0, (end_date - start_date).days)
    return start_date + timedelta(days=random_days)
```

## Queries Geográficos Optimizados

### apps/geo/views.py
```python
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.gis.db.models.functions import Distance, Centroid
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import Distance as DistanceMeasure
from django.db.models import Count, Avg
from .models import Country, UserCountryStatus, Location

class NearbyCountriesView(APIView):
    """Países cercanos a un punto"""
    
    def get(self, request):
        lng = float(request.GET.get('lng', 0))
        lat = float(request.GET.get('lat', 0))
        radius_km = int(request.GET.get('radius', 500))
        
        point = Point(lng, lat, srid=4326)
        radius = DistanceMeasure(km=radius_km)
        
        # Países dentro del radio
        nearby_countries = Country.objects.filter(
            geometry__distance_lte=(point, radius)
        ).annotate(
            distance=Distance('geometry', point)
        ).order_by('distance')
        
        # Serializar
        result = []
        for country in nearby_countries:
            result.append({
                'name': country.name,
                'iso_alpha2': country.iso_alpha2,
                'distance_km': country.distance.km
            })
        
        return Response(result)

class CountriesByContinentView(APIView):
    """Estadísticas por continente"""
    
    def get(self, request):
        continent_stats = Country.objects.values('continent').annotate(
            country_count=Count('id'),
            total_area=Avg('area_sq_km'),
            total_population=Avg('population')
        ).order_by('continent')
        
        return Response(list(continent_stats))

class UserGeographicStatsView(APIView):
    """Estadísticas geográficas del usuario"""
    
    def get(self, request):
        user = request.user
        
        # Países visitados por continente
        visited_by_continent = UserCountryStatus.objects.filter(
            user=user,
            status='visited'
        ).values('country__continent').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Distancia total viajada (aproximada)
        locations = Location.objects.filter(user=user).order_by('visit_date')
        total_distance = 0
        
        if locations.count() > 1:
            prev_location = locations.first()
            for location in locations[1:]:
                if location.coordinates and prev_location.coordinates:
                    distance = location.coordinates.distance(prev_location.coordinates)
                    total_distance += distance.km
                prev_location = location
        
        # Centroide de todas las ubicaciones
        if locations.exists():
            centroid = Location.objects.filter(user=user).aggregate(
                centroid=Centroid('coordinates')
            )['centroid']
            
            centroid_coords = {
                'lng': centroid.x,
                'lat': centroid.y
            }
        else:
            centroid_coords = None
        
        return Response({
            'visited_by_continent': list(visited_by_continent),
            'total_distance_km': round(total_distance, 2),
            'centroid': centroid_coords,
            'total_locations': locations.count(),
            'countries_visited': UserCountryStatus.objects.filter(
                user=user, status='visited'
            ).count()
        })
```

## Performance y Optimización

### Índices Espaciales
```sql
-- Crear índices espaciales manualmente si es necesario
CREATE INDEX idx_country_geometry ON geo_country USING GIST (geometry);
CREATE INDEX idx_location_coordinates ON geo_location USING GIST (coordinates);

-- Índices compuestos
CREATE INDEX idx_usercountry_user_status ON geo_usercountrystatus (user_id, status);
CREATE INDEX idx_location_user_date ON geo_location (user_id, visit_date);
```

### Vector Tiles para Producción
```python
# apps/geo/views.py
from django.http import HttpResponse
from django.contrib.gis.geos import GEOSGeometry

class CountryVectorTilesView(APIView):
    """Generar vector tiles para países (más eficiente que GeoJSON)"""
    
    def get(self, request, z, x, y):
        # Lógica para generar vector tiles
        # Usar librería como Tippecanoe o Django Vector Tiles
        pass
```

Esta configuración proporciona una base sólida para manejar datos geográficos con PostGIS, optimizada para rendimiento y escalabilidad.