#!/bin/bash

# RevampIT Deployment Script
# Deploys to Vercel with all environment variables configured

echo "🚀 RevampIT Deployment Script"
echo "================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📋 Configuring Production Environment Variables..."
echo ""

# Set production environment variables
vercel env add AUTH_SECRET production <<< "H3ILiEezak4ZDP0s5TO7yYW8XStMuvwD7mI84Sl6pD0JvlN/GeJSMXeS3y13xFdy+1AdjyGjWedApLAXNALbUA=="
vercel env add NEXTAUTH_SECRET production <<< "H3ILiEezak4ZDP0s5TO7yYW8XStMuvwD7mI84Sl6pD0JvlN/GeJSMXeS3y13xFdy+1AdjyGjWedApLAXNALbUA=="
vercel env add JWT_SECRET production <<< "e1OjjEBy3d9eE4Wm5cPDD+PLDHReR9VYX8CZ5eIWKj4sguO1hXKPtjimemSmMgiD2CqFXbIehNK6Us1zMMSi3w=="
vercel env add ADMIN_PASSWORD production <<< "jHknY0BvshhG4yFY1FJIGvRfon7f7W0ccMnmLHMmV1IMvZtHclKa1HZAd2zilm2C"
vercel env add NEXTAUTH_URL production <<< "https://revampit.vercel.app"
vercel env add NEXT_PUBLIC_SITE_URL production <<< "https://revampit.vercel.app"
vercel env add NEXT_PUBLIC_APP_URL production <<< "https://revampit.vercel.app"
vercel env add FRONTEND_URL production <<< "https://revampit.vercel.app"
vercel env add NODE_ENV production <<< "production"
vercel env add NEXT_PUBLIC_SITE_NAME production <<< "RevampIT"
vercel env add NEXT_PUBLIC_SITE_DESCRIPTION production <<< "Sustainable Technology for Everyone"
vercel env add ENABLE_CMS production <<< "false"
vercel env add NEXT_PUBLIC_ENABLE_ROLE_SELECTION_ON_REGISTER production <<< "true"
vercel env add SUPPORT_EMAIL production <<< "support@revampit.ch"
vercel env add EMAIL_FROM production <<< "noreply@revampit.ch"

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "🚀 Deploying to production..."
echo ""

# Deploy to production
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Deployment Status:"
echo "- URL: https://revampit.vercel.app"
echo "- Email: TEST MODE (emails will be logged, not sent)"
echo "- Database: Configure Vercel Postgres or external DB"
echo ""
echo "📝 Next Steps:"
echo "1. Configure database (Vercel Postgres or external)"
echo "2. Add Oracle Cloud + Postal for FREE email (see docs/FREE_EMAIL_SOLUTIONS.md)"
echo "3. Test the deployment"
echo ""
