# RevampIT Blog & CMS Setup Guide

This guide will help you set up the complete blog and content management system using Strapi CMS with Docker.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- A Supabase account (optional, can use local PostgreSQL)

## Quick Start

### 1. Environment Setup

Copy the environment files and configure them:

```bash
# Copy environment templates
cp .env.local.example .env.local
cp strapi/.env.example strapi/.env

# Generate secrets for Strapi
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" # For JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" # For ADMIN_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" # For TRANSFER_TOKEN_SALT
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" # For API_TOKEN_SALT
```

### 2. Update Environment Variables

Edit `.env.local` and `strapi/.env` with your configuration:

**`.env.local`:**
```env
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=your-api-token-here
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

**`strapi/.env`:**
```env
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://strapi:strapi@postgres:5432/strapi

JWT_SECRET=your-generated-jwt-secret
ADMIN_JWT_SECRET=your-generated-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-generated-transfer-token-salt
API_TOKEN_SALT=your-generated-api-token-salt

APP_KEYS="key1,key2"
```

### 3. Start the Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 4. Initialize Strapi

1. **Install Strapi dependencies:**
   ```bash
   cd strapi
   npm install
   cd ..
   ```

2. **Create admin user:**
   Visit `http://localhost:1337/admin` and create your first admin user.

3. **Create API Token:**
   - Go to Settings > API Tokens
   - Create a new token with "Full access"
   - Copy the token and add it to your `.env.local` file

### 5. Configure Content Types

The content types are already configured in the code:
- **Blog Post** - with editorial workflow
- **Static Page** - for managing static content
- **Category** - for organizing blog posts
- **Tag** - for tagging blog posts

### 6. Set Up User Roles

1. Go to Settings > Users & Permissions plugin > Roles
2. **Create Writer Role:**
   - Permissions for Blog-post: create, update (own), find, findOne
   - Permissions for Category: find, findOne
   - Permissions for Tag: find, findOne
   - Permissions for Upload: upload, find, findOne

3. **Update Editor Role:**
   - All Writer permissions
   - Additional Blog-post permissions: update (all), delete
   - Static-page: all permissions
   - Category and Tag: all permissions

### 7. Update Blog Page

Replace the current blog page with the Strapi-enabled version:

```bash
# Backup current blog page
mv src/app/blog/page.tsx src/app/blog/page-original.tsx

# Use the Strapi-enabled blog page
mv src/app/blog/page-strapi.tsx src/app/blog/page.tsx
```

### 8. Add Required Dependencies

Add the required dependencies to your Next.js project:

```bash
npm install
# The Strapi client is already included in the lib folder
```

## Creating Content

### 1. Create Categories

1. Go to Content Manager > Category
2. Create categories like:
   - Sustainability (green color: #059669)
   - Linux & Open Source (blue color: #2563eb)
   - Hardware Revival (orange color: #ea580c)

### 2. Create Tags

1. Go to Content Manager > Tag
2. Create relevant tags like:
   - e-waste
   - linux
   - open-source
   - refurbishment
   - sustainability

### 3. Create Blog Posts

1. Go to Content Manager > Blog Post
2. Create your first blog post
3. Set status to "published" to make it visible

### 4. Manage Static Pages

1. Go to Content Manager > Static Page
2. Create entries for pages like:
   - page_key: "about" - for the About page
   - page_key: "contact" - for the Contact page

## Editorial Workflow

The system includes a complete editorial workflow:

1. **Draft** - Writer creates content
2. **Submitted** - Writer submits for review
3. **Under Review** - Editor is reviewing
4. **Approved** - Editor approves for publication
5. **Published** - Content is live on the website
6. **Rejected** - Editor rejects with feedback

### Workflow Actions

Writers can submit posts for review using the custom API endpoint:
```
PUT /api/blog-posts/:id/submit
```

Editors can update post status:
```
PUT /api/blog-posts/:id/status
```

## Development

### Local Development

To run the Next.js app in development mode:

```bash
npm run dev
```

To run Strapi in development mode:

```bash
cd strapi
npm run develop
```

### Database Migrations

Strapi will automatically create the database schema when you first start it.

## Production Deployment

### 1. Update Environment Variables

Set production environment variables:
- Use production database URLs
- Set NODE_ENV=production
- Use strong, unique secrets

### 2. Build and Deploy

```bash
# Build Strapi
cd strapi
npm run build

# Build Next.js
cd ..
npm run build
```

### 3. Security Considerations

- Change default passwords
- Use strong JWT secrets
- Configure CORS properly
- Set up rate limiting
- Use HTTPS in production

## Troubleshooting

### Common Issues

1. **Strapi won't start:**
   - Check database connection
   - Verify environment variables
   - Check Docker logs: `docker-compose logs strapi`

2. **Blog posts not showing:**
   - Verify API token is set correctly
   - Check if posts are published
   - Verify Strapi is accessible from Next.js

3. **Database connection issues:**
   - Ensure PostgreSQL is running
   - Check database credentials
   - Verify network connectivity

### Useful Commands

```bash
# View logs
docker-compose logs -f strapi
docker-compose logs -f nextjs

# Restart services
docker-compose restart strapi
docker-compose restart nextjs

# Clean restart
docker-compose down
docker-compose up -d

# Access Strapi container
docker-compose exec strapi sh
```

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify environment configuration
3. Ensure all services are running
4. Check the Strapi admin panel for content

## Next Steps

After setup, you can:
1. Customize the blog design
2. Add more content types
3. Implement email notifications
4. Add search functionality
5. Set up automated backups
6. Configure CDN for media files

The system is now ready for content creation and editorial workflow!