# Architecture

> This page used to describe a split that is gone: a Next.js frontend, an Express CMS on its own port, and Vercel. That description kept sending agents to fix a server that is not there.

Production is **one Next.js app** on the Hetzner box.

- Site: https://evig.orangecat.ch
- Deploy: GitHub Actions → `scripts/selfhost-deploy-evig.sh`. The systemd unit may still be named revampit-app. That is the process name, not a second app.
- Database: self-hosted Postgres on that box. Neon is retired.
- Staff: `users.is_staff`. See `src/lib/permissions.ts`.
- Identity: `src/config/org.ts`.

Current detail: `docs/SHARED_CONTEXT.md` and `docs/guides/deployment.md`.

The previous text of this page is in git history. Do not restore it.
