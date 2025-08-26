#!/bin/bash

# MUD Engine Scaling Script
set -e

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.yml"
MIN_INSTANCES=1
MAX_INSTANCES=10
DEFAULT_INSTANCES=3

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

get_current_instances() {
    local service_name="$1"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps "$service_name" | grep -c "Up" || echo "0"
}

scale_service() {
    local service_name="$1"
    local target_count="$2"

    log_info "Scaling $service_name to $target_count instances..."

    # Use docker-compose scale command
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --scale "$service_name=$target_count"

    # Wait for services to be healthy
    wait_for_scale "$service_name" "$target_count"

    log_success "Successfully scaled $service_name to $target_count instances"
}

wait_for_scale() {
    local service_name="$1"
    local target_count="$2"
    local timeout=120
    local check_interval=5

    log_info "Waiting for $target_count instances of $service_name to be healthy..."

    while [ $timeout -gt 0 ]; do
        local healthy_count=$(get_healthy_instances "$service_name")
        local running_count=$(get_current_instances "$service_name")

        if [ "$healthy_count" -eq "$target_count" ] && [ "$running_count" -eq "$target_count" ]; then
            log_success "All $target_count instances of $service_name are healthy"
            return 0
        fi

        log_info "Current status: $running_count running, $healthy_count healthy (target: $target_count)"
        sleep "$check_interval"
        timeout=$((timeout - check_interval))
    done

    log_error "Timeout waiting for $service_name to scale to $target_count instances"
    return 1
}

get_healthy_instances() {
    local service_name="$1"

    case "$service_name" in
        "mud-engine")
            # Check health endpoint for each instance
            local containers=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q "$service_name")
            local healthy_count=0

            for container in $containers; do
                if docker exec "$container" curl -f http://localhost:3000/health > /dev/null 2>&1; then
                    healthy_count=$((healthy_count + 1))
                fi
            done

            echo "$healthy_count"
            ;;
        *)
            # For other services, just count running instances
            get_current_instances "$service_name"
            ;;
    esac
}

auto_scale() {
    log_info "Starting auto-scaling based on metrics..."

    # Get current metrics
    local metrics=$(curl -s http://localhost:3000/health 2>/dev/null)

    if [ -z "$metrics" ]; then
        log_error "Unable to fetch metrics from health endpoint"
        return 1
    fi

    # Parse metrics (simplified example)
    local active_connections=$(echo "$metrics" | grep -o '"activeConnections":[0-9]*' | grep -o '[0-9]*' | head -1)
    local active_players=$(echo "$metrics" | grep -o '"activePlayers":[0-9]*' | grep -o '[0-9]*' | head -1)

    # Scaling logic (customize based on your needs)
    local current_instances=$(get_current_instances "mud-engine")

    if [ "$active_connections" -gt 80 ] && [ "$current_instances" -lt "$MAX_INSTANCES" ]; then
        local new_count=$((current_instances + 1))
        log_info "High load detected ($active_connections connections). Scaling up to $new_count instances."
        scale_service "mud-engine" "$new_count"
    elif [ "$active_connections" -lt 20 ] && [ "$current_instances" -gt "$MIN_INSTANCES" ]; then
        local new_count=$((current_instances - 1))
        log_info "Low load detected ($active_connections connections). Scaling down to $new_count instances."
        scale_service "mud-engine" "$new_count"
    else
        log_info "Load is optimal. Current instances: $current_instances"
    fi
}

manual_scale() {
    local service_name="$1"
    local target_count="$2"

    # Validate input
    if ! [[ "$target_count" =~ ^[0-9]+$ ]] || [ "$target_count" -lt "$MIN_INSTANCES" ] || [ "$target_count" -gt "$MAX_INSTANCES" ]; then
        log_error "Invalid instance count. Must be between $MIN_INSTANCES and $MAX_INSTANCES."
        exit 1
    fi

    # Check if service exists in docker-compose
    if ! grep -q "^  $service_name:" "$DOCKER_COMPOSE_FILE"; then
        log_error "Service '$service_name' not found in $DOCKER_COMPOSE_FILE"
        exit 1
    fi

    scale_service "$service_name" "$target_count"
}

show_status() {
    log_info "Current scaling status:"
    echo ""
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    echo ""

    # Show instance counts
    local mud_instances=$(get_current_instances "mud-engine")
    local redis_instances=$(get_current_instances "redis")
    local prometheus_instances=$(get_current_instances "prometheus")
    local grafana_instances=$(get_current_instances "grafana")

    echo "Service Instance Counts:"
    echo "  MUD Engine: $mud_instances"
    echo "  Redis: $redis_instances"
    echo "  Prometheus: $prometheus_instances"
    echo "  Grafana: $grafana_instances"
    echo ""

    # Show health status
    log_info "Health Status:"
    if command -v curl &> /dev/null; then
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            log_success "MUD Engine health check: PASSED"
        else
            log_error "MUD Engine health check: FAILED"
        fi
    fi
}

# Main logic
case "${1:-status}" in
    "up")
        local service_name="${2:-mud-engine}"
        local current_count=$(get_current_instances "$service_name")
        local target_count=$((current_count + 1))

        if [ "$target_count" -gt "$MAX_INSTANCES" ]; then
            log_error "Cannot scale up. Maximum instances ($MAX_INSTANCES) reached."
            exit 1
        fi

        manual_scale "$service_name" "$target_count"
        ;;
    "down")
        local service_name="${2:-mud-engine}"
        local current_count=$(get_current_instances "$service_name")
        local target_count=$((current_count - 1))

        if [ "$target_count" -lt "$MIN_INSTANCES" ]; then
            log_error "Cannot scale down. Minimum instances ($MIN_INSTANCES) required."
            exit 1
        fi

        manual_scale "$service_name" "$target_count"
        ;;
    "to")
        local service_name="${2:-mud-engine}"
        local target_count="${3:-$DEFAULT_INSTANCES}"

        if [ -z "$3" ]; then
            log_warning "No target count specified, using default: $DEFAULT_INSTANCES"
        fi

        manual_scale "$service_name" "$target_count"
        ;;
    "auto")
        auto_scale
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 {up|down|to|auto|status} [service_name] [target_count]"
        echo ""
        echo "Commands:"
        echo "  up [service]     - Scale up by 1 instance"
        echo "  down [service]   - Scale down by 1 instance"
        echo "  to [service] N   - Scale to exactly N instances"
        echo "  auto             - Auto-scale based on metrics"
        echo "  status           - Show current scaling status"
        echo ""
        echo "Services: mud-engine, redis, prometheus, grafana"
        echo "Limits: $MIN_INSTANCES-$MAX_INSTANCES instances"
        exit 1
        ;;
esac