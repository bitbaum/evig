# Changelog

What changed on evig, newest first, in the words of someone using it. This file is the canonical record the fleet map reads; the site renders the same releases at `/changelog` from `src/config/changelog.ts`, and the two are updated in the same PR.

## [0.5.2] - 2026-10-12

- **Search forgives a typo.**
- One slip per word still finds what was meant: in the marketplace ("Thinkpda" finds the ThinkPad), in the technician directory ("Zurich" finds Zürich), in the command palette (⌘K), on the blog, in the open-source list and when picking people.
- In the command palette, on the blog and in the open-source list the best match comes first, and the command palette marks what matched.

## [0.5.1] - 2026-10-11

- **The roadmap says when each step shipped.**
- Each finished step on `/roadmap` links to the release on `/changelog` that delivered it, and the changelog covers everything since June instead of stopping at 0.1.4. {#public-roadmap}

## [0.5.0] - 2026-10-09

- **Sign in with OrangeCat.**
- "Mit OrangeCat anmelden" is the first way in on the login and registration pages; the password form is one click behind it, and an existing account can connect OrangeCat from the profile. An account made through OrangeCat gets no password-reset link, because it has no password here (#523, #526, #534).
- The homepage says what evig solves — concrete problems, for one person and for everyone — instead of describing itself (#536).
- The site stopped claiming a workshop, partners, donation receipts and an evig.ch address that evig does not have (#531).
- Dates in forms read in words, and Hirn offers suggested replies in every chat (#545, #546).
- On a phone, choosing a source file for a protocol opens the file browser instead of a camera-app chooser (#537).
- Next.js 16.3.8 closes a critical remote-code-execution hole in image generation and a request-forgery hole in image optimisation (#527).

## [0.4.0] - 2026-09-28

- **A public roadmap, and the record behind it.**
- `/roadmap` shows what evig is building, read from the same `ROADMAP.md` and `CHANGELOG.md` the fleet map reads (#522). {#public-roadmap}
- The contact address is cato@orangecat.ch instead of a personal mailbox (#511).
- Navigation targets are 44px tall, and the Hirn button no longer sits under the cookie banner (#510).
- Every page sends the five baseline security headers; the payment throttle no longer trusts a header the caller writes (#492, #493).
- Blog articles render through typed blocks; database content was rendered without a sanitiser (#466). Changing a slug no longer deletes seven of the eight translations (#464).
- Mail goes out through Resend; the old SMTP credential had died and mail was silently lost (#448, #449).
- `/api/health/ai` reports whether the AI actually answers, instead of calling an unobserved AI "healthy"; "Rate-Limit erreicht" now appears only when it is true (#452, #463).

## [0.3.0] - 2026-08-26

- **Three divisions, five pillars, and what did not work.**
- evig is stated as three divisions — computers, technicians, ai — from one list that drives the wordmarks, the navigation, the footer and the division pages (#300, #389). {#divisions-one-list}
- evig repairs became evig technicians: post a request, get offers from technicians nearby, choose one; evig stopped asking for printers (#382). {#evig-technicians}
- The homepage states the five pillars instead of a donation funnel, and no longer says the same thing three times (#381, #385). {#five-pillars}
- The "not a charity" line is gone — it contradicted the legal page; evig architecture and evig health moved to their own projects (#379). {#not-a-charity}
- The donate buttons funded another organisation; they fund evig now, and two navigation entries that went nowhere were removed (#388).
- The address printed on the site did not receive mail; it does now (#376).
- Invoices charged the pre-2024 VAT rate; one rate is used everywhere (#368). Paid marketplace listings no longer stay reserved forever, and the order page stopped showing a CHF 0.00 service fee (#369, #373).
- Eight dialogs trap focus and close with Escape (#372).
- Money routes require the finance permission, cron routes deny by default, and a vote is cast by whoever proves it rather than whoever types an email address (#305, #322, #358). The one live decision can be voted on again (#308).
- Staff can fill the category form from a sentence and then change it by talking to it (#279).

## [0.2.0] - 2026-07-28

- **Revamp-IT becomes evig.**
- New name, identity and canonical address: evig.orangecat.ch (#247, #248, #256).
- Every page says what is true: evig is a Verein in Gründung, not a recognised non-profit. {#verein-in-gruendung}
- The invented track record, metrics and testimonials are gone, and so are the donation-receipt and charity claims evig cannot make yet. {#no-false-receipts}
- The physical store address, opening hours and Revamp-IT's projects and social accounts were removed — evig is not Revamp-IT.
- Feedback goes through the fleet's embeddable widget.

## [0.1.5] - 2026-07-17

- **Checked before it is sold.**
- A device whose required test fails cannot reach the shop; staff can still publish without QC in one audited click, and the listing then carries no Prüfsiegel so buyers see it is untested. {#qc-skip}
- Final QA keeps the four-eyes rule, with an audited one-click solo override. {#four-eyes}
- Every CO₂ figure comes from per-category ADEME open data, minus 15% for refurbishment, floored at 5 kg; categories without a defensible factor show no claim. {#co2-open-data}
- The methodology is public at `/transparenz/co2` and linked under "Über uns". {#co2-methodology}
- Removing a listing returns the device to the pipeline, and the pipeline shows what is live in the shop.

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
