# Deployment Guide

> **Current**: Vercel deployment for development  
> **Future**: datacenter-thurgau.ch server for production

---
**Document Status**
- **Created**: 2025-07-16
- **Last Updated**: 2025-07-16
- **Reflects**: Current deployment system and production migration plans
---

## 🎯 Deployment Overview

### Current Deployment Strategy
- **Development**: Vercel for rapid development and testing
- **Staging**: Vercel preview deployments for feature testing
- **Production Target**: datacenter-thurgau.ch server in Frauenfeld

### Deployment Phases
1. **Phase 1 (Current)**: Development on Vercel
2. **Phase 2 (Next)**: Strapi CMS integration
3. **Phase 3 (Future)**: Migration to datacenter-thurgau.ch

## 🚀 Automated Deployment (Recommended)

### Quick Setup
```bash
# One-time setup for deployment shortcuts
./setup-deploy-keybind.sh

# Choose option 5 (All methods) for maximum flexibility
```

### Deploy Commands
```bash
# All of these deploy your website:
w                    # Short alias (recommended)
deploy              # Descriptive alias
npm run deploy      # NPM script
./deploy.sh         # Direct execution
```

### Automated Workflow
The deployment script handles:
- ✅ **Code Quality**: Automatic linting and build tests
- ✅ **Git Management**: Branch creation and PR handling
- ✅ **Deployment**: Push to GitHub and Vercel deployment
- ✅ **Monitoring**: Real-time deployment status and logs
- ✅ **Verification**: Success confirmation with live URLs

## 📋 Prerequisites

### Required Tools
```bash
# Install globally
npm install -g vercel

# Login to services
vercel login
gh auth login    # Optional but recommended

# Link project
vercel link
```

### Environment Configuration
```bash
# Verify environment variables
cat .env.local

# Required variables:
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
# STRAPI_API_URL=http://localhost:1337
# DATABASE_URL=postgresql://...
```

## 🔧 Deployment Methods

### 1. Automated Deployment (Recommended)
```bash
# One command deploys everything
w

# What it does:
# - Commits changes with timestamp
# - Creates feature branch if on main
# - Runs quality checks (lint, build)
# - Pushes to GitHub
# - Creates/merges PR automatically
# - Monitors Vercel deployment
# - Shows success with live URL
```

### 2. Manual Deployment
```bash
# Traditional Git workflow
git checkout -b feature/my-changes
git add .
git commit -m "Descriptive commit message"
git push origin feature/my-changes

# Create PR manually on GitHub
# Merge to main after review
```

### 3. Direct Vercel Deployment
```bash
# Deploy directly to Vercel
vercel --prod

# Deploy to preview
vercel
```

## 🌐 Deployment Targets

### Current: Vercel
- **Development URL**: `https://revampit-[hash].vercel.app`
- **Production URL**: `https://revampit.vercel.app`
- **Features**:
  - Automatic deployments on push
  - Preview deployments for PRs
  - Global CDN
  - Automatic HTTPS

### Future: datacenter-thurgau.ch
- **Location**: Frauenfeld, Switzerland
- **Purpose**: Production hosting for public website
- **Benefits**:
  - Dedicated server resources
  - Swiss data hosting compliance
  - Custom domain configuration
  - Full control over infrastructure

## 🔄 Development Workflow

### Daily Development
```bash
# 1. Start development
npm run dev

# 2. Make changes
# Edit code, add features, fix bugs

# 3. Test locally
npm run lint
npm run build

# 4. Deploy
w    # One command deployment
```

### Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Develop and test
npm run dev
npm run lint

# 3. Deploy feature
w    # Script handles PR creation

# 4. Merge to main
# Automatic if GitHub CLI configured
```

## 🔍 Deployment Monitoring

### Real-Time Monitoring
The deployment script provides:
- **Colored output** for easy reading
- **Live deployment status** with retries
- **Deployment logs** for troubleshooting
- **Success confirmation** with clickable links

### Manual Monitoring
```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs --limit 50

# Check specific deployment
vercel logs [deployment-url]

# Monitor build process
npm run build
```

## 🎯 Production Migration Plan

### Phase 1: Current Development
- **Status**: Active development on Vercel
- **Features**: Frontend fully operational
- **Database**: PostgreSQL in Docker
- **CMS**: Strapi setup in progress

### Phase 2: Strapi Integration
- **Goal**: Complete content management system
- **Features**: 
  - Blog management via Strapi
  - Static page editing
  - PostgreSQL production database
- **Timeline**: In progress

### Phase 3: Production Migration
- **Target**: datacenter-thurgau.ch server
- **Setup Requirements**:
  - Server provisioning at datacenter-thurgau.ch
  - Docker production environment
  - PostgreSQL production instance
  - SSL certificate configuration
  - Domain configuration
  - Backup systems
  - Monitoring setup

### Migration Checklist
```bash
# Pre-migration verification
□ Strapi CMS fully operational
□ All content migrated to Strapi
□ Database backups created
□ Server environment configured
□ SSL certificates obtained
□ Domain DNS configured
□ Monitoring systems ready
□ Backup procedures tested
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check linting errors
npm run lint

# Fix TypeScript errors
npm run type-check

# Clean build
rm -rf .next
npm run build
```

#### Deployment Script Issues
```bash
# Check script permissions
ls -la *.sh

# Make executable
chmod +x deploy.sh

# Run with verbose output
./deploy.sh --verbose
```

#### Vercel Connection Issues
```bash
# Re-authenticate
vercel logout
vercel login

# Re-link project
vercel link

# Check project settings
vercel ls
```

### Getting Help

1. **Check deployment logs**: `vercel logs --limit 50`
2. **Review build output**: `npm run build`
3. **Verify environment**: Check `.env.local`
4. **Test locally**: `npm run dev`
5. **Check service status**: GitHub/Vercel status pages

## 📞 Production Server Information

### datacenter-thurgau.ch Details
- **Website**: https://datacenterthurgau.ch/
- **Location**: Frauenfeld, Switzerland
- **Purpose**: Production hosting for public website launch
- **Migration**: When development phase is complete

### Production Setup (Future)
- **Server**: Dedicated server at datacenter-thurgau.ch
- **Database**: Production PostgreSQL instance
- **CMS**: Strapi production deployment
- **Domain**: Custom domain configuration
- **Security**: Production-grade security measures

---

**Deployment is fully automated and ready!** Use the `w` command for one-click deployment. The system is currently optimized for development on Vercel, with a clear path to production migration at datacenter-thurgau.ch when ready for public launch.