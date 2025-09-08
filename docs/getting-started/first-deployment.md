# First Deployment Guide

> **Goal**: Deploy your first version to development environment

---
**Document Status**
- **Created**: 2025-07-16
- **Last Updated**: 2025-07-16
- **Reflects**: Current automated deployment system
---

## 🎯 Deployment Overview

This guide covers deploying your website using our automated deployment system:
- **Current**: Vercel deployment for development/staging
- **Future**: datacenter-thurgau.ch server for production

## 🚀 Automated Deployment (Recommended)

### One-Time Setup
```bash
# Set up automated deployment
./setup-deploy-keybind.sh

# Choose option 5 (All methods) for maximum flexibility
```

### Deploy with One Command
```bash
# Any of these commands will deploy:
w                    # Short alias
deploy              # Descriptive alias
npm run deploy      # NPM script
./deploy.sh         # Direct execution
```

### What the Automated Script Does
✅ **Commits any uncommitted changes** (with your commit message)  
✅ **Creates feature branch** if you're on main (best practice)  
✅ **Runs linting and build tests** (fails on errors)  
✅ **Pushes branch to GitHub**  
✅ **Creates and merges Pull Request** (if GitHub CLI available)  
✅ **Monitors Vercel deployment** with retries  
✅ **Shows deployment logs** and status  
✅ **Provides deployment summary** with links  

## 📋 Prerequisites

### Required Tools
```bash
# Check installation
node --version    # Required for builds
npm --version     # Required for scripts
git --version     # Required for version control
```

### Install Deployment Tools
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link
```

### Optional: GitHub CLI (Recommended)
```bash
# Ubuntu/Debian
sudo apt install gh

# macOS
brew install gh

# Login to GitHub
gh auth login

# Test access
gh repo view
```

## 🔧 First Deployment Steps

### 1. Pre-Deployment Checks
```bash
# Verify your code works locally
npm run dev

# Check code quality
npm run lint

# Test production build
npm run build
```

### 2. Set Up Deployment Environment
```bash
# Run setup script
./setup-deploy-keybind.sh

# Follow prompts to configure deployment shortcuts
```

### 3. Execute First Deployment
```bash
# Deploy with automated script
w

# Or use alternative methods
deploy
npm run deploy
./deploy.sh
```

### 4. Monitor Deployment
The script will show:
- **Build progress** with actual command output
- **Git operations** with repository links
- **Vercel deployment** status and logs
- **Success confirmation** with live URL

## 🎯 Deployment Targets

### Current: Development/Staging
- **Platform**: Vercel
- **URL**: `https://revampit.vercel.app`
- **Purpose**: Development testing and staging
- **Automatic**: Deploys on every merge to main

### Future: Production
- **Platform**: datacenter-thurgau.ch server in Frauenfeld
- **Setup**: Will be configured when ready for public launch
- **Purpose**: Production hosting for public website
- **Features**: 
  - Dedicated server resources
  - Swiss data hosting
  - Custom domain configuration
  - Production-grade security

## 🔄 Deployment Workflow

### Standard Workflow
```bash
# 1. Make your changes
# Edit files, add features, fix bugs

# 2. Test locally
npm run dev

# 3. Deploy
w    # One command deployment

# 4. Verify
# Check deployment URL provided in output
```

### Advanced Workflow
```bash
# 1. Create feature branch
git checkout -b feature/my-new-feature

# 2. Make changes and test
npm run dev
npm run lint
npm run build

# 3. Deploy feature branch
w    # Script handles branch creation and PR

# 4. Merge to main (if not automated)
# Manual merge if GitHub CLI not available
```

## 🔍 Deployment Monitoring

### Real-Time Monitoring
The deployment script provides:
- **Live status updates** during deployment
- **Deployment logs** for troubleshooting
- **Automatic retries** on failures (up to 3 attempts)
- **Success confirmation** with clickable links

### Manual Monitoring
```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs --limit 50

# Check specific deployment
vercel logs [deployment-url]
```

## 🌐 Accessing Your Deployment

### Development URLs
- **Vercel Preview**: Unique URL for each deployment
- **Production**: `https://revampit.vercel.app`
- **Admin Access**: Links provided in deployment output

### Future Production URLs
- **Main Site**: Custom domain on datacenter-thurgau.ch
- **Admin Panel**: Secure admin access
- **API Endpoints**: Production API configuration

## 🚨 Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Check linting errors
npm run lint

# Fix build issues
npm run build

# Common fixes
rm -rf node_modules package-lock.json
npm install
```

#### Deployment Script Issues
```bash
# Check script permissions
ls -la *.sh

# Make script executable
chmod +x deploy.sh setup-deploy-keybind.sh

# Run directly
./deploy.sh
```

#### Vercel Connection Issues
```bash
# Re-login to Vercel
vercel login

# Re-link project
vercel link

# Check project status
vercel ls
```

#### GitHub CLI Issues
```bash
# Login to GitHub
gh auth login

# Check repository access
gh repo view

# Test PR creation
gh pr list
```

### Getting Help

If deployment fails:
1. **Check error messages** in colored output
2. **Review deployment logs** with `vercel logs`
3. **Verify build locally** with `npm run build`
4. **Check service status** for GitHub/Vercel
5. **Consult troubleshooting guide** for specific errors

## 🎯 Next Steps

After successful first deployment:

1. **[Development Workflow](../development/development-workflow.md)** - Learn daily development process
2. **[Strapi Setup](../content-management/strapi-setup.md)** - Set up content management
3. **[Production Migration](../deployment/production-migration.md)** - Plan production deployment
4. **[Project Structure](../development/project-structure.md)** - Understand codebase

## 📞 Production Planning

### datacenter-thurgau.ch Migration
When ready for production:
- **Server Setup**: Configure dedicated server
- **Database Migration**: Move PostgreSQL to production
- **Domain Configuration**: Set up custom domain
- **SSL Certificates**: Configure HTTPS
- **Backup Systems**: Set up automated backups
- **Monitoring**: Production monitoring setup

### Timeline
- **Phase 1**: Continue development on Vercel
- **Phase 2**: Complete Strapi CMS integration
- **Phase 3**: Migrate to datacenter-thurgau.ch for public launch

---

**Deployment Complete!** Your website is now live and accessible. The automated deployment system ensures smooth updates as you continue development. Production migration to datacenter-thurgau.ch will happen when the system is ready for public launch.