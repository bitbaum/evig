# Database & Backend Architecture - RevampIT

**Created:** 2026-01-05  
**Last Modified:** 2026-01-05  
**Last Modified Summary:** Comprehensive explanation of database and backend architecture

---

## Overview

RevampIT uses a **PostgreSQL-based unified backend** with **Next.js API routes** serving as the backend layer. The architecture follows a **serverless-first approach** where API routes handle all backend logic, connecting directly to PostgreSQL databases.

---

## 🗄️ Database Architecture

### Database Setup

The project uses **two separate PostgreSQL databases**:

1. **Main Database** (`revampit_db` - Port 5433)
   - User authentication & profiles
   - Workshops & registrations
   - Service appointments
   - Inventory & marketplace listings
   - Messaging system
   - Blog & content

2. **Medusa Database** (`revampit_medusa_db` - Port 5435)
   - E-commerce products
   - Orders & carts
   - Customer data (linked to main DB)
   - Inventory sync

### Database Connection

**Connection Pool Pattern:**
```typescript
// src/lib/auth/db.ts
- Uses PostgreSQL connection pooling (max 20 connections)
- Singleton pattern for pool management
- Automatic connection retry and error handling
- Graceful degradation when DB is unavailable
```

**Configuration:**
- **Host:** `localhost` (or `DB_HOST` env var)
- **Port:** `5433` (main) / `5435` (Medusa)
- **Pool Size:** 20 concurrent connections
- **Timeout:** 5 seconds connection timeout
- **Idle Timeout:** 30 seconds

---

## 🔌 Backend Architecture

### Next.js API Routes (Serverless Backend)

The backend is **entirely built using Next.js API Routes** - no separate backend server:

```
src/app/api/
├── auth/              # Authentication endpoints
│   ├── register/      # POST /api/auth/register
│   ├── login-status/  # POST /api/auth/login-status
│   └── verify-email/ # GET /api/auth/verify-email
├── workshops/         # Workshop management
│   └── route.ts       # GET /api/workshops
├── appointments/      # Service appointments
├── shop/              # E-commerce (Medusa integration)
└── user/              # User profile management
```

### Request Flow

```
User Request
    ↓
Next.js Middleware (src/middleware.ts)
    ↓
API Route Handler (src/app/api/*/route.ts)
    ↓
Database Query Functions (src/lib/auth/db.ts)
    ↓
PostgreSQL Database
    ↓
Response to User
```

### Example: User Registration Flow

```typescript
// 1. User submits form → POST /api/auth/register
// src/app/api/auth/register/route.ts

export async function POST(request: Request) {
  // 2. Parse request body
  const { email, password, name } = await request.json()
  
  // 3. Call registration function
  const result = await registerUser({ email, password, name })
  
  // 4. Return response
  return apiSuccess({ message: 'Konto erstellt', user: result.user })
}

// 5. registerUser() calls database functions
// src/lib/auth/db.ts → createUser()
// 6. Database query executes
// 7. User record created in PostgreSQL
```

---

## 🔐 Authentication System

### Auth.js v5 (NextAuth)

**Session Strategy:** JWT (JSON Web Tokens stored in cookies)

**How it works:**
1. User logs in → Credentials validated against `users` table
2. Session token created → Stored in HTTP-only cookie
3. Middleware checks cookie → Protects routes
4. API routes verify session → `await auth()` from `@/auth`

**Database Tables:**
- `users` - User accounts
- `sessions` - Active sessions (if using database strategy)
- `verification_tokens` - Email verification & password reset tokens
- `user_profiles` - Extended user profile data

**Password Security:**
- **Hashing:** bcrypt with 12 salt rounds (OWASP recommended)
- **Validation:** 12+ characters, uppercase, lowercase, numbers, special chars
- **Storage:** Never stored in plain text, only `password_hash` in database

---

## 📊 Database Schema Overview

### Core Tables

**Users & Authentication:**
```sql
users
├── id (UUID)
├── email (unique)
├── password_hash (bcrypt)
├── name
├── role (user, admin, seller, repairer)
├── email_verified
└── medusa_customer_id (links to Medusa)

user_profiles
├── user_id (FK → users)
├── first_name, last_name
├── address, city, canton, postal_code
├── phone, mobile
└── preferences (JSON)
```

**Workshops:**
```sql
workshops
├── id, slug, title
├── category, level, duration
└── price_cents

workshop_instances
├── id, workshop_id (FK)
├── start_date, location
└── max_participants

workshop_registrations
├── id, user_id (FK), instance_id (FK)
├── status, payment_status
└── payment_amount_cents
```

**Services:**
```sql
service_types
├── id, slug, name
├── duration_minutes, price_cents
└── requires_approval

service_appointments
├── id, user_id (FK), service_type_id (FK)
├── preferred_date, confirmed_date
├── status, urgency
└── price_charged_cents
```

**Inventory & Marketplace:**
```sql
inventory_items
├── id, kivitendo_article_number
├── quantity_available, selling_price_chf
└── medusa_product_id (FK → Medusa)

ai_extracted_products
├── id, inventory_item_id (FK)
├── product_name, brand, category
└── sustainability_scores (JSON)

marketplace_listings
├── id, user_id (FK)
├── product_data (JSON)
└── status (draft, published, sold)
```

---

## 🔄 Database Query Pattern

### Standard Query Function

```typescript
// src/lib/auth/db.ts

export async function query<T = unknown>(
  text: string,
  params?: QueryParams
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool()
  const result = await pool.query(text, params)
  return {
    rows: result.rows as T[],
    rowCount: result.rowCount || 0
  }
}
```

### Example Usage

```typescript
// Get user by email
const user = await getUserByEmail('user@example.com')

// Create workshop registration
await query(
  'INSERT INTO workshop_registrations (user_id, instance_id, status) VALUES ($1, $2, $3)',
  [userId, instanceId, 'confirmed']
)

// Get user's workshops
const workshops = await getUserWorkshopRegistrations(userId)
```

### Error Handling

```typescript
// Graceful degradation on connection errors
try {
  const result = await query('SELECT * FROM users')
} catch (error) {
  if (error.message.includes('connect')) {
    // Return user-friendly error instead of crashing
    return { error: 'Database temporarily unavailable' }
  }
  throw error
}
```

---

## 🛒 E-Commerce Integration (Medusa)

### Separate Database

Medusa runs its own PostgreSQL database (`revampit_medusa_db`) with:
- Products, variants, collections
- Orders, carts, payments
- Customer records (linked via `medusa_customer_id`)

### Integration Pattern

```typescript
// 1. User registers in main DB
const user = await createUser({ email, password })

// 2. Create customer in Medusa
const medusaCustomer = await medusaClient.customers.create({
  email: user.email,
  // ...
})

// 3. Link accounts
await updateUser(user.id, { 
  medusa_customer_id: medusaCustomer.id 
})
```

### API Proxy Routes

```typescript
// src/app/api/shop/products/route.ts
// Proxies requests to Medusa backend

export async function GET() {
  const medusa = getMedusaClient()
  const products = await medusa.products.list()
  return Response.json({ products })
}
```

---

## 🔒 Security Features

### Database Security

1. **Parameterized Queries:** All queries use `$1, $2` placeholders (prevents SQL injection)
2. **Connection Pooling:** Limits concurrent connections
3. **Error Handling:** Doesn't expose database errors to users
4. **Password Hashing:** bcrypt with 12 rounds

### API Security

1. **Session Validation:** All protected routes check `await auth()`
2. **Rate Limiting:** Built into Auth.js (configurable)
3. **CORS:** Configured per route
4. **Input Validation:** All inputs validated before database queries

---

## 📡 API Response Pattern

### Standardized Responses

```typescript
// src/lib/api/helpers.ts

// Success response
apiSuccess({ data: {...}, message: 'Success' })
// → { success: true, data: {...}, message: 'Success' }

// Error response
apiError(error, 'User-friendly message', 500)
// → { success: false, error: 'User-friendly message' }

// Bad request
apiBadRequest('Validation failed', ['field1', 'field2'])
// → { success: false, error: 'Validation failed', errors: [...] }
```

---

## 🚀 Deployment Architecture

### Local Development

```
Docker Compose
├── PostgreSQL (port 5433) - Main DB
├── PostgreSQL (port 5435) - Medusa DB
├── Redis (port 6380) - Medusa cache
└── Meilisearch (port 7700) - Product search

Next.js Dev Server (port 3000)
└── API Routes → Database connections
```

### Production (Vercel)

```
Vercel Serverless Functions
├── Each API route = separate serverless function
├── Connects to managed PostgreSQL (via env vars)
└── Auto-scales based on traffic

Database (Production)
├── Managed PostgreSQL (e.g., Supabase, Neon, AWS RDS)
└── Connection pooling via connection string
```

---

## 🔍 Monitoring & Health Checks

### Health Check Endpoints

```typescript
// src/app/api/health/auth-db/route.ts
GET /api/health/auth-db
// Checks database connectivity and returns diagnostics
```

### Logging

```typescript
// src/lib/logger.ts
logger.info('User registered', { userId, email })
logger.error('Database error', { error, query })
```

---

## 📝 Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/auth/db.ts` | Database connection pool & query functions |
| `src/config/database.ts` | Database configuration & table names |
| `src/auth.ts` | Auth.js configuration & session management |
| `src/app/api/**/route.ts` | API route handlers (backend endpoints) |
| `src/middleware.ts` | Route protection & session validation |
| `docker-compose.yml` | Local database setup |
| `scripts/db/migrations/*.sql` | Database schema migrations |

---

## 🎯 Summary

**Backend = Next.js API Routes** (no separate server)
- Each `/api/*` route is a serverless function
- Connects directly to PostgreSQL via connection pool
- Handles authentication, business logic, and data access

**Database = PostgreSQL** (two databases)
- Main DB: Users, workshops, services, content
- Medusa DB: E-commerce products & orders
- Linked via `medusa_customer_id` foreign key

**Architecture Benefits:**
- ✅ Serverless (scales automatically)
- ✅ Type-safe (TypeScript throughout)
- ✅ Secure (parameterized queries, session validation)
- ✅ Maintainable (centralized database functions)
- ✅ Fast (connection pooling, optimized queries)
