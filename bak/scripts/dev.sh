#!/bin/bash

# Colores para diferenciar la salida
CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m' # Sin color

# Matar procesos hijos al salir (Ctrl+C)
trap 'kill $(jobs -p) 2>/dev/null; exit 0' INT TERM EXIT

echo -e "${GREEN}Iniciando backend y frontend...${NC}"

# Backend
(
  cd "$(dirname "$0")/../backend" || exit 1
  echo -e "${CYAN}[BACKEND]${NC} Iniciando..."
  npm run start 2>&1 | sed "s/^/$(printf '\033[0;36m')[BACKEND]$(printf '\033[0m') /"
) &

# Frontend
(
  cd "$(dirname "$0")/../frontend" || exit 1
  echo -e "${GREEN}[FRONTEND]${NC} Iniciando..."
  npm run dev -- --host 2>&1 | sed "s/^/$(printf '\033[0;32m')[FRONTEND]$(printf '\033[0m') /"
) &

# Esperar a que ambos procesos terminen
wait
