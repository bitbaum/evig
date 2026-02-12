# ✅ THIS IS THE ACTIVE PROJECT DIRECTORY

**Location:** `/home/g/dev/revampit`

This is the correct and only directory for RevampIT development.

## Key Facts:
- ✅ Deployed to: https://revampit.vercel.app
- ✅ GitHub: https://github.com/g-but/revampit
- ✅ Database: Neon PostgreSQL (cloud)
- ✅ Port: 3001 (dev server)

## Database Setup:
**Required:** Neon PostgreSQL connection

```bash
# Run this to configure database:
./switch-to-neon.sh
```

The `.env.local` file MUST have:
```
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

## Features:
- 🛒 P2P Marketplace (Amazon-like for used hardware)
- 🔧 IT-Hilfe (Uber-like for repairs)
- 📦 Inventory management
- 🎓 Workshops & Events
- 💬 Messaging system
- 💳 Stripe payments

## If You Find Another `/revampit` Directory:
**Delete it.** There should only be one project directory: `/home/g/dev/revampit`

---
Last updated: 2026-02-12
