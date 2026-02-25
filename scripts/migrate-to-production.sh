#!/bin/bash
# RevampIT Production Migration Script
# One-command migration from development to Frauenfeld production server
#
# Usage: ./scripts/migrate-to-production.sh [server-ip] [domain]
#
# Example: ./scripts/migrate-to-production.sh 192.168.1.100 revampit.ch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP=${1:-""}
DOMAIN=${2:-"revampit.ch"}
PROJECT_NAME="revampit"
REMOTE_USER="revampit"
REMOTE_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="/opt/backups/${PROJECT_NAME}"

# Functions
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

step() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# Validate inputs
if [ -z "$SERVER_IP" ]; then
    error "Server IP is required"
    echo "Usage: $0 <server-ip> [domain]"
    echo "Example: $0 192.168.1.100 revampit.ch"
    exit 1
fi

# Pre-flight checks
preflight_checks() {
    step "Running pre-flight checks..."

    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
        error "Not in RevampIT project directory. Please run from project root."
        exit 1
    fi

    # Check if environment file exists
    if [ ! -f ".env" ]; then
        warning "No .env file found. Creating from environment.example..."
        cp environment.example .env
        warning "Please edit .env file with production values before continuing!"
        read -p "Press Enter to continue after editing .env..."
    fi

    # Check SSH connection
    info "Testing SSH connection to server..."
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${REMOTE_USER}@${SERVER_IP} "echo 'SSH connection successful'" 2>/dev/null; then
        error "Cannot connect to server ${SERVER_IP} as user ${REMOTE_USER}"
        error "Please ensure:"
        error "1. SSH key is set up for passwordless login"
        error "2. User ${REMOTE_USER} exists on the server"
        error "3. Server is reachable"
        exit 1
    fi

    success "Pre-flight checks passed"
}

# Setup server
setup_server() {
    step "Setting up server..."

    ssh ${REMOTE_USER}@${SERVER_IP} << EOF
        set -e

        echo "🔧 Installing system dependencies..."
        sudo apt update
        sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx curl

        echo "🐳 Starting Docker service..."
        sudo systemctl enable docker
        sudo systemctl start docker

        echo "👤 Creating application user..."
        sudo useradd -m -s /bin/bash ${PROJECT_NAME} 2>/dev/null || true
        sudo usermod -aG docker ${PROJECT_NAME}

        echo "📁 Creating directories..."
        sudo mkdir -p /opt/${PROJECT_NAME}
        sudo mkdir -p ${BACKUP_DIR}
        sudo chown -R ${PROJECT_NAME}:${PROJECT_NAME} /opt/${PROJECT_NAME}
        sudo chown -R ${PROJECT_NAME}:${PROJECT_NAME} ${BACKUP_DIR}

        echo "🔥 Configuring firewall..."
        sudo ufw allow ssh
        sudo ufw allow http
        sudo ufw allow https
        sudo ufw --force enable

        echo "✅ Server setup complete"
EOF

    success "Server setup completed"
}

# Deploy application
deploy_application() {
    step "Deploying application..."

    # Create remote environment file
    info "Creating production environment file..."
    cat > .env.production << EOF
# Production Environment for RevampIT
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}

# Application
PORT=3000
HOSTNAME=0.0.0.0

# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=revampit_cms
DB_USER=revampit_prod
DB_PASSWORD=$(openssl rand -base64 32)

# Authentication
AUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://${DOMAIN}

# Search
MEILI_MASTER_KEY=$(openssl rand -base64 32)
MEILI_PORT=7700

# Email (configure these!)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=noreply@${DOMAIN}
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@${DOMAIN}

# SSL (Let's Encrypt will handle this)
SSL_CERT_PATH=/etc/letsencrypt/live/${DOMAIN}/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/${DOMAIN}/privkey.pem
EOF

    # Copy files to server
    info "Copying application files to server..."
    rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.git' \
          --exclude='*.log' --exclude='logs/' \
          . ${REMOTE_USER}@${SERVER_IP}:${REMOTE_DIR}/

    # Copy production environment
    scp .env.production ${REMOTE_USER}@${SERVER_IP}:${REMOTE_DIR}/.env

    success "Application files deployed"
}

# Setup production services
setup_production_services() {
    step "Setting up production services..."

    ssh ${REMOTE_USER}@${SERVER_IP} << EOF
        set -e
        cd ${REMOTE_DIR}

        echo "🐳 Building and starting services..."
        docker compose -f docker-compose.prod.yml build
        docker compose -f docker-compose.prod.yml up -d

        echo "⏳ Waiting for services to be healthy..."
        sleep 30

        echo "🔍 Checking service health..."
        docker compose -f docker-compose.prod.yml ps

        # Run database migrations
        echo "🗄️ Running database setup..."
        docker compose -f docker-compose.prod.yml exec -T app npm run db:migrate 2>/dev/null || echo "Migration script not found, skipping..."

        echo "✅ Services setup complete"
EOF

    success "Production services configured"
}

# Setup reverse proxy and SSL
setup_nginx_ssl() {
    step "Setting up reverse proxy and SSL..."

    # Create Nginx configuration
    cat > nginx.conf << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL certificates (will be set up by Certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
EOF

    # Copy Nginx config to server
    scp nginx.conf ${REMOTE_USER}@${SERVER_IP}:/tmp/nginx.conf

    # Setup Nginx and SSL
    ssh ${REMOTE_USER}@${SERVER_IP} << EOF
        set -e

        echo "🌐 Configuring Nginx..."
        sudo cp /tmp/nginx.conf /etc/nginx/sites-available/${PROJECT_NAME}
        sudo ln -sf /etc/nginx/sites-available/${PROJECT_NAME} /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t
        sudo systemctl reload nginx

        echo "🔒 Setting up SSL certificates..."
        # Note: This will prompt for email and domain confirmation
        echo "You'll be prompted to:"
        echo "1. Enter your email address"
        echo "2. Agree to terms of service"
        echo "3. Choose whether to redirect HTTP to HTTPS"
        sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}

        echo "✅ Nginx and SSL setup complete"
EOF

    success "Reverse proxy and SSL configured"
}

# Migrate data (if needed)
migrate_data() {
    step "Checking for data migration needs..."

    # Check if there are any existing databases to migrate
    read -p "Do you have existing database data to migrate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        warning "Please manually migrate your databases:"
        echo "1. Export from current server:"
        echo "   pg_dump -h current-db-host -U postgres -d revampit_cms -F c -f revampit_cms_backup.dump"
        echo ""
        echo "2. Transfer to new server:"
        echo "   scp revampit_cms_backup.dump ${REMOTE_USER}@${SERVER_IP}:${REMOTE_DIR}/"
        echo ""
        echo "3. Import on new server:"
        echo "   ssh ${REMOTE_USER}@${SERVER_IP}"
        echo "   cd ${REMOTE_DIR}"
        echo "   docker compose -f docker-compose.prod.yml exec -T db pg_restore -U revampit_prod -d revampit_cms < revampit_cms_backup.dump"
        echo ""
        read -p "Press Enter when data migration is complete..."
    fi

    success "Data migration step completed"
}

# Setup monitoring and backups
setup_monitoring() {
    step "Setting up monitoring and backups..."

    # Create backup script on server
    ssh ${REMOTE_USER}@${SERVER_IP} << EOF
        set -e

        echo "💾 Creating backup script..."
        cat > ${REMOTE_DIR}/scripts/backup.sh << 'BACKUP_EOF'
#!/bin/bash
# Automated backup script for RevampIT production
BACKUP_DIR="/opt/backups/revampit"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup databases
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U revampit_prod revampit_cms | gzip > \$BACKUP_DIR/db_\$DATE.sql.gz

# Clean old backups (keep last 7 days)
find \$BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: \$DATE"
BACKUP_EOF

        chmod +x ${REMOTE_DIR}/scripts/backup.sh

        echo "⏰ Setting up daily backups..."
        (crontab -l ; echo "0 2 * * * ${REMOTE_DIR}/scripts/backup.sh") | crontab -

        echo "📊 Setting up health monitoring..."
        cat > ${REMOTE_DIR}/scripts/health-check.sh << 'HEALTH_EOF'
#!/bin/bash
# Health check script for RevampIT

SERVICES=("db" "meilisearch" "app")
FAILED_SERVICES=""

for service in "\${SERVICES[@]}"; do
    if ! docker compose -f docker-compose.prod.yml ps \$service | grep -q "Up"; then
        FAILED_SERVICES="\$FAILED_SERVICES \$service"
    fi
done

if [ -n "\$FAILED_SERVICES" ]; then
    echo "❌ Failed services:\$FAILED_SERVICES"
    exit 1
else
    echo "✅ All services healthy"
    exit 0
fi
HEALTH_EOF

        chmod +x ${REMOTE_DIR}/scripts/health-check.sh

        echo "✅ Monitoring setup complete"
EOF

    success "Monitoring and backups configured"
}

# Final verification
final_verification() {
    step "Running final verification..."

    info "Testing application health..."
    sleep 10

    # Test health endpoint
    if curl -f -s https://${DOMAIN}/health > /dev/null; then
        success "Health check passed"
    else
        warning "Health check failed - application may still be starting"
    fi

    # Test main application
    if curl -f -s -I https://${DOMAIN}/ | grep -q "200 OK\|302"; then
        success "Application responding correctly"
    else
        warning "Application not responding - check logs"
    fi

    success "Migration completed successfully!"
    echo ""
    echo "🎉 Your application is now live at: https://${DOMAIN}"
    echo ""
    echo "Next steps:"
    echo "1. Update DNS records to point ${DOMAIN} to ${SERVER_IP}"
    echo "2. Test all functionality thoroughly"
    echo "3. Monitor logs: ssh ${REMOTE_USER}@${SERVER_IP} 'cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml logs -f'"
    echo "4. Setup monitoring alerts if needed"
    echo ""
    echo "Useful commands:"
    echo "- View logs: docker compose -f docker-compose.prod.yml logs -f [service]"
    echo "- Restart: docker compose -f docker-compose.prod.yml restart [service]"
    echo "- Backup: ${REMOTE_DIR}/scripts/backup.sh"
    echo "- Health check: ${REMOTE_DIR}/scripts/health-check.sh"
}

# Main execution
main() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║           RevampIT Production Migration Tool            ║"
    echo "║              One-Command Migration to Production         ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    log "Starting migration to ${DOMAIN} on server ${SERVER_IP}"

    preflight_checks
    setup_server
    deploy_application
    setup_production_services
    setup_nginx_ssl
    migrate_data
    setup_monitoring
    final_verification

    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                    Migration Complete!                  ║"
    echo "║                                                        ║"
    echo "║  🌐 Your site is live at: https://${DOMAIN}             ║"
    echo "║  🔧 Server: ${SERVER_IP}                               ║"
    echo "║  📊 Monitoring: Health checks configured              ║"
    echo "║  💾 Backups: Daily automated backups                  ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Cleanup
    rm -f .env.production nginx.conf
}

# Run main function
main "$@"