---
title: "Kivvi: the ERP for the circular economy"
excerpt: "Standard ERPs know about purchasing and quantities — not donations and unique items with condition and history. Kivvi is the open ERP built for exactly that."
featuredImage: "/blog/showcase-kivvi-home.png"
category: "Produkt"
tags:
  - kivvi
  - erp
  - kreislaufwirtschaft
  - open-source
  - kivitendo
publishedAt: "2026-07-21"
published: true
---

A delivery van pulls up outside the warehouse. In the back: 50 donated laptops from a company that has renewed its fleet. Every device is a unique item — with its own condition, its own backstory, its own path through repair and sale. For a circular-economy operation, that is a perfectly ordinary Tuesday morning. For an off-the-shelf ERP, it is a problem it never even tries to solve.

![Kivvi home page with the claim «The operating system of the circular economy»](/blog/showcase-kivvi-home.png)

*«50 donated laptops? Logged in 30 seconds.» — Kivvi is built from the ground up for the daily reality of refurbishers and second-hand shops.*

## The problem: standard ERPs think in terms of purchasing and quantities

Every common inventory-management system in the world starts from the same basic assumption: you buy a certain quantity of identical articles, store them, and sell them again. 200 units of article no. 4711, all the same, all new. The purchase price is known, the margin is calculated, the quantity is the decisive figure.

A circular-economy operation works exactly the other way around. Goods do not arrive as an order, but as a **donation** or as a **trade-in**. They are not a quantity, but a collection of **unique items** — each with its own condition grade, from «as good as new» to «for spare parts». Every device has a **repair history**: what was tested, what was replaced, who wiped the data. And in the end, what counts is not only the sales revenue, but also the **impact** — how many devices were saved from the landfill.

These differences are not cosmetic. They touch the very core of the data model. A system that treats «quantity» as the central figure can at best attach a condition grade as a text note somewhere — but cannot filter, calculate or evaluate by it. A system that understands goods receipt as a purchase with an invoice simply has no field for a donation without a counter-value and no template for the receipt the donor needs. The gap cannot be closed through configuration; it sits in the founding assumptions.

None of this fits into the data models of SAP, Odoo or any of the many SME solutions. They know no condition grade, no donation receipt, no lifecycle of an individual device. Anyone running a refurbishing operation, a second-hand shop or a repair café has therefore had only two options: the aging Perl-based **Kivitendo** with its legacy baggage — or the eternal flight into **spreadsheets**, where every process is rebuilt by hand and the data rots in dozens of unconnected files.

## What Kivvi does differently

Kivvi turns the basic assumption on its head. It is not purchasing that stands at the centre, but the **origin of the goods and the individual object**. Donation, condition, repair path and impact are not fields bolted on afterwards — they are the foundation of the data model.

![Split-screen login with feature checklist: AI quick entry, individual items, donation receipts, QR invoices, Open Source MIT](/blog/showcase-kivvi-login.png)

*Right at the login, Kivvi shows what matters: AI quick entry, individual-item management, donation receipts, Swiss QR invoices — and Open Source under the MIT licence.*

The result is a system that speaks the language of the circular economy, instead of forcing it into a foreign schema. Where a classic ERP would first have to be laboriously bent into shape — with extra fields, workarounds and external spreadsheets alongside — for Kivvi the used, unique object is the normal case. And it is built for concrete operations, not for generic trade.

![«Who is Kivvi for?» with the target groups IT refurbishers, second-hand shops, repair cafés and vintage shops](/blog/showcase-kivvi-fuer-wen.png)

*Kivvi is aimed at IT refurbishers, second-hand shops, repair cafés and vintage shops — operations that work with used, unique goods.*

## What standard ERPs can't do — and Kivvi can

![Overview «What standard ERPs can't do»](/blog/showcase-kivvi-sec1.png)

*The gap that Kivvi closes: everything to do with donated, individual, repaired goods.*

The best way to understand Kivvi is a tour through its core areas — each time with the question: What does it do, and which problem does it solve?

### Goods receipt and donations

**What it does:** On receipt, every item is recorded with its origin (donation or trade-in) and a **condition grade**. For donations, a **donation receipt** can be issued directly.

**Which problem it solves:** The condition grade is the basic information on which everything later depends — price, repair needs, sellability. And the donation receipt, simply not provided for in standard ERPs, is a document that non-profit operations need every day.

### Individual-item lifecycle

**What it does:** Every device is its own record that runs through a defined lifecycle: **intake → testing → repair → ready → listed → sold**. The status of each item is visible at any time.

**Which problem it solves:** Instead of a quantity figure of «200 units», the operation knows where each individual object stands. No device gets lost in the process, no item remains stuck unnoticed in testing limbo.

### Repairs

**What it does:** Repair orders are kept per device — including **repair bonus** and the issuing of **erasure certificates** for data-protection-compliant data destruction.

**Which problem it solves:** The repair history stays attached to the device and is traceable. The erasure certificate is not a nice-to-have when selling used IT hardware, but a matter of trust and compliance.

### Sales

**What it does:** The complete sales process is mapped: **quotation → order → delivery note → invoice → dunning**.

**Which problem it solves:** From the first offer to the last payment reminder, everything runs in one system, without a media break. No parallel invoicing tool, no reminders tracked by hand.

![Overview «What Kivvi can do»](/blog/showcase-kivvi-sec3.png)

*From goods receipt to accounting: Kivvi covers the entire chain in one system.*

### Swiss accounting

**What it does:** Kivvi comes with a complete **SME chart of accounts with 227 accounts**, an **immutable journal** and **VAT** handling.

**Which problem it solves:** Accounting is not a separate program to which data has to be exported, but an integral part of the ERP. The immutable journal ensures audit security — once posted, it stays posted.

### Banking

**What it does:** Kivvi reads in **CAMT.053/054** bank files and automatically reconciles incoming payments with the **QR invoices**.

**Which problem it solves:** Payment reconciliation, otherwise hours of manual work, happens automatically. Paid invoices are recognised, open items stay open — without anyone comparing bank statements line by line with invoices.

### AI command bar

**What it does:** An AI-powered command bar understands natural language and executes it via **47 audited tools** — from quick entry to evaluation.

**Which problem it solves:** «50 donated laptops? Logged in 30 seconds.» — instead of clicking each field individually, you describe the task, and Kivvi does it. Because each of the 47 tools is audited, every action stays traceable and controlled.

## Open and connected

An ERP that locks its data away is a trap. Kivvi goes the opposite way and is built to be open from the ground up.

It offers an **open REST API (v1)** and **signed webhooks**, through which other systems can be connected cleanly and securely. For the switch from a legacy system, there is a **Kivitendo CSV import** — exactly the interface you would wish for, in exactly the right place: at the transition from the old Perl world into the new one.

Just as important is the licence. Kivvi is **Open Source under the MIT licence**. That means: **no vendor lock-in**, **self-hosting** on your own infrastructure, and the certainty that the **data stays in Switzerland**. Whoever uses Kivvi owns their system — not the other way around. Precisely for non-profit operations that work with tight resources and plan for the long term, this is decisive: there are no licence costs that explode with growth, and no risk that a provider discontinues the product and holds the data hostage. The source code is open, the interfaces are documented, the operation remains capable of acting.

## The scale

Kivvi is not a prototype, but a mature system. A few figures to put it in perspective:

| Metric | Value |
|---|---|
| Documentation | 133 pages |
| Database tables | 50 |
| Domain modules | 63 |
| AI tools | 47 |
| Commits | 616 |
| Licence | MIT |

## Under the hood

Technically, Kivvi stands on a modern, maintainable foundation. It is built as a **Next.js 14 monorepo** in **TypeScript**, with **PostgreSQL** as the database and **Drizzle** as the ORM. For all monetary amounts, **decimal.js** is used — rounding errors with francs and centimes are thereby ruled out. Kivvi generates the Swiss QR invoices with **SwissQRBill**, cleanly standard-compliant. This choice is not an end in itself: it ensures that the system calculates correctly, stays maintainable and can grow along with the operation.

## Conclusion

Standard ERPs are built for a world in which goods are purchased in quantities and sold identically. The circular economy lives in a different world — the world of the donation, of the unique item with condition and history, of repair and measurable impact. Kivvi is the first ERP that treats this world not as a special case, but as a starting point.

It is open, it is Swiss, it belongs to you. Anyone who wants to know how that feels can find Kivvi at **kivvi.orangecat.ch**.
