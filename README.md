# Revamp-it Website Modernization

> Modern, Sustainable IT for Everyone  
> Hardware, Menschen und Know-how

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/revamp-it-modernization) 
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---
**Documentation Metadata**
- created_date: 2023-10-01
- last_modified_date: 2025-07-15
- last_modified_summary: Updated with system integration analysis, added status indicators, and current system health information.
---

## Table of Contents

- [Overview](#overview)
- [Vision and Objectives](#vision-and-objectives)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Development Workflow](#development-workflow)
- [Documentation Structure](#documentation-structure)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Contact & Acknowledgments](#contact--acknowledgments)

## Overview

Revamp-it is a self-sustaining, mission-driven non-profit dedicated to sustainable IT. Our website serves multiple purposes:
- **Promote hardware recycling:** Accept and refurbish used hardware to prolong their lifecycle.
- **Foster community and education:** Provide workshops, Linux support, and open-source resources.
- **Facilitate direct engagement:** Inform users, support donors, and expand our digital presence.

This project is a complete redevelopment of our website with a modern tech stack and intuitive UX/UI—designed for performance, accessibility, and scalability.

## Vision and Objectives

- **User-Centric Design:** Create clear, accessible navigation that caters to diverse visitors (private, corporate, volunteers).
- **Modern Development Practices:** Use state-of-the-art open-source technologies to deliver a fast, secure, and SEO-friendly site.
- **Scalable Architecture:** Structure code for maintainability and ease of adding new features (blog, shop, events).
- **Sustainable Impact:** Reflect our mission of reducing e-waste and championing sustainable IT practices.

## Tech Stack

### Frontend
- **Next.js**: Provides server-side rendering (SSR) and static site generation (SSG) for SEO and performance.
- **React.js**: Leverages a component-based architecture for a dynamic user interface.
- **Tailwind CSS**: Utility-first styling for rapid, responsive UI design.
- **TypeScript**: Ensures robust, type-safe code.

### Backend & APIs
- **Content Management System (CMS):** Strapi (headless CMS) for managing website content, pages, workshops, blog posts, and internationalization (German, English, French, Italian).
- **E-commerce Platform (Future):** MedusaJS (headless commerce engine) will be integrated in a later phase for webshop inventory, product management, orders, and cart functionality.
- **Custom APIs (if needed):** Node.js / Express.js for any specific backend logic not covered by Strapi.
- **GraphQL (optional):** Strapi supports GraphQL, offering flexible data fetching.

### Deployment & Infrastructure
- **Vercel**: For seamless deployment and global Content Delivery Network (CDN) support. **Vercel is the only supported deployment platform.**
- **Docker**: Containerization for consistency across environments (used for local development only).
- **CI/CD Pipelines**: Automated testing and deployment (GitHub Actions).

### Other Tools
- **Algolia / Meilisearch**: Advanced search capabilities across content.
- **ESLint & Prettier**: Enforce code style and quality standards.
- **Jest & React Testing Library**: For frontend testing; Mocha/Chai for backend testing.

## Architecture Overview

The website is designed with a modular, API-driven architecture:
- **Presentation Layer:** Next.js serves as the frontend framework, consuming data from Strapi APIs.
- **Content Layer:** Strapi (headless CMS) powers all informational content dynamically (e.g., blog posts, project pages, workshop details, general site copy) and manages multilingual content.
- **E-commerce Layer (Future):** MedusaJS will be implemented in a later phase to manage all aspects of the webshop.
- **API Layer:** Primarily consists of the API exposed by Strapi. Custom Node.js/Express.js endpoints can be added for unique integrations or functionalities. The MedusaJS API will be added in the future phase.
- **Deployment:** The entire application is containerized using Docker for consistent, scalable, and secure deployments. **Production deployment is handled exclusively by Vercel. Docker Compose is for local development only.**

## System Status

### Current Integration Status
- **Frontend (Next.js):** ✅ Operational
- **Database (PostgreSQL):** ✅ Operational  
- **Docker Environment:** ✅ Operational
- **Strapi CMS:** ⚠️ Partially Working (dependency conflicts)
- **Content Management:** 🔄 Needs Setup

> **Latest Analysis:** See [SYSTEM_INTEGRATION_REPORT.md](SYSTEM_INTEGRATION_REPORT.md) for detailed findings and recommendations.

## Installation & Setup

### Prerequisites
- **Node.js (>=18) & npm/yarn**
- **Docker (for containerized development only)**
- **Git**
- **PostgreSQL client** (for database testing)

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/revamp-it-modernization.git
   cd revamp-it-modernization
   ```

2. **Install Dependencies**

   Using npm:
   ```bash
   npm install
   ```
   Or using yarn:
   ```bash
   yarn install
   ```

3. **Environment Setup**

   - Copy the environment template:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` with your API keys and environment variables for Next.js and Strapi (e.g., `NEXT_PUBLIC_STRAPI_API_URL`). MedusaJS variables will be added in a future phase.

4. **Start Database**

   First, start the PostgreSQL database:
   ```bash
   docker-compose up -d db
   ```

5. **Run Development Servers**

   Start the Next.js frontend:
   ```bash
   npm run dev
   ```
   The website will be available at `http://localhost:3000` or `http://localhost:3001`.

   Start Strapi CMS (in a separate terminal):
   ```bash
   cd strapi && npm run develop
   ```
   Strapi admin will be available at `http://localhost:1337/admin`.

6. **Docker for Full Environment (Optional)**
   
   Build and run complete environment:
   ```bash
   ./docker-setup.sh
   ```
   > **Note:** Docker Compose is for local development only. Production deployment is handled by Vercel.

## Usage

- **Development**: Use hot reloading with Next.js for immediate feedback.
- **Database Access**: PostgreSQL available at `localhost:5434` (user: strapi, password: strapi)
- **Content Management**: Strapi admin at `http://localhost:1337/admin` (after setup)
- **API Testing**: Strapi API available at `http://localhost:1337/api`
- **Building for Production**:
  ```bash
  npm run build
  npm start
  ```
- **Docker Management**:
  ```bash
  docker-compose ps          # Check container status
  docker-compose logs strapi  # View Strapi logs
  docker-compose down        # Stop all containers
  ```

### Known Issues
- **Strapi Startup:** May take 2-3 minutes on first run due to dependency conflicts
- **API Token:** Required for frontend-backend communication (generate in Strapi admin)
- **Security Vulnerabilities:** 32 npm vulnerabilities detected - run `npm audit fix`

## Development Workflow

We follow a Git-based branching strategy:
- **Main Branch**: Always stable and production-ready.

## Documentation Structure

- **Deployment:** See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for all deployment instructions and troubleshooting.
- **Developer Guide:** [`docs/DEVELOPER_DOC.md`](docs/DEVELOPER_DOC.md) for technical details and best practices.
- **Project Structure:** [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) for file and directory layout.
- **Strapi Integration:** [`docs/strapi-integration.md`](docs/strapi-integration.md) and [`docs/strapi-frontend-integration.md`](docs/strapi-frontend-integration.md) for CMS and frontend integration.
- **Setup Guides:** [`docs/setup/DEPLOYMENT_SETUP.md`](docs/setup/DEPLOYMENT_SETUP.md), [`docs/setup/STRAPI_SETUP_GUIDE.md`](docs/setup/STRAPI_SETUP_GUIDE.md), [`docs/setup/BLOG_SETUP.md`](docs/setup/BLOG_SETUP.md) for onboarding and environment setup.
- **Roadmap:** [`docs/PROJECT_ROADMAP.md`](docs/PROJECT_ROADMAP.md) for project milestones and future plans.

> **Always refer to the docs/ directory for the most up-to-date and detailed documentation.**

## Contributing

Contributions are welcome! If you'd like to help develop this project:
1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -m "Add my new feature"`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Open a pull request and describe your changes.

See our [CONTRIBUTING.md](CONTRIBUTING.md) for more details and our code of conduct.

## Roadmap

- **Phase 1: Core Content Site & Internationalization (Current Focus)**
  - Establish foundational project structure.
  - Integrate Next.js with Strapi (CMS) for content management.
  - Set up internationalization in Strapi and Next.js for German, English, French, and Italian.
  - Define initial content types in Strapi and migrate existing content.
  - Implement core website pages (Home, About, Services, Projects, Contact, etc.) fetching content from Strapi.
  - Ensure the external link to the existing webshop remains functional.

- **Phase 2: E-commerce Integration with MedusaJS (Future)**
  - Plan and implement MedusaJS as the e-commerce backend.
  - Define product structures and plan data migration from Kivitendo/Joomla.
  - Build integrated shop functionalities in the Next.js frontend (product listings, cart, checkout).
  - Replace the external webshop link with the integrated solution.

- **Phase 3: Enhancements & Optimizations (Future)**
  - Refine API integrations between Strapi and MedusaJS (once both are active).
  - Implement advanced search (e.g., Algolia/Meilisearch).
  - Address user authentication if needed for integrated shop/site features.
  - Optimize performance, accessibility, and add further user personalization features.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact & Acknowledgments

- **Project Maintainers**:  
  - [Your Name](https://yourwebsite.com) – lead developer  
  - [Contributor Name](https://github.com/contributor) – frontend/backend specialist

- **Contact**:  
  Email: [support@revamp-it.ch](mailto:support@revamp-it.ch)

- **Acknowledgments**:  
  We extend our gratitude to the open-source community and all volunteers who help make sustainable IT a reality.

---

*Let's build a modern digital home for Revamp-it that not only stands out technically but also champions sustainable and accessible technology for all.*
