#!/bin/bash
# Production deployment script for RevampIT
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="revampit"
ENVIRONMENT=${1:-production}
DOMAIN=${2:-"yourdomain.com"}

echo -e "${BLUE}🚀 Starting RevampIT deployment to $ENVIRONMENT${NC}"

# Function to log with timestamp
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f .env ]; then
        echo -e "${RED}❌ .env file not found. Please copy environment.example to .env and configure it.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Load environment variables
load_environment() {
    log "Loading environment variables..."
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✅ Environment loaded${NC}"
}

# Backup current deployment
backup_current() {
    if [ -d "backup" ]; then
        log "Creating backup of current deployment..."
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        mkdir -p "backups"
        cp -r . "backups/backup_$TIMESTAMP"
        echo -e "${GREEN}✅ Backup created: backups/backup_$TIMESTAMP${NC}"
    fi
}

# Build and test application
build_and_test() {
    log "Building and testing application..."

    # Install dependencies
    npm ci

    # Run linting
    npm run lint

    # Run type checking
    npx tsc --noEmit

    # Run tests if they exist
    if [ -d "__tests__" ] || [ -f "jest.config.js" ]; then
        npm test -- --watchAll=false --passWithNoTests
    fi

    echo -e "${GREEN}✅ Build and tests passed${NC}"
}

# Start services
start_services() {
    log "Starting services..."

    # Pull latest images
    docker-compose -f docker-compose.production.yml pull

    # Start services
    docker-compose -f docker-compose.production.yml up -d

    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    ./scripts/check-services.sh

    echo -e "${GREEN}✅ Services started successfully${NC}"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."

    # Run CMS migrations if they exist
    if [ -f "scripts/db/migrate.js" ]; then
        npm run db:migrate
    fi

    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Setup SSL certificates
setup_ssl() {
    if [ "$ENVIRONMENT" = "production" ] && [ -n "$DOMAIN" ]; then
        log "Setting up SSL certificates for $DOMAIN..."

        # Check if certbot is available
        if command -v certbot &> /dev/null; then
            certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN"
            echo -e "${GREEN}✅ SSL certificates configured${NC}"
        else
            echo -e "${YELLOW}⚠️  Certbot not found. Please configure SSL manually.${NC}"
        fi
    fi
}

# Run health checks
health_check() {
    log "Running final health checks..."

    # Check application health
    if curl -f -s "http://localhost:3000/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Application health check passed${NC}"
    else
        echo -e "${RED}❌ Application health check failed${NC}"
        exit 1
    fi
}

# Main deployment process
main() {
    log "Starting deployment process..."

    check_prerequisites
    load_environment
    backup_current
    build_and_test
    start_services
    run_migrations
    setup_ssl
    health_check

    log "🎉 Deployment completed successfully!"
    echo
    echo -e "${GREEN}Application is now running at: https://$DOMAIN${NC}"
    echo -e "${BLUE}Admin panel: https://admin.$DOMAIN${NC}"
    echo -e "${BLUE}API: https://api.$DOMAIN${NC}"
    echo
    echo -e "${YELLOW}Don't forget to:${NC}"
    echo "  - Update DNS records if needed"
    echo "  - Configure monitoring and alerts"
    echo "  - Set up backup schedules"
    echo "  - Test all critical functionality"
}

# Run main function
main "$@"