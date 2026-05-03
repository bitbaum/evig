# RevampIT CMS API Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for PostgreSQL
RUN apk add --no-cache postgresql-client curl

# Copy package files
COPY package*.json ./

# Install dependencies
# Install all deps to build TypeScript, then prune to production
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Build TypeScript
RUN npm run build && npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S cmsuser -u 1001

# Change ownership of app directory
RUN chown -R cmsuser:nodejs /app
USER cmsuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -fsS http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]


