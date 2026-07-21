---
title: "Why We Are Hardening the Self-Host Deploy"
excerpt: "Coolify is not the next sensible step. The better step is a reproducible, auditable deploy on our existing Hetzner infrastructure."
featuredImage: "/blog/deploy-hardening.svg"
category: "Technik"
tags:
  - devops
  - hetzner
  - deployment
  - monitoring
  - ssot
publishedAt: "2026-06-16"
published: true
---

RevampIT currently runs as a self-hosted app on Hetzner at `revampit.orangecat.ch`. The public domain `revamp-it.ch` still points to the old Joomla/Apache site and is therefore not the production target of the new platform.

The obvious question was: do we need Coolify, Dokploy, or another Platform-as-a-Service layer? Our answer for now is no. Not because such tools are bad, but because they do not solve the first problem.

The actual problem is simpler: a deploy has to be reproducible, have a clear quality gate, roll back in case of failure, and make visible which version is currently running. Our existing Caddy, systemd, and rsync setup can gain these properties directly, without putting a new control plane on the same production server.

That is why we are hardening the existing path first. The deploy script still builds a Next.js standalone artifact, copies it to the Hetzner server, and restarts the service. What is new is that a previous release is preserved before activation. If the service does not become active or `/api/health` does not return a successful status, it automatically rolls back.

There is also a `/api/version` endpoint. It shows app version, Git SHA, and build time. That is small but important: operations and monitoring need an unambiguous answer to the question of what is really live.

One detail was decisive here: runtime files like `.env` and `launch.sh` do not belong in the Git repository, but must be present in every activated release. The deploy script therefore carries these files over server-locally from the current app directory before it starts a new release.

Meilisearch is now part of the operational picture again as well. The app could fall back to SQL search without Meilisearch, but `/api/health` was only `degraded` as a result. On the Hetzner server, Meilisearch therefore runs as a localhost-only Docker service with a server-local key.

The GitHub deploy workflow also gains a clearer gate: lint and typecheck run before the production deploy. The local push deploy stays convenient, but should not be the long-term single source of truth. The target state is: GitHub builds, checks, and deploys; local deploys remain a manual tool for exceptional cases.

What may come later: if we run many apps, customer environments, or self-service deploys, a control plane can become worthwhile. Then we will soberly evaluate Coolify, Dokploy, or Kamal. Until then, the rule is: less platform, more reliable operational discipline.
