# Medusa Production Deployment

This guide covers deploying the Medusa backend for production use with the RevampIT Next.js frontend on Vercel.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Vercel (Next.js Frontend)                                      │
│   https://revampit.vercel.app                                    │
│        │                                                         │
│        │ API Routes proxy to Medusa                              │
│        ▼                                                         │
│   Railway/Render (Medusa Backend)                                │
│   https://revampit-medusa.railway.app                           │
│        │                                                         │
│        ├──► Neon PostgreSQL (Medusa DB)                         │
│        └──► Upstash Redis (Cache/Events)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Options

### Option A: Railway (Recommended)

Railway provides a managed platform with easy PostgreSQL and Redis integration.

#### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign up
2. Create a new project
3. Add services:
   - **PostgreSQL** (or use Neon connection string)
   - **Redis** (or use Upstash)
   - **GitHub Repo** (point to `medusa-backend` folder)

#### Step 2: Configure Environment Variables

In Railway dashboard, set these variables:

```bash
# Database (Railway PostgreSQL or Neon)
DATABASE_URL=postgresql://...

# Redis (Railway Redis or Upstash)
REDIS_URL=redis://...

# Security (generate with: openssl rand -base64 32)
JWT_SECRET=<generated-secret>
COOKIE_SECRET=<generated-secret>

# CORS
STORE_CORS=https://revampit.vercel.app
ADMIN_CORS=https://revampit.vercel.app
AUTH_CORS=https://revampit.vercel.app

# Admin
MEDUSA_ADMIN_ONBOARDING_TYPE=default
```

#### Step 3: Deploy

Railway will auto-deploy from the `medusa-backend` directory using `railway.json`.

### Option B: Render

1. Go to [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repo
4. Set root directory to `medusa-backend`
5. Build command: `npm install && npm run build`
6. Start command: `npm run start`
7. Add environment variables (same as Railway)

### Option C: Self-Hosted (DigitalOcean/Hetzner)

Use `Dockerfile.prod` for container deployment:

```bash
# Build
docker build -f Dockerfile.prod -t medusa-backend .

# Run
docker run -d \
  -p 9000:9000 \
  -e DATABASE_URL="..." \
  -e REDIS_URL="..." \
  -e JWT_SECRET="..." \
  -e COOKIE_SECRET="..." \
  -e STORE_CORS="https://revampit.vercel.app" \
  -e ADMIN_CORS="https://revampit.vercel.app" \
  -e AUTH_CORS="https://revampit.vercel.app" \
  medusa-backend
```

## Configure Vercel Frontend

Once your Medusa backend is deployed, update Vercel environment variables:

### Using Vercel CLI

```bash
# Set Medusa backend URL
vercel env add MEDUSA_BACKEND_URL production
# Enter: https://your-medusa-backend.railway.app

# Set publishable key (get from Medusa admin)
vercel env add NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY production
# Enter: pk_...

# Trigger redeployment
vercel --prod
```

### Using Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select the RevampIT project
3. Go to Settings → Environment Variables
4. Add:
   - `MEDUSA_BACKEND_URL` = `https://your-medusa-backend.railway.app`
   - `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` = `pk_...`
5. Redeploy

## Get Publishable Key from Medusa

1. Access Medusa Admin: `https://your-medusa-backend.railway.app/app`
2. Log in (create admin user during first seed)
3. Go to Settings → API Keys
4. Create a new publishable key
5. Copy the key (starts with `pk_`)

## Database Migration

After first deploy, run migrations:

```bash
# SSH into Railway/Render or use Railway CLI
railway run npx medusa migrations run
railway run npm run seed
```

## Verify Deployment

### Health Check

```bash
curl https://your-medusa-backend.railway.app/health
# Should return: { "status": "ok" }
```

### Test Store API

```bash
curl https://your-medusa-backend.railway.app/store/products
# Should return products list
```

### Test Frontend

1. Visit https://revampit.vercel.app/shop
2. Products should load from Medusa
3. Cart functionality should work

## Troubleshooting

### "Cannot connect to Medusa"

- Check `MEDUSA_BACKEND_URL` is correct in Vercel
- Verify Medusa is running: `curl <medusa-url>/health`
- Check CORS settings allow your frontend domain

### "Products not showing"

- Verify publishable key is set: `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- Check products exist in Medusa Admin
- Verify region is configured (required for store API)

### "Cart errors"

- Ensure Redis is connected (required for sessions)
- Check region and shipping options are configured

## Environment Variables Summary

### Medusa Backend (Railway/Render)

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | `postgresql://...` |
| `REDIS_URL` | Yes | `redis://...` |
| `JWT_SECRET` | Yes | 32+ char secret |
| `COOKIE_SECRET` | Yes | 32+ char secret |
| `STORE_CORS` | Yes | `https://revampit.vercel.app` |
| `ADMIN_CORS` | Yes | `https://revampit.vercel.app` |
| `AUTH_CORS` | Yes | `https://revampit.vercel.app` |

### Vercel Frontend

| Variable | Required | Example |
|----------|----------|---------|
| `MEDUSA_BACKEND_URL` | Yes | `https://medusa.railway.app` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Yes | `pk_...` |
