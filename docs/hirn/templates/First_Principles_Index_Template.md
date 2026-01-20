---
id: [AREA_ID]
area: [AREA_NAME]
owner: [OWNER_NAME]
status: Proposed # Draft | Proposed | Approved | Canonical
review_cycle: monthly
last_reviewed: 2025-11-20
source_of_truth: [] # e.g., ['./HR_Roster.csv']
upstream: []        # e.g., ['../B_Finanzen/Finanzmodell/Jahresbudget_2025.csv']
downstream: []      # e.g., ['../J_Projekte/Project_Portfolio.csv']
confidentiality: public # public | internal | restricted | secret
tags: []
---

# [Area Name] – Index (First Principles)

## Goal
- [What we optimize for] with [target metrics].

## Constraints
- [Legal/Capacity/Money/Time].

## Invariants
- [Non-negotiables].

## Assumptions
- [Explicit premises to be tested].

## Metrics
- [How success is measured].

## Decisions (with rationale)
- Decision: [What/Why].

## Authority Order
1) Canonical CSVs (listed in `source_of_truth`)
2) This index
3) Adjacent narrative docs

## Dependencies
- Upstream: [links]
- Downstream: [links]

## Canonical Tables
- [Link to CSVs or registries]

