# Changelog

What changed on evig, newest first, in the words of someone using it. This file is the canonical record the fleet map reads; the site renders the same releases at `/changelog` from `src/config/changelog.ts`, and the two are updated in the same PR.

## [0.1.4] - 2026-06-16

- **Fewer clicks, faster paths.**
- Login and registration respect callbackUrl again — checkout and deep links return to the right place after sign-in.
- Marketplace checkout loads listings on the server; no double spinner from session + API waterfall.
- Dashboard has persistent quick navigation; lean layout without floating assistants on task pages.
- Legacy /shop/product/:uuid redirects to the marketplace listing when a match exists.
- IT-Hilfe request: describe the problem immediately; AI assist collapsed by default.
- Admin sidebar auto-expands the active group — one fewer click per visit.

## [0.1.3] - 2026-06-16

- **Shop unified into marketplace.**
- /shop, /shop/search, /shop/category/..., and /shop/product/... now redirect into the canonical marketplace.
- Navigation, sitemap, chatbot suggestions, and shop URL helpers no longer generate new /shop links.
- evig listings are consistently marked by explicit flag or staff email; other sellers use neutral labeling.
- Payrexx-backed payments now stop in production with a setup message until a Payrexx account is configured.

## [0.1.2] - 2026-06-16

- **Self-host deploy hardened.**
- Production target clearly documented as revampit.orangecat.ch; revamp-it.ch remains marked as the legacy domain.
- Deploy script now keeps a release backup before activation and automatically rolls back when the health check fails.
- Self-host releases inherit server-local .env and launch.sh files so secrets and systemd launch logic stay out of the repository.
- GitHub deploy workflow now runs lint and typecheck before production deploy.
- New /api/version endpoint exposes app version, git SHA, and build time for monitoring and deploy verification.
- Meilisearch now runs on the Hetzner server as a localhost-only Docker service and /api/health reports healthy again.

## [0.1.1] - 2026-06-16

- **Homepage and marketplace hierarchy realigned.**
- Homepage CTAs moved from device donation to refurbished purchasing and repair discovery.
- Marketplace mega menu now prioritizes shop, community listings, technician search, and help requests before supply/contribution paths.
- IT-Hilfe hub now starts with technician and workshop discovery instead of the request form.
- Blog rationale documents the business, design, and engineering decision behind the new information hierarchy.

## [0.1.0] - 2026-06-15

- **evig Platform 0.1.0.**
- Design system migration complete: admin and dashboard surfaces now use semantic tokens and card-shell throughout.
- Removed legacy CSS aliases — globals.css is now the sole source for surface, text, and accent tokens.
- Project-wide ESLint design rules set to error: no raw buttons/inputs outside the UI kit.
- Unified overlay shadows to shadow-xs; static cards no longer use shadow-lg.

## [0.0.9] - 2026-06-14

- **evig Platform 0.0.9.**
- Rolled out ui-public-* utilities across marketing, shop, and IT-Hilfe pages.
- Semantic design tokens on public surfaces — no more hardcoded neutral-* classes.
- Self-host deploy script and GitHub Actions workflow for Hetzner documented.

## [0.0.8] - 2026-06-10

- **evig Platform 0.0.8.**
- Refactored upcycling mini-site with scroll-spy table of contents on the business plan.
- Navigation i18n fix: projects mega-menu shows translated labels instead of raw keys.
- Technician profile pages and public technician list refreshed.
- Per-page og:image for upcycling subpages — social shares now show preview images.

## [0.0.7] - 2026-06-05

- **evig Platform 0.0.7.**
- Admin protocol votes now bridge into tasks; legacy voting removed.
- Removed task analytics page; compressed task creation form.
- Auth documentation and dashboard onboarding aligned with live JWT stack.

## [0.0.6] - 2026-05-28

- **evig Platform 0.0.6.**
- Fixed malformed quick-entry hover classes in device intake (Erfassung).
- Unified admin interactive hovers to SSOT utilities.
- Consolidated tasks default filter and inline actions.
