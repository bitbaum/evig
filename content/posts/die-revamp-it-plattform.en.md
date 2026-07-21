---
title: "A Platform for the Circular Economy"
excerpt: "Three separate legacy systems became one coherent platform — marketplace, repair network and the entire internal operation in one place, in eight languages."
featuredImage: "/blog/showcase-revampit-home.png"
category: "Produkt"
tags:
  - plattform
  - kreislaufwirtschaft
  - marktplatz
  - it-hilfe
publishedAt: "2026-07-21"
published: true
---

A working computer ends up in the skip. At the same time, a few streets away, someone who could use exactly that computer can't afford a new device. For years, there was no bridge between these two people at Revamp-IT — only a patchwork of software that didn't talk to itself. We've closed that gap, with a single platform that maps the whole journey from a donated old device to its new owner.

![Home page with the hero «Old hardware. New life.»](/blog/showcase-revampit-home.png)
*The new home page: «Old hardware. New life.» — an entry point that shows at a glance what this is about.*

## The problem: e-waste and three systems that stay silent

Electronic waste is one of the fastest-growing waste streams in the world. Many of the devices that get thrown away aren't broken — they're merely old, slow or out of fashion. With a few tweaks, an SSD and a lean Linux, they become fully capable working machines again. That is exactly our mission: used computers get repaired and rehomed — not landfilled.

The snag was never the repair, but the organisation behind it. Over the years, three separate legacy systems had grown up at Revamp-IT, each serving its own purpose and ignoring the others:

- The **Joomla website** at `revamp-it.ch` — the public face, but static and cut off from the rest.
- The **Shopware shop** at `shop.revamp-it.ch` — the sale of refurbished devices, a universe of its own with its own data.
- The **Kivitendo ERP** at `kivitendo.ch` — the internal accounting and inventory management, again walled off.

These three systems didn't talk to each other. A device that was logged, tested, put into storage and finally sold had to be typed in again by hand at every station. Data was copied back and forth between the silos, with all the errors that manual transfer brings. And the people who actually matter — those who need affordable technology — could barely find their way through the muddle. Anyone who comes to a non-profit for the circular economy shouldn't have to search three websites to get an affordable laptop.

## The solution: one app, public and internal at once

Instead of holding three legacy systems together with sticky tape, we built a single, coherent platform. It covers both worlds: the **public side**, where the community browses, buys, seeks help and reads about our impact — and the **internal side**, where the team logs devices, tests, publishes, records its time and coordinates. Both worlds share the same data foundation. A device is logged exactly once and travels automatically from there all the way to the shop window.

The rest of this post is a tour through the key areas. For each one we say briefly **what it does** and **which real problem it solves**.

## Marketplace: a shop window for everyone

![Marketplace with filters, CO₂ bar and listings](/blog/showcase-revampit-marketplace.png)
*The marketplace with filters, a transparent CO₂ bar and a mix of refurbished and private listings.*

**What it does:** The marketplace unites two paths in a single shop window. On one side, the refurbished devices prepared by Revamp-IT in our workshop. On the other, private listings from people who want to pass on their own hardware — classic peer-to-peer trade. One shopping cart, one checkout, with payment handled by Payrexx and an escrow function behind it, so that buyer and seller can trust each other.

**Which problem it solves:** In the past, sales and private hand-overs lived in separate corners, where the latter existed at all. Now anyone looking for a device finds, in one place, both the tested refurbished offer and what the community has to offer. The filters and the clearly visible CO₂ bar help you quickly find the most suitable and most ecologically sensible device.

## IT help: the repair and technician network

![IT help with a repair and technician network](/blog/showcase-revampit-it-hilfe.png)
*IT help: anyone who needs a repair finds technicians from the network here.*

**What it does:** IT help connects people with a repair need to technicians who can help. Anyone with a problem describes it; anyone with the skills gets in touch. A two-sided network for repairs, in which supply and demand find each other.

**Which problem it solves:** Repair knowledge is scattered and often hard to reach. Not everyone knows someone who can get a broken laptop running again. The network makes this knowledge visible and reachable — and so keeps even more devices alive rather than replacing them. Every successful repair is one device less in the waste.

## Services: build your computer, Linux and recycling

![The «Build your computer» service](/blog/showcase-revampit-service.png)
*The «Build your computer» service — assemble hardware to suit your own needs.*

**What it does:** Beyond the plain device sales, the platform bundles our services. «Build your computer» lets interested people put together a device to suit their needs. Add to that advice and installation around Linux and open-source software, as well as proper recycling for what really can no longer be saved.

**Which problem it solves:** Not everyone needs the same thing. Some want a finished laptop, others a tailor-made working machine, still others want to move away from proprietary operating systems towards free software. And when a device reaches the end of its life, it should be recycled correctly and in an environmentally sound way. Having this range in one place is what makes the circular economy practical for many people in the first place.

## CO₂ impact: proven, not claimed

![CO₂ methodology on the transparency page](/blog/showcase-revampit-co2.png)
*The CO₂ methodology on the transparency page — every figure with its derivation disclosed.*

**What it does:** Every CO₂ figure on the platform has a traceable basis. The factors come from open data from ADEME and are cross-checked against research from Fraunhofer and the ZHAW. On the transparency page the methodology is fully disclosed: how the calculation is done, which sources sit behind it, and where we deliberately refrain from a claim because no robust value exists.

**Which problem it solves:** Sustainability figures are cheap to claim and expensive to prove. Greenwashing undermines trust in the very movement it is supposed to promote. By tying every figure to a source and making the calculation public, our impact stays verifiable — for buyers, for partners and for ourselves.

## Device intake: AI logging and the four-eyes principle

**What it does:** In the internal device intake, every donated or purchased device is logged. AI-assisted logging takes in photos and details and suggests a category and key data. Devices in the categories that require testing go through a structured quality check with a checklist; critical steps follow the four-eyes principle. For larger quantities there is bulk logging and import via CSV.

**Which problem it solves:** This is exactly where the greatest friction of the old world lay — the endless re-typing between shop and ERP. Now a device is logged once and travels from there, once it has passed inspection, straight to the shop window. The quality check ensures that no one buys an untested device, and the four-eyes principle guards against careless mistakes in safety-relevant steps.

## Time tracking, teams and Hirn: the internal operation

**What it does:** The platform also carries the day-to-day operation. Time tracking records who worked when, with balance, report and an approval flow. The team structure maps who works in which group and what is currently being worked on. And «Hirn» is a RAG-based AI assistant that answers from Revamp-IT's own knowledge, rather than guessing out of thin air.

**Which problem it solves:** A non-profit lives on volunteers and employees whose time is scarce. The less of it seeps away into administration, searching and coordination, the more remains for what really matters — repairing devices and reaching people. The assistant makes internal knowledge retrievable, without anyone first having to find and ask the right person.

## The scale

Out of «three systems that stay silent» has come a single platform of considerable depth. A few figures on its scope:

| Metric | Value |
|---|---|
| API endpoints | 319 |
| Pages | 224 |
| Admin modules | 33 |
| Database tables | ~130 |
| Languages | 8 |
| Commits | 2'361 |

Eight languages are not a bonus for us but part of the mission: Switzerland is multilingual, our reach is international, and affordable technology should let no one fail at a language barrier.

![Projects overview](/blog/showcase-revampit-projects.png)
*The projects overview — from repair initiatives to educational offerings, all in one place.*

## The technology behind it

Under the hood sits a modern, deliberately chosen stack. The frontend and the programming interfaces run on **Next.js 16** with **TypeScript**. The data lives in **PostgreSQL**, addressed through the ORM **Drizzle**, so that our types are derived directly from the schema and don't have to be maintained twice. Sign-in is handled by **NextAuth v5**. Search across the marketplace is powered by **Meilisearch**. Payments are handled by **Payrexx**, images live on **Cloudflare R2**, and **Sentry** reports errors to us before the users have to report them.

More important than any single technology is the principle behind it: a single source of truth for every piece of information. One device, one logging, one record that travels along all the way to the sale. Exactly what the three legacy systems lacked.

## Conclusion: one place instead of three

Where a Joomla website, a Shopware shop and a Kivitendo ERP once ran side by side and data was carried across the gaps by hand, there now stands a coherent platform. It connects the people who give away or need technology with the technicians who repair it — and carries the entire internal operation at the same time. No more silos, no more triple data entry, no more searching across several websites.

The best part: it's not just a plan. The platform is live and verifiable at **revampit.orangecat.ch**. Come by, browse the marketplace, check our CO₂ calculation — and give an old device a new life.
