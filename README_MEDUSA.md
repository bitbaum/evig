# 🚀 Medusa Shop - Quick Start (Simplified)

Beautiful, modern e-commerce with Medusa + Next.js. No monthly fees, complete control.

## Current Status

✅ **Frontend Complete** - Beautiful shop UI built and ready
✅ **Infrastructure Running** - PostgreSQL, Redis, Meilisearch running in Docker
⏳ **Backend Setup** - Medusa backend needs manual installation (see below)

## Quick Start

### 1. Services are Running

```bash
# Check services status
docker compose -f docker-compose.medusa.yml ps

# You should see:
# - PostgreSQL (port 5435)
# - Redis (port 6380)
# - Meilisearch (port 7700)
```

### 2. Install Medusa Backend (One-Time Setup)

Medusa doesn't provide pre-built Docker images, so we need to install it manually:

```bash
# Option A: Use the official CLI (interactive)
npx create-medusa-app@latest

# Follow prompts:
# - Project name: medusa-backend
# - Database URL: postgresql://medusa:medusa_password@localhost:5435/medusa_db
# - Skip Next.js starter: No

# Option B: Manual installation (if CLI fails)
mkdir medusa-backend && cd medusa-backend
npm init -y
npm install @medusajs/medusa @medusajs/medusa-cli
npx medusa new . --skip-db
```

### 3. Configure Medusa

Edit `medusa-backend/medusa-config.js`:

```javascript
module.exports = {
  projectConfig: {
    database_url: "postgresql://medusa:medusa_password@localhost:5435/medusa_db",
    database_type: "postgres",
    store_cors: "http://localhost:3000",
    admin_cors: "http://localhost:9000",
    redis_url: "redis://localhost:6380",
  },
  plugins: [
    // Add plugins here
  ],
};
```

### 4. Run Migrations & Start Medusa

```bash
cd medusa-backend
npx medusa migrations run
npx medusa user -e admin@revampit.ch -p admin123
npx medusa develop
```

Medusa Admin will be available at: http://localhost:9000/app

### 5. Start Next.js Frontend

```bash
# In project root
npm run dev
```

Visit: http://localhost:3000/shop/medusa

## Alternative: Use Medusa Cloud (Easiest)

Instead of self-hosting, you can use Medusa Cloud for instant backend:

1. Sign up at https://medusajs.com/cloud
2. Create a new project
3. Get your API URL and publishable key
4. Update `.env.local`:
   ```
   NEXT_PUBLIC_MEDUSA_URL=https://your-project.medusa-cloud.com
   ```

## What You Get

✅ **Beautiful Shop UI** - /shop/medusa
  - Product listings with loading states
  - Product detail pages
  - Shopping cart
  - Responsive, dark mode

✅ **Modern Stack**
  - Next.js 14 with App Router
  - React Query for data fetching
  - Tailwind CSS
  - Framer Motion animations

✅ **No Payments Yet** - Focus on UX first, payments in Phase 2

## Project Structure

```
revampit/
├── docker-compose.medusa.yml    # Services (DB, Redis, Search)
├── medusa-backend/              # Medusa backend (to be created)
├── src/
│   ├── lib/medusa/
│   │   ├── client.ts           # Medusa SDK
│   │   ├── hooks.ts            # React Query hooks
│   │   └── providers.tsx       # Providers
│   ├── components/shop/
│   │   └── ProductCard.tsx     # Product card
│   └── app/shop/medusa/
│       ├── page.tsx            # Shop homepage
│       ├── cart/page.tsx       # Cart
│       └── products/[handle]/page.tsx  # Product page
```

## Troubleshooting

### Services not running?
```bash
docker compose -f docker-compose.medusa.yml up -d
docker compose -f docker-compose.medusa.yml logs
```

### Can't connect to database?
```bash
# Test connection
docker exec -it revampit_medusa_db psql -U medusa -d medusa_db
```

### Medusa installation fails?
Consider using Medusa Cloud instead - it's faster and maintained by the Medusa team.

## Why Medusa vs Shopware?

| | Medusa | Shopware |
|---|---|---|
| Admin UI | ⭐️ Modern & Beautiful | ❌ Complex |
| Setup | ⭐️ Simple (once installed) | ❌ Hours |
| Customization | ⭐️ Easy (React) | ❌ Hard (Symfony) |
| Cost | ⭐️ Free / Cloud | ❌ Expensive |
| Performance | ⭐️ Fast | ❌ Heavy |

## Full Documentation

See [docs/REVAMPIT_SHOP_SETUP.md](./docs/REVAMPIT_SHOP_SETUP.md) for detailed architecture and deployment info.

## Next Steps

1. **Choose your path**: Self-hosted or Medusa Cloud
2. **Set up backend**: Follow steps above
3. **Add products**: Use Medusa Admin
4. **Demo to team**: Show the beautiful UI!

---

**Questions?** Check docs/REVAMPIT_SHOP_SETUP.md
**Need help?** Medusa Discord: https://discord.gg/medusajs
