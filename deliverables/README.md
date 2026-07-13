# Deliverables

Work products handed to a person or another system — reports, presentations,
mockups, one-off UI/CSS jobs, research write-ups. This folder is the **editable,
git-versioned source of truth**. Sharing and team-visibility happen via the
**deliverables index** in the app (see `docs/TEAM_TRANSPARENCY_PLAN.md` §4.6),
which points at a source here, an uploaded file (R2), or a public URL.

## Convention

- One folder per deliverable: `deliverables/<YYYY-MM-DD>-<kebab-slug>/`.
- Include a short `README.md` (or recipient note) explaining what it is, who it's
  for, and how to use/apply it.
- Edit as code; `git` history is the version story.

## Where a deliverable's shareable link comes from (pick by audience)

| Audience | How to share | Link |
|---|---|---|
| Team, tied to a task/owner | Create a deliverable record at `/admin/deliverables`; open the detail page | `/admin/deliverables/<id>` |
| External recipient (partner or teammate) | On the detail page, click **Freigabe-Link erstellen** → send the tokenized link (read + comment, no login) | `/d/<token>` |
| Belongs on the public site | Keep the served file in `public/presentations/` etc.; set the deliverable's **URL** to that path so the detail + share page embed it | public URL |

The deliverables feature (`/admin/deliverables`, migration 125) is the SSOT
index. `deliverables.url` points at whichever rendering fits the audience (a
`public/presentations/*` path, an R2 file, or an external link); the git folder
here stays the editable source (`deliverables.source_path`) and powers the
**Agent-Briefing** button on the detail page. Feedback (comment / change_request
/ approval) lands in `deliverable_feedback` and notifies the owner's in-app bell.

## Index

| Date | Deliverable | For | Type | Notes |
|---|---|---|---|---|
| 2026-07-13 | [kivitendo-intake-ui](./2026-07-13-kivitendo-intake-ui/) | Team (Kivitendo) | mockup + CSS | Tablet-tauglich, gut leserlich UI for Kivitendo `sales_order_intake`; CSS-only restyle of the Kivi-rendered `#row_table_id` table. **Rendering:** served at `/presentations/kivitendo-intake` (mockup + downloadable CSS + install steps). **Catalogued as a Deliverable** in the app (`/admin/deliverables`) — share via its `/d/<token>` link; recipients can download the files, view the code, ask Hirn, and give feedback that lands in-app and pings the owner. |
