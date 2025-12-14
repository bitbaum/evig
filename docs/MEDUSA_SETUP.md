# RevampIT Shop Setup Guide

This guide will help you get the RevampIT e-commerce backend running locally and integrate it with the Next.js frontend.

## Overview

The RevampIT shop is designed to be:
- **Beautiful**: Modern, polished UI/UX for both admin and customers
- **Flexible**: Easy to customize and extend
- **Cost-Effective**: No monthly SaaS fees (only transaction fees)
- **Fast**: Server-side rendering, optimized images, and efficient caching

## Architecture

```
┌─────────────────────┐
│   Next.js Frontend  │  Port 3000
│   (revampit.app)    │  - Shop UI
│                     │  - Product pages
│                     │  - Cart/Checkout
└──────────┬──────────┘
           │ API Proxy
           │ /api/medusa/*
           ↓
┌─────────────────────┐
│  RevampIT Backend   │  Port 9000
│  (Docker)           │  - API
│                     │  - Admin UI
└──────────┬──────────┘
           │
    ┌──────┴──────┬──────────┐
    ↓             ↓          ↓
┌────────┐  ┌─────────┐  ┌──────────┐
│Postgres│  │  Redis  │  │Meilisearch│
│Port 5434│ │Port 6379│  │Port 7700 │
└────────┘  └─────────┘  └──────────┘
```

## Quick Start

### 🚀 One-Command Setup (Recommended)

The easiest way to get everything running:

```bash
# Start ALL services (Frontend, CMS, RevampIT backend, databases)
npm run d

# Setup admin users for both CMS and RevampIT shop
npm run setup-admins
```

That's it! Everything will be running and ready to use.

### Manual Setup (Alternative)

If you prefer to start services individually:

#### 1. Start Medusa Backend Services

```bash
# Start all Medusa infrastructure (PostgreSQL, Redis, Meilisearch)
npm run medusa:up

# View logs
npm run medusa:logs

# Stop services
npm run medusa:down
```

#### 2. Start Frontend & CMS

```bash
# Start Next.js frontend and CMS API
npm run dev:full
```

### 3. Access Admin Panels

**CMS Admin Dashboard (Unified):**
- URL: http://localhost:3000/admin
- Features: User management, content editing, system shortcuts
- Credentials: admin@revampit.ch / Admin123!

**RevampIT Shop Admin:**
- URL: http://localhost:9000/app
- Features: Product management, orders, store settings
- Credentials: admin2@revampit.ch / Admin123!

**AI CMS Editor:**
- URL: http://localhost:3000/ai-cms
- Features: Edit pages, blog posts, and content

### 4. View Your Shop

Open http://localhost:3000/shop/medusa to see your e-commerce storefront.

## Unified Admin Experience

RevampIT now features a **unified admin dashboard** that brings together all your management tools in one place.

### Main Admin Dashboard (http://localhost:3000/admin)

The central hub for all administrative tasks:

- **System Overview**: Key metrics and recent activities
- **Quick Actions**: Direct links to user management, products, workshops, etc.
- **External Services**: One-click access to Medusa admin and CMS editor
- **Admin Shortcuts**: Copy-paste ready commands for common tasks
- **System Health**: Real-time status of all services

### Admin Shortcuts Features

Click any shortcut button to copy the command to your clipboard:

- **🚀 Start All Services**: `npm run d`
- **🛡️ Setup Admin Users**: `npm run setup-admins`
- **🗄️ Check Database Status**: `docker ps`
- **📋 View Logs**: `npm run medusa:logs`
- **🛒 RevampIT Admin**: Direct link to e-commerce management
- **📝 CMS Editor**: AI-powered content management
- **👁️ Shop Frontend**: Preview your store
- **➕ New Product**: Quick access to add products

### Seamless Workflow

1. **Start Everything**: Run `npm run d`
2. **Setup Admins**: Run `npm run setup-admins`
3. **Manage Content**: Use the unified admin dashboard
4. **Add Products**: Access RevampIT admin directly from dashboard
5. **Monitor System**: Check health and logs from shortcuts

## Project Structure

```
revampit/
├── docker-compose.medusa.yml    # RevampIT shop services
├── .env.medusa                  # Environment variables
├── medusa-uploads/              # Product images (created on first run)
│
├── src/
│   ├── lib/medusa/
│   │   ├── client.ts           # Medusa SDK client
│   │   ├── hooks.ts            # React Query hooks
│   │   └── providers.tsx       # Query Client provider
│   │
│   ├── components/shop/
│   │   └── ProductCard.tsx     # Product card component
│   │
│   └── app/shop/medusa/
│       ├── page.tsx            # Shop homepage
│       ├── cart/page.tsx       # Shopping cart
│       └── products/[handle]/page.tsx  # Product detail
```

## Features Implemented

### Phase 1 (Current) ✅
- ✅ **Unified Admin Experience**: Single dashboard combining CMS and e-commerce management
- ✅ **Super Intuitive Product Management**: Beautiful card-based product interface
- ✅ **One-Command Startup**: `npm run d` starts everything automatically
- ✅ **Automated Admin Setup**: `npm run setup-admins` creates all admin users
- ✅ **Admin Shortcuts**: Quick access buttons for common tasks
- ✅ RevampIT backend with PostgreSQL, Redis, Meilisearch
- ✅ Beautiful admin interfaces (both CMS and RevampIT shop)
- ✅ Product catalog with images
- ✅ Product detail pages
- ✅ Shopping cart functionality
- ✅ Responsive design (mobile-first)
- ✅ Dark mode support
- ✅ Loading states and error handling
- ✅ Image optimization

### Phase 2 (Planned)
- 🔄 Payment integration (Stripe, PayPal, TWINT)
- 🔄 Checkout flow
- 🔄 Order management
- 🔄 Email notifications
- 🔄 Shipping calculation

## Development Commands

### 🚀 Unified Commands (Recommended)

```bash
# Start EVERYTHING (Frontend + CMS + Medusa + Databases)
npm run d

# Setup all admin users (CMS + RevampIT shop)
npm run setup-admins

# Stop all services
npm run stop:all
```

### Individual Service Commands

```bash
# Frontend only
npm run dev

# CMS only
npm run dev:cms

# RevampIT + Frontend together
npm run dev:shop

# RevampIT services only
npm run medusa:up      # Start databases (detached)
npm run medusa:down    # Stop databases
npm run medusa:logs    # View logs

# Database access
# Access RevampIT PostgreSQL
docker exec -it revampit_medusa_db psql -U medusa -d medusa_db

# Access CMS PostgreSQL
docker exec -it revampit_db psql -U postgres -d revampit
```

## Environment Variables

The following environment variables are configured in `.env.local`:

```bash
# Medusa Backend URLs
NEXT_PUBLIC_MEDUSA_URL=http://localhost:9000
MEDUSA_API_URL=http://localhost:9000
```

## Troubleshooting

### RevampIT container won't start

```bash
# Check logs
docker compose -f docker-compose.medusa.yml logs medusa

# Common issue: Database not ready
# Solution: Wait 10-20 seconds for PostgreSQL to initialize
```

### Products not showing

1. Check RevampIT backend is running: http://localhost:9000/health
2. Check admin is accessible: http://localhost:9000/app
3. Verify products are published (not draft)
4. Check browser console for errors

### Images not loading

- RevampIT backend serves images from `/uploads` endpoint
- Ensure `medusa-uploads/` directory exists
- Check `next.config.js` has correct remote pattern:
  ```js
  remotePatterns: [
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '9000',
      pathname: '/**',
    },
  ]
  ```

### API proxy not working

- Verify `next.config.js` has rewrite rules
- Check `MEDUSA_API_URL` in `.env.local`
- Restart Next.js dev server after config changes

## Admin UI Tips

### Beautiful Product Listings
1. Use high-quality images (recommended: 1200x1200px)
2. Write clear, concise descriptions
3. Set proper categories/collections
4. Add product variants (size, color, etc.) if needed

### Organize with Collections
- Create collections like "Laptops", "Desktop Computers", "Accessories"
- Assign products to collections for easy filtering
- Collections appear as categories on the frontend

### Manage Inventory
- Enable "Track Inventory" for stock management
- Set low stock alerts
- Configure "Continue selling when out of stock" per product

## Performance Optimization

### Current Optimizations ✅
- Next.js Image component with automatic optimization
- React Query caching (1 minute stale time)
- Lazy loading for images
- Server-side rendering for product pages

### Future Optimizations 🔄
- ISR (Incremental Static Regeneration) for product pages
- Meilisearch integration for instant search
- CDN for product images
- Redis caching for frequently accessed data

## Security Notes

### Development
- Default credentials are in `.env.medusa`
- **Never commit real credentials to git**

### Production
- Change all default secrets
- Use environment variables
- Enable HTTPS/TLS
- Configure proper CORS
- Set up rate limiting

## Why RevampIT (Medusa) vs Shopware?

| Feature | RevampIT | Shopware |
|---------|--------|----------|
| **Admin UI** | ✅ Modern, React-based | ⚠️ Complex, older UI |
| **Flexibility** | ✅ Headless, API-first | ⚠️ Monolithic |
| **Cost** | ✅ Free, self-hosted | ⚠️ Expensive plugins |
| **Performance** | ✅ Fast, optimized | ⚠️ Heavy, resource-intensive |
| **Developer Experience** | ✅ Great docs, modern stack | ⚠️ Steeper learning curve |
| **Customization** | ✅ Easy to extend | ⚠️ Requires Symfony knowledge |

## Next Steps

### Immediate Actions (Do These First!)

1. **🎯 Test the Unified Experience**:
   ```bash
   npm run d                    # Start everything
   npm run setup-admins         # Create admin users
   ```
   Then visit http://localhost:3000/admin

2. **📦 Add Your Products**: Use the shortcuts in the admin dashboard to quickly access RevampIT admin and add your inventory

3. **🎨 Customize Your Store**: Adjust branding, colors, and settings through the unified admin interface

### Advanced Configuration

4. **🔧 Payment Integration**: Set up Stripe, PayPal, or TWINT for real transactions
5. **📧 Email Notifications**: Configure order confirmations and updates
6. **🚚 Shipping Rules**: Add shipping zones and rates
7. **📊 Analytics**: Monitor sales and customer behavior

### Demo Your Work

8. **🚀 Show Off the Experience**: Demonstrate how easy it is to manage everything from one dashboard!

---

**💡 Pro Tip**: The admin shortcuts automatically copy commands to your clipboard - just click any button and paste in your terminal!

## Support

- RevampIT Docs: https://docs.medusajs.com
- RevampIT Community: https://discord.gg/medusajs
- GitHub Issues: https://github.com/medusajs/medusa/issues

---

**Ready to impress your team?** Start the services and add some products! 🚀
