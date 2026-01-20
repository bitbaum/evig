# Knowledge Graph Overview

This document maps key entities and their upstream/downstream relationships for AI retrieval and reasoning.

## Entities (Canonical Tables)
- HR Roster: `01_Management/E_Personal_und_HR/HR_Roster.csv`
- Projects Portfolio: `01_Management/J_Projekte/Project_Portfolio.csv`
- Budget 2025: `01_Management/B_Finanzen/Finanzmodell/Jahresbudget_2025.csv`
- Fundraising Pipeline: `01_Management/B_Finanzen/Finanzmodell/Fundraising_Pipeline.csv`

## Flows
- HR → Projects: staffing capacity, skills matching.
- Projects → Finance: project budgets, cash flow needs.
- Fundraising → Finance: expected inflows and probabilities.
- Finance ↔ Strategy: runway, prioritization, scenario planning.
- Intake (Tech/Ops) → Projects/Impact: device volumes → impact KPIs.

## Authority Order (Global)
1) Canonical CSVs listed above
2) Folder `00_INDEX.md` files
3) Narrative documents and templates

## Notes
- Use IDs across tables for joins: `PER-####`, `PRJ-YYYY-###`, `FUN-####`, `BUD-YYYY-####`.
- Keep dates ISO `YYYY-MM-DD` and amounts in CHF.

