#!/bin/bash
# Configure Medusa environment variables in Vercel
# Usage: ./scripts/configure-medusa-vercel.sh <medusa-backend-url> <publishable-key>

set -e

MEDUSA_URL=${1:-""}
PUBLISHABLE_KEY=${2:-""}

if [ -z "$MEDUSA_URL" ] || [ -z "$PUBLISHABLE_KEY" ]; then
    echo "Usage: $0 <medusa-backend-url> <publishable-key>"
    echo ""
    echo "Example:"
    echo "  $0 https://revampit-medusa.railway.app pk_abc123..."
    echo ""
    echo "To get the publishable key:"
    echo "  1. Open Medusa Admin: <medusa-url>/app"
    echo "  2. Go to Settings > API Keys"
    echo "  3. Create a publishable key"
    exit 1
fi

echo "Configuring Medusa for Vercel production..."
echo "Medusa URL: $MEDUSA_URL"
echo "Publishable Key: ${PUBLISHABLE_KEY:0:10}..."
echo ""

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

# Add environment variables
echo "Adding MEDUSA_BACKEND_URL..."
echo "$MEDUSA_URL" | vercel env add MEDUSA_BACKEND_URL production --force

echo "Adding NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY..."
echo "$PUBLISHABLE_KEY" | vercel env add NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY production --force

echo ""
echo "Environment variables configured!"
echo ""
echo "Next steps:"
echo "  1. Trigger a new deployment: vercel --prod"
echo "  2. Visit https://revampit.vercel.app/shop to verify"
echo ""
