# Complete Installation Guide

> **Goal**: Set up the full development environment including Strapi CMS

---
**Document Status**
- **Created**: 2025-07-16
- **Last Updated**: 2025-07-16
- **Reflects**: Current system requirements and setup process
---

## 🎯 Installation Overview

This guide sets up the complete development environment:
- **Next.js Frontend** (working)
- **PostgreSQL Database** (working)
- **Strapi CMS** (in setup phase)
- **Docker Environment** (working)

## 📋 Prerequisites

### Required Software
```bash
# Check versions
node --version    # Required: 18.0.0+
npm --version     # Required: 9.0.0+
docker --version  # Required: 20.0.0+
git --version     # Required: Any recent version
```

### Install Missing Prerequisites

#### Node.js (if not installed)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node

# Verify installation
node --version
npm --version
```

#### Docker (if not installed)
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER

# macOS
brew install docker docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 🚀 Step-by-Step Installation

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/revamp-it/website.git revampit
cd revampit

# Verify you're in the right directory
ls -la
# Should see: package.json, docker-compose.yml, etc.
```

### 2. Environment Configuration
```bash
# Create environment file for Next.js
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

**Required `.env.local` settings:**
```env
# Database connection
DATABASE_URL=postgresql://strapi:strapi@localhost:5434/strapi

# Strapi configuration (when ready)
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=your-token-here
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# Next.js configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Frontend Installation
```bash
# Install Next.js dependencies
npm install

# Verify installation
npm run build
```

### 4. Database Setup
```bash
# Start PostgreSQL container
docker-compose up -d db

# Wait for database to initialize (30-60 seconds)
docker-compose logs db

# Verify database is running
docker-compose ps db
```

**Database Configuration:**
- **Host**: localhost (external) / db (internal)
- **Port**: 5434 (external) / 5432 (internal)
- **Database**: strapi
- **Username**: strapi
- **Password**: strapi

### 5. Strapi CMS Installation (Optional - In Progress)

**Current Status**: Strapi setup is being refined due to dependency conflicts.

```bash
# Navigate to Strapi directory
cd strapi

# Install Strapi dependencies
npm install

# Start Strapi (if working)
npm run develop

# Return to project root
cd ..
```

**If Strapi starts successfully:**
- Admin panel: `http://localhost:1337/admin`
- API endpoint: `http://localhost:1337/api`

## 🔧 Development Environment

### Start Development Services
```bash
# Option 1: Start services separately
npm run dev          # Next.js frontend
npm run dev:strapi   # Strapi CMS (if ready)

# Option 2: Start all services
npm run dev:all      # Both frontend and Strapi

# Option 3: Docker services
docker-compose up -d # All containerized services
```

### Service Status Check
```bash
# Check all services
docker-compose ps

# Check specific service logs
docker-compose logs frontend
docker-compose logs db
docker-compose logs strapi
```

## 🎯 Verification Steps

### 1. Frontend Verification
- **URL**: `http://localhost:3000`
- **Expected**: Website loads with all pages
- **Test**: Navigate to About, Services, Contact pages

### 2. Database Verification
```bash
# Connect to database
docker-compose exec db psql -U strapi -d strapi

# In PostgreSQL shell:
\l    # List databases
\q    # Quit
```

### 3. Strapi Verification (When Ready)
- **URL**: `http://localhost:1337/admin`
- **Expected**: Strapi admin login page
- **Test**: Create admin account if first time

## 📁 Project Structure After Installation

```
revampit/
├── src/                     # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and API clients
│   └── types/               # TypeScript types
├── strapi/                  # Strapi CMS
│   ├── config/              # Strapi configuration
│   ├── src/                 # Strapi customizations
│   └── database/            # Database migrations
├── docs/                    # Documentation
├── public/                  # Static assets
├── docker-compose.yml       # Docker services
└── package.json             # Dependencies
```

## 🔄 Development Workflow

### Daily Development
```bash
# Start development
npm run dev

# In another terminal, start Strapi (when ready)
npm run dev:strapi

# Make changes to code
# Changes auto-reload in browser
```

### Quality Checks
```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Build for production
npm run build
```

## 🎯 Next Steps

After successful installation:

1. **[First Deployment](first-deployment.md)** - Deploy to development
2. **[Strapi Setup](../content-management/strapi-setup.md)** - Complete CMS setup
3. **[Development Workflow](../development/development-workflow.md)** - Learn development process
4. **[Project Structure](../development/project-structure.md)** - Understand codebase

## 🚨 Troubleshooting

### Common Installation Issues

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# If too old, update Node.js
# See prerequisites section above
```

#### Docker Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Restart terminal or run:
newgrp docker
```

#### Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process if needed
sudo kill -9 $(lsof -t -i:3000)
```

#### Database Connection Issues
```bash
# Restart database
docker-compose restart db

# Check database logs
docker-compose logs db

# Reset database (if needed)
docker-compose down -v
docker-compose up -d db
```

#### Strapi Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules in strapi directory
cd strapi
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Getting Help

If you encounter issues:

1. **Check logs**: `docker-compose logs [service]`
2. **Verify services**: `docker-compose ps`
3. **Check documentation**: [Troubleshooting Guide](../development/troubleshooting.md)
4. **Review system status**: Current system is stable for frontend development

## 📞 Support

- **Frontend Issues**: Next.js is fully operational
- **Database Issues**: PostgreSQL is stable and working
- **Strapi Issues**: CMS setup is being refined
- **General Issues**: Check troubleshooting guide

---

**Installation Complete!** You now have a fully functional development environment. The website works completely without Strapi - the CMS is an enhancement for content management that will be available once setup is complete.