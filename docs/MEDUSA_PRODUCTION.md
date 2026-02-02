# Medusa Production Deployment (FREE)

Deploy Medusa for free - no server required.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION (100% FREE)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Vercel (Next.js Frontend) - FREE                               │
│   https://revampit.vercel.app                                    │
│        │                                                         │
│        │ API Routes proxy to Medusa                              │
│        ▼                                                         │
│   Koyeb (Medusa Backend) - FREE                                  │
│   https://revampit-medusa.koyeb.app                              │
│        │                                                         │
│        ├──► Neon PostgreSQL - FREE (500MB)                       │
│        └──► Upstash Redis - FREE (10K cmd/day)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Option A: Koyeb (FREE - Always On)

### Step 1: Create free accounts

1. **Neon** (PostgreSQL): [neon.tech](https://neon.tech) - create project "revampit-medusa"
2. **Upstash** (Redis): [upstash.com](https://upstash.com) - create Redis database
3. **Koyeb**: [koyeb.com](https://koyeb.com) - sign up

### Step 2: Deploy to Koyeb

```bash
# Install Koyeb CLI
curl -fsSL https://raw.githubusercontent.com/koyeb/koyeb-cli/master/install.sh | bash

# Login
koyeb login

# Deploy from GitHub
koyeb app create revampit-medusa \
  --git github.com/g-but/revampit \
  --git-branch main \
  --git-workdir medusa-backend \
  --git-dockerfile Dockerfile.prod \
  --ports 9000:http \
  --routes /:9000 \
  --instance-type nano \
  --regions fra \
  --env DATABASE_URL="<neon-connection-string>" \
  --env REDIS_URL="<upstash-connection-string>" \
  --env JWT_SECRET="$(openssl rand -base64 32)" \
  --env COOKIE_SECRET="$(openssl rand -base64 32)" \
  --env STORE_CORS="https://revampit.vercel.app" \
  --env ADMIN_CORS="https://revampit.vercel.app" \
  --env AUTH_CORS="https://revampit.vercel.app"
```

Or deploy via Koyeb dashboard:
1. Go to [app.koyeb.com](https://app.koyeb.com)
2. Create App → GitHub → Select `g-but/revampit`
3. Set work directory: `medusa-backend`
4. Set Dockerfile: `Dockerfile.prod`
5. Add environment variables (see above)
6. Select `nano` instance (free)
7. Deploy

### Step 3: Run migrations

```bash
koyeb exec revampit-medusa -- npx medusa migrations run
koyeb exec revampit-medusa -- npm run seed
```

### Step 4: Get publishable key

1. Open: `https://revampit-medusa.koyeb.app/app`
2. Create admin account
3. Settings → API Keys → Create publishable key

### Step 5: Configure Vercel

```bash
vercel env add MEDUSA_BACKEND_URL production
# Enter: https://revampit-medusa.koyeb.app

vercel env add NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY production
# Enter: pk_...

vercel --prod
```

---

## Option B: Self-Hosted (Your Server)

### Step 1: Copy to server

```bash
# SSH into your server
ssh user@your-server

# Clone repo
git clone https://github.com/g-but/revampit.git
cd revampit/medusa-backend
```

### Step 2: Create Neon Database (FREE)

1. Go to [neon.tech](https://neon.tech)
2. Create project: "revampit-medusa"
3. Copy the connection string

### Step 3: Configure environment

```bash
# Create .env
cat > .env << 'EOF'
# Neon PostgreSQL (paste your connection string)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Generate with: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-here
COOKIE_SECRET=your-cookie-secret-here
EOF

# Generate actual secrets
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 32)|" .env
sed -i "s|COOKIE_SECRET=.*|COOKIE_SECRET=$(openssl rand -base64 32)|" .env
```

### Step 4: Deploy with Docker

```bash
# Start Medusa + Redis
docker compose -f docker-compose.prod.yml up -d --build

# Check health
curl http://localhost:9000/health
```

### Step 5: Run migrations & seed

```bash
docker compose -f docker-compose.prod.yml exec medusa npx medusa migrations run
docker compose -f docker-compose.prod.yml exec medusa npm run seed
```

### Step 6: Set up HTTPS with Caddy

```bash
# Install Caddy
sudo apt install caddy

# Configure
sudo tee /etc/caddy/Caddyfile << 'EOF'
medusa.revampit.ch {
    reverse_proxy localhost:9000
}
EOF

sudo systemctl restart caddy
```

### Step 7: Get Publishable Key

1. Open: `https://medusa.revampit.ch/app`
2. Create admin account
3. Go to Settings → API Keys
4. Create publishable key (starts with `pk_`)

### Step 8: Configure Vercel

```bash
# Set environment variables
vercel env add MEDUSA_BACKEND_URL production
# Enter: https://medusa.revampit.ch

vercel env add NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY production
# Enter: pk_your_key_here

# Redeploy
vercel --prod
```

## Verify

```bash
# Check Medusa health
curl https://medusa.revampit.ch/health

# Check frontend
open https://revampit.vercel.app/shop
```

## Environment Variables

### Your Server (.env)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `COOKIE_SECRET` | `openssl rand -base64 32` |

CORS is pre-configured in `docker-compose.prod.yml` for `revampit.vercel.app`.

### Vercel

| Variable | Value |
|----------|-------|
| `MEDUSA_BACKEND_URL` | `https://medusa.revampit.ch` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_...` from Medusa Admin |

## Troubleshooting

**Products not showing?**
- Check publishable key is set in Vercel
- Verify region exists in Medusa Admin

**CORS errors?**
- Verify `STORE_CORS` includes your frontend URL
- Check `docker-compose.prod.yml` has correct domain

**Database errors?**
- Run migrations: `docker compose exec medusa npx medusa migrations run`
- Check Neon connection string is correct
