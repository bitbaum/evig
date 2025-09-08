---
created_date: 2025-09-08
last_modified_date: 2025-09-08
last_modified_summary: Initial draft of Reboot Content Admin interface blueprint focused on static pages.
---

## Reboot Content Admin Interface (Phase 1)

This document defines the user-facing admin interface for Reboot Content so non-technical team members can manage static website pages (About, Contact, Services) without developer assistance.

Audience: Editors, Admins, and Developers new to the project.

## Goals

- Enable non-technical users to edit and publish static pages safely
- Keep the interface simple and focused (Phase 1 = static pages only)
- Follow security and accessibility best practices

## Scope (Phase 1)

- Login/logout with role-based access (Admin, Editor)
- Pages:
  - List static pages with search/sort
  - Create/edit/delete pages (Admin can delete)
  - WYSIWYG editor
  - Draft → Publish flow
  - Preview before publish
- Media uploads for images (type/size validation)

Out of scope (Phase 1): scheduling, advanced workflows, analytics, content version diffs UI.

## Architecture Overview

- Frontend Option A (Recommended): Next.js route at `/admin`
  - Pros: unified UI, reuse existing components, single deploy
  - Cons: secure SSR/proxy for API cookies required

- Frontend Option B: Serve admin UI from Reboot Content at `/admin`
  - Pros: colocated with API, simpler CORS
  - Cons: duplicated styling, separate deploy pipeline

We recommend Option A.

### Frontend Components

- `/admin/login`: email/password form
- `/admin/pages`: list with search/sort, create button
- `/admin/pages/[id|new]`: editor (Title, Slug, Content, SEO; Save Draft; Publish; Preview)
- Image picker/upload modal

### Backend Endpoints (already available via Reboot Content API)

- Auth: `POST /api/auth/login`, `GET /api/auth/profile`, `PUT /api/auth/password`
- Static pages: `GET/POST/PUT/DELETE /api/content/static-pages`
- Media upload: `POST /api/content/uploads` (multipart/form-data)

## Data Model (Static Page)

Required fields:
- `slug` (unique, kebab-case)
- `title` (1..500 chars)
- `content` (HTML or structured JSON; required on publish)

Optional fields:
- `seo_title`, `seo_description`, `meta_keywords`
- `is_published` (bool), `published_at`
- `created_by`, `updated_by`, `created_at`, `updated_at`

## Security & Privacy

- JWT in httpOnly, SameSite=Lax cookies (Secure in production)
- CSRF protection: SameSite + CSRF token on state-changing requests
- CORS: restrict to frontend origin in production
- Rate limiting on auth and write endpoints
- Input validation on both client (Zod/Yup) and server (express-validator)
- File upload: MIME allowlist, size limits, sanitized filenames

## Accessibility & UX

- Labels and descriptions for all inputs
- Keyboard navigable editor and dialogs
- Visible focus states and sufficient contrast
- Clear error messaging and success toasts

## Setup & Quickstart (For Editors)

1) Get access from an Admin (you’ll receive email and temporary password)
2) Visit `/admin/login`, sign in, and change your password
3) Go to Pages, select a page, edit content, and Save Draft
4) Preview; when satisfied, Publish

## Developer Quickstart

Prerequisites:
- Node.js 18+
- Docker (for PostgreSQL)

Environment variables (frontend):
```
NEXT_PUBLIC_REBOOT_CONTENT_URL=http://localhost:3001
```

Environment variables (API):
```
JWT_SECRET=your-secure-random
DB_HOST=localhost
DB_PORT=5432
DB_NAME=revampit_cms
DB_USER=postgres
DB_PASSWORD=yourpassword
FRONTEND_URL=http://localhost:3000
```

Run services:
```
# In repo root
docker-compose up -d db  # or reboot-content DB if using the API compose file

# Start API (Reboot Content)
cd cms-api
npm install
npm run migrate
npm run dev

# Start frontend
cd ..
npm run dev
```

## Roles & Permissions

- Admin: Full access, can delete pages, manage users
- Editor: Create/edit/publish pages

## Phase 1 Delivery Checklist

- [ ] Auth flow (login/logout, JWT cookies)
- [ ] Guarded routes & role checks on UI
- [ ] Pages list/search/sort
- [ ] Editor with WYSIWYG (Tiptap or equivalent)
- [ ] Save Draft, Publish, Preview
- [ ] Image upload & picker
- [ ] Validation (client/server)
- [ ] A11y review

## Future Phases

- Version diff UI and rollback
- Scheduling and approvals
- Analytics and content insights
- Multi-language page management

## References

- Original demo backend by Cem (context): https://github.com/rebootl/revamp-backend-api.git
