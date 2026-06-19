# GitHub Deployment Secrets (filename legacy)

> **Legacy — Vercel is no longer used for production (retired).**
> See **`deployment.md`** for the current **GitHub Actions → Hetzner self-host**
> deploy flow.
>
> **The filename `github-vercel-setup.md` is now misleading** — there is no
> Vercel integration anymore. This file is kept only to document the GitHub repo
> secrets the current self-host workflow needs.

**Last Updated:** 2026-06-19

---

## Current setup: what you actually need

Production deploys run when you **push to `main`**, via the GitHub Actions
workflow `.github/workflows/deploy-selfhost.yml`, which builds and rsyncs a
Next.js standalone release to the Hetzner box (`ubuntu@167.233.22.31`) serving
`https://revampit.orangecat.ch`. Full details: **`deployment.md`**.

That workflow requires exactly **two** repository secrets:

| Secret | Purpose | Used by |
|--------|---------|---------|
| `HETZNER_SSH_PRIVATE_KEY` | Private SSH key for `ubuntu@167.233.22.31`. | "Setup SSH" step writes it to `~/.ssh/id_ed25519`; used to rsync the release and run remote `systemctl restart revampit-app`. |
| `SELFHOST_ENV` | Full contents of `.env.selfhost.local` (multiline). | "Write selfhost env" step writes it to disk so the build + deploy have the production environment. |

If either secret is missing or empty, the workflow logs a notice and exits
without deploying.

### How to set a GitHub repo secret

**Dashboard:** Repository → **Settings → Secrets and variables → Actions → New
repository secret**. Enter the name (e.g. `HETZNER_SSH_PRIVATE_KEY`) and paste
the value. Multiline values (like an SSH key or a full `.env`) paste fine.

**GitHub CLI:**

```bash
# Pipe a file's contents straight into a secret
gh secret set HETZNER_SSH_PRIVATE_KEY < /path/to/id_ed25519
gh secret set SELFHOST_ENV          < /path/to/.env.selfhost.local

# List configured secrets (values are never shown)
gh secret list
```

After setting both, push to `main` (or re-run the latest workflow) to deploy.

---

## Historical (Vercel, retired)

The project previously deployed via a GitHub → Vercel integration: importing the
repo in the Vercel dashboard, configuring environment variables in Vercel project
settings, and auto-deploying `main` (plus per-PR preview deployments) using a
`vercel.json` git config. The legacy `revampit.vercel.app` URL is retired and is
**not** the production app.

This approach is **no longer used** and should not be reintroduced. All
production deployment now goes through the self-host workflow described above and
in `deployment.md`.

---

## Related

- Current deploy guide: `deployment.md`
- Workflow: `.github/workflows/deploy-selfhost.yml`
- Deploy script: `scripts/selfhost-deploy-revampit.sh`
