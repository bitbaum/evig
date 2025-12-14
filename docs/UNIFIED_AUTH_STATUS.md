# RevampIT Unified Authentication - Implementation Status

**created_date:** 2025-12-02  
**last_modified_date:** 2025-12-10  
**last_modified_summary:** Password reset tokens aligned with verification storage; user registration now adapts to current schema

---

## 🎯 Project Overview

A self-hosted unified authentication system for RevampIT that provides a single account for:
- Shop purchases (Medusa integration)
- Workshop registration
- Service appointment booking
- Donation tracking
- Volunteer/intern applications
- Newsletter preferences

## ✅ Implementation Status

### Completed Features

| Feature | File(s) | Status |
|---------|---------|--------|
| Auth.js v5 Configuration | `src/auth.ts` | ✅ Complete |
| PostgreSQL Database | `scripts/db/migrations/*.sql` | ✅ Complete |
| User Registration | `src/app/auth/register/page.tsx` | ✅ Complete |
| User Login | `src/app/auth/login/page.tsx` | ✅ Complete |
| JWT Sessions | Configured in `auth.ts` | ✅ Complete |
| Password Hashing (bcrypt) | `src/lib/auth/password.ts` | ✅ Complete |
| Database Queries | `src/lib/auth/db.ts` | ✅ Complete |
| Password Reset Flow | `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/auth/reset-password/page.tsx` | ✅ Complete |
| User Dashboard | `src/app/dashboard/page.tsx` | ✅ Complete |
| Profile Editor | `src/app/dashboard/profile/page.tsx` | ✅ Complete |
| Header User Menu | `src/components/auth/UserMenu.tsx` | ✅ Complete |
| Route Protection | `src/middleware.ts` | ✅ Complete |
| Session Provider | `src/components/auth/SessionProvider.tsx` | ✅ Complete |
| API Routes | `src/app/api/auth/*`, `src/app/api/user/*` | ✅ Complete |
| Documentation | `docs/UNIFIED_AUTH.md` | ✅ Complete |

### Pending Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Workshop Registration | High | Add registration buttons to workshop cards |
| Service Appointments | High | Build appointment booking UI |
| Email Verification | Medium | Send verification emails on signup |
| Medusa Customer Sync | Medium | Link shop customers to unified accounts |
| OAuth Providers | Low | Google, GitHub login options |

## 🏗️ Architecture

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Auth Library:** Auth.js v5 (next-auth@beta)
- **Database:** PostgreSQL 15 (port 5433)
- **Database Adapter:** @auth/pg-adapter
- **Password Hashing:** bcrypt (12 rounds)
- **Session Strategy:** JWT

### Database Schema

```
PostgreSQL (localhost:5433, database: revampit_cms)
├── users                    # Core auth accounts (Auth.js managed)
├── sessions                 # Active sessions (not used with JWT)
├── accounts                 # OAuth provider links (future)
├── verification_tokens      # Email verification + password reset tokens
├── user_profiles           # Extended user data (Swiss format)
├── workshops               # Workshop definitions (6 seeded)
├── workshop_instances      # Scheduled workshop sessions
├── workshop_registrations  # User workshop signups
├── service_types           # Service catalog (6 seeded)
├── service_appointments    # User service bookings
├── donations               # Donation records
├── applications            # Volunteer/intern applications
├── newsletter_subscriptions # Email preferences
└── medusa_customer_links   # Shop customer mapping
```

### File Structure

```
src/
├── auth.ts                              # Main Auth.js configuration
│
├── lib/auth/
│   ├── db.ts                            # Database client & user queries
│   └── password.ts                      # Password hashing utilities
│
├── components/auth/
│   ├── LoginForm.tsx                    # Login form with validation
│   ├── RegisterForm.tsx                 # Registration with password strength
│   ├── SessionProvider.tsx              # NextAuth SessionProvider wrapper
│   └── UserMenu.tsx                     # Header dropdown for logged-in users
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts   # Auth.js API handlers
│   │   │   └── register/route.ts        # User registration endpoint
│   │   └── user/
│   │       └── profile/route.ts         # Profile GET/PUT API
│   │
│   ├── auth/
│   │   ├── login/page.tsx               # Login page
│   │   └── register/page.tsx            # Registration page
│   │
│   └── dashboard/
│       ├── page.tsx                     # Dashboard home
│       └── profile/page.tsx             # Profile editor
│
├── middleware.ts                        # Route protection (/dashboard/*)
│
└── components/
    ├── layout/Header.tsx                # Modified to include UserMenu
    └── providers/providers.tsx          # Modified to include SessionProvider

scripts/db/
├── migrations/
│   ├── 001-unified-auth.sql             # Main schema migration
│   └── 002-fix-auth-columns.sql         # Auth.js column name fix
└── run-migration.sh                     # Migration runner script

docs/
├── UNIFIED_AUTH.md                      # Complete setup guide
└── UNIFIED_AUTH_STATUS.md               # This file
```

## 🔧 Configuration

### Environment Variables

Required in `.env.local`:

```bash
# Auth.js Secret (REQUIRED)
AUTH_SECRET=your-secret-here  # Generate with: openssl rand -base64 32

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=revampit_cms
DB_USER=postgres
DB_PASSWORD=postgres
```

### Running Services

```bash
# Start PostgreSQL
docker compose -f docker-compose.yml up -d

# Verify database is running
docker ps | grep revampit_db

# Run migrations (if not already done)
./scripts/db/run-migration.sh

# Start development server
npm run dev  # or 'd' alias
```

## 📊 Database State

### Tables Created (14 total)

All tables verified working:
- `users` - Auth accounts with camelCase columns for Auth.js
- `sessions` - Session storage (using JWT instead)
- `accounts` - OAuth providers (ready for future use)
- `verification_tokens` - Email verification
- `user_profiles` - Extended Swiss-format profiles
- `workshops` - 6 workshops seeded
- `workshop_instances` - For scheduling
- `workshop_registrations` - User signups
- `service_types` - 6 services seeded
- `service_appointments` - Booking records
- `donations` - Donation tracking
- `applications` - Volunteer applications
- `newsletter_subscriptions` - Email preferences
- `medusa_customer_links` - Shop integration

### Seeded Data

**Workshops (6):**
- linux-workshop
- open-source-software
- computer-repair
- bitcoin-blockchain
- ai-workshop
- creative-coding

**Service Types (6):**
- computer-repair
- linux-installation
- data-recovery
- hardware-upgrade
- consultation
- custom-build

### Test User

```
Email: test@revamp-it.ch
Password: TestPass123
Role: user
Created: 2025-12-02
```

## 🚀 Quick Start for New Chat

### To Continue Development

1. **Read this file** and `docs/UNIFIED_AUTH.md` for context

2. **Verify system is running:**
   ```bash
   # Check database
   docker ps | grep revampit_db
   
   # Check dev server (should be on port 3001 if 3000 is taken)
   curl -s http://localhost:3001/api/auth/session
   ```

3. **Test authentication:**
   - Login: http://localhost:3001/auth/login
   - Register: http://localhost:3001/auth/register
   - Dashboard: http://localhost:3001/dashboard

### Priority Next Tasks

1. **Workshop Registration System**
   - Add "Anmelden" button to `src/app/workshops/page.tsx`
   - Create registration API at `src/app/api/workshops/register/route.ts`
   - Show user registrations in `src/app/dashboard/workshops/page.tsx`

2. **Service Appointment Booking**
   - Add booking flow to service pages
   - Create appointment API at `src/app/api/appointments/route.ts`
   - Show appointments in `src/app/dashboard/appointments/page.tsx`

3. **Email Verification**
   - Use existing nodemailer setup
   - Send verification email on registration
   - Create verification page at `src/app/auth/verify-email/page.tsx`

## 🐛 Known Issues & Solutions

### Issue: "MissingSecret" Error
**Solution:** Ensure `AUTH_SECRET` is in `.env.local` and restart dev server

### Issue: "UnsupportedStrategy" Error
**Solution:** Credentials provider requires `strategy: 'jwt'` (already configured)

### Issue: Database column errors
**Solution:** Run `002-fix-auth-columns.sql` migration (Auth.js expects camelCase)

### Issue: Port 3000 in use
**Solution:** RevampIT runs on port 3001 when 3000 is taken by another project

## 📝 Code Patterns

### Adding Protected Routes

```tsx
// In middleware.ts, add to matcher:
export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/new-protected-route/:path*'],
}
```

### Getting Current User in Server Components

```tsx
import { auth } from '@/auth'

export default async function MyPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/login')
  }
  
  return <div>Hello {session.user.name}</div>
}
```

### Getting Current User in Client Components

```tsx
'use client'
import { useSession } from 'next-auth/react'

export function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <Loading />
  if (!session) return <NotLoggedIn />
  
  return <div>Hello {session.user.name}</div>
}
```

### Creating Database Queries

```typescript
// In src/lib/auth/db.ts
export async function getWorkshopRegistrations(userId: string) {
  const result = await query(
    `SELECT wr.*, wi.start_date, w.title 
     FROM workshop_registrations wr
     JOIN workshop_instances wi ON wr.workshop_instance_id = wi.id
     JOIN workshops w ON wi.workshop_id = w.id
     WHERE wr.user_id = $1
     ORDER BY wi.start_date DESC`,
    [userId]
  )
  return result.rows
}
```

## 🔗 Related Documentation

- `docs/UNIFIED_AUTH.md` - Detailed setup guide
- `docs/REVAMPIT_SHOP_STATUS.md` - Shop integration status
- `docs/REVAMPIT_SHOP_SETUP.md` - RevampIT e-commerce setup

---

**End of Status Document**

*This document should be updated when major changes are made to the auth system.*





