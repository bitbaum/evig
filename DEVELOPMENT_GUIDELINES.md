# Development Guidelines for RevampIT

## 🚨 CRITICAL: File Deletion Protection

### NEVER DELETE FILES WITHOUT EXPLICIT USER APPROVAL

**Before deleting any files, directories, or pages:**

1. ✅ **ALWAYS ask the user first** - Get explicit permission before removing anything
2. ✅ **Create backups** - Use `.bak` extensions or git stash before major changes
3. ✅ **List what will be deleted** - Show the user exactly what files/directories will be removed
4. ✅ **Explain the impact** - Describe what functionality will be lost

### Recently Restored Pages (DO NOT DELETE)

The following pages were accidentally deleted and have been restored from commit `0c586b0^`:

- `/blog` - All blog pages and functionality
- `/get-involved` - Volunteer, donation, partnership pages
- `/projects` - Project showcase pages (compirat, freiecomputer, etc.)
- `/services` - All service pages and subpages
- `/admin` - Admin interface and login pages
- `/ai-cms` - AI CMS functionality
- `/revamped` - Revamped page content
- `error.tsx` & `not-found.tsx` - Error handling pages

### Chatbot Design Standards

**Original Design**: Green-blue gradient (`from-green-600 to-blue-600`)
- ❌ **Do not change to solid blue** - This was reverted per user feedback
- ✅ **Maintain green-blue gradient** - This is the approved brand design
- Component: `src/components/ui/RevampCopilot.tsx`

### Safe Development Practices

1. **Use git branches** for experimental features
2. **Create incremental commits** instead of large changes
3. **Test locally** before committing changes
4. **Read commit messages** carefully before pushing
5. **Use `git stash`** to temporarily save changes

### Emergency Recovery Commands

If pages are accidentally deleted again:

```bash
# List what existed before problematic commit
git show COMMIT_HASH^:src/app --name-only

# Restore specific directory
git checkout COMMIT_HASH^ -- src/app/DIRECTORY_NAME

# Restore specific files
git checkout COMMIT_HASH^ -- src/app/file.tsx

# Restore from before the large deletion (commit 0c586b0)
git checkout 0c586b0^ -- src/app/blog
git checkout 0c586b0^ -- src/app/get-involved
git checkout 0c586b0^ -- src/app/projects
git checkout 0c586b0^ -- src/app/services
```

### Checklist Before Major Changes

- [ ] Did I ask the user for permission?
- [ ] Are there any files being deleted?
- [ ] Did I create a backup/branch?
- [ ] Did I test the changes locally?
- [ ] Will this break existing functionality?

**Remember**: It's better to ask twice than to break the site once.