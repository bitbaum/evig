# Hosting Migration Guide: Vercel → Datacenter Thurgau (Frauenfeld)

**Created:** 2026-01-05  
**Last Modified:** 2026-01-05  
**Last Modified Summary:** Initial migration guide for moving from Vercel to Datacenter Thurgau in Frauenfeld

---

## 📋 Overview

This guide covers migrating RevampIT from the current **Vercel hosting** to a **self-hosted server** at Datacenter Thurgau in Frauenfeld. The migration involves moving from a serverless architecture to a traditional VPS/server setup with Docker.

---

## 🎯 Current Architecture

### Current Setup (Vercel)
- **Frontend:** Next.js on Vercel (serverless)
- **Backend:** Next.js API Routes on Vercel (serverless)
- **Database:** PostgreSQL (likely on separate VPS/cloud)
- **Medusa:** E-commerce backend (likely on separate server)
- **CDN:** Vercel Edge Network (global)

### Target Architecture (Frauenfeld Datacenter)
- **Frontend:** Next.js (Docker container)
- **Backend:** Next.js API Routes (same container)
- **Database:** PostgreSQL (Docker container)
- **Medusa:** E-commerce backend (Docker container)
- **Redis:** Caching/sessions (Docker container)
- **Meilisearch:** Search engine (Docker container)
- **Reverse Proxy:** Nginx/Traefik (SSL termination, routing)
- **All services:** Running on single VPS/server

---

## 🚀 Migration Steps

### Phase 1: Server Setup & Preparation

#### 1.1 Choose Datacenter Thurgau Service

Based on [datacenterthurgau.ch/angebote/](https://datacenterthurgau.ch/angebote/), choose one of:

**Option A: Rack Space (Recommended for production)**
- 15, 23, or 47 Höheneinheiten (HE)
- Warmgang-Einhausung
- Best for: Dedicated hardware control

**Option B: Rack Space Caged**
- 19-Zoll-Racks mit 47 HE
- Ab 6 Racks in separatem Gitterabteil
- Best for: Enhanced security requirements

**Option C: KMU Business Bundle**
- All-inclusive with Internet-Feed
- Best for: Simplified setup, managed services

**Recommendation:** Start with **KMU Business Bundle** for simplicity, then migrate to dedicated Rack Space if needed.

#### 1.2 Server Requirements

**Minimum Specifications:**
- **CPU:** 4 cores
- **RAM:** 8 GB (16 GB recommended)
- **Storage:** 100 GB SSD (200 GB recommended)
- **Network:** 1 Gbps connection
- **OS:** Ubuntu 22.04 LTS or Debian 12

**Recommended Specifications:**
- **CPU:** 8 cores
- **RAM:** 16 GB
- **Storage:** 500 GB SSD
- **Network:** 10 Gbps connection (if available)

#### 1.3 Initial Server Setup

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Update system
apt update && apt upgrade -y

# 3. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y

# 4. Install Nginx (for reverse proxy)
apt install nginx certbot python3-certbot-nginx -y

# 5. Create application user
useradd -m -s /bin/bash revampit
usermod -aG docker revampit

# 6. Create application directory
mkdir -p /opt/revampit
chown -R revampit:revampit /opt/revampit
```

---

### Phase 2: Application Deployment

#### 2.1 Clone Repository on Server

```bash
# Switch to application user
su - revampit

# Clone repository
cd /opt/revampit
git clone https://github.com/yourusername/revampit.git .

# Or upload via SCP from local machine:
# scp -r /home/g/dev/revampit/* revampit@server:/opt/revampit/
```

#### 2.2 Configure Environment Variables

```bash
# Copy environment template
cp environment.example .env

# Edit environment variables
nano .env
```

**Critical Environment Variables for Production:**

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://revampit.ch
PORT=3000

# Database (PostgreSQL)
DB_HOST=db
DB_PORT=5432
DB_NAME=revampit_cms
DB_USER=revampit_user
DB_PASSWORD=<strong-password>

# Auth
AUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://revampit.ch

# Medusa
MEDUSA_BACKEND_URL=http://medusa:9000
MEDUSA_DB_HOST=medusa_db
MEDUSA_DB_PORT=5432
MEDUSA_DB_NAME=medusa_db
MEDUSA_DB_USER=medusa_user
MEDUSA_DB_PASSWORD=<strong-password>

# Redis
REDIS_URL=redis://medusa_redis:6379

# Email (SMTP)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@revampit.ch
SMTP_PASSWORD=<smtp-password>
EMAIL_FROM=noreply@revampit.ch

# SSL/TLS (for production)
SSL_CERT_PATH=/etc/letsencrypt/live/revampit.ch/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/revampit.ch/privkey.pem
```

#### 2.3 Create Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database (Main)
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./postgres-init:/docker-entrypoint-initdb.d
    networks:
      - revampit_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # PostgreSQL for Medusa
  medusa_db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${MEDUSA_DB_USER}
      POSTGRES_PASSWORD: ${MEDUSA_DB_PASSWORD}
      POSTGRES_DB: ${MEDUSA_DB_NAME}
    volumes:
      - medusa_db_data:/var/lib/postgresql/data
    networks:
      - revampit_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${MEDUSA_DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis for Medusa
  medusa_redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - revampit_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Meilisearch
  meilisearch:
    image: getmeili/meilisearch:v1.11
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_ENV: production
      MEILI_NO_ANALYTICS: "true"
    volumes:
      - meilisearch_data:/meili_data
    networks:
      - revampit_network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1:7700/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Medusa Backend
  medusa:
    build:
      context: ./medusa-backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://${MEDUSA_DB_USER}:${MEDUSA_DB_PASSWORD}@medusa_db:5432/${MEDUSA_DB_NAME}
      REDIS_URL: redis://medusa_redis:6379
      JWT_SECRET: ${MEDUSA_JWT_SECRET}
      COOKIE_SECRET: ${MEDUSA_COOKIE_SECRET}
      MEDUSA_BACKEND_URL: ${MEDUSA_BACKEND_URL}
    depends_on:
      medusa_db:
        condition: service_healthy
      medusa_redis:
        condition: service_healthy
    networks:
      - revampit_network
    volumes:
      - medusa_uploads:/app/uploads

  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      MEDUSA_BACKEND_URL: ${MEDUSA_BACKEND_URL}
      # ... all other env vars
    depends_on:
      db:
        condition: service_healthy
      medusa_db:
        condition: service_healthy
      medusa_redis:
        condition: service_healthy
    networks:
      - revampit_network
    ports:
      - "3000:3000"

volumes:
  db_data:
  medusa_db_data:
  redis_data:
  meilisearch_data:
  medusa_uploads:

networks:
  revampit_network:
    driver: bridge
```

#### 2.4 Create Production Dockerfile

Create `Dockerfile.prod`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Update `next.config.js` for standalone output:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker
  // ... rest of config
}

module.exports = nextConfig
```

---

### Phase 3: Reverse Proxy & SSL Setup

#### 3.1 Configure Nginx

Create `/etc/nginx/sites-available/revampit`:

```nginx
upstream revampit_app {
    server localhost:3000;
}

upstream medusa_backend {
    server localhost:9000;
}

server {
    listen 80;
    server_name revampit.ch www.revampit.ch;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name revampit.ch www.revampit.ch;

    # SSL certificates (will be set up by Certbot)
    ssl_certificate /etc/letsencrypt/live/revampit.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/revampit.ch/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Main application
    location / {
        proxy_pass http://revampit_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Medusa backend API
    location /api/medusa/ {
        proxy_pass http://medusa_backend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://revampit_app;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

Enable site:

```bash
ln -s /etc/nginx/sites-available/revampit /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### 3.2 Setup SSL with Let's Encrypt

```bash
# Obtain SSL certificate
certbot --nginx -d revampit.ch -d www.revampit.ch

# Auto-renewal (already configured by certbot)
certbot renew --dry-run
```

---

### Phase 4: Database Migration

#### 4.1 Export Database from Current Host

```bash
# On current database server
pg_dump -h current-db-host -U postgres -d revampit_cms -F c -f revampit_cms_backup.dump
pg_dump -h current-db-host -U postgres -d medusa_db -F c -f medusa_db_backup.dump

# Transfer to new server
scp revampit_cms_backup.dump revampit@new-server:/opt/revampit/
scp medusa_db_backup.dump revampit@new-server:/opt/revampit/
```

#### 4.2 Import Database on New Server

```bash
# Start services first
cd /opt/revampit
docker compose -f docker-compose.prod.yml up -d db medusa_db

# Wait for databases to be ready
sleep 10

# Import main database
docker exec -i revampit_db_1 pg_restore -U revampit_user -d revampit_cms < revampit_cms_backup.dump

# Import Medusa database
docker exec -i revampit_medusa_db_1 pg_restore -U medusa_user -d medusa_db < medusa_db_backup.dump
```

---

### Phase 5: DNS & Go-Live

#### 5.1 Update DNS Records

Update your domain's DNS records:

```
Type    Name    Value              TTL
A       @       <server-ip>        3600
A       www     <server-ip>        3600
```

#### 5.2 Start All Services

```bash
cd /opt/revampit
docker compose -f docker-compose.prod.yml up -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

#### 5.3 Verify Deployment

```bash
# Check all services are running
docker compose -f docker-compose.prod.yml ps

# Test endpoints
curl https://revampit.ch/health
curl https://revampit.ch/api/auth/providers
```

---

## 🔧 Maintenance & Operations

### Daily Operations

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Restart services
docker compose -f docker-compose.prod.yml restart app

# Update application
cd /opt/revampit
git pull
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app
```

### Backup Strategy

```bash
# Create backup script: /opt/revampit/scripts/backup.sh
#!/bin/bash
BACKUP_DIR="/opt/backups/revampit"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup databases
docker exec revampit_db_1 pg_dump -U revampit_user revampit_cms | gzip > $BACKUP_DIR/db_$DATE.sql.gz
docker exec revampit_medusa_db_1 pg_dump -U medusa_user medusa_db | gzip > $BACKUP_DIR/medusa_db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/revampit/medusa-backend/uploads

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /opt/revampit/scripts/backup.sh
```

---

## 📊 Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_verified ON users("emailVerified");
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```

### 2. Caching Strategy

- **Redis:** Session storage, API response caching
- **Next.js:** Static page generation, ISR (Incremental Static Regeneration)
- **Nginx:** Static asset caching

### 3. Monitoring

Setup monitoring with:
- **Prometheus + Grafana** for metrics
- **Sentry** for error tracking
- **Uptime monitoring** (UptimeRobot, Pingdom)

---

## 🚨 Troubleshooting

### Common Issues

**1. Database Connection Errors**
```bash
# Check database is running
docker compose -f docker-compose.prod.yml ps db

# Check connection
docker exec -it revampit_db_1 psql -U revampit_user -d revampit_cms
```

**2. Application Won't Start**
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs app

# Check environment variables
docker compose -f docker-compose.prod.yml config
```

**3. SSL Certificate Issues**
```bash
# Renew certificate manually
certbot renew --force-renewal

# Check certificate expiry
certbot certificates
```

---

## 📞 Support & Contact

**Datacenter Thurgau:**
- **Phone:** +41 71 440 66 60
- **Website:** https://datacenterthurgau.ch
- **Location:** Bahnhofstrasse 37, CH-9320 Arbon

**Contact Persons:**
- **Dejan Fintic** - Leiter Datacenter
- **Kurt Metzger** - Salesmanager Datacenter

---

## ✅ Migration Checklist

- [ ] Choose Datacenter Thurgau service (Rack Space or Business Bundle)
- [ ] Provision server with required specifications
- [ ] Setup server (Docker, Nginx, SSL)
- [ ] Clone repository and configure environment
- [ ] Create production Docker Compose file
- [ ] Build and test Docker containers locally
- [ ] Export databases from current hosting
- [ ] Import databases to new server
- [ ] Configure Nginx reverse proxy
- [ ] Setup SSL certificates (Let's Encrypt)
- [ ] Update DNS records
- [ ] Test all functionality
- [ ] Setup backup strategy
- [ ] Configure monitoring
- [ ] Go live and monitor
- [ ] Decommission old hosting

---

**Migration Estimated Time:** 4-8 hours (depending on data size and complexity)

**Recommended Approach:** 
1. **Test migration** on staging server first
2. **Schedule maintenance window** for production migration
3. **Keep old hosting** running for 1-2 weeks as backup
4. **Monitor closely** for first 48 hours after migration
