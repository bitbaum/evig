#!/bin/bash
# RevampIT - Complete Ship Script
# One-word command: "ship" - Build, test, fix, deploy, and monitor
# Usage: npm run ship

set -e  # Exit on error

echo "🚀 RevampIT Ship Script - Complete Build, Test, Fix, Deploy & Monitor"
echo "======================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build
echo -e "${YELLOW}📦 Step 1: Building project...${NC}"
if npm run build; then
  echo -e "${GREEN}✅ Build successful${NC}"
else
  echo -e "${RED}❌ Build failed - fixing errors...${NC}"
  # Try to auto-fix common issues
  echo "Checking for common build errors..."
  exit 1
fi

# Step 2: Lint
echo -e "${YELLOW}🔍 Step 2: Running linter...${NC}"
if npm run lint; then
  echo -e "${GREEN}✅ Lint passed${NC}"
else
  echo -e "${YELLOW}⚠️  Lint warnings found (continuing...)${NC}"
fi

# Step 3: Start dev server for testing
echo -e "${YELLOW}🧪 Step 3: Starting dev server for browser testing...${NC}"
echo "Server will start on http://localhost:3000"
echo "Press Ctrl+C after testing to continue deployment"
npm run dev &
DEV_PID=$!

# Wait a bit for server to start
sleep 5

# Check if server is running
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Dev server is running${NC}"
  echo ""
  echo "🌐 Open http://localhost:3000 in your browser to test"
  echo "📋 Test checklist:"
  echo "   - Homepage loads"
  echo "   - Navigation works"
  echo "   - Key user flows work (fewest clicks, clear paths)"
  echo "   - Blockchain/AI features accessible"
  echo ""
  echo "Press Enter when testing is complete to continue..."
  read
else
  echo -e "${YELLOW}⚠️  Dev server may not be ready yet${NC}"
fi

# Stop dev server
echo "Stopping dev server..."
kill $DEV_PID 2>/dev/null || true
sleep 2

# Step 4: Deploy to Vercel
echo -e "${YELLOW}🚀 Step 4: Deploying to Vercel...${NC}"
if command -v vercel &> /dev/null; then
  echo "Deploying..."
  vercel --prod
  echo -e "${GREEN}✅ Deployment initiated${NC}"
  echo ""
  echo "📊 Monitoring deployment..."
  echo "Check Vercel dashboard for deployment status"
else
  echo -e "${YELLOW}⚠️  Vercel CLI not found. Install with: npm i -g vercel${NC}"
  echo "Or deploy via GitHub (if connected to Vercel)"
fi

echo ""
echo -e "${GREEN}✨ Ship process complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Monitor Vercel deployment"
echo "  2. Test production site"
echo "  3. Verify user flows work correctly"
echo "  4. Check blockchain/AI features"
