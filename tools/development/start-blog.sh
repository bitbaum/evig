#!/bin/bash

# RevampIT Blog Self-Hosted Setup Script
# This script sets up the complete blog system locally

set -e  # Exit on any error

echo "🚀 Setting up RevampIT Blog (Self-Hosted)"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running"

# Create environment files
print_status "Creating environment files..."

# Create .env.local for Next.js
cat > .env.local << 'EOF'
# Next.js Environment Variables
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=will-be-generated-after-setup
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# Local Development Database
DATABASE_URL=postgresql://strapi:strapi_password_2024@localhost:5432/strapi_db
EOF

# Create strapi/.env
cat > strapi/.env << 'EOF'
# Strapi Environment Variables
NODE_ENV=development
HOST=0.0.0.0
PORT=1337

# Self-hosted PostgreSQL Database
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://strapi:strapi_password_2024@postgres:5432/strapi_db

# Generated JWT secrets (will be replaced with real ones)
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
ADMIN_JWT_SECRET=b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456a1
TRANSFER_TOKEN_SALT=c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456a1b2
API_TOKEN_SALT=d4e5f6789012345678901234567890abcdef1234567890abcdef123456a1b2c3
APP_KEYS=key1,key2,key3,key4

# File uploads (local storage)
UPLOAD_PROVIDER=local
UPLOAD_DIR=./public/uploads
EOF

print_status "Environment files created"

# Generate secure JWT secrets
print_status "Generating secure JWT secrets..."

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ADMIN_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
TRANSFER_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
API_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

print_status "Updating Strapi environment with real secrets..."

# Update strapi/.env with generated secrets
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" strapi/.env
sed -i "s/ADMIN_JWT_SECRET=.*/ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET/" strapi/.env
sed -i "s/TRANSFER_TOKEN_SALT=.*/TRANSFER_TOKEN_SALT=$TRANSFER_TOKEN_SALT/" strapi/.env
sed -i "s/API_TOKEN_SALT=.*/API_TOKEN_SALT=$API_TOKEN_SALT/" strapi/.env

print_status "Secrets updated successfully"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p postgres-init
mkdir -p strapi/public/uploads

# Stop any existing containers
print_status "Stopping any existing containers..."
docker compose down --remove-orphans

# Build and start services
print_status "Building and starting services..."
docker compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 15

# Check if services are running
if docker compose ps | grep -q "Up"; then
    print_status "Services are running!"
else
    print_error "Some services failed to start. Check logs with: docker compose logs"
    exit 1
fi

# Display service status
echo ""
echo "📊 Service Status:"
echo "=================="
docker compose ps

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📝 Next Steps:"
echo "1. 🌐 Visit http://localhost:3000/blog (Blog frontend)"
echo "2. ⚙️  Visit http://localhost:1337/admin (Strapi admin)"
echo "3. 🗄️  Visit http://localhost:5050 (PostgreSQL admin - optional)"
echo ""
echo "🔑 Admin Credentials (for PgAdmin):"
echo "   Email: admin@revampit.ch"
echo "   Password: admin123"
echo ""
echo "💡 To create your first blog post:"
echo "   1. Go to Strapi admin and create your admin user"
echo "   2. Create an API token (Settings → API Tokens)"
echo "   3. Update .env.local with your API token"
echo "   4. Create your first blog post with status 'published'"
echo ""
echo "🔧 Useful Commands:"
echo "   docker compose logs strapi    # View Strapi logs"
echo "   docker compose logs postgres  # View database logs"
echo "   docker compose down          # Stop all services"
echo "   docker compose up -d         # Start all services"
echo ""
echo "🚀 To start with PgAdmin interface:"
echo "   docker compose --profile admin up -d"
echo "" 