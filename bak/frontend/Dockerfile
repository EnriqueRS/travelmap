# Frontend Dockerfile
FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
    
# Copy configuration files only if they exist
COPY svelte.config.js* vite.config.ts* tsconfig*.json tailwind.config.js* postcss.config.js* ./

    # Development stage
    FROM base AS development
        RUN npm install --legacy-peer-deps
    COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
RUN npm i
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Instalar dependencias adicionales
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Copiar build de SvelteKit
COPY --from=build /app/build /usr/share/nginx/html

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Crear directorios necesarios
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5173 || exit 1

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]