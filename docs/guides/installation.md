# Installation Guide

This guide will help you set up the RevampIT development environment on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 13+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads)
- **Docker** (optional) - [Download](https://www.docker.com/get-started)

## Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/revampit.git
cd revampit
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install CMS API dependencies
cd cms-api
npm install
cd ..
```

### 3. Environment Configuration

#### Frontend Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Database (for frontend if needed)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/revampit_db
```

#### CMS API Environment
```bash
cd cms-api
cp .env.example .env
```

Edit `cms-api/.env` with your configuration:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=revampit_cms
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Admin User Configuration
ADMIN_EMAIL=admin@revampit.ch
ADMIN_PASSWORD=Admin123!
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
```

### 4. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker-compose up -d postgres

# The database will be automatically created with the correct schema
```

#### Option B: Local PostgreSQL
```bash
# Create database
createdb revampit_cms

# Run migrations
cd cms-api
npm run migrate
cd ..
```

### 5. Start Development Servers

Open two terminal windows:

**Terminal 1 - CMS API:**
```bash
cd cms-api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **CMS API**: http://localhost:3001
- **Admin Interface**: http://localhost:3000/admin/login

#### Default Admin Credentials
- **Email**: admin@revampit.ch
- **Password**: Admin123!

## Docker Development (Alternative)

If you prefer using Docker for the entire development environment:

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d
```

This will start:
- PostgreSQL database
- CMS API server
- Frontend development server

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000  # or :3001

# Kill the process
kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
brew services list | grep postgresql  # macOS
systemctl status postgresql           # Linux
net start postgresql                  # Windows

# Test connection
psql -h localhost -p 5432 -U postgres -d revampit_cms
```

#### Permission Issues
```bash
# Fix npm permissions (Unix/Linux)
sudo chown -R $(whoami) ~/.npm

# Clear npm cache
npm cache clean --force
```

#### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Also clear cms-api modules
cd cms-api
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Environment-Specific Issues

#### macOS
```bash
# Install Command Line Tools if needed
xcode-select --install

# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL via Homebrew
brew install postgresql@15
brew services start postgresql@15
```

#### Windows
```bash
# Use Windows Subsystem for Linux (WSL) for better compatibility
wsl --install

# Or use PowerShell with elevated privileges for npm global packages
```

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Verification

After installation, verify everything works:

```bash
# Check frontend
curl http://localhost:3000

# Check API health
curl http://localhost:3001/health

# Check database connection
cd cms-api && npm run db:status
```

## Next Steps

1. Read the [Development Guide](development.md)
2. Check the [API Documentation](api.md)
3. Review the [Contributing Guidelines](../CONTRIBUTING.md)
4. Explore the [CMS User Guide](cms-guide.md)

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting section](#troubleshooting) above
2. Search [GitHub Issues](https://github.com/your-org/revampit/issues)
3. Create a new issue with details about your environment and the problem
4. Join our community discussions

---

**Happy coding! 🚀**