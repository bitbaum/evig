# RevampIT Architecture Guide

## Overview

RevampIT uses a modern, scalable architecture designed for sustainability, performance, and ease of content management by non-technical users.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Next.js       │    │   Custom CMS    │    │   PostgreSQL    │
│   Frontend      │◄──►│   API           │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 3001)   │    │   (Port 5433)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend: Next.js 14
- **Framework**: Next.js with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Features**: 
  - Server-side rendering (SSR)
  - Static generation (SSG)
  - Image optimization
  - Internationalization (German/English)
  - SEO optimization

### Backend: Custom CMS API
- **Framework**: Express.js
- **Language**: TypeScript  
- **Authentication**: JWT tokens
- **Features**:
  - Role-based access control (Admin, Editor, Viewer)
  - RESTful API design
  - File upload handling
  - CORS configuration
  - Request validation

### Database: PostgreSQL
- **Version**: 15+
- **Features**:
  - ACID compliance
  - Full-text search
  - JSON support
  - Connection pooling
  - Migrations system

## Key Design Decisions

### Why Custom CMS Instead of Strapi?

**Previous Approach: Strapi**
- Initially tried Strapi for rapid CMS development
- Issues encountered:
  - Complex setup and configuration
  - Dependency version conflicts
  - Heavy resource usage
  - Over-engineered for our needs
  - Difficult customization

**Current Approach: Custom CMS API**
- Built specifically for RevampIT's needs
- Lightweight and fast
- Complete control over features
- Easy to customize and extend
- Better TypeScript integration
- Simpler deployment

### Architecture Benefits

1. **Separation of Concerns**
   - Frontend focused on user experience
   - Backend focused on data management
   - Clear API boundaries

2. **Scalability**
   - Each service can be scaled independently
   - Horizontal scaling possible
   - Database optimization options

3. **Developer Experience**
   - TypeScript throughout the stack
   - Consistent code patterns
   - Easy local development

4. **Content Management**
   - Non-technical users can manage content
   - WYSIWYG editor for rich content
   - Media management system
   - Content scheduling capabilities

## API Design

### Authentication Flow
```
1. User logs in → CMS API validates credentials
2. API returns JWT token → Frontend stores token
3. Subsequent requests → Include JWT in Authorization header
4. API validates token → Returns requested data
```

### Content Management Endpoints
```
GET    /api/pages           - List all pages
GET    /api/pages/:id       - Get specific page
POST   /api/pages           - Create new page
PUT    /api/pages/:id       - Update page
DELETE /api/pages/:id       - Delete page

GET    /api/media           - List media files
POST   /api/media           - Upload media
DELETE /api/media/:id       - Delete media
```

### User Management Endpoints
```
POST   /api/auth/login      - User authentication
POST   /api/auth/logout     - User logout
GET    /api/auth/profile    - Get user profile
PUT    /api/auth/profile    - Update profile

GET    /api/users           - List users (admin only)
POST   /api/users           - Create user (admin only)
PUT    /api/users/:id       - Update user (admin only)
```

## Database Schema

### Core Tables
- `users` - User accounts and roles
- `pages` - Static pages (About, Contact, etc.)
- `posts` - Blog posts and news
- `media` - File uploads and images
- `categories` - Content organization
- `tags` - Content tagging system

### Key Features
- **Audit Trails**: `created_at`, `updated_at` on all tables
- **Soft Deletes**: Preserve data with `deleted_at`
- **User Tracking**: Track who created/modified content
- **Content Versioning**: Future feature for content history

## Security Considerations

### Authentication & Authorization
- JWT tokens with expiration
- Role-based access control
- Password hashing with bcrypt
- CORS configuration

### Data Validation
- Input sanitization
- SQL injection prevention
- File upload restrictions
- Rate limiting

### Environment Security
- Environment variables for secrets
- No sensitive data in code
- HTTPS in production
- Secure cookie settings

## Deployment Architecture

### Development
```
Developer Machine
├── Next.js Dev Server (3000)
├── CMS API Dev Server (3001)
└── PostgreSQL Docker (5433)
```

### Production
```
Vercel (Frontend)
├── Next.js Static Export
├── Serverless Functions
└── CDN Distribution

Backend Server
├── CMS API (Node.js)
├── PostgreSQL Database
├── File Storage
└── SSL/HTTPS
```

## Future Improvements

### Short Term
- [ ] Content caching layer
- [ ] Image optimization pipeline
- [ ] Email notification system
- [ ] Content preview system

### Long Term  
- [ ] Multi-language content management
- [ ] Advanced user permissions
- [ ] Content workflow system
- [ ] API rate limiting
- [ ] Content delivery network (CDN)

## Development Workflow

### Getting Started
1. Clone repository
2. Install dependencies (`npm install`)
3. Set up environment variables
4. Start PostgreSQL database
5. Run migrations
6. Start CMS API (`npm run dev` in cms-api/)
7. Start frontend (`npm run dev`)

### Making Changes
1. Create feature branch
2. Make changes with tests
3. Update documentation
4. Submit pull request
5. Code review and merge

## Monitoring & Maintenance

### Health Checks
- Database connection monitoring
- API endpoint availability
- Frontend build status
- Error logging and tracking

### Backup Strategy
- Database daily backups
- Media file synchronization
- Code repository versioning
- Configuration backup

---

This architecture provides a solid foundation for RevampIT's growth while maintaining simplicity and developer productivity.