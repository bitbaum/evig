# Dev Guide Compliance Audit - 2026-01-05

**Created:** 2026-01-05  
**Last Modified:** 2026-01-05  
**Last Modified Summary:** Comprehensive audit of DRY, SSOT, and best practices violations

---

## Executive Summary

**Status:** 🟡 **PARTIAL COMPLIANCE** - Significant violations found

While substantial progress has been made (see `docs/development/DRY_SSOT_FIXES.md`), several critical violations remain that need immediate attention.

---

## Critical Violations Found

### 1. 🔴 CRITICAL: Hardcoded Table Names in Core Database Module

**File:** `src/lib/auth/db.ts`  
**Violation:** SSOT - Table names hardcoded instead of using `TABLE_NAMES` config  
**Dev Guide Reference:** Section "Common Anti-Patterns" - "Magic Strings"

**Impact:**
- Core database module violates SSOT principle
- 26+ hardcoded table names found
- Makes schema refactoring difficult
- Inconsistent with rest of codebase

**Examples:**
```typescript
// ❌ VIOLATION: Hardcoded table names
'SELECT * FROM users WHERE email = $1'
'SELECT * FROM workshops WHERE slug = $1'
'SELECT * FROM service_types WHERE slug = $1'
'SELECT * FROM verification_tokens WHERE token = $1'
'SELECT * FROM user_profiles WHERE user_id = $1'
'SELECT * FROM workshop_registrations wr'
'SELECT * FROM user_roles WHERE slug = $1'
```

**Should be:**
```typescript
// ✅ CORRECT: Use TABLE_NAMES config
import { TABLE_NAMES } from '@/config/database'
`SELECT * FROM ${TABLE_NAMES.USERS} WHERE email = $1`
`SELECT * FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1`
```

**Affected Functions:**
- `getUserByEmail()` - Line 172
- `getUserById()` - Line 183
- `createUser()` - Line 254
- `updateUser()` - Line 328
- `getOrCreateProfile()` - Line 340
- `getWorkshopBySlug()` - Line 457
- `getServiceTypeBySlug()` - Line 551
- `createVerificationToken()` - Line 609
- `verifyEmailWithToken()` - Lines 625, 638, 644
- `getUserRoleById()` - Line 833
- And 15+ more...

**Priority:** 🔴 **HIGHEST** - Core module, affects entire codebase

---

### 2. 🟡 HIGH: Hardcoded localhost URLs

**Violation:** SSOT - URLs hardcoded instead of config constants  
**Dev Guide Reference:** Section "SSOT" - "Each piece of data/config should be defined in exactly one place"

**Files Affected:**
1. `src/config/cms.ts` - Line 9: `'http://localhost:3001'`
3. `src/auth.ts` - Line 322: `'http://localhost:3000'`
4. `src/app/api/auth/verify-email/route.ts` - Line 24: `'http://localhost:3000'`
5. `src/app/api/auth/forgot-password/route.ts` - Line 35: `'http://localhost:3001'`

**Impact:**
- URLs scattered across codebase
- Difficult to change for different environments
- No single source of truth
- Production URLs might be hardcoded incorrectly

**Solution:**
Create `src/config/urls.ts`:
```typescript
export const URLS = {
  APP_BASE: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  CMS_API: process.env.CMS_API_URL || 'http://localhost:3001',
} as const
```

**Priority:** 🟡 **HIGH** - Affects deployment and environment configuration

---

### 3. 🟡 HIGH: console.log Instead of Logger

**Violation:** Code Quality - Using console.log instead of logger utility  
**Dev Guide Reference:** Section "Code Quality Standards" - "No console.log in production"

**Files Affected:**
1. `src/auth.ts` - Lines 42, 118, 211, 284, 311, 315, 325, 327, 341
2. `src/middleware/auth.ts` - Line 61
3. `src/middleware/admin.ts` - Line 96
4. `src/app/api/auth/login-status/route.ts` - Line 58

**Impact:**
- Inconsistent logging
- No structured logging in production
- Difficult to filter/search logs
- Violates dev guide standards

**Solution:**
Replace all `console.log/error/warn` with:
```typescript
import { logger } from '@/lib/logger'
logger.info('Message', { context })
logger.error('Error', { error, context })
```

**Priority:** 🟡 **HIGH** - Code quality and maintainability

---

### 4. 🟢 MEDIUM: Missing Table Names in TABLE_NAMES Config

**Violation:** SSOT - Some tables used but not in config  
**Files:** `src/lib/auth/db.ts`

**Missing Tables:**
- `user_roles` - Used in multiple queries
- `role_permissions` - Used in permission queries
- `permissions` - Used in permission queries
- `customer_preferences` - Used in preference queries
- `customer_segments` - Used in segment queries
- `user_segments` - Used in segment queries

**Impact:**
- Cannot use TABLE_NAMES for these tables
- Forces hardcoded names
- Incomplete SSOT

**Priority:** 🟢 **MEDIUM** - Completeness issue

---

### 5. 🟢 MEDIUM: Hardcoded Role Names

**Violation:** SSOT - Role names hardcoded  
**Files:** Multiple API routes

**Example:**
```typescript
// ❌ Hardcoded role check
if (user.role === 'seller') { ... }
if (user.role === 'repairer') { ... }
```

**Should be:**
```typescript
// ✅ Use ROLES constant
import { ROLES } from '@/lib/constants'
if (user.role === ROLES.SELLER) { ... }
```

**Priority:** 🟢 **MEDIUM** - Consistency issue

---

## Compliance Status by Category

### ✅ COMPLIANT Areas

1. **Error Messages** - ✅ Centralized in `src/config/error-messages.ts`
2. **API Response Helpers** - ✅ Standardized in `src/lib/api/helpers.ts`
3. **Role Check Helpers** - ✅ Reusable functions in `src/lib/api/role-checks.ts`
4. **Many API Routes** - ✅ Use TABLE_NAMES and helpers (see DRY_SSOT_FIXES.md)

### 🟡 PARTIAL Compliance

1. **Table Names** - ✅ Config exists, ❌ Core db.ts doesn't use it
2. **URLs** - ❌ Hardcoded in multiple places
3. **Logging** - ✅ Logger exists, ❌ console.log still used

### ❌ NON-COMPLIANT Areas

1. **Core Database Module** - ❌ Hardcoded table names throughout
2. **Admin Components** - ❌ Hardcoded localhost URLs
3. **Auth Module** - ❌ console.log statements

---

## Fix Priority

### Phase 1: Critical (Immediate)
1. ✅ Fix hardcoded table names in `src/lib/auth/db.ts`
2. ✅ Create URL config constants
3. ✅ Replace console.log with logger

### Phase 2: High Priority (This Week)
4. ✅ Replace hardcoded URLs with config
5. ✅ Add missing tables to TABLE_NAMES
6. ✅ Audit remaining API routes

### Phase 3: Medium Priority (Next Sprint)
7. ✅ Replace hardcoded role names
8. ✅ Extract duplicate validation logic
9. ✅ Create query builder helpers

---

## Estimated Impact

**Lines of Code to Fix:**
- `src/lib/auth/db.ts`: ~26 table name replacements
- URL replacements: ~9 files
- console.log replacements: ~12 instances
- **Total:** ~47 violations to fix

**Time Estimate:**
- Phase 1: 2-3 hours
- Phase 2: 3-4 hours
- Phase 3: 4-5 hours
- **Total:** ~10-12 hours

---

## Next Steps

1. **Create URL config** (`src/config/urls.ts`)
2. **Refactor `src/lib/auth/db.ts`** to use TABLE_NAMES
3. **Replace all console.log** with logger
4. **Update admin components** to use URL config
5. **Add missing tables** to TABLE_NAMES config
6. **Test all changes** to ensure no regressions

---

## References

- Dev Guide: `docs/development/DEV_GUIDE.md`
- Previous Fixes: `docs/development/DRY_SSOT_FIXES.md`
- Codebase Audit: `docs/development/CODEBASE_AUDIT.md`
