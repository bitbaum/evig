# evig API documentation

This document describes API endpoints in the evig platform.
Auto-generated from source code analysis. Do not edit the staff rule by hand —
it is generated from this script, and the rule lives in src/lib/permissions.ts.

## Overview

Total endpoints: 329
Categories: admin, ai, appointments, auth, blog, careers, cron, decisions, deliverables, donations, health, hirn, inquiry, inventory, invoices, it-hilfe, listings, locations, marketplace, me, members, membership, messages, newsletter, notifications, org-numbers, payments, pools, presentations, profiles, projects, protocols, public, referral, repairer, reviews, search, search-index, sellers, services, stats, suggestions, task-analytics, task-projects, task-requests, tasks, team, technicians, time-off, timecards, uploads, user, version, vote, webhooks, workshops

## Authentication

Most API endpoints use session-based authentication via Auth.js:
- `auth()` - Get current session
- Returns 401 if authentication required but not provided
- Staff endpoints require `users.is_staff`, granted by a super admin. The email domain grants nothing.

## Endpoints by Category

### Admin

#### `POST /api/admin/ai/smart-product-entry`

API: Smart Product Entry POST /api/ai/smart-product-entry Takes a product name/model and uses Groq to look up specs and generate form data. Input methods supported: 1. Text entry (current) - "Dell Latitude e7470" 2. Voice entry (future) - Speech-to-text then process 3. Image entry (future) - Vision model then process Uses Groq's llama-3.3-70b-versatile for fast inference.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/ai/smart-product-entry/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('products', async (request: NextRequest) => {...
```

</details>

#### `GET /api/admin/appointments`

GET /api/admin/appointments Admin listing of all service appointments — same shape as the user-facing /api/appointments but without the customer/repairer filter. Reuses the listAppointments service helper so the column selection + joins stay in lockstep.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/appointments/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('appointments-admin', async (request: NextRequest) => {...
```

</details>

#### `POST /api/admin/appointments/[id]/assign`

POST /api/admin/appointments/[id]/assign Admin assigns a repairer to a service booking. Moves the booking from `requested` to `accepted` so the repairer's queue surfaces it, and notifies the assigned repairer in-app + via email.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/appointments/[id]/assign/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>(...
```

</details>

#### `PATCH /api/admin/approvals/[id]`

Admin Approval Action API PATCH /api/admin/approvals/[id] - Approve, reject or reopen a content submission Pilot B of the shared review-workflow core: the transition table, FOR UPDATE race safety, review-column writes and the side-effect fan-out (in-app + email + activity + audit) all run through lifecycle/review-workflow — this route only maps HTTP ⇄ core. Behavior note (intentional): the decision email now goes through the fused notification path, so it respects the user's email_notifications preference (the old direct sendEmail bypassed it). The in-app notification is the guaranteed channel.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/approvals/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<{ id: string }>('approvals', async (request, session, context) => {...
```

</details>

#### `GET /api/admin/auth`

Admin auth check — delegates to Auth.js session. Legacy CMS JWT login has been removed. Use /auth/signin instead.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/auth/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...
```

</details>

#### `GET, POST /api/admin/blog`

API: Admin Blog Posts GET /api/admin/blog - List all posts POST /api/admin/blog - Create new post

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/blog/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('content', async (request, session) => {...

export const POST = withAdmin('content', async (request, session) => {...
```

</details>

#### `GET, PATCH, DELETE /api/admin/blog/[id]`

API: Admin Blog Post by ID GET /api/admin/blog/[id] - Get single post PATCH /api/admin/blog/[id] - Update post DELETE /api/admin/blog/[id] - Delete post

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/blog/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('content', async (request, session, context) => {...

export const PATCH = withAdmin<{ id: string }>('content', async (request, session, context) => {...

export const DELETE = withAdmin<{ id: string }>('content', async (request, session, context) => {...
```

</details>

#### `POST /api/admin/blog/[id]/translate`

API: AI-translate a blog post into its missing (or specified) locales. POST /api/admin/blog/[id]/translate body: { locales?: string[], overwrite?: boolean } Scales "manage posts in every language without git": one action fills every language tab from the German base via the provider cascade. The admin then reviews each locale in the editor. Existing translations are preserved unless `overwrite` is set or a locale is explicitly listed. Same engine as the auto-on-publish trigger (fillMissingTranslations).

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/blog/[id]/translate/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>('content', async (request, session, context) => {...
```

</details>

#### `GET, POST /api/admin/blog/categories`

API: Blog Categories GET /api/admin/blog/categories - List categories for dropdown POST /api/admin/blog/categories - Create new category

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/blog/categories/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('content', async (request, session) => {...

export const POST = withAdmin('content', async (request, session) => {...
```

</details>

#### `GET, PATCH, DELETE /api/admin/blog/categories/[id]`

API: Single Blog Category GET /api/admin/blog/categories/[id] - Get category details PATCH /api/admin/blog/categories/[id] - Update category DELETE /api/admin/blog/categories/[id] - Delete category

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/blog/categories/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('content', async (request, session, context) => {...

export const PATCH = withAdmin<{ id: string }>('content', async (request, session, context) => {...

export const DELETE = withAdmin<{ id: string }>('content', async (request, session, context) => {...
```

</details>

#### `GET, PATCH, DELETE /api/admin/blog/submissions/[id]`

API: Single Blog Submission Management GET /api/admin/blog/submissions/[id] - Get submission details PATCH /api/admin/blog/submissions/[id] - Update submission (approve, reject, etc.) DELETE /api/admin/blog/submissions/[id] - Delete submission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/blog/submissions/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('content', async (request, session, context) => {...

export const PATCH = withAdmin<{ id: string }>('content', async (request, session, context) => {...

export const DELETE = withAdmin<{ id: string }>('content', async (request, session, context) => {...
```

</details>

#### `GET, POST /api/admin/donations`

GET /api/admin/donations List all donations with filtering and pagination

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/donations/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('donations', async (request: NextRequest, session) => {...

export const POST = withAdmin('donations', async (request: NextRequest, session) => {...
```

</details>

#### `GET, PATCH, DELETE /api/admin/donations/[id]`

GET /api/admin/donations/[id] Get a single donation by ID

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/donations/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('donations', async (request, session, context) => {...

export const PATCH = withAdmin<{ id: string }>('donations', async (request, session, context) => {...

export const DELETE = withAdmin<{ id: string }>('donations', async (request, session, context) => {...
```

</details>

#### `GET /api/admin/donations/users`

API: User Search for Donations GET /api/admin/donations/users?search=... - Search users for linking to donations Access: Staff with 'donations' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/donations/users/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('donations', async (request: NextRequest, session) => {...
```

</details>

#### `GET, POST /api/admin/email/diagnostics`

Admin email diagnostics — determine WHY mail may not be arriving without exposing secrets. Reports the active provider, which config is present (booleans, never the passwords), and a live connection test. POST sends a real test email so an admin can confirm end-to-end delivery. Super-admin gated via withAdmin('settings').

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/email/diagnostics/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('settings', async () => {...

export const POST = withAdmin('settings', async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `POST /api/admin/erfassung`

Erfassung API - Product intake and registration POST /api/admin/erfassung Creates a new product in the inventory system

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/erfassung/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('products', async (request, session) => {...
```

</details>

#### `POST /api/admin/erfassung/bulk-enrich`

API: Bulk AI Enrichment POST /api/admin/erfassung/bulk-enrich Accepts partial product data (e.g. from CSV) and enriches it with AI-generated specs, descriptions, categories, and price estimates.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/erfassung/bulk-enrich/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('products', async (request: NextRequest, session) => {...
```

</details>

#### `POST /api/admin/erfassung/bulk-save`

API: Bulk Save Products POST /api/admin/erfassung/bulk-save Accepts an array of products and saves them in chunked transactions. Each chunk runs in its own transaction — failed rows don't block successful ones.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/erfassung/bulk-save/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('products', async (request, session) => {...
```

</details>

#### `POST /api/admin/erfassung/bulk-text`

API: Bulk Text-to-Products Erfassung POST /api/admin/erfassung/bulk-text Accepts text with multiple products and returns structured product data array.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/erfassung/bulk-text/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('products', async (request: NextRequest, session) => {...
```

</details>

#### `POST /api/admin/erfassung/bulk-upload`

API: Bulk File Upload (CSV/Excel) POST /api/admin/erfassung/bulk-upload Accepts a CSV or Excel file upload and returns parsed BulkProduct array.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/erfassung/bulk-upload/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('products', async (request, session) => {...
```

</details>

#### `POST /api/admin/erfassung/image`

API: Photo-to-Product Erfassung POST /api/admin/erfassung/image Accepts a base64 image and returns the SAME structured product data as the text route — full fidelity (specs, category, description, profiles), not the four-field subset the old /api/ai/analyze-product path handed back. Staff-only; part of the /api/admin/erfassung/* family (text, voice, bulk-*). Example: POST { "image": "data:image/jpeg;base64,..." } Returns: { success: true, data: { hersteller, produktname, specs, ... }, metadata }

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/erfassung/image/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('products', async (request, session) => {...
```

</details>

#### `POST /api/admin/erfassung/text`

API: Text-to-Product Erfassung POST /api/admin/erfassung/text Accepts text input and returns structured product data. Example: POST { "text": "Dell Latitude E7470 i5 8GB 256GB SSD" } Returns: { success: true, data: { hersteller: "Dell", produktname: "Latitude E7470", ... } }

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/erfassung/text/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('products', async (request, session) => {...
```

</details>

#### `POST /api/admin/erfassung/voice`

API: Voice-to-Product Erfassung POST /api/admin/erfassung/voice — accepts an audio file, transcribes it, and returns structured product data. The pipeline lives in `@/lib/erfassung/voice-to-product` (shared with the intake voice route).

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/erfassung/voice/route.ts` |
| Auth | Staff only |

#### `POST /api/admin/hirn/actions/execute`

API endpoint at /api/admin/hirn/actions/execute

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hirn/actions/execute/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('hirn', async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `POST /api/admin/hirn/chat`

API: Hirn Chat POST /api/admin/hirn/chat Send a message and get an AI response.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hirn/chat/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('hirn', async (request: NextRequest, session) => {...
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
export const GET = withAdmin('hirn', async (request: NextRequest) => {...

export const DELETE = withAdmin('hirn', async (request: NextRequest, session) => {...
```

</details>

#### `GET, DELETE /api/admin/hirn/history`

API: Hirn Chat History GET /api/admin/hirn/history?sessionId=xxx Get chat history for a session. GET /api/admin/hirn/history Get all sessions for the current user. DELETE /api/admin/hirn/history?sessionId=xxx Delete a chat session.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hirn/history/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('hirn', async (request: NextRequest, session) => {...

export const DELETE = withAdmin('hirn', async (request: NextRequest, session) => {...
```

</details>

#### `POST /api/admin/hirn/init`

API: Initialize Hirn AI Tables POST /api/admin/hirn/init Seeds default Hirn AI providers. Schema ownership lives in Drizzle schema + migrations. This route must not create or mutate tables; it only inserts default data. Only super admins can run this.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hirn/init/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('hirn', async (request: NextRequest, session) => {...
```

</details>

#### `GET, PATCH /api/admin/hirn/providers`

API: Hirn AI Providers GET /api/admin/hirn/providers List available AI providers and their status. PATCH /api/admin/hirn/providers Update provider settings (set default, enable/disable, store API key).

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hirn/providers/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('hirn', async (_request: NextRequest) => {...

export const PATCH = withAdmin('hirn', async (request: NextRequest, session) => {...
```

</details>

#### `GET /api/admin/hr/applications`

Admin HR applications GET /api/admin/hr/applications

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hr/applications/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('team', async (request: NextRequest) => {...
```

</details>

#### `GET /api/admin/hr/applications/[id]`

GET /api/admin/hr/applications/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hr/applications/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('team', async (_request, _session, context) => {...
```

</details>

#### `POST /api/admin/hr/applications/[id]/hire`

POST /api/admin/hr/applications/[id]/hire

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hr/applications/[id]/hire/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>('team', async (request, session, context) => {...
```

</details>

#### `POST /api/admin/hr/applications/[id]/transition`

POST /api/admin/hr/applications/[id]/transition

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hr/applications/[id]/transition/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>('team', async (request, session, context) => {...
```

</details>

#### `GET /api/admin/hr/stats`

GET /api/admin/hr/stats — funnel analytics

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hr/stats/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('team', async () => {...
```

</details>

#### `GET, POST /api/admin/hr/vacancies`

Admin HR vacancies GET /api/admin/hr/vacancies — list POST /api/admin/hr/vacancies — create

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hr/vacancies/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('team', async (request: NextRequest) => {...

export const POST = withAdmin('team', async (request, session) => {...
```

</details>

#### `GET, PATCH, DELETE /api/admin/hr/vacancies/[id]`

Admin HR vacancy by id GET/PATCH/DELETE /api/admin/hr/vacancies/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hr/vacancies/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('team', async (_request, _session, context) => {...

export const PATCH = withAdmin<{ id: string }>('team', async (request, _session, context) => {...

export const DELETE = withAdmin<{ id: string }>('team', async (_request, _session, context) => {...
```

</details>

#### `POST /api/admin/hr/vacancies/[id]/duplicate`

POST /api/admin/hr/vacancies/[id]/duplicate

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hr/vacancies/[id]/duplicate/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>('team', async (_request, session, context) => {...
```

</details>

#### `POST /api/admin/hr/vacancies/[id]/transition`

POST /api/admin/hr/vacancies/[id]/transition

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/hr/vacancies/[id]/transition/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>('team', async (request, _session, context) => {...
```

</details>

#### `GET, POST /api/admin/intake`

Intake API — Create + List POST /api/admin/intake — Unified device intake (creates inventory item + optional donation) GET  /api/admin/intake — List pipeline items with filters

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/intake/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('intake', async (request) => {...

export const POST = withAdmin('intake', async (request, session) => {...
```

</details>

#### `GET, PATCH /api/admin/intake/[id]`

Intake Detail API GET   /api/admin/intake/[id] — Full device detail with checklist + donation PATCH /api/admin/intake/[id] — Update device info

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/intake/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('intake', async (_request, _session, context) => {...

export const PATCH = withAdmin<{ id: string }>('intake', async (request, session, context) => {...
```

</details>

#### `POST /api/admin/intake/[id]/change-tier`

Intake Tier Change API POST /api/admin/intake/[id]/change-tier — Change device tier with checklist reset. Resets all checklist progress and records a timeline event.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/intake/[id]/change-tier/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>('intake', async (request, session, context) => {...
```

</details>

#### `PATCH /api/admin/intake/[id]/checklist`

Intake Checklist API PATCH /api/admin/intake/[id]/checklist — Set a verdict (pass/fail/na) on one checklist item, or the same verdict on many (`item_ids`, used by "Alles in Ordnung"). All writes serialize on a row lock: the checklist is one JSONB column, so unlocked concurrent read-modify-writes silently drop each other's items (the "Alles in Ordnung needs four clicks" bug).

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/intake/[id]/checklist/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<{ id: string }>('intake', async (request, session, context) => {...
```

</details>

#### `POST /api/admin/intake/[id]/publish`

Intake Publish API POST /api/admin/intake/[id]/publish — Publish device to marketplace GATED: All required checklist items must be completed first.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/intake/[id]/publish/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>('intake', async (request, session, context) => {...
```

</details>

#### `GET /api/admin/inventory`

Inventory Products List API GET /api/admin/inventory Lists all products from the ai_extracted_products table with inventory data

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/inventory/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('products', async (request: NextRequest, session) => {...
```

</details>

#### `GET, PUT, PATCH, DELETE /api/admin/inventory/[id]`

Inventory Product Detail API GET    /api/admin/inventory/[id] - Fetch product details DELETE /api/admin/inventory/[id] - Delete product + related records PUT    /api/admin/inventory/[id] - Update product fields + image PATCH  /api/admin/inventory/[id] - Quick status updates (publish/unpublish)

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/inventory/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('products', async (request, session, context) => {...

export const PUT = withAdmin<{ id: string }>('products', async (request, session, context) => {...

export const PATCH = withAdmin<{ id: string }>('products', async (request, session, context) => {...

export const DELETE = withAdmin<{ id: string }>('products', async (request, session, context) => {...
```

</details>

#### `GET /api/admin/it-hilfe`

API endpoint at /api/admin/it-hilfe

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/it-hilfe/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('it-hilfe-admin', async (request) => {...
```

</details>

#### `GET, PATCH, DELETE /api/admin/it-hilfe/[id]`

API endpoint at /api/admin/it-hilfe/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/it-hilfe/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>(...

export const PATCH = withAdmin<{ id: string }>(...

export const DELETE = withAdmin<{ id: string }>(...
```

</details>

#### `GET /api/admin/it-hilfe/helpers`

API endpoint at /api/admin/it-hilfe/helpers

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/it-hilfe/helpers/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('it-hilfe-admin', async (request) => {...
```

</details>

#### `PATCH /api/admin/it-hilfe/helpers/[id]`

API endpoint at /api/admin/it-hilfe/helpers/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/it-hilfe/helpers/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<{ id: string }>(...
```

</details>

#### `GET /api/admin/it-hilfe/stats`

API endpoint at /api/admin/it-hilfe/stats

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/it-hilfe/stats/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('it-hilfe-admin', async () => {...
```

</details>

#### `POST, DELETE /api/admin/listings/[id]/verify`

POST /api/admin/listings/[id]/verify — Admin: mark listing as verified DELETE /api/admin/listings/[id]/verify — Admin: remove verification Only staff members can verify listings (RevampIT workshop-tested items).

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/listings/[id]/verify/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>(...

export const DELETE = withAdmin<{ id: string }>(...
```

</details>

#### `GET /api/admin/marketplace`

API endpoint at /api/admin/marketplace

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/marketplace/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('marketplace', async (request) => {...
```

</details>

#### `GET, PATCH, DELETE /api/admin/marketplace/[id]`

API endpoint at /api/admin/marketplace/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/marketplace/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('marketplace', async (_request, _session, context) => {...

export const PATCH = withAdmin<{ id: string }>('marketplace', async (request, session, context) => {...

export const DELETE = withAdmin<{ id: string }>(...
```

</details>

#### `GET /api/admin/marketplace/orders`

API endpoint at /api/admin/marketplace/orders

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/marketplace/orders/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('marketplace', async (request) => {...
```

</details>

#### `GET /api/admin/marketplace/questions`

API endpoint at /api/admin/marketplace/questions

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/marketplace/questions/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('marketplace', async (request) => {...
```

</details>

#### `PATCH /api/admin/marketplace/questions/[id]`

API endpoint at /api/admin/marketplace/questions/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/marketplace/questions/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<{ id: string }>('marketplace', async (request, session, context) => {...
```

</details>

#### `GET /api/admin/marketplace/reports`

API endpoint at /api/admin/marketplace/reports

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/marketplace/reports/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('marketplace', async (request) => {...
```

</details>

#### `PATCH /api/admin/marketplace/reports/[id]`

API endpoint at /api/admin/marketplace/reports/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/marketplace/reports/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<{ id: string }>('marketplace', async (request, session, context) => {...
```

</details>

#### `GET /api/admin/marketplace/stats`

API endpoint at /api/admin/marketplace/stats

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/marketplace/stats/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('marketplace', async () => {...
```

</details>

#### `PATCH /api/admin/membership/[id]`

API endpoint at /api/admin/membership/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/membership/[id]/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin(
  'membership',
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `GET /api/admin/membership/members`

GET /api/admin/membership/members Returns all active Verein members for decision invitation. Used by decision creation form to auto-invite members to votes.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/membership/members/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('membership', async (_request: NextRequest) => {...
```

</details>

#### `POST /api/admin/migrate/shopware-drafts`

API: One-time Shopware → RevampIT catalog migration (drafts). POST /api/admin/migrate/shopware-drafts Imports products scraped from the legacy Shopware shop as DRAFTS (pending review, not published). Reuses createErfassungProduct so every invariant — item UUID, inventory item, R2 image upload — matches normal intake. Images are downloaded server-side from the Shopware URL and handed to the shared upload path (→ R2). Idempotent: a product already imported (same Shopware number, stored in specifications) is skipped, so batches can be re-run/resumed. Auth: Bearer CRON_SECRET (operational/migration tool — not session-gated, so it can be driven from the server without a browser). Body: { userId: string, products: [{ produktname, hersteller, verkaufspreis?, kurzbeschreibung?, imageUrl?, productNumber? }] }

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/migrate/shopware-drafts/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET, POST /api/admin/pages`

GET  /api/admin/pages — list static pages POST /api/admin/pages — create a static page The pages admin UI shipped calling these routes before they existed — create always 404'd. Section-gated on 'content' like the sibling blog CRUD.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/pages/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('content', async () => {...

export const POST = withAdmin('content', async (request: NextRequest, session) => {...
```

</details>

#### `GET, PUT, DELETE /api/admin/pages/[id]`

GET    /api/admin/pages/[id] — read a static page for editing PUT    /api/admin/pages/[id] — update a static page DELETE /api/admin/pages/[id] — delete a static page The edit UI shipped calling these routes before they existed — every edit rendered "Seite nicht gefunden". Section-gated on 'content'.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/pages/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('content', async (_request, _session, context) => {...

export const PUT = withAdmin<{ id: string }>(...

export const DELETE = withAdmin<{ id: string }>('content', async (_request, session, context) => {...
```

</details>

#### `GET /api/admin/payments/dashboard`

API endpoint at /api/admin/payments/dashboard

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/payments/dashboard/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('finanzen', async (request: NextRequest) => {...
```

</details>

#### `GET /api/admin/payroll/batches`

GET /api/admin/payroll/batches — list past payroll batches with aggregates. Used by /admin/payroll to render the "previous Lohnläufe" list. Each row shows the period, who closed it + when, exported status, and the count + total hours of linked timecards. Newest first.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/payroll/batches/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('payroll', async (_request: NextRequest, _session: ValidSession) => {...
```

</details>

#### `GET /api/admin/payroll/batches/[id]/export.csv`

GET /api/admin/payroll/batches/[id]/export.csv Streams the CSV the accountant plugs into payroll software. Generic shape — one row per person × timecard in the batch. The first column-set is operational (period, person, AHV, canton); the second is the money math (hours, rate, gross). Notes column carries any timecard.notes the staff member left. Super-admin only because the rows expose hourly_rate + AHV + gross pay. Stamps payroll_batches.exported_at + exported_by on success so the UI can show "exported on X".

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/payroll/batches/[id]/export.csv/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>(...
```

</details>

#### `GET, POST /api/admin/payroll/close`

POST /api/admin/payroll/close Closes a payroll batch for a date range. Atomically: 1. INSERT INTO payroll_batches (period_start, period_end, closed_at, closed_by) 2. UPDATE every approved timecard whose period falls fully inside [period_start, period_end] AND has no payroll_batch_id yet — stamping it with the new batch_id AND snapshotting the current rate from team_profiles.hourly_rate_cents to timecards.rate_applied_cents (so a later raise can't retroactively change historical payroll math). After close the linked timecards remain readable but should be treated as locked by the UI — a future raise / amendment goes through a correction batch, not by editing the row in place. Only super admins can close batches (the operation is financial).

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/payroll/close/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('payroll', async (_request: NextRequest, _session: ValidSession) => {...

export const POST = withAdmin('payroll', async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `POST /api/admin/permissions/request`

API: Staff Permission Request POST /api/admin/permissions/request Allows staff to request access to admin sections they don't have.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/permissions/request/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin(async (request, session) => {...
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
export const GET = withAdmin('users', async (request, session) => {...
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
export const POST = withAdmin<{ id: string }>(async (request, session, context) => {...
```

</details>

#### `PATCH /api/admin/projects/[slug]/contributions/[id]`

Admin API: PATCH a contribution's triage status / notes.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/projects/[slug]/contributions/[id]/route.ts` |
| Auth | None |
| Params | `slug`, `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<{ slug: string; id: string }>(...
```

</details>

#### `GET, POST /api/admin/projects/[slug]/needs`

Admin API for project needs CRUD. GET   /api/admin/projects/[slug]/needs       — list all needs (any status) POST  /api/admin/projects/[slug]/needs       — create new need

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/projects/[slug]/needs/route.ts` |
| Auth | None |
| Params | `slug` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ slug: string }>('projects', async (_request, _session, ctx) => {...

export const POST = withAdmin<{ slug: string }>('projects', async (request, _session, ctx) => {...
```

</details>

#### `PATCH, DELETE /api/admin/projects/[slug]/needs/[id]`

Admin API for a single project need. PATCH  /api/admin/projects/[slug]/needs/[id]  — update fields/status DELETE /api/admin/projects/[slug]/needs/[id]  — delete

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/projects/[slug]/needs/[id]/route.ts` |
| Auth | None |
| Params | `slug`, `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<{ slug: string; id: string }>(...

export const DELETE = withAdmin<{ slug: string; id: string }>(...
```

</details>

#### `GET, POST /api/admin/promo-codes`

API endpoint at /api/admin/promo-codes

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/promo-codes/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('promo-codes', async () => {...

export const POST = withAdmin(
  'promo-codes',
  async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `PATCH /api/admin/promo-codes/[id]`

API endpoint at /api/admin/promo-codes/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/promo-codes/[id]/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin('promo-codes', async (request: NextRequest, _session, context) => {...
```

</details>

#### `POST /api/admin/promote-user`

Promote User to Admin API POST /api/admin/promote-user

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/promote-user/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('users', async (request: NextRequest) => {...
```

</details>

#### `GET /api/admin/refunds`

API endpoint at /api/admin/refunds

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/refunds/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('finanzen', async (request: NextRequest) => {...
```

</details>

#### `GET, PUT /api/admin/refunds/[id]`

API endpoint at /api/admin/refunds/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/refunds/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('finanzen', async (request, session, context) => {...

export const PUT = withAdmin<{ id: string }>('finanzen', async (request, session, context) => {...
```

</details>

#### `POST /api/admin/repairers/[id]/recalculate-ratings`

API endpoint at /api/admin/repairers/[id]/recalculate-ratings

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/repairers/[id]/recalculate-ratings/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>('services', async (request, session, context) => {...
```

</details>

#### `GET /api/admin/reviews`

GET /api/admin/reviews?status=<status>&limit=<n> Lists reviews for the admin moderation page (src/app/admin/reviews + useAdminReviews). Returns the camelCase `{ reviews: Review[] }` shape the hook expects. Staff-only via withAdmin('reviews'). targetName is resolved polymorphically: 'repairer' → repairer_profiles, 'workshop' → workshops; any other target type falls back to a readable label so the row never renders blank.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/reviews/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('reviews', async (request: NextRequest) => {...
```

</details>

#### `PUT /api/admin/reviews/[id]/moderate`

PUT /api/admin/reviews/[id]/moderate Body: { action: ReviewModerationAction, reason: string } Moderates a single review: transitions its status, records who/why on the review, and appends an audit row to review_moderation_log. Staff-only via withAdmin('reviews'). Used by useAdminReviews.handleModerate.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/reviews/[id]/moderate/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PUT = withAdmin<{ id: string }>(...
```

</details>

#### `GET /api/admin/search-index`

API endpoint at /api/admin/search-index

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/search-index/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(async (request: NextRequest, session) => {...
```

</details>

#### `GET, POST /api/admin/services`

API: Admin Services GET /api/admin/services - List all services (including inactive) POST /api/admin/services - Create new service

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/services/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('services', async (request, session) => {...

export const POST = withAdmin('services', async (request, session) => {...
```

</details>

#### `GET, PUT, DELETE /api/admin/services/[id]`

API: Admin Service by ID GET /api/admin/services/[id] - Get single service PUT /api/admin/services/[id] - Update service DELETE /api/admin/services/[id] - Soft delete service

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/services/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('services', async (request, session, context) => {...

export const PUT = withAdmin<{ id: string }>('services', async (request, session, context) => {...

export const DELETE = withAdmin<{ id: string }>('services', async (request, session, context) => {...
```

</details>

#### `GET, POST /api/admin/storage-locations`

Storage Locations API GET  /api/admin/storage-locations  → active locations (for the erfassung picker) POST /api/admin/storage-locations  → add a new location (inline "＋ Standort") Access: staff with the `products` section (same as erfassung, which owns the picker). `kind` is validated against STORAGE_LOCATION_KINDS (config SSOT).

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/storage-locations/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('products', async () => {...

export const POST = withAdmin('products', async (request, session) => {...
```

</details>

#### `GET /api/admin/tax-reports`

Compute VAT reporting period boundaries in Europe/Zurich local time. Returns Swiss-local calendar dates as YYYY-MM-DD strings: - start:     first day of the period (inclusive) - end:       last day of the period (inclusive — for display) - nextStart: day AFTER end (used as the SQL exclusive upper bound) Why strings + Postgres AT TIME ZONE: the previous Date-based logic computed boundaries in the server's local timezone (UTC on the self-hosted box), so a transaction at 00:30 Zurich on Jan 1 (= 23:30 UTC Dec 31 in winter) was attributed to the PRIOR year's VAT period — a real accounting drift at year-end. Returning naive Swiss-local dates and letting Postgres convert via `${date}::date AT TIME ZONE 'Europe/ Zurich'` keeps the boundary math in a system with full IANA tz + DST support, instead of trying to hand-roll DST detection in JS. `nextStart` is exposed separately for `created_at < nextStart` SQL comparisons — cleaner than `<= end::date + 23:59:59.999999` because Postgres's `date` cast already gives us a clean exclusive upper.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/tax-reports/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('finanzen', async (request: NextRequest) => {...
```

</details>

#### `GET /api/admin/team/activity`

API: Unified Activity Stream GET /api/admin/team/activity - Get unified activity feed Aggregates: - Task completions - Activity updates (manual entries) - Help requests (created and resolved) - Current focus updates Access: Staff with 'team' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/activity/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('team', async (request, session) => {...
```

</details>

#### `GET, POST /api/admin/team/activity/updates`

API: Activity Updates GET  /api/admin/team/activity/updates - List activity updates POST /api/admin/team/activity/updates - Create activity update Access: Staff with 'team' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/activity/updates/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('team', async (request, session) => {...

export const POST = withAdmin('team', async (request, session) => {...
```

</details>

#### `GET, PUT, DELETE /api/admin/team/activity/updates/[id]`

API: Activity Update Detail GET    /api/admin/team/activity/updates/[id] - Get update details PUT    /api/admin/team/activity/updates/[id] - Update activity DELETE /api/admin/team/activity/updates/[id] - Delete activity Access: Staff with 'team' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/activity/updates/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('team', async (request, session, context) => {...

export const PUT = withAdmin<{ id: string }>('team', async (request, session, context) => {...

export const DELETE = withAdmin<{ id: string }>('team', async (request, session, context) => {...
```

</details>

#### `GET /api/admin/team/digest`

API: Weekly Digest GET /api/admin/team/digest - Get weekly activity summary Provides aggregated statistics for management: - Task completions per user - Activity updates count and breakdown - Help requests created/resolved - Top contributors Access: Staff with 'team' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/digest/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('team', async (request, session) => {...
```

</details>

#### `GET, POST /api/admin/team/help-requests`

API: Help Requests GET  /api/admin/team/help-requests - List help requests POST /api/admin/team/help-requests - Create help request Access: Staff with 'team' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/help-requests/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('team', async (request, session) => {...

export const POST = withAdmin('team', async (request, session) => {...
```

</details>

#### `GET, PUT /api/admin/team/help-requests/[id]`

API: Help Request Detail GET /api/admin/team/help-requests/[id] - Get request details PUT /api/admin/team/help-requests/[id] - Update request Access: Staff with 'team' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/help-requests/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('team', async (request, session, context) => {...

export const PUT = withAdmin<{ id: string }>('team', async (request, session, context) => {...
```

</details>

#### `POST /api/admin/team/help-requests/[id]/resolve`

API: Resolve Help Request POST /api/admin/team/help-requests/[id]/resolve - Mark request as resolved Access: Staff with 'team' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/help-requests/[id]/resolve/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>('team', async (request, session, context) => {...
```

</details>

#### `DELETE /api/admin/team/leave/[id]`

DELETE /api/admin/team/leave/[id] Removes a single leave period. Used by HR to revoke a leave entry (e.g. someone's vacation was cancelled, sick days reclassified). Hard delete — leave records are operational metadata, not audit- critical financial data. Compensation_history is the table that stays immutable.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/leave/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const DELETE = withAdmin<{ id: string }>(...
```

</details>

#### `GET, POST /api/admin/team/profiles`

API: Team Profiles List & Create GET  /api/admin/team/profiles - List all team profiles with filters POST /api/admin/team/profiles - Create a new team profile Access: Staff with 'team' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/profiles/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('team', async (request, session) => {...

export const POST = withAdmin('team', async (request, session) => {...
```

</details>

#### `GET, PUT, DELETE /api/admin/team/profiles/[id]`

API: Team Profile Detail GET    /api/admin/team/profiles/[id] - Get profile details PUT    /api/admin/team/profiles/[id] - Update profile DELETE /api/admin/team/profiles/[id] - Delete profile Access: Staff with 'team' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/profiles/[id]/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('team', async (request, session, context) => {...

export const PUT = withAdmin<{ id: string }>('team', async (request, session, context) => {...

export const DELETE = withAdmin<{ id: string }>('team', async (request, session, context) => {...
```

</details>

#### `PUT /api/admin/team/profiles/[id]/focus`

API: Current Focus Update PUT /api/admin/team/profiles/[id]/focus - Update current focus status Access: Staff with 'team' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/profiles/[id]/focus/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PUT = withAdmin<{ id: string }>('team', async (request, session, context) => {...
```

</details>

#### `GET, POST /api/admin/team/profiles/[id]/leave`

GET  /api/admin/team/profiles/[id]/leave — list leave periods POST /api/admin/team/profiles/[id]/leave — create a leave period Scoped to one team profile so the UI can render leave history right next to the profile itself. Both endpoints require the `team` permission. DELETE lives at /api/admin/team/leave/[leaveId] so each leave row can be revoked by id without re-deriving the profile.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/profiles/[id]/leave/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>(...

export const POST = withAdmin<{ id: string }>(...
```

</details>

#### `PUT /api/admin/team/profiles/me`

API: My Team Profile (self-service) PUT /api/admin/team/profiles/me — a staff member edits (or first-creates) their OWN team profile. Why a dedicated `me` route instead of `/[id]`: it is own-only BY CONSTRUCTION. The target row is ALWAYS `WHERE user_id = session.user.id`, so there is no id to authorize — a staff member can never reach another person's profile. `withAuth` gates on `isStaff`; sensitive fields (compensation / AHV / hr_notes) are stripped for non-super-admins by the SHARED `mapTeamProfileUpdate` guard, so self-service can never write payroll data. New staff have no profile row yet (the onboarding case), so the first save UPSERTS one. Note: Next.js resolves the static `me` segment before the dynamic `[id]`, so `/profiles/me` lands here and `/profiles/<uuid>` still lands on the admin route.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/profiles/me/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export const PUT = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `POST /api/admin/team/profiles/me/bootstrap`

API: Self-service team-profile bootstrap. POST /api/admin/team/profiles/me/bootstrap Why this exists separate from POST /api/admin/team/profiles: - The general team-profile create endpoint requires the 'team' permission (HR-grade). Most staff don't have it. But every staff member needs their OWN profile to use timecards — they shouldn't have to wait for HR to provision them. - The general endpoint expects a full validated body. This one takes nothing: it creates a minimal profile for the calling user with the standard Mo–Fr 09:00–17:00 schedule. Idempotent-ish: - If no profile exists → create with default schedule, return 201. - If profile exists but workingHours is null/empty → set the default schedule on it, return 200 with applied=true. - If profile exists with a non-empty schedule already → no-op, return 200 with applied=false. Caller should not see this as an error. The endpoint replaces a 5-step manual flow (open team page → click own name → fill schedule → save → navigate to timecards) with a single POST + page reload. The /admin/zeiterfassung page surfaces this as the primary action of the NoScheduleNotice block.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/profiles/me/bootstrap/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin(async (_request, session) => {...
```

</details>

#### `GET, POST /api/admin/team/zeit/[userId]`

Zeit & Pensum administration for one team member (timecards permission). GET  — employment periods, vacation entitlements, opening balance. POST — one of three actions (zod-discriminated): { action: 'period',      valid_from, weekly_hours }        add/replace a Pensum step { action: 'entitlement', year, days, carryover_days }      upsert a Ferienanspruch { action: 'opening',     minutes, date }                   set the Übertrag T These numbers feed the DERIVED saldo (lib/team/saldo) — nothing here writes a balance directly.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/team/zeit/[userId]/route.ts` |
| Auth | Staff only |
| Params | `userId` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(
  'timecards',
  async (_request: NextRequest, session: ValidSession, context) => {...

export const POST = withAdmin(
  'timecards',
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `GET, POST /api/admin/teams`

API endpoint at /api/admin/teams

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('teams', async (request: NextRequest, session: ValidSession) => {...

export const POST = withAdmin('teams', async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PUT, DELETE /api/admin/teams/[id]`

API endpoint at /api/admin/teams/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/[id]/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<Params>(
  'teams',
  async (_request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...

export const PUT = withAdmin<Params>(
  'teams',
  async (request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...

export const DELETE = withAdmin<Params>(
  'teams',
  async (_request: NextRequest, session: ValidSession, context?: { params?: Params }) => {...
```

</details>

#### `PATCH /api/admin/teams/[id]/focus`

API endpoint at /api/admin/teams/[id]/focus

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/[id]/focus/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<Params>(
  'teams',
  async (request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...
```

</details>

#### `GET, POST /api/admin/teams/[id]/goals`

API endpoint at /api/admin/teams/[id]/goals

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/[id]/goals/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<Params>(
  'teams',
  async (_request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...

export const POST = withAdmin<Params>(
  'teams',
  async (request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...
```

</details>

#### `PATCH, DELETE /api/admin/teams/[id]/goals/[goalId]`

API endpoint at /api/admin/teams/[id]/goals/[goalId]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/[id]/goals/[goalId]/route.ts` |
| Auth | None |
| Params | `id`, `goalId` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<Params>(
  'teams',
  async (request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...

export const DELETE = withAdmin<Params>(
  'teams',
  async (_request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...
```

</details>

#### `POST /api/admin/teams/[id]/invitations`

Invite a person into the team by name + email. Registered staff are added directly (and notified); unknown addresses get a placeholder account with the membership and a claim link by email. Structural onboarding → super admins only (matches team create / claim-link minting).

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/[id]/invitations/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<Params>(
  'teams',
  async (request: NextRequest, session: ValidSession, context?: { params?: Params }) => {...
```

</details>

#### `GET, POST /api/admin/teams/[id]/members`

Add a person to the team, or TRANSFER them in (when from_team_id is set — their live membership in that team is closed first). Idempotent.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/[id]/members/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<Params>(
  'teams',
  async (_request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...

export const POST = withAdmin<Params>(
  'teams',
  async (request: NextRequest, session: ValidSession, context?: { params?: Params }) => {...
```

</details>

#### `PATCH, DELETE /api/admin/teams/[id]/members/[membershipId]`

API endpoint at /api/admin/teams/[id]/members/[membershipId]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/[id]/members/[membershipId]/route.ts` |
| Auth | None |
| Params | `id`, `membershipId` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<Params>(
  'teams',
  async (request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...

export const DELETE = withAdmin<Params>(
  'teams',
  async (_request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...
```

</details>

#### `GET, POST /api/admin/teams/[id]/metrics`

API endpoint at /api/admin/teams/[id]/metrics

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/[id]/metrics/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<Params>(
  'teams',
  async (_request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...

export const POST = withAdmin<Params>(
  'teams',
  async (request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...
```

</details>

#### `PATCH, DELETE /api/admin/teams/[id]/metrics/[metricId]`

API endpoint at /api/admin/teams/[id]/metrics/[metricId]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/[id]/metrics/[metricId]/route.ts` |
| Auth | None |
| Params | `id`, `metricId` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<Params>(
  'teams',
  async (request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...

export const DELETE = withAdmin<Params>(
  'teams',
  async (_request: NextRequest, _session: ValidSession, context?: { params?: Params }) => {...
```

</details>

#### `GET /api/admin/teams/candidates`

API endpoint at /api/admin/teams/candidates

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/candidates/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('teams', async (_request: NextRequest, session: ValidSession) => {...
```

</details>

#### `POST /api/admin/teams/invite`

Mint a claim link for a placeholder member. Structural onboarding → super admins only (matches team create/delete). With `email` set, the link is also sent to that (real) address; either way the token is returned so the client can build the absolute /einladung/<token> URL from its own origin.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/teams/invite/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('teams', async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET /api/admin/time-off`

GET /api/admin/time-off?status=pending|approved|rejected|cancelled|all → the approval queue. Requires the `timecards` section permission.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/time-off/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('timecards', async (request: NextRequest, _session: ValidSession) => {...
```

</details>

#### `PATCH /api/admin/time-off/[id]`

PATCH /api/admin/time-off/:id  → approve or reject a pending request. Requires the `timecards` section permission (super admins always pass).

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/time-off/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<{ id: string }>(...
```

</details>

#### `GET /api/admin/timecards`

API endpoint at /api/admin/timecards

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/timecards/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('timecards', async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PUT, PATCH /api/admin/timecards/[id]`

API endpoint at /api/admin/timecards/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/timecards/[id]/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(
  'timecards',
  async (_request: NextRequest, session: ValidSession, context) => {...

export const PUT = withAdmin(
  'timecards',
  async (request: NextRequest, session: ValidSession, context) => {...

export const PATCH = withAdmin(
  'timecards',
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/admin/timecards/[id]/reopen`

API endpoint at /api/admin/timecards/[id]/reopen

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/timecards/[id]/reopen/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin(
  'timecards',
  async (_request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/admin/timecards/[id]/submit`

POST /api/admin/timecards/[id]/submit — submit a DRAFT card on behalf of its owner (proxy entry, e.g. HR back-filling a past month for someone who doesn't use the tool). Vier-Augen stays intact: the submitter cannot be the sole reviewer unless super-admin — approval is a separate action by the normal rules. Owner is notified.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/timecards/[id]/submit/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin(
  'timecards',
  async (_request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/admin/timecards/bulk-review`

POST /api/admin/timecards/bulk-review Approves or rejects multiple timecards in one round-trip. The hot path is "HR opens approval queue on Monday morning, ticks 18 of 20 obviously-clean weekly submissions, hits Approve" — that used to be 18 separate PATCHes (each with its own 500 ms RTT plus a textarea dance), now it's one. Per-id processing isolates failures: a single bad row (e.g. status already approved by a parallel reviewer) returns a `failed` entry rather than aborting the whole batch. The UI shows the partial- success count + reasons. We do NOT wrap all reviews in one giant transaction because each review fires its own notification + activity log; a multi-second tx holding row locks while sending emails would be exactly the long-lived-tx anti-pattern we already cleaned out of other handlers.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/timecards/bulk-review/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('timecards', async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `POST /api/admin/timecards/for-user`

POST /api/admin/timecards/for-user — create-or-get a month card for ANOTHER team member ("erfassen im Namen von", timecards permission). Body: { user_id, month: 'YYYY-MM' }. Returns the card id; the caller opens the review drawer to enter the days. Auditable: activity-logged, and every entry edit goes through the audited approver-edit path.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/timecards/for-user/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('timecards', async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET /api/admin/users`

API: Users List with Search, Filter, and Pagination GET /api/admin/users - List users with filtering Query params: - search: Filter by name or email (ILIKE) - type: 'all', 'staff', 'regular' - verified: 'all', 'yes', 'no' - page: Page number (default: 1) - limit: Items per page (default: 25, max: 100) Access: Staff with 'users' permission

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/users/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('users', async (request, session) => {...
```

</details>

#### `GET, PATCH, DELETE /api/admin/users/[id]`

API: User Management GET    /api/admin/users/[id] - Get user details PATCH  /api/admin/users/[id] - Update user profile DELETE /api/admin/users/[id] - Delete user Only super admins can access these endpoints.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/users/[id]/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>('users', async (request, session, context) => {...

export const PATCH = withAdmin<{ id: string }>('users', async (request, session, context) => {...

export const DELETE = withAdmin<{ id: string }>('users', async (request, session, context) => {...
```

</details>

#### `PATCH /api/admin/users/[id]/permissions`

API: Manage User Permissions PATCH /api/admin/users/[id]/permissions Super admins can update staff permissions and super admin status. All changes are logged to the audit log.

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/users/[id]/permissions/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<{ id: string }>('users', async (request, session, context) => {...
```

</details>

#### `GET, POST /api/admin/workshops/[workshopId]/materials`

API endpoint at /api/admin/workshops/[workshopId]/materials

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/[workshopId]/materials/route.ts` |
| Auth | None |
| Params | `workshopId` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ workshopId: string }>(...

export const POST = withAdmin<{ workshopId: string }>(...
```

</details>

#### `GET, POST /api/admin/workshops/instances`

API endpoint at /api/admin/workshops/instances

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/instances/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('workshops-admin', async (request, session) => {...

export const POST = withAdmin('workshops-admin', async (request, session) => {...
```

</details>

#### `GET, PUT, DELETE /api/admin/workshops/instances/[id]`

API endpoint at /api/admin/workshops/instances/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/instances/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>(...

export const PUT = withAdmin<{ id: string }>(...

export const DELETE = withAdmin<{ id: string }>(...
```

</details>

#### `GET /api/admin/workshops/list`

API endpoint at /api/admin/workshops/list

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/list/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('workshops-admin', async (request, session) => {...
```

</details>

#### `PUT, DELETE /api/admin/workshops/materials/[id]`

API endpoint at /api/admin/workshops/materials/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/materials/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PUT = withAdmin<{ id: string }>(...

export const DELETE = withAdmin<{ id: string }>(...
```

</details>

#### `GET /api/admin/workshops/proposals`

API endpoint at /api/admin/workshops/proposals

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/proposals/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('workshops-admin', async (request, session) => {...
```

</details>

#### `GET, PATCH /api/admin/workshops/proposals/[id]`

GET /api/admin/workshops/proposals/[id] Fetch a single workshop proposal with full details

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/proposals/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>(...

export const PATCH = withAdmin<{ id: string }>(...
```

</details>

#### `POST /api/admin/workshops/proposals/[id]/approve`

API endpoint at /api/admin/workshops/proposals/[id]/approve

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/proposals/[id]/approve/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>(...
```

</details>

#### `GET /api/admin/workshops/proposals/[id]/history`

GET /api/admin/workshops/proposals/[id]/history Fetch edit history for a workshop proposal

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/proposals/[id]/history/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<{ id: string }>(...
```

</details>

#### `PUT /api/admin/workshops/registrations/[id]`

API endpoint at /api/admin/workshops/registrations/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/registrations/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PUT = withAdmin<{ id: string }>(...
```

</details>

#### `POST /api/admin/workshops/send-feedback-requests`

API endpoint at /api/admin/workshops/send-feedback-requests

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/send-feedback-requests/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('workshops-admin', async (request, session) => {...
```

</details>

#### `POST /api/admin/workshops/send-reminders`

API endpoint at /api/admin/workshops/send-reminders

| Property | Value |
|----------|-------|
| File | `src/app/api/admin/workshops/send-reminders/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin('workshops-admin', async (request, session) => {...
```

</details>

### Ai

#### `POST /api/ai/analyze-product`

API: Image Product Analysis POST /api/ai/analyze-product Analyzes product images using AI vision model. Accepts: - image: Base64 encoded image data - imageUrl: URL to image (not yet implemented) - saveToDatabase: Boolean to save results Returns: - analysis: Product data extracted from image - sustainability_score: Environmental scoring

| Property | Value |
|----------|-------|
| File | `src/app/api/ai/analyze-product/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/ai/extract`

AI Form Extraction API POST /api/ai/extract Universal endpoint for AI-powered form field extraction. Dispatches to form-specific prompts via FORM_AI_REGISTRY.

| Property | Value |
|----------|-------|
| File | `src/app/api/ai/extract/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `POST /api/ai/form-assist`

Form Assist API POST /api/ai/form-assist One route for every AI-assisted form in the app. Adding assistance to a new form means adding it to AI_FORMS — nothing here changes. The field registry stays server-side on purpose: the client names a form, never the fields, so it cannot widen what the model is allowed to write. Auth required — staff only, same as the other advisors.

| Property | Value |
|----------|-------|
| File | `src/app/api/ai/form-assist/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = createFormAssistHandler({...
```

</details>

#### `POST /api/ai/protocol-advisor`

Protocol Advisor API POST /api/ai/protocol-advisor Provides AI consultation about a meeting protocol: helps staff understand decisions, tasks, context, and key outcomes from the structured notes. Auth required — staff only.

| Property | Value |
|----------|-------|
| File | `src/app/api/ai/protocol-advisor/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/ai/task-advisor`

Task Advisor API POST /api/ai/task-advisor "Ask the AI for help" on a task: unlike the protocol advisor (which stays strictly within the document), this one gives PRACTICAL help — how to approach the task, break it into steps, spot blockers, draft messages. Auth required — staff only.

| Property | Value |
|----------|-------|
| File | `src/app/api/ai/task-advisor/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/ai/vote-advisor`

Vote Advisor API POST /api/ai/vote-advisor Provides AI consultation for voters: explains what a decision means, what the implications of each option are, and how the voting method works. No auth required — public voters (via /vote/[id]) need this too. The decision context is passed in the request body (already loaded by the caller). Rate limiting (two-tier, defense-in-depth): - voteAdvisorIp: 5 calls/hour/IP  — stops a single attacker hammering - voteAdvisorGlobal: 50 calls/hour across all IPs — budget backstop in case of botnet distribution (per-IP alone is not enough — LRU evicts at 500 unique IDs and a small botnet would slip past) Each upstream LLM call costs real money; without these limits a script could drain the AI budget in minutes.

| Property | Value |
|----------|-------|
| File | `src/app/api/ai/vote-advisor/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Appointments

#### `GET, POST /api/appointments`

Fire-and-forget admin notification for a new booking. Two channels: 1. In-app via notifyAllStaff — surfaces in the admin NotificationBell regardless of whether the booking was pre-assigned. This is the fix for the pre-existing gap where admins only learned about bookings by email. 2. Email fallback via appointmentUnassignedAlert — only when no repairer was pre-assigned. Same behavior as before; just now links to the new /admin/appointments page (ROUTES SSOT) instead of /admin/services (which is the service catalog, not bookings).

| Property | Value |
|----------|-------|
| File | `src/app/api/appointments/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PATCH /api/appointments/[id]`

API endpoint at /api/appointments/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/appointments/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth<{ id: string }>(...

export const PATCH = withAuth<{ id: string }>(...
```

</details>

#### `POST /api/appointments/[id]/pay`

API endpoint at /api/appointments/[id]/pay

| Property | Value |
|----------|-------|
| File | `src/app/api/appointments/[id]/pay/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Auth

#### `GET, POST /api/auth/[...nextauth]`

Auth.js API Route Handler Handles all authentication requests: /api/auth/*

| Property | Value |
|----------|-------|
| File | `src/app/api/auth/[...nextauth]/route.ts` |
| Auth | None |
| Params | `...nextauth` |

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

POST /api/auth/login-status Historical purpose: pre-flight check during sign-in to hint at UX (email verification, lockout, OAuth-only accounts). No UI surface consumes this endpoint as of 2026-06-11. The previous implementation returned distinct `exists: false / EMAIL_NOT_FOUND` vs `exists: true, emailVerified, hasPassword, locked, lockedUntil` responses, which turned the user table into a discoverable address book — the rate limit (10/min/IP) is trivially bypassed via IP rotation. The forgot-password endpoint correctly hides existence; this one was leaking it. Current contract: always returns a uniform safe-default payload regardless of whether the email is registered. Failed-auth UX must live in the NextAuth signin response, not here. Kept reachable (rather than deleted) so existing/future callers don't 404; the response shape is unchanged.

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
| Auth | Staff only |

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
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

### Blog

#### `GET, POST /api/blog/[slug]/comments`

API endpoint at /api/blog/[slug]/comments

| Property | Value |
|----------|-------|
| File | `src/app/api/blog/[slug]/comments/route.ts` |
| Auth | Super admin only |
| Params | `slug` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(_req: NextRequest, { params }: RouteCtx) {...

export async function POST(req: NextRequest, { params }: RouteCtx) {...
```

</details>

#### `GET /api/blog/categories`

API: Public Blog Categories GET /api/blog/categories - List active categories for public use

| Property | Value |
|----------|-------|
| File | `src/app/api/blog/categories/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...
```

</details>

#### `PATCH, DELETE /api/blog/comments/[id]`

Moderate a comment — staff-only. Sets status to hidden/visible so a comment can be pulled from public view without hard-deleting it (reversible). The public thread already filters to status = visible.

| Property | Value |
|----------|-------|
| File | `src/app/api/blog/comments/[id]/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function PATCH(req: NextRequest, { params }: RouteCtx) {...

export async function DELETE(_req: NextRequest, { params }: RouteCtx) {...
```

</details>

#### `GET /api/blog/my-submissions`

API: My Blog Submissions GET /api/blog/my-submissions Returns the list of blog submissions belonging to the authenticated user so submitters can track status, feedback, and next steps.

| Property | Value |
|----------|-------|
| File | `src/app/api/blog/my-submissions/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {...
```

</details>

#### `POST /api/blog/submissions/[id]/resubmit`

API: Resubmit a blog submission POST /api/blog/submissions/[id]/resubmit Allows the original submitter to update the content of a submission that the admin marked as `requires_changes` and send it back into the review queue. Notifies staff that a revision is waiting.

| Property | Value |
|----------|-------|
| File | `src/app/api/blog/submissions/[id]/resubmit/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string }>(...
```

</details>

#### `GET /api/blog/submit`

API: Blog Submissions (Admin) GET /api/blog/submit - Admin: List all submissions For public submissions, use POST /api/public/blog/submit

| Property | Value |
|----------|-------|
| File | `src/app/api/blog/submit/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('content', async (request: NextRequest, session: ValidSession) => {...
```

</details>

### Careers

#### `GET /api/careers`

Public careers list GET /api/careers

| Property | Value |
|----------|-------|
| File | `src/app/api/careers/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/careers/[slug]`

Public career posting detail GET /api/careers/[slug]

| Property | Value |
|----------|-------|
| File | `src/app/api/careers/[slug]/route.ts` |
| Auth | None |
| Params | `slug` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(_request: NextRequest, context: { params: Promise<Params> }) {...
```

</details>

#### `POST /api/careers/[slug]/apply`

Submit job application POST /api/careers/[slug]/apply

| Property | Value |
|----------|-------|
| File | `src/app/api/careers/[slug]/apply/route.ts` |
| Auth | Authenticated users |
| Params | `slug` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest, context: { params: Promise<Params> }) {...
```

</details>

#### `POST /api/careers/upload-cv`

POST /api/careers/upload-cv — guest + logged-in CV upload (PDF only)

| Property | Value |
|----------|-------|
| File | `src/app/api/careers/upload-cv/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Cron

#### `GET /api/cron/close-decisions`

Cron: Auto-close decisions past their voting deadline GET /api/cron/close-decisions Checks for decisions in 'voting' status with a voting_deadline in the past, and transitions them to 'closed'. Protected by CRON_SECRET.

| Property | Value |
|----------|-------|
| File | `src/app/api/cron/close-decisions/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/cron/close-it-hilfe-requests`

Cron: Auto-expire IT-Hilfe requests past their deadline GET /api/cron/close-it-hilfe-requests Transitions every OPEN request with `expires_at < NOW()` to status EXPIRED. Mirrors the cron-secret + telemetry pattern of /api/cron/close-decisions. Bulk UPDATE — no per-row state-machine validation needed; the cron owns this transition end-to-end. Offers attached to an expiring request stay PENDING (matches the existing `request_expires_at` rendering in /it-hilfe/my/offers which already badges them "Abgelaufen" based on the timestamp).

| Property | Value |
|----------|-------|
| File | `src/app/api/cron/close-it-hilfe-requests/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/cron/prune-audit-log`

Cron — prune `auth_audit_log` entries older than 180 days. Audit-log retention policy: 180 days is the default. Critical events (super-admin changes, user deletions) get severity=critical and are preserved indefinitely — the WHERE filter excludes them. Triggered daily at 02:00 UTC by a systemd timer on the self-hosted box (revampit-cron@prune-audit-log.timer → scripts/ops/run-cron.sh). Protected by CRON_SECRET (Authorization: Bearer ...) — external callers without the secret get 401. Idempotent — running twice in the same window is a no-op.

| Property | Value |
|----------|-------|
| File | `src/app/api/cron/prune-audit-log/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/cron/release-escrow`

Cron: Auto-release escrow funds past their release deadline GET /api/cron/release-escrow Escrow payments (workshop/appointment with useEscrow=true) are only AUTHORIZED at checkout — the funds are held, not captured. They are normally captured when the buyer releases them (POST /api/payments/escrow/[id]). This cron is the safety net: any escrow still 'active' past its release_deadline is captured so Revamp-IT actually receives the money before the Payrexx reservation expires (~7 days). Protected by CRON_SECRET. Scheduled by revampit-cron@release-escrow.timer.

| Property | Value |
|----------|-------|
| File | `src/app/api/cron/release-escrow/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/cron/timecard-reminders`

Cron: monthly Zeiterfassung reminders. GET /api/cron/timecard-reminders — daily (systemd revampit-cron@ template on prod). For every active team profile whose zeiterfassung_reminder_day equals today (Europe/Zurich) and whose current-month card is not yet submitted/approved: one in-app notification (+ e-mail via the notification pipeline) linking straight to /admin/zeiterfassung, where «Monat aus Plan füllen & einreichen» finishes the job in one click. Protected by CRON_SECRET (Authorization: Bearer ...).

| Property | Value |
|----------|-------|
| File | `src/app/api/cron/timecard-reminders/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/cron/wake-recurring-tasks`

Cron: Wake recurring_scheduled tasks when their schedule fires. GET /api/cron/wake-recurring-tasks Schedule: daily at 07:00 Zurich (systemd timer on the self-hosted box). We run once per day and let the per-task schedule_cron expression drive whether it's actually that task's day. Sufficient for the realistic patterns (weekly chores, daily routines, monthly checks) — `.prev()` still gives the most recent scheduled fire time and the "already-completed-this-iteration" check prevents double-fires. Sub-daily schedule_cron expressions (e.g. "every 4 hours") won't fire as intended under this constraint. Why: tasks with task_type='recurring_scheduled' and a schedule_cron expression are supposed to surface in the team queue on every scheduled run (e.g. "clean kitchen every Monday at 08:00"). Without this worker, the schedule_cron column was decorative — completing a recurring task reset it to 'idle' but nothing ever flipped it back to 'needs_attention'. Per the BB audit's recurring-task finding. Algorithm: For each active recurring_scheduled task with schedule_cron set, parse the cron expression in Europe/Zurich tz, get the most recent scheduled fire time (`.prev()`). If: - the task isn't already 'needs_attention' or 'in_progress', AND - the task hasn't been completed at-or-after that fire time then flip to 'needs_attention' and notify the assignee (or all staff if it's an unassigned broadcast). Protected by CRON_SECRET (Authorization: Bearer ...).

| Property | Value |
|----------|-------|
| File | `src/app/api/cron/wake-recurring-tasks/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

### Decisions

#### `GET, POST /api/decisions`

Decisions List API GET  /api/decisions - List decisions with filters POST /api/decisions - Create new decision

| Property | Value |
|----------|-------|
| File | `src/app/api/decisions/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...

export const POST = withAdmin(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PATCH, DELETE /api/decisions/[id]`

Decision Detail API GET    /api/decisions/[id] - Get single decision PATCH  /api/decisions/[id] - Update decision (draft/discussion only) DELETE /api/decisions/[id] - Delete decision (creator or super admin)

| Property | Value |
|----------|-------|
| File | `src/app/api/decisions/[id]/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const PATCH = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const DELETE = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `GET, POST /api/decisions/[id]/comments`

Decision Comments API GET  /api/decisions/[id]/comments - Get comments for a decision POST /api/decisions/[id]/comments - Create a comment

| Property | Value |
|----------|-------|
| File | `src/app/api/decisions/[id]/comments/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const POST = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `PATCH, DELETE /api/decisions/[id]/comments/[commentId]`

Decision Comment Detail API PATCH  /api/decisions/[id]/comments/[commentId] - Update comment DELETE /api/decisions/[id]/comments/[commentId] - Delete comment

| Property | Value |
|----------|-------|
| File | `src/app/api/decisions/[id]/comments/[commentId]/route.ts` |
| Auth | None |
| Params | `id`, `commentId` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const DELETE = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/decisions/[id]/create-task`

Create Follow-up Task from Decision API POST /api/decisions/[id]/create-task Links a closed protocol-spawned decision to a new task via protocol_action_links.

| Property | Value |
|----------|-------|
| File | `src/app/api/decisions/[id]/create-task/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/decisions/[id]/narrative`

Decision narrative API POST /api/decisions/[id]/narrative — generate the AI Beschluss text for a closed decision. Runs only when a staff member clicks for it: closing a decision (by hand or by the deadline cron) no longer calls the model.

| Property | Value |
|----------|-------|
| File | `src/app/api/decisions/[id]/narrative/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  async (_request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/decisions/[id]/send-invitations`

POST /api/decisions/[id]/send-invitations Re-sends the "voting opened" email to eligible participants who have not yet cast a vote. Does NOT create duplicate in-app notifications — email only.

| Property | Value |
|----------|-------|
| File | `src/app/api/decisions/[id]/send-invitations/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<{ id: string }>(...
```

</details>

#### `POST /api/decisions/[id]/transition`

Decision Transition API POST /api/decisions/[id]/transition - Change decision status

| Property | Value |
|----------|-------|
| File | `src/app/api/decisions/[id]/transition/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `GET, POST /api/decisions/[id]/votes`

Decision Votes API GET  /api/decisions/[id]/votes - Get votes for a decision POST /api/decisions/[id]/votes - Submit or update vote

| Property | Value |
|----------|-------|
| File | `src/app/api/decisions/[id]/votes/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const POST = withAuth<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `GET /api/decisions/[id]/votes/participation`

Decision Participation API GET /api/decisions/[id]/votes/participation - Get participation status

| Property | Value |
|----------|-------|
| File | `src/app/api/decisions/[id]/votes/participation/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

### Deliverables

#### `GET, POST /api/deliverables`

API endpoint at /api/deliverables

| Property | Value |
|----------|-------|
| File | `src/app/api/deliverables/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(
  'deliverables',
  async (request: NextRequest, session: ValidSession) => {...

export const POST = withAdmin(
  'deliverables',
  async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PATCH, DELETE /api/deliverables/[id]`

Deliverable detail API GET    /api/deliverables/[id] - deliverable + feedback thread PATCH  /api/deliverables/[id] - update fields / status DELETE /api/deliverables/[id] - delete (cascades feedback)

| Property | Value |
|----------|-------|
| File | `src/app/api/deliverables/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<RouteParams>(
  'deliverables',
  async (_request: NextRequest, session: ValidSession, context) => {...

export const PATCH = withAdmin<RouteParams>(
  'deliverables',
  async (request: NextRequest, session: ValidSession, context) => {...

export const DELETE = withAdmin<RouteParams>(
  'deliverables',
  async (_request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `GET /api/deliverables/[id]/agent-brief`

Agent brief (§4.8) — GET /api/deliverables/[id]/agent-brief The whole automation bridge: returns a ready-to-run prompt + the structured pieces (open change requests, source_path, meta). L0 = a human copies this into Claude Code; L1/L2 later fire it at an agent — the brief is identical.

| Property | Value |
|----------|-------|
| File | `src/app/api/deliverables/[id]/agent-brief/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<RouteParams>(
  'deliverables',
  async (_request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/deliverables/[id]/ask`

Ask Hirn about a deliverable (admin / logged-in). POST /api/deliverables/[id]/ask  { message, history? } → { reply, replies }

| Property | Value |
|----------|-------|
| File | `src/app/api/deliverables/[id]/ask/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  'deliverables',
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST, PATCH /api/deliverables/[id]/feedback`

Deliverable feedback API (internal / logged-in staff). POST  /api/deliverables/[id]/feedback  - add comment / change_request / approval PATCH /api/deliverables/[id]/feedback  - resolve a change_request (status) External (no-login) feedback comes through /api/public/share/[token].

| Property | Value |
|----------|-------|
| File | `src/app/api/deliverables/[id]/feedback/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  'deliverables',
  async (request: NextRequest, session: ValidSession, context) => {...

export const PATCH = withAdmin<RouteParams>(
  'deliverables',
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/deliverables/[id]/reindex`

Reindex a deliverable into the Hirn RAG store on demand. POST /api/deliverables/[id]/reindex → { indexed: true }

| Property | Value |
|----------|-------|
| File | `src/app/api/deliverables/[id]/reindex/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  'deliverables',
  async (_request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/deliverables/[id]/share`

Share link — POST /api/deliverables/[id]/share Generates (once) an unguessable share_token so the deliverable can be opened externally at /d/<token> with read + comment, no login. Returns the token.

| Property | Value |
|----------|-------|
| File | `src/app/api/deliverables/[id]/share/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  'deliverables',
  async (_request: NextRequest, session: ValidSession, context) => {...
```

</details>

### Donations

#### `POST /api/donations/dropoff`

POST /api/donations/dropoff — public donation drop-off announcement Mirrors the inquiry route shape (rate-limited, validated, two fire-and- forget emails). No DB persist here: a drop-off announcement is an intent, not a recorded donation — staff records the actual donation in /admin/donations once the devices physically arrive. Keeping the public route emails-only avoids forcing staff to deduplicate every donation row against the visitor-typed device list.

| Property | Value |
|----------|-------|
| File | `src/app/api/donations/dropoff/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Health

#### `GET /api/health`

Health Check API GET /api/health Returns the health status of all services

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

#### `GET /api/health/ai`

API endpoint at /api/health/ai

| Property | Value |
|----------|-------|
| File | `src/app/api/health/ai/route.ts` |
| Auth | None |

#### `GET /api/health/auth`

API endpoint at /api/health/auth

| Property | Value |
|----------|-------|
| File | `src/app/api/health/auth/route.ts` |
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

### Hirn

#### `POST /api/hirn/chat`

API: Hirn Public Chat POST /api/hirn/chat Page-aware assistant chat for logged-in users on the public site. ISOLATION (deliberate — do not "unify" with the admin route): - no RAG retrieval (hirn_documents hold internal finance/personnel data) - no action cockpit (actions are staff-only) - public-safe system prompt (buildPublicSystemPrompt) Only the provider layer is shared with /api/admin/hirn/chat (SSOT). History is client-held (capped), not persisted server-side.

| Property | Value |
|----------|-------|
| File | `src/app/api/hirn/chat/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth(async (request: NextRequest, session) => {...
```

</details>

### Inquiry

#### `POST /api/inquiry`

API endpoint at /api/inquiry

| Property | Value |
|----------|-------|
| File | `src/app/api/inquiry/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Inventory

#### `GET, POST /api/inventory/import-csv`

API endpoint at /api/inventory/import-csv

| Property | Value |
|----------|-------|
| File | `src/app/api/inventory/import-csv/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin('products', async (_request: NextRequest, session: ValidSession) => {...

export const POST = withAdmin('products', async (request: NextRequest, session: ValidSession) => {...
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
export const GET = withAuth(async (request: NextRequest, session) => {...

export const POST = withAuth(async (request, session) => {...
```

</details>

#### `GET, PUT, DELETE /api/invoices/[id]`

API endpoint at /api/invoices/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/invoices/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth<{ id: string }>(async (request, session, context) => {...

export const PUT = withAuth<{ id: string }>(async (request: NextRequest, session, context) => {...

export const DELETE = withAuth<{ id: string }>(async (request, session, context) => {...
```

</details>

#### `GET, POST /api/invoices/[id]/pdf`

API endpoint at /api/invoices/[id]/pdf

| Property | Value |
|----------|-------|
| File | `src/app/api/invoices/[id]/pdf/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth<{ id: string }>(async (request, session, context) => {...

export const POST = withAuth<{ id: string }>(async (request, session, context) => {...
```

</details>

### It-hilfe

#### `POST /api/it-hilfe/accept-offer-via-token`

POST /api/it-hilfe/accept-offer-via-token Body: { token: string } One-tap offer acceptance from an emailed link. The HMAC-signed token is the proof of authorization — it encodes the offerId and was sent to the request owner's verified email when the offer was created. The page route at /it-hilfe/accept (commit 2b-2) renders a single "Confirm" button that POSTs to this endpoint, deliberately keeping the state-mutating action behind a click to defeat email-prefetcher pre-clicks. Returns the requestId on success so the page route can redirect to /it-hilfe/<requestId>?accepted=1.

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/accept-offer-via-token/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/it-hilfe/helper/matching-requests`

API endpoint at /api/it-hilfe/helper/matching-requests

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/helper/matching-requests/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(_request: NextRequest) {...
```

</details>

#### `GET /api/it-hilfe/helper/my-offers`

API endpoint at /api/it-hilfe/helper/my-offers

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/helper/my-offers/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(_request: NextRequest) {...
```

</details>

#### `GET /api/it-hilfe/my-offers`

GET /api/it-hilfe/my-offers Get current user's submitted offers

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/my-offers/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET /api/it-hilfe/my-requests`

GET /api/it-hilfe/my-requests Get current user's IT-Hilfe requests

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/my-requests/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, POST /api/it-hilfe/requests`

GET /api/it-hilfe/requests Browse IT-Hilfe requests with filters (public)

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/requests/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export async function POST(request: NextRequest) {...
```

</details>

#### `GET, PUT /api/it-hilfe/requests/[id]`

GET /api/it-hilfe/requests/[id] Get request details (public)

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/requests/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, { params }: RouteParams) {...

export async function PUT(request: NextRequest, { params }: RouteParams) {...
```

</details>

#### `POST /api/it-hilfe/requests/[id]/complete`

POST /api/it-hilfe/requests/[id]/complete Helper marks an IT-Hilfe request as completed. Caller must own the accepted offer on this request. Sets status to 'completed' and notifies the requester to confirm and leave a review.

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/requests/[id]/complete/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string }>(...
```

</details>

#### `POST /api/it-hilfe/requests/[id]/confirm-review`

POST /api/it-hilfe/requests/[id]/confirm-review Requester confirms a completed IT-Hilfe request and submits a review. Creates a published review record tied to the helper and stamps reviewed_at on the request.

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/requests/[id]/confirm-review/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string }>(...
```

</details>

#### `POST /api/it-hilfe/requests/[id]/conversation`

POST /api/it-hilfe/requests/[id]/conversation Open (find-or-create) a pre-acceptance conversation so the requester and a technician can align on scope BEFORE an offer is accepted: - Requester → an offerer: body { withUserId } must be someone who has an offer on this request. - Technician (non-owner) → the requester: only while the request is OPEN (ask a question before offering). Returns { conversationId }. Rate-limited like messaging.

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/requests/[id]/conversation/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest, { params }: RouteParams) {...
```

</details>

#### `GET /api/it-hilfe/requests/[id]/matches`

IT-Hilfe Matching API GET /api/it-hilfe/requests/[id]/matches - Find matching helpers for a request

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/requests/[id]/matches/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, { params }: RouteParams) {...
```

</details>

#### `GET, POST /api/it-hilfe/requests/[id]/offers`

GET /api/it-hilfe/requests/[id]/offers Get offers for a request (owner only)

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/requests/[id]/offers/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, { params }: RouteParams) {...

export async function POST(request: NextRequest, { params }: RouteParams) {...
```

</details>

#### `DELETE /api/it-hilfe/requests/[id]/offers/[offerId]`

DELETE /api/it-hilfe/requests/[id]/offers/[offerId] Withdraw a pending offer (offer owner only)

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/requests/[id]/offers/[offerId]/route.ts` |
| Auth | Authenticated users |
| Params | `id`, `offerId` |

<details>
<summary>Code Preview</summary>

```typescript
export async function DELETE(request: NextRequest, { params }: RouteParams) {...
```

</details>

#### `POST /api/it-hilfe/requests/[id]/offers/[offerId]/accept`

POST /api/it-hilfe/requests/[id]/offers/[offerId]/accept Accept an offer (request owner only — authenticated session). The state-change semantics live in @/lib/it-hilfe/accept-offer; this route is just the session-authenticated transport. A second route (in a follow-up commit) reuses the same helper for token-driven one-tap acceptance via email.

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/requests/[id]/offers/[offerId]/accept/route.ts` |
| Auth | Authenticated users |
| Params | `id`, `offerId` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(_request: NextRequest, { params }: RouteParams) {...
```

</details>

#### `POST /api/it-hilfe/requests/[id]/offers/[offerId]/decline`

POST /api/it-hilfe/requests/[id]/offers/[offerId]/decline Decline an offer (request owner only)

| Property | Value |
|----------|-------|
| File | `src/app/api/it-hilfe/requests/[id]/offers/[offerId]/decline/route.ts` |
| Auth | Authenticated users |
| Params | `id`, `offerId` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest, { params }: RouteParams) {...
```

</details>

### Listings

#### `GET, POST /api/listings`

GET /api/listings — Public browse with filters, search, pagination POST /api/listings — Authenticated: create a new listing

| Property | Value |
|----------|-------|
| File | `src/app/api/listings/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PATCH, DELETE /api/listings/[id]`

GET /api/listings/[id]  — Public detail (increments view count) PATCH /api/listings/[id] — Owner only: update listing DELETE /api/listings/[id] — Owner or admin: soft delete

| Property | Value |
|----------|-------|
| File | `src/app/api/listings/[id]/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {...

export const PATCH = withAuth<{ id: string }>(...

export const DELETE = withAuth<{ id: string }>(...
```

</details>

#### `POST /api/listings/[id]/contact`

POST /api/listings/[id]/contact — Send message to listing seller Creates or reuses a marketplace conversation and sends the initial message. Uses existing messaging system with context_type='marketplace'.

| Property | Value |
|----------|-------|
| File | `src/app/api/listings/[id]/contact/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string }>(...
```

</details>

#### `POST /api/listings/[id]/duplicate`

POST /api/listings/[id]/duplicate — Duplicate a listing as draft Copies listing fields and specs (not images) with status=draft.

| Property | Value |
|----------|-------|
| File | `src/app/api/listings/[id]/duplicate/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string }>(...
```

</details>

#### `POST /api/listings/[id]/favorite`

POST /api/listings/[id]/favorite — Toggle favorite (authenticated) INSERT ON CONFLICT → DELETE pattern for toggle behavior. Favorite counts are maintained by DB triggers.

| Property | Value |
|----------|-------|
| File | `src/app/api/listings/[id]/favorite/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string }>(...
```

</details>

#### `GET, POST /api/listings/[id]/questions`

GET  /api/listings/[id]/questions — Public Q&A for a listing POST /api/listings/[id]/questions — Ask a public question (auth required)

| Property | Value |
|----------|-------|
| File | `src/app/api/listings/[id]/questions/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {...

export const POST = withAuth<{ id: string }>(...
```

</details>

#### `POST /api/listings/[id]/questions/[questionId]/answer`

POST /api/listings/[id]/questions/[questionId]/answer Seller answers a public listing question.

| Property | Value |
|----------|-------|
| File | `src/app/api/listings/[id]/questions/[questionId]/answer/route.ts` |
| Auth | None |
| Params | `id`, `questionId` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string; questionId: string }>(...
```

</details>

#### `POST /api/listings/[id]/report`

POST /api/listings/[id]/report — Report a listing Authenticated users can report a listing once (UNIQUE constraint).

| Property | Value |
|----------|-------|
| File | `src/app/api/listings/[id]/report/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string }>(...
```

</details>

#### `GET /api/listings/favorites`

GET /api/listings/favorites — Get user's favorited listings

| Property | Value |
|----------|-------|
| File | `src/app/api/listings/favorites/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET /api/listings/mine`

GET /api/listings/mine — My listings (authenticated) Keyset-paginated: `?after=<uuid>&limit=<n>&status=<filter>`. Sort order: created_at DESC, id DESC. Cursor is the last item's id; we look up that row to get its created_at and build a tuple- comparison WHERE clause — clients never need to send the timestamp. Response shape: `{ items, nextCursor, total }`. total is included so the UI can show "X Inserate" without a second round-trip; if it proves to be the slow part at scale it can be dropped to an on-demand endpoint.

| Property | Value |
|----------|-------|
| File | `src/app/api/listings/mine/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET /api/listings/similar`

GET /api/listings/similar?listing_id=X&limit=4 Returns similar listings based on same category and similar price range.

| Property | Value |
|----------|-------|
| File | `src/app/api/listings/similar/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
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
export const GET = withAuth(async (request: NextRequest, session) => {...

export const POST = withAuth(async (request: NextRequest, session) => {...
```

</details>

#### `GET, PUT, DELETE /api/locations/[id]`

API endpoint at /api/locations/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/locations/[id]/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {...

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {...

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },...
```

</details>

#### `POST /api/locations/[id]/approve`

API endpoint at /api/locations/[id]/approve

| Property | Value |
|----------|-------|
| File | `src/app/api/locations/[id]/approve/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {...
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
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {...

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {...
```

</details>

### Marketplace

#### `POST /api/marketplace/cart/checkout`

POST /api/marketplace/cart/checkout Multi-item checkout for the RevampIT shop cart. Creates ONE marketplace order (seller = the Revamp-IT org account, 0 commission) with N marketplace_order_items, reserves every listing, and opens a single Payrexx gateway for the total. Only is_revampit listings are accepted — community P2P listings use the single-item /api/marketplace/orders flow.

| Property | Value |
|----------|-------|
| File | `src/app/api/marketplace/cart/checkout/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `POST /api/marketplace/cart/validate`

POST /api/marketplace/cart/validate Availability check for the client-side cart (localStorage, no server cart). A stored cart can go stale — items sell out or get reserved while the buyer is away. The cart page calls this on load and drops unavailable items up front instead of letting checkout fail with a locked-row error. Available = listing exists, status 'active', is_revampit (cart is RevampIT shop stock only). Public data, so no auth — but rate-limited like browse.

| Property | Value |
|----------|-------|
| File | `src/app/api/marketplace/cart/validate/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET, POST /api/marketplace/orders`

POST /api/marketplace/orders — Create order + Payrexx reservation gateway GET  /api/marketplace/orders — List my orders (buyer or seller)

| Property | Value |
|----------|-------|
| File | `src/app/api/marketplace/orders/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PATCH /api/marketplace/orders/[id]`

GET   /api/marketplace/orders/[id] — Order detail (buyer or seller only) PATCH /api/marketplace/orders/[id] — Update order status (role-based transitions)

| Property | Value |
|----------|-------|
| File | `src/app/api/marketplace/orders/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth<{ id: string }>(...

export const PATCH = withAuth<{ id: string }>(...
```

</details>

#### `POST /api/marketplace/orders/[id]/confirm-receipt`

POST /api/marketplace/orders/[id]/confirm-receipt Buyer confirms they received the item. Transitions the order to 'completed' (final state), releases any Payrexx escrow hold, updates the listing to sold, notifies the seller, and prompts the buyer to leave a review. Allowed current states: 'shipped' or 'delivered'.

| Property | Value |
|----------|-------|
| File | `src/app/api/marketplace/orders/[id]/confirm-receipt/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string }>(...
```

</details>

#### `POST /api/marketplace/orders/[id]/review`

POST /api/marketplace/orders/[id]/review Buyer leaves a review on a completed marketplace order. Creates a row in `reviews` (target_type='listing', target_id=listing.id), updates the seller's average rating, and notifies the seller.

| Property | Value |
|----------|-------|
| File | `src/app/api/marketplace/orders/[id]/review/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string }>(...
```

</details>

### Me

#### `PATCH /api/me/preferences`

API endpoint at /api/me/preferences

| Property | Value |
|----------|-------|
| File | `src/app/api/me/preferences/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAuth(async (request: NextRequest, session) => {...
```

</details>

### Members

#### `GET /api/members/[id]`

GET /api/members/[id] — Public member (buyer) profile. A person's PUBLIC community reputation: reviews they have written and the helpful votes those earned, plus member-since. This is the buyer-side half of the trust loop — sellers are trusted via ratings received, members via the reviews they contribute. All data returned here is already public (reviewer names show on listing pages); this endpoint only collects it. Privacy: a profile exists ONLY for people with a public footprint — at least one published review OR a seller profile. Purely-private accounts (bought something, never reviewed, never sold) return 404, so accounts aren't enumerable and no private data is ever exposed.

| Property | Value |
|----------|-------|
| File | `src/app/api/members/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {...
```

</details>

### Membership

#### `POST /api/membership/apply`

API endpoint at /api/membership/apply

| Property | Value |
|----------|-------|
| File | `src/app/api/membership/apply/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Messages

#### `GET, POST /api/messages`

API endpoint at /api/messages

| Property | Value |
|----------|-------|
| File | `src/app/api/messages/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET /api/messages/[conversationId]`

API endpoint at /api/messages/[conversationId]

| Property | Value |
|----------|-------|
| File | `src/app/api/messages/[conversationId]/route.ts` |
| Auth | None |
| Params | `conversationId` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth<{ conversationId: string }>(...
```

</details>

#### `GET, POST /api/messages/conversations`

API endpoint at /api/messages/conversations

| Property | Value |
|----------|-------|
| File | `src/app/api/messages/conversations/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {...
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

#### `GET, POST /api/newsletter/subscribe`

API endpoint at /api/newsletter/subscribe

| Property | Value |
|----------|-------|
| File | `src/app/api/newsletter/subscribe/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(async (_request, _session) => {...

export async function POST(request: NextRequest) {...
```

</details>

### Notifications

#### `GET, PATCH /api/notifications`

Notifications API GET  /api/notifications        - List current user's notifications (unread first, last 30) PATCH /api/notifications       - Mark all notifications as read

| Property | Value |
|----------|-------|
| File | `src/app/api/notifications/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {...

export const PATCH = withAuth(async (_request: NextRequest, session: ValidSession) => {...
```

</details>

#### `PATCH /api/notifications/[id]`

Single Notification API PATCH /api/notifications/[id] - Mark a single notification as read

| Property | Value |
|----------|-------|
| File | `src/app/api/notifications/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAuth<{ id: string }>(...
```

</details>

### Org-numbers

#### `GET /api/org-numbers`

GET /api/org-numbers Returns organizational numbers, optionally filtered by category. Query params: ?category=impact|social|economic|operations Falls back to static defaults if DB is unavailable.

| Property | Value |
|----------|-------|
| File | `src/app/api/org-numbers/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

### Payments

#### `GET, POST /api/payments/escrow/[id]`

API endpoint at /api/payments/escrow/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/payments/escrow/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth<{ id: string }>(async (request, session, context) => {...

export const POST = withAuth<{ id: string }>(async (request, session, context) => {...
```

</details>

#### `GET /api/payments/mock-redirect`

GET /api/payments/mock-redirect — generic dev mock checkout for NEW rails. Rails without a local sandbox (Taler, BTCPay) return a link here when unconfigured. "Jetzt bezahlen" POSTs a NORMALIZED webhook ({ referenceId, providerTxId, status, amount, currency }) to `/api/payments/webhook/<provider>`, which the adapter reads via `parseMockWebhook`. Blocked in production.

| Property | Value |
|----------|-------|
| File | `src/app/api/payments/mock-redirect/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/payments/payrexx-mock-redirect`

GET /api/payments/payrexx-mock-redirect — Dev mock for Payrexx payment page. Renders a minimal HTML page simulating Payrexx's hosted payment experience. "Pay Now" triggers our webhook with reserved status, then redirects to success. "Cancel" redirects to the cancel URL. Only active when PAYREXX_INSTANCE is not set (dev mode).

| Property | Value |
|----------|-------|
| File | `src/app/api/payments/payrexx-mock-redirect/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `POST /api/payments/payrexx-webhook`

POST /api/payments/payrexx-webhook — Handles Payrexx webhook callbacks. Payrexx sends transaction status updates here. We use the referenceId to look up the matching record — first in marketplace orders, then in payment transactions (workshops, appointments). Key statuses: reserved  → payment held (marketplace order paid / generic payment succeeded) confirmed → payment captured (order completed) cancelled → reservation released declined  → payment failed refunded / partially-refunded → refund processed

| Property | Value |
|----------|-------|
| File | `src/app/api/payments/payrexx-webhook/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/payments/providers`

GET /api/payments/providers — rails offerable to the customer right now. The payment method picker calls this. `?escrow=1` filters to escrow-capable rails (P2P marketplace needs holds). In production only configured rails are returned, so the picker auto-hides until a second rail goes live.

| Property | Value |
|----------|-------|
| File | `src/app/api/payments/providers/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
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
export const POST = withAuth(async (request, session) => {...
```

</details>

#### `POST /api/payments/webhook/[provider]`

POST /api/payments/webhook/[provider] — unified multi-rail webhook. One entry point for every NEW rail (Taler, BTCPay, …). Each provider's adapter authenticates the delivery (`verifyWebhook`) and normalizes it (`parseWebhook`) into { referenceId, providerTxId, status, amountClaim }; from there the SAME hardened reconciliation engine that serves Payrexx handles the state machine (amount verification, atomic listing restore, Kivvi sync). NOTE: the incumbent Payrexx webhook keeps its dedicated route (`/api/payments/payrexx-webhook`) because that URL is configured in the Payrexx dashboard. This route additionally accepts `payrexx` for uniformity.

| Property | Value |
|----------|-------|
| File | `src/app/api/payments/webhook/[provider]/route.ts` |
| Auth | None |
| Params | `provider` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Pools

#### `GET, POST /api/pools`

GET  /api/pools — Browse active subscription pools POST /api/pools — Create a new subscription pool (authenticated)

| Property | Value |
|----------|-------|
| File | `src/app/api/pools/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...

export const POST = withAuth(async (request: NextRequest, session) => {...
```

</details>

#### `GET, DELETE /api/pools/[id]`

GET    /api/pools/[id] — Pool detail with members DELETE /api/pools/[id] — Delete pool (owner only)

| Property | Value |
|----------|-------|
| File | `src/app/api/pools/[id]/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(_request: NextRequest, context: { params: Promise<Params> }) {...

export const DELETE = withAuth(
  async (_request: NextRequest, session, context?: { params?: Params }) => {...
```

</details>

#### `POST /api/pools/[id]/join`

POST /api/pools/[id]/join — Join a subscription pool

| Property | Value |
|----------|-------|
| File | `src/app/api/pools/[id]/join/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth(
  async (_request: NextRequest, session, context?: { params?: Params }) => {...
```

</details>

#### `POST /api/pools/[id]/leave`

POST /api/pools/[id]/leave — Leave a subscription pool

| Property | Value |
|----------|-------|
| File | `src/app/api/pools/[id]/leave/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth(
  async (_request: NextRequest, session, context?: { params?: Params }) => {...
```

</details>

#### `GET /api/pools/my`

GET /api/pools/my — Return pool IDs the current user is a member of

| Property | Value |
|----------|-------|
| File | `src/app/api/pools/my/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (_request, session) => {...
```

</details>

### Presentations

#### `GET, POST /api/presentations/comments`

GET = "who am I" for the comment form, so a signed-in reader doesn't retype their name and we can show "Kommentar als <Name>".

| Property | Value |
|----------|-------|
| File | `src/app/api/presentations/comments/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...

export async function POST(req: NextRequest) {...
```

</details>

### Profiles

#### `GET /api/profiles/[id]`

GET /api/profiles/[id] — Unified public profile. One person, everything they publicly offer: marketplace listings, technician services, workshops, authored content, plus their two-sided reputation. Backs the public profile page rendered at both /members/[id] and /sellers/[id].

| Property | Value |
|----------|-------|
| File | `src/app/api/profiles/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {...
```

</details>

### Projects

#### `POST /api/projects/[slug]/contributions`

POST /api/projects/[slug]/contributions — Visitor offers help on a project. Optionally tied to a specific project_need via need_id. Persists the offer, fires staff-notification + visitor-confirmation emails (fire-and-forget with both `.then(check .success)` AND `.catch()` per the documented swallow pattern in inquiry/route.ts). Public + unauthenticated, rate-limited by IP.

| Property | Value |
|----------|-------|
| File | `src/app/api/projects/[slug]/contributions/route.ts` |
| Auth | None |
| Params | `slug` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest, context: RouteContext) {...
```

</details>

#### `GET /api/projects/[slug]/needs`

GET /api/projects/[slug]/needs — Public list of open needs for a project. Used by the project detail page (e.g. /projects/upcycling) to render the "what we need" section with per-need "I can help" CTAs.

| Property | Value |
|----------|-------|
| File | `src/app/api/projects/[slug]/needs/route.ts` |
| Auth | None |
| Params | `slug` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, context: RouteContext) {...
```

</details>

### Protocols

#### `GET, POST /api/protocols`

Protocols API GET /api/protocols - List protocols with filters POST /api/protocols - Create a new protocol Created: 2026-02-10

| Property | Value |
|----------|-------|
| File | `src/app/api/protocols/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {...

export const POST = withAdmin(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PATCH, DELETE /api/protocols/[id]`

Protocol Detail API GET /api/protocols/[id] - Get single protocol PATCH /api/protocols/[id] - Update protocol (draft/review only) DELETE /api/protocols/[id] - Delete protocol (creator or super admin) Created: 2026-02-10

| Property | Value |
|----------|-------|
| File | `src/app/api/protocols/[id]/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const PATCH = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const DELETE = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `GET, POST /api/protocols/[id]/actions`

Protocol Action Links API GET /api/protocols/[id]/actions - Get action links for a protocol POST /api/protocols/[id]/actions - Create task from action item Created: 2026-02-10

| Property | Value |
|----------|-------|
| File | `src/app/api/protocols/[id]/actions/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const POST = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/protocols/[id]/finalize`

Protocol Finalize API POST /api/protocols/[id]/finalize - Mark protocol as finalized Created: 2026-02-10

| Property | Value |
|----------|-------|
| File | `src/app/api/protocols/[id]/finalize/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/protocols/[id]/import-tasks`

Protocol Import Tasks API POST /api/protocols/[id]/import-tasks - Import task list (JSON or plain text) Created: 2026-02-10

| Property | Value |
|----------|-------|
| File | `src/app/api/protocols/[id]/import-tasks/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/protocols/[id]/process-notes`

Protocol Process Notes API POST /api/protocols/[id]/process-notes - Process notes (JSON or free text) Created: 2026-02-10

| Property | Value |
|----------|-------|
| File | `src/app/api/protocols/[id]/process-notes/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/protocols/[id]/process-sources`

Protocol Process Sources API — unified endpoint. POST /api/protocols/[id]/process-sources THE pipeline for audio/transcript protocols — used by the create page AND the detail-page retry. The legacy /process and /process-audio endpoints were removed; /process-notes remains only for direct JSON import (no AI) and /import-tasks for task lists. Accepts FormData with any combination of: - audio       — optional File (single) - text        — optional string (the textarea content) - textFile    — optional File (zero or many; FormData allows duplicate keys via getAll) - whisper_model — optional string (validated against WHISPER_MODELS) At least one of (audio, text, textFile) must be supplied. Audio is transcribed first, text inputs are read; the combined string is passed to the existing AI structuring service. Why unified: the old "pick one source" UX forced users to choose between a recording and notes for the same meeting. Real meetings have both. This endpoint concatenates them with named separators so the LLM has full context.

| Property | Value |
|----------|-------|
| File | `src/app/api/protocols/[id]/process-sources/route.ts` |
| Auth | Super admin only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `GET /api/protocols/templates`

Protocol Templates API GET /api/protocols/templates - Get meeting type templates Created: 2026-02-10

| Property | Value |
|----------|-------|
| File | `src/app/api/protocols/templates/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(async (_request: NextRequest, _session: ValidSession) => {...
```

</details>

### Public

#### `POST /api/public/blog/submit`

API: Public Blog Submission POST /api/public/blog/submit - Submit a blog post for review (public, no CSRF) This endpoint is in /api/public/ to bypass CSRF protection for anonymous submissions. Rate limiting is applied to prevent abuse.

| Property | Value |
|----------|-------|
| File | `src/app/api/public/blog/submit/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `POST /api/public/claim`

Public: a real person claims a placeholder account via their invite token. No auth — the single-use token IS the authorization.

| Property | Value |
|----------|-------|
| File | `src/app/api/public/claim/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

#### `GET /api/public/financials`

Public financial transparency API Returns yearly aggregates stripped of internal tracing metadata. No auth required — this data is public by design (mission: transparency).

| Property | Value |
|----------|-------|
| File | `src/app/api/public/financials/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...
```

</details>

#### `GET, POST /api/public/share/[token]`

Public share endpoint (no login) — reachable at /api/public/share/[token]. GET  - public-safe deliverable + feedback thread (no owner email / internal ids) POST - external reviewer adds feedback (requires a display name); notifies the owner's in-app bell via the service. Under /api/public/* so CSRF is not enforced (see src/proxy.ts) — a public comment form is intentionally open to anyone holding the unguessable link.

| Property | Value |
|----------|-------|
| File | `src/app/api/public/share/[token]/route.ts` |
| Auth | None |
| Params | `token` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {...

export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {...
```

</details>

#### `POST /api/public/share/[token]/ask`

Ask Hirn about a shared deliverable (public / no login). POST /api/public/share/[token]/ask  { message, history? } → { reply, replies } Under /api/public/* so CSRF is not enforced. Grounded strictly in the deliverable's own files, so an unauthenticated viewer gets answers about the code without any access to internal Hirn knowledge.

| Property | Value |
|----------|-------|
| File | `src/app/api/public/share/[token]/ask/route.ts` |
| Auth | None |
| Params | `token` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {...
```

</details>

### Referral

#### `POST /api/referral/invite`

API endpoint at /api/referral/invite

| Property | Value |
|----------|-------|
| File | `src/app/api/referral/invite/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth(async (request: NextRequest, session) => {...
```

</details>

#### `GET /api/referral/my-code`

API endpoint at /api/referral/my-code

| Property | Value |
|----------|-------|
| File | `src/app/api/referral/my-code/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (_request, session) => {...
```

</details>

### Repairer

#### `GET /api/repairer/dashboard`

Repairer Dashboard API GET /api/repairer/dashboard - Get repairer dashboard stats and bookings

| Property | Value |
|----------|-------|
| File | `src/app/api/repairer/dashboard/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

### Reviews

#### `GET, POST /api/reviews`

API endpoint at /api/reviews

| Property | Value |
|----------|-------|
| File | `src/app/api/reviews/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PUT, DELETE /api/reviews/[id]`

API endpoint at /api/reviews/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/reviews/[id]/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {...

export const PUT = withAuth<{ id: string }>(...

export const DELETE = withAuth<{ id: string }>(...
```

</details>

#### `POST, PUT, DELETE /api/reviews/[id]/response`

API endpoint at /api/reviews/[id]/response

| Property | Value |
|----------|-------|
| File | `src/app/api/reviews/[id]/response/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string }>(...

export const PUT = withAuth<{ id: string }>(...

export const DELETE = withAuth<{ id: string }>(...
```

</details>

#### `POST /api/reviews/[id]/vote`

API endpoint at /api/reviews/[id]/vote

| Property | Value |
|----------|-------|
| File | `src/app/api/reviews/[id]/vote/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth<{ id: string }>(...
```

</details>

### Search

#### `GET /api/search/listings`

GET /api/search/listings — Search listings via Meilisearch Uses Meilisearch for instant search with typo tolerance and faceted filtering. Falls back to the standard /api/listings SQL search if Meilisearch is unavailable.

| Property | Value |
|----------|-------|
| File | `src/app/api/search/listings/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

### Search-index

#### `GET /api/search-index`

GET /api/search-index — compact, user-scoped index for the command palette. Mirrors the admin search-index route: every query runs through Promise.allSettled so one failing entity degrades to an empty array rather than 500-ing the whole palette. Table names come from TABLE_NAMES (sql.raw, never bound); the session user id is always a bound parameter.

| Property | Value |
|----------|-------|
| File | `src/app/api/search-index/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {...
```

</details>

### Sellers

#### `GET /api/sellers/[id]`

GET /api/sellers/[id] — Public seller profile with active listings + review stats

| Property | Value |
|----------|-------|
| File | `src/app/api/sellers/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {...
```

</details>

#### `GET, PATCH /api/sellers/me`

GET  /api/sellers/me — Return own seller profile (authenticated) PATCH /api/sellers/me — Update own seller profile (authenticated)

| Property | Value |
|----------|-------|
| File | `src/app/api/sellers/me/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...

export const PATCH = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

### Services

#### `GET /api/services`

API: Public Services GET /api/services - List active services from unified service layer Query params: - featured=true: Only return featured services (default) - bookable=true: Only return bookable services - all=true: Return all active services

| Property | Value |
|----------|-------|
| File | `src/app/api/services/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

### Stats

#### `GET /api/stats/community`

API endpoint at /api/stats/community

| Property | Value |
|----------|-------|
| File | `src/app/api/stats/community/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...
```

</details>

#### `GET /api/stats/impact`

GET /api/stats/impact Returns live impact metrics computed from DB data. No auth required — public transparency data.

| Property | Value |
|----------|-------|
| File | `src/app/api/stats/impact/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...
```

</details>

### Suggestions

#### `POST /api/suggestions`

Suggestions / site-feedback API POST /api/suggestions — the floating feedback widget on public pages. Reliability: the submission is PERSISTED to site_suggestions first (the channel that never silently drops), then super admins get an in-app notification, and finally the team email is sent AND its result is checked (sendCustomEmail resolves { success:false } instead of throwing, so the old fire-and-forget `.catch` never noticed failed delivery).

| Property | Value |
|----------|-------|
| File | `src/app/api/suggestions/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Task-analytics

#### `GET /api/task-analytics`

Task Analytics API GET /api/task-analytics - Get task analytics and statistics Created: 2026-02-05

| Property | Value |
|----------|-------|
| File | `src/app/api/task-analytics/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {...
```

</details>

### Task-projects

#### `GET, POST /api/task-projects`

Task Projects API GET /api/task-projects - List all projects POST /api/task-projects - Create a new project Created: 2026-02-05

| Property | Value |
|----------|-------|
| File | `src/app/api/task-projects/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {...

export const POST = withAdmin(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PATCH, DELETE /api/task-projects/[id]`

Task Project Detail API GET /api/task-projects/[id] - Get single project with tasks PATCH /api/task-projects/[id] - Update project DELETE /api/task-projects/[id] - Delete project Created: 2026-02-05

| Property | Value |
|----------|-------|
| File | `src/app/api/task-projects/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const PATCH = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const DELETE = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

### Task-requests

#### `GET /api/task-requests`

Task Requests API GET /api/task-requests - Get pending task requests for current user Returns both direct requests AND broadcasts (where requested_user_id is null) Created: 2026-02-05

| Property | Value |
|----------|-------|
| File | `src/app/api/task-requests/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `PATCH /api/task-requests/[id]`

Task Request Response API PATCH /api/task-requests/[id] - Respond to a task request (accept/decline) Created: 2026-02-05

| Property | Value |
|----------|-------|
| File | `src/app/api/task-requests/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

### Tasks

#### `GET, POST /api/tasks`

Tasks API GET /api/tasks - List tasks with filters POST /api/tasks - Create a new task Created: 2026-02-05

| Property | Value |
|----------|-------|
| File | `src/app/api/tasks/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {...

export const POST = withAdmin(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PATCH, DELETE /api/tasks/[id]`

Task Detail API GET /api/tasks/[id] - Get single task with completions PATCH /api/tasks/[id] - Update task DELETE /api/tasks/[id] - Archive task (soft delete) Created: 2026-02-05

| Property | Value |
|----------|-------|
| File | `src/app/api/tasks/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const PATCH = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...

export const DELETE = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/tasks/[id]/attention`

Task Attention Flag API POST /api/tasks/[id]/attention - Flag task as needing attention Created: 2026-02-05

| Property | Value |
|----------|-------|
| File | `src/app/api/tasks/[id]/attention/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/tasks/[id]/complete`

Task Completion API POST /api/tasks/[id]/complete - Mark task as complete (self-report) Created: 2026-02-05

| Property | Value |
|----------|-------|
| File | `src/app/api/tasks/[id]/complete/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

#### `POST /api/tasks/[id]/request`

Task Request API POST /api/tasks/[id]/request - Request someone to do a task If requested_user_id is provided, sends to specific user. If requested_user_id is null/omitted, broadcasts to ALL team members. Created: 2026-02-05

| Property | Value |
|----------|-------|
| File | `src/app/api/tasks/[id]/request/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAdmin<RouteParams>(
  async (request: NextRequest, session: ValidSession, context) => {...
```

</details>

### Team

#### `PUT /api/team/reminder`

PUT /api/team/reminder — personal monthly Zeiterfassung reminder. Body: { day: number | null }  (1–28; null switches the reminder off). Fires via the timecard-reminders cron: an in-app + e-mail nudge on that day of month if the current month's card is not submitted yet.

| Property | Value |
|----------|-------|
| File | `src/app/api/team/reminder/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const PUT = withAdmin(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `POST, DELETE /api/team/report/[userId]/[month]/share`

Mint (POST) or revoke (DELETE) the public share link for one person's Monatsrapport. Same access rule as viewing the report: the owner, or a timecard approver. The link itself needs no login (it's for social workers).

| Property | Value |
|----------|-------|
| File | `src/app/api/team/report/[userId]/[month]/share/route.ts` |
| Auth | Super admin only |
| Params | `userId`, `month` |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; month: string }> },...

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; month: string }> },...
```

</details>

#### `GET, PUT /api/team/schedule`

PUT /api/team/schedule — a team member saves THEIR OWN weekly work schedule. Previously working_hours was only editable through the admin team-profile editor (/api/admin/team/profiles/*), so adjusting your own schedule meant clicking through admin. This is the self-service path used by the inline schedule editor on /dashboard/timecards. is_revampit-style SSOT: the schedule lives in team_profiles.working_hours as a normalized WeeklySchedule.

| Property | Value |
|----------|-------|
| File | `src/app/api/team/schedule/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {...

export const PUT = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

### Technicians

#### `GET /api/technicians`

Unified Technicians API GET /api/technicians - Search and list all technician profiles Replaces the split between /api/repairers (professional tier) and /api/it-hilfe/helpers (community tier). Both are now rows in repairer_profiles.

| Property | Value |
|----------|-------|
| File | `src/app/api/technicians/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(request: NextRequest) {...
```

</details>

#### `GET /api/technicians/[id]`

Unified Technician Detail API GET /api/technicians/[id] - Get a single technician profile with skills and services Works for both community (formerly helper_profiles) and professional (formerly repairer_profiles) technicians — both now live in repairer_profiles.

| Property | Value |
|----------|-------|
| File | `src/app/api/technicians/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(_request: NextRequest, { params }: RouteParams) {...
```

</details>

### Time-off

#### `GET, POST /api/time-off`

Time-off requests — staff self-service. GET  /api/time-off  → my requests POST /api/time-off  → create a new request (status: pending)

| Property | Value |
|----------|-------|
| File | `src/app/api/time-off/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (_req: NextRequest, session: ValidSession) => {...

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `PATCH /api/time-off/[id]`

PATCH /api/time-off/:id  → requester cancels their own pending request.

| Property | Value |
|----------|-------|
| File | `src/app/api/time-off/[id]/route.ts` |
| Auth | Staff only |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAuth<{ id: string }>(...
```

</details>

### Timecards

#### `GET, POST, PUT /api/timecards`

API endpoint at /api/timecards

| Property | Value |
|----------|-------|
| File | `src/app/api/timecards/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {...

export const POST = withAdmin(async (request: NextRequest, session: ValidSession) => {...

export const PUT = withAdmin(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET /api/timecards/saldo`

GET /api/timecards/saldo — Zeit- und Feriensaldo. Own saldo for any staff member; another member's via ?user_id= for approvers (timecards permission) — used by the admin team profile tab. Returns { saldo: null } when the person has no Pensum on file (volunteers) so the UI can simply hide the card.

| Property | Value |
|----------|-------|
| File | `src/app/api/timecards/saldo/route.ts` |
| Auth | Super admin only |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAdmin(async (request: NextRequest, session: ValidSession) => {...
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
export const POST = withAuth(async (request, session) => {...
```

</details>

### User

#### `POST /api/user/change-password`

Change Password API POST /api/user/change-password

| Property | Value |
|----------|-------|
| File | `src/app/api/user/change-password/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth(async (request: NextRequest, session) => {...
```

</details>

#### `GET /api/user/donations`

GET /api/user/donations Fetch current user's donation history. For device donations, joins linked inventory items + marketplace listings to surface the device journey (received → refurbished → listed → rehomed). Privacy: never exposes buyer info, exact sold price, or recipient identity.

| Property | Value |
|----------|-------|
| File | `src/app/api/user/donations/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET /api/user/export-data`

GET /api/user/export-data GDPR/Swiss DSG compliant user data export. Returns ALL data associated with the authenticated user as a JSON download. Rate limited to 3 exports per 24h via auth_audit_log counting.

| Property | Value |
|----------|-------|
| File | `src/app/api/user/export-data/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, POST /api/user/orangecat`

GET  /api/user/orangecat — is this account an OrangeCat account, and can it become one? POST /api/user/orangecat — start "Connect OrangeCat" for the signed-in user: mints the short-lived signed cookie the sign-in callback reads, so the OrangeCat identity that comes back is attached to THIS account and no other. The client then starts the ordinary OrangeCat sign-in.

| Property | Value |
|----------|-------|
| File | `src/app/api/user/orangecat/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...

export async function POST() {...
```

</details>

#### `GET, PUT /api/user/profile`

User Profile API GET /api/user/profile - Get current user's profile PUT /api/user/profile - Update current user's profile

| Property | Value |
|----------|-------|
| File | `src/app/api/user/profile/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (_request, session) => {...

export const PUT = withAuth(async (request: NextRequest, session) => {...
```

</details>

#### `GET /api/user/reviews`

API endpoint at /api/user/reviews

| Property | Value |
|----------|-------|
| File | `src/app/api/user/reviews/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

#### `GET, PUT, PATCH /api/user/technician-profile`

Technician Profile API GET /api/user/technician-profile - Get current user's technician profile PUT /api/user/technician-profile - Create or update technician profile Self-registered technicians are written to repairer_profiles with profile_tier = 'community'. Professional repairers go through the repairer application flow and are assigned tier = 'professional' by admins.

| Property | Value |
|----------|-------|
| File | `src/app/api/user/technician-profile/route.ts` |
| Auth | Authenticated users |

<details>
<summary>Code Preview</summary>

```typescript
export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {...

export const PUT = withAuth(async (request: NextRequest, session: ValidSession) => {...

export const PATCH = withAuth(async (request: NextRequest, session: ValidSession) => {...
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
export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {...
```

</details>

### Version

#### `GET /api/version`

API endpoint at /api/version

| Property | Value |
|----------|-------|
| File | `src/app/api/version/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET() {...
```

</details>

### Vote

#### `GET, POST /api/vote/[id]`

Public Vote API GET  /api/vote/[id] - Fetch public decision info for voting (no auth required) POST /api/vote/[id] - Submit a vote by email (no auth required) This endpoint is intentionally public so decisions can be shared via link (email, phone, etc.) without requiring an admin account. Voter identity comes from the SESSION, never from the request body. A signed-in member votes as themselves; everyone else votes anonymously by email (only when allow_public_voting=true). An email in the body is an unproven claim — see the POST handler.

| Property | Value |
|----------|-------|
| File | `src/app/api/vote/[id]/route.ts` |
| Auth | Authenticated users |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export async function GET(_request: NextRequest, { params }: RouteParams) {...

export async function POST(request: NextRequest, { params }: RouteParams) {...
```

</details>

### Webhooks

#### `POST /api/webhooks/kivvi`

POST /api/webhooks/kivvi — Inbound receiver for Kivvi ERP item changes. This is the REVERSE leg of the bidirectional product sync. Kivvi is the canonical ERP: when an inventory item changes there (price re-graded, status moved to sold/returned/recycled/donated, description edited), Kivvi POSTs an HMAC-signed webhook here so the RevampIT website mirrors the change. Contract (verified against Kivvi): Headers: X-Kivvi-Event, X-Kivvi-Signature (hex HMAC-SHA256 of the RAW body using KIVVI_WEBHOOK_SECRET), Content-Type: application/json Body:    { event, timestamp, companyId, data: { id, itemNumber, description, condition, status, warehouseId, askingPrice } } (status_changed carries { id, itemNumber, status }) data.id  = Kivvi inventory item id = RevampIT inventory_items.kivviInventoryItemId LOOP SUPPRESSION (critical): every write below is a direct db.update on the local tables. This handler NEVER calls syncToKivvi / updateKivviInventoryItem, so a receiver write can never bounce a push back to Kivvi and start an echo loop. The forward push lives only in the admin edit path. Idempotent / out-of-order safe: writes are an upsert of Kivvi's current values, so replays and reordered deliveries converge to the same state.

| Property | Value |
|----------|-------|
| File | `src/app/api/webhooks/kivvi/route.ts` |
| Auth | None |

<details>
<summary>Code Preview</summary>

```typescript
export async function POST(request: NextRequest) {...
```

</details>

### Workshops

#### `GET /api/workshops`

API endpoint at /api/workshops

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/route.ts` |
| Auth | Authenticated users |

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
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {...
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
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {...
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
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {...
```

</details>

#### `POST /api/workshops/propose`

API endpoint at /api/workshops/propose

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/propose/route.ts` |
| Auth | Staff only |

<details>
<summary>Code Preview</summary>

```typescript
export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {...
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
export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {...
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
  { params }: { params: Promise<{ instanceId: string }> },...
```

</details>

#### `PATCH /api/workshops/registrations/[id]`

API endpoint at /api/workshops/registrations/[id]

| Property | Value |
|----------|-------|
| File | `src/app/api/workshops/registrations/[id]/route.ts` |
| Auth | None |
| Params | `id` |

<details>
<summary>Code Preview</summary>

```typescript
export const PATCH = withAuth<{ id: string }>(...
```

</details>

## Quick Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/ai/smart-product-entry` | Staff only | API: Smart Product Entry POST /api/ai/smart-produc... |
| GET | `/api/admin/appointments` | Staff only | GET /api/admin/appointments Admin listing of all s... |
| POST | `/api/admin/appointments/[id]/assign` | None | POST /api/admin/appointments/[id]/assign Admin ass... |
| PATCH | `/api/admin/approvals/[id]` | None | Admin Approval Action API PATCH /api/admin/approva... |
| GET | `/api/admin/auth` | Staff only | Admin auth check — delegates to Auth.js session. L... |
| GET/POST | `/api/admin/blog` | Staff only | API: Admin Blog Posts GET /api/admin/blog - List a... |
| GET/PATCH/DELETE | `/api/admin/blog/[id]` | None | API: Admin Blog Post by ID GET /api/admin/blog/[id... |
| POST | `/api/admin/blog/[id]/translate` | None | API: AI-translate a blog post into its missing (or... |
| GET/POST | `/api/admin/blog/categories` | Staff only | API: Blog Categories GET /api/admin/blog/categorie... |
| GET/PATCH/DELETE | `/api/admin/blog/categories/[id]` | None | API: Single Blog Category GET /api/admin/blog/cate... |
| GET/PATCH/DELETE | `/api/admin/blog/submissions/[id]` | None | API: Single Blog Submission Management GET /api/ad... |
| GET/POST | `/api/admin/donations` | Staff only | GET /api/admin/donations List all donations with f... |
| GET/PATCH/DELETE | `/api/admin/donations/[id]` | None | GET /api/admin/donations/[id] Get a single donatio... |
| GET | `/api/admin/donations/users` | Staff only | API: User Search for Donations GET /api/admin/dona... |
| GET/POST | `/api/admin/email/diagnostics` | Staff only | Admin email diagnostics — determine WHY mail may n... |
| POST | `/api/admin/erfassung` | Staff only | Erfassung API - Product intake and registration PO... |
| POST | `/api/admin/erfassung/bulk-enrich` | Staff only | API: Bulk AI Enrichment POST /api/admin/erfassung/... |
| POST | `/api/admin/erfassung/bulk-save` | Staff only | API: Bulk Save Products POST /api/admin/erfassung/... |
| POST | `/api/admin/erfassung/bulk-text` | Staff only | API: Bulk Text-to-Products Erfassung POST /api/adm... |
| POST | `/api/admin/erfassung/bulk-upload` | Staff only | API: Bulk File Upload (CSV/Excel) POST /api/admin/... |
| POST | `/api/admin/erfassung/image` | Staff only | API: Photo-to-Product Erfassung POST /api/admin/er... |
| POST | `/api/admin/erfassung/text` | Staff only | API: Text-to-Product Erfassung POST /api/admin/erf... |
| POST | `/api/admin/erfassung/voice` | Staff only | API: Voice-to-Product Erfassung POST /api/admin/er... |
| POST | `/api/admin/hirn/actions/execute` | Super admin only | API endpoint at /api/admin/hirn/actions/execute |
| POST | `/api/admin/hirn/chat` | Staff only | API: Hirn Chat POST /api/admin/hirn/chat Send a me... |
| GET/DELETE | `/api/admin/hirn/documents` | Super admin only | API: Hirn Documents GET /api/admin/hirn/documents ... |
| GET/DELETE | `/api/admin/hirn/history` | Staff only | API: Hirn Chat History GET /api/admin/hirn/history... |
| POST | `/api/admin/hirn/init` | Staff only | API: Initialize Hirn AI Tables POST /api/admin/hir... |
| GET/PATCH | `/api/admin/hirn/providers` | Staff only | API: Hirn AI Providers GET /api/admin/hirn/provide... |
| GET | `/api/admin/hr/applications` | Staff only | Admin HR applications GET /api/admin/hr/applicatio... |
| GET | `/api/admin/hr/applications/[id]` | None | GET /api/admin/hr/applications/[id] |
| POST | `/api/admin/hr/applications/[id]/hire` | None | POST /api/admin/hr/applications/[id]/hire |
| POST | `/api/admin/hr/applications/[id]/transition` | None | POST /api/admin/hr/applications/[id]/transition |
| GET | `/api/admin/hr/stats` | Staff only | GET /api/admin/hr/stats — funnel analytics |
| GET/POST | `/api/admin/hr/vacancies` | Staff only | Admin HR vacancies GET /api/admin/hr/vacancies — l... |
| GET/PATCH/DELETE | `/api/admin/hr/vacancies/[id]` | None | Admin HR vacancy by id GET/PATCH/DELETE /api/admin... |
| POST | `/api/admin/hr/vacancies/[id]/duplicate` | None | POST /api/admin/hr/vacancies/[id]/duplicate |
| POST | `/api/admin/hr/vacancies/[id]/transition` | None | POST /api/admin/hr/vacancies/[id]/transition |
| GET/POST | `/api/admin/intake` | Staff only | Intake API — Create + List POST /api/admin/intake ... |
| GET/PATCH | `/api/admin/intake/[id]` | None | Intake Detail API GET   /api/admin/intake/[id] — F... |
| POST | `/api/admin/intake/[id]/change-tier` | None | Intake Tier Change API POST /api/admin/intake/[id]... |
| PATCH | `/api/admin/intake/[id]/checklist` | None | Intake Checklist API PATCH /api/admin/intake/[id]/... |
| POST | `/api/admin/intake/[id]/publish` | None | Intake Publish API POST /api/admin/intake/[id]/pub... |
| GET | `/api/admin/inventory` | Staff only | Inventory Products List API GET /api/admin/invento... |
| GET/PUT/PATCH/DELETE | `/api/admin/inventory/[id]` | None | Inventory Product Detail API GET    /api/admin/inv... |
| GET | `/api/admin/it-hilfe` | Staff only | API endpoint at /api/admin/it-hilfe |
| GET/PATCH/DELETE | `/api/admin/it-hilfe/[id]` | None | API endpoint at /api/admin/it-hilfe/[id] |
| GET | `/api/admin/it-hilfe/helpers` | Staff only | API endpoint at /api/admin/it-hilfe/helpers |
| PATCH | `/api/admin/it-hilfe/helpers/[id]` | None | API endpoint at /api/admin/it-hilfe/helpers/[id] |
| GET | `/api/admin/it-hilfe/stats` | Staff only | API endpoint at /api/admin/it-hilfe/stats |
| POST/DELETE | `/api/admin/listings/[id]/verify` | None | POST /api/admin/listings/[id]/verify — Admin: mark... |
| GET | `/api/admin/marketplace` | Staff only | API endpoint at /api/admin/marketplace |
| GET/PATCH/DELETE | `/api/admin/marketplace/[id]` | None | API endpoint at /api/admin/marketplace/[id] |
| GET | `/api/admin/marketplace/orders` | Staff only | API endpoint at /api/admin/marketplace/orders |
| GET | `/api/admin/marketplace/questions` | Staff only | API endpoint at /api/admin/marketplace/questions |
| PATCH | `/api/admin/marketplace/questions/[id]` | None | API endpoint at /api/admin/marketplace/questions/[... |
| GET | `/api/admin/marketplace/reports` | Staff only | API endpoint at /api/admin/marketplace/reports |
| PATCH | `/api/admin/marketplace/reports/[id]` | None | API endpoint at /api/admin/marketplace/reports/[id... |
| GET | `/api/admin/marketplace/stats` | Staff only | API endpoint at /api/admin/marketplace/stats |
| PATCH | `/api/admin/membership/[id]` | Staff only | API endpoint at /api/admin/membership/[id] |
| GET | `/api/admin/membership/members` | Staff only | GET /api/admin/membership/members Returns all acti... |
| POST | `/api/admin/migrate/shopware-drafts` | None | API: One-time Shopware → RevampIT catalog migratio... |
| GET/POST | `/api/admin/pages` | Staff only | GET  /api/admin/pages — list static pages POST /ap... |
| GET/PUT/DELETE | `/api/admin/pages/[id]` | None | GET    /api/admin/pages/[id] — read a static page ... |
| GET | `/api/admin/payments/dashboard` | Staff only | API endpoint at /api/admin/payments/dashboard |
| GET | `/api/admin/payroll/batches` | Staff only | GET /api/admin/payroll/batches — list past payroll... |
| GET | `/api/admin/payroll/batches/[id]/export.csv` | Super admin only | GET /api/admin/payroll/batches/[id]/export.csv Str... |
| GET/POST | `/api/admin/payroll/close` | Super admin only | POST /api/admin/payroll/close Closes a payroll bat... |
| POST | `/api/admin/permissions/request` | Super admin only | API: Staff Permission Request POST /api/admin/perm... |
| GET | `/api/admin/permissions/requests` | Super admin only | API: List Permission Requests GET /api/admin/permi... |
| POST | `/api/admin/permissions/requests/[id]` | Super admin only | API: Approve/Reject Permission Request POST /api/a... |
| PATCH | `/api/admin/projects/[slug]/contributions/[id]` | None | Admin API: PATCH a contribution's triage status / ... |
| GET/POST | `/api/admin/projects/[slug]/needs` | None | Admin API for project needs CRUD. GET   /api/admin... |
| PATCH/DELETE | `/api/admin/projects/[slug]/needs/[id]` | None | Admin API for a single project need. PATCH  /api/a... |
| GET/POST | `/api/admin/promo-codes` | Staff only | API endpoint at /api/admin/promo-codes |
| PATCH | `/api/admin/promo-codes/[id]` | Staff only | API endpoint at /api/admin/promo-codes/[id] |
| POST | `/api/admin/promote-user` | Staff only | Promote User to Admin API POST /api/admin/promote-... |
| GET | `/api/admin/refunds` | Staff only | API endpoint at /api/admin/refunds |
| GET/PUT | `/api/admin/refunds/[id]` | None | API endpoint at /api/admin/refunds/[id] |
| POST | `/api/admin/repairers/[id]/recalculate-ratings` | None | API endpoint at /api/admin/repairers/[id]/recalcul... |
| GET | `/api/admin/reviews` | Staff only | GET /api/admin/reviews?status=<status>&limit=<n> L... |
| PUT | `/api/admin/reviews/[id]/moderate` | Staff only | PUT /api/admin/reviews/[id]/moderate Body: { actio... |
| GET | `/api/admin/search-index` | Staff only | API endpoint at /api/admin/search-index |
| GET/POST | `/api/admin/services` | Staff only | API: Admin Services GET /api/admin/services - List... |
| GET/PUT/DELETE | `/api/admin/services/[id]` | None | API: Admin Service by ID GET /api/admin/services/[... |
| GET/POST | `/api/admin/storage-locations` | Staff only | Storage Locations API GET  /api/admin/storage-loca... |
| GET | `/api/admin/tax-reports` | Staff only | Compute VAT reporting period boundaries in Europe/... |
| GET | `/api/admin/team/activity` | Staff only | API: Unified Activity Stream GET /api/admin/team/a... |
| GET/POST | `/api/admin/team/activity/updates` | Staff only | API: Activity Updates GET  /api/admin/team/activit... |
| GET/PUT/DELETE | `/api/admin/team/activity/updates/[id]` | None | API: Activity Update Detail GET    /api/admin/team... |
| GET | `/api/admin/team/digest` | Staff only | API: Weekly Digest GET /api/admin/team/digest - Ge... |
| GET/POST | `/api/admin/team/help-requests` | Staff only | API: Help Requests GET  /api/admin/team/help-reque... |
| GET/PUT | `/api/admin/team/help-requests/[id]` | None | API: Help Request Detail GET /api/admin/team/help-... |
| POST | `/api/admin/team/help-requests/[id]/resolve` | None | API: Resolve Help Request POST /api/admin/team/hel... |
| DELETE | `/api/admin/team/leave/[id]` | None | DELETE /api/admin/team/leave/[id] Removes a single... |
| GET/POST | `/api/admin/team/profiles` | Super admin only | API: Team Profiles List & Create GET  /api/admin/t... |
| GET/PUT/DELETE | `/api/admin/team/profiles/[id]` | Super admin only | API: Team Profile Detail GET    /api/admin/team/pr... |
| PUT | `/api/admin/team/profiles/[id]/focus` | None | API: Current Focus Update PUT /api/admin/team/prof... |
| GET/POST | `/api/admin/team/profiles/[id]/leave` | None | GET  /api/admin/team/profiles/[id]/leave — list le... |
| PUT | `/api/admin/team/profiles/me` | Super admin only | API: My Team Profile (self-service) PUT /api/admin... |
| POST | `/api/admin/team/profiles/me/bootstrap` | Staff only | API: Self-service team-profile bootstrap. POST /ap... |
| GET/POST | `/api/admin/team/zeit/[userId]` | Staff only | Zeit & Pensum administration for one team member (... |
| GET/POST | `/api/admin/teams` | Super admin only | API endpoint at /api/admin/teams |
| GET/PUT/DELETE | `/api/admin/teams/[id]` | Super admin only | API endpoint at /api/admin/teams/[id] |
| PATCH | `/api/admin/teams/[id]/focus` | None | API endpoint at /api/admin/teams/[id]/focus |
| GET/POST | `/api/admin/teams/[id]/goals` | None | API endpoint at /api/admin/teams/[id]/goals |
| PATCH/DELETE | `/api/admin/teams/[id]/goals/[goalId]` | None | API endpoint at /api/admin/teams/[id]/goals/[goalI... |
| POST | `/api/admin/teams/[id]/invitations` | Super admin only | Invite a person into the team by name + email. Reg... |
| GET/POST | `/api/admin/teams/[id]/members` | None | Add a person to the team, or TRANSFER them in (whe... |
| PATCH/DELETE | `/api/admin/teams/[id]/members/[membershipId]` | None | API endpoint at /api/admin/teams/[id]/members/[mem... |
| GET/POST | `/api/admin/teams/[id]/metrics` | None | API endpoint at /api/admin/teams/[id]/metrics |
| PATCH/DELETE | `/api/admin/teams/[id]/metrics/[metricId]` | None | API endpoint at /api/admin/teams/[id]/metrics/[met... |
| GET | `/api/admin/teams/candidates` | Staff only | API endpoint at /api/admin/teams/candidates |
| POST | `/api/admin/teams/invite` | Super admin only | Mint a claim link for a placeholder member. Struct... |
| GET | `/api/admin/time-off` | Staff only | GET /api/admin/time-off?status=pending|approved|re... |
| PATCH | `/api/admin/time-off/[id]` | None | PATCH /api/admin/time-off/:id  → approve or reject... |
| GET | `/api/admin/timecards` | Staff only | API endpoint at /api/admin/timecards |
| GET/PUT/PATCH | `/api/admin/timecards/[id]` | Super admin only | API endpoint at /api/admin/timecards/[id] |
| POST | `/api/admin/timecards/[id]/reopen` | Staff only | API endpoint at /api/admin/timecards/[id]/reopen |
| POST | `/api/admin/timecards/[id]/submit` | Staff only | POST /api/admin/timecards/[id]/submit — submit a D... |
| POST | `/api/admin/timecards/bulk-review` | Super admin only | POST /api/admin/timecards/bulk-review Approves or ... |
| POST | `/api/admin/timecards/for-user` | Staff only | POST /api/admin/timecards/for-user — create-or-get... |
| GET | `/api/admin/users` | Super admin only | API: Users List with Search, Filter, and Paginatio... |
| GET/PATCH/DELETE | `/api/admin/users/[id]` | Super admin only | API: User Management GET    /api/admin/users/[id] ... |
| PATCH | `/api/admin/users/[id]/permissions` | Super admin only | API: Manage User Permissions PATCH /api/admin/user... |
| GET/POST | `/api/admin/workshops/[workshopId]/materials` | None | API endpoint at /api/admin/workshops/[workshopId]/... |
| GET/POST | `/api/admin/workshops/instances` | Staff only | API endpoint at /api/admin/workshops/instances |
| GET/PUT/DELETE | `/api/admin/workshops/instances/[id]` | None | API endpoint at /api/admin/workshops/instances/[id... |
| GET | `/api/admin/workshops/list` | Staff only | API endpoint at /api/admin/workshops/list |
| PUT/DELETE | `/api/admin/workshops/materials/[id]` | None | API endpoint at /api/admin/workshops/materials/[id... |
| GET | `/api/admin/workshops/proposals` | Staff only | API endpoint at /api/admin/workshops/proposals |
| GET/PATCH | `/api/admin/workshops/proposals/[id]` | None | GET /api/admin/workshops/proposals/[id] Fetch a si... |
| POST | `/api/admin/workshops/proposals/[id]/approve` | None | API endpoint at /api/admin/workshops/proposals/[id... |
| GET | `/api/admin/workshops/proposals/[id]/history` | None | GET /api/admin/workshops/proposals/[id]/history Fe... |
| PUT | `/api/admin/workshops/registrations/[id]` | None | API endpoint at /api/admin/workshops/registrations... |
| POST | `/api/admin/workshops/send-feedback-requests` | Staff only | API endpoint at /api/admin/workshops/send-feedback... |
| POST | `/api/admin/workshops/send-reminders` | Staff only | API endpoint at /api/admin/workshops/send-reminder... |
| POST | `/api/ai/analyze-product` | Authenticated users | API: Image Product Analysis POST /api/ai/analyze-p... |
| POST | `/api/ai/extract` | Staff only | AI Form Extraction API POST /api/ai/extract Univer... |
| POST | `/api/ai/form-assist` | Authenticated users | Form Assist API POST /api/ai/form-assist One route... |
| POST | `/api/ai/protocol-advisor` | Authenticated users | Protocol Advisor API POST /api/ai/protocol-advisor... |
| POST | `/api/ai/task-advisor` | Authenticated users | Task Advisor API POST /api/ai/task-advisor "Ask th... |
| POST | `/api/ai/vote-advisor` | None | Vote Advisor API POST /api/ai/vote-advisor Provide... |
| GET/POST | `/api/appointments` | Authenticated users | Fire-and-forget admin notification for a new booki... |
| GET/PATCH | `/api/appointments/[id]` | None | API endpoint at /api/appointments/[id] |
| POST | `/api/appointments/[id]/pay` | Staff only | API endpoint at /api/appointments/[id]/pay |
| GET/POST | `/api/auth/[...nextauth]` | None | Auth.js API Route Handler Handles all authenticati... |
| POST | `/api/auth/forgot-password` | None | Forgot Password API POST /api/auth/forgot-password |
| POST | `/api/auth/login-status` | None | POST /api/auth/login-status Historical purpose: pr... |
| POST | `/api/auth/register` | None | User Registration API POST /api/auth/register Incl... |
| POST | `/api/auth/resend-code` | None | Resend Verification Code API POST /api/auth/resend... |
| POST | `/api/auth/reset-password` | None | Reset Password API POST /api/auth/reset-password |
| POST | `/api/auth/verify-code` | Staff only | Email Verification Code API POST /api/auth/verify-... |
| GET/POST | `/api/auth/verify-email` | Staff only | API endpoint at /api/auth/verify-email |
| GET/POST | `/api/blog/[slug]/comments` | Super admin only | API endpoint at /api/blog/[slug]/comments |
| GET | `/api/blog/categories` | None | API: Public Blog Categories GET /api/blog/categori... |
| PATCH/DELETE | `/api/blog/comments/[id]` | Staff only | Moderate a comment — staff-only. Sets status to hi... |
| GET | `/api/blog/my-submissions` | Authenticated users | API: My Blog Submissions GET /api/blog/my-submissi... |
| POST | `/api/blog/submissions/[id]/resubmit` | None | API: Resubmit a blog submission POST /api/blog/sub... |
| GET | `/api/blog/submit` | Staff only | API: Blog Submissions (Admin) GET /api/blog/submit... |
| GET | `/api/careers` | None | Public careers list GET /api/careers |
| GET | `/api/careers/[slug]` | None | Public career posting detail GET /api/careers/[slu... |
| POST | `/api/careers/[slug]/apply` | Authenticated users | Submit job application POST /api/careers/[slug]/ap... |
| POST | `/api/careers/upload-cv` | Authenticated users | POST /api/careers/upload-cv — guest + logged-in CV... |
| GET | `/api/cron/close-decisions` | None | Cron: Auto-close decisions past their voting deadl... |
| GET | `/api/cron/close-it-hilfe-requests` | None | Cron: Auto-expire IT-Hilfe requests past their dea... |
| GET | `/api/cron/prune-audit-log` | None | Cron — prune `auth_audit_log` entries older than 1... |
| GET | `/api/cron/release-escrow` | None | Cron: Auto-release escrow funds past their release... |
| GET | `/api/cron/timecard-reminders` | None | Cron: monthly Zeiterfassung reminders. GET /api/cr... |
| GET | `/api/cron/wake-recurring-tasks` | None | Cron: Wake recurring_scheduled tasks when their sc... |
| GET/POST | `/api/decisions` | Staff only | Decisions List API GET  /api/decisions - List deci... |
| GET/PATCH/DELETE | `/api/decisions/[id]` | Super admin only | Decision Detail API GET    /api/decisions/[id] - G... |
| GET/POST | `/api/decisions/[id]/comments` | None | Decision Comments API GET  /api/decisions/[id]/com... |
| PATCH/DELETE | `/api/decisions/[id]/comments/[commentId]` | None | Decision Comment Detail API PATCH  /api/decisions/... |
| POST | `/api/decisions/[id]/create-task` | None | Create Follow-up Task from Decision API POST /api/... |
| POST | `/api/decisions/[id]/narrative` | None | Decision narrative API POST /api/decisions/[id]/na... |
| POST | `/api/decisions/[id]/send-invitations` | None | POST /api/decisions/[id]/send-invitations Re-sends... |
| POST | `/api/decisions/[id]/transition` | None | Decision Transition API POST /api/decisions/[id]/t... |
| GET/POST | `/api/decisions/[id]/votes` | None | Decision Votes API GET  /api/decisions/[id]/votes ... |
| GET | `/api/decisions/[id]/votes/participation` | None | Decision Participation API GET /api/decisions/[id]... |
| GET/POST | `/api/deliverables` | Staff only | API endpoint at /api/deliverables |
| GET/PATCH/DELETE | `/api/deliverables/[id]` | None | Deliverable detail API GET    /api/deliverables/[i... |
| GET | `/api/deliverables/[id]/agent-brief` | None | Agent brief (§4.8) — GET /api/deliverables/[id]/ag... |
| POST | `/api/deliverables/[id]/ask` | None | Ask Hirn about a deliverable (admin / logged-in). ... |
| POST/PATCH | `/api/deliverables/[id]/feedback` | None | Deliverable feedback API (internal / logged-in sta... |
| POST | `/api/deliverables/[id]/reindex` | None | Reindex a deliverable into the Hirn RAG store on d... |
| POST | `/api/deliverables/[id]/share` | None | Share link — POST /api/deliverables/[id]/share Gen... |
| POST | `/api/donations/dropoff` | None | POST /api/donations/dropoff — public donation drop... |
| GET | `/api/health` | None | Health Check API GET /api/health Returns the healt... |
| GET | `/api/health/ai` | None | API endpoint at /api/health/ai |
| GET | `/api/health/auth` | None | API endpoint at /api/health/auth |
| GET | `/api/health/auth-db` | None | API endpoint at /api/health/auth-db |
| POST | `/api/hirn/chat` | Authenticated users | API: Hirn Public Chat POST /api/hirn/chat Page-awa... |
| POST | `/api/inquiry` | None | API endpoint at /api/inquiry |
| GET/POST | `/api/inventory/import-csv` | Staff only | API endpoint at /api/inventory/import-csv |
| GET/POST | `/api/invoices` | Authenticated users | API endpoint at /api/invoices |
| GET/PUT/DELETE | `/api/invoices/[id]` | None | API endpoint at /api/invoices/[id] |
| GET/POST | `/api/invoices/[id]/pdf` | None | API endpoint at /api/invoices/[id]/pdf |
| POST | `/api/it-hilfe/accept-offer-via-token` | None | POST /api/it-hilfe/accept-offer-via-token Body: { ... |
| GET | `/api/it-hilfe/helper/matching-requests` | None | API endpoint at /api/it-hilfe/helper/matching-requ... |
| GET | `/api/it-hilfe/helper/my-offers` | None | API endpoint at /api/it-hilfe/helper/my-offers |
| GET | `/api/it-hilfe/my-offers` | Authenticated users | GET /api/it-hilfe/my-offers Get current user's sub... |
| GET | `/api/it-hilfe/my-requests` | Authenticated users | GET /api/it-hilfe/my-requests Get current user's I... |
| GET/POST | `/api/it-hilfe/requests` | Authenticated users | GET /api/it-hilfe/requests Browse IT-Hilfe request... |
| GET/PUT | `/api/it-hilfe/requests/[id]` | Authenticated users | GET /api/it-hilfe/requests/[id] Get request detail... |
| POST | `/api/it-hilfe/requests/[id]/complete` | None | POST /api/it-hilfe/requests/[id]/complete Helper m... |
| POST | `/api/it-hilfe/requests/[id]/confirm-review` | None | POST /api/it-hilfe/requests/[id]/confirm-review Re... |
| POST | `/api/it-hilfe/requests/[id]/conversation` | Authenticated users | POST /api/it-hilfe/requests/[id]/conversation Open... |
| GET | `/api/it-hilfe/requests/[id]/matches` | None | IT-Hilfe Matching API GET /api/it-hilfe/requests/[... |
| GET/POST | `/api/it-hilfe/requests/[id]/offers` | Authenticated users | GET /api/it-hilfe/requests/[id]/offers Get offers ... |
| DELETE | `/api/it-hilfe/requests/[id]/offers/[offerId]` | Authenticated users | DELETE /api/it-hilfe/requests/[id]/offers/[offerId... |
| POST | `/api/it-hilfe/requests/[id]/offers/[offerId]/accept` | Authenticated users | POST /api/it-hilfe/requests/[id]/offers/[offerId]/... |
| POST | `/api/it-hilfe/requests/[id]/offers/[offerId]/decline` | Authenticated users | POST /api/it-hilfe/requests/[id]/offers/[offerId]/... |
| GET/POST | `/api/listings` | Authenticated users | GET /api/listings — Public browse with filters, se... |
| GET/PATCH/DELETE | `/api/listings/[id]` | Staff only | GET /api/listings/[id]  — Public detail (increment... |
| POST | `/api/listings/[id]/contact` | None | POST /api/listings/[id]/contact — Send message to ... |
| POST | `/api/listings/[id]/duplicate` | None | POST /api/listings/[id]/duplicate — Duplicate a li... |
| POST | `/api/listings/[id]/favorite` | None | POST /api/listings/[id]/favorite — Toggle favorite... |
| GET/POST | `/api/listings/[id]/questions` | Authenticated users | GET  /api/listings/[id]/questions — Public Q&A for... |
| POST | `/api/listings/[id]/questions/[questionId]/answer` | None | POST /api/listings/[id]/questions/[questionId]/ans... |
| POST | `/api/listings/[id]/report` | None | POST /api/listings/[id]/report — Report a listing ... |
| GET | `/api/listings/favorites` | Authenticated users | GET /api/listings/favorites — Get user's favorited... |
| GET | `/api/listings/mine` | Authenticated users | GET /api/listings/mine — My listings (authenticate... |
| GET | `/api/listings/similar` | None | GET /api/listings/similar?listing_id=X&limit=4 Ret... |
| GET/POST | `/api/locations` | Authenticated users | API endpoint at /api/locations |
| GET/PUT/DELETE | `/api/locations/[id]` | Staff only | API endpoint at /api/locations/[id] |
| POST | `/api/locations/[id]/approve` | Staff only | API endpoint at /api/locations/[id]/approve |
| GET/POST | `/api/locations/[id]/bookings` | Authenticated users | API endpoint at /api/locations/[id]/bookings |
| POST | `/api/marketplace/cart/checkout` | Authenticated users | POST /api/marketplace/cart/checkout Multi-item che... |
| POST | `/api/marketplace/cart/validate` | None | POST /api/marketplace/cart/validate Availability c... |
| GET/POST | `/api/marketplace/orders` | Authenticated users | POST /api/marketplace/orders — Create order + Payr... |
| GET/PATCH | `/api/marketplace/orders/[id]` | None | GET   /api/marketplace/orders/[id] — Order detail ... |
| POST | `/api/marketplace/orders/[id]/confirm-receipt` | None | POST /api/marketplace/orders/[id]/confirm-receipt ... |
| POST | `/api/marketplace/orders/[id]/review` | None | POST /api/marketplace/orders/[id]/review Buyer lea... |
| PATCH | `/api/me/preferences` | Authenticated users | API endpoint at /api/me/preferences |
| GET | `/api/members/[id]` | None | GET /api/members/[id] — Public member (buyer) prof... |
| POST | `/api/membership/apply` | Authenticated users | API endpoint at /api/membership/apply |
| GET/POST | `/api/messages` | Authenticated users | API endpoint at /api/messages |
| GET | `/api/messages/[conversationId]` | None | API endpoint at /api/messages/[conversationId] |
| GET/POST | `/api/messages/conversations` | Authenticated users | API endpoint at /api/messages/conversations |
| GET | `/api/newsletter/confirm` | None | API endpoint at /api/newsletter/confirm |
| GET/POST | `/api/newsletter/subscribe` | Staff only | API endpoint at /api/newsletter/subscribe |
| GET/PATCH | `/api/notifications` | Authenticated users | Notifications API GET  /api/notifications        -... |
| PATCH | `/api/notifications/[id]` | None | Single Notification API PATCH /api/notifications/[... |
| GET | `/api/org-numbers` | None | GET /api/org-numbers Returns organizational number... |
| GET/POST | `/api/payments/escrow/[id]` | None | API endpoint at /api/payments/escrow/[id] |
| GET | `/api/payments/mock-redirect` | None | GET /api/payments/mock-redirect — generic dev mock... |
| GET | `/api/payments/payrexx-mock-redirect` | None | GET /api/payments/payrexx-mock-redirect — Dev mock... |
| POST | `/api/payments/payrexx-webhook` | None | POST /api/payments/payrexx-webhook — Handles Payre... |
| GET | `/api/payments/providers` | None | GET /api/payments/providers — rails offerable to t... |
| POST | `/api/payments/refund` | Authenticated users | API endpoint at /api/payments/refund |
| POST | `/api/payments/webhook/[provider]` | None | POST /api/payments/webhook/[provider] — unified mu... |
| GET/POST | `/api/pools` | Authenticated users | GET  /api/pools — Browse active subscription pools... |
| GET/DELETE | `/api/pools/[id]` | Super admin only | GET    /api/pools/[id] — Pool detail with members ... |
| POST | `/api/pools/[id]/join` | Authenticated users | POST /api/pools/[id]/join — Join a subscription po... |
| POST | `/api/pools/[id]/leave` | Authenticated users | POST /api/pools/[id]/leave — Leave a subscription ... |
| GET | `/api/pools/my` | Authenticated users | GET /api/pools/my — Return pool IDs the current us... |
| GET/POST | `/api/presentations/comments` | Super admin only | GET = "who am I" for the comment form, so a signed... |
| GET | `/api/profiles/[id]` | None | GET /api/profiles/[id] — Unified public profile. O... |
| POST | `/api/projects/[slug]/contributions` | None | POST /api/projects/[slug]/contributions — Visitor ... |
| GET | `/api/projects/[slug]/needs` | None | GET /api/projects/[slug]/needs — Public list of op... |
| GET/POST | `/api/protocols` | Super admin only | Protocols API GET /api/protocols - List protocols ... |
| GET/PATCH/DELETE | `/api/protocols/[id]` | Super admin only | Protocol Detail API GET /api/protocols/[id] - Get ... |
| GET/POST | `/api/protocols/[id]/actions` | None | Protocol Action Links API GET /api/protocols/[id]/... |
| POST | `/api/protocols/[id]/finalize` | None | Protocol Finalize API POST /api/protocols/[id]/fin... |
| POST | `/api/protocols/[id]/import-tasks` | Super admin only | Protocol Import Tasks API POST /api/protocols/[id]... |
| POST | `/api/protocols/[id]/process-notes` | Super admin only | Protocol Process Notes API POST /api/protocols/[id... |
| POST | `/api/protocols/[id]/process-sources` | Super admin only | Protocol Process Sources API — unified endpoint. P... |
| GET | `/api/protocols/templates` | Staff only | Protocol Templates API GET /api/protocols/template... |
| POST | `/api/public/blog/submit` | Staff only | API: Public Blog Submission POST /api/public/blog/... |
| POST | `/api/public/claim` | None | Public: a real person claims a placeholder account... |
| GET | `/api/public/financials` | None | Public financial transparency API Returns yearly a... |
| GET/POST | `/api/public/share/[token]` | None | Public share endpoint (no login) — reachable at /a... |
| POST | `/api/public/share/[token]/ask` | None | Ask Hirn about a shared deliverable (public / no l... |
| POST | `/api/referral/invite` | Authenticated users | API endpoint at /api/referral/invite |
| GET | `/api/referral/my-code` | Authenticated users | API endpoint at /api/referral/my-code |
| GET | `/api/repairer/dashboard` | Staff only | Repairer Dashboard API GET /api/repairer/dashboard... |
| GET/POST | `/api/reviews` | Staff only | API endpoint at /api/reviews |
| GET/PUT/DELETE | `/api/reviews/[id]` | Staff only | API endpoint at /api/reviews/[id] |
| POST/PUT/DELETE | `/api/reviews/[id]/response` | Staff only | API endpoint at /api/reviews/[id]/response |
| POST | `/api/reviews/[id]/vote` | None | API endpoint at /api/reviews/[id]/vote |
| GET | `/api/search-index` | Authenticated users | GET /api/search-index — compact, user-scoped index... |
| GET | `/api/search/listings` | None | GET /api/search/listings — Search listings via Mei... |
| GET | `/api/sellers/[id]` | None | GET /api/sellers/[id] — Public seller profile with... |
| GET/PATCH | `/api/sellers/me` | Authenticated users | GET  /api/sellers/me — Return own seller profile (... |
| GET | `/api/services` | None | API: Public Services GET /api/services - List acti... |
| GET | `/api/stats/community` | None | API endpoint at /api/stats/community |
| GET | `/api/stats/impact` | None | GET /api/stats/impact Returns live impact metrics ... |
| POST | `/api/suggestions` | Authenticated users | Suggestions / site-feedback API POST /api/suggesti... |
| GET | `/api/task-analytics` | Staff only | Task Analytics API GET /api/task-analytics - Get t... |
| GET/POST | `/api/task-projects` | Staff only | Task Projects API GET /api/task-projects - List al... |
| GET/PATCH/DELETE | `/api/task-projects/[id]` | None | Task Project Detail API GET /api/task-projects/[id... |
| GET | `/api/task-requests` | Staff only | Task Requests API GET /api/task-requests - Get pen... |
| PATCH | `/api/task-requests/[id]` | None | Task Request Response API PATCH /api/task-requests... |
| GET/POST | `/api/tasks` | Staff only | Tasks API GET /api/tasks - List tasks with filters... |
| GET/PATCH/DELETE | `/api/tasks/[id]` | None | Task Detail API GET /api/tasks/[id] - Get single t... |
| POST | `/api/tasks/[id]/attention` | None | Task Attention Flag API POST /api/tasks/[id]/atten... |
| POST | `/api/tasks/[id]/complete` | None | Task Completion API POST /api/tasks/[id]/complete ... |
| POST | `/api/tasks/[id]/request` | None | Task Request API POST /api/tasks/[id]/request - Re... |
| PUT | `/api/team/reminder` | Staff only | PUT /api/team/reminder — personal monthly Zeiterfa... |
| POST/DELETE | `/api/team/report/[userId]/[month]/share` | Super admin only | Mint (POST) or revoke (DELETE) the public share li... |
| GET/PUT | `/api/team/schedule` | Authenticated users | PUT /api/team/schedule — a team member saves THEIR... |
| GET | `/api/technicians` | None | Unified Technicians API GET /api/technicians - Sea... |
| GET | `/api/technicians/[id]` | None | Unified Technician Detail API GET /api/technicians... |
| GET/POST | `/api/time-off` | Staff only | Time-off requests — staff self-service. GET  /api/... |
| PATCH | `/api/time-off/[id]` | Staff only | PATCH /api/time-off/:id  → requester cancels their... |
| GET/POST/PUT | `/api/timecards` | Staff only | API endpoint at /api/timecards |
| GET | `/api/timecards/saldo` | Super admin only | GET /api/timecards/saldo — Zeit- und Feriensaldo. ... |
| POST | `/api/uploads` | Authenticated users | API endpoint at /api/uploads |
| POST | `/api/user/change-password` | Authenticated users | Change Password API POST /api/user/change-password |
| GET | `/api/user/donations` | Authenticated users | GET /api/user/donations Fetch current user's donat... |
| GET | `/api/user/export-data` | Authenticated users | GET /api/user/export-data GDPR/Swiss DSG compliant... |
| GET/POST | `/api/user/orangecat` | Authenticated users | GET  /api/user/orangecat — is this account an Oran... |
| GET/PUT | `/api/user/profile` | Authenticated users | User Profile API GET /api/user/profile - Get curre... |
| GET | `/api/user/reviews` | Authenticated users | API endpoint at /api/user/reviews |
| GET/PUT/PATCH | `/api/user/technician-profile` | Authenticated users | Technician Profile API GET /api/user/technician-pr... |
| GET | `/api/user/workshop-registrations` | Authenticated users | API endpoint at /api/user/workshop-registrations |
| GET | `/api/version` | None | API endpoint at /api/version |
| GET/POST | `/api/vote/[id]` | Authenticated users | Public Vote API GET  /api/vote/[id] - Fetch public... |
| POST | `/api/webhooks/kivvi` | None | POST /api/webhooks/kivvi — Inbound receiver for Ki... |
| GET | `/api/workshops` | Authenticated users | API endpoint at /api/workshops |
| GET | `/api/workshops/[slug]/instances` | None | API endpoint at /api/workshops/[slug]/instances |
| GET | `/api/workshops/[slug]/materials` | Authenticated users | API endpoint at /api/workshops/[slug]/materials |
| POST | `/api/workshops/[slug]/register-with-payment` | Authenticated users | API endpoint at /api/workshops/[slug]/register-wit... |
| GET | `/api/workshops/[slug]/reviews` | None | API endpoint at /api/workshops/[slug]/reviews |
| POST | `/api/workshops/propose` | Staff only | API endpoint at /api/workshops/propose |
| POST | `/api/workshops/register` | Authenticated users | API endpoint at /api/workshops/register |
| GET | `/api/workshops/registration/[instanceId]` | Authenticated users | API endpoint at /api/workshops/registration/[insta... |
| PATCH | `/api/workshops/registrations/[id]` | None | API endpoint at /api/workshops/registrations/[id] |
