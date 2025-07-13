# Project Roadmap & To-Do List

This document outlines the high-level roadmap and to-do list for the Revamp-it website modernization project. It should be referred to and critically evaluated as the project progresses.

## Guiding Principles:
- Phased approach to manage complexity.
- Prioritize a stable, multilingual content website first.
- Defer e-commerce overhaul to a subsequent phase.

## Phase 1: Core Multilingual Content Website (Current Focus)

**Goal:** Launch a robust, multilingual (German, English, French, Italian) website with content managed via Strapi. The existing webshop will remain an external link.

**Status:** In Progress

**Key Milestones & To-Do Items:**

1.  **Project Setup & Configuration:**
    *   [x] Next.js project initialized with TypeScript, Tailwind CSS.
    *   [ ] Ensure all base dependencies are appropriate for the Strapi integration.

2.  **Strapi CMS Integration:**
    *   [ ] Set up a Strapi instance (local development and production/staging).
    *   [ ] Define core content types in Strapi (e.g., Pages, Posts, Workshops, Services, Projects, Navigation Menus, Footer Content).
    *   [ ] Configure internationalization in Strapi for German, English, French, and Italian.
    *   [ ] Implement user roles and permissions in Strapi for content editors.

3.  **Next.js Frontend - Strapi Integration:**
    *   [ ] Develop a Strapi API client in Next.js (`src/lib/strapi.ts`).
    *   [ ] Implement dynamic routing in Next.js to handle localized paths (e.g., `/en/about`, `/de/ueber-uns`).
    *   [ ] Modify Next.js page components to fetch and render content from Strapi based on locale.
    *   [ ] Ensure all content is fetched dynamically from Strapi (avoid hardcoded content in components).

4.  **Content Migration:**
    *   [ ] Plan and execute migration of existing content from JSON files (`content/en`, `content/de`) into Strapi for English and German.
    *   [ ] Plan for translation and creation of content for French and Italian in Strapi.

5.  **Core Pages & Features Implementation:**
    *   [ ] Develop/Update key pages: Home, About Us, Offerings, Projects, Wiki, Volunteer & Donate, Terms & Conditions.
    *   [ ] Implement a user-friendly language switcher component.
    *   [ ] Ensure the external link to the Kivitendo/Joomla webshop is correctly implemented and clearly marked.
    *   [ ] Implement SEO best practices for a multilingual site (hreflang tags, localized metadata from Strapi).

6.  **Styling & UI Refinement:**
    *   [ ] Ensure consistent styling and UI across all pages and languages.
    *   [ ] Perform thorough responsive design testing.

7.  **Testing & QA:**
    *   [ ] Unit and integration tests for critical components and data fetching logic.
    *   [ ] End-to-end testing of user flows (navigation, language switching, content display).
    *   [ ] Cross-browser and cross-device testing.
    *   [ ] Content review and proofreading for all languages.

8.  **Deployment & Go-Live (Phase 1):**
    *   [ ] Configure CI/CD pipeline for the Next.js frontend and potentially the Strapi backend.
    *   [ ] Deploy Strapi backend.
    *   [ ] Deploy Next.js frontend to Vercel (or chosen platform).
    *   [ ] Final pre-launch checks.

## Phase 2: E-commerce Development with MedusaJS (Future Phase - Parallel Build)

**Goal:** Develop and launch a new, modern webshop using MedusaJS, running in parallel with the existing Kivitendo/Joomla webshop. A decision on the Kivitendo/Joomla webshop (e.g., decommission, integrate, keep separate) will be made after the new MedusaJS shop is operational and evaluated.

**Status:** Not Started

**Key Milestones & To-Do Items (Preliminary):**

1.  **MedusaJS Backend Setup & Configuration:**
    *   [ ] Set up a new MedusaJS instance for the new webshop.
    *   [ ] Configure core MedusaJS settings (regions, currencies, payment providers, shipping) specifically for the new shop.
    *   [ ] Define product structures, categories, and variants for the new product catalog intended for MedusaJS.

2.  **Product Catalog Development for New Shop:**
    *   [ ] Determine the product catalog for the new MedusaJS shop (e.g., select items, new offerings).
    *   [ ] Prepare and import product data into MedusaJS. (This might involve some data from Kivitendo/Joomla if certain products are to be featured on both or transitioned, but not necessarily a full migration initially).

3.  **Next.js Frontend - New MedusaJS Webshop:**
    *   [ ] Develop MedusaJS API client in Next.js.
    *   [ ] Build the new shop pages: Product Listing, Product Detail, Cart, Checkout, User Account (Orders) for the MedusaJS shop. This might involve a new section or subdomain (e.g., `new-shop.revamp-it.ch` or `/new-shop`).
    *   [ ] Integrate payment gateway(s) for the MedusaJS shop.

4.  **Operational Parallelism & User Guidance:**
    *   [ ] Ensure the existing Kivitendo/Joomla webshop link remains clearly accessible.
    *   [ ] Plan how users will be directed or informed about the two parallel webshops (e.g., announcements, clear navigation if both are linked from the main site).

5.  **Integration with Strapi (Optional but Recommended for the New Shop):**
    *   [ ] Explore linking products in the new MedusaJS shop with related content in Strapi.

6.  **Testing, Deployment & Launch (New MedusaJS Shop).**

7.  **Post-Launch Evaluation & Decision on Kivitendo/Joomla Webshop:**
    *   [ ] Evaluate performance and user feedback for the new MedusaJS webshop.
    *   [ ] Make a strategic decision regarding the future of the Kivitendo/Joomla webshop (e.g., phase out, migrate remaining data, keep for specific purposes).

## Phase 3: Ongoing Enhancements & Optimizations (Future Phase)

**Goal:** Continuously improve the website and e-commerce platform.

**Status:** Not Started

**Potential Items:**
*   Advanced search functionality (e.g., Algolia/Meilisearch integrating Strapi & MedusaJS data).
*   User account features beyond e-commerce (e.g., workshop registrations linked to user profiles).
*   Performance optimizations.
*   New feature requests based on user feedback.

---
*This roadmap is a living document and will be updated as the project progresses.* 