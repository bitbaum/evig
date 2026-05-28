# Project Migration Checklist

**Created**: 2025-01-27  
**Last Modified**: 2025-01-27  
**Last Modified Summary**: Checklist for safely migrating project pages without losing content

## Critical Rules

### ✅ NEVER
- **Remove content** - Every piece of text must be preserved
- **Make up information** - Only use existing content
- **Change pricing** - Leave pricing sections exactly as they are
- **Simplify complex sections** - Some pages need custom layouts
- **Auto-migrate** - Each page needs manual review

### ✅ ALWAYS
- **Preserve all text** - Verify every title, description, and feature
- **Match original layout** - If a page has 4 sections, keep 4 sections
- **Keep custom styling** - Some pages need unique designs
- **Test visual appearance** - Screenshot comparison recommended
- **Document differences** - Note any intentional changes

## Migration Process

### Step 1: Read Original File
```bash
git show HEAD:src/app/projects/[project]/page.tsx
```

### Step 2: Extract Content
- List all text content
- Identify sections
- Note special styling
- Mark pricing/complex sections

### Step 3: Create Config
```typescript
const projectConfig: ProjectPageConfig = {
  hero: { /* ... */ },
  sections: [ /* ALL sections */ ],
  metadata: { /* ... */ }
}
```

### Step 4: Verify Content Count
```bash
# Count text elements in original
git show HEAD:src/app/projects/[project]/page.tsx | grep -E "(title|description|text):" | wc -l

# Count text elements in new
cat src/app/projects/[project]/page.tsx | grep -E "(title|description|text):" | wc -l

# Should be same or more (config adds structure)
```

### Step 5: Visual Verification
- Compare screenshots
- Check button text
- Verify sections appear
- Test responsive layout

## Content Preservation Examples

### Compirat Migration ✅
- **Before**: 383 lines
- **After**: 133 lines
- **Content**: 100% preserved
- **Status**: All text verified

### Pages NOT Ready for Migration

#### Kivitendo ⚠️
- **Reason**: Has pricing section (CHF 100/month)
- **Action**: Use custom layout for pricing
- **Status**: Keep original for now

#### Linuxola ⚠️
- **Reason**: Has social sharing component
- **Action**: Add ShareButton support to components
- **Status**: Needs component enhancement

#### FreieComputer ⚠️
- **Reason**: Complex custom layout
- **Action**: Manual review needed
- **Status**: Not migrated yet

## Verification Commands

### Content Preservation Check
```bash
# Get original content count
ORIGINAL=$(git show HEAD:src/app/projects/[project]/page.tsx | grep -c -E "(title|description|text):")

# Get new content count  
NEW=$(cat src/app/projects/[project]/page.tsx | grep -c -E "(title|description|text):")

# Compare
echo "Original: $ORIGINAL, New: $NEW"
```

### Button Text Check
```bash
# Verify all buttons have text
cat src/app/projects/[project]/page.tsx | grep "text:" | grep -v "^[[:space:]]*$"
```

### Metadata Check
```bash
# Verify metadata is preserved
grep -A 2 "metadata:" src/app/projects/[project]/page.tsx
```

## Common Issues to Avoid

### 1. Empty Buttons
- **Symptom**: Button renders without text
- **Fix**: Always include `text` property in CTA config
- **Check**: Line 39 in ProjectHero.tsx renders `{cta.text}`

### 2. Missing Features
- **Symptom**: Feature list is shorter
- **Fix**: Include all features in `features` array
- **Check**: Compare feature count

### 3. Lost Custom Styling
- **Symptom**: Page looks different
- **Fix**: Use custom section components if needed
- **Check**: Screenshot comparison

### 4. Changed Pricing
- **Symptom**: Pricing is wrong or missing
- **Fix**: DON'T migrate - keep original
- **Check**: Never touch pricing sections

## Safe Migration List

### ✅ Safe to Migrate
- Pages with simple layout
- No pricing information
- Standard sections only
- No custom components

### ⚠️ Needs Caution
- Pages with pricing
- Custom social sharing
- Complex layouts
- Special functionality

### ❌ Don't Migrate
- Pages with financial info
- Pages with custom business logic
- Pages requiring special features
- Pages with extensive custom code

## Next Steps

1. ✅ Migrated: Compirat (verified, all content preserved)
2. ⏸️ Waiting: Other pages (manual review required)
3. 📋 Documentation: Created
4. 🔍 Review: User approval for each migration

## Summary

**Successfully migrated**: Compirat page with 100% content preservation  
**Reduced code**: 65% (383 → 133 lines)  
**No content lost**: All text, features, and sections preserved  
**Fixed bug**: Empty button issue resolved  

**Next**: Manual review and approval required for each additional page migration.

