# TravelMap - Resumen de la Arquitectura Diseñada

## 🎯 Visión General Completa

He diseñado una aplicación web completa de seguimiento de viajes con una arquitectura moderna y escalable:

### ✅ Arquitectura de Base de Datos
- **PostgreSQL + PostGIS** para manejar coordenadas geográficas y polígonos
- **8 entidades principales**: Users, Countries, Trips, Locations, Photos, Itinerary, Checklists, Statistics
- **Relaciones optimizadas** con índices espaciales para consultas geográficas eficientes
- **Vistas materializadas** para estadísticas del dashboard

### ✅ Estructura del Proyecto
- **Frontend**: SvelteKit + TypeScript + TailwindCSS + DaisyUI
- **Backend**: Django + Django REST Framework + PostGIS
- **Arquitectura modular** con apps separadas por funcionalidad
- **Docker Compose** para desarrollo y producción

### ✅ Mapa Interactivo con MapLibre
- **Componente MapContainer.svelte** completamente funcional
- **Gestión de estados**: visitado, planeado, deseado con colores dinámicos
- **Clustering de ubicaciones** para mejor rendimiento
- **Controles personalizados** con estilo dark mode minimalista
- **Eventos de click/hover** para interacción con países y ubicaciones

### ✅ Manejo de GeoJSON
- **Backend Django** con modelos PostGIS optimizados
- **Endpoints RESTful** para países y estados de usuario
- **Actualización en tiempo real** del mapa al cambiar estados
- **Popups interactivos** para gestionar países visitados
- **Services TypeScript** tipados para la API

### ✅ Configuración PostGIS Completa
- **Instalación y configuración** paso a paso
- **Models con geometrías** espaciales (Point, MultiPolygon)
- **Management commands** para importar datos de países
- **Queries geográficas optimizadas** con índices espaciales
- **Estadísticas geográficas** por continente y usuario

## 🏗️ Componentes Clave Implementados

### Base de Datos (`database/schema.sql`)
- Entidades con relaciones ForeignKey optimizadas
- Funciones para actualización automática de estadísticas
- Índices para rendimiento en consultas geográficas

### Frontend Mapa (`frontend/src/lib/components/map/`)
- **MapContainer.svelte**: Componente principal con MapLibre GL
- **Stores reactivos** para estado del mapa y países
- **Constants** para colores y configuración

### Backend Geo (`apps/geo/`)
- **Models PostGIS** con geometrías espaciales
- **Serializers y Views** para API RESTful
- **Management Commands** para importar países Natural Earth

## 🚀 Flujo de la Aplicación

1. **Mapa Inicial**: Carga GeoJSON de todos los países desde `/api/geo/countries/`
2. **Coloreado Dinámico**: Cada país muestra su estado (visitado/planeado/deseado)
3. **Interacción**: Click en país abre popup para cambiar estado
4. **Persistencia**: Cambios guardados en PostgreSQL con PostGIS
5. **Estadísticas**: Dashboard actualizado con datos geográficos en tiempo real

## 🎨 UI/UX Implementada

- **Dark Mode** por defecto con estilo minimalista
- **Mobile-first** responsive design
- **Animaciones suaves** en interacciones del mapa
- **Componentes reutilizables** con TailwindCSS + DaisyUI
- **Loading states** y manejo de errores

## 📊 Características Técnicas

- **Performance**: Índices espaciales y clustering de marcadores
- **Escalabilidad**: Vector tiles para producción, cacheo de GeoJSON
- **Seguridad**: Permisos por usuario, datos privados por defecto
- **Testing**: Estructura para unit tests, integration tests, E2E

## 🛠️ Tecnologías Utilizadas

**Frontend**: SvelteKit, TypeScript, TailwindCSS, MapLibre GL JS
**Backend**: NestJS, Node.js, PostgreSQL, PostGIS, Knex.js, Objection.js
**Mapas**: GeoJSON, Vector Tiles, Natural Earth data

## 📍 Puntos Clave de la Arquitectura

1. **PostGIS para Geometría**: Manejo nativo de coordenadas y polígonos
2. **Component-Based**: Arquitectura modular con componentes reutilizables
3. **State Management**: Stores reactivos con Svelte
4. **API First**: Backend RESTful con documentación OpenAPI
5. **Mobile Optimized**: Diseño responsive prioritario para móviles

Esta arquitectura proporciona una base sólida y escalable para desarrollar una aplicación de seguimiento de viajes completa similar a AdventureLog.app, con enfoque en el rendimiento, la experiencia de usuario y la mantenibilidad del código.

## 🚀 Cómo Ejecutar el Proyecto

### **Prerrequisitos**

- **Node.js** 18+ y npm
- **PostgreSQL** 15+ con extensión PostGIS
- **Docker** y Docker Compose (opcional pero recomendado)
- **Git**

---

### **1. Clonar el Repositorio**

```bash
git clone <repository-url>
cd travelmap
```

---

### **2. Configurar Base de Datos PostgreSQL + PostGIS**

#### **Opción A: Docker (Recomendado)**

```bash
# Iniciar PostgreSQL con PostGIS
docker-compose up -d postgres

# Verificar que esté corriendo
docker ps | grep postgres
```

#### **Opción B: Instalación Local**

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

# Crear base de datos
sudo -u postgres psql
CREATE DATABASE travelmap;
CREATE USER travelmap_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE travelmap TO travelmap_user;
\q

# Habilitar PostGIS
psql travelmap -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql travelmap -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;"
```

---

### **3. Configurar Backend (NestJS)**

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

#### **Editar `.env`**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=travelmap_user
DB_PASSWORD=your_password
DB_NAME=travelmap

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# App
NODE_ENV=development
PORT=3001

# CORS
FRONTEND_URL=http://localhost:5173
```

#### **Ejecutar Migraciones y Seeds**
```bash
# Crear tablas en la base de datos
npm run migrate

# Importar datos de países
npm run seed

# (Opcional) Resetear base de datos completa
npm run db:reset
```

#### **Iniciar Backend**
```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Modo desarrollo
npm run start:dev

# Modo producción (después de build)
npm run build
npm run start:prod
```

Backend estará disponible en `http://localhost:3001`

---

### **4. Configurar Frontend (SvelteKit)**

```bash
cd ../frontend

# Instalar dependencias
npm install --legacy-peer-deps

# Configurar variables de entorno
cp .env.example .env
```

#### **Editar `.env`**
```env
# API URL
PUBLIC_API_URL=http://localhost:3001/api

# Map Library Key (si usas MapTiler)
PUBLIC_MAPTILER_API_KEY=your-maptiler-key-here

# App Configuration
PUBLIC_APP_NAME=TravelMap
PUBLIC_APP_VERSION=1.0.0
```

#### **Iniciar Frontend**
```bash
# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

Frontend estará disponible en `http://localhost:5173`

---

### **5. Verificación**

#### **Backend Health Check**
```bash
curl http://localhost:3001/api/geo/countries
# Debería retornar GeoJSON de países
```

#### **Frontend Test**
```bash
# Abrir navegador en http://localhost:5173
# Verificar que el mapa cargue y muestre países
```

---

### **6. Flujo de Desarrollo Típico**

#### **Backend - Nueva API Endpoint**
```bash
# Crear nueva migración
npm run migrate:make create_new_table

# Crear nuevo service/controller
nest g module new-feature
nest g controller new-feature
nest g service new-feature

# Ejecutar tests
npm run test

# Iniciar con hot reload
npm run start:dev
```

#### **Frontend - Nuevo Componente**
```bash
# Crear nuevo componente Svelte
# En src/lib/components/new-component/

# Ejecutar tests
npm run test

# Iniciar con hot reload
npm run dev
```

---

### **7. Docker Compose (Full Stack)**

Para ejecutar todo con Docker:

```bash
# En la raíz del proyecto
docker-compose up -d

# Verificar servicios
docker-compose ps

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

Accesibles:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

---

### **8. Testing**

#### **Backend Tests**
```bash
cd backend

# Tests unitarios
npm run test

# Tests con coverage
npm run test:cov

# Tests end-to-end
npm run test:e2e
```

#### **Frontend Tests**
```bash
cd frontend

# Tests unitarios
npm run test

# Tests con coverage
npm run test:coverage

# Tests end-to-end con Playwright
npm run test:e2e
```

---

### **9. Deploy (Producción)**

#### **Backend Build**
```bash
cd backend
npm run build
# Archivos en dist/
```

#### **Frontend Build**
```bash
cd frontend
npm run build
# Archivos en build/
```

#### **Variables de Entorno Producción**
```bash
# Backend
NODE_ENV=production
DB_HOST=your-production-db-host
JWT_SECRET=production-jwt-secret

# Frontend
PUBLIC_API_URL=https://your-api-domain.com/api
```

---

### **10. Troubleshooting Común**

#### **Problemas de Base de Datos**
```bash
# Verificar conexión
psql -h localhost -U travelmap_user -d travelmap -c "SELECT version();"

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

#### **Problemas de Node.js**
```bash
# Limpiar node_modules
rm -rf node_modules package-lock.json
npm install

# Verificar versión
node --version  # Debe ser 18+
npm --version
```

#### **Problemas de MapLibre**
```bash
# Verificar que el API key sea válida
# Usar estilos alternativos si MapTiler no funciona
```

---

### **11. Scripts Útiles**

```bash
# Backend
npm run lint        # Linting de código
npm run format      # Formateo con Prettier
npm run migrate:make # Crear nueva migración
npm run seed:make   # Crear nuevo seed

# Frontend
npm run check       # Type checking
npm run lint        # ESLint
npm run format      # Prettier format
```

---

### **12. Recursos Adicionales**

- **Documentación API**: `http://localhost:3001/docs` (Swagger)
- **Base de Datos**: PgAdmin en `http://localhost:5050` (con Docker)
- **Logs**: `docker-compose logs` para troubleshooting

¡Listo! Ahora tienes TravelMap corriendo en tu máquina local.

## 📝 Changelog / Historial de Cambios

### Recent Updates / Actualizaciones Recientes

**🇬🇧 English:**
- **Mobile Map Page Redesign**: Complete mobile-first redesign of the `/map` page. On screens ≤768px, the desktop sidebar is hidden and replaced with an inline stats panel (trip counts, progress bar, filter chips), a search bar, and a full-screen map. A bottom navigation bar (Map, Trips, Profile) provides easy thumb navigation. The desktop top navbar is simplified to show only the brand and logout button on mobile.
- Replaced native browser alerts with modern, visually appealing toast notifications on the map page.
- Added the ability to filter locations and photos on the map by selecting one or more individual trips from a new list in the sidebar.
- Carousel photos in the trip detail view are now sorted prioritizing the cover photo first, followed by photos visible on the map, and finally the rest.
- Added a visual map indicator to the thumbnails in the photo carousel for photos that are shown on the map.
- Added "My Trips" (Mis viajes) filter on the map view to display only the authenticated user's trips.
- Enhanced initial demo data to provide a richer experience for unlogged users, including more trips and locations.
- **Mobile Photo Gallery Redesign**: Overhauled the photo gallery for mobile devices with a premium interface, including a top toolbar for quick actions, an enhanced carousel with "Cover" and "Map" overlays, and a horizontal navigation strip.
- **Gallery Layout Optimization**: Implemented a double-layer view with absolute blurred backgrounds and `object-contain` to ensure full image visibility without cropping across all devices.
- **Icon Relocation**: Moved provider badges (Immich/Local) to the top-right next to map indicators for a cleaner UI.
- **Map Add-Trip Button**: Added a floating "+" button to the mobile map view for easy access to new trip creation.
- **Redesigned Info Modal**: The photo metadata (EXIF) view is now a sleek mobile bottom sheet displaying camera details, capture date, and an integrated location map.
- **Full Internationalization (i18n)**: Implemented a robust translation system supporting English and Spanish. All major views (Dashboard, Map, Trip Details, Profile) and shared components are now fully localized.
- **Location Modal Redesigns**: Extended the premium design to the Location modals (Add & Edit) within the Trip details page, featuring dynamic headers, better grid layout, and a redesigned photo scroller.
- **Backend Performance**: Set the request body size limit to 25MB to accommodate larger photo uploads.
- **UI Component Refactor**: Integrated the detected country badge directly into the `LocationPicker` component for better encapsulation and a cleaner UI.

- **Map Sidebar Redesign**: Completely overhauled the `/map` sidebar with a premium, icon-driven layout, adventure statistics, and advanced visualization filters.
- **Add Location Modal Redesign**: Complete visual overhaul of the "Add new location" modal with integrated search, map preview, and premium styling.
- **Minimized Sidebar Enhancements**: Added an interactive minimized state with filter icons and a clickable progress indicator.
- **Country Explorer Redesign**: Fully redesigned the Country Explorer modal with a modern dark theme, smooth animations, and a progress sidebar.
- **Full Internationalization (i18n)**: Implemented a robust translation system supporting English and Spanish. All major views (Dashboard, Map, Trip Details, Profile) and shared components are now fully localized.
- **Fixed Map Page Errors**: Resolved a critical "Unexpected token" syntax error that was preventing the map page from compiling.
- **Improved Region Mapping**: Implemented a more accurate country-to-continent mapping in the explorer using ID-based heuristics.
- **Enhanced Accessibility (A11y)**: Fixed several accessibility warnings across the application, including missing alt text and keyboard listeners.
- **Date Format Standardization**: Ensured all dates follow the `DD/MM/YYYY` format as requested.
- **Bug Fixes**: Corrected duplicate translation keys and fixed property errors in the User Profile interface.

**🇪🇸 Español:**
- **Rediseño de Galería en Móvil**: Nueva interfaz de galería premium para dispositivos móviles con barra de herramientas superior, carrusel con capas de "Portada" y "Mapa", y navegación por tira de miniaturas.
- **Optimización de Layout de Galería**: Implementación de vista de doble capa con fondo difuminado y ajuste `object-contain` para garantizar la visibilidad completa de las imágenes sin recortes.
- **Reubicación de Iconos**: Los distintivos de proveedor (Immich/Local) se movieron a la esquina superior derecha junto a los indicadores de mapa.
- **Botón de Añadir Viaje en Mapa**: Nuevo botón flotante "+" en la vista de mapa móvil para facilitar la creación de nuevos viajes.
- **Rediseño de Modal de Información**: La vista de metadatos (EXIF) es ahora un panel inferior (bottom sheet) con detalles técnicos y mapa de ubicación integrado.
- **Internacionalización Completa (i18n)**: Sistema robusto de traducción con soporte para inglés y español en todas las vistas y componentes.
- **Eliminación de Alertas**: Se reemplazaron las alertas del navegador por notificaciones toast interactivas.
- **Filtros Avanzados**: Nuevos filtros por viaje individual en la barra lateral del mapa.
- **Mejoras en Carrusel**: Ordenación inteligente de fotos (portada primero) e indicadores de mapa en miniaturas.
- **Corrección de Errores**: Se eliminaron claves duplicadas y se corrigieron errores de sintaxis en la página del mapa.
