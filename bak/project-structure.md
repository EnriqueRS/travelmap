# TravelMap - Estructura del Proyecto

## Arquitectura General
```
travelmap/
├── README.md
├── docker-compose.yml
├── .gitignore
├── .env.example
│
├── backend/                    # Django + Django REST Framework
│   ├── manage.py
│   ├── requirements.txt
│   ├── requirements_dev.txt
│   ├── Dockerfile
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   ├── production.py
│   │   │   └── testing.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/
│   │   ├── __init__.py
│   │   ├── authentication/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── migrations/
│   │   ├── trips/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   ├── filters.py
│   │   │   └── migrations/
│   │   ├── locations/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── migrations/
│   │   ├── media/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   ├── utils.py
│   │   │   └── migrations/
│   │   ├── itinerary/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── migrations/
│   │   └── geo/
│   │       ├── __init__.py
│   │       ├── models.py
│   │       ├── views.py
│   │       ├── serializers.py
│   │       ├── urls.py
│   │       ├── utils.py
│   │       └── migrations/
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── permissions.py
│   │   ├── pagination.py
│   │   ├── exceptions.py
│   │   └── helpers.py
│   └── tests/
│       ├── __init__.py
│       ├── test_trips.py
│       ├── test_locations.py
│       └── factories.py
│
├── frontend/                   # SvelteKit + TypeScript
│   ├── package.json
│   ├── package-lock.json
│   ├── svelte.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── Dockerfile
│   ├── .env.example
│   ├── src/
│   │   ├── app.html
│   │   ├── app.d.ts
│   │   ├── app.css
│   │   ├── lib/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   │   ├── Button.svelte
│   │   │   │   │   ├── Input.svelte
│   │   │   │   │   ├── Card.svelte
│   │   │   │   │   ├── Modal.svelte
│   │   │   │   │   ├── Loading.svelte
│   │   │   │   │   └── index.ts
│   │   │   │   ├── map/
│   │   │   │   │   ├── MapContainer.svelte
│   │   │   │   │   ├── CountryLayer.svelte
│   │   │   │   │   ├── LocationMarkers.svelte
│   │   │   │   │   ├── MapControls.svelte
│   │   │   │   │   └── index.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── Sidebar.svelte
│   │   │   │   │   ├── Header.svelte
│   │   │   │   │   ├── StatsCard.svelte
│   │   │   │   │   └── index.ts
│   │   │   │   ├── trips/
│   │   │   │   │   ├── TripCard.svelte
│   │   │   │   │   ├── TripForm.svelte
│   │   │   │   │   ├── TripDetails.svelte
│   │   │   │   │   ├── TripList.svelte
│   │   │   │   │   └── index.ts
│   │   │   │   ├── locations/
│   │   │   │   │   ├── LocationCard.svelte
│   │   │   │   │   ├── LocationForm.svelte
│   │   │   │   │   ├── PhotoGallery.svelte
│   │   │   │   │   └── index.ts
│   │   │   │   └── layout/
│   │   │   │       ├── AppLayout.svelte
│   │   │   │       ├── PublicLayout.svelte
│   │   │   │       └── index.ts
│   │   │   ├── stores/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── map.ts
│   │   │   │   ├── trips.ts
│   │   │   │   └── locations.ts
│   │   │   ├── services/
│   │   │   │   ├── api.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── trips.ts
│   │   │   │   ├── locations.ts
│   │   │   │   └── media.ts
│   │   │   ├── utils/
│   │   │   │   ├── constants.ts
│   │   │   │   ├── helpers.ts
│   │   │   │   ├── formatters.ts
│   │   │   │   └── validators.ts
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── map.ts
│   │   │   │   ├── trips.ts
│   │   │   │   └── locations.ts
│   │   │   └── styles/
│   │   │       ├── globals.css
│   │   │       ├── components.css
│   │   │       └── themes.css
│   │   ├── routes/
│   │   │   ├── +layout.svelte
│   │   │   ├── +page.svelte
│   │   │   ├── +page.server.ts
│   │   │   ├── login/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   ├── register/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── +layout.svelte
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   ├── map/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   ├── trips/
│   │   │   │   ├── +page.svelte
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── +page.svelte
│   │   │   │   │   ├── +page.server.ts
│   │   │   │   │   └── edit/
│   │   │   │   │       └── +page.svelte
│   │   │   │   ├── new/
│   │   │   │   │   └── +page.svelte
│   │   │   │   └── +layout.svelte
│   │   │   └── profile/
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.ts
│   │   └── params/
│   │       └── (lang)/
│   │           └── [...slug]/+page.svelte
│   ├── static/
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   └── images/
│   │       ├── hero-bg.jpg
│   │       └── placeholders/
│   └── tests/
│       ├── setup.ts
│       ├── components/
│       │   ├── Map.test.ts
│       │   └── TripCard.test.ts
│       └── utils/
│           └── formatters.test.ts
│
├── docs/                      # Documentación del proyecto
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   └── schema.md
│
├── scripts/                   # Scripts de utilidad
│   ├── setup.sh
│   ├── seed_data.py
│   ├── backup.sh
│   └── deploy.sh
│
├── uploads/                   # Archivos subidos (desarrollo)
│   ├── photos/
│   └── avatars/
│
└── nginx/                     # Configuración de Nginx
    ├── nginx.conf
    └── ssl/
```

## Stack Tecnológico

### Backend (Django + DRF)
- **Framework**: Django 4.2+ con Django REST Framework
- **Base de Datos**: PostgreSQL 15+ con PostGIS
- **Autenticación**: Django JWT (Simple JWT)
- **Media Storage**: Django Storages (S3 para producción)
- **Cache**: Redis
- **API Documentation**: drf-spectacular (OpenAPI 3.0)

### Frontend (SvelteKit)
- **Framework**: SvelteKit con TypeScript
- **Styling**: TailwindCSS + DaisyUI
- **Mapas**: MapLibre GL JS
- **State Management**: Svelte stores
- **HTTP Client**: ky.js
- **Forms**: svelte-use-form
- **Testing**: Vitest + Testing Library

### DevOps
- **Contenedor**: Docker + Docker Compose
- **Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Monitor**: Logs básicos con Docker

## Flujo de Desarrollo

1. **Backend**: API RESTful con endpoints optimizados para datos geográficos
2. **Frontend**: SPA con routing client-side, mapa interactivo principal
3. **Integración**: comunicación via JSON API con typed interfaces
4. **Testing**: Unit tests + integration tests + E2E tests

## Consideraciones

- **Mobile-first**: Diseño responsive prioritario para dispositivos móviles
- **Performance**: Lazy loading de componentes y datos geográficos
- **Offline**: Service Workers para funcionalidad básica offline
- **Privacidad**: Datos por defecto privados, opción pública por usuario