# Makefile for Docker Compose commands
.PHONY: help dev prod build clean logs status

# Variables
COMPOSE_FILE = docker-compose.yml
DEV_COMPOSE_FILE = docker-compose.dev.yml
PROD_COMPOSE_FILE = docker-compose.prod.yml

# Colores
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

help: ## Show help
	@echo "$(BLUE)TravelMap Docker Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-build    - Build development images"
	@echo "  make dev-down     - Stop development environment"
	@echo "  make dev-logs     - View development logs"
	@echo ""
	@echo "$(GREEN)Production:$(NC)"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build production images"
	@echo "  make prod-down    - Stop production environment"
	@echo "  make prod-logs    - View production logs"
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@echo "  make build        - Build all images"
	@echo "  make clean        - Clean containers and images"
	@echo "  make status       - Container status"
	@echo "  make logs          - View all logs"
	@echo "  make db-reset     - Reset database"
	@echo "  make db-backup    - Database backup"
	@echo "  make db-restore   - Restore database"

# ======================
# DEVELOPMENT COMMANDS
# ======================

dev: ## Start development environment
	@echo "$(YELLOW)Starting development environment...$(NC)"
	docker-compose -f $(DEV_COMPOSE_FILE) up -d
	@echo "$(GREEN)Development environment started$(NC)"
	@echo "$(BLUE)PostgreSQL: localhost:5432$(NC)"
	@echo "$(BLUE)Redis: localhost:6379$(NC)"

dev-build: ## Build development images
	@echo "$(YELLOW)Building development images...$(NC)"
	docker-compose -f $(DEV_COMPOSE_FILE) build

dev-down: ## Stop development environment
	@echo "$(YELLOW)Stopping development environment...$(NC)"
	docker-compose -f $(DEV_COMPOSE_FILE) down

dev-logs: ## View development logs
	docker-compose -f $(DEV_COMPOSE_FILE) logs -f

dev-shell: ## Access backend container shell
	docker-compose -f $(DEV_COMPOSE_FILE) exec backend sh

# ======================
# PRODUCTION COMMANDS
# ======================

prod: ## Start production environment
	@echo "$(YELLOW)Starting production environment...$(NC)"
	docker-compose -f $(PROD_COMPOSE_FILE) up -d
	@echo "$(GREEN)Production environment started$(NC)"

prod-build: ## Build production images
	@echo "$(YELLOW)Building production images...$(NC)"
	docker-compose -f $(PROD_COMPOSE_FILE) build

prod-down: ## Stop production environment
	@echo "$(YELLOW)Stopping production environment...$(NC)"
	docker-compose -f $(PROD_COMPOSE_FILE) down

prod-logs: ## View production logs
	docker-compose -f $(PROD_COMPOSE_FILE) logs -f

# ======================
# UTILITIES
# ======================

build: ## Build all images
	@echo "$(YELLOW)Building all images...$(NC)"
	docker-compose build

clean: ## Clean containers and images
	@echo "$(YELLOW)Cleaning containers and images...$(NC)"
	docker-compose down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

status: ## Container status
	@echo "$(BLUE)Container status:$(NC)"
	docker-compose ps

logs: ## View all logs
	docker-compose logs -f

# ======================
# DATABASE COMMANDS
# ======================

db-reset: ## Reset database
	@echo "$(RED)⚠️  This will delete all data in the database$(NC)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	@echo "$(YELLOW)Resetting database...$(NC)"
	docker-compose -f $(DEV_COMPOSE_FILE) down -v
	docker-compose -f $(DEV_COMPOSE_FILE) up -d postgres
	@sleep 10
	@echo "$(GREEN)Database reset$(NC)"

db-backup: ## Database backup
	@echo "$(YELLOW)Creating database backup...$(NC)"
	mkdir -p ./backups
	docker-compose -f $(DEV_COMPOSE_FILE) exec postgres pg_dump -U travelmap_user travelmap > ./backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup created in ./backups/$(NC)"

db-restore: ## Restore database
	@echo "$(YELLOW)Restoring database...$(NC)"
	@read -p "Backup file: " backup_file; \
	docker-compose -f $(DEV_COMPOSE_FILE) exec -T postgres psql -U travelmap_user travelmap < $$backup_file
	@echo "$(GREEN)Database restored$(NC)"

db-migrate: ## Run migrations
	@echo "$(YELLOW)Running migrations...$(NC)"
	docker-compose -f $(DEV_COMPOSE_FILE) exec backend npm run migrate

db-seed: ## Run seeds
	@echo "$(YELLOW)Running seeds...$(NC)"
	docker-compose -f $(DEV_COMPOSE_FILE) exec backend npm run seed

# ======================
# MONITORING
# ======================

monitoring: ## Start monitoring services
	@echo "$(YELLOW)Starting monitoring...$(NC)"
	docker-compose -f $(PROD_COMPOSE_FILE) --profile monitoring up -d
	@echo "$(GREEN)Monitoring started$(NC)"
	@echo "$(BLUE)Prometheus: http://localhost:9090$(NC)"
	@echo "$(BLUE)Grafana: http://localhost:3000$(NC)"

# ======================
# FULL STACK
# ======================

full: ## Start full stack (development)
	@echo "$(YELLOW)Starting full stack...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Full stack started$(NC)"
	@echo "$(BLUE)Frontend: http://localhost:5173$(NC)"
	@echo "$(BLUE)Backend: http://localhost:3001$(NC)"
	@echo "$(BLUE)PostgreSQL: localhost:5432$(NC)"
	@echo "$(BLUE)Redis: localhost:6379$(NC)"
	@echo "$(BLUE)PgAdmin: http://localhost:5050$(NC)"
	@echo "$(BLUE)MinIO: http://localhost:9000$(NC)"

full-down: ## Stop full stack
	@echo "$(YELLOW)Stopping full stack...$(NC)"
	docker-compose down

# ======================
# DEVELOPMENT QUICK START
# ======================

quick-start: ## Quick start for development
	@echo "$(YELLOW)TravelMap Quick Start...$(NC)"
	@echo "$(BLUE)1. Configuring environment variables...$(NC)"
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@echo "$(BLUE)2. Starting base services...$(NC)"
	make dev
	@echo "$(BLUE)3. Waiting for PostgreSQL...$(NC)"
	@sleep 15
	@echo "$(BLUE)4. Configuring backend...$(NC)"
	cd backend && npm install && npm run migrate && npm run seed
	@echo "$(BLUE)5. Configuring frontend...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)✅ TravelMap ready for development!$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "1. Terminal 1: cd backend && npm run start:dev"
	@echo "2. Terminal 2: cd frontend && npm run dev"
	@echo "3. Navegador: http://localhost:5173"