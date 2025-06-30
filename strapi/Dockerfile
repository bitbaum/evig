FROM node:18-alpine

# Install dumb-init and curl for health checks
RUN apk add --no-cache dumb-init curl

# Create app directory
WORKDIR /opt/app

# Create node user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S strapi -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code (including built dist directory)
COPY . .

# Create uploads directory
RUN mkdir -p public/uploads

# Change ownership to strapi user
RUN chown -R strapi:nodejs /opt/app
USER strapi

# Expose port
EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:1337/admin || exit 1

# Start the application (dist directory now exists)
CMD ["dumb-init", "npm", "run", "start"]
