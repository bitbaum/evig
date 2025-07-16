#!/bin/bash

echo "Setting up Docker environment for Strapi..."

# Stop and remove existing containers
docker-compose down -v

# Remove existing images
docker rmi strapi-app 2>/dev/null || true

# Build and start services
echo "Building and starting services..."
docker-compose up --build -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Check if containers are running
echo "Checking container status..."
docker-compose ps

# Show logs
echo "Showing Strapi logs..."
docker-compose logs strapi

echo "Setup complete!"
echo "Strapi should be available at: http://localhost:1337"
echo "Admin panel: http://localhost:1337/admin"
echo "Database is accessible at: localhost:5434"