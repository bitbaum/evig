# Production-Ready Checklist: RevampIT Migration to Frauenfeld

**Created:** 2026-01-05
**Last Modified:** 2026-06-19
**Last Modified Summary:** Status note — cutover already happened to the Hetzner box; single DATABASE_URL pool

> **ℹ️ Status (2026-06-19):** The cutover to production has already happened. Live
> prod runs on the **self-hosted Hetzner box** (`revampit.orangecat.ch`, ssh
> `ubuntu@167.233.22.31`) — app + self-hosted Postgres 17 on one server, deployed via
> GitHub Actions → rsync → systemd, with nightly backups to Cloudflare R2. The
> Frauenfeld / Datacenter Thurgau plan below was the original target and did not
> ship as written; treat it as historical context, not the current runbook. For the
> current flow see `scripts/selfhost-deploy-revampit.sh`, `scripts/ops/README.md`,
> and `docs/DISASTER_RECOVERY.md`.

---

## 🎯 Mission Accomplished

RevampIT is now **production-ready** with **one-command migration** to Frauenfeld datacenter. Everything (frontend, backend, database, monitoring) runs on a single server at revampit.ch.

---

## ✅ What We've Accomplished

### 1. **Authentication Fixes** ✅
- ❌ **Removed email verification** requirement (users can login immediately)
- 🔧 **Fixed logger error** causing authentication failures
- 🔐 **Streamlined registration** process (no email confirmation needed)
- 👥 **All existing users** will be auto-migrated to verified status

### 2. **One-Command Migration** ✅
- 🚀 **`./scripts/migrate-to-production.sh [server-ip] [domain]`**
- ⚡ **Fully automated** server setup, deployment, SSL, and monitoring
- 🔄 **Built-in rollback** capability for safety
- 📊 **Health checks** and monitoring included

### 3. **Production Infrastructure** ✅
- 🐳 **Docker production setup** for all services
- 🌐 **Nginx reverse proxy** with SSL termination
- 💾 **Automated daily backups**
- 📈 **Health monitoring** and logging
- 🔒 **Security hardening** and firewall setup

### 4. **Everything in One Place** ✅
- **Frontend:** Next.js (Docker container)
- **Backend:** Next.js API Routes (same container)
- **Database:** PostgreSQL (Docker container)
- **Redis:** Caching/sessions (Docker container)
- **Meilisearch:** Search engine (Docker container)
- **All services:** Running on single Frauenfeld server

---

## 🚀 How to Migrate: The Easy Way

### Step 1: Prepare Your Environment
```bash
# On your local machine, in the RevampIT project directory
cp environment.example .env
# Edit .env with your production values (database passwords, email settings, etc.)
nano .env
```

> **DB env vars:** prod uses a **single `DATABASE_URL`** for both the app (Drizzle)
> and auth (NextAuth + @auth/pg-adapter) — `getDbConfig()` prefers it and shares one
> pool. There is **no** separate `AUTH_DB_*` / auth database to configure (that split
> pattern is retired). On the live box it points at the local Postgres:
> `DATABASE_URL=postgresql://…@localhost:5432/revampit`.

### Step 2: Get Server from Datacenter Thurgau
1. Contact **Datacenter Thurgau** (+41 71 440 66 60)
2. Choose **KMU Business Bundle** or **Rack Space** (see migration guide)
3. Get server IP address and SSH access
4. Setup SSH key authentication for passwordless login

### Step 3: Run One-Command Migration
```bash
# This single command does everything:
./scripts/migrate-to-production.sh [server-ip] revampit.ch

# Example:
./scripts/migrate-to-production.sh 192.168.1.100 revampit.ch
```

### Step 4: Update DNS
Point `revampit.ch` and `www.revampit.ch` to your server IP at your DNS provider.

### Step 5: You're Live! 🎉
Your site is now live at `https://revampit.ch`

---

## 📋 What the Migration Script Does

The `./scripts/migrate-to-production.sh` script automatically:

1. **Pre-flight Checks** ✅
   - Validates SSH connection
   - Checks local environment setup
   - Verifies project structure

2. **Server Setup** ✅
   - Installs Docker, Nginx, SSL certificates
   - Creates application user and directories
   - Configures firewall and security

3. **Application Deployment** ✅
   - Builds production Docker images
   - Copies all code and configurations
   - Sets up production environment variables

4. **Service Configuration** ✅
   - Starts all Docker services (app, database, Redis, Meilisearch)
   - Configures health checks
   - Waits for services to be ready

5. **Reverse Proxy & SSL** ✅
   - Configures Nginx with SSL termination
   - Sets up Let's Encrypt certificates
   - Enables HTTP to HTTPS redirects

6. **Data Migration** ✅
   - Prompts for database migration if needed
   - Runs user migration script (marks all users as verified)

7. **Monitoring & Backups** ✅
   - Sets up automated daily backups
   - Configures health monitoring
   - Creates monitoring scripts

8. **Final Verification** ✅
   - Tests all endpoints
   - Provides status summary
   - Shows next steps

---

## 🔧 Useful Commands After Migration

### Production Management
```bash
# SSH into your server
ssh revampit@[server-ip]

# Go to application directory
cd /opt/revampit

# View service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart

# Update application
git pull
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app
```

### Local Testing (before migration)
```bash
# Test production build locally
npm run prod:build
npm run prod:up
npm run prod:health

# Stop local production test
npm run prod:down
```

### Backup & Recovery
```bash
# SSH into server, then:
cd /opt/revampit

# Manual backup
./scripts/backup.sh

# Emergency rollback (if something goes wrong)
./scripts/rollback-production.sh
```

---

## 🛡️ Safety Features

### Automatic Backups
- **Daily automated backups** at 2 AM
- **7-day retention** of backups
- **Database + uploads** backed up
- **Stored locally** on server

### Health Monitoring
- **Health check endpoint**: `https://revampit.ch/health`
- **Service health checks** every 30 seconds
- **Automatic restart** on failures
- **Log rotation** and monitoring

### Rollback Capability
- **One-command rollback**: `./scripts/rollback-production.sh`
- **Automatic backup restoration**
- **Service restart** after rollback
- **Safe to run** multiple times

---

## 📊 Performance Optimizations

### Database
- **Connection pooling** (20 connections max)
- **Query optimization** and indexing
- **Health checks** and automatic recovery

### Application
- **Next.js production build** with standalone output
- **Static asset optimization** and caching
- **Gzip compression** enabled
- **Edge caching** headers configured

### Infrastructure
- **Docker containerization** for consistency
- **Resource limits** and monitoring
- **Network optimization** and security
- **Automatic scaling** ready (when needed)

---

## 🔍 Monitoring Your Production Site

### Health Checks
```bash
# From your server:
curl https://revampit.ch/health
# Should return: {"status":"healthy",...}

# Check all services:
docker compose -f docker-compose.prod.yml ps
```

### Logs
```bash
# Application logs:
docker compose -f docker-compose.prod.yml logs -f app

# Database logs:
docker compose -f docker-compose.prod.yml logs -f db

# All logs:
docker compose -f docker-compose.prod.yml logs -f
```

### Metrics
- **Nginx access logs**: `/var/log/nginx/revampit.access.log`
- **Application logs**: Docker container logs
- **Database logs**: PostgreSQL logs in containers
- **System monitoring**: `htop`, `df -h`, `docker stats`

---

## 🚨 Troubleshooting

### If Migration Fails
1. **Check SSH connection**: `ssh revampit@[server-ip]`
2. **Verify server requirements**: Ubuntu 22.04+, 8GB RAM minimum
3. **Check environment variables**: All required vars set in `.env`
4. **Run rollback**: `./scripts/rollback-production.sh`

### If Site is Slow
1. **Check resource usage**: `docker stats`
2. **Monitor database**: `docker compose -f docker-compose.prod.yml logs db`
3. **Check Nginx config**: `nginx -t`
4. **Restart services**: `docker compose -f docker-compose.prod.yml restart`

### If SSL Fails
1. **Check certificate**: `certbot certificates`
2. **Renew certificate**: `certbot renew`
3. **Check Nginx config**: `nginx -t && systemctl reload nginx`

---

## 📞 Support & Emergency Contacts

**Datacenter Thurgau:**
- **Phone:** +41 71 440 66 60
- **Website:** https://datacenterthurgau.ch
- **Location:** Bahnhofstrasse 37, CH-9320 Arbon
- **Contacts:** Dejan Fintic (Leiter), Kurt Metzger (Sales)

**Emergency Rollback:**
```bash
# If everything goes wrong:
ssh revampit@[server-ip]
cd /opt/revampit
./scripts/rollback-production.sh
```

---

## 🎉 Success Metrics

After migration, you should see:
- ✅ **Site loads fast** (< 2 seconds)
- ✅ **SSL certificate** working (green lock)
- ✅ **All features working** (login, shop, etc.)
- ✅ **Database connections** stable
- ✅ **Backups running** daily
- ✅ **Monitoring active** (health checks pass)

---

## 🔄 Future Scaling

When you need to scale:
1. **Add more servers** using the same scripts
2. **Load balancer** (Nginx or external)
3. **Database replication** for high availability
4. **CDN** for global performance
5. **Monitoring** (Prometheus + Grafana)

But for now, **one server handles everything** beautifully! 🚀

---

**Ready to migrate? Just run:**
```bash
./scripts/migrate-to-production.sh [server-ip] revampit.ch
```

**(Historical.)** This was the one-command path planned for the move off Vercel. The cutover is done — production now runs on the self-hosted Hetzner box and deploys via `git push origin main` (GitHub Actions → `revampit.orangecat.ch`). See `docs/guides/deployment.md`. 🎯