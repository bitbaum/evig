#!/bin/bash

# Fix Strapi Loading Issues
echo "🔧 Fixing Strapi loading issues..."

# Kill any existing Strapi processes
echo "🛑 Stopping existing Strapi processes..."
pkill -f "strapi develop" 2>/dev/null || true
lsof -ti:1337 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 2

# Clear any cached data
echo "🧹 Clearing Strapi cache..."
cd strapi
rm -rf dist/ .cache/ node_modules/.cache/ 2>/dev/null || true

# Rebuild Strapi
echo "🔨 Rebuilding Strapi..."
npm run build 2>/dev/null || true

# Start Strapi
echo "🚀 Starting Strapi..."
npm run dev &

# Wait for Strapi to start
echo "⏳ Waiting for Strapi to start..."
sleep 10

# Check if it's running
if curl -s http://localhost:1337/admin > /dev/null; then
    echo "✅ Strapi is now running at http://localhost:1337/admin"
else
    echo "❌ Strapi failed to start. Check the console for errors."
    echo "💡 Try running manually: cd strapi && npm run dev"
fi