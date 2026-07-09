---
title: "Mastodon Upgrade & Operations Runbook — net.miaumuh.ch"
excerpt: "Internal runbook: take net.miaumuh.ch from Mastodon 4.3.8 to 4.6.3 — cleanly, reversibly, without dropping off the network — and keep it healthy afterward. Unlisted; shareable only via this link."
author: "RevampIT Ops"
featuredImage: "/blog/mastodon-upgrade.svg"
category: "Betrieb"
tags:
  - mastodon
  - fediverse
  - ops
  - runbook
publishedAt: "2026-07-09"
visibility: unlisted
---

Bring **net.miaumuh.ch** (RevampIT's Mastodon) from an old release to the latest — cleanly, reversibly, without dropping off the network — and keep it healthy afterward. Written for the actual box, not a generic install.

| | |
|---|---|
| **Instance** | net.miaumuh.ch |
| **Version path** | 4.3.8 → 4.6.3 |
| **Host** | 77.109.139.66 (Init7, Switzerland) — a separate VM, not the Hetzner app box |
| **Hops** | 4.3 → 4.4 → 4.5 → 4.6 |

> **Current state (2026-07):** running **4.3.8**; latest stable is **4.6.3**. That's a three-minor-version jump with real infrastructure changes. Do **not** leap straight to 4.6 — step through each minor and run migrations at every hop, or you risk corrupting migration state.

---

## 00 · The golden rules

Read once, internalize forever. Everything below is a consequence of these.

1. **Back up before every upgrade.** DB dump + `.env.production` + a VM snapshot. No exceptions.
2. **Never skip minor versions.** 4.3 → 4.4 → 4.5 → 4.6, migrating at each step.
3. **Read the release notes for every minor you cross.** Breaking changes live there.
4. **Migration order matters.** Some releases want `db:migrate` *before* restart; some want new code running before certain (post-deploy) migrations. Follow each release's notes.
5. **Verify after every step**, not just at the end. `curl -sI https://net.miaumuh.ch` should stay `200`.
6. **Have rollback ready before you start.** A downgrade is not "run old code on the new schema" — rollback means restoring the snapshot/dump.

---

## 01 · Version requirements — why it isn't a `git pull`

Crossing into 4.6 raises the floor on the whole stack. Confirm these **before** starting.

| Dependency | 4.3 needed | 4.6 requires | Notes |
|---|---|---|---|
| Ruby | 3.0+ | **3.3+** | biggest source-install task |
| Node.js | 18+ | **22+** | via nvm or NodeSource |
| PostgreSQL | 12+ | **14+** | |
| Redis | 6.2+ | **7.0+** | |
| FFmpeg | 4.x | **5.1+** | video/audio transcoding |
| Image backend | ImageMagick | **libvips 8.13+** | ImageMagick support dropped in 4.6 |

> **The #1 gotcha — libvips.** 4.6 removes ImageMagick. If media processing (avatars, uploads, thumbnails) silently breaks after upgrading, this is almost always why. Install **libvips before** deploying 4.6.

On **Docker**, all of the above ships inside the official image — you only care about the host Postgres/Redis (if external) and disk space. On a **source install** you upgrade each on the host yourself.

---

## 02 · Pre-flight checklist

Run the recon block (§03) first, then confirm:

- **Disk:** at least 5 GB free on the partition holding the DB and the Mastodon dir (`df -h`).
- **DB size** known — the dump needs room.
- **Backups verified restorable** — not just taken. A backup you can't restore is decorative.
- **Maintenance window** chosen (low-traffic hour; the site blips on restart).
- **Release notes read** for 4.4.0, 4.5.0, 4.6.0 and any `.x` flagged "action required".
- **Rollback plan:** VM snapshot taken from the hosting panel immediately before starting.

---

## 03 · Recon — identify the deployment

All read-only. Run first; it decides which upgrade path you follow.

```bash
echo "===== OS ====="; lsb_release -d 2>/dev/null; uname -r
echo "===== DISK ====="; df -h /
echo "===== MEMORY ====="; free -h
echo "===== DOCKER? ====="; docker --version 2>/dev/null && docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}'
echo "===== MASTODON DIR ====="; ls -la /home/mastodon/live 2>/dev/null || ls -la /opt/mastodon 2>/dev/null \
  || { sudo find / -maxdepth 5 -name docker-compose.yml -path '*mastodon*' 2>/dev/null; \
       sudo find / -maxdepth 5 -name '.env.production' 2>/dev/null; }
echo "===== VERSIONS ====="; ruby -v 2>/dev/null; node -v 2>/dev/null; psql --version 2>/dev/null; redis-server --version 2>/dev/null
echo "===== IMAGE BACKEND ====="; vips --version 2>/dev/null || echo "libvips MISSING"; which convert 2>/dev/null && echo "ImageMagick present"
echo "===== SERVICES ====="; systemctl list-units --type=service 2>/dev/null | grep -iE 'mastodon|sidekiq|puma' || echo "(none — likely Docker)"
```

**Reading it:**

- `docker ps` shows `mastodon-web` / `-sidekiq` / `-streaming` + `db` + `redis` → **Docker path (§05)**.
- systemd units `mastodon-web/sidekiq/streaming` + a `/home/mastodon/live` dir → **source install (§06)**.

---

## 04 · Backup — mandatory, every single time

> **Do not skip.** Take the VM snapshot from your hosting panel first — it's the true one-click rollback. The DB dump below is the second line of defense.

```bash
# 1. VM snapshot from your hosting panel/CLI  ← the true rollback
# 2. Timestamped backup dir
TS=$(date +%Y%m%d-%H%M%S); BK=~/masto-backup-$TS; mkdir -p "$BK"
```

**Docker deployment:**

```bash
cd /path/to/mastodon              # dir with docker-compose.yml
docker compose exec -T db pg_dump -U postgres -Fc postgres > "$BK/mastodon-db.dump"
cp .env.production "$BK/"
docker compose config > "$BK/compose-resolved.yml"     # records current image tags
echo "media on: $(docker volume ls | grep -i mastodon)"
```

**Source deployment:**

```bash
cd /home/mastodon/live
pg_dump -Fc mastodon_production > "$BK/mastodon-db.dump"   # as the mastodon/postgres user
cp .env.production "$BK/"
# local media = public/system (snapshot covers it); S3/object storage is already off-box
```

**Verify the dump is real:**

```bash
ls -lh "$BK/mastodon-db.dump"              # non-trivial size
pg_restore -l "$BK/mastodon-db.dump" | head   # lists a TOC → dump is valid
```

> **Gate:** do not proceed until the dump lists a TOC *and* the snapshot shows "completed" in your panel.

---

## 05 · Upgrade — Docker / Compose path

The clean path. The image bundles Ruby/Node/libvips/FFmpeg, so you just move the tag forward one minor at a time and migrate. **Repeat the block for `v4.4.x`, then `v4.5.x`, then `v4.6.3`** — find each latest patch on the releases page.

```bash
cd /path/to/mastodon

# a) point web/streaming/sidekiq at the new tag, e.g. ghcr.io/mastodon/mastodon:v4.4.3
$EDITOR docker-compose.yml

# b) pull
docker compose pull

# c) pre-deploy migrations with the NEW image
docker compose run --rm web bundle exec rails db:migrate

# d) bring services up on the new image
docker compose up -d

# e) POST-deploy migrations — ONLY if the release notes say "after restart"
#    docker compose run --rm web bundle exec rails db:migrate

# f) verify before the next minor
docker compose ps
curl -sI https://net.miaumuh.ch | head -1     # HTTP/2 200
```

Assets ship precompiled inside the official image — no `assets:precompile` needed on Docker. After 4.6.3 is up, go to §07.

---

## 06 · Upgrade — source install path

More steps, because you upgrade the host stack too. Run as the `mastodon` user unless noted.

### 6a — Upgrade host dependencies FIRST (before 4.6 code)

```bash
# libvips — REQUIRED for 4.6 (ImageMagick is dropped)
sudo apt update && sudo apt install -y libvips-tools libvips-dev
vips --version        # must be >= 8.13

# FFmpeg >= 5.1  (Ubuntu 22.04 ships 4.x — may need a PPA or 24.04)
ffmpeg -version | head -1

# Node 22  (nvm as the mastodon user, or NodeSource)
nvm install 22 && nvm alias default 22 && node -v

# Ruby 3.3  (rbenv/rvm as the mastodon user)
rbenv install 3.3.5 && rbenv local 3.3.5 && ruby -v
gem install bundler   # reinstall bundler after changing Ruby
```

> **Postgres / Redis:** if Postgres < 14 or Redis < 7, upgrade those too. A Postgres **major** upgrade (`pg_upgradecluster`) is its own separately-backed-up step — don't fold it into the app upgrade.

### 6b — For each minor (4.4 → 4.5 → 4.6.3), repeat

```bash
cd /home/mastodon/live
git fetch --tags
git checkout v4.4.3          # then v4.5.x, then v4.6.3

bundle install
yarn install --immutable     # or: corepack enable && yarn install

RAILS_ENV=production bundle exec rails db:migrate        # pre-deploy
RAILS_ENV=production bundle exec rails assets:precompile

sudo systemctl restart mastodon-web mastodon-sidekiq mastodon-streaming

# POST-deploy migrations IF the notes require them:
# RAILS_ENV=production bundle exec rails db:migrate

curl -sI https://net.miaumuh.ch | head -1
```

---

## 07 · Post-upgrade verification

Prove it works — don't assume.

```bash
curl -sI https://net.miaumuh.ch | head -1                                # 200
curl -s https://net.miaumuh.ch/api/v2/instance | grep -o '"version":"[^"]*"'  # 4.6.3

# Sidekiq should DRAIN, not pile up:
#   docker:  docker compose logs -f sidekiq
#   source:  journalctl -u mastodon-sidekiq -f
```

Then **in a browser**, logged in as `@g`:

- Home + federated timelines load.
- **Post a status with an image** → thumbnail generates. *This exercises libvips — the top failure mode.*
- Post a status with a **video** → transcodes (FFmpeg 5.1).
- **Federation:** search a remote account (e.g. `@Gargron@mastodon.social`) — it resolves and you can follow.
- Notifications arrive.
- Admin → **Sidekiq**: no growing `retry`/`dead` backlog.
- `bin/tootctl doctor` is clean.

> **If media is broken:** confirm libvips is installed and `MASTODON_USE_LIBVIPS` isn't disabled; re-check §01.

---

## 08 · Rollback

> **There is no "downgrade".** Mastodon does not support running old code against a migrated (newer) schema. Rollback means restoring state, not checking out an old tag.

1. **Preferred — restore the VM snapshot** from §04. One action, whole box back.
2. **DB-only** — if the box is fine but the DB is bad:

```bash
docker compose down            # or: systemctl stop mastodon-*
# recreate an empty DB, then:
pg_restore -d mastodon_production --clean --if-exists "$BK/mastodon-db.dump"
```

3. Restore `.env.production` from the backup if it changed.

This is exactly why the snapshot + verified dump in §04 are non-negotiable.

---

## 09 · Keeping it healthy — "doesn't fail, widest circle"

### 9a — Routine patch upgrades (the easy, frequent case)

Patches inside a minor (4.6.3 → 4.6.4) are almost always: bump tag / `git pull`, `bundle install`, `db:migrate`, `assets:precompile`, restart. **Apply security patches within days** — Watch → Releases only on the repo.

### 9b — Automated, tested backups

- Nightly `pg_dump -Fc` to **off-box storage** (mirror RevampIT's R2 pattern — see `docs/DISASTER_RECOVERY.md`). A backup on the same VM dies with the VM.
- **Test a restore quarterly.** Untested backups are a false sense of security.

### 9c — Federation & deliverability (this *is* the widest circle)

- **Sidekiq must keep up.** The `ingress`, `push`, and `pull` queues draining promptly = healthy federation. A chronic backlog means you're falling behind the network — scale Sidekiq threads/processes.
- **Outbound SMTP must work.** Same lesson as RevampIT email: an unauthenticated sending domain gets silently dropped. Confirm the instance's `SMTP_*` domain has SPF + DKIM + DMARC.
- **Housekeeping — cron these:**

```bash
bin/tootctl media remove --days 14           # prune cached remote media → reclaims disk
bin/tootctl preview_cards remove --days 30
bin/tootctl accounts cull                    # prune dead remote accounts
bin/tootctl statuses remove                  # prune old unreferenced remote statuses
```

- **Full-text search** (optional, improves reach/UX): Elasticsearch/OpenSearch via `tootctl search deploy`.

### 9d — Monitoring / uptime

- External uptime check on `https://net.miaumuh.ch/health` (returns `OK`).
- Disk alert at 80% — media caches fill disks silently; the most common self-hosted outage.
- Watch logs for 24h after every upgrade.

### 9e — Security

- Keep the host OS patched (`unattended-upgrades`).
- Expose only 80/443 (+ SSH restricted to known IPs — it already is, which is why SSH is filtered from outside during recon).
- Rotate `SECRET_KEY_BASE`/`OTP_SECRET` only via the documented `tootctl` flow — never by hand.

---

## 10 · Quick command reference

| Task | Docker | Source |
|---|---|---|
| Logs (web) | `docker compose logs -f web` | `journalctl -u mastodon-web -f` |
| Logs (sidekiq) | `docker compose logs -f sidekiq` | `journalctl -u mastodon-sidekiq -f` |
| Rails console | `docker compose run --rm web bin/rails c` | `RAILS_ENV=production bin/rails c` |
| tootctl | `docker compose run --rm web bin/tootctl …` | `RAILS_ENV=production bin/tootctl …` |
| Migrate | `docker compose run --rm web bundle exec rails db:migrate` | `RAILS_ENV=production bundle exec rails db:migrate` |
| Restart | `docker compose up -d` | `systemctl restart mastodon-{web,sidekiq,streaming}` |
| Health | `curl -sI https://net.miaumuh.ch/health` | `curl -sI https://net.miaumuh.ch/health` |

---

## 11 · Upgrade log — fill in as you go

| Date | From | To | Deployment | Notes / issues |
|---|---|---|---|---|
| 2026-07-__ | 4.3.8 | 4.4.x | | |
| | 4.4.x | 4.5.x | | |
| | 4.5.x | 4.6.3 | | |

---

## 12 · Delegating the upgrade to a coding agent

This runbook is written so an AI coding agent (Claude Code, OpenAI Codex, Grok, Gemini CLI, Cursor…) can execute it under supervision. The prompt is the easy part — **the real work is giving the agent a shell on the box.**

### 12a — Give the agent shell access

| Option | How | Best when |
|---|---|---|
| **Run the agent ON the box** (recommended) | SSH in yourself, install the CLI on the VM, run it there. No firewall/hop issues. | Almost always cleanest for a single-server upgrade. |
| Run locally, agent SSHes out | Whitelist your machine's IP + add a key; agent runs `ssh you@net.miaumuh.ch '<cmd>'`. | You want the agent's history on your laptop. |
| Pre-authorize `ssh` in allowed commands | Same, via the tool's permission/approval settings. | Codex / Cursor sandbox flows. |

### 12b — Per-tool notes

- **Claude Code** — best fit (native shell + file tools). Run it in the checked-out repo on the box. Keep default ask-before-run permissions for a prod box; do **not** use `--dangerously-skip-permissions`.
- **OpenAI Codex CLI** — set approval to *on-request* (not full-auto) so it pauses before each command; network + shell must be enabled for `ssh`/`apt`.
- **Grok CLI / xAI** — same prompt; confirm it has real shell execution, not just chat.
- **Gemini CLI / Cursor Agent** — same prompt; keep "auto-run commands" off for this task.

### 12c — The handoff prompt

Paste into any agent; fill the two `<...>` blanks.

```text
ROLE: You are executing a production Mastodon upgrade on the VM behind
net.miaumuh.ch (Init7, Switzerland). This is a live, federated instance —
downtime and data loss are both unacceptable. Act like a careful SRE, not
a fast one.

CONTEXT TO LOAD FIRST (do not skip):
- Read this runbook in full before doing anything. It is the source of truth.
  Follow its section order 03 -> 07.
- Shell access: <how you reach the box — e.g. "you are running ON the box as
  user X with sudo" OR "ssh <user>@net.miaumuh.ch, key already loaded">.
- Current version 4.3.8; target 4.6.3. Path: 4.3 -> 4.4 -> 4.5 -> 4.6 (never skip a minor).

PRIORITY / ORDER OF OPERATIONS:
1. Run the read-only recon block (section 03). Report OS, disk, deployment
   type (Docker vs source), and installed versions. STOP and show me the
   result before touching anything.
2. Take + VERIFY the backup (section 04): pg_dump AND confirm `pg_restore -l`
   lists a TOC. Tell me the dump path and size. Remind me to take a VM snapshot
   in the hosting panel, and WAIT for my confirmation that the snapshot exists.
3. Only then upgrade, ONE minor at a time (section 05 Docker or 06 source,
   whichever recon showed). After each minor: run migrations, then curl the site
   and the /api/v2/instance version. Do not start the next minor until the site
   returns 200 and Sidekiq is draining.
4. Final verification (section 07): version = 4.6.3, image upload works (libvips),
   federation resolves a remote account, `tootctl doctor` clean.

HARD CONSTRAINTS:
- NEVER run a schema-mutating or destructive command (db:migrate, apt upgrade,
  docker down, checkout) until step 2's backup is verified. If it isn't, stop.
- NEVER skip a minor version. NEVER jump straight to 4.6.
- If ANY migration errors, the site drops below 200, or a step is ambiguous:
  STOP immediately, do not attempt fixes on your own, paste the exact error and
  your proposed next action, and wait for me.
- Special watch: 4.6 drops ImageMagick for libvips. Confirm libvips >= 8.13 is
  installed BEFORE deploying 4.6, or media processing will silently break.
- Do not edit anything outside the Mastodon dir. Do not touch other services on
  the host. Do not change .env values except where the runbook explicitly says.

EXIT / REPORTING:
- Narrate each command and its result as you go.
- At the end, fill in the section 11 upgrade-log table with dates/versions/notes
  and give me a one-paragraph summary: what was upgraded, anything unexpected,
  and the post-upgrade health status.
```

> **Keep a human at the approval gate.** For a three-hop prod upgrade with a libvips swap, a supervised agent is useful for the mechanical steps — but you approve every mutating command and every migration. The verified backup + VM snapshot (§04) are what make even a bad agent run recoverable.

---

### Sources

- Mastodon releases — github.com/mastodon/mastodon/releases
- Upgrade docs — docs.joinmastodon.org/admin/upgrading
- tootctl reference — docs.joinmastodon.org/admin/tootctl

*Unlisted internal runbook · last updated 2026-07-09 · RevampIT Ops*
