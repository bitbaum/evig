# Strapi CMS Setup Guide

> **Goal**: Set up Strapi CMS for blog and static page management

---
**Document Status**
- **Created**: 2025-07-16
- **Last Updated**: 2025-07-16
- **Current Status**: Strapi setup in progress - dependency conflicts being resolved
- **System**: PostgreSQL + Docker + Strapi → datacenter-thurgau.ch
---

## 🎯 Overview

Strapi CMS will provide content management for:
- **Blog posts**: Create and manage blog content
- **Static pages**: Edit page content without code changes
- **Media management**: Upload and manage images/files
- **Internationalization**: Multi-language content support

## 📊 Current Status

### ✅ What's Ready
- **PostgreSQL Database**: Running in Docker container
- **Database Schema**: Configured for Strapi
- **Content Types**: Defined for blog posts and static pages
- **Docker Environment**: Configured for Strapi

### ⚠️ Current Issues
- **Dependency Conflicts**: Strapi installation has npm dependency issues
- **Startup Problems**: Strapi may take 2-3 minutes to start
- **API Stability**: Some API endpoints may be unstable

### 🔄 In Progress
- **Dependency Resolution**: Fixing npm conflicts
- **Stability Improvements**: Ensuring consistent startup
- **API Reliability**: Stabilizing content API endpoints

## 🚀 Setup Instructions

### 1. Prerequisites Check
```bash
# Verify database is running
docker-compose ps db

# Should show database as healthy
# If not running:
docker-compose up -d db
```

### 2. Database Configuration
```bash
# Database connection details
Host: localhost (external) / db (internal)
Port: 5434 (external) / 5432 (internal)
Database: strapi
Username: strapi
Password: strapi
```

### 3. Strapi Installation
```bash
# Navigate to Strapi directory
cd strapi

# Install dependencies (may show warnings)
npm install

# Return to project root
cd ..
```

### 4. Environment Configuration
```bash
# Create/verify Strapi environment file
cat strapi/.env

# Should contain:
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://strapi:strapi@db:5432/strapi
JWT_SECRET=your-jwt-secret
ADMIN_JWT_SECRET=your-admin-jwt-secret
```

### 5. Start Strapi (When Ready)
```bash
# Option 1: Start Strapi directly
cd strapi
npm run develop

# Option 2: Start via npm script
npm run dev:strapi

# Option 3: Start with Next.js
npm run dev:all
```

## 🔧 Content Types Configuration

### Blog Post Content Type
```json
{
  "title": "Text (required)",
  "slug": "UID (auto-generated)",
  "content": "Rich Text",
  "excerpt": "Text",
  "featured_image": "Media",
  "author": "Text",
  "categories": "Relation (many-to-many)",
  "tags": "Relation (many-to-many)",
  "status": "Enumeration (draft, published)",
  "published_at": "DateTime",
  "view_count": "Number",
  "seo_title": "Text",
  "seo_description": "Text"
}
```

### Static Page Content Type
```json
{
  "title": "Text (required)",
  "slug": "UID (required)",
  "content": "Rich Text",
  "excerpt": "Text",
  "featured_image": "Media",
  "page_type": "Enumeration",
  "show_in_navigation": "Boolean",
  "seo_title": "Text",
  "seo_description": "Text"
}
```

### Category Content Type
```json
{
  "name": "Text (required)",
  "slug": "UID (auto-generated)",
  "description": "Text",
  "color": "Text (hex color)"
}
```

### Tag Content Type
```json
{
  "name": "Text (required)",
  "slug": "UID (auto-generated)"
}
```

## 🌐 API Configuration

### API Endpoints (When Ready)
```
# Blog Posts
GET /api/blog-posts
GET /api/blog-posts/:id
POST /api/blog-posts
PUT /api/blog-posts/:id
DELETE /api/blog-posts/:id

# Static Pages
GET /api/static-pages
GET /api/static-pages/:id
POST /api/static-pages
PUT /api/static-pages/:id

# Categories
GET /api/categories
GET /api/categories/:id

# Tags
GET /api/tags
GET /api/tags/:id
```

### API Permissions Setup
```bash
# When Strapi is running:
# 1. Go to http://localhost:1337/admin
# 2. Navigate to Settings → Roles & Permissions → Public
# 3. Enable permissions:
#    - Blog-post: find, findOne
#    - Static-page: find, findOne
#    - Category: find, findOne
#    - Tag: find, findOne
# 4. Save changes
```

## 🔄 Integration with Next.js

### Strapi Client Configuration
```typescript
// src/lib/strapi.ts
const STRAPI_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function fetchFromStrapi(endpoint: string) {
  const response = await fetch(`${STRAPI_URL}/api/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  
  return response.json();
}
```

### Environment Variables
```bash
# Add to .env.local
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=your-api-token-here
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

## 🚨 Current Troubleshooting

### Common Issues and Solutions

#### Strapi Won't Start
```bash
# Check database connection
docker-compose ps db
docker-compose logs db

# Clear npm cache
cd strapi
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues
```bash
# Restart database
docker-compose restart db

# Check database logs
docker-compose logs db

# Verify database is accessible
docker-compose exec db psql -U strapi -d strapi -c "\l"
```

#### API Not Responding
```bash
# Check Strapi logs
docker-compose logs strapi

# Or if running manually
cd strapi
npm run develop
```

#### Dependency Conflicts
```bash
# Current known issue - being resolved
# Workaround: Use --legacy-peer-deps flag
cd strapi
npm install --legacy-peer-deps
```

## 🎯 Future Production Setup

### datacenter-thurgau.ch Migration
When ready for production:

1. **Server Configuration**: Set up Strapi on production server
2. **Database Migration**: Move PostgreSQL to production instance
3. **Environment Variables**: Configure production API endpoints
4. **SSL Configuration**: Set up HTTPS for Strapi admin and API
5. **Backup Systems**: Implement automated content backups
6. **Performance Optimization**: Configure production-grade settings

### Production Environment Variables
```bash
# Production .env (when ready)
DATABASE_URL=postgresql://user:pass@prod-db:5432/strapi
STRAPI_API_URL=https://cms.revamp-it.ch
NEXT_PUBLIC_STRAPI_URL=https://cms.revamp-it.ch
NODE_ENV=production
```

## 📞 Support

### Current Status
- **Development**: Website works fully without Strapi
- **Content Management**: Static content in React components
- **Blog**: Static blog posts in code
- **CMS Integration**: In progress - not blocking development

### When Strapi is Ready
- **Dynamic Content**: Blog posts managed in Strapi
- **Page Editing**: Static pages editable via CMS
- **Media Management**: Image uploads through Strapi
- **Multi-language**: Content translation support

### Resources
- **[Blog Setup](blog-setup.md)** - Blog-specific configuration
- **[Content Editing](content-editing.md)** - Using the CMS
- **[Troubleshooting](../development/troubleshooting.md)** - Common issues

---

**Strapi CMS is being set up to provide powerful content management capabilities.** The website is fully functional without it, and CMS integration will enhance the content editing experience once ready.