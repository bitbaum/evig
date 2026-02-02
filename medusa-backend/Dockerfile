# Development Dockerfile for Medusa Backend
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:9000/health || exit 1

# Start in development mode
CMD ["npm", "run", "dev"]
