#!/bin/bash
# Rollback script for RevampIT production deployment
# Use this if something goes wrong with the production deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="revampit"
REMOTE_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="/opt/backups/${PROJECT_NAME}"

echo -e "${RED}⚠️  PRODUCTION ROLLBACK SCRIPT${NC}"
echo "This will stop production services and restore from backup if available."
echo ""

read -p "Are you sure you want to rollback production? (yes/NO): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Rollback cancelled."
    exit 0
fi

echo -e "${YELLOW}🔄 Starting production rollback...${NC}"

# Stop production services
echo "Stopping production services..."
docker compose -f docker-compose.prod.yml down || true

# Restore from backup if available
if [ -d "${BACKUP_DIR}" ]; then
    echo "Looking for recent backups..."
    LATEST_DB_BACKUP=$(ls -t ${BACKUP_DIR}/db_*.sql.gz 2>/dev/null | head -1)
    LATEST_MEDUSA_BACKUP=$(ls -t ${BACKUP_DIR}/medusa_db_*.sql.gz 2>/dev/null | head -1)

    if [ -n "$LATEST_DB_BACKUP" ]; then
        echo "Found database backup: $LATEST_DB_BACKUP"
        read -p "Restore database from backup? (YES/no): " -r
        if [[ ! $REPLY =~ ^[Nn][Oo]$ ]]; then
            echo "Restoring database..."
            gunzip < "$LATEST_DB_BACKUP" | docker exec -i revampit_db_prod psql -U revampit_prod -d revampit_cms
        fi
    fi

    if [ -n "$LATEST_MEDUSA_BACKUP" ]; then
        echo "Found Medusa database backup: $LATEST_MEDUSA_BACKUP"
        read -p "Restore Medusa database from backup? (YES/no): " -r
        if [[ ! $REPLY =~ ^[Nn][Oo]$ ]]; then
            echo "Restoring Medusa database..."
            gunzip < "$LATEST_MEDUSA_BACKUP" | docker exec -i revampit_medusa_db_prod psql -U medusa_prod -d medusa_db
        fi
    fi
else
    echo "No backup directory found at ${BACKUP_DIR}"
fi

# Restart services
read -p "Restart production services? (YES/no): " -r
if [[ ! $REPLY =~ ^[Nn][Oo]$ ]]; then
    echo "Restarting production services..."
    docker compose -f docker-compose.prod.yml up -d
    echo "Waiting for services to be healthy..."
    sleep 30
fi

echo -e "${GREEN}✅ Rollback completed${NC}"
echo ""
echo "Next steps:"
echo "1. Check application health: curl http://localhost:3000/health"
echo "2. Verify all services are running: docker compose -f docker-compose.prod.yml ps"
echo "3. Check application logs: docker compose -f docker-compose.prod.yml logs -f app"