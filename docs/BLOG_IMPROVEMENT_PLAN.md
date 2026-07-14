# Blog Improvement Plan

Living tracker for the blog subsystem (reader + admin). Born from the full audit
on 2026-07-14. Check items off as they ship. Keep this file honest — it is the
SSOT for "what's left" on the blog.

**Architecture reminder:** the public site renders a *merge* of `content/posts/*.md`
(git) + `blog_posts` (DB), deduped by slug (DB wins) — `src/lib/blog-merge.ts`.
Comments (`blog_comments`, migration 119) are keyed by slug, so they work for both
sources. Admin manages the DB blog at `/admin/content/blog`.

---

## Phase 1 — Correctness bugs (data-loss / abuse risk) ✅ DONE 2026-07-14

- [x] **SEO fields dropped on create** — `POST /api/admin/blog` now reads + inserts
  `seoTitle`/`seoDescription` (was only persisted on PATCH → save-edit-save dance).
  `src/app/api/admin/blog/route.ts`
- [x] **PATCH could blank a live post** — reject empty `title`/`content` when
  explicitly provided. `src/app/api/admin/blog/[id]/route.ts`
- [x] **Silent DB-error fallback in admin list** — DB failure now logs + shows a
  warning banner instead of masquerading as a file-only list.
  `src/app/admin/content/blog/page.tsx`
- [x] **Comment moderation surface** — new staff-only `PATCH /api/blog/comments/[id]`
  hide/unhide (uses the pre-existing `hidden` status), plus a dedicated
  moderation page `/admin/content/blog/comments` (list, search, filter, hide/
  unhide, delete) linked from the blog admin header.
  `src/app/admin/content/blog/comments/*`, `src/app/api/blog/comments/[id]/route.ts`
- [x] **Featured-image upload** — sidebar now has an "Bild hochladen" button wired
  to the existing `/api/uploads` (R2), not URL-paste only.
  `src/components/admin/blog/BlogPostSidebar.tsx`

## Phase 2 — Reader-facing quick wins ✅ DONE 2026-07-14

- [x] **RSS discoverable** — `alternates.types` RSS link in the index metadata +
  a visible RSS icon-link in the blog nav bar. i18n key `blog.rss`.
- [x] **Copy-link / native share** — copy-URL button with copied-feedback and a
  `navigator.share` button (mobile, mount-detected). `ShareButtons.tsx`.
- [x] **Clickable taxonomy** — the post's category eyebrow links to
  `/blog?categories=<slug>` (DB slug or `slugifyCategory` fallback — SSOT in
  `blog-utils.ts`); tag pills link to `/blog?tag=<tag>`.
- [x] **Previous / next post navigation** — `BlogPrevNext.tsx` (sequential over
  the public listing, date-desc).
- [x] **Index loading skeleton** — `blog/loading.tsx`.
- [x] **Tap targets** — mobile filter pills `min-h-11`, comment delete
  `h-11 w-11 sm:h-8 sm:w-8`, tag pills `min-h-11`.
- [x] **Category pill row** — desktop row scrolls horizontally (`overflow-x-auto`,
  hidden scrollbar) instead of overflowing the sticky bar.
- [x] **Newsletter on the index** — `NewsletterSignup` before the footer CTA.

## Phase 3 — Scale features ✅ DONE 2026-07-14

- [x] **Index pagination** — `paginateBlogIndex()` in `blog-utils.ts`
  (unit-tested), `BLOG_PAGE_SIZE` in `src/config/blog.ts`, shared `Pagination`
  primitive; filters preserved in page links; out-of-range pages clamp.
- [x] **Admin list pagination** — SQL LIMIT/OFFSET + count aggregate; stats now
  computed via SQL over ALL posts (was: page slice); file posts pinned to page 1.
- [x] **Blog search** — `?q=` server-side match over title/excerpt/tags, search
  field in the nav (desktop + mobile dropdown), result-count + clear-filter bar.
  Deliberate non-Meilisearch (YAGNI at current volume; revisit at ~100+ posts).
- [x] **Tag filtering** — `?tag=` on the index (flat result list); tag pills on
  posts link there. Dedicated `/blog/tag/<tag>` pages deliberately NOT built —
  the query-param filter covers the need without new routes.

## Phase 4 — Design-system consistency ✅ DONE 2026-07-14

- [x] **Admin editor form uses `<Card>`** — all 9 hand-rolled card divs in
  `BlogPostSidebar`/`BlogPostEditor` replaced with the primitive. The publish
  toggle stays hand-rolled (single instance — extraction is premature until the
  3rd use).
- [x] **`RelatedPosts` card** — now uses the `<Card>` primitive.
- [x] **X share button `bg-black`** — kept: brand-standard for X, matches the
  other `bg-brand-*` social buttons.

## Decisions (need a human call before building)

- [ ] **Guest comments?** Today comments require login. If we ever allow guest
  comments, a pre-publish moderation queue becomes mandatory (spam). The hide/
  unhide plumbing from Phase 1 is the foundation; a `pending` status + queue view
  would extend it.
- [ ] **Likes / reactions / bookmarks** — intentionally absent. Build only if we
  decide engagement metrics are worth the surface area.

---

*Audit + Phase 1 by Claude, 2026-07-14.*
