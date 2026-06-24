# TravelMap Onboarding Guide

Welcome to TravelMap! This guide will help you understand the project architecture, codebase structure, and development workflows.

---

## Project Overview

**TravelMap** is a travel tracking web application with an interactive map for tracking visited countries and provinces, planning trips, and sharing experiences.

- **Languages:** TypeScript, Svelte, JavaScript, SQL, HTML, CSS, Dockerfile, YAML, Nginx
- **Frontend:** SvelteKit + TypeScript + TailwindCSS + MapLibre GL JS + Leaflet
- **Backend:** NestJS + Knex.js + Objection.js + PostgreSQL + PostGIS
- **Infrastructure:** Docker Compose, Nginx, MinIO (S3-compatible storage), Redis

### Key Features
- Interactive world map with country/province highlighting
- Province-level tracking for Spain (expandable to other countries)
- Trip planning with itineraries and activities
- Photo management with Immich integration
- Full i18n (English/Spanish)
- Three themes (Sea Blue Dark, Light, Neon Obsidian)
- Mobile-first responsive design

---

## Architecture Layers

### Backend (NestJS)

#### 1. Database Layer
PostgreSQL schema with PostGIS geometry types (POINT, MULTIPOLYGON), Knex.js migrations, and seed data.

**Key files:** `database/schema.sql`, `backend/src/database/migrations/*.ts`, `backend/src/database/seeds/countries.seed.ts`

#### 2. Backend Infrastructure
NestJS application bootstrap, module registration, CORS, Swagger docs, Winston logging, global pipes and interceptors.

**Key files:** `backend/src/main.ts`, `backend/src/app.module.ts`, `backend/src/logger/`

#### 3. Auth Layer
JWT-based authentication with Passport.js strategies. User registration, login, token management, and route guards.

**Key files:** `backend/src/auth/`, `backend/src/auth/guards/jwt-auth.guard.ts`

#### 4. Entity Layer (Objection.js Models)
Model classes mapping to PostgreSQL tables with snake_case/camelCase conversion, relation mappings, and PostGIS helpers.

**Key files:** `backend/src/users/user.entity.ts`, `backend/src/trips/entities/trip.entity.ts`, `backend/src/locations/entities/location.entity.ts`, `backend/src/media/entities/photo.entity.ts`, `backend/src/geo/entities/country.entity.ts`

#### 5. API Layer (Controllers & Modules)
NestJS controllers with REST endpoints, Swagger docs, validation pipes, and JWT guards. Modules group controllers, services, and DTOs by domain.

**Key files:** `backend/src/geo/`, `backend/src/trips/`, `backend/src/locations/`, `backend/src/media/`, `backend/src/integrations/`

#### 6. Service Layer (Business Logic)
Injectable NestJS services with business logic for each domain. Services interact with entities via Objection.js query builder.

**Key files:** `backend/src/geo/geo.service.ts` (339 lines), `backend/src/media/media.service.ts` (230 lines), `backend/src/trips/trips.service.ts` (140 lines), `backend/src/locations/locations.service.ts` (141 lines)

### Frontend (SvelteKit)

#### 7. Pages
SvelteKit file-based routing with route pages combining layout, components, stores, and services.

**Key files:** `frontend/src/routes/map/+page.svelte` (3431 lines), `frontend/src/routes/trips/[id]/+page.svelte` (3220 lines), `frontend/src/routes/profile/+page.svelte` (1900 lines), `frontend/src/routes/+layout.svelte`

#### 8. Components
Reusable Svelte UI components organized into `map/` and `ui/` subdirectories.

**Key files:** `frontend/src/lib/components/map/MapContainer.svelte` (1163 lines), `frontend/src/lib/components/map/LocationDetailModal.svelte` (619 lines), `frontend/src/lib/components/ui/ProvinceExplorer.svelte` (932 lines)

#### 9. State Management
Svelte writable/derived stores for reactive state: auth, map state, trip/location data, UI theme, i18n.

**Key files:** `frontend/src/lib/stores/data.ts`, `frontend/src/lib/stores/map.ts`, `frontend/src/lib/stores/ui.ts`, `frontend/src/lib/stores/i18n.ts`

#### 10. API Clients
Axios-based services providing typed HTTP clients for every backend endpoint.

**Key files:** `frontend/src/lib/services/auth.ts`, `frontend/src/lib/services/trips.ts`, `frontend/src/lib/services/locations.ts`, `frontend/src/lib/services/media.ts`, `frontend/src/lib/services/integrations.ts`

#### 11. Utilities
Helper modules: constants, country/province data, geocoding, formatters, string utils.

**Key files:** `frontend/src/lib/utils/constants.ts`, `frontend/src/lib/utils/countries.ts`, `frontend/src/lib/utils/provinces.ts`, `frontend/src/lib/utils/geocode.ts`

### Infrastructure

#### 12. Deployment
Docker Compose orchestration (dev/full/prod), Nginx reverse proxy, Makefile automation, environment configuration.

**Key files:** `docker-compose.yml`, `docker-compose.dev.yml`, `frontend/nginx.conf`, `Makefile`

#### 13. Documentation
Project docs including bilingual README, CLAUDE.md (AI assistant config), DESIGN.md (design system), and technical guides.

**Key files:** `README.md`, `CLAUDE.md`, `DESIGN.md`, `docs/geojson-integration.md`, `docs/postgis-setup.md`

---

## Key Concepts

### Database Conventions
- All columns use `snake_case`, TypeScript/JSON uses `camelCase`
- Objection.js `snakeCaseMappers` handles automatic conversion
- PostGIS geometry types: `POINT` for locations, `MULTIPOLYGON` for countries/provinces
- 8 core entities: users, countries, trips, locations, photos, itinerary_days, activities, user_statistics

### Code Conventions
- No emojis in UI — use lucide-svelte icons
- Mobile-first design for all components
- All comments and documentation in English
- Three themes via CSS custom properties (--bg-primary, --text-primary, etc.)

### Key Patterns
- **Dynamic trip status:** Completed/planned calculated from dates
- **Province tracking:** Array of province codes on trips, SVG flags for Spain
- **Toast notifications:** Replacing native alerts for user feedback
- **Immich integration:** External photo server via REST API
- **Conditional rendering:** Home province/marker display respects privacy settings

### Module Structure (NestJS)
Each backend module follows the pattern:
```
module-name/
  module-name.module.ts   # NestJS module definition
  module-name.controller.ts  # REST endpoints
  module-name.service.ts  # Business logic
  dto/                    # Data transfer objects
  entities/               # Objection.js models
```

---

## Guided Tour

### Step 1: Project Overview
Start with **README.md** (bilingual project documentation), **DESIGN.md** (3-theme design system), and **CLAUDE.md** (AI assistant context with architecture and conventions).

### Step 2: Backend Entry Point
Explore **`backend/src/main.ts`** (NestJS bootstrap with CORS, Swagger, Winston), **`backend/src/app.module.ts`** (imports all 10 feature modules), and the logger module setup.

### Step 3: Database Schema & Migrations
Review **`database/schema.sql`** (8 entities with PostGIS), **`backend/src/database/`** (Knex config, 14 migration files, country seed data).

### Step 4: Auth Layer
Understand **`backend/src/auth/`** — JWT strategy, auth controller/service, and JwtAuthGuard for protected routes.

### Step 5: API Modules
Review controllers: **Geo** (country GeoJSON, status management), **Trips** (CRUD with province arrays), **Locations** (POI with PostGIS), **Media** (photos, Immich), **Integrations** (external services).

### Step 6: Service Layer
Dive into business logic: **`geo.service.ts`** (339 lines — GeoJSON, country status, stats), **`media.service.ts`** (230 lines — photo CRUD, Immich import, batch ops).

### Step 7: Entity Layer
Explore Objection.js models: **trip.entity.ts** (234 lines), **location.entity.ts** (261 lines), **user.entity.ts** (387 lines), **photo.entity.ts** (124 lines).

### Step 8: Frontend Entry Point
Review **`frontend/src/app.html`** (HTML shell), **`frontend/src/routes/+layout.svelte`** (global navbar, auth nav, mobile bottom bar, 3 themes), **`frontend/src/app.css`** (design system).

### Step 9: Frontend Pages
Navigate the SvelteKit routes: landing page, map page (3431 lines — main feature), trip detail (3220 lines), profile (1900 lines), login, register.

### Step 10: Frontend Components
Core components: **MapContainer.svelte** (1163 lines — Leaflet map with clustering, country highlighting, tile switching), **ProvinceExplorer.svelte** (932 lines), **LocationDetailModal.svelte** (619 lines).

### Step 11: State Management & i18n
Svelte stores: **data.ts** (trip/location/user data with localStorage), **i18n.ts** (956 lines — full ES/EN translations), **map.ts** (zoom, center, dark mode), **ui.ts** (theme, language, toasts).

### Step 12: API Clients & Utilities
Axios service modules + utilities: **countries.ts** (195-country dataset), **provinces.ts** (Spanish province data), **geocode.ts** (Nominatim wrapper).

### Step 13: Configuration
Build tools: **svelte.config.js**, **vite.config.ts** (path aliases), **tailwind.config.js** (custom TravelMap colors), **postcss.config.js**.

### Step 14: Infrastructure
Docker Compose (3 variants), **Makefile** (dev/full/logs/status commands), Nginx config, environment templates.

---

## Complexity Hotspots

Approach these files carefully — they contain the most logic:

| File | Complexity | Lines | Description |
|------|-----------|-------|-------------|
| `backend/src/media/media.service.ts` | complex | 230 | Photo CRUD, Immich import, batch operations |
| `frontend/src/routes/map/+page.svelte` | high volume | 3431 | Main map page with sidebar, province explorer, photo modal |
| `frontend/src/routes/trips/[id]/+page.svelte` | high volume | 3220 | Trip detail with photo gallery, batch ops, location CRUD |
| `frontend/src/routes/profile/+page.svelte` | high volume | 1900 | Profile with stats dashboard, home location, integrations |
| `frontend/src/lib/components/map/MapContainer.svelte` | high volume | 1163 | Interactive Leaflet map with all interactions |
| `frontend/src/lib/stores/i18n.ts` | high volume | 956 | Full ES/EN translation system |
| `frontend/src/lib/components/ui/ProvinceExplorer.svelte` | high volume | 932 | Province-level tracking UI for Spain |
| `backend/src/users/user.entity.ts` | high logic | 387 | Central User model with 5 ORM relations |
| `database/schema.sql` | schema | 198 | All 8 PostgreSQL tables with PostGIS |
| `frontend/src/routes/profile/+page.svelte` | high volume | 1900 | Profile + stats dashboard |

---

## Development Workflow

### Quick Start
```bash
# Start infrastructure (PostgreSQL, Redis)
make dev

# Backend (Terminal 1)
cd backend && npm install && npm run start:dev

# Frontend (Terminal 2)
cd frontend && npm install && npm run dev
```

### Common Commands
```bash
# Backend
npm run migrate          # Run migrations
npm run seed             # Seed country data
npm run test             # Unit tests
npm run lint             # ESLint

# Frontend
npm run check            # TypeScript type checking
npm run test             # Vitest
npm run lint             # ESLint

# Docker
make dev                 # Start dev environment
make full                # Start full stack
make dev-down            # Stop services
```

---

## Git Workflow

1. Create feature branches from `main`
2. Run `npm run lint` and `npm run check` before committing
3. Keep migrations timestamp-ordered (`YYYYMMDDHHMMSS_description.ts`)
4. Update `CHANGELOG.md` with new features
5. Maintain bilingual docs (README English + Spanish sections)