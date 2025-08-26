#!/bin/bash

# MUD Engine Production Deployment Script
set -e

# Configuration
PROJECT_NAME="mud-engine"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    log_success "All dependencies are available"
}

check_environment() {
    log_info "Checking environment configuration..."

    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file $ENV_FILE not found. Creating from template..."
        if [ -f ".env.example" ]; then
            cp .env.example "$ENV_FILE"
            log_info "Please edit $ENV_FILE with your production values"
        else
            log_error "Neither $ENV_FILE nor .env.example found"
            exit 1
        fi
    fi

    log_success "Environment configuration is ready"
}

build_application() {
    log_info "Building application..."

    # Build the application
    npm run build

    log_success "Application built successfully"
}

build_containers() {
    log_info "Building Docker containers..."

    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache

    log_success "Docker containers built successfully"
}

start_services() {
    log_info "Starting services..."

    # Start services in detached mode
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

    log_success "Services started successfully"
}

wait_for_services() {
    log_info "Waiting for services to be healthy..."

    # Wait for main application
    log_info "Waiting for MUD Engine to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mud-engine curl -f http://localhost:3000/health > /dev/null 2>&1; then
            break
        fi
        sleep 5
        timeout=$((timeout - 5))
    done

    if [ $timeout -le 0 ]; then
        log_error "MUD Engine failed to become ready"
        exit 1
    fi

    # Wait for Redis
    log_info "Waiting for Redis to be ready..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1

    log_success "All services are healthy"
}

run_migrations() {
    log_info "Running database migrations..."

    # If you have migrations, run them here
    # For now, this is a placeholder

    log_success "Migrations completed"
}

health_check() {
    log_info "Performing final health check..."

    # Check main application health
    if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_error "Health check failed for main application"
        exit 1
    fi

    log_success "All health checks passed"
}

show_status() {
    log_info "Deployment status:"
    echo ""
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    echo ""
    log_info "Service logs:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=10
}

cleanup() {
    log_info "Cleaning up old containers and images..."

    # Remove stopped containers
    docker container prune -f

    # Remove unused images
    docker image prune -f

    log_success "Cleanup completed"
}

rollback() {
    log_error "Deployment failed, rolling back..."

    # Stop services
    docker-compose -f "$DOCKER_COMPOSE_FILE" down

    # You might want to restart previous version here
    log_info "Please check the logs and fix the issues before redeploying"
}

# Main deployment function
deploy() {
    log_info "Starting deployment of $PROJECT_NAME..."

    # Pre-deployment checks
    check_dependencies
    check_environment

    # Build phase
    build_application
    build_containers

    # Deployment phase
    start_services
    wait_for_services

    # Post-deployment
    run_migrations
    health_check

    # Cleanup
    cleanup

    log_success "Deployment completed successfully!"
    show_status
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "build")
        build_application
        build_containers
        ;;
    "start")
        start_services
        ;;
    "stop")
        log_info "Stopping services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" restart
        log_success "Services restarted"
        ;;
    "logs")
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "rollback")
        rollback
        ;;
    *)
        echo "Usage: $0 {deploy|build|start|stop|restart|logs|status|cleanup|rollback}"
        exit 1
        ;;
esac