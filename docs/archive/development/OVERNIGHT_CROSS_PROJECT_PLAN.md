# Overnight Cross-Project Plan: Kivitendo + revamp-info Fundraising Support

**Date:** 2026-02-17  
**Scope:** Practical integration improvements for RevampIT operations across:
- `/home/g/dev/kivitendo-erp`
- `/home/g/dev/revamp-info`
- `/home/g/dev/revampit`

---

## 1) Objective

Improve operational coordination between accounting/ERP reality (Kivitendo), fundraising execution (revamp-info), and public/admin conversion funnels (revampit) with low-risk, incremental changes.

---

## 2) Current-State Facts (verified locally)

1. **revamp-info already contains fundraising CRM primitives**
   - `fundraising_applications`, `fundraising_foundations`, `fundraising_contacts`, activity log (Drizzle schema).
   - API routes for applications dashboard and CRUD already exist.

2. **revamp-info has Kivitendo-derived financial datasets**
   - e.g. `/home/g/dev/revamp-info/daten/*.csv` and financial narrative in fundraising pages.

3. **revampit already has donation + workshop admin/user flows**
   - Donation APIs and admin pages exist (`/app/admin/donations`, `/api/admin/donations/*`).
   - Workshop registration + lifecycle APIs exist (`/api/workshops/*`, `/api/admin/workshops/*`).

4. **kivitendo-erp repo is available locally**
   - Full ERP codebase present, plus frontend-next and menus.

---

## 3) Implemented Tonight (non-breaking)

### ✅ New export endpoint in `revamp-info`

Implemented and shipped:
- **File:** `src/app/api/export/fundraising-pipeline/route.ts`
- **Route:** `GET /api/export/fundraising-pipeline`
- **Output:** CSV with pipeline health + funding progress fields:
  - application/foundation IDs
  - status, priority, assignee
  - requested vs awarded CHF
  - award coverage %
  - submission/decision dates + days-to-decision

**Why this matters:**
- Gives immediate admin visibility and reporting bridge between operational fundraising tracking and broader finance/control reporting.
- Can be consumed by revampit admin dashboards, spreadsheet workflows, or periodic ETL.

**Validation:**
- ESLint passed for new route.

**Git:**
- Repo: `revamp-info`
- Commit: `5ae82d1`
- Pushed to `main`.

---

## 4) High-Impact Quick Wins (1–7 days)

## QW1 — Unified weekly operations packet (CSV bundle)

**What:** Generate one bundle each week:
- Kivitendo revenue/cost extracts
- revamp-info fundraising pipeline export
- revampit donations/workshops aggregate export

**Action:** Add a small script in `revampit` to pull all three into `docs/reports/weekly/YYYY-WW/`.

**Outcome:** One source for board/ops check-ins without manual copy-paste.

---

## QW2 — Donation → accounting handoff contract

**What:** Define canonical fields for posting/verification:
- donation id, donor identity, amount/value, type, receipt status, posting status, accounting period.

**Action:** Add a `posting_status` + `posting_reference` field in revampit donations flow (soft extension, nullable).

**Outcome:** Prevents donation records from “floating” outside accounting closure.

---

## QW3 — Workshop funnel KPI feed to fundraising narrative

**What:** Expose weekly workshop KPIs for grant storytelling:
- registrations, attendance proxy, repeat participants, free/paid split.

**Action:** New read-only endpoint in revampit, then import into revamp-info “Wirkung/Fundraising dashboard” section.

**Outcome:** Stronger grant evidence and quicker application updates.

---

## QW4 — Lead capture harmonization

**What:** Normalize lead events from contact, donate, workshops into one lightweight event model.

**Action:** Add event write helper in revampit (`lead_events` table or append-only JSON log) with source labels:
- `contact_form`, `donation_interest`, `workshop_interest`, `foundation_outreach`.

**Outcome:** Real funnel visibility (interest → action → funded impact).

---

## 5) Medium-Term Plan (2–8 weeks)

## M1 — Cross-project “Ops Cockpit” in revampit admin

Create `/admin/ops-cockpit` with 4 cards:
1. Finance trend (from Kivitendo export)
2. Fundraising pipeline (from revamp-info export)
3. Donation pipeline (from revampit donations)
4. Workshop pipeline (from revampit workshops)

Include alert thresholds:
- high pending decisions > X days
- donation receipts backlog
- workshop no-show risk
- revenue concentration warning.

---

## M2 — Deterministic ETL layer (file-first, then API-first)

Phase A (safe):
- nightly export/import via CSV snapshots in versioned folder.

Phase B:
- authenticated API pulls and incremental sync checkpoints.

Key constraints:
- idempotent upserts
- explicit source timestamps
- no overwrite without provenance.

---

## M3 — Grant accountability packet generator

Given a foundation application ID, auto-generate packet with:
- latest impact KPIs
- spending/own-contribution evidence
- milestone status
- next-quarter plan.

Leverage existing revamp-info docs/components and revampit PDFs where possible.

---

## M4 — Chart-of-accounts mapping for fundraising streams

Map fundraising categories (grants, donations, workshops, memberships) to Kivitendo account buckets and enforce consistency checks.

Outcome:
- zero ambiguity between narrative and accounting lines.

---

## 6) Risks / Unknowns

1. Exact Kivitendo posting process for donations/workshops is not yet codified in one public mapping file.
2. Some repos currently contain unrelated local modifications; cross-repo refactors should happen in isolated PR slices.
3. Production DB credentials/access patterns across revampit/revamp-info need explicit shared integration policy (read-only tokens for reporting first).

---

## 7) Concrete Next Commands

### A) Consume newly implemented fundraising export
```bash
curl -s "https://<revamp-info-host>/api/export/fundraising-pipeline" -o fundraising-pipeline.csv
```

### B) Build first weekly packet skeleton in revampit
```bash
mkdir -p /home/g/dev/revampit/docs/reports/weekly/$(date +%G-W%V)
```

### C) Add integration tracker doc
Create:
- `/home/g/dev/revampit/docs/development/INTEGRATION_BACKLOG.md`
with sections: quick wins, in-progress, blocked, done.

### D) First ops meeting agenda (30 min)
- Confirm canonical funnel definitions
- Confirm accounting posting fields
- Decide ETL mode (CSV-first vs API-first)
- Assign owners for QW1–QW4

---

## 8) Recommended Delivery Sequence

1. **Now:** Use new revamp-info pipeline CSV export for decision meetings.
2. **This week:** Implement QW1 + QW2 (highest operational leverage).
3. **Next:** QW3 + QW4 to close funnel visibility gaps.
4. **Then:** M1 cockpit, then M2 deterministic ETL, then M3 packet automation.

---

## 9) Summary

The stack is already close to integrated: fundraising CRM (revamp-info), public/admin conversion systems (revampit), and accounting truth (Kivitendo) all exist. The biggest gains now come from **reliable shared reporting contracts** and **small glue layers**, not major rewrites.

Tonight’s shipped endpoint (`/api/export/fundraising-pipeline`) is the first practical bridge and can be used immediately.
