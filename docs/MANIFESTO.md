# Revamp-IT — Platform Manifesto & Vision

**Status:** Living vision doc (captures direction from founder brainstorming,
2026-07-06). Marks clearly what is **built** vs **proposed**. Not a spec — a
compass. Companion to the concrete plans in
[`SYSTEM_MIGRATION_STRATEGY.md`](./SYSTEM_MIGRATION_STRATEGY.md),
[`KIVVI_ERP_ADOPTION.md`](./KIVVI_ERP_ADOPTION.md),
[`SHOPWARE_MIGRATION_PLAN.md`](./SHOPWARE_MIGRATION_PLAN.md).

> **North star:** Used computers get repaired and rehomed — not landfilled. The
> platform should *embody* that mission (transparency, sovereignty, care), not
> just serve it. Every system we own is one we can make open, adapt to the
> mission, and measure honestly.

---

## The values, as product principles

### 1. Radical transparency & open governance
Decisions, votes, and meetings are public — together with the *hypotheses,
sources, metrics, and evaluations* behind them. KPIs are public. AI (HIRN) may
analyze the decision-making itself. All AI prompts are public.
- **Buildable on:** the existing decisions/voting system + content-approval flow.
  A public `/governance` page rendering decisions + rationale + outcome, with a
  redaction layer for personal/financial data. Meetings → published minutes.
- **Caveat:** publish the *process and decisions*, redact the *people*
  (Swiss data protection, donor trust).

### 2. Sovereignty & open source
Own the stack; minimize dependence on closed, unsustainable corporations. The
marketplace replaces Shopware; events come off Openki; the ERP off Kivitendo
(→ Kivvi). R&D in **both hardware and software** is open-source by default.
- **Don't index on vendor "size"** — it misleads. Score dependencies on three
  measurable axes: **openness** (source available?), **sovereignty**
  (self-hostable / exitable?), **externality** (environmental + social harm,
  via GHG Scope 1/2/3, CDP, science-based-targets, B-Corp — rating *disclosure
  quality* too).
- **First research-department output (proposed):** a public **dependency
  sovereignty & harm scorecard** for our own stack. This is also how we'd honestly
  state an "open-source %" — from an audit, never a made-up number.
- **Audit result (2026-07-06):** the platform is already **~fully open** — app is
  **MIT**, effectively all runtime npm deps are OSI, and every service boundary is
  provider-agnostic (S3 API, SMTP, an AI cascade with **Ollama** already wired).
  Self-hostable alternatives are already in-code for email (**Listmonk**) and
  storage (**MinIO/Hetzner**). The **only hard lock-in is Payrexx** (Swiss
  card/TWINT has no FOSS drop-in) — BTCPay (§6) is the sovereign path around it.
  So "software shop / open-source hackerspace" is an honest, provable positioning.

### 3. Forkability — the platform as a commons *(proposed)*
Anyone — especially the team — can **fork `revampit.orangecat.ch` really easily**
and continue the work. Governance-by-fork: the founder builds it; the team forks
and continues; each member can fork and carry it forward.
- **What makes it real:** the codebase is already config-driven (org data in
  `src/config/org.ts` SSOT), so most Revamp-IT specifics are swappable. The gap is
  *packaging*: a clean self-host path (docker-compose exists), an `.env` template,
  a demo seed with no secrets, a "Deploy your own" guide, and a one-command
  bootstrap. Then a fork is a fresh sovereign instance with its own data/auth.
- **Ethos:** open source isn't just licence — it's making continuation trivial.

### 4. Collective effort & mutual care
Teamwork made easy; "team management is not a thing" — meaning *no hierarchy of
control*, not *no coordination* (coordination is load-bearing; frame it as
facilitation/stewardship). Participation and care of one another matter more.
- **Member wellbeing posts *(proposed)*:** any member can post a simple
  "how are you doing?" — public or private, answer anything: work, life, the
  general. Plus sharing activities (music, hikes, outings). Goal: **connect and
  support each other in a less superficial way.** Easy to post; visibility
  toggle. A light community/Pinnwand feed, not a moderated content pipeline.
- Balance **helping** those who need help with **empowering** those who need
  empowerment to lead/co-lead the technical, scientific, and research arm.

### 5. Inclusive participation
Create meaningful participation for people in precarious/irregular employment
situations — including those not permitted by authorities to work through normal
channels — so they can contribute and belong.
- **Caveat (non-negotiable):** this is legally live-wire in Switzerland. Design it
  via volunteering / integration / Beschäftigungsprogramme **with legal advice** —
  dignity-first, never a workaround.

### 6. Financing true to the mission
- **Sliding-scale membership *(proposed)*:** anyone who believes in the mission
  joins at a flat-ish, pay-what-you-can fee (less or more as affordable).
- **BTC funding via OrangeCat *(proposed)*:** the founder opens BTC wallets *for
  Revamp-IT*, surfaced on OrangeCat (the fundraising layer) as a fundraising
  entity with **toggleable public/private visibility** (not necessarily fully
  public). Custody stays with the founder — the platform wires display/integration
  only.
- **Payment sovereignty:** keep one easily-toggleable provider; add a self-hosted
  crypto option (**BTCPay**), currency-agnostic, wallets that *can* be public, to
  avoid lock-in to closed processors like Payrexx.
- **First-principles rule:** every franc anchors to a mission metric (devices
  rehomed, people trained, CO₂ avoided — from the `org-numbers` SSOT). Growth is
  only good if metric-per-franc holds.

### 7. Global reach for maximum impact & funding
Translate the platform — **user AND admin** side — prioritized by **where e-waste
is concentrated and where our story attracts diverse funding**: a **Chinese** and
**Arabic** version, **African** and **Indian** coverage as needed. Translating
admin lets those communities *co-run* the platform, not just use it.

### 8. Dogfooding our own stack
Revamp-IT is a real customer of the founder's own products:
- **Kivvi** = canonical ERP (invoicing, accounting, MWST, inventory) — see
  `KIVVI_ERP_ADOPTION.md`.
- **OrangeCat** = economic/fundraising layer (BTC wallets, stakeholder graph).
- **FleetCrown** = agent-ops / control plane (watch conversations, switch between
  agent tabs, **typing-aware injection** so nothing clobbers the user's keystrokes).

---

### 9. Own social media & expression *(proposed)*
Posting is first-class, with three audiences: **just me / team-only / public
(blog)**. It's Revamp-IT's *own social media* — any team member and any
registered user can post. Public posts feed the blog; the research department
publishes here (non-members submit for review). We *also* cross-post to
closed-source corporate media to raise our profile — pragmatic reach to bring in
more people who want to help and be helped. (Merges with the member "how are you"
wellbeing check-ins from §4 — same expression family; visibility toggle,
privacy-safe defaults, simple report/mute.)

### 10. R&D department & sustainable-energy research *(proposed)*
A real research & development arm — **hardware AND software** — that the founder
would lead, open to any member. Its biggest question: **how do we harness energy
in the most sustainable way?** Concrete first system: a tunable **SSOT for
energy-source sustainability** (solar / wind / SMR / grid mix / …) whose
parameters change as evidence evolves — used e.g. to assess whether the BTC
funding (§6) is mined on sustainable energy. Publish methods + parameters openly.
No fabricated numbers — every parameter cites a source.

### 11. People as product — HR, teams, calendars, 1:1s *(proposed)*
Model people/teams/HR as product features, not an afterthought:
- **Member calendars + 1:1 booking** — members have calendars; any member can
  book a 1:1 with another. Non-members can book too, but pay the normal Revamp-IT
  rate, which flows into a **100% transparent budget, spent as transparently as
  decisions are made** (§1).
- The founder offers **1:1 expertise** as a private or (if useful) public
  event/workshop — "any workshop goes."
- Teams and HR are surfaces in the platform, aligned with the low-management,
  care-first ethos (§4).

### 12. Public metrics / KPIs *(proposed — elevate)*
The metrics we consider important live **visibly on the website** — a public
metrics/KPIs surface (devices rehomed, people trained/empowered, CO₂ avoided,
budget in/out, energy-sustainability parameters). Sourced from DB / `org-numbers`
SSOT — never placeholder numbers. Transparency made concrete, and our pitch to
funders.

### Positioning
Be known as a **software shop / hackerspace** in the spirit of open-source
software-development organizations — not only a refurbisher. The code being MIT +
self-hostable (§2 audit) is the proof.

## Honest boundaries (so the vision stays credible)
- **No fabricated metrics.** Open-source %, impact numbers, corporate-harm scores
  — all from real audits/sources, never placeholders.
- **No custody.** The assistant wires wallet *display/integration*; the founder
  opens and holds wallets.
- **Legal gates.** Inclusive-employment and public-financials designs go past a
  lawyer before shipping.
- **Redaction.** Transparency publishes process + decisions, not people's personal
  or financial data.

---

## Status snapshot
- **Built/shipped:** marketplace (Q&A, buy CTA, moderation), IT-Hilfe magic-link,
  unified review-workflow core, membership payment flow, impact/LCA pages;
  category-SSOT + AI-category fixes; **Kivvi-sync VAT bug fixed.**
- **Planned & documented:** Shopware→marketplace import; Kivitendo→Kivvi cutover;
  Kivvi "trustworthy dogfooding" fix sprint.
- **Proposed (this manifesto):** public governance page + public metrics/KPIs
  surface, dependency scorecard, forkable self-host packaging, own-social-media /
  blog / wellbeing posts (self/team/public), member calendars + 1:1 booking into a
  transparent budget, R&D department with a tunable energy-sustainability SSOT,
  sliding-scale + BTC financing, language expansion, FleetCrown typing-aware
  injection.
- **Openness audit done (2026-07-06):** platform is MIT + ~fully open; only hard
  lock-in is Payrexx. `package.json` now declares `"license": "MIT"`.
