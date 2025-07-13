# Strapi Setup Guide for Revamp-it

## Overview

This guide will walk you through setting up Strapi as a content management system for the Revamp-it website. Strapi will enable non-technical team members to manage website content in multiple languages (German, English, French, and Italian).

## Prerequisites

- Docker and Docker Compose installed on your machine
- Git

## Getting Started

### 1. Start the Strapi Containers

Run the following command from the project root:

```bash
./start-strapi.sh
```

This script will:
- Start the Strapi and PostgreSQL containers
- Wait for them to initialize
- Show the container status

Once running, you should be able to access the Strapi admin panel at: http://localhost:1337/admin

### 2. Create an Admin Account

On your first visit to http://localhost:1337/admin, you'll be prompted to create an administrator account:

1. Enter your name, email address, and a secure password
2. Click "Ready to start" to complete the setup

### 3. Configure Internationalization

1. Navigate to Settings → Internationalization
2. Configure the following languages:
   - German (de) - default
   - English (en)
   - French (fr)
   - Italian (it)

### 4. Create Content Types

Based on the Revamp-it website blueprint, create the following content types:

#### Workshop

- **Name**: String, required
- **Description**: Rich Text, required
- **Date**: Date, required
- **Location**: String, required
- **Image**: Media, optional
- **Registration Link**: String, optional

#### Page

- **Title**: String, required
- **Slug**: String, required, unique
- **Content**: Rich Text, required
- **Meta Description**: Text, optional
- **Featured Image**: Media, optional

#### Project

- **Title**: String, required
- **Slug**: String, required, unique
- **Description**: Rich Text, required
- **Image**: Media, optional
- **Status**: Enumeration (Active, Completed, Planned), required
- **URL**: String, optional

#### TeamMember

- **Name**: String, required
- **Role**: String, required
- **Bio**: Rich Text, optional
- **Photo**: Media, optional
- **Email**: Email, optional
- **Order**: Integer, optional (for display order)

#### MainMenu (Single Type)

- **Items**: JSON, required (for navigation structure)

### 5. Set Permissions

1. Navigate to Settings → Roles
2. Click on "Public"
3. Under Permissions, enable "find" and "findOne" for all content types that should be publicly accessible
4. Save your changes

### 6. Add Content

Start adding content to your Strapi instance:

1. Create pages for "Home", "About Us", "Offerings", etc.
2. Add team members, projects, and workshops
3. Configure the main menu structure

### 7. Test the API

You can test the API by accessing:
- http://localhost:1337/api/pages
- http://localhost:1337/api/workshops
- http://localhost:1337/api/projects
- http://localhost:1337/api/team-members

### 8. Troubleshooting

If you encounter issues:

- **Database Connection Errors:**
  - If you see "Error: connect ECONNREFUSED" when starting the containers, it means Strapi can't connect to PostgreSQL
  - Check if the database container is running: `docker ps | grep strapi_db`
  - Make sure your `.env` file has the correct database configuration:
    ```
    DATABASE_CLIENT=postgres
    DATABASE_HOST=db
    DATABASE_PORT=5432
    DATABASE_NAME=strapi
    DATABASE_USERNAME=strapi
    DATABASE_PASSWORD=strapi
    DATABASE_SSL=false
    ```
  - If you've previously been using SQLite, you may need to delete the `.tmp` directory in the app folder
  - Restart both containers: `docker-compose restart`

- **Container Issues:**
  - Check if containers are running: `docker ps`
  - View container logs: `docker logs strapi` or `docker logs strapi_db`
  - Restart containers: `docker-compose restart`
  - If problems persist, try rebuilding: `docker-compose down && docker-compose up -d --build`

- **Permission Issues:**
  - Make sure your uploaded files directory has the correct permissions: `chmod -R 777 strapi/uploads`

## Next Steps

After setting up Strapi, you'll need to update the Next.js frontend to fetch content from the Strapi API. Refer to the integration documentation for details on connecting the frontend to Strapi. 