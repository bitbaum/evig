# RevampIT API Documentation

This document describes all API endpoints available in the RevampIT platform.
Auto-generated from source code analysis.

## Overview

Total endpoints: 116
Categories: admin, ai, appointments, auth, blog, debug, health, invoices, locations, marketplace, medusa, messages, newsletter, payments, peer-repairs, repairer, repairers, reviews, seller, shop, suggestions, uploads, user, workshops

## Authentication

Most API endpoints use session-based authentication via Auth.js:
- `auth()` - Get current session
- Returns 401 if authentication required but not provided
- Staff endpoints require `@revamp-it.ch` email

## Endpoints by Category

### Admin

#### `GET, POST /api/admin/auth`

API endpoint at /api/admin/auth

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/auth/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/admin/certifications`

API endpoint at /api/admin/certifications

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/certifications/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `PUT /api/admin/certifications/[id]/reject`

API endpoint at /api/admin/certifications/[id]/reject

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/certifications/[id]/reject/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `PUT /api/admin/certifications/[id]/verify`

API endpoint at /api/admin/certifications/[id]/verify

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/certifications/[id]/verify/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `GET /api/admin/documents`

API endpoint at /api/admin/documents

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/documents/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `PUT /api/admin/documents/[id]/approve`

API endpoint at /api/admin/documents/[id]/approve

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/documents/[id]/approve/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `PUT /api/admin/documents/[id]/reject`

API endpoint at /api/admin/documents/[id]/reject

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/documents/[id]/reject/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `POST /api/admin/erfassung`

Erfassung API - Product intake and registration POST /api/admin/erfassung Creates a new product in the inventory system

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/erfassung/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/admin/hirn/chat`

API: Hirn Chat POST /api/admin/hirn/chat Send a message and get an AI response with RAG context.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hirn/chat/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET, DELETE /api/admin/hirn/documents`

API: Hirn Documents GET /api/admin/hirn/documents List all indexed documents. DELETE /api/admin/hirn/documents?id=xxx Delete a document and its chunks.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hirn/documents/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function DELETE(request: NextRequest) {...
```

</details>

#### `GET, DELETE /api/admin/hirn/history`

API: Hirn Chat History GET /api/admin/hirn/history?sessionId=xxx Get chat history for a session. GET /api/admin/hirn/history Get all sessions for the current user. DELETE /api/admin/hirn/history?sessionId=xxx Delete a chat session.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hirn/history/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function DELETE(request: NextRequest) {...
```

</details>

#### `GET, PATCH /api/admin/hirn/providers`

API: Hirn AI Providers GET /api/admin/hirn/providers List available AI providers and their status. PATCH /api/admin/hirn/providers Update provider settings (set default, enable/disable).

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hirn/providers/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function PATCH(request: NextRequest) {...
```

</details>

#### `GET /api/admin/inventory`

Inventory Products List API GET /api/admin/inventory Lists all products from the ai_extracted_products table with inventory data

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/inventory/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/admin/inventory/[id]`

Inventory Product Detail API GET /api/admin/inventory/[id] Fetches detailed inventory product information including customer profiles Used by the factsheet/label template

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/inventory/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `POST /api/admin/login`

API endpoint at /api/admin/login

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/login/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/admin/logout`

API endpoint at /api/admin/logout

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/logout/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET, POST /api/admin/pages`

API endpoint at /api/admin/pages

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/pages/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

#### `GET, PUT /api/admin/pages/[id]`

API endpoint at /api/admin/pages/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/pages/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `GET /api/admin/payments/dashboard`

API endpoint at /api/admin/payments/dashboard

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/payments/dashboard/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `POST /api/admin/permissions/request`

API: Staff Permission Request POST /api/admin/permissions/request Allows staff to request access to admin sections they don't have.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/permissions/request/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/admin/permissions/requests`

API: List Permission Requests GET /api/admin/permissions/requests Super admins can see all pending permission requests.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/permissions/requests/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `POST /api/admin/permissions/requests/[id]`

API: Approve/Reject Permission Request POST /api/admin/permissions/requests/[id] Super admins can approve or reject permission requests.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/permissions/requests/[id]/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest, context: RequestContext) {...
```

</details>

#### `GET, POST /api/admin/products`

API endpoint at /api/admin/products

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/products/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/admin/profile`

API endpoint at /api/admin/profile

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/profile/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/admin/refunds`

API endpoint at /api/admin/refunds

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/refunds/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET, PUT /api/admin/refunds/[id]`

API endpoint at /api/admin/refunds/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/refunds/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `GET /api/admin/repairer-applications`

API endpoint at /api/admin/repairer-applications

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/repairer-applications/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `PUT /api/admin/repairer-applications/[id]/approve`

API endpoint at /api/admin/repairer-applications/[id]/approve

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/repairer-applications/[id]/approve/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `PUT /api/admin/repairer-applications/[id]/reject`

API endpoint at /api/admin/repairer-applications/[id]/reject

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/repairer-applications/[id]/reject/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `PUT /api/admin/repairer-applications/[id]/request-changes`

API endpoint at /api/admin/repairer-applications/[id]/request-changes

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/repairer-applications/[id]/request-changes/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `POST /api/admin/repairers/[id]/recalculate-ratings`

API endpoint at /api/admin/repairers/[id]/recalculate-ratings

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/repairers/[id]/recalculate-ratings/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `PUT /api/admin/reviews/[id]/moderate`

API endpoint at /api/admin/reviews/[id]/moderate

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/reviews/[id]/moderate/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `GET /api/admin/reviews/analytics`

API endpoint at /api/admin/reviews/analytics

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/reviews/analytics/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/admin/tax-reports`

API endpoint at /api/admin/tax-reports

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/tax-reports/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `PATCH /api/admin/users/[id]/permissions`

API: Manage User Permissions PATCH /api/admin/users/[id]/permissions Super admins can update staff permissions and super admin status.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/users/[id]/permissions/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PATCH(request: NextRequest, context: RequestContext) {...
```

</details>

#### `GET, POST /api/admin/workshops/[workshopId]/materials`

API endpoint at /api/admin/workshops/[workshopId]/materials

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/[workshopId]/materials/route.ts` |
| Auth | Authenticated users |
| Params | `workshopId` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workshopId: string }> }...

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workshopId: string }> }...
```

</details>

#### `GET, POST /api/admin/workshops/instances`

API endpoint at /api/admin/workshops/instances

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/instances/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

#### `GET, PUT, DELETE /api/admin/workshops/instances/[id]`

API endpoint at /api/admin/workshops/instances/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/instances/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `GET /api/admin/workshops/list`

API endpoint at /api/admin/workshops/list

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/list/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `PUT, DELETE /api/admin/workshops/materials/[id]`

API endpoint at /api/admin/workshops/materials/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/materials/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `GET /api/admin/workshops/proposals`

API endpoint at /api/admin/workshops/proposals

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/proposals/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `POST /api/admin/workshops/proposals/[id]/approve`

API endpoint at /api/admin/workshops/proposals/[id]/approve

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/proposals/[id]/approve/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `PUT /api/admin/workshops/registrations/[id]`

API endpoint at /api/admin/workshops/registrations/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/registrations/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `POST /api/admin/workshops/send-feedback-requests`

API endpoint at /api/admin/workshops/send-feedback-requests

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/send-feedback-requests/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/admin/workshops/send-reminders`

API endpoint at /api/admin/workshops/send-reminders

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/send-reminders/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Ai

#### `POST /api/ai/analyze-product`

API endpoint at /api/ai/analyze-product

| Property | Value |
|----------|-------|
| File | `src/app/api/ai/analyze-product/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Appointments

#### `POST /api/appointments/[id]/pay`

API endpoint at /api/appointments/[id]/pay

| Property | Value |
|----------|-------|
| File | `src/app/api/appointments/[id]/pay/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/appointments/book-with-payment`

API endpoint at /api/appointments/book-with-payment

| Property | Value |
|----------|-------|
| File | `src/app/api/appointments/book-with-payment/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Auth

#### `POST /api/auth/forgot-password`

Forgot Password API POST /api/auth/forgot-password

| Property | Value |
|----------|-------|
| File | `src/app/api/auth/forgot-password/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/auth/login-status`

API endpoint at /api/auth/login-status

| Property | Value |
|----------|-------|
| File | `src/app/api/auth/login-status/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(req: NextRequest) {...
```

</details>

#### `POST /api/auth/register`

User Registration API POST /api/auth/register Includes rate limiting to prevent abuse

| Property | Value |
|----------|-------|
| File | `src/app/api/auth/register/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/auth/resend-code`

Resend Verification Code API POST /api/auth/resend-code Generates a new 6-digit verification code and sends it via email

| Property | Value |
|----------|-------|
| File | `src/app/api/auth/resend-code/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/auth/reset-password`

Reset Password API POST /api/auth/reset-password

| Property | Value |
|----------|-------|
| File | `src/app/api/auth/reset-password/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/auth/verify-code`

Email Verification Code API POST /api/auth/verify-code Verifies a 6-digit email verification code

| Property | Value |
|----------|-------|
| File | `src/app/api/auth/verify-code/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET, POST /api/auth/verify-email`

API endpoint at /api/auth/verify-email

| Property | Value |
|----------|-------|
| File | `src/app/api/auth/verify-email/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

### Blog

#### `GET, POST /api/blog/submit`

API endpoint at /api/blog/submit

| Property | Value |
|----------|-------|
| File | `src/app/api/blog/submit/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

### Debug

#### `GET /api/debug/db-config`

API endpoint at /api/debug/db-config

| Property | Value |
|----------|-------|
| File | `src/app/api/debug/db-config/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...
```

</details>

### Health

#### `GET /api/health`

API endpoint at /api/health

| Property | Value |
|----------|-------|
| File | `src/app/api/health/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...
```

</details>

#### `GET /api/health/auth-db`

API endpoint at /api/health/auth-db

| Property | Value |
|----------|-------|
| File | `src/app/api/health/auth-db/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...
```

</details>

### Invoices

#### `GET, POST /api/invoices`

API endpoint at /api/invoices

| Property | Value |
|----------|-------|
| File | `src/app/api/invoices/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

#### `GET, PUT, DELETE /api/invoices/[id]`

API endpoint at /api/invoices/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/invoices/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `GET, POST /api/invoices/[id]/pdf`

API endpoint at /api/invoices/[id]/pdf

| Property | Value |
|----------|-------|
| File | `src/app/api/invoices/[id]/pdf/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

### Locations

#### `GET, POST /api/locations`

API endpoint at /api/locations

| Property | Value |
|----------|-------|
| File | `src/app/api/locations/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

#### `GET, PUT, DELETE /api/locations/[id]`

API endpoint at /api/locations/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/locations/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `POST /api/locations/[id]/approve`

API endpoint at /api/locations/[id]/approve

| Property | Value |
|----------|-------|
| File | `src/app/api/locations/[id]/approve/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `GET, POST /api/locations/[id]/bookings`

API endpoint at /api/locations/[id]/bookings

| Property | Value |
|----------|-------|
| File | `src/app/api/locations/[id]/bookings/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

### Marketplace

#### `GET, POST /api/marketplace/products`

Marketplace Products API GET /api/marketplace/products - Get all published marketplace products POST /api/marketplace/products - Create new marketplace product (requires auth)

| Property | Value |
|----------|-------|
| File | `src/app/api/marketplace/products/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

### Medusa

#### `GET, POST, DELETE /api/medusa/mock`

Mock Medusa API for development Provides basic product and cart functionality

| Property | Value |
|----------|-------|
| File | `src/app/api/medusa/mock/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...

export async function DELETE(request: NextRequest) {...
```

</details>

### Messages

#### `GET, POST /api/messages/conversations`

API endpoint at /api/messages/conversations

| Property | Value |
|----------|-------|
| File | `src/app/api/messages/conversations/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

### Newsletter

#### `GET /api/newsletter/confirm`

API endpoint at /api/newsletter/confirm

| Property | Value |
|----------|-------|
| File | `src/app/api/newsletter/confirm/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `POST /api/newsletter/subscribe`

API endpoint at /api/newsletter/subscribe

| Property | Value |
|----------|-------|
| File | `src/app/api/newsletter/subscribe/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Payments

#### `GET, POST /api/payments/escrow/[id]`

API endpoint at /api/payments/escrow/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/payments/escrow/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `POST /api/payments/refund`

API endpoint at /api/payments/refund

| Property | Value |
|----------|-------|
| File | `src/app/api/payments/refund/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/payments/webhook`

API endpoint at /api/payments/webhook

| Property | Value |
|----------|-------|
| File | `src/app/api/payments/webhook/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Peer-repairs

#### `GET /api/peer-repairs/my-offers`

GET /api/peer-repairs/my-offers Get current user's submitted offers

| Property | Value |
|----------|-------|
| File | `src/app/api/peer-repairs/my-offers/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/peer-repairs/my-requests`

GET /api/peer-repairs/my-requests Get current user's repair requests

| Property | Value |
|----------|-------|
| File | `src/app/api/peer-repairs/my-requests/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET, POST /api/peer-repairs/requests`

GET /api/peer-repairs/requests Browse peer repair requests with filters (public)

| Property | Value |
|----------|-------|
| File | `src/app/api/peer-repairs/requests/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

#### `GET, PUT /api/peer-repairs/requests/[id]`

GET /api/peer-repairs/requests/[id] Get request details (public)

| Property | Value |
|----------|-------|
| File | `src/app/api/peer-repairs/requests/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, { params }: RouteParams) {...

export async function PUT(request: NextRequest, { params }: RouteParams) {...
```

</details>

#### `GET, POST /api/peer-repairs/requests/[id]/offers`

GET /api/peer-repairs/requests/[id]/offers Get offers for a request (owner only)

| Property | Value |
|----------|-------|
| File | `src/app/api/peer-repairs/requests/[id]/offers/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, { params }: RouteParams) {...

export async function POST(request: NextRequest, { params }: RouteParams) {...
```

</details>

#### `POST /api/peer-repairs/requests/[id]/offers/[offerId]/accept`

POST /api/peer-repairs/requests/[id]/offers/[offerId]/accept Accept an offer (request owner only)

| Property | Value |
|----------|-------|
| File | `src/app/api/peer-repairs/requests/[id]/offers/[offerId]/accept/route.ts` |
| Auth | Authenticated users |
| Params | `id`, `offerId` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest, { params }: RouteParams) {...
```

</details>

### Repairer

#### `POST /api/repairer/apply`

API endpoint at /api/repairer/apply

| Property | Value |
|----------|-------|
| File | `src/app/api/repairer/apply/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/repairer/dashboard`

Repairer Dashboard API GET /api/repairer/dashboard - Get repairer dashboard stats and bookings

| Property | Value |
|----------|-------|
| File | `src/app/api/repairer/dashboard/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

### Repairers

#### `GET /api/repairers`

API endpoint at /api/repairers

| Property | Value |
|----------|-------|
| File | `src/app/api/repairers/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/repairers/[id]`

API endpoint at /api/repairers/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/repairers/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `GET /api/repairers/[id]/availability`

API endpoint at /api/repairers/[id]/availability

| Property | Value |
|----------|-------|
| File | `src/app/api/repairers/[id]/availability/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `GET /api/repairers/[id]/ratings`

API endpoint at /api/repairers/[id]/ratings

| Property | Value |
|----------|-------|
| File | `src/app/api/repairers/[id]/ratings/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

### Reviews

#### `GET, POST /api/reviews`

API endpoint at /api/reviews

| Property | Value |
|----------|-------|
| File | `src/app/api/reviews/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

#### `GET, PUT, DELETE /api/reviews/[id]`

API endpoint at /api/reviews/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/reviews/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `POST, PUT, DELETE /api/reviews/[id]/response`

API endpoint at /api/reviews/[id]/response

| Property | Value |
|----------|-------|
| File | `src/app/api/reviews/[id]/response/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `POST /api/reviews/[id]/vote`

API endpoint at /api/reviews/[id]/vote

| Property | Value |
|----------|-------|
| File | `src/app/api/reviews/[id]/vote/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

### Seller

#### `POST /api/seller/apply`

API endpoint at /api/seller/apply

| Property | Value |
|----------|-------|
| File | `src/app/api/seller/apply/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/seller/dashboard`

Seller Dashboard API GET /api/seller/dashboard - Get seller dashboard stats and products

| Property | Value |
|----------|-------|
| File | `src/app/api/seller/dashboard/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `POST /api/seller/products`

API endpoint at /api/seller/products

| Property | Value |
|----------|-------|
| File | `src/app/api/seller/products/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Shop

#### `POST /api/shop/cart`

POST /api/shop/cart Create a new cart

| Property | Value |
|----------|-------|
| File | `src/app/api/shop/cart/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/shop/cart/[cartId]`

GET /api/shop/cart/[cartId] Retrieve a cart by ID

| Property | Value |
|----------|-------|
| File | `src/app/api/shop/cart/[cartId]/route.ts` |
| Auth | None |
| Params | `cartId` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }...
```

</details>

#### `POST /api/shop/cart/[cartId]/line-items`

POST /api/shop/cart/[cartId]/line-items Add item to cart

| Property | Value |
|----------|-------|
| File | `src/app/api/shop/cart/[cartId]/line-items/route.ts` |
| Auth | None |
| Params | `cartId` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }...
```

</details>

#### `POST, DELETE /api/shop/cart/[cartId]/line-items/[lineId]`

POST /api/shop/cart/[cartId]/line-items/[lineId] Update line item quantity

| Property | Value |
|----------|-------|
| File | `src/app/api/shop/cart/[cartId]/line-items/[lineId]/route.ts` |
| Auth | None |
| Params | `cartId`, `lineId` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string; lineId: string }> }...

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string; lineId: string }> }...
```

</details>

#### `GET /api/shop/health`

API endpoint at /api/shop/health

| Property | Value |
|----------|-------|
| File | `src/app/api/shop/health/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...
```

</details>

#### `GET /api/shop/inventory`

Public Shop Inventory API GET /api/shop/inventory Returns published inventory products for the public shop

| Property | Value |
|----------|-------|
| File | `src/app/api/shop/inventory/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/shop/inventory/[id]`

Public Shop Inventory Product Detail API GET /api/shop/inventory/[id] Returns a single published inventory product for the public shop

| Property | Value |
|----------|-------|
| File | `src/app/api/shop/inventory/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

#### `POST /api/shop/orders`

API endpoint at /api/shop/orders

| Property | Value |
|----------|-------|
| File | `src/app/api/shop/orders/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/shop/products`

GET /api/shop/products Proxy to Medusa store products API to avoid CORS issues

| Property | Value |
|----------|-------|
| File | `src/app/api/shop/products/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/shop/regions`

GET /api/shop/regions Fetch available regions from Medusa

| Property | Value |
|----------|-------|
| File | `src/app/api/shop/regions/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...
```

</details>

### Suggestions

#### `POST /api/suggestions`

API endpoint at /api/suggestions

| Property | Value |
|----------|-------|
| File | `src/app/api/suggestions/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: Request) {...
```

</details>

### Uploads

#### `POST /api/uploads`

API endpoint at /api/uploads

| Property | Value |
|----------|-------|
| File | `src/app/api/uploads/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(req: NextRequest) {...
```

</details>

### User

#### `GET /api/user/reviews`

API endpoint at /api/user/reviews

| Property | Value |
|----------|-------|
| File | `src/app/api/user/reviews/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/user/workshop-registrations`

API endpoint at /api/user/workshop-registrations

| Property | Value |
|----------|-------|
| File | `src/app/api/user/workshop-registrations/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

### Workshops

#### `GET /api/workshops`

API endpoint at /api/workshops

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/workshops/[slug]/instances`

API endpoint at /api/workshops/[slug]/instances

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/[slug]/instances/route.ts` |
| Auth | None |
| Params | `slug` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }...
```

</details>

#### `GET /api/workshops/[slug]/materials`

API endpoint at /api/workshops/[slug]/materials

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/[slug]/materials/route.ts` |
| Auth | Authenticated users |
| Params | `slug` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }...
```

</details>

#### `POST /api/workshops/[slug]/register-with-payment`

API endpoint at /api/workshops/[slug]/register-with-payment

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/[slug]/register-with-payment/route.ts` |
| Auth | Authenticated users |
| Params | `slug` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/workshops/[slug]/reviews`

API endpoint at /api/workshops/[slug]/reviews

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/[slug]/reviews/route.ts` |
| Auth | None |
| Params | `slug` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }...
```

</details>

#### `POST /api/workshops/propose`

API endpoint at /api/workshops/propose

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/propose/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/workshops/register`

API endpoint at /api/workshops/register

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/register/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/workshops/registration/[instanceId]`

API endpoint at /api/workshops/registration/[instanceId]

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/registration/[instanceId]/route.ts` |
| Auth | Authenticated users |
| Params | `instanceId` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }...
```

</details>

#### `PATCH /api/workshops/registrations/[id]`

API endpoint at /api/workshops/registrations/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/registrations/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }...
```

</details>

## Quick Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/admin/auth` | None | API endpoint at /api/admin/auth |
| GET | `/api/admin/certifications` | Authenticated users | API endpoint at /api/admin/certifications |
| PUT | `/api/admin/certifications/[id]/reject` | Authenticated users | API endpoint at /api/admin/certifications/[id]/rej... |
| PUT | `/api/admin/certifications/[id]/verify` | Authenticated users | API endpoint at /api/admin/certifications/[id]/ver... |
| GET | `/api/admin/documents` | Authenticated users | API endpoint at /api/admin/documents |
| PUT | `/api/admin/documents/[id]/approve` | Authenticated users | API endpoint at /api/admin/documents/[id]/approve |
| PUT | `/api/admin/documents/[id]/reject` | Authenticated users | API endpoint at /api/admin/documents/[id]/reject |
| POST | `/api/admin/erfassung` | Authenticated users | Erfassung API - Product intake and registration PO... |
| POST | `/api/admin/hirn/chat` | Super admin only | API: Hirn Chat POST /api/admin/hirn/chat Send a me... |
| GET/DELETE | `/api/admin/hirn/documents` | Super admin only | API: Hirn Documents GET /api/admin/hirn/documents ... |
| GET/DELETE | `/api/admin/hirn/history` | Super admin only | API: Hirn Chat History GET /api/admin/hirn/history... |
| GET/PATCH | `/api/admin/hirn/providers` | Super admin only | API: Hirn AI Providers GET /api/admin/hirn/provide... |
| GET | `/api/admin/inventory` | Authenticated users | Inventory Products List API GET /api/admin/invento... |
| GET | `/api/admin/inventory/[id]` | Authenticated users | Inventory Product Detail API GET /api/admin/invent... |
| POST | `/api/admin/login` | None | API endpoint at /api/admin/login |
| POST | `/api/admin/logout` | None | API endpoint at /api/admin/logout |
| GET/POST | `/api/admin/pages` | None | API endpoint at /api/admin/pages |
| GET/PUT | `/api/admin/pages/[id]` | None | API endpoint at /api/admin/pages/[id] |
| GET | `/api/admin/payments/dashboard` | Authenticated users | API endpoint at /api/admin/payments/dashboard |
| POST | `/api/admin/permissions/request` | Staff only | API: Staff Permission Request POST /api/admin/perm... |
| GET | `/api/admin/permissions/requests` | Super admin only | API: List Permission Requests GET /api/admin/permi... |
| POST | `/api/admin/permissions/requests/[id]` | Super admin only | API: Approve/Reject Permission Request POST /api/a... |
| GET/POST | `/api/admin/products` | None | API endpoint at /api/admin/products |
| GET | `/api/admin/profile` | None | API endpoint at /api/admin/profile |
| GET | `/api/admin/refunds` | Authenticated users | API endpoint at /api/admin/refunds |
| GET/PUT | `/api/admin/refunds/[id]` | Authenticated users | API endpoint at /api/admin/refunds/[id] |
| GET | `/api/admin/repairer-applications` | Authenticated users | API endpoint at /api/admin/repairer-applications |
| PUT | `/api/admin/repairer-applications/[id]/approve` | Authenticated users | API endpoint at /api/admin/repairer-applications/[... |
| PUT | `/api/admin/repairer-applications/[id]/reject` | Authenticated users | API endpoint at /api/admin/repairer-applications/[... |
| PUT | `/api/admin/repairer-applications/[id]/request-changes` | Authenticated users | API endpoint at /api/admin/repairer-applications/[... |
| POST | `/api/admin/repairers/[id]/recalculate-ratings` | Authenticated users | API endpoint at /api/admin/repairers/[id]/recalcul... |
| PUT | `/api/admin/reviews/[id]/moderate` | Authenticated users | API endpoint at /api/admin/reviews/[id]/moderate |
| GET | `/api/admin/reviews/analytics` | Authenticated users | API endpoint at /api/admin/reviews/analytics |
| GET | `/api/admin/tax-reports` | Authenticated users | API endpoint at /api/admin/tax-reports |
| PATCH | `/api/admin/users/[id]/permissions` | Super admin only | API: Manage User Permissions PATCH /api/admin/user... |
| GET/POST | `/api/admin/workshops/[workshopId]/materials` | Authenticated users | API endpoint at /api/admin/workshops/[workshopId]/... |
| GET/POST | `/api/admin/workshops/instances` | Authenticated users | API endpoint at /api/admin/workshops/instances |
| GET/PUT/DELETE | `/api/admin/workshops/instances/[id]` | Authenticated users | API endpoint at /api/admin/workshops/instances/[id... |
| GET | `/api/admin/workshops/list` | Authenticated users | API endpoint at /api/admin/workshops/list |
| PUT/DELETE | `/api/admin/workshops/materials/[id]` | Authenticated users | API endpoint at /api/admin/workshops/materials/[id... |
| GET | `/api/admin/workshops/proposals` | Authenticated users | API endpoint at /api/admin/workshops/proposals |
| POST | `/api/admin/workshops/proposals/[id]/approve` | Authenticated users | API endpoint at /api/admin/workshops/proposals/[id... |
| PUT | `/api/admin/workshops/registrations/[id]` | Authenticated users | API endpoint at /api/admin/workshops/registrations... |
| POST | `/api/admin/workshops/send-feedback-requests` | Authenticated users | API endpoint at /api/admin/workshops/send-feedback... |
| POST | `/api/admin/workshops/send-reminders` | Authenticated users | API endpoint at /api/admin/workshops/send-reminder... |
| POST | `/api/ai/analyze-product` | None | API endpoint at /api/ai/analyze-product |
| POST | `/api/appointments/[id]/pay` | Authenticated users | API endpoint at /api/appointments/[id]/pay |
| POST | `/api/appointments/book-with-payment` | Authenticated users | API endpoint at /api/appointments/book-with-paymen... |
| POST | `/api/auth/forgot-password` | None | Forgot Password API POST /api/auth/forgot-password |
| POST | `/api/auth/login-status` | None | API endpoint at /api/auth/login-status |
| POST | `/api/auth/register` | None | User Registration API POST /api/auth/register Incl... |
| POST | `/api/auth/resend-code` | None | Resend Verification Code API POST /api/auth/resend... |
| POST | `/api/auth/reset-password` | None | Reset Password API POST /api/auth/reset-password |
| POST | `/api/auth/verify-code` | None | Email Verification Code API POST /api/auth/verify-... |
| GET/POST | `/api/auth/verify-email` | None | API endpoint at /api/auth/verify-email |
| GET/POST | `/api/blog/submit` | Authenticated users | API endpoint at /api/blog/submit |
| GET | `/api/debug/db-config` | None | API endpoint at /api/debug/db-config |
| GET | `/api/health` | None | API endpoint at /api/health |
| GET | `/api/health/auth-db` | None | API endpoint at /api/health/auth-db |
| GET/POST | `/api/invoices` | Authenticated users | API endpoint at /api/invoices |
| GET/PUT/DELETE | `/api/invoices/[id]` | Authenticated users | API endpoint at /api/invoices/[id] |
| GET/POST | `/api/invoices/[id]/pdf` | Authenticated users | API endpoint at /api/invoices/[id]/pdf |
| GET/POST | `/api/locations` | Authenticated users | API endpoint at /api/locations |
| GET/PUT/DELETE | `/api/locations/[id]` | Authenticated users | API endpoint at /api/locations/[id] |
| POST | `/api/locations/[id]/approve` | Authenticated users | API endpoint at /api/locations/[id]/approve |
| GET/POST | `/api/locations/[id]/bookings` | Authenticated users | API endpoint at /api/locations/[id]/bookings |
| GET/POST | `/api/marketplace/products` | None | Marketplace Products API GET /api/marketplace/prod... |
| GET/POST/DELETE | `/api/medusa/mock` | None | Mock Medusa API for development Provides basic pro... |
| GET/POST | `/api/messages/conversations` | Authenticated users | API endpoint at /api/messages/conversations |
| GET | `/api/newsletter/confirm` | None | API endpoint at /api/newsletter/confirm |
| POST | `/api/newsletter/subscribe` | None | API endpoint at /api/newsletter/subscribe |
| GET/POST | `/api/payments/escrow/[id]` | Authenticated users | API endpoint at /api/payments/escrow/[id] |
| POST | `/api/payments/refund` | Authenticated users | API endpoint at /api/payments/refund |
| POST | `/api/payments/webhook` | None | API endpoint at /api/payments/webhook |
| GET | `/api/peer-repairs/my-offers` | Authenticated users | GET /api/peer-repairs/my-offers Get current user's... |
| GET | `/api/peer-repairs/my-requests` | Authenticated users | GET /api/peer-repairs/my-requests Get current user... |
| GET/POST | `/api/peer-repairs/requests` | Authenticated users | GET /api/peer-repairs/requests Browse peer repair ... |
| GET/PUT | `/api/peer-repairs/requests/[id]` | Authenticated users | GET /api/peer-repairs/requests/[id] Get request de... |
| GET/POST | `/api/peer-repairs/requests/[id]/offers` | Authenticated users | GET /api/peer-repairs/requests/[id]/offers Get off... |
| POST | `/api/peer-repairs/requests/[id]/offers/[offerId]/accept` | Authenticated users | POST /api/peer-repairs/requests/[id]/offers/[offer... |
| POST | `/api/repairer/apply` | Authenticated users | API endpoint at /api/repairer/apply |
| GET | `/api/repairer/dashboard` | Authenticated users | Repairer Dashboard API GET /api/repairer/dashboard... |
| GET | `/api/repairers` | None | API endpoint at /api/repairers |
| GET | `/api/repairers/[id]` | None | API endpoint at /api/repairers/[id] |
| GET | `/api/repairers/[id]/availability` | None | API endpoint at /api/repairers/[id]/availability |
| GET | `/api/repairers/[id]/ratings` | None | API endpoint at /api/repairers/[id]/ratings |
| GET/POST | `/api/reviews` | Authenticated users | API endpoint at /api/reviews |
| GET/PUT/DELETE | `/api/reviews/[id]` | Authenticated users | API endpoint at /api/reviews/[id] |
| POST/PUT/DELETE | `/api/reviews/[id]/response` | Authenticated users | API endpoint at /api/reviews/[id]/response |
| POST | `/api/reviews/[id]/vote` | Authenticated users | API endpoint at /api/reviews/[id]/vote |
| POST | `/api/seller/apply` | Authenticated users | API endpoint at /api/seller/apply |
| GET | `/api/seller/dashboard` | Authenticated users | Seller Dashboard API GET /api/seller/dashboard - G... |
| POST | `/api/seller/products` | Authenticated users | API endpoint at /api/seller/products |
| POST | `/api/shop/cart` | None | POST /api/shop/cart Create a new cart |
| GET | `/api/shop/cart/[cartId]` | None | GET /api/shop/cart/[cartId] Retrieve a cart by ID |
| POST | `/api/shop/cart/[cartId]/line-items` | None | POST /api/shop/cart/[cartId]/line-items Add item t... |
| POST/DELETE | `/api/shop/cart/[cartId]/line-items/[lineId]` | None | POST /api/shop/cart/[cartId]/line-items/[lineId] U... |
| GET | `/api/shop/health` | None | API endpoint at /api/shop/health |
| GET | `/api/shop/inventory` | None | Public Shop Inventory API GET /api/shop/inventory ... |
| GET | `/api/shop/inventory/[id]` | None | Public Shop Inventory Product Detail API GET /api/... |
| POST | `/api/shop/orders` | Authenticated users | API endpoint at /api/shop/orders |
| GET | `/api/shop/products` | None | GET /api/shop/products Proxy to Medusa store produ... |
| GET | `/api/shop/regions` | None | GET /api/shop/regions Fetch available regions from... |
| POST | `/api/suggestions` | None | API endpoint at /api/suggestions |
| POST | `/api/uploads` | Authenticated users | API endpoint at /api/uploads |
| GET | `/api/user/reviews` | Authenticated users | API endpoint at /api/user/reviews |
| GET | `/api/user/workshop-registrations` | Authenticated users | API endpoint at /api/user/workshop-registrations |
| GET | `/api/workshops` | None | API endpoint at /api/workshops |
| GET | `/api/workshops/[slug]/instances` | None | API endpoint at /api/workshops/[slug]/instances |
| GET | `/api/workshops/[slug]/materials` | Authenticated users | API endpoint at /api/workshops/[slug]/materials |
| POST | `/api/workshops/[slug]/register-with-payment` | Authenticated users | API endpoint at /api/workshops/[slug]/register-wit... |
| GET | `/api/workshops/[slug]/reviews` | None | API endpoint at /api/workshops/[slug]/reviews |
| POST | `/api/workshops/propose` | Authenticated users | API endpoint at /api/workshops/propose |
| POST | `/api/workshops/register` | Authenticated users | API endpoint at /api/workshops/register |
| GET | `/api/workshops/registration/[instanceId]` | Authenticated users | API endpoint at /api/workshops/registration/[insta... |
| PATCH | `/api/workshops/registrations/[id]` | Authenticated users | API endpoint at /api/workshops/registrations/[id] |
