# Strapi Integration

## Overview

This document outlines the plan for integrating Strapi, a headless CMS, into our project. The goal is to enable non-technical team members to manage content easily, while setting up a foundation for future MedusaJS integration.

## Architecture Context

Our project follows a phased approach:
1. **Phase 1 (Current):** Establish multilingual content website with Strapi
2. **Phase 2 (Future):** Develop new webshop with MedusaJS (parallel to existing Kivitendo/Joomla)
3. **Phase 3 (Future):** Consolidate webshops and enhance Strapi-MedusaJS integration

## Why Strapi?

- **User-friendly interface:** Strapi provides a user-friendly interface for managing content without having to write code.
- **Flexible API:** Strapi provides a flexible API that you can use to fetch the content from your frontend application.
- **Self-hosted:** Strapi can be self-hosted, giving you full control over your data.
- **Internationalization:** Robust support for managing content in German, English, French, and Italian.
- **Future Integration:** Designed to work well with MedusaJS for future e-commerce features.

## Why Docker?

- **Easy setup:** Docker makes it easy to set up Strapi and its database (PostgreSQL) with a single command.
- **Consistency:** Docker ensures that Strapi runs the same way on any computer, so you don't have to worry about compatibility issues.
- **Isolation:** Docker isolates Strapi from other applications on your computer, so it doesn't interfere with them.
- **Deployment:** Aligns with our existing Docker-based deployment strategy.

## To-Do List

### Phase 1: Initial Strapi Setup
- [x] Create a new branch for the Strapi integration
- [x] Create a `docker-compose.yml` file to define the Strapi and PostgreSQL services
- [x] Create a `Dockerfile` for Strapi
- [x] Create a `.env` file to store environment variables
- [x] Create setup guide for Strapi
- [ ] Run the Docker Compose setup to start Strapi and the database
- [ ] Access the Strapi admin panel and start creating content types

### Phase 1: Content Migration & Frontend Integration
- [ ] Define content types in Strapi for:
  - Workshops
  - Static pages (About Us, Projects, etc.)
  - Blog posts
  - Other informational content
- [ ] Configure internationalization for all content types (German, English, French, Italian)
- [ ] Migrate existing content from JSON files to Strapi
- [ ] Update Next.js frontend to fetch content from Strapi
- [ ] Implement language switching mechanism
- [ ] Ensure external Kivitendo/Joomla webshop link remains functional

### Phase 1: Testing & Documentation
- [ ] Test content management workflows
- [ ] Test internationalization features
- [ ] Document content management processes for non-technical team members
- [ ] Create API documentation for frontend developers

## Future Considerations (Phase 2 & 3)

### MedusaJS Integration
- [ ] Plan for potential content-product relationships between Strapi and MedusaJS
- [ ] Consider shared user authentication if needed
- [ ] Plan for unified search across both platforms

### Performance & Scalability
- [ ] Monitor Strapi performance
- [ ] Plan for caching strategies
- [ ] Consider CDN integration if needed

## Resources

- [Strapi Documentation](https://docs.strapi.io/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Documentation](https://nextjs.org/docs)
- [MedusaJS Documentation (for future reference)](https://docs.medusajs.com/) 