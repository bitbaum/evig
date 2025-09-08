# Quick Start Guide

> **Goal**: Get the development environment running in 5 minutes

---
**Document Status**
- **Created**: 2025-07-16
- **Last Updated**: 2025-07-16
- **Reflects**: Current system status and operational setup
---

## 🚀 5-Minute Setup

### Prerequisites Check
```bash
# Verify required tools
node --version    # Should be 18+
npm --version     # Should be 9+
docker --version  # Should be 20+
git --version     # Any recent version
```

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/revamp-it/website.git revampit
cd revampit

# Install Next.js dependencies
npm install
```

### 2. Start Database
```bash
# Start PostgreSQL container
docker-compose up -d db

# Verify database is running
docker-compose ps db
```

### 3. Start Development Server
```bash
# Start Next.js development server
npm run dev
```

✅ **Your website is now running at**: `http://localhost:3000`

## 🎯 Current System Status

### ✅ What's Working
- **Frontend**: Next.js application with all pages
- **Database**: PostgreSQL in Docker container
- **Static Content**: All pages display correctly
- **Development**: Hot reloading and fast refresh

### ⚠️ What's In Progress
- **Strapi CMS**: Setup in progress (see [Strapi Setup](../content-management/strapi-setup.md))
- **Content Management**: Will be available once Strapi is configured
- **Blog System**: Static version working, dynamic version pending Strapi

### 🔄 Optional: Strapi CMS Setup
```bash
# If you want to set up Strapi CMS (optional for now)
npm run dev:strapi    # Start Strapi development server
```

**Note**: Strapi setup is currently being refined. The website works fully without it.

## 📁 What You Have Running

### Frontend (Port 3000)
- **Next.js 14**: Modern React framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **All Pages**: About, Services, Projects, Contact, etc.

### Database (Port 5434)
- **PostgreSQL**: Production-ready database
- **Docker Container**: Consistent environment
- **Ready for Strapi**: When CMS setup is complete

### Development Tools
- **Hot Reload**: Instant updates during development
- **TypeScript**: Real-time type checking
- **ESLint**: Code quality checks
- **Prettier**: Code formatting

## 🛠️ Common Development Tasks

### Working with the Database
```bash
# Check database status
docker-compose ps db

# View database logs
docker-compose logs db

# Connect to database (optional)
docker-compose exec db psql -U strapi -d strapi
```

### Development Workflow
```bash
# Start development (most common)
npm run dev

# Check code quality
npm run lint

# Build for production testing
npm run build

# Start production build locally
npm start
```

## 🎯 Next Steps

After you have the basic setup running:

1. **[Complete Installation](installation.md)** - Full development environment
2. **[First Deployment](first-deployment.md)** - Deploy to development
3. **[Strapi Setup](../content-management/strapi-setup.md)** - Enable content management
4. **[Development Workflow](../development/development-workflow.md)** - Learn the development process

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Database Connection Issues
```bash
# Restart database container
docker-compose restart db

# Check database logs
docker-compose logs db
```

### Node/NPM Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Need Help?

- **[Installation Guide](installation.md)** - Detailed setup instructions
- **[Troubleshooting](../development/troubleshooting.md)** - Common issues
- **[Project Structure](../development/project-structure.md)** - Understanding the codebase

---

**You're now ready to develop!** The website is running locally and ready for customization. The next step is setting up Strapi CMS for content management, but that's optional for basic development work.