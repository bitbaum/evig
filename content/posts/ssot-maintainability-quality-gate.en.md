---
title: "SSOT: Why We Are Making Our Website More Maintainable"
excerpt: "We have further consolidated the technical foundation of the website: less hardcoding, clearer responsibilities, better checks, and a stricter shipping process."
featuredImage: "/blog/ssot-quality-gate.svg"
category: "Engineering"
tags:
  - SSOT
  - Maintainability
  - Design System
  - Engineering
publishedAt: "2026-05-07"
published: true
---

A sustainable website is not just a website that talks about sustainability. It also has to be built in a way that lets it be maintained, extended, and reviewed over the long term. That is exactly what we have kept working on.

At the centre was one principle: **Single Source of Truth**, or SSOT for short. Every important piece of information should have exactly one reliable source. Colours, status indicators, organisational data, text, database structures, and quality processes must not be copied in slightly different ways across many places. Otherwise every change becomes riskier, slower, and more expensive.

## What We Improved

We added new compliance checks that automatically verify whether central rules are being followed. These include an SSOT audit and an i18n audit for translations. Among other things, the SSOT check now prevents database tables from being created inside API routes, or old `hardcoded-content` patterns from reappearing.

The shipping process was also tightened. Instead of ignoring warnings or only checking after the build, the quality path now runs more clearly: TypeScript, linting, compliance, tests, and the production build. This surfaces errors earlier and strengthens reliability before releases.

In the design system, several hard-coded colour values were moved into central UI configurations. App-specific colours for Open Graph images, feedback overlays, error pages, category forms, factsheets, hero patterns, and customer profiles now live in named places. This reduces hidden dependencies and makes later adjustments more targeted.

Another point was the separation of content and configuration. A service badge like "Soon" does not belong hard-wired into a technical service configuration, but in the translations. Small shifts like this pay off strongly for maintainability over time.

## Why This Matters

Hardcoding is often convenient, but it creates debt. A colour here, a German string there, a status class in a domain file, a database statement in an API route: each individual spot seems harmless. Together, however, they lead to a system that is hard to understand and hard to change safely.

SSOT is therefore not an end in itself. It helps us work faster and more precisely:

- Changes happen in one place instead of many.
- Design decisions stay consistent.
- Translations become measurable.
- Database structure stays in migrations and schema files.
- Reviews can focus on behaviour instead of searching.

## What Is Still Open

The direction is clear, but the work is not finished. Next, we want to pay down the existing translation debt. The new i18n check already prevents new missing keys, but some existing gaps are still documented as a baseline.

We should also further separate domain configurations from UI text. Status values like `active`, `sold`, or `reserved` are domain data. The German labels and the visual representation should come cleanly through translations and UI mapping.

The design system, too, deserves a deeper consolidation. There are already good central building blocks, but some older token layers overlap. The goal is a clear architecture: primitive tokens, semantic tokens, component variants, and area-specific mappings.

## Our Standard

For us, maintainability is a mark of quality. It decides whether a platform only works today or can also still be developed safely a year from now.

SSOT, separation of concerns, and DRY code are not abstract terms for this. They are concrete working rules: fewer copies, clearer boundaries, better automation, and a system that does not make changes unnecessarily hard.

That is exactly what we keep building on.
