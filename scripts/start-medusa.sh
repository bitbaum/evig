#!/bin/bash

echo "🚀 Starting Medusa services..."

# Check if Medusa containers are already running
if docker ps --format "table {{.Names}}" | grep -q "revampit_medusa"; then
    echo "✅ Medusa containers are already running"
else
    echo "📦 Starting Medusa containers..."

    # Stop any existing containers first to avoid conflicts
    docker compose -f docker-compose.medusa.yml down --remove-orphans 2>/dev/null || true

    # Start fresh
    docker compose -f docker-compose.medusa.yml up -d

    if [ $? -eq 0 ]; then
        echo "✅ Medusa containers started successfully"
        echo "⏳ Waiting 15 seconds for databases to be ready..."
        sleep 15
    else
        echo "❌ Failed to start Medusa containers"
        exit 1
    fi
fi

# Check if Medusa backend is running
if pgrep -f "medusa develop" > /dev/null; then
    echo "✅ Medusa backend is already running"
else
    echo "🔧 Starting Medusa backend..."
    # This will be started by the concurrent command
fi

echo "🎉 Medusa services ready!"
