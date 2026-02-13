# Migration 034: Admin Edit-Before-Approve System

## Overview

This migration adds the ability for admins to edit workshop proposals and blog submissions directly before approving them, with full audit trail tracking.

## What Was Implemented

### 1. Database Changes
- Added `edit_history` (JSONB) column to track all admin edits
- Added `last_edited_by` (UUID) to record the last admin who edited
- Added `last_edited_at` (TIMESTAMPTZ) to record the last edit timestamp
- Created indexes for efficient querying

### 2. Backend API
- **Workshop Proposals:**
  - `GET /api/admin/workshops/proposals/[id]` - Fetch proposal with edit history
  - `PATCH /api/admin/workshops/proposals/[id]` - Edit proposal fields (action: 'edit')
  - `GET /api/admin/workshops/proposals/[id]/history` - Fetch edit history only

- **Blog Submissions:**
  - Extended `PATCH /api/admin/blog/submissions/[id]` with 'edit' action

### 3. Frontend Components
- **Workshop Proposals:**
  - Detail page: `/admin/workshops/proposals/[id]`
  - Edit modal with all editable fields
  - Edit history display component
  - Visual "Von Admin bearbeitet" badge in list view

- **Blog Submissions:**
  - Edit button in detail panel
  - Edit modal for content, title, excerpt, category, tags
  - Visual "Von Admin bearbeitet" badge in list view

### 4. Configuration
- `src/config/editable-fields.ts` - Centralized field definitions
- `src/lib/admin/edit-utils.ts` - Edit snapshot and history utilities

---

## Running the Migration

### Prerequisites
1. Ensure your `.env.local` has `DATABASE_URL` set to your Neon PostgreSQL connection string
2. Make sure you have `psql` installed

### Execute Migration

```bash
# Method 1: Using the migration script
./scripts/run-migration-034.sh

# Method 2: Direct psql command
psql "$DATABASE_URL" -f scripts/db/migrations/034_admin_edit_submissions.sql
```

### Verify Migration Success

The script automatically verifies the columns were created. You should see:

```
workshop_proposals columns:
- edit_history (jsonb)
- last_edited_by (uuid)
- last_edited_at (timestamp with time zone)

blog_submissions columns:
- edit_history (jsonb)
- last_edited_by (uuid)
- last_edited_at (timestamp with time zone)
```

---

## Testing the Implementation

### Test 1: Workshop Proposal Edit

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to admin workshops:**
   - Go to `http://localhost:3001/admin/workshops`
   - Make sure you're logged in as an admin

3. **Create or find a pending proposal:**
   - If no proposals exist, create one as a regular user first
   - Filter by "Ausstehend" (pending)

4. **Edit the proposal:**
   - Click on a proposal to open the detail view
   - Click the "Bearbeiten" button
   - Modify some fields (e.g., title, description, duration)
   - Click "Speichern"

5. **Verify edit tracking:**
   - Check that "Bearbeitet durch Admin" banner appears at the top
   - Scroll to "Bearbeitungsverlauf" section
   - Verify edit history shows:
     - Your name
     - Timestamp
     - Fields changed
     - Previous values (click "Änderungen anzeigen")

6. **Verify list view badge:**
   - Go back to `/admin/workshops`
   - The edited proposal should show "Von Admin bearbeitet" badge

### Test 2: Blog Submission Edit

1. **Navigate to blog submissions:**
   - Go to `http://localhost:3001/admin/content/submissions`

2. **Create or find a pending submission:**
   - If none exist, submit a blog post as a user
   - Filter by "Ausstehend"

3. **Edit the submission:**
   - Click on a submission in the list
   - Click the blue "Bearbeiten" button
   - Modify title, content, excerpt, or tags
   - Click "Speichern"

4. **Verify edit tracking:**
   - The submission should reload with updated content
   - Edit history is stored (check database or via API)

5. **Verify list view badge:**
   - The edited submission should show "Von Admin bearbeitet" badge

### Test 3: Edit History Persistence

1. **Make multiple edits:**
   - Edit the same proposal/submission 2-3 times
   - Change different fields each time

2. **Verify complete history:**
   - Check edit history shows all edits in chronological order
   - Each edit should show:
     - Different timestamps
     - Your name (or different admins if testing with multiple accounts)
     - Different fields changed

3. **Approve after editing:**
   - After editing, approve the proposal/submission
   - Verify the workshop/blog post is created with the EDITED values
   - Not the original submitted values

### Test 4: API Direct Testing

```bash
# Fetch a proposal with edit history
curl http://localhost:3001/api/admin/workshops/proposals/[PROPOSAL_ID] \
  -H "Cookie: [YOUR_SESSION_COOKIE]"

# Edit a proposal
curl -X PATCH http://localhost:3001/api/admin/workshops/proposals/[PROPOSAL_ID] \
  -H "Content-Type: application/json" \
  -H "Cookie: [YOUR_SESSION_COOKIE]" \
  -d '{
    "action": "edit",
    "fields": {
      "title": "Updated Title",
      "duration_minutes": 120
    }
  }'

# Fetch edit history
curl http://localhost:3001/api/admin/workshops/proposals/[PROPOSAL_ID]/history \
  -H "Cookie: [YOUR_SESSION_COOKIE]"
```

### Test 5: Database Verification

```sql
-- Check edit history for workshop proposals
SELECT
  id,
  title,
  status,
  last_edited_at,
  last_edited_by,
  jsonb_array_length(edit_history) as edit_count
FROM workshop_proposals
WHERE last_edited_at IS NOT NULL;

-- View detailed edit history
SELECT
  id,
  title,
  jsonb_pretty(edit_history) as history
FROM workshop_proposals
WHERE last_edited_at IS NOT NULL;

-- Same for blog submissions
SELECT
  id,
  title,
  status,
  last_edited_at,
  last_edited_by,
  jsonb_array_length(edit_history) as edit_count
FROM blog_submissions
WHERE last_edited_at IS NOT NULL;
```

---

## Troubleshooting

### Migration Fails

**Error: "relation does not exist"**
- Ensure you're connected to the correct database
- Check that workshop_proposals and blog_submissions tables exist

**Error: "column already exists"**
- Migration was already run
- To re-run, first drop the columns:
  ```sql
  ALTER TABLE workshop_proposals DROP COLUMN IF EXISTS edit_history CASCADE;
  ALTER TABLE workshop_proposals DROP COLUMN IF EXISTS last_edited_by CASCADE;
  ALTER TABLE workshop_proposals DROP COLUMN IF EXISTS last_edited_at CASCADE;

  ALTER TABLE blog_submissions DROP COLUMN IF EXISTS edit_history CASCADE;
  ALTER TABLE blog_submissions DROP COLUMN IF EXISTS last_edited_by CASCADE;
  ALTER TABLE blog_submissions DROP COLUMN IF EXISTS last_edited_at CASCADE;
  ```

### Edit Button Not Showing

- Check that the proposal/submission status is "pending"
- Edit button only shows for pending items
- Verify you're logged in as admin with proper permissions

### Edit History Not Displaying

- Check browser console for errors
- Verify the API is returning edit_history field
- Check that EditHistoryView component is imported correctly

### TypeScript Errors

If you see type errors, run:
```bash
npm run typecheck
```

Common fixes:
- Ensure all imports are correct
- Check that WorkshopProposalWithProposer type includes edit fields
- Restart TypeScript server in your IDE

---

## Rollback (If Needed)

To rollback the migration:

```sql
-- Remove columns from workshop_proposals
ALTER TABLE workshop_proposals
  DROP COLUMN IF EXISTS edit_history CASCADE,
  DROP COLUMN IF EXISTS last_edited_by CASCADE,
  DROP COLUMN IF EXISTS last_edited_at CASCADE;

-- Remove columns from blog_submissions
ALTER TABLE blog_submissions
  DROP COLUMN IF EXISTS edit_history CASCADE,
  DROP COLUMN IF EXISTS last_edited_by CASCADE,
  DROP COLUMN IF EXISTS last_edited_at CASCADE;

-- Drop indexes
DROP INDEX IF EXISTS idx_workshop_proposals_last_edited;
DROP INDEX IF EXISTS idx_workshop_proposals_edited_by;
DROP INDEX IF EXISTS idx_blog_submissions_last_edited;
DROP INDEX IF EXISTS idx_blog_submissions_edited_by;
```

---

## Architecture Notes

### Ground Truth Compliance

This implementation follows CLAUDE.md principles:

- **GT #1 (Serve Humans):** Streamlines admin workflow, no more reject-resubmit cycles
- **GT #2 (SSOT):** Fields edited in-place, history in JSONB, config centralized
- **GT #3 (Design for Change):** JSONB history extensible, reusable components
- **GT #4 (Automate):** Edit snapshots automatic, no manual audit logging
- **GT #5 (Simplicity):** No shadow tables, simple queries, minimal schema changes
- **GT #6 (Correctness):** Full audit trail, validation on edit, transaction safety

### Edit History Structure

```typescript
interface EditHistoryEntry {
  timestamp: string;        // ISO 8601
  editor_id: string;        // UUID of admin
  editor_name: string;      // Display name
  fields_changed: string[]; // ['title', 'description']
  snapshot: Record<string, any>; // Previous values
}
```

Stored as JSONB array in `edit_history` column.

---

## Success Criteria

✅ Migration runs without errors
✅ Columns exist in both tables with correct types
✅ Indexes created successfully
✅ Edit button appears on pending proposals/submissions
✅ Edit modal opens and displays all fields
✅ Saving edits updates the database
✅ Edit history displays correctly
✅ "Von Admin bearbeitet" badge shows in list views
✅ Approval creates workshop/post with edited values
✅ Multiple edits create sequential history entries

---

## Support

If you encounter issues:

1. Check the logs: `tail -f logs/*.log`
2. Inspect network requests in browser DevTools
3. Query the database directly to verify data
4. Check that all files were created correctly
5. Verify permissions for admin sections

**All files created/modified in this migration are listed in the plan document.**

---

*Migration completed: 2026-02-13*
*Developer: Claude Code*
