---
title: "Built, not wanted: the platform with which evig carries on independently"
excerpt: "I built a platform that automates the whole journey, from a donated old device to its new owner. Revamp-IT chose not to take that path and is staying with three separate legacy systems. Here is the honest comparison — what was, what I built, and where it's going."
featuredImage: "/blog/showcase-revampit-home.png"
category: "Produkt"
tags:
  - plattform
  - evig
  - vergleich
  - roadmap
  - kreislaufwirtschaft
publishedAt: "2026-07-28"
published: true
audience: public
visibility: public
---

I built a platform that unifies and automates everything — from a donated old device through quality control to the public shop window, plus the entire internal operation. Revamp-IT decided not to come along on that path and is staying with the existing systems: a Joomla website, a separate Shopware shop, and Kivitendo, an ERP written in Perl with no real interface. That is the association's decision. I am convinced that the automated path is the better one — and I am carrying it forward independently with **evig**.

This post is the honest comparison. Not a swipe, but a side-by-side: **what was**, **what I built**, and **where it's going.**

## What was: three systems that stay silent

Over the years, three separate legacy systems had grown up at Revamp-IT, each with its own purpose and its own data:

- The **Joomla website** at `revamp-it.ch` — the public face, but static and cut off from the rest.
- The **Shopware shop** at `shop.revamp-it.ch` — the sale of refurbished devices, a universe of its own.
- The **Kivitendo ERP** — accounting and inventory, written in Perl, walled off and without a usable API.

These three didn't talk to each other. A device that was logged, tested, put into storage and sold had to be typed in again by hand at every station. Data travelled from silo to silo by copying — with all the errors that manual transfer brings. And because Kivitendo has no real interface, every attempt at automation ends at the same wall: you go looking for an API that simply doesn't exist, or you laboriously mimic a browser just to get data in and out at all.

The repairing was never the problem. The organisation behind it was.

## What I built: a platform, public and internal at once

Instead of continuing to hold three legacy systems together with sticky tape, I built a single, coherent platform. It covers both worlds — the **public side**, where the community browses, buys and seeks help, and the **internal side**, where devices are logged, tested and published, time is tracked and the operation is coordinated. Both share the same data foundation. A device is logged **once** and travels automatically from there all the way to the shop window.

![Marketplace with filters, CO₂ bar and listings](/blog/showcase-revampit-marketplace.png)
*The marketplace: refurbished devices and private listings in a single shop window, with filters and a transparent CO₂ bar.*

- **Marketplace** — refurbished devices and private peer-to-peer trade in one place. One shopping cart, one checkout, payment via Payrexx with an escrow function.
- **IT help** — a two-sided network that connects repair needs with technicians. Every repair is one device less in the waste.
- **Services** — «Build your computer», Linux installation and advice, proper recycling.
- **Device intake** — AI-assisted logging takes in photos and key details and suggests a category and data; categories that require testing go through a structured quality check with a checklist and the four-eyes principle; bulk logging and CSV import for larger quantities.
- **Time tracking, teams and Hirn** — balance, report and approval flow for the operation; a team structure that shows who is working on what; and «Hirn», a RAG-based AI assistant that answers from the organisation's own knowledge.
- **CO₂ impact** — every figure with its derivation disclosed (ADEME factors, cross-checked against Fraunhofer and the ZHAW), on a dedicated transparency page. Proven, not claimed.

![CO₂ methodology on the transparency page](/blog/showcase-revampit-co2.png)
*Every CO₂ figure is tied to an open source and the calculation is public — verifiable instead of greenwashing.*

## The direct comparison

| | Before (Revamp-IT, legacy systems) | Now (the platform) |
|---|---|---|
| **Systems** | 3 separate (Joomla, Shopware, Kivitendo) | 1 coherent app |
| **Data entry** | by hand again at every station | logged once, passed along automatically |
| **ERP connection** | Kivitendo (Perl), no real API | Kivvi with REST-API sync (`syncToKivvi`) |
| **Sales & P2P** | separate, or not present at all | one marketplace, one checkout |
| **Search** | none across the whole | Meilisearch across the entire stock |
| **Sustainability** | claim | every figure with an open source |
| **Languages** | essentially one | 8 |
| **Internal (time, teams, knowledge)** | scattered / manual | in the platform, with an AI assistant |

More important than any single technology is the principle behind it: **a single source of truth** for every piece of information. Exactly what the three legacy systems lacked.

## The scale

Out of «three systems that stay silent» has come a platform of considerable depth (as of July 2026):

| Metric | Value |
|---|---|
| API endpoints | over 300 |
| Pages | over 220 |
| Admin modules | 33 |
| Database tables | around 130 |
| Languages | 8 |
| Commits | over 2'300 |

Under the hood: **Next.js 16** with **TypeScript**, data in **PostgreSQL** via the ORM **Drizzle** (types derived directly from the schema), sign-in with **NextAuth v5**, search with **Meilisearch**, payments via **Payrexx**, images on **Cloudflare R2**. A modern, deliberately chosen stack — not a Perl ERP on which every automation fails.

## Where it's going

The platform is not the goal but the foundation. evig goes one step beyond the circular economy — towards **access to intelligence for everyone**. Here is the roadmap:

- **Affordable AI on modest hardware.** A refurbished laptop is not only the greener choice but the cheapest on-ramp to artificial intelligence there is. We are researching and showing how capable AI runs on second-life devices.
- **Robotics as the next step.** Embodied intelligence — robots that take real work off a life and give time back. Humanoids are barely sold new today and not yet used at all; evig wants to be the first place to offer them properly: complete, tested, proven for a real purpose — and with the knowledge to use them.
- **New ways to afford intelligence.** Alongside outright purchase: subscription crowdfunding and community financing, shared subscription pools (splitting the running costs of AI instead of bearing them alone), direct support without middlemen.
- **Research, conducted openly.** evig doesn't only sell and repair — it investigates: affordable AI, open robotics, repair, sovereignty over one's own tools. And it publishes what it finds. Knowledge in circulation is the same idea as hardware in circulation.

That is the difference between «good enough, the way it was» and «as far as it can go». I built the foundation because I want to take this path — fast, independent and beyond Zurich.

## Conclusion

Where three legacy systems ran side by side and data was carried across the gaps by hand, there now stands a coherent, automated platform. It was there, working and verifiable. Revamp-IT chose the familiar path — that is their good right, and the work they have done since 2003 remains valuable. I chose the other: to unify everything, to automate as much as possible, and to aim the foundation at the age of intelligence.

evig builds on. The same roots, a bigger goal.
