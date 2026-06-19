# RevampIT Deployment Guide

**Created:** 2024-12-29
**Last Updated:** 2026-06-19
**Summary:** Production deploys run via GitHub Actions → Hetzner self-host. Vercel is retired.

Production runs on a **self-hosted Next.js standalone build on a Hetzner box**
(`ubuntu@167.233.22.31`), served at **`https://revampit.orangecat.ch`** behind
`systemd` (`revampit-app`). **Vercel is no longer used for production.**

There is exactly **one** production deploy method: **push to `main`**. GitHub
Actions does the rest.

---

## The deploy flow

```
Developer
   │  git push origin main
   ▼
GitHub Actions  (.github/workflows/deploy-selfhost.yml)
   │  npm ci → npm run lint → npm run typecheck
   │  write .env.selfhost.local (from SELFHOST_ENV secret)
   │  set up SSH (from HETZNER_SSH_PRIVATE_KEY secret)
   │  bash scripts/selfhost-deploy-revampit.sh
   ▼
Build standalone output in the runner
   │
   ▼
Apply unrecorded scripts/db/migrations/*.sql to PROD Postgres  (before activating)
   │
   ▼
rsync release → ubuntu@167.233.22.31:/opt/revampit/releases/<id>
   │  swap /opt/revampit/app → release
   │  systemctl restart revampit-app
   ▼
Health gate: GET /api/health  AND  real page render on http://localhost:4004/
   │
   ├─ pass → live at https://revampit.orangecat.ch
   └─ fail → auto-rollback to /opt/revampit/app.previous
```

`concurrency: cancel-in-progress` is set on the workflow, so two pushes in quick
succession won't clobber each other — the older run is cancelled and the latest
push wins.

---

## How it works (step by step)

### Trigger

Any push to `main` starts the **"Deploy production app"** workflow
(`.github/workflows/deploy-selfhost.yml`). Nothing else deploys to production.

### What GitHub Actions runs

1. **Checkout** the pushed commit.
2. **Setup Node 20** (with npm cache).
3. **`npm ci`** — clean install.
4. **`npm run lint`** — ESLint. A failure here fails the workflow and **nothing
   is deployed**.
5. **`npm run typecheck`** — TypeScript. Same: failure aborts the deploy.
6. **Write `.env.selfhost.local`** from the `SELFHOST_ENV` repo secret
   (`chmod 600`).
7. **Setup SSH** from the `HETZNER_SSH_PRIVATE_KEY` repo secret, and add the
   Hetzner host to `known_hosts`.
8. **Run `bash scripts/selfhost-deploy-revampit.sh`** — the actual deploy.

If either required secret is missing, the workflow logs a notice and exits
cleanly without deploying (see Troubleshooting).

### What the deploy script does

`scripts/selfhost-deploy-revampit.sh`:

1. **Builds the Next.js standalone output** locally in the runner.
2. **Applies pending DB migrations to PROD first.** Any
   `scripts/db/migrations/*.sql` not yet recorded in the `schema_migrations`
   table on the production Hetzner Postgres is applied **before** the new release
   is activated. A migration failure aborts the deploy (the running release is
   left untouched).
3. **Rsyncs the release** to `/opt/revampit/releases/<id>` on
   `ubuntu@167.233.22.31`.
4. **Swaps the symlink** `/opt/revampit/app` → the new release.
5. **Restarts the service**: `systemctl restart revampit-app`.
6. **Health-gates** the new release on **both**:
   - `GET /api/health`, and
   - a real page render on `http://localhost:4004/`.

   If **either** check fails, it **auto-rolls back** to
   `/opt/revampit/app.previous` and restarts, so a bad build never stays live.

**Persistent uploads:** user uploads live in `/opt/revampit/uploads` and are
symlinked into each release's `public/uploads`, so they survive release swaps.

---

## Required GitHub repo secrets

Set these once under **Settings → Secrets and variables → Actions → New
repository secret**:

| Secret | Purpose |
|--------|---------|
| `HETZNER_SSH_PRIVATE_KEY` | Private SSH key for `ubuntu@167.233.22.31`. Used to rsync the release and run remote `systemctl` commands. |
| `SELFHOST_ENV` | Full contents of `.env.selfhost.local` (multiline). Written to disk in the runner so the build/deploy has the production env. |

Without both, the workflow skips the deploy and logs a notice.

To set a secret via the GitHub CLI instead of the dashboard:

```bash
gh secret set HETZNER_SSH_PRIVATE_KEY < /path/to/private_key
gh secret set SELFHOST_ENV < /path/to/.env.selfhost.local
```

---

## Monitoring a deploy

- **GitHub Actions tab** → "Deploy production app" run. Each step (lint,
  typecheck, deploy) shows live logs.
- Or from the CLI:
  ```bash
  gh run list --workflow=deploy-selfhost.yml
  gh run watch          # follow the latest run
  ```
- A deploy is **only** done when the workflow's Deploy step finishes green — that
  means the health gate passed on the box. **Never report a feature as deployed
  before the run is green.**

---

## Manual deploy (in a pinch)

The local `.husky/pre-push` hook is **disabled** (`exit 0`) — CI owns production
deploys. If you must deploy from a developer machine (e.g. Actions is down), and
you have a valid `.env.selfhost.local` (gitignored) plus SSH access to the box:

```bash
npm run deploy:selfhost
```

This runs the same `scripts/selfhost-deploy-revampit.sh` locally: build →
migrate → rsync → restart → health gate → rollback on failure. Prefer pushing to
`main` whenever possible so lint/typecheck and concurrency control still apply.

---

## Troubleshooting

### Workflow fails at the Lint or Type check step

The deploy never started — nothing changed in production. Fix locally and push
again:

```bash
npm run lint
npm run typecheck
```

### Workflow skips with a "secrets not set" notice

`HETZNER_SSH_PRIVATE_KEY` and/or `SELFHOST_ENV` is missing or empty. Add both
repo secrets (see above) and re-run the workflow.

### SSH / "Permission denied" or host key errors in the Deploy step

- The `HETZNER_SSH_PRIVATE_KEY` secret is wrong, truncated, or for the wrong key
  pair. Re-set it with the correct private key for `ubuntu@167.233.22.31`.
- If the box's host key changed, the `ssh-keyscan` step still runs each time, so
  stale `known_hosts` isn't usually the cause — focus on the key value.

### Deploy aborts during migrations

A `scripts/db/migrations/*.sql` failed to apply to the PROD Hetzner Postgres. The
running release is **left in place** (no swap happened). Read the workflow logs
for the failing SQL, fix the migration, and push again. To apply/inspect
manually: `ssh ubuntu@167.233.22.31`, read `DATABASE_URL` from
`/opt/revampit/app/.env`, and run the `.sql` against `psql "$DATABASE_URL"` in a
transaction, then record it in `schema_migrations`.

### Release deployed but auto-rolled back

The health gate failed — either `GET /api/health` or the real page render on
`http://localhost:4004/` didn't succeed, so the script reverted to
`/opt/revampit/app.previous`. Production is still on the previous good release.
Check the workflow logs and the service:

```bash
ssh ubuntu@167.233.22.31
journalctl -u revampit-app -n 100 --no-pager
systemctl status revampit-app
```

Common causes: a runtime env var missing from `SELFHOST_ENV`, a component that
throws during SSR on the home page, or a migration that changed schema the new
code didn't expect.

---

## Related

- Workflow: `.github/workflows/deploy-selfhost.yml`
- Deploy script: `scripts/selfhost-deploy-revampit.sh`
- DB / prod environment notes: project `CLAUDE.md` → "Database Configuration"
- GitHub secrets reference: `docs/guides/github-vercel-setup.md` (legacy filename;
  see note at its top)
