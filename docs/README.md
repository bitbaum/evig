# Revamp-it Documentation Hub

> **Mission**: Modern, Sustainable IT for Everyone  
> **Goal**: Create a fully-featured website with Strapi CMS for content management

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/revamp-it/website) 
[![License](https://img.shields.io/badge/license-MIT-blue)](../LICENSE)

---
**Documentation Metadata**
- **Created**: 2025-07-16
- **Last Updated**: 2025-07-16
- **Status**: Current system documentation reflecting operational status
- **Vision**: Strapi CMS + PostgreSQL + Docker → Production server at datacenter-thurgau.ch
---

## 🎯 Project Vision & Current Status

### **Current State (Development)**
- ✅ **Frontend**: Next.js 14 with TypeScript - fully operational
- ✅ **Database**: PostgreSQL via Docker - fully operational  
- ✅ **Development Environment**: Docker Compose - fully operational
- ⚠️ **Strapi CMS**: Partially working (dependency conflicts being resolved)
- 🔄 **Content Management**: Ready for setup once Strapi is stable

### **Target State (Production)**
- 🎯 **Content Management**: Full Strapi CMS for blogs and static pages
- 🎯 **Database**: PostgreSQL production instance
- 🎯 **Hosting**: Migration to datacenter-thurgau.ch server in Frauenfeld
- 🎯 **Deployment**: Automated production deployment pipeline

## 📚 Documentation Navigation

### 🚀 Getting Started
Start here for initial setup and first deployment:

- **[Quick Start Guide](getting-started/quick-start.md)** - 5-minute setup for development
- **[Installation Guide](getting-started/installation.md)** - Complete installation process
- **[First Deployment](getting-started/first-deployment.md)** - Deploy to development environment

### 💻 Development
Development workflows and technical details:

- **[Project Structure](development/project-structure.md)** - Codebase organization
- **[Development Workflow](development/development-workflow.md)** - Daily development practices
- **[Testing Guide](development/testing.md)** - Testing strategies and tools
- **[Troubleshooting](development/troubleshooting.md)** - Common issues and solutions

### 🚀 Deployment
Deployment processes from development to production:

- **[Deployment Overview](deployment/deployment-guide.md)** - Deployment strategies
- **[Automated Deployment](deployment/automated-deployment.md)** - One-click deployment setup
- **[Manual Deployment](deployment/manual-deployment.md)** - Manual deployment steps
- **[Production Migration](deployment/production-migration.md)** - Moving to datacenter-thurgau.ch

### 📝 Content Management
Strapi CMS setup and content management:

- **[Strapi Setup](content-management/strapi-setup.md)** - Complete CMS installation
- **[Blog Management](content-management/blog-setup.md)** - Blog system configuration
- **[Content Editing](content-management/content-editing.md)** - Content creation workflows
- **[Static Pages](content-management/static-pages.md)** - Managing static content via Strapi

### 🏗️ Architecture
System architecture and technical decisions:

- **[System Overview](architecture/system-overview.md)** - High-level architecture
- **[Technology Stack](architecture/technology-stack.md)** - Technology choices and rationale
- **[Database Design](architecture/database-design.md)** - PostgreSQL schema and design
- **[Integration Points](architecture/integration-points.md)** - System integrations

### 📋 Project Management
Project planning and contribution guidelines:

- **[Project Roadmap](project-management/roadmap.md)** - Development phases and milestones
- **[Contributing Guide](project-management/contributing.md)** - How to contribute
- **[Code of Conduct](project-management/code-of-conduct.md)** - Community guidelines

## 🎯 Development Phases

### Phase 1: Local Development (Current)
- **Status**: Active development
- **Environment**: Docker Compose on laptop
- **Database**: PostgreSQL container
- **CMS**: Strapi setup in progress
- **Focus**: Content management system integration

### Phase 2: Production Deployment (Next)
- **Target**: datacenter-thurgau.ch server in Frauenfeld
- **Environment**: Production Docker deployment
- **Database**: Production PostgreSQL instance
- **CMS**: Fully operational Strapi CMS
- **Focus**: Public website launch

### Phase 3: E-commerce Integration (Future)
- **Addition**: MedusaJS e-commerce platform
- **Integration**: Unified content and commerce system
- **Focus**: Complete digital platform

## 🛠️ Quick Commands

```bash
# Start development environment
npm run dev                    # Next.js frontend
npm run dev:strapi            # Strapi CMS
npm run dev:all               # Both services

# Database operations
docker-compose up -d db       # Start PostgreSQL
docker-compose logs db        # View database logs

# Deployment
npm run deploy                # Automated deployment
./deploy.sh                   # Direct deployment script

# Docker operations
docker-compose up -d          # Start all services
docker-compose ps             # Check service status
docker-compose logs strapi    # View Strapi logs
```

## 🆘 Need Help?

### Quick Links
- **[Installation Issues](getting-started/installation.md#troubleshooting)** - Setup problems
- **[Strapi Problems](content-management/strapi-setup.md#troubleshooting)** - CMS issues
- **[Deployment Failures](deployment/deployment-guide.md#troubleshooting)** - Deployment problems
- **[Development Issues](development/troubleshooting.md)** - Development problems

### Support Process
1. Check the relevant documentation section
2. Review troubleshooting guides
3. Check system logs and error messages
4. Consult the project roadmap for planned features

## 🌟 Key Technologies

| Technology | Purpose | Status |
|------------|---------|--------|
| **Next.js 14** | Frontend framework | ✅ Operational |
| **TypeScript** | Type safety | ✅ Operational |
| **Tailwind CSS** | Styling | ✅ Operational |
| **Strapi CMS** | Content management | ⚠️ In setup |
| **PostgreSQL** | Database | ✅ Operational |
| **Docker** | Containerization | ✅ Operational |
| **Vercel** | Current deployment | ✅ Operational |

## 📞 Contact & Resources

- **Project Repository**: [GitHub Repository](https://github.com/revamp-it/website)
- **Production Target**: [datacenter-thurgau.ch](https://datacenterthurgau.ch/)
- **Documentation Issues**: Create an issue in the repository
- **Email**: support@revamp-it.ch

---

*This documentation reflects the current system status and our clear path toward a Strapi-powered content management system hosted on our dedicated server in Frauenfeld.*