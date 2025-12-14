# Admin Quick Reference Guide

## 🚀 Getting Started

### One-Command Setup
```bash
npm run d              # Start all services
npm run setup-admins   # Create admin users
```

### Access Points
- **Main Admin Dashboard**: http://localhost:3000/admin
- **Medusa Shop Admin**: http://localhost:9000/app
- **AI CMS Editor**: http://localhost:3000/ai-cms
- **Shop Frontend**: http://localhost:3000/shop/medusa

### Admin Credentials
- **CMS Admin**: admin@revampit.ch / Admin123!
- **Medusa Admin**: admin2@revampit.ch / Admin123!

## 🛠️ Common Tasks

### Start/Stop Services
```bash
npm run d              # Start everything
npm run stop:all       # Stop all services
npm run medusa:up      # Start only Medusa services
npm run medusa:down    # Stop only Medusa services
```

### Monitor System
```bash
docker ps              # Check container status
npm run medusa:logs    # View Medusa logs
```

### Manage Users
- Visit http://localhost:3000/admin → "Benutzer verwalten"
- Or use Medusa admin for customer accounts

### Add Products
1. Go to http://localhost:3000/admin
2. Click "Medusa Shop Admin" in "Externe Dienste"
3. Navigate to "Products" → "New Product"
4. Fill details and upload images
5. Click "Publish"

### Edit Content
- **Pages/Posts**: http://localhost:3000/ai-cms
- **Quick Access**: Use "CMS Inhalte bearbeiten" in admin dashboard

## 📋 Admin Dashboard Features

### Quick Actions
- **Produkte verwalten**: CMS product management
- **Benutzer verwalten**: User accounts and roles
- **Workshops verwalten**: Event management
- **Berichte anzeigen**: Analytics and reports

### External Services
- **Medusa Shop Admin**: E-commerce management
- **CMS Inhalte bearbeiten**: Content management
- **Shop Frontend**: Preview store

### Admin Shortcuts
Click any button to copy the command to clipboard:
- Start all services
- Setup admin users
- Check database status
- View logs
- Quick links to all admin interfaces

## 🔧 Troubleshooting

### Services Won't Start
```bash
docker ps                    # Check if containers are running
npm run medusa:logs         # Check for errors
docker compose down         # Clean restart
npm run d                   # Restart all
```

### Can't Access Admin
```bash
npm run setup-admins        # Recreate admin users
# Check credentials above
```

### Products Not Showing
1. Verify products are published in Medusa admin
2. Check http://localhost:9000/health
3. Restart services if needed

### Database Issues
```bash
docker compose down -v      # Remove volumes (⚠️ loses data)
npm run reset              # Full system reset
```

## 📞 Support

- **Logs**: `npm run medusa:logs`
- **Health Check**: http://localhost:9000/health
- **System Status**: Check admin dashboard

---

**Remember**: Most common tasks can be done directly from the unified admin dashboard at http://localhost:3000/admin



