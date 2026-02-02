#!/bin/bash
# Deploy Medusa on your own server (FREE)
#
# Prerequisites:
#   - Docker & Docker Compose installed
#   - Port 9000 open (or use reverse proxy)
#
# Usage:
#   1. Copy medusa-backend folder to your server
#   2. Create .env file with your secrets
#   3. Run: ./deploy.sh

set -e

# Check for .env file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'ENVFILE'
# Neon PostgreSQL (free tier) - get from neon.tech dashboard
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/medusa_db?sslmode=require

# Generate secrets with: openssl rand -base64 32
JWT_SECRET=CHANGE_ME_generate_with_openssl
COOKIE_SECRET=CHANGE_ME_generate_with_openssl
ENVFILE
    echo ""
    echo "⚠️  Edit .env with your Neon DATABASE_URL and generate secrets!"
    echo "   openssl rand -base64 32"
    echo ""
    exit 1
fi

# Validate env
source .env
if [[ "$JWT_SECRET" == *"CHANGE_ME"* ]]; then
    echo "⚠️  Please set JWT_SECRET in .env"
    echo "   Generate with: openssl rand -base64 32"
    exit 1
fi

echo "🚀 Deploying Medusa..."

# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# Wait for health
echo "⏳ Waiting for Medusa to start..."
sleep 10

# Check health
if curl -s http://localhost:9000/health | grep -q "OK"; then
    echo ""
    echo "✅ Medusa is running!"
    echo ""
    echo "Next steps:"
    echo "  1. Set up reverse proxy (nginx/caddy) for HTTPS"
    echo "  2. Open Medusa Admin: http://your-server:9000/app"
    echo "  3. Create publishable API key in Settings > API Keys"
    echo "  4. Configure Vercel with your server URL"
    echo ""
else
    echo "❌ Medusa health check failed"
    docker compose -f docker-compose.prod.yml logs medusa
    exit 1
fi
