# Roadmap

evig keeps something useful for longer: curated second-life computers, a technician who fixes the machine you already own, and the intelligence that machine can reach. This is what we are building, in the order we are building it. Nothing here claims what is not yet true.

## Now

### Verein in Gründung, said plainly

evig is a gemeinnütziger Verein being founded. Until the association is registered and recognised as tax-exempt, the site says "in Gründung", issues no tax-deductible donation receipts, and claims no recognised non-profit status.

- [x] Every public page states "Verein in Gründung" instead of a recognised status
- [x] Donation-receipt claims and invented UIDs removed from the site
- [x] The "not a charity" line removed — it contradicted the legal page
- [ ] Association registered
- [ ] Cantonal recognition as gemeinnützig (only then do receipts become possible)

### Three divisions, one idea

The brand is one organisation stated as three lenses — computers, technicians, ai — all derived from one config, never hand-typed.

- [x] evig computers live on the marketplace with one checkout for refurbished stock and community listings
- [x] evig technicians live on IT-Hilfe: post a request, receive offers from technicians nearby, choose one
- [x] evig ai live with a stated boundary: not a research lab, no magic, no lock-in
- [x] Division wordmarks, nav entries, footer column and division pages derive from one list
- [x] Homepage states the five pillars instead of a donation funnel

### Quality control before anything reaches the shop

Devices arrive, get captured once, and pass a checklist before they are sold. A failed required test always blocks publishing.

- [x] One capture contract: text, photo, CSV/Excel and speech normalise into the same product schema
- [x] Pass / fail / n.a. verdicts on every checklist item, serialised on a row lock
- [x] A failed required item puts the device in the `failed` state and blocks the shop
- [x] Audited one-click "publish without QC" path — the listing then carries no Prüfsiegel and buyers see the untested state
- [x] Vier-Augen-Prinzip in final QA with an audited solo override
- [x] QR device labels linking the physical device to its pipeline record
- [ ] Retire the legacy capture write endpoint and the Kivvi-only CSV import once caller telemetry shows zero use

### CO₂ figures with an open methodology

Every CO₂-avoidance number on the site derives from one config: per-category open-data factors, a 15% refurbishment deduction, a 5 kg floor. Categories without a defensible factor show no claim at all.

- [x] Per-category factors from ADEME/ARCEP open data, guarded by a test that rejects uncited numbers
- [x] Public methodology page with formula, sources and limits
- [x] CO₂ badge per marketplace listing, absent where the estimate would not be defensible
- [ ] Extend factor coverage as further open data becomes available

### Building in public

The roadmap and changelog live in this repository as `ROADMAP.md` and `CHANGELOG.md`; the fleet map reads them, and the site renders them from the map.

- [x] Public changelog with versioned release notes
- [x] Roadmap and changelog kept as plain records in the repository
- [x] Public roadmap page rendering the fleet's canonical record

## Next

### Promo codes and gift cards at checkout

The promo-code engine and issuing routes exist; redemption is not yet wired into checkout.

- [x] Promo-code foundation with a tested discount engine
- [ ] Admin issuance surface
- [ ] Redemption across marketplace, workshop and appointment checkout, including a 100%-off path that skips the payment gateway
- [ ] Purchasable gift cards with a depleting balance on the same rail

### Reparaturbonus Zürich

The city's repair bonus programme did not select evig, and we are building the redemption path anyway.

- [x] Public page explaining the programme
- [ ] Bonus redemption on a repair request

### More ways to pay

Payrexx (card and TWINT) is the live processor. Other rails are wired in code and wait on provisioning.

- [x] Payrexx live, escrow-capable, backing the community marketplace flow
- [x] BTCPay (Bitcoin, CHF-denominated) integrated in code, hidden at checkout until a server is provisioned
- [x] GNU Taler adapter in the registry, same status
- [ ] BTCPay server provisioned and enabled at checkout

### Kivvi as the canonical ERP

Inventory already syncs one way after capture. The rest follows the de-risking order: contacts, invoicing, accounting, automation.

- [x] Non-blocking inventory sync to Kivvi after device capture
- [ ] One customer/vendor master in Kivvi
- [ ] Swiss QR-bill invoicing from Kivvi
- [ ] Accounting canonical in Kivvi once opening balances reconcile

### Distribution without ads

- [x] Blog with RSS, JSON-LD, hreflang and localised dates
- [x] Newsletter signup wired to a self-hosted Listmonk
- [ ] Weekly post, monthly digest, every post linking a purchasable surface
- [ ] Mastodon account on our own instance, cross-posting each post

## Later

### Fleet orders for Vereine, schools and municipalities

Five to twenty identical refurbished devices on one invoice, with a verifiable sustainability story attached.

### A real build-from-inventory matcher

The build-your-computer tool gives honest tier guidance today. Matching against live stock needs a listing subcategory column and a backfill first.

### Marketplace discovery

Brand facet (needs brand normalisation), saved searches, follow-seller and watch alerts (need notification infrastructure), per-facet counts.

### Role-aware onboarding and richer profiles

Self-service team profile editing, a skills taxonomy in config, and public profiles with the trust signals buyers expect.

## Shipped

### Refocus on affordable intelligence

- [x] evig architecture and evig health removed; they were personal research and now live on orangecat.ch
- [x] evig repairs renamed to evig technicians — the name describes what the user is looking for
- [x] Services catalogue reduced to four entries; placement in the nav is data, tested
- [x] evig stops asking for printer donations

### Marketplace parity that serves the mission

- [x] Server-rendered listing detail with metadata, breadcrumbs and JSON-LD Product/Offer
- [x] Seller reputation: star histogram, verified-purchase reviews, seller responses
- [x] Stated refurbished guarantee — 6-month warranty and 14-day return — sourced from the AGB, shown only on evig stock
- [x] Paid listings no longer stay reserved forever: one completion path

### Security and correctness

- [x] Cron authentication denies by default on every route
- [x] A vote is cast by whoever proves their identity, not whoever types an email
- [x] Money routes authorise on the finance permission, not the bare staff flag
- [x] Payment throttle keyed on the hop the proxy wrote, not a header the caller controls
- [x] Five baseline security headers, CSP in report-only
- [x] Invoices charge the current VAT rate from one source

### Design system discipline

- [x] 116 hand-rolled card shells normalised to the Card primitive; the ratchet holds at 3
- [x] Set-state-in-effect warnings cleared and locked at error
- [x] Eight modal dialogs gained a focus trap and Escape
- [x] Every nav target is at least 44px

### Platform

- [x] Resend as the primary email provider through the shared mail kit
- [x] AI provider chain through the shared ai kit, with a health endpoint that reports what it observes
- [x] pnpm 11, TypeScript 6, Node 24, vitest
- [x] Production at evig.orangecat.ch with a 308 redirect from the retired host
