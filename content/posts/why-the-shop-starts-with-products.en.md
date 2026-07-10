---
title: "Why the Shop Is the Marketplace"
excerpt: "At Revamp-IT, shop now means marketplace: a fast purchase path for used electronics from Revamp-IT and other sellers."
author: "RevampIT Team"
featuredImage: "/blog/shop-products.svg"
category: "Produkt"
tags:
  - shop
  - design-system
  - reparatur
  - ssot
publishedAt: "2026-06-16"
published: true
---

The shop question had a false premise. We do not need a second shop page that, alongside the marketplace, explains where you can buy. Anyone who clicks "Shop" wants to see products, compare them, and reach a purchase decision as quickly as possible. That is why the online shop is now the marketplace.

This reduces cognitive load. There is one canonical place for used electronics: `/marketplace`. Old `/shop` URLs are kept as redirects, but the new navigation, sitemap, chatbot suggestions, and internal helpers point to the marketplace. Users land directly at search, filters, and listings instead of a channel selection.

From a business perspective, this is the right default. The marketplace can bring together Revamp-IT listings and listings from other sellers. Revamp-IT offers are marked as such when they are explicitly flagged that way or come from a staff address under `@revamp-it.ch` or `@revampit.ch`. This creates a simple mental market: search everything, recognise the source, buy.

From a design perspective, the discipline is the same as with our other hardened surfaces: no large fallback cards, no equally weighted side paths, no unclear CTA text. The first task is buying. Filtering, searching, and detail pages have to be fast and require little explanation.

From an engineering perspective, the decision removes a fork. `/shop`, `/shop/search`, `/shop/category/...`, and `/shop/product/...` are legacy entry points into the marketplace. No more old shop product pages are added to the sitemap. The URL helpers generate marketplace URLs so that new links do not accidentally revive the old architecture.

The other major user task remains repair and IT help. There, the canonical entry point is not a new parallel process, but `/it-hilfe/create` to describe the problem and `/it-hilfe/techniker` for technicians and workshops. The request stays in the system; matching and diagnostics can build on top of it.

Because Payrexx is not yet set up in production, the platform may function up to the payment click, but must not create fake payments in production. Marketplace checkout, appointment payment, and workshop payment therefore stop with a clear setup message before they change inventory, appointments, or seats. That is more honest and safer than a demo payment that looks real.
