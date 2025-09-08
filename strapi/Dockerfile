# Multi-stage build for better performance and security
FROM node:18-alpine AS base

# Install system dependencies for native modules
RUN apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    vips-dev \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /opt/app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies with exact versions
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Install sharp for linuxmusl platform (required for image processing)
RUN npm install --platform=linuxmusl --arch=x64 sharp

# Install better-sqlite3 for linuxmusl platform (required for SQLite)
RUN npm install --platform=linuxmusl --arch=x64 better-sqlite3

# Development stage
FROM base AS development

# Install dev dependencies
RUN npm install --only=development --ignore-scripts

# Copy source code
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p public/uploads && \
    chown -R node:node /opt/app

# Switch to non-root user
USER node

EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:1337/_health || exit 1

CMD ["npm", "run", "develop"]

# Production stage
FROM base AS production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create uploads directory
RUN mkdir -p public/uploads && \
    chown -R node:node /opt/app

# Switch to non-root user
USER node

EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:1337/_health || exit 1

CMD ["npm", "run", "start"] 