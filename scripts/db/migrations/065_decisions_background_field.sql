-- Migration 065: Add background/rationale field to decisions table
-- Separates "what we're deciding" (description) from "why" context (background)
-- Shown as collapsible Begründung section before the ballot

ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS background TEXT;
