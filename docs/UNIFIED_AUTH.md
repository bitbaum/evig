# RevampIT Unified Authentication System

**Created:** 2025-12-02  
**Last Modified:** 2025-12-02  
**Last Modified Summary:** Complete implementation of unified auth - registration, login, dashboard, profile management all working

---

## Overview

The RevampIT unified authentication system provides a single account for all user interactions:

- 🛒 **Shop purchases** (via Medusa integration)
- 📚 **Workshop registration & management**
- 🔧 **Service appointment booking**
- 💝 **Donation tracking**
- 🤝 **Volunteer/intern applications**
- 📧 **Newsletter preferences**

## Architecture

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Auth Framework** | Auth.js v5 (NextAuth) |
| **Database** | PostgreSQL (existing, port 5433) |
| **Database Adapter** | @auth/pg-adapter |
| **Password Hashing** | bcrypt (12 rounds) |
| **Session Strategy** | Database sessions |

### Why Auth.js v5?

- ✅ **Self-hosted** – No external services, data stays in your database
- ✅ **Native Next.js integration** – Designed for App Router
- ✅ **PostgreSQL adapter** – Uses existing database infrastructure
- ✅ **Proven at scale** – Powers thousands of production apps
- ✅ **Flexible providers** – Start with email/password, add OAuth later

## Database Schema

### Core Auth Tables

```sql
-- Central user accounts
users (id, email, name, password_hash, role, email_verified, ...)

-- Active sessions (database strategy)
sessions (session_token, user_id, expires)

-- OAuth provider links (future use)
accounts (provider, provider_account_id, user_id, ...)

-- Email verification & password reset
verification_tokens (identifier, token, expires)
```

### Application Tables

```sql
-- Extended profile data (Swiss address format)
user_profiles (user_id, first_name, last_name, address, canton, ...)

-- Workshop management
workshops (slug, title, category, level, ...)
workshop_instances (workshop_id, start_date, location, ...)
workshop_registrations (user_id, instance_id, status, ...)

-- Service appointments
service_types (slug, name, duration_minutes, price_cents, ...)
service_appointments (user_id, service_type_id, status, ...)

-- Donations & support
donations (user_id, amount_cents, payment_method, ...)

-- Volunteer/intern applications
applications (user_id, type, status, motivation, ...)

-- Newsletter (for users and non-users)
newsletter_subscriptions (email, user_id, topics[], ...)

-- Medusa shop integration
medusa_customer_links (user_id, medusa_customer_id)
```

## File Structure

```
src/
├── auth.ts                          # Main Auth.js configuration
├── middleware.ts                    # Route protection
│
├── lib/auth/
│   ├── db.ts                        # Database client & queries
│   └── password.ts                  # Password hashing utilities
│
├── components/auth/
│   ├── LoginForm.tsx                # Login form component
│   ├── RegisterForm.tsx             # Registration form
│   ├── SessionProvider.tsx          # Session context provider
│   └── UserMenu.tsx                 # Header user menu dropdown
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # Auth.js API routes
│   │   │   └── register/route.ts       # Registration API
│   │   └── user/
│   │       └── profile/route.ts        # Profile management API
│   │
│   ├── auth/
│   │   ├── login/page.tsx           # Login page
│   │   └── register/page.tsx        # Registration page
│   │
│   └── dashboard/
│       ├── page.tsx                 # Dashboard home
│       └── profile/page.tsx         # Profile editor
│
└── scripts/db/
    ├── migrations/
    │   └── 001-unified-auth.sql     # Database migration
    └── run-migration.sh             # Migration runner script
```

## Setup Guide

### 1. Environment Variables

Add to your `.env.local`:

```bash
# Auth.js Configuration
AUTH_SECRET=your-random-secret-at-least-32-characters

# Database (uses existing settings, or override)
AUTH_DB_HOST=localhost
AUTH_DB_PORT=5433
AUTH_DB_NAME=revampit_cms
AUTH_DB_USER=postgres
AUTH_DB_PASSWORD=your-password
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 2. Run Database Migration

```bash
# Start PostgreSQL if not running
docker compose up -d

# Run the migration
./scripts/db/run-migration.sh
```

### 3. Test the Auth System

```bash
# Start the development server
npm run dev

# Open the login page
open http://localhost:3000/auth/login

# Or register a new account
open http://localhost:3000/auth/register
```

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin` | GET/POST | Sign in (Auth.js handled) |
| `/api/auth/signout` | POST | Sign out |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/register` | POST | Register new user |

### User Profile

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/profile` | GET | Get current user's profile |
| `/api/user/profile` | PUT | Update profile |

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Session Security
- Database sessions (not JWT) for revocability
- 30-day session lifetime
- Secure, HttpOnly cookies
- CSRF protection built-in

### Protected Routes
- `/dashboard/*` - Requires authentication
- `/admin/*` - Requires admin token (separate system)

## User Roles

| Role | Description |
|------|-------------|
| `user` | Regular customer/visitor |
| `supporter` | Donor, volunteer, or partner |
| `admin` | Full administrative access |

## Medusa Integration

When a user makes their first shop purchase, the system:

1. Checks if a Medusa customer exists with the same email
2. If not, creates a new Medusa customer
3. Links the accounts via `medusa_customer_links` table
4. Future: Sync order history to user dashboard

## Future Enhancements

### Planned Features
- [ ] Magic link / passwordless login
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] OAuth providers (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Account deletion / GDPR compliance

### Workshop System
- [ ] Workshop calendar with availability
- [ ] Online registration with payment (if applicable)
- [ ] Waiting list management
- [ ] Reminder emails
- [ ] Attendance tracking
- [ ] Feedback collection

### Service Appointments
- [ ] Time slot booking
- [ ] Appointment reminders
- [ ] Status updates via email
- [ ] Quote generation

## Troubleshooting

### Common Issues

**"Database connection failed"**
- Ensure PostgreSQL container is running: `docker compose ps`
- Check database credentials in `.env.local`
- Verify port 5433 is accessible

**"AUTH_SECRET is missing"**
- Add `AUTH_SECRET` to `.env.local`
- Generate with: `openssl rand -base64 32`

**"Session not persisting"**
- Clear browser cookies
- Check if sessions table exists in database
- Verify NEXTAUTH_URL is set correctly

### Database Reset

To reset the auth tables (WARNING: deletes all user data):

```sql
DROP TABLE IF EXISTS medusa_customer_links CASCADE;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS service_appointments CASCADE;
DROP TABLE IF EXISTS service_types CASCADE;
DROP TABLE IF EXISTS workshop_registrations CASCADE;
DROP TABLE IF EXISTS workshop_instances CASCADE;
DROP TABLE IF EXISTS workshops CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then re-run the migration.

## Support

For issues with the authentication system:
1. Check this documentation
2. Review Auth.js docs: https://authjs.dev
3. Check the console for error messages
4. Review database connection settings

---

**End of Documentation**

