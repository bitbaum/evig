# Revamp-it Strapi Integration

This directory contains the Strapi headless CMS setup for the Revamp-it website.

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine
- Git

### Setup Instructions

1. Clone the repository and navigate to the project root:
```bash
git clone https://github.com/your-org/revampit.git
cd revampit
```

2. Make sure you're on the Strapi integration branch:
```bash
git checkout feat/strapi-integration
```

3. Check that the `.env` file exists at the project root. If not, create it using the example values:
```bash
cp .env.example .env  # Then edit with your secure values
```

4. Start the Docker containers:
```bash
docker-compose up -d
```

5. Once the containers are running, access the Strapi admin panel:
```
http://localhost:1337/admin
```

6. Follow the setup guide in `app/setup-guide.md` to configure content types and internationalization.

## Directory Structure

- `/app` - The Strapi application code
- `/data` - Persistent data storage for Strapi

## Content Types

Based on the Revamp-it website blueprint, the following content types should be configured:

1. **Workshop** - For workshop events
2. **Page** - For static pages like About Us, etc.
3. **Project** - For showcasing Revamp-it projects
4. **TeamMember** - For team information
5. **MainMenu** - Single type for navigation structure

## Internationalization

The Strapi instance is configured for the following languages:
- German (de) - default
- English (en)
- French (fr)
- Italian (it)

## Troubleshooting

### Common Issues

1. **Database connection fails:**
   - Check if the PostgreSQL container is running: `docker ps`
   - Verify the database credentials in the `.env` file

2. **Changes not persisting:**
   - Ensure the volume mounts are correctly configured
   - Check permissions on the host directories

3. **Container fails to start:**
   - Check Docker logs: `docker-compose logs strapi`
   - Verify that required ports are not in use by other applications

## Resources

- [Strapi Documentation](https://docs.strapi.io/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/) 