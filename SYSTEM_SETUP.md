# RevampIT System Setup Guide

This guide explains how to set up the complete RevampIT system with all services properly configured.

## 🚀 Quick Start

```bash
# 1. Clone and setup environment
cp environment.example .env
# Edit .env with your configuration

# 2. Start all services
npm run start:all

# 3. Setup database
npm run setup

# 4. Open browser
open http://localhost:3000
```

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+
- PostgreSQL (via Docker)
- Git

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   CMS API       │
│   (Port 3000)   │    │   (Port 3001)   │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                 │
        ┌─────────────────┐
        │  PostgreSQL     │
        │  (Port 5433)    │
        └─────────────────┘
                 │
        ┌─────────────────┐
        │   Medusa        │
        │  (Port 9000)    │
        └─────────────────┘
```

## 🔧 Detailed Setup

### 1. Environment Configuration

```bash
# Copy environment template
cp environment.example .env

# Edit .env with your values (see environment.example for details)
nano .env
```

**Critical Settings:**
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_SECRET`: Different from JWT_SECRET
- Database passwords: Use strong passwords
- Email settings: Configure SMTP for production

### 2. Database Setup

```bash
# Start database
npm run db:up

# Wait for database to be ready (check logs)
docker compose logs db

# Run migrations
cd cms-api && npm run migrate
```

### 3. Development Workflow

```bash
# Start everything
npm run start:all

# Or start individual services
npm run dev          # Next.js frontend
npm run dev:cms      # CMS API backend
npm run dev:medusa   # Medusa services

# Check health
curl http://localhost:3001/health
```

### 4. Testing

```bash
# Run all tests
npm test
npm run test:e2e

# CMS API tests
cd cms-api && npm test

# With coverage
npm run test:coverage
```

## 🔐 Authentication Flow

1. **Registration**: User registers → Email verification sent
2. **Email Verification**: User clicks link → Account activated
3. **Login**: Credentials checked → JWT token issued
4. **Session**: Token stored in httpOnly cookie
5. **API Access**: Protected routes validate JWT

## 📊 Monitoring & Health Checks

- **API Health**: `http://localhost:3001/health`
- **API Docs**: `http://localhost:3001/api-docs`
- **Logs**: Check Docker logs for each service
- **Metrics**: Health endpoint includes performance data

## 🧪 Testing the System

### User Registration & Login

```bash
# 1. Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","first_name":"Test","last_name":"User"}'

# 2. Check email (in development, check console/logs)
# 3. Verify email (get token from email)
curl http://localhost:3001/api/auth/verify-email/$TOKEN

# 4. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### API Testing

```bash
# Get API documentation
open http://localhost:3001/api-docs

# Test protected endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/auth/profile
```

## 🚦 Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 3000, 3001, 5433, etc. are free
2. **Database connection**: Ensure PostgreSQL is running and accessible
3. **Environment variables**: Check all required env vars are set
4. **Migrations**: Run `npm run setup` to initialize database

### Logs & Debugging

```bash
# Check all service logs
docker compose logs

# Check specific service
docker compose logs db
docker compose logs cms_api

# CMS API logs
cd cms-api && npm run dev

# Database shell
docker compose exec db psql -U postgres -d revampit_cms
```

### Reset Everything

```bash
# Stop all services
npm run stop:all

# Reset databases (WARNING: destroys all data)
npm run reset
```

## 🔒 Security Checklist

- [ ] JWT secrets are unique and strong (32+ chars)
- [ ] Database passwords are complex
- [ ] No sensitive data in logs
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Input validation enabled
- [ ] SQL injection protection (parameterized queries)

## 📈 Production Deployment

1. **Environment**: Set `NODE_ENV=production`
2. **HTTPS**: Required for secure cookies
3. **Database**: Use managed PostgreSQL
4. **Email**: Configure SMTP service
5. **Monitoring**: Set up logging and alerts
6. **Backups**: Configure database backups

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Send verification email
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/reset-password/confirm` - Reset password
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Content Management
- `GET /api/content/pages` - List pages
- `POST /api/content/pages` - Create page
- `GET /api/content/posts` - List blog posts
- `POST /api/content/posts` - Create post

### Health & Monitoring
- `GET /health` - Detailed health check
- `GET /health/simple` - Simple health check
- `GET /api-docs` - API documentation

## 📝 Notes

- All services use the same PostgreSQL database with separate schemas
- JWT tokens expire in 24 hours
- Email verification tokens expire in 1 hour
- Password reset tokens expire in 1 hour
- Sessions last 7 days
- Rate limiting: 100 requests per 15 minutes per IP

## 🤝 Support

For issues:
1. Check logs: `docker compose logs`
2. Check health: `curl http://localhost:3001/health`
3. Check database: Connect via psql
4. Check environment variables
5. Check API documentation

---

**Version**: 1.0.0
**Last Updated**: December 2025



