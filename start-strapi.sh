#!/bin/bash

# Script to start Strapi containers

echo "Starting Strapi containers..."
docker-compose up -d

echo "Waiting for containers to start..."
sleep 5

echo "Checking container status..."
docker-compose ps

echo "Strapi should now be available at http://localhost:1337/admin"
echo "Follow the setup guide in strapi/app/setup-guide.md to configure content types" 