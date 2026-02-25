# 🔄 Handoff Document: RevampIT Unified Authentication

**Created:** 2025-12-02  
**Purpose:** Context for continuing development in a new chat session

---

## 📋 Quick Summary

A **complete self-hosted unified authentication system** has been implemented for RevampIT using Auth.js v5 with PostgreSQL. Users can now:

- ✅ Register with email/password
- ✅ Login and maintain sessions (JWT)
- ✅ Access a personal dashboard
- ✅ Edit their profile (Swiss address format)
- ✅ See the user menu in the site header

## 🚦 Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Database | ✅ Running | PostgreSQL on port 5433 |
| Auth System | ✅ Working | Auth.js v5 with JWT sessions |
| Registration | ✅ Working | `/auth/register` |
| Login | ✅ Working | `/auth/login` |
| Dashboard | ✅ Working | `/dashboard` |
| Profile Editor | ✅ Working | `/dashboard/profile` |
| Header Menu | ✅ Working | UserMenu dropdown |
| Workshop Registration | ❌ Not started | Next priority |
| Service Appointments | ❌ Not started | Next priority |

## 🔧 To Start Working

### 1. Verify Services

```bash
cd /home/g/dev/revampit

# Check PostgreSQL is running
docker ps | grep revampit_db
# Should show: revampit_db ... Up ... 0.0.0.0:5433->5432/tcp

# Start if not running
docker compose -f docker-compose.yml up -d
```

### 2. Start Development Server

```bash
# The 'd' alias runs full stack
d

# OR manually
npm run dev:full
```

**Note:** The server runs on port **3001** if port 3000 is already in use.

### 3. Test Authentication

- **Register:** http://localhost:3001/auth/register
- **Login:** http://localhost:3001/auth/login  
- **Dashboard:** http://localhost:3001/dashboard

**Test Credentials:**
- Email: `test@revamp-it.ch`
- Password: `TestPass123`

## 📁 Key Files to Know

### Auth Configuration
- `src/auth.ts` - Main Auth.js config (secret, providers, callbacks)
- `src/lib/auth/db.ts` - Database queries for users/profiles
- `src/lib/auth/password.ts` - bcrypt password hashing

### UI Components
- `src/components/auth/LoginForm.tsx` - Login form
- `src/components/auth/RegisterForm.tsx` - Registration form
- `src/components/auth/UserMenu.tsx` - Header dropdown
- `src/components/auth/SessionProvider.tsx` - Session context

### Pages
- `src/app/auth/login/page.tsx` - Login page
- `src/app/auth/register/page.tsx` - Registration page
- `src/app/dashboard/page.tsx` - Dashboard home
- `src/app/dashboard/profile/page.tsx` - Profile editor

### API Routes
- `src/app/api/auth/[...nextauth]/route.ts` - Auth.js handlers
- `src/app/api/auth/register/route.ts` - Registration endpoint
- `src/app/api/user/profile/route.ts` - Profile GET/PUT

### Database
- `scripts/db/migrations/001-unified-auth.sql` - Main schema
- `scripts/db/migrations/002-fix-auth-columns.sql` - Column fix

## 🎯 Next Priority Tasks

### 1. Workshop Registration (High Priority)

**Goal:** Allow users to register for workshops from the workshops page

**Files to modify/create:**
- `src/app/workshops/page.tsx` - Add "Anmelden" button to WorkshopCard
- `src/app/api/workshops/register/route.ts` - Registration endpoint
- `src/app/dashboard/workshops/page.tsx` - Show user's registrations
- `src/lib/auth/db.ts` - Add workshop query functions

**Database tables ready:**
- `workshops` - 6 workshops seeded
- `workshop_instances` - For specific dates
- `workshop_registrations` - User signups

### 2. Service Appointment Booking (High Priority)

**Goal:** Allow users to book service appointments

**Files to create:**
- `src/app/api/appointments/route.ts` - Booking endpoint
- `src/app/dashboard/appointments/page.tsx` - User's appointments
- Service page booking UI

**Database tables ready:**
- `service_types` - 6 services seeded
- `service_appointments` - Booking records

### 3. Email Verification (Medium Priority)

**Goal:** Verify user email addresses

**Resources available:**
- `nodemailer` already in package.json
- `verification_tokens` table ready

## 📊 Database Schema Overview

```sql
-- Auth tables (Auth.js managed)
users (id, name, email, password_hash, role, "emailVerified", "createdAt", "updatedAt")
sessions ("sessionToken", "userId", expires)
accounts (id, "userId", provider, "providerAccountId", ...)
verification_tokens (identifier, token, expires)

-- Extended profile
user_profiles (user_id, first_name, last_name, phone, address, canton, country, ...)

-- Workshops
workshops (id, slug, title, category, level, max_participants, price_cents, ...)
workshop_instances (id, workshop_id, start_date, location, status, ...)
workshop_registrations (id, user_id, workshop_instance_id, status, ...)

-- Services
service_types (id, slug, name, duration_minutes, price_cents, ...)
service_appointments (id, user_id, service_type_id, status, ...)

-- Support
donations (id, user_id, amount_cents, payment_method, ...)
applications (id, user_id, type, status, motivation, ...)
newsletter_subscriptions (id, email, user_id, topics[], ...)

-- Shop integration (customer data stored in users table)
```

## 🔐 Environment Variables

Required in `.env.local`:

```bash
AUTH_SECRET=<generated-secret>
DB_HOST=localhost
DB_PORT=5433
DB_NAME=revampit_cms
DB_USER=postgres
DB_PASSWORD=postgres
```

## 📚 Full Documentation

- `docs/UNIFIED_AUTH.md` - Complete setup guide
- `docs/UNIFIED_AUTH_STATUS.md` - Implementation details
- `docs/SHARED_CONTEXT.md` - Overall project status

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "MissingSecret" error | Add `AUTH_SECRET` to `.env.local`, restart server |
| Port 3000 in use | App runs on port 3001 instead |
| Database connection failed | Start PostgreSQL: `docker compose up -d` |
| Session not persisting | Clear browser cookies, check AUTH_SECRET |

## 💡 Code Patterns

### Get Current User (Server Component)

```tsx
import { auth } from '@/auth'

export default async function Page() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  // Use session.user.id, session.user.email, etc.
}
```

### Get Current User (Client Component)

```tsx
'use client'
import { useSession } from 'next-auth/react'

export function Component() {
  const { data: session, status } = useSession()
  if (status === 'loading') return <Loading />
  // Use session?.user
}
```

### Add Database Query

```typescript
// In src/lib/auth/db.ts
export async function getWorkshopRegistrations(userId: string) {
  return query(
    `SELECT * FROM workshop_registrations WHERE user_id = $1`,
    [userId]
  )
}
```

---

**Ready to continue?** Start with the workshop registration system - the database is ready, you just need to build the UI and API endpoints!





