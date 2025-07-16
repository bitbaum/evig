FROM node:18-alpine

WORKDIR /opt/app

# Install only essential dependencies
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev && \
    mkdir -p /opt/app/public/uploads

# Copy package files first for better caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --legacy-peer-deps --only=production

# Copy app files
COPY . /opt/app

# Expose Strapi port
EXPOSE 1337

# Start Strapi in development mode
CMD ["npx", "strapi", "develop"] 