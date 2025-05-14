# Content and Commerce Management Strategy

**Date:** 2025-05-12 (Update with current date)

## 1. Context and Problem

The RevampIT website requires a robust strategy for managing two main types of dynamic information:
1.  **Website Content:** Pages like "Workshops," "About Us," "Projects," which are currently mostly built on the frontend and need a more maintainable and scalable content management solution. Workshop information, in particular, needs to be easily updatable.
2.  **Webshop Inventory:** A separate existing webshop (currently on Kivitendo/Joomla) with thousands of used computers and parts needs to be integrated or rebuilt with a modern backend that simplifies inventory and product management.

## 2. Goals

*   Maximize ease of content creation and updates for non-technical users (for workshops, static pages).
*   Efficiently manage a large and frequently changing inventory for the webshop (used computers and parts).
*   Ensure the overall system is maintainable, scalable, and follows best practices.
*   Leverage the existing Next.js frontend structure where possible.

## 3. Options Considered

1.  **TinaCMS Alone:** Excellent for content, but not designed for complex e-commerce inventory management.
2.  **MedusaJS Alone:** Strong for e-commerce and inventory; content management capabilities are present but less rich than a dedicated CMS.
3.  **Combined TinaCMS and MedusaJS:** Leverages the strengths of both but introduces higher initial complexity.

## 4. Chosen Strategy: Phased Approach

A phased approach was decided upon to manage complexity, build on existing progress, and utilize the most appropriate tools for each primary need.

### Phase 1: Solidify Content Management with TinaCMS

*   **Action:** Integrate TinaCMS into the existing Next.js application.
*   **Scope:** Manage content for workshops, static pages (e.g., "About Us"), and potentially project detail pages.
*   **Implementation:**
    *   Convert existing hardcoded content (especially for workshops) into Markdown/MDX files stored in the Git repository (e.g., `content/workshops/`, `content/pages/`).
    *   Define clear frontmatter for structured data within these files.
    *   Update Next.js dynamic routes (e.g., `/workshops/[slug]`) to fetch and render content from these MDX files.
    *   Adapt existing frontend components to consume data from TinaCMS/MDX.
*   **Rationale:**
    *   Leverages the "almost finished" state of the non-webshop frontend.
    *   Provides immediate improvements in content manageability.
    *   Sets a strong foundation for structured content.

### Phase 2: Tackle Webshop with MedusaJS

*   **Action:** Implement MedusaJS as the backend for the e-commerce webshop.
*   **Scope:** Manage inventory, product details, variants, orders, and eventually checkout for used computers and parts.
*   **Implementation:**
    *   Set up a new MedusaJS backend instance.
    *   Develop a detailed data migration plan to move the thousands of existing items from Kivitendo/Joomla into MedusaJS.
    *   Build dedicated webshop frontend sections/pages in the Next.js application (e.g., `/shop`, `/shop/[productHandle]`, `/cart`) that interact with the MedusaJS API.
*   **Rationale:**
    *   Uses a specialized e-commerce engine for its core strengths (inventory, product management).
    *   Isolates the complex webshop build and data migration effort.

### Phase 3: Optional Linking and Future Integration

*   **Consideration:** If, in the future, workshops require e-commerce functionalities (e.g., paid registrations, seat inventory managed like products), a link between TinaCMS-managed workshop content and MedusaJS can be established.
*   **Potential Implementation:**
    *   Create minimalist "product" representations for relevant workshops in MedusaJS.
    *   Add a reference (e.g., `medusaProductHandle`) in the frontmatter of the corresponding TinaCMS MDX file.
    *   The Next.js workshop detail page would then fetch primary content from TinaCMS/MDX and make a secondary call to MedusaJS for any commerce-related data.
*   **Rationale:** Defers this complexity until the need is concrete, keeping initial phases simpler.

## 5. Justification for Phased Approach

*   **Risk Mitigation:** Addresses distinct complex problems (content vs. inventory) in focused stages.
*   **Leverages Progress:** Builds upon the frontend work already completed for content-heavy pages.
*   **Best-of-Breed:** Allows for using TinaCMS for its content strengths and MedusaJS for its e-commerce strengths without forcing one tool to do everything inadequately.
*   **Incremental Value:** Delivers improvements to content management quickly, followed by the larger webshop overhaul.

## 6. High-Level Next Steps

1.  **TinaCMS Integration:**
    *   Install and configure TinaCMS.
    *   Define content models/schemas.
    *   Begin migrating workshop content to MDX files.
2.  **Webshop Planning (MedusaJS):**
    *   Detailed planning for MedusaJS setup.
    *   In-depth analysis for data migration from Kivitendo/Joomla.
    *   Prototype product structure in Medusa.

---
This document outlines the strategic direction. Detailed implementation plans for each phase will be developed as they are initiated. 