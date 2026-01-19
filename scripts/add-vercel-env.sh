#!/bin/bash

# Add environment variables to Vercel production

echo "🔐 Adding Environment Variables to Vercel Production"
echo "====================================================="
echo ""

# Function to add env var
add_env() {
    local name=$1
    local value=$2
    echo "Adding: $name"
    echo "$value" | vercel env add "$name" production --force >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  ✅ Added"
    else
        echo "  ⚠️  May already exist or error"
    fi
}

# Authentication & Security
add_env "AUTH_SECRET" "H3ILiEezak4ZDP0s5TO7yYW8XStMuvwD7mI84Sl6pD0JvlN/GeJSMXeS3y13xFdy+1AdjyGjWedApLAXNALbUA=="
add_env "NEXTAUTH_SECRET" "H3ILiEezak4ZDP0s5TO7yYW8XStMuvwD7mI84Sl6pD0JvlN/GeJSMXeS3y13xFdy+1AdjyGjWedApLAXNALbUA=="
add_env "JWT_SECRET" "e1OjjEBy3d9eE4Wm5cPDD+PLDHReR9VYX8CZ5eIWKj4sguO1hXKPtjimemSmMgiD2CqFXbIehNK6Us1zMMSi3w=="
add_env "ADMIN_PASSWORD" "jHknY0BvshhG4yFY1FJIGvRfon7f7W0ccMnmLHMmV1IMvZtHclKa1HZAd2zilm2C"

# Site Configuration
add_env "NEXTAUTH_URL" "https://revampit.vercel.app"
add_env "NEXT_PUBLIC_SITE_URL" "https://revampit.vercel.app"
add_env "NEXT_PUBLIC_APP_URL" "https://revampit.vercel.app"
add_env "FRONTEND_URL" "https://revampit.vercel.app"
add_env "NODE_ENV" "production"

# Site Metadata
add_env "NEXT_PUBLIC_SITE_NAME" "RevampIT"
add_env "NEXT_PUBLIC_SITE_DESCRIPTION" "Sustainable Technology for Everyone"

# Feature Flags
add_env "ENABLE_CMS" "false"
add_env "NEXT_PUBLIC_ENABLE_ROLE_SELECTION_ON_REGISTER" "true"

# Email (placeholder)
add_env "EMAIL_FROM" "noreply@revampit.ch"
add_env "SUPPORT_EMAIL" "support@revampit.ch"

echo ""
echo "✅ Environment variables added!"
echo ""
echo "📝 Note: Email is in TEST MODE"
echo "   - Add Oracle Cloud + Postal later for FREE production emails"
echo "   - See: docs/FREE_EMAIL_SOLUTIONS.md"
echo ""
