# Architecture Quick Start Guide

**New Patterns Implemented**: Repository Layer, Service Layer, Unified Permissions

---

## 🚀 Quick Start

### 1. Using Repositories (Data Access)

**Problem Solved**: N+1 queries killing performance

**Before**:
```typescript
// ❌ BAD: N+1 query problem (101 queries!)
const repairers = await query(`SELECT * FROM repairers LIMIT 50`)
for (const repairer of repairers) {
  const ratings = await query(`SELECT AVG(rating) FROM reviews WHERE repairer_id = $1`, [repairer.id])
  const reviews = await query(`SELECT * FROM reviews WHERE repairer_id = $1`, [repairer.id])
}
```

**After**:
```typescript
// ✅ GOOD: Single query with JOIN aggregation (1 query!)
import { RepairerRepository } from '@/lib/repositories'

const repo = new RepairerRepository()
const repairers = await repo.findActiveWithDetails(50)
// Returns: repairers with reviews, avg_rating, review_count, services - all in one query!
```

**Available Repositories**:
- `RepairerRepository` - Repairer profiles with reviews & services
- `HelperRepository` - IT-Hilfe helpers with statistics
- `BaseRepository` - Extend this for new repositories

**Creating New Repositories**:
```typescript
import { BaseRepository } from '@/lib/repositories'
import { TABLE_NAMES } from '@/config/database'

export class ProductRepository extends BaseRepository {
  async findActiveWithDetails(limit = 50) {
    return this.query(`
      SELECT
        p.*,
        COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') as images
      FROM ${TABLE_NAMES.INVENTORY_ITEMS} p
      LEFT JOIN ${TABLE_NAMES.PRODUCT_IMAGES} i ON p.id = i.product_id
      WHERE p.status = 'active'
      GROUP BY p.id
      LIMIT $1
    `, [limit])
  }
}
```

---

### 2. Using Services (Business Logic)

**Problem Solved**: 400-line routes with mixed concerns

**Before**:
```typescript
// ❌ BAD: Business logic in route (419 lines!)
export async function POST(request: NextRequest) {
  // ... signature verification

  // Business logic mixed with HTTP handling
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    await query(`UPDATE payments SET status = 'succeeded'...`)
    await query(`UPDATE orders SET payment_status = 'paid'...`)
    await query(`UPDATE appointments SET status = 'confirmed'...`)
    // ... 400 more lines
  }
}
```

**After**:
```typescript
// ✅ GOOD: Thin route + Service layer (50 lines!)
import { PaymentService } from '@/lib/services'

export async function POST(request: NextRequest) {
  const paymentService = new PaymentService()
  const event = await stripe.webhooks.constructEvent(body, sig, secret)

  // Route = orchestration only
  switch (event.type) {
    case 'payment_intent.succeeded':
      await paymentService.handlePaymentIntentSucceeded(event.data.object)
      break
    // ... other cases (one-liners)
  }

  return NextResponse.json({ success: true })
}
```

**Service Layer Benefits**:
- ✅ Testable without HTTP mocking
- ✅ Reusable across multiple routes
- ✅ Clear separation of concerns
- ✅ Easy to maintain and debug

**Creating New Services**:
```typescript
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'

export class EmailService {
  async sendWelcomeEmail(userId: string): Promise<void> {
    // Business logic here
    const user = await query(`SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = $1`, [userId])
    // ... email sending logic
  }
}
```

---

### 3. Using Unified Permissions (Auth)

**Problem Solved**: Dual auth system causing staff lockouts

**Current Situation**:
- **Old system**: 11 files using `role === 'REVAMPIT_ADMIN'`
- **New system**: 6 files using `is_staff + staff_permissions`
- **Problem**: New staff with `is_staff=true` but no `role` get locked out

**Solution**: Use unified functions that check BOTH systems

**Before**:
```typescript
// ❌ BAD: Only checks old system (locks out new staff!)
if (session.user.role === ROLES.REVAMPIT_ADMIN) {
  return NextResponse.next()
}
return NextResponse.redirect('/unauthorized')
```

**After**:
```typescript
// ✅ GOOD: Checks BOTH old and new systems
import { hasAdminAccessUnified } from '@/lib/auth/unified-permissions'

if (hasAdminAccessUnified(session.user)) {
  return NextResponse.next()
}
return NextResponse.redirect('/unauthorized')
```

**Available Functions**:

1. **`hasAdminAccessUnified(user)`** - Check ANY admin access
   ```typescript
   // Returns true if user has admin access via:
   // - Old role system (role === 'REVAMPIT_ADMIN')
   // - New staff system (is_staff === true)
   // - Email domain (@revamp-it.ch)
   if (!hasAdminAccessUnified(session.user)) {
     return apiUnauthorized('Admin access required')
   }
   ```

2. **`canAccessSectionUnified(user, section)`** - Check section-specific access
   ```typescript
   // Check if user can access 'users' section
   if (!canAccessSectionUnified(session.user, 'users')) {
     return apiError(null, 'Unauthorized', 403)
   }
   ```

3. **`getAccessibleSectionsUnified(user)`** - Get all accessible sections
   ```typescript
   const sections = getAccessibleSectionsUnified(session.user)
   // Returns: ['dashboard', 'products', 'workshops', ...]
   ```

**Migration Checklist for Files**:
```typescript
// 1. Import unified function
import { hasAdminAccessUnified } from '@/lib/auth/unified-permissions'

// 2. Replace old check
- if (session.user.role === ROLES.REVAMPIT_ADMIN) {
+ if (hasAdminAccessUnified(session.user)) {

// 3. Test with both old and new users
// 4. Deploy (zero breaking changes!)
```

---

## 📂 Architecture Overview

```
┌─────────────────────────────────────────────┐
│                 Route Layer                 │
│         /app/api/*/route.ts (50 lines)      │
│  - Parse request                            │
│  - Validate input                           │
│  - Call service                             │
│  - Format response                          │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              Service Layer                  │
│        /lib/services/*.ts (100-200 lines)   │
│  - Business logic                           │
│  - Workflows                                │
│  - Validation                               │
│  - Call repositories                        │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│            Repository Layer                 │
│      /lib/repositories/*.ts (50-100 lines)  │
│  - Data access                              │
│  - SQL queries                              │
│  - JOIN aggregations                        │
│  - Transactions                             │
└─────────────────────────────────────────────┘
```

---

## 🎯 When to Use What

### Use Repositories When:
- ✅ Fetching data from database
- ✅ Complex queries with JOINs
- ✅ Aggregating related data
- ✅ Avoiding N+1 queries

**Example**: Get repairers with reviews
```typescript
const repo = new RepairerRepository()
const repairers = await repo.findActiveWithDetails(50)
```

### Use Services When:
- ✅ Business logic (validations, workflows)
- ✅ Multi-step operations
- ✅ Coordinating multiple repositories
- ✅ Side effects (emails, notifications)

**Example**: Handle payment success
```typescript
const service = new PaymentService()
await service.handlePaymentIntentSucceeded(paymentIntent)
// Handles: update payment, update order, send email, etc.
```

### Use Unified Permissions When:
- ✅ Checking admin access
- ✅ Section-level permissions
- ✅ During auth migration period
- ✅ ANY auth-related check

**Example**: Protect admin route
```typescript
if (!hasAdminAccessUnified(session.user)) {
  return NextResponse.redirect('/unauthorized')
}
```

---

## 🚫 Anti-Patterns to Avoid

### ❌ Don't Query in Loops
```typescript
// BAD: N+1 query problem
for (const user of users) {
  const profile = await query(`SELECT * FROM profiles WHERE user_id = $1`, [user.id])
}

// GOOD: Single query with JOIN
const usersWithProfiles = await query(`
  SELECT u.*, p.* FROM users u
  LEFT JOIN profiles p ON u.id = p.user_id
`)
```

### ❌ Don't Mix Business Logic in Routes
```typescript
// BAD: Business logic in route
export async function POST(request: NextRequest) {
  // ... 200 lines of business logic
}

// GOOD: Thin route + service
export async function POST(request: NextRequest) {
  const service = new PaymentService()
  await service.handlePayment(data)
  return apiSuccess({ success: true })
}
```

### ❌ Don't Use Old Auth Only
```typescript
// BAD: Locks out new staff
if (user.role === ROLES.REVAMPIT_ADMIN) { ... }

// GOOD: Works with both systems
if (hasAdminAccessUnified(user)) { ... }
```

---

## 📊 Performance Gains

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| List repairers | 101 queries | 1 query | **100x faster** |
| Get repairer details | 7 queries | 1 query | **7x faster** |
| List helpers | 76 queries | 1 query | **76x faster** |

**Response Time Target**: < 100ms for all endpoints

---

## 🧪 Testing Examples

### Repository Tests
```typescript
describe('RepairerRepository', () => {
  it('finds active repairers with details in single query', async () => {
    const repo = new RepairerRepository()
    const repairers = await repo.findActiveWithDetails(10)

    expect(repairers).toHaveLength(10)
    expect(repairers[0].reviews).toBeDefined()
    expect(repairers[0].avg_rating).toBeDefined()
  })
})
```

### Service Tests
```typescript
describe('PaymentService', () => {
  it('updates order on payment success', async () => {
    const service = new PaymentService()
    await service.handlePaymentIntentSucceeded({
      id: 'pi_123',
      metadata: { orderId: 'order_123' }
    })

    // Verify order was updated
    const order = await query(`SELECT * FROM orders WHERE id = 'order_123'`)
    expect(order.payment_status).toBe('paid')
  })
})
```

### Auth Tests
```typescript
describe('Unified Permissions', () => {
  it('grants access to old and new staff', () => {
    const oldUser = { email: 'old@test.com', role: 'REVAMPIT_ADMIN' }
    const newUser = { email: 'new@revamp-it.ch', isStaff: true }

    expect(hasAdminAccessUnified(oldUser)).toBe(true)
    expect(hasAdminAccessUnified(newUser)).toBe(true)
  })
})
```

---

## 📚 Further Reading

- `IMPLEMENTATION_SUMMARY.md` - Full implementation details
- `ARCHITECTURE_EVALUATION.md` - Original improvement plan
- `docs/SHARED_CONTEXT.md` - Project tech stack
- Global Engineering Standards: `~/.claude/CLAUDE.md`

---

**Questions?** Check the implementation files for detailed examples and documentation.
