# RevampIT Reboot Content API

A production-ready, custom Content Management System API built with Node.js, Express, and PostgreSQL. This replaces the Strapi-based solution with a lightweight, maintainable alternative focused on static page content management for non-technical users.

## 🚀 Features

- **JWT Authentication** with role-based access control
- **PostgreSQL Database** with connection pooling and migrations
- **RESTful API** for content management
- **File Upload Support** with Multer
- **Rate Limiting** for API protection
- **Input Validation** with express-validator
- **Comprehensive Logging** with request/response tracking
- **Security Headers** with Helmet
- **CORS Support** for cross-origin requests
- **TypeScript Support** for type safety
- **Docker Ready** for containerized deployment

## 📁 Project Structure

```
reboot-content/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # TypeScript interfaces
│   ├── routes/          # API route definitions
│   ├── utils/           # Utility functions
│   ├── migrations/      # Database migration files
│   └── index.ts         # Application entry point
├── config/              # Configuration files
├── uploads/             # File upload directory
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Docker and Docker Compose (optional, for containerized deployment)

### Local Setup

1. **Clone and navigate to the reboot-content directory:**
   ```bash
   cd reboot-content
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp config/env.template .env
   # Edit .env with your configuration
   ```

4. **Set up PostgreSQL database:**
   ```sql
   CREATE DATABASE revampit_cms;
   CREATE USER cms_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE revampit_cms TO cms_user;
   ```

5. **Run database migrations:**
   ```bash
   npm run migrate
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

### Docker Setup

1. **Using Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Environment variables:**
   Update the `docker-compose.yml` file with your configuration.

## 🔧 Configuration

### Environment Variables

Copy `config/env.template` to `.env` and configure:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=revampit_cms
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=http://localhost:3000

# Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### Database Schema

The API uses PostgreSQL with the following main tables:

- `users` - User accounts and authentication
- `static_pages` - CMS-managed pages (About, Contact, etc.)
- `blog_posts` - Blog content with categories and tags
- `categories` - Blog post categories
- `migrations` - Database migration tracking

## 📚 API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@revampit.ch",
  "password": "your_password"
}
```

#### Register (Admin only)
```http
POST /api/auth/register
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "editor@revampit.ch",
  "password": "secure_password",
  "first_name": "John",
  "last_name": "Doe",
  "role": "editor"
}
```

### Content Management

#### Static Pages

**Get all pages:**
```http
GET /api/content/static-pages?page=1&limit=10&search=about
```

**Get single page:**
```http
GET /api/content/static-pages/about
```

**Create page:**
```http
POST /api/content/static-pages
Authorization: Bearer <token>
Content-Type: application/json

{
  "slug": "about",
  "title": "About Us",
  "content": "<p>Page content here...</p>",
  "is_published": true
}
```

#### Blog Posts

**Get all posts:**
```http
GET /api/content/blog-posts?page=1&limit=10&category_id=uuid&search=keyword
```

**Get single post:**
```http
GET /api/content/blog-posts/my-first-post
```

**Create post:**
```http
POST /api/content/blog-posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "slug": "my-first-post",
  "title": "My First Blog Post",
  "content": "<p>Post content here...</p>",
  "category_id": "uuid-here",
  "tags": ["tag1", "tag2"],
  "is_published": true
}
```

#### Categories

**Get all categories:**
```http
GET /api/content/categories
```

**Create category:**
```http
POST /api/content/categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "slug": "tutorials",
  "name": "Tutorials",
  "description": "Step-by-step guides",
  "color": "#10B981"
}
```

### Admin Endpoints

#### User Management (Admin only)

```http
GET /api/admin/users          # List users
POST /api/admin/users         # Create user
PUT /api/admin/users/:id      # Update user
DELETE /api/admin/users/:id   # Delete user
GET /api/admin/stats          # System statistics
```

## 🔐 User Roles

- **Admin**: Full access to all features including user management
- **Editor**: Can create, edit, and publish content
- **Viewer**: Read-only access to content

## 🗃️ Database Migrations

### Running Migrations

```bash
npm run migrate
```

### Creating New Migrations

1. Create a new SQL file in `src/migrations/`
2. Follow the naming pattern: `XXX_description.sql`
3. The migration will run automatically on next startup

## 🧪 Testing

### Running Tests

```bash
npm test
```

### API Testing

Use tools like Postman or curl to test endpoints:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@revampit.ch","password":"Admin123!"}'
```

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```bash
docker build -t revampit-cms .
docker run -p 3001:3001 --env-file .env revampit-cms
```

### Environment Setup

For production, ensure:

1. Strong `JWT_SECRET` (min 32 characters)
2. Secure database credentials
3. HTTPS enabled
4. Proper CORS configuration
5. File upload limits set appropriately

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Development server with hot reload
npm run build    # Production build
npm start        # Production server
npm run migrate  # Run database migrations
```

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for code formatting
- Comprehensive error handling

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📊 Monitoring

### Health Checks

```http
GET /health
```

Returns system status including:
- Uptime
- Memory usage
- Database connectivity
- API version

### Logging

All requests and responses are logged with:
- HTTP method and URL
- Response status and duration
- User ID (if authenticated)
- Error details

## 🔒 Security

- **JWT Authentication** with expiration
- **Password Hashing** with bcrypt
- **Rate Limiting** to prevent abuse
- **Input Validation** on all endpoints
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** with Helmet
- **CORS Configuration** for cross-origin requests

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## 📋 Roadmap

- [ ] File upload management
- [ ] Email notifications
- [ ] Content versioning
- [ ] API rate limiting per user
- [ ] Content scheduling
- [ ] Multi-language support
- [ ] Content analytics
- [ ] Webhook integrations
- [ ] API documentation (Swagger)
- [ ] Redis caching layer

---

**Built with ❤️ for the RevampIT project**

*This custom CMS provides a lightweight, maintainable alternative to complex headless CMS solutions while maintaining full control and extensibility.*

