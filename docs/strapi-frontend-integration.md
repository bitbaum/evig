# Strapi Frontend Integration Guide

This document outlines how the Next.js frontend is integrated with the Strapi backend to fetch and display dynamic content.

## Overview

The blog section of the website is now fully powered by Strapi. All blog posts and related content are fetched at build time (for static pages) or on-demand from the Strapi API.

## API Service

All communication with the Strapi API is handled by a dedicated service located at `src/lib/strapi.ts`. This service includes functions for fetching:

- A list of all blog posts (`getBlogPosts`)
- A single blog post by its slug (`getBlogPostBySlug`)
- A list of all categories (`getCategories`)

The service is designed to be easily extensible for new content types.

## Environment Variables

To connect to the Strapi API, the following environment variables must be set in a `.env.local` file at the project root. You can use the `.env.example` file as a template:

- `STRAPI_URL`: The base URL of your Strapi instance (e.g., `http://localhost:1337`).
- `STRAPI_TOKEN`: A Strapi API token with read permissions for the `blog-post`, `category`, and `users-permissions` content types.

## Rendering Rich Text Content

Content from Strapi's Rich Text editor is rendered using a custom component at `src/components/ui/rich-text-renderer.tsx`. This component safely parses the JSON output from the editor and converts it into React components, preventing XSS vulnerabilities associated with `dangerouslySetInnerHTML`.

## How It Works

1.  **Data Fetching:** The blog pages (`src/app/blog/page.tsx` and `src/app/blog/[slug]/page.tsx`) are now asynchronous components that call the functions in `src/lib/strapi.ts` to fetch data.
2.  **Static Site Generation (SSG):** The `generateStaticParams` function in `src/app/blog/[slug]/page.tsx` pre-renders all blog posts at build time, ensuring fast load times and good SEO.
3.  **Dynamic Content:** The fetched data is then passed as props to the page components, which render the content dynamically.
4.  **Image Handling:** The `getImageUrl` helper function ensures that featured images are correctly resolved, whether they are hosted locally or on a separate media server.

This setup ensures a clean separation of concerns between the frontend and backend, making the application more maintainable and scalable. 