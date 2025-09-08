# RevampIT - Sustainable Technology for Everyone

<div align="center">

![RevampIT Logo](https://revamp-it.ch/assets/logo.png)

**Giving Technology a Second Life Through Sustainable IT Practices**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-13+-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

[Website](https://revamp-it.ch) • [Contribute](#contributing) • [Documentation](#documentation) • [Report Bug](https://github.com/g-but/revampit/issues)

</div>

---

## 🌟 About RevampIT

RevampIT is a Swiss non-profit organization dedicated to **sustainable technology** and **digital inclusion**. We refurbish computers and electronic devices, provide technical education through workshops, and promote open-source solutions to reduce electronic waste.

### Our Mission
- ♻️ **Reduce E-Waste**: Refurbish and redistribute electronic devices
- 🏫 **Education**: Provide workshops on Linux, open-source software, and hardware repair  
- 🤝 **Community**: Build a network of volunteers, technical experts, and partners
- 🌍 **Sustainability**: Promote responsible technology consumption and circular economy

## 🚀 Technology Stack

### Frontend
- **[Next.js 13+](https://nextjs.org/)** - React framework with server-side rendering
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Hook Form](https://react-hook-form.com/)** - Forms with validation

### Backend & CMS
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Express.js](https://expressjs.com/)** - Web application framework
- **[PostgreSQL](https://www.postgresql.org/)** - Relational database
- **[JWT](https://jwt.io/)** - Authentication and authorization
- **Custom CMS** - Content management for non-technical users

### Infrastructure
- **[Docker](https://www.docker.com/)** - Containerization
- **[Vercel](https://vercel.com/)** - Frontend hosting and deployment
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD workflows

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/g-but/revampit.git
cd revampit

# Install frontend dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Install CMS API dependencies
cd cms-api
npm install
cp .env.example .env
# Edit .env with your database configuration

# Start PostgreSQL (using Docker)
docker-compose up -d postgres

# Start the CMS API
npm run dev

# In another terminal, start the frontend
cd ..
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **CMS API**: http://localhost:3001
- **Admin Interface**: http://localhost:3000/admin/login

## 📁 Project Structure

```
revampit/
├── src/                      # Frontend source code
│   ├── app/                  # Next.js app directory
│   ├── components/           # Reusable UI components
│   └── lib/                  # Utilities and configurations
├── cms-api/                  # Custom CMS backend
│   ├── src/                  # API source code
│   ├── migrations/           # Database migrations
│   └── uploads/              # File storage
├── public/                   # Static assets
├── docs/                     # Documentation
├── tests/                    # Test files
└── docker-compose.yml        # Development services
```

## 🎯 Features

### Public Website
- 📱 **Responsive Design** - Mobile-first approach
- 🔍 **SEO Optimized** - Server-side rendering and meta tags
- 🌐 **Multilingual** - German and English support
- ⚡ **Performance** - Optimized images and lazy loading
- ♿ **Accessibility** - WCAG 2.1 compliant

### Content Management
- 🔐 **Secure Authentication** - JWT-based admin access
- ✏️ **Rich Text Editor** - WYSIWYG content editing
- 📄 **Page Management** - Create and edit static pages
- 👥 **User Management** - Role-based access control
- 🖼️ **Media Management** - Image upload and optimization

### Services
- 🛠️ **Hardware Services** - Computer repair and refurbishment
- 🐧 **Linux Support** - Open-source software consulting
- 🏢 **Enterprise Solutions** - Custom IT solutions for businesses
- 📚 **Workshops** - Educational programs and training
- 🌐 **Web Development** - Modern web solutions

## 🤝 Contributing

We welcome contributions from developers, designers, translators, and anyone passionate about sustainable technology!

### How to Contribute
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Areas for Contribution
- 💻 **Frontend Development** - React/Next.js components and pages
- 🔧 **Backend Development** - API endpoints and database design
- 🎨 **UI/UX Design** - Interface design and user experience
- 📝 **Documentation** - Technical writing and guides
- 🌐 **Translations** - German ↔ English localization
- 🧪 **Testing** - Unit tests, integration tests, and E2E tests
- 📊 **Analytics** - Performance monitoring and optimization

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Ensure accessibility standards
- Maintain responsive design
- Update documentation

## 📚 Documentation

- [Installation Guide](docs/installation.md)
- [System Integration](docs/system-integration.md)
- [Migration Guide](docs/migration.md)
- [Deployment Guide](docs/deployment.md)
- [CMS Solution](docs/cms-solution.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🗺️ Roadmap

### Current Focus
- ✅ Custom CMS Implementation
- ✅ Admin Interface
- ✅ Content Management
- ⏳ User Authentication
- ⏳ Media Management

### Upcoming Features
- 📝 **Blog System** - News and updates
- 🛒 **E-commerce Integration** - Online shop for refurbished devices
- 📅 **Event Management** - Workshop scheduling and registration
- 📊 **Analytics Dashboard** - Website and service metrics
- 🔔 **Notification System** - Email newsletters and alerts
- 🌍 **Multi-language Support** - Expanded localization

## 📞 Support & Community

### Get Help
- 📧 **Email**: info@revamp-it.ch
- 🐛 **Issues**: [GitHub Issues](https://github.com/g-but/revampit/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/g-but/revampit/discussions)

### Visit Us
**RevampIT Headquarters**  
Badenerstrasse 816  
8048 Zürich, Switzerland

**Office Hours**  
Monday - Friday: 13:00 - 17:00  
Workshops: By appointment

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all our **volunteers** and **contributors**
- **Open Source Community** for the amazing tools and libraries
- **Swiss Non-Profit Sector** for supporting our mission
- **Local Community** in Zürich for their continuous support

---

<div align="center">

**Made with ❤️ by the RevampIT community**

[🌐 Website](https://revamp-it.ch) • [📧 Contact](mailto:info@revamp-it.ch) • [🐦 Twitter](https://twitter.com/revampit) • [💼 LinkedIn](https://linkedin.com/company/revampit)

</div>