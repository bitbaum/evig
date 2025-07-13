# Revamp-it Website Modernization

> Modern, Sustainable IT for Everyone  
> Hardware, Menschen und Know-how

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/revamp-it-modernization) 
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Table of Contents

- [Overview](#overview)
- [Vision and Objectives](#vision-and-objectives)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Development Workflow](#development-workflow)
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
- **Vercel / Netlify**: For seamless deployment and global Content Delivery Network (CDN) support.
- **Docker**: Containerization for consistency across environments.
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
- **Deployment:** The entire application is containerized using Docker for consistent, scalable, and secure deployments via Vercel's CD pipeline.

## Installation & Setup

### Prerequisites
- **Node.js (>=14) & npm/yarn**
- **Docker (for containerized development)**
- **Git**

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

4. **Run Locally**

   Start the development server:
   ```bash
   npm run dev
   ```
   The website will be available at `http://localhost:3000`.

5. **Docker (Optional)**
   
   Build and run with Docker:
   ```bash
   docker-compose up --build
   ```

## Usage

- **Development**: Use hot reloading with Next.js for immediate feedback.
- **Testing**: Run tests with:
  ```bash
  npm test
  ```
- **Building for Production**:
  ```bash
  npm run build
  npm start
  ```
- **Content Updates**: Manage website content via the Strapi admin dashboard.
- **Product & Shop Management (Future)**: Once MedusaJS is integrated, webshop inventory, products, and orders will be managed via its admin dashboard. For now, the webshop is an external link.

## Development Workflow

We follow a Git-based branching strategy:
- **Main Branch**: Always stable and production-ready.
- **Feature Branches**: Each new feature or bug fix should be developed in a dedicated branch.
- **Pull Requests**: Require code review and automated tests (via GitHub Actions) before merging.
- **Documentation**: Code should be well-commented and documented. Update the wiki and inline documentation as features are added.

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
