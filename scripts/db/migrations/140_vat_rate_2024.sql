-- 140: invoices.tax_rate default → the Swiss VAT rate in force.
--
-- Switzerland raised standard VAT from 7.7% to 8.1% on 2024-01-01. The column
-- default still said 0.0770, matching four other stale copies in application
-- code (see src/config/tax.ts, now the single source). Rows written without an
-- explicit rate therefore recorded the pre-2024 rate.
--
-- Existing rows are deliberately NOT back-filled: tax_rate is the record of what
-- was actually charged on that transaction. Rewriting it would falsify the
-- history rather than correct it. Any commercial correction of documents issued
-- at the wrong rate is a business decision, not a migration.

ALTER TABLE invoices
  ALTER COLUMN tax_rate SET DEFAULT 0.0810;
