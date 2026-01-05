#!/bin/bash
# Rollback script for RevampIT deployment
# Use this to revert to a previous working state

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKUP_DIR=${1:-"backups"}

echo -e "${BLUE}🔄 Starting rollback process...${NC}"

# Function to log with timestamp
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Find latest backup
find_latest_backup() {
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}❌ Backup directory $BACKUP_DIR not found${NC}"
        exit 1
    fi

    LATEST_BACKUP=$(ls -td "$BACKUP_DIR"/backup_* | head -1)

    if [ -z "$LATEST_BACKUP" ]; then
        echo -e "${RED}❌ No backups found in $BACKUP_DIR${NC}"
        exit 1
    fi

    echo "$LATEST_BACKUP"
}

# Stop current services
stop_services() {
    log "Stopping current services..."

    if command -v docker-compose &> /dev/null && [ -f "docker-compose.production.yml" ]; then
        docker-compose -f docker-compose.production.yml down
    fi

    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Restore from backup
restore_backup() {
    local backup_path=$1

    log "Restoring from backup: $backup_path"

    # Create backup of current state (just in case)
    CURRENT_BACKUP="$BACKUP_DIR/backup_before_rollback_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$CURRENT_BACKUP"

    # Copy important files
    cp -r .env "$CURRENT_BACKUP/" 2>/dev/null || true
    cp -r docker-compose*.yml "$CURRENT_BACKUP/" 2>/dev/null || true

    # Restore application files
    cp -r "$backup_path"/* ./

    echo -e "${GREEN}✅ Backup restored from $backup_path${NC}"
    echo -e "${YELLOW}⚠️  Current state backed up to $CURRENT_BACKUP${NC}"
}

# Restart services
restart_services() {
    log "Restarting services..."

    if [ -f "docker-compose.production.yml" ]; then
        docker-compose -f docker-compose.production.yml up -d
    fi

    # Wait for services to be healthy
    sleep 30

    echo -e "${GREEN}✅ Services restarted${NC}"
}

# Verify rollback
verify_rollback() {
    log "Verifying rollback..."

    # Check if services are running
    if curl -f -s "http://localhost:3000/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is responding${NC}"
    else
        echo -e "${YELLOW}⚠️  Application may not be fully ready yet${NC}"
    fi
}

# Main rollback process
main() {
    LATEST_BACKUP=$(find_latest_backup)

    echo -e "${YELLOW}⚠️  This will rollback to: $LATEST_BACKUP${NC}"
    echo -e "${YELLOW}⚠️  Make sure this is what you want to do!${NC}"
    echo
    read -p "Continue with rollback? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Rollback cancelled."
        exit 0
    fi

    log "Starting rollback to $LATEST_BACKUP"

    stop_services
    restore_backup "$LATEST_BACKUP"
    restart_services
    verify_rollback

    log "🎉 Rollback completed successfully!"
    echo
    echo -e "${GREEN}System has been rolled back to the previous working state.${NC}"
    echo -e "${YELLOW}Please verify that everything is working as expected.${NC}"
}

# Run main function
main "$@"