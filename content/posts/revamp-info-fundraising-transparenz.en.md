---
title: "Revamp-Info: Transparency on the outside, fundraising intelligence on the inside"
excerpt: "A portal that shows funders documented financial and impact data — and internally picks the right matches from 16'900 Swiss foundations and drafts finished applications."
featuredImage: "/blog/showcase-revampinfo-home.png"
category: "Produkt"
tags:
  - fundraising
  - transparenz
  - stiftungen
  - gesuche
publishedAt: "2026-07-21"
published: true
---

Fundraising for a non-profit association looks easier from the outside than it is. You think: good cause, honest numbers, a few applications — the money will come. In reality, fundraising is manual labour. Hours of tedious manual work that nobody sees and that nonetheless decides whether a project survives.

This is exactly where **Revamp-Info** comes in. It is a portal with two faces: on the outside it shows funders documented financial and impact data. On the inside it finds the right matches among thousands of Swiss foundations and drafts the applications while it's at it. One tool, two tasks that belong together.

![«Fundraising tools» home page with foundation research, application templates, impact data and financial data](/blog/showcase-revampinfo-home.png)

*The home page bundles all four tools: foundation research, application templates, impact data and financial data.*

## The problem

Anyone who has ever sought money for an association knows the two walls you run into.

**The first wall: finding the right foundations.** In Switzerland there are thousands of charitable foundations. Most of them fund something entirely different from what you do yourself. One foundation supports music, another only projects in the canton of Vaud, a third only children under twelve. Figuring out which ones even fit you means: combing through registers, reading statutes, comparing funding criteria. For days. And in the end you may have a handful that truly qualify.

**The second wall: writing applications.** Once a suitable foundation is found, the real work only begins. Every application wants you to explain the organisation, prove the impact, break down the budget, find the right arguments for exactly this foundation. A good application costs days. And because every foundation has different priorities, you can't simply send the same document out twenty times.

On top of this comes a third requirement that overlays everything: **funders demand credible, transparent figures.** On finances and on impact. Anyone who writes "we've done a lot of good" today without proving it ends up in the bin. Foundation boards want to see where the money flows and what it achieves — verifiable, not merely asserted.

## Two things in one tool

Revamp-Info answers both walls and the transparency requirement with a single portal. The trick is that the two sides feed each other: the transparency data you show on the outside is exactly the evidence you need for a strong application. What you prepare cleanly once serves both purposes.

## Part 1 — On the outside: transparency

**What it does.** The public part of Revamp-Info makes the association's numbers visible. Two areas are at the centre: finances and impact.

The **financial transparency** shows eight years of income and expenditure — as charts and as tables, directly referenceable. Anyone who wants to know how the association finances itself and what it spends the money on sees it here at a glance, across a long period. Not a polished snapshot, but the development over the years.

![Financial transparency dashboard with eight years of income and expenditure as charts](/blog/showcase-revampinfo-finanzen.png)

*Eight years of income and expenditure — as a chart and as a referenceable table.*

The **impact data** shows what the association achieves: the CO₂ saved, the devices passed on, the social integration through work and training. These figures are not only meant for the public — they are documented evidence for applications. Exactly what a foundation wants to see before it funds.

![Impact data with CO₂ savings, devices passed on and social integration](/blog/showcase-revampinfo-wirkung.png)

*Impact data: CO₂, devices passed on and social integration — documented evidence for applications.*

**What problem it solves.** It removes the third wall. Instead of laboriously gathering figures for every application and hoping they're right, there is one source that is always current and always documented.

And here lies the actual principle: **every figure shown carries its source, its calculation path and its confidence with it — and is verifiable at a click.** A CO₂ figure is not simply an assertion but links to the methodology behind it: which factor, which data source, how reliable. That is the difference between "trust us" and "check for yourself".

![Methodology and transparency report with calculation path and source references](/blog/showcase-revampinfo-methodik.png)

*The methodology report: every figure leads to its calculation path, its source and its confidence.*

For a foundation board this is worth its weight in gold. They don't have to believe the figures — they can verify them. And trust that you can verify is stronger than trust you have to ask for.

## Part 2 — On the inside: fundraising intelligence

The internal part is the answer to the first two walls. It consists of three interconnected tools.

**The foundation pipeline.** Revamp-Info works with around **16'900 Swiss foundations** in the funnel. Instead of combing through registers yourself, the portal filters this mass by fit. For each foundation there is a fit analysis: does the funding purpose match? Does the region match? Does the target group match? From thousands, this yields the few where an application is genuinely worthwhile. The days-long preparatory work of the past shrinks to a filtered, sorted list.

**The application generator.** This is the heart of it. From a single foundation entry the tool produces a complete application package:

- a finished, four-page **application PDF**, tailored to exactly this foundation
- a **one-pager** for a quick overview
- a **pitch deck** for the presentation
- an **impact report** that draws the evidence from the transparency part
- a **tokenised, shareable landing page** that you can send the foundation as a link

What used to cost days per application becomes a process that builds finished, individual documents from existing data. The impact data from Part 1 flows directly into the impact report — this is where the two sides interlock.

**The application pipeline.** So that nobody loses track amid many ongoing applications, there is a Kanban overview: which application is in preparation, which has been sent, which has been answered? Fundraising turns from a collection of scattered Word documents into a traceable process.

## The numbers at a glance

| Metric | Value |
|---|---|
| Swiss foundations in the funnel | 16'900 |
| Document types generated per application | 5 |
| Years of financial data public | 8 |
| Pages in the portal | 31 |
| Commits in the project | 866 |

## The technology behind it

Revamp-Info is built with **Next.js 16** and **React 19**. The financial and impact charts run through **Chart.js**. The four-page application PDFs, one-pagers and impact reports are generated server-side with **@react-pdf** — real, printable documents, not a screenshot of a web page. The data lives in **PostgreSQL** and is accessed via **Drizzle**. The fit analysis of the foundations and the text building blocks of the applications rely on **Groq AI**. Together this makes a tool that turns structured data into finished, individual fundraising documents in seconds.

## Conclusion

Fundraising remains work — but it no longer has to be blind, repeated manual labour. Revamp-Info turns the two most tedious steps around: the portal finds suitable foundations, and it helps write the applications. And because every figure shown on the outside is documented and verifiable, transparency doesn't become a chore but the strongest argument in the application.

On the outside, trust that you can verify. On the inside, time you get back. Both in the same tool — to be seen at **revamp-info.orangecat.ch**.
