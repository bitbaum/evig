# Erfassung vs Intake — Audit & Consolidation Plan

**Created**: 2026-03-23
**Status**: Phase 2 — audit complete, consolidation not yet started

## What Each System Does

### Erfassung (`/admin/erfassung`)
- **Purpose**: AI-powered product data entry into inventory
- **Entry point**: Staff takes a photo or enters product data manually
- **Flow**: Image → AI extraction → review/edit form → save to `ai_extracted_products` + `inventory_items`
- **Modes**: Single product, bulk upload (CSV/multi-image)
- **Output**: Creates `ai_extracted_products` record (with `source_type='erfassung'`) and linked `inventory_items` record
- **Key features**: AI refinement, confidence scores, bulk operations, customer profile tagging

### Intake (`/admin/intake`)
- **Purpose**: Device intake pipeline with structured checklists and tier classification
- **Entry point**: Device arrives (donation or walk-in) → quick registration form
- **Flow**: Register → assign tier (refurbish/parts/recycle) → checklist per tier → complete → publish
- **Output**: Creates `ai_extracted_products` record (with `source_type='intake'`) and linked `inventory_items` record with `intake_tier`, `intake_checklist`, `intake_events` fields
- **Key features**: Tier-based checklists, progress tracking, timeline/audit trail, donation tracking

## Overlap

| Aspect | Erfassung | Intake |
|--------|-----------|--------|
| **Creates** `ai_extracted_products` | Yes | Yes |
| **Creates** `inventory_items` | Yes | Yes |
| **AI extraction** | Core feature | Not used (manual entry) |
| **Image capture** | Yes (camera/upload) | Yes (optional) |
| **Brand/model/condition** | Yes | Yes |
| **Category/subcategory** | Yes | Yes |
| **Price** | Suggested by AI | Manual |
| **Bulk mode** | Yes (CSV + multi-image) | No |
| **Checklists** | No | Yes (tier-based) |
| **Donation tracking** | No | Yes |
| **Timeline/audit** | No | Yes (`intake_events`) |
| **Marketplace publish** | No (draft only) | Yes (gates on checklist) |

## What's Different (Not Overlap)

- **Erfassung** is optimized for **fast cataloging** — take photo, let AI fill the form, save. Best for bulk product entry (e.g., received a pallet of laptops).
- **Intake** is optimized for **quality assurance** — structured checklist ensures nothing is missed before a device hits the marketplace. Best for devices that need testing/refurbishment.

These are **complementary**, not redundant.

## Proposed Consolidation

### Don't merge the UIs — merge the data path

Both systems already write to the same tables (`ai_extracted_products` + `inventory_items`). The `source_type` column (added in migration 046) correctly tracks origin. This is fine.

### Recommended changes (future work):

1. **Erfassung → Intake handoff**: After erfassung saves a product, show a "Zur Intake-Pipeline hinzufügen" button that assigns an `intake_tier` and drops the item into the intake checklist flow. This turns the two systems into a sequential pipeline: Erfassung (identify) → Intake (validate).

2. **Intake can use AI extraction**: When creating an intake item, offer the "Foto aufnehmen" option from Erfassung to pre-fill fields via AI. This reduces duplicate data entry.

3. **Unified inventory dashboard**: Both erfassung and intake items appear in `/admin/products` already. Ensure filters/columns work well for both `source_type` values.

4. **Don't merge the pages**: The UIs serve different workflows. Erfassung is a data-entry tool; Intake is a QA pipeline. Merging would make both worse.

### Connection to IT-Hilfe/Repairers flow

The full lifecycle should be:
```
IT-Hilfe request → Repairer fixes device → Device donated/refurbished
    → Erfassung (AI cataloging) → Intake (QA checklist) → Marketplace
```

The `source_donation_id` field on `inventory_items` can link to a donation record. A future migration could add an `it_hilfe_request_id` field to track devices that entered through the IT-Hilfe flow.

## TODO Items

- [ ] Add "Send to Intake" button on Erfassung success screen
- [ ] Add AI photo capture option in Intake create form
- [ ] Add `it_hilfe_request_id` to `inventory_items` for end-to-end traceability
- [ ] Ensure `/admin/products` shows `source_type` filter
