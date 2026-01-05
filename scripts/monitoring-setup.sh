#!/bin/bash
# Monitoring setup script for RevampIT
# Sets up basic monitoring and alerting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Setting up monitoring for RevampIT${NC}"

# Function to log with timestamp
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Install monitoring dependencies
setup_dependencies() {
    log "Installing monitoring dependencies..."

    # Check if pm2 is available for process monitoring
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}⚠️  PM2 not found. Installing globally...${NC}"
        npm install -g pm2
    fi

    echo -e "${GREEN}✅ Dependencies ready${NC}"
}

# Setup PM2 monitoring
setup_pm2() {
    log "Setting up PM2 process monitoring..."

    # Create ecosystem file if it doesn't exist
    if [ ! -f "ecosystem.config.js" ]; then
        cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'revampit',
    script: 'npm',
    args: 'run start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF
        echo -e "${GREEN}✅ Created ecosystem.config.js${NC}"
    fi

    # Start with PM2 if not already running
    if ! pm2 list | grep -q revampit; then
        pm2 start ecosystem.config.js
        pm2 save
        pm2 startup
    fi

    echo -e "${GREEN}✅ PM2 monitoring configured${NC}"
}

# Setup health check monitoring
setup_health_checks() {
    log "Setting up health check monitoring..."

    # Create health check script
    cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for monitoring
# This script is called by monitoring systems

HEALTH_CHECK_URL=${HEALTH_CHECK_URL:-"http://localhost:3000/api/health"}
TIMEOUT=10

# Perform health check
if curl -f -s --max-time $TIMEOUT "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    echo "OK"
    exit 0
else
    echo "FAIL"
    exit 1
fi
EOF

    chmod +x scripts/health-check.sh

    echo -e "${GREEN}✅ Health check script created${NC}"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."

    # Create logrotate configuration
    if command -v logrotate &> /dev/null; then
        sudo tee /etc/logrotate.d/revampit > /dev/null << 'EOF'
/home/*/revampit/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 node node
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
        echo -e "${GREEN}✅ Log rotation configured${NC}"
    else
        echo -e "${YELLOW}⚠️  logrotate not available. Install it for automatic log rotation.${NC}"
    fi
}

# Setup basic alerting
setup_alerting() {
    log "Setting up basic alerting..."

    # Create alert script
    cat > scripts/alert.sh << 'EOF'
#!/bin/bash
# Alert script for monitoring failures
# Customize this to integrate with your alerting system

ALERT_TYPE=$1
MESSAGE=$2
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Log alert
echo "[$TIMESTAMP] ALERT: $ALERT_TYPE - $MESSAGE" >> logs/alerts.log

# Send email alert (customize with your email setup)
if [ -n "$ALERT_EMAIL" ]; then
    echo "Alert: $ALERT_TYPE - $MESSAGE" | mail -s "RevampIT Alert: $ALERT_TYPE" "$ALERT_EMAIL"
fi

# Send to Slack (customize with your webhook)
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 RevampIT Alert: $ALERT_TYPE - $MESSAGE\"}" \
        "$SLACK_WEBHOOK"
fi

# Send to monitoring service (customize)
if [ -n "$MONITORING_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"alert_type\":\"$ALERT_TYPE\",\"message\":\"$MESSAGE\",\"timestamp\":\"$TIMESTAMP\"}" \
        "$MONITORING_WEBHOOK"
fi
EOF

    chmod +x scripts/alert.sh

    echo -e "${GREEN}✅ Alerting script created${NC}"
}

# Setup monitoring dashboard
setup_monitoring_dashboard() {
    log "Setting up monitoring dashboard..."

    # Create monitoring script
    cat > scripts/monitor.sh << 'EOF'
#!/bin/bash
# Monitoring dashboard script
# Run this to get a quick overview of system health

echo "=== RevampIT Monitoring Dashboard ==="
echo "Timestamp: $(date)"
echo

# System resources
echo "System Resources:"
echo "  CPU: $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')"
echo "  Memory: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "  Disk: $(df / | tail -1 | awk '{print $5}')"
echo

# Application health
echo "Application Health:"
if curl -f -s "http://localhost:3000/api/health" > /dev/null 2>&1; then
    echo "  ✅ Frontend: Healthy"
else
    echo "  ❌ Frontend: Unhealthy"
fi

if curl -f -s "http://localhost:9000/health" > /dev/null 2>&1; then
    echo "  ✅ Medusa: Healthy"
else
    echo "  ❌ Medusa: Unhealthy"
fi

# Database connectivity
echo "Database Connectivity:"
if PGPASSWORD="$AUTH_DB_PASSWORD" psql -h "$AUTH_DB_HOST" -p "$AUTH_DB_PORT" -U "$AUTH_DB_USER" -d "$AUTH_DB_NAME" -c "SELECT 1;" --quiet --no-align --tuples-only > /dev/null 2>&1; then
    echo "  ✅ CMS Database: Connected"
else
    echo "  ❌ CMS Database: Disconnected"
fi

# Services
echo "Services:"
if docker ps | grep -q revampit_medusa; then
    echo "  ✅ Medusa Services: Running"
else
    echo "  ❌ Medusa Services: Not running"
fi

if pm2 list | grep -q online; then
    echo "  ✅ PM2 Processes: Running"
else
    echo "  ❌ PM2 Processes: Not running"
fi

echo
echo "Recent Errors:"
if [ -f "logs/err.log" ]; then
    tail -5 logs/err.log | while read line; do
        echo "  $line"
    done
else
    echo "  No error log found"
fi

echo
echo "Recent Alerts:"
if [ -f "logs/alerts.log" ]; then
    tail -3 logs/alerts.log | while read line; do
        echo "  $line"
    done
else
    echo "  No alerts found"
fi
EOF

    chmod +x scripts/monitor.sh

    echo -e "${GREEN}✅ Monitoring dashboard created${NC}"
}

# Main setup process
main() {
    setup_dependencies
    setup_pm2
    setup_health_checks
    setup_log_rotation
    setup_alerting
    setup_monitoring_dashboard

    log "🎉 Monitoring setup completed!"
    echo
    echo -e "${GREEN}Monitoring is now active. Run these commands:${NC}"
    echo "  ./scripts/monitor.sh          # View monitoring dashboard"
    echo "  ./scripts/health-check.sh     # Manual health check"
    echo "  pm2 monit                     # PM2 monitoring interface"
    echo "  pm2 logs                      # View application logs"
}

# Run main function
main "$@"