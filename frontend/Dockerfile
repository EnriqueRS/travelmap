# Frontend Dockerfile
FROM node:18-alpine AS base

RUN apk add --no-cache curl && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package*.json ./
COPY svelte.config.js* vite.config.ts* tsconfig*.json tailwind.config.js* postcss.config.js* ./

# Development stage
FROM base AS development
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Production stage - nginx serving static SPA
FROM nginx:alpine AS production

RUN apk add --no-cache curl && rm -rf /var/cache/apk/*

# Static files from adapter-static
COPY --from=build /app/build /usr/share/nginx/html

# Production nginx config with API proxy
COPY nginx.prod.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5173/ || exit 1

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
