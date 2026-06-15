# Monitor-Upcycling mini-site

**created_date:** 2026-06-15  
**last_modified_date:** 2026-06-15  
**last_modified_summary:** Document reading flow SSOT, business plan split, shared page header, guide slug SSOT.

---

## Purpose

Public sub-site at `/projects/upcycling/*` for the Monitor-Upcycling project: explore lane (applications → gallery → build-your-own → wirkung) then evidence lane (business plan → status).

## SSOT map

| Concern | File |
|--------|------|
| Routes + nav order + reading flow | `src/config/upcycling-routes.ts` |
| Public asset paths | `src/config/upcycling-assets.ts` |
| Active vs archived citations | `src/config/upcycling-evidence.ts` |
| Gallery models | `src/data/upcycling-gallery.ts` |
| Published guide slugs | `src/data/upcycling-guides.ts` |
| Status numbers + milestones | `src/data/upcycling-status.ts` |
| Business plan content | `messages/*.json` → `projects.upcycling.businessPlan` |
| Business plan shape parity | `npm run i18n:businessplan` |

## Reading flow

One primary “continue reading” link per page (`UpcyclingNextStepBand` in layout):

```
landing (terminal)
applications → gallery → build-your-own → wirkung → businessplan → status (terminal)
lenovo-l2251pwd → gallery
```

Flow keys: `UPCYCLING_PAGE_FLOW` in `upcycling-routes.ts`.

Interest/newsletter band (`UpcyclingInterestBand`) is skipped on landing, business plan, and status.

## Page layout

- **Shared chrome:** `layout.tsx` → sub-nav, next-step band, interest band (where applicable).
- **Shared header:** `UpcyclingPageHeader.tsx` on status, wirkung, build-your-own.
- **Business plan:** thin `businessplan/page.tsx` + `types.ts`, `components/primitives.tsx`, `components/sections.tsx`, `components/HeroAndToc.tsx`, `DesktopTocRail.tsx`.

## i18n scripts

```bash
npm run i18n:businessplan          # parity check (required before merge)
node scripts/sync-businessplan-locales.mjs   # after DE businessPlan edits
node scripts/prune-businessplan-archive.mjs  # archive stale citation keys
```

## Local photos

Real workshop photos live under `public/projects/upcycling/`. Only Lenovo L2251pwd is fully documented today; see `public/projects/upcycling/gallery/REAL_PHOTOS.md`.
