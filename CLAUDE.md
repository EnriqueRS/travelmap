# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TravelMap is a travel tracking web application that allows users to track visited countries and provinces, plan trips, and share experiences with an interactive map.

## Tech Stack

**Frontend**: SvelteKit + TypeScript + TailwindCSS + MapLibre GL JS + Leaflet
**Backend**: NestJS + Knex.js + Objection.js + PostgreSQL + PostGIS
**Infrastructure**: Docker Compose, Nginx, MinIO (S3-compatible storage)

## Development Commands

### Quick Start (Development)
```bash
# Start infrastructure (PostgreSQL, Redis, MinIO)
make dev

# Backend (Terminal 1)
cd backend && npm install && npm run start:dev

# Frontend (Terminal 2)
cd frontend && npm install && npm run dev
```

### Backend Commands
```bash
cd backend

npm run start:dev        # Start with hot reload
npm run build            # Build for production
npm run test             # Run unit tests
npm run test:cov         # Run tests with coverage
npm run lint             # ESLint
npm run migrate          # Run database migrations
npm run migrate:make     # Create new migration
npm run seed             # Run seeds (import countries)
npm run db:reset         # Reset database (migrations + seeds)
```

### Frontend Commands
```bash
cd frontend

npm run dev              # Start dev server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run tests (Vitest)
npm run check            # TypeScript type checking
npm run lint             # ESLint
```

### Docker Commands (via Makefile)
```bash
make dev                 # Start dev environment (PostgreSQL, Redis)
make dev-down            # Stop dev environment
make dev-logs            # View dev logs
make full                # Start full stack (backend, frontend, PostgreSQL, Redis, MinIO, PgAdmin)
make status              # Container status
```

## Architecture

### Backend (`/backend/src`)

NestJS modular architecture with Knex.js for queries and Objection.js as ORM:

```
src/
├── auth/           # JWT authentication, Passport strategies
├── users/          # User management, profile, integrations
├── trips/          # Trip CRUD, provinces, country relationships
├── locations/      # Location management with PostGIS points
├── media/          # Photo handling, Immich integration, MinIO upload
├── geo/            # GeoJSON endpoints, country/province data
├── itinerary/      # Trip itinerary days and activities
├── statistics/     # User travel statistics
├── database/       # Knex config, migrations, seeds
└── integrations/   # External service integrations (Immich)
```

**Key Patterns:**
- All database columns use `snake_case`, TypeScript/JSON uses `camelCase`
- Objection.js `snakeCaseMappers` handles automatic conversion
- PostGIS geometry types: `POINT` for locations, `MULTIPOLYGON` for countries/provinces
- GeoJSON responses for map data

### Frontend (`/frontend/src`)

SvelteKit with file-based routing:

```
src/
├── routes/
│   ├── +layout.svelte    # Main layout with navbar, i18n
│   ├── +page.svelte      # Landing page
│   ├── map/              # Interactive map page (main feature)
│   ├── trips/            # Trip list, detail, edit pages
│   ├── profile/          # User profile, home location settings
│   ├── login/
│   └── register/
├── lib/
│   ├── components/       # Reusable Svelte components
│   │   ├── ui/           # Buttons, inputs, modals, cards
│   │   ├── map/          # MapContainer, markers, layers
│   │   ├── trips/        # Trip cards, forms, lists
│   │   └── locations/    # Location cards, forms, photo gallery
│   ├── stores/           # Svelte stores (auth, map, trips, i18n)
│   ├── services/         # API clients (axios-based)
│   └── utils/            # Formatters, validators, helpers
```

**Key Features:**
- Mobile-first responsive design (primary target: mobile devices)
- MapLibre/Leaflet interactive map with country/province highlighting
- Photo gallery with Immich integration
- Full i18n (English/Spanish) using custom i18n store
- Province-level tracking for Spain (expandable to other countries)

### Database (`/database/schema.sql`)

PostgreSQL with PostGIS extension. Main entities:
- `users` - User accounts with public/private profiles
- `countries` - Country boundaries (MultiPolygon geometry)
- `trips` - User trips with provinces array
- `locations` - Points of interest (Point geometry)
- `photos` - Photo metadata with Immich integration
- `itinerary_days` / `activities` - Trip planning
- `user_statistics` - Aggregated travel stats

## Important Conventions

### Code Style
- **No emojis** in code or UI (use lucide-svelte icons)
- **snake_case** for database columns, **camelCase** for TypeScript/JSON
- Always update `README.md` with feature changes (English + Spanish)

### Development Principles
- Mobile-first design for all UI components
- No direct DB queries in frontend components
- All comments and documentation in English
- README.md sections in English and Spanish

### Recent Changes
- Dynamic trip status calculation (completed/planned based on dates)
- Province-level tracking with SVG flags for Spain
- Premium modal designs for location editing and photo gallery
- Conditional home province/marker display for privacy
- Toast notifications replacing native alerts

## Environment Setup

Required environment variables (copy from `.env.example`):

**Backend:**
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `FRONTEND_URL`, `BACKEND_PORT`

**Frontend:**
- `PUBLIC_API_URL` (backend API endpoint)
- `MAPTILER_API_KEY` (for map tiles)

## Testing

```bash
# Backend - Unit tests
cd backend && npm run test
npm run test:cov        # Coverage report
npm run test:e2e        # End-to-end tests

# Frontend - Component tests
cd frontend && npm run test
npm run test:ui         # Vitest UI
npm run test:coverage
```

## Docker Compose Services

Development (`docker-compose.dev.yml`):
- PostgreSQL (5432) with PostGIS
- Redis (6379)
- PgAdmin (5050)

Full Stack (`docker-compose.yml`):
- Backend NestJS (3001)
- Frontend SvelteKit (5173)
- MinIO S3-compatible storage (9000/9001)

## Common Tasks

### Add a new API endpoint
1. Create controller method in appropriate module
2. Add service method for business logic
3. Create DTO for validation (if needed)
4. Update Swagger docs (automatic via decorators)
5. Add frontend service method for API call

### Add a new database table
1. Create migration: `npm run migrate:make create_table_name`
2. Define entity with Objection.js model
3. Add relationships if needed
4. Run migration: `npm run migrate`

### Map-related changes
- Country/province data in `geo` module
- Location coordinates stored as PostGIS POINT
- GeoJSON responses for map rendering
- Province tracking currently implemented for Spain only
