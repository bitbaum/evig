#!/bin/bash
# =============================================================================
# Listmonk Setup Script for RevampIT
# =============================================================================
# This script initializes Listmonk for first-time use.
#
# Prerequisites:
# - Docker and docker-compose installed
# - PostgreSQL database running (revampit_db)
#
# Usage:
#   ./scripts/setup-listmonk.sh
# =============================================================================

set -e

echo "🚀 Setting up Listmonk for RevampIT..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if the database is running
if ! docker ps | grep -q revampit_db; then
    echo "📦 Starting database..."
    docker-compose up -d db
    echo "⏳ Waiting for database to be ready..."
    sleep 10
fi

# Run Listmonk installation (creates tables)
echo "📧 Installing Listmonk (creating database tables)..."
docker-compose run --rm listmonk ./listmonk --install --config /listmonk/config.toml --yes

echo ""
echo "✅ Listmonk setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start Listmonk:  docker-compose up -d listmonk"
echo "   2. Open admin UI:   http://localhost:9090"
echo "   3. Login with:"
echo "      Username: admin"
echo "      Password: revampit2024"
echo ""
echo "🔧 Configure SMTP in Listmonk Admin:"
echo "   Settings → SMTP → Add your Gmail/SMTP credentials"
echo ""
echo "📬 Listmonk is now ready to send transactional emails!"
