-- Migration 023: Fix users table trigger
--
-- The users table uses camelCase column names from Auth.js adapter ("updatedAt")
-- but the update_updated_at_column() trigger references snake_case "updated_at".
-- This causes ALL updates to the users table to fail with:
--   ERROR: record "new" has no field "updated_at"
--
-- Fix: Drop the mismatched trigger. The application code already handles
-- setting "updatedAt" = NOW() explicitly in UPDATE queries.

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
