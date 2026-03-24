# TravelMap - Estructura del Proyecto (Node.js + NestJS)

## Arquitectura General
```
travelmap/
├── README.md
├── docker-compose.yml
├── .gitignore
├── .env.example
│
├── backend/                    # NestJS + TypeScript
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── Dockerfile
│   ├── .env.example
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   └── app.config.ts
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   │   ├── user.decorator.ts
│   │   │   │   └── public.decorator.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── response.interceptor.ts
│   │   │   │   └── logging.interceptor.ts
│   │   │   ├── pipes/
│   │   │   │   ├── validation.pipe.ts
│   │   │   │   └── parse-uuid.pipe.ts
│   │   │   └── filters/
│   │   │       └── http-exception.filter.ts
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   ├── seeds/
│   │   │   │   ├── countries.seed.ts
│   │   │   │   └── users.seed.ts
│   │   │   └── connection.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── reset-password.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   ├── trips/
│   │   │   ├── trips.module.ts
│   │   │   ├── trips.controller.ts
│   │   │   ├── trips.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-trip.dto.ts
│   │   │   │   └── update-trip.dto.ts
│   │   │   └── entities/
│   │   │       └── trip.entity.ts
│   │   ├── locations/
│   │   │   ├── locations.module.ts
│   │   │   ├── locations.controller.ts
│   │   │   ├── locations.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-location.dto.ts
│   │   │   │   └── update-location.dto.ts
│   │   │   └── entities/
│   │   │       └── location.entity.ts
│   │   ├── media/
│   │   │   ├── media.module.ts
│   │   │   ├── media.controller.ts
│   │   │   ├── media.service.ts
│   │   │   ├── dto/
│   │   │   │   └── upload-photo.dto.ts
│   │   │   └── entities/
│   │   │       └── photo.entity.ts
│   │   ├── itinerary/
│   │   │   ├── itinerary.module.ts
│   │   │   ├── itinerary.controller.ts
│   │   │   ├── itinerary.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-day.dto.ts
│   │   │   │   └── create-activity.dto.ts
│   │   │   └── entities/
│   │   │       ├── itinerary-day.entity.ts
│   │   │       └── activity.entity.ts
│   │   ├── geo/
│   │   │   ├── geo.module.ts
│   │   │   ├── geo.controller.ts
│   │   │   ├── geo.service.ts
│   │   │   ├── dto/
│   │   │   │   └── update-country-status.dto.ts
│   │   │   └── entities/
│   │   │       ├── country.entity.ts
│   │   │       └── user-country-status.entity.ts
│   │   └── statistics/
│   │       ├── statistics.module.ts
│   │       ├── statistics.controller.ts
│   │       ├── statistics.service.ts
│   │       └── dto/
│   │           └── stats-query.dto.ts
│   ├── test/
│   │   ├── app.e2e-spec.ts
│   │   ├── auth/
│   │   │   └── auth.controller.spec.ts
│   │   ├── geo/
│   │   │   └── geo.controller.spec.ts
│   │   └── trips/
│   │       └── trips.controller.spec.ts
│   └── knexfile.ts
│
├── frontend/                   # SvelteKit + TypeScript (sin cambios)
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
│   │   ├── lib/
│   │   │   ├── components/
│   │   │   │   ├── map/
│   │   │   │   │   ├── MapContainer.svelte
│   │   │   │   │   ├── CountryLayer.svelte
│   │   │   │   │   └── LocationMarkers.svelte
│   │   │   │   └── ...
│   │   │   ├── stores/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── map.ts
│   │   │   │   └── ...
│   │   │   ├── services/
│   │   │   │   ├── api.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── ...
│   │   │   └── ...
│   │   └── routes/
│   │       ├── +layout.svelte
│   │       ├── dashboard/
│   │       ├── map/
│   │       └── ...
│   └── ...
│
├── docs/                      # Documentación del proyecto
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   ├── schema.md
│   ├── nestjs-setup.md
│   └── postgis-node.md
│
├── scripts/                   # Scripts de utilidad
│   ├── setup.sh
│   ├── seed-data.js
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

## Stack Tecnológico (Actualizado)

### Backend (NestJS + TypeScript)
- **Framework**: NestJS 10+ con TypeScript
- **Base de Datos**: PostgreSQL 15+ con PostGIS
- **ORM**: Knex.js + Objection.js (para soporte PostGIS)
- **Autenticación**: JWT con Passport.js
- **File Upload**: Multer + S3 (producción)
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest + Supertest

### Frontend (SvelteKit) - Sin cambios
- **Framework**: SvelteKit con TypeScript
- **Styling**: TailwindCSS + DaisyUI
- **Mapas**: MapLibre GL JS
- **State Management**: Svelte stores
- **HTTP Client**: ky.js
- **Testing**: Vitest + Testing Library

### DevOps
- **Contenedor**: Docker + Docker Compose
- **Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Monitor**: Logs básicos con Winston

## Flujo de Desarrollo

1. **Backend**: API RESTful con NestJS, endpoints optimizados para datos geográficos
2. **Frontend**: SPA con routing client-side, mapa interactivo principal
3. **Integración**: comunicación via JSON API con typed interfaces
4. **Testing**: Unit tests + integration tests + E2E tests

## Consideraciones

- **Mobile-first**: Diseño responsive prioritario para dispositivos móviles
- **Performance**: Lazy loading de componentes y datos geográficos
- **Offline**: Service Workers para funcionalidad básica offline
- **Privacidad**: Datos por defecto privados, opción pública por usuario
- **Type Safety**: Full TypeScript en backend y frontend
- **Scalability**: Arquitectura modular con NestJS modules

## Configuración de Desarrollo

### Backend (NestJS)
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones
npm run migrate

# Sembrar datos
npm run seed

# Iniciar desarrollo
npm run start:dev
```

### Frontend (SvelteKit)
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar desarrollo
npm run dev
```

## Ventajas de NestJS vs Django

1. **TypeScript nativo**: Mejor type safety y autocompletado
2. **Arquitectura modular**: Más fácil de escalar y mantener
3. **Ecosistema Node.js**: Integración con frontend más fluida
4. **Performance**: Mayor rendimiento para APIs JSON
5. **Testing**: Integración nativa con Jest
6. **Microservicios**: Más fácil de descomponer en el futuro