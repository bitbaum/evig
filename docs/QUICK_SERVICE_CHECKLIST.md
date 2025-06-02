# Quick Service Addition Checklist

Use this checklist when adding a new service to ensure nothing is missed.

## ✅ Essential Steps (DO NOT SKIP)

### 1. Create Service Page
- [ ] `src/app/services/[service-slug]/page.tsx` created
- [ ] Metadata includes title, description, OpenGraph
- [ ] Structured data (schema.org) added
- [ ] Hero section with clear value proposition
- [ ] CTA sections with contact links

### 2. Update Main Services Page
- [ ] Service added to `coreServices` array in `src/app/services/page.tsx`
- [ ] Icon imported from lucide-react
- [ ] Service added to `serviceType` in structured data
- [ ] Features, pricing, and highlight text added

### 3. Update Navigation (CRITICAL)
- [ ] Service added to `subItems` in `src/config/navigation.tsx`
- [ ] Navigation description added
- [ ] Desktop dropdown tested
- [ ] Mobile navigation tested

### 4. Test Everything
- [ ] Navigate to service from main menu
- [ ] All internal links work
- [ ] Mobile responsive design
- [ ] Page loads correctly
- [ ] SEO metadata displays correctly

## 🚨 Common Oversights

- **Navigation links** - Most commonly forgotten!
- **Mobile navigation** - Often not tested
- **Structured data** - Missing from main services page
- **Consistent styling** - Using wrong colors or spacing
- **Internal links** - Broken "View details →" links

## 📁 Files to Update

1. `src/app/services/[service-slug]/page.tsx` (NEW)
2. `src/app/services/page.tsx` (UPDATE)
3. `src/config/navigation.tsx` (UPDATE)

## 🎨 Design Consistency

- **Colors**: Green primary (#16a34a), Gray secondary
- **Spacing**: py-20 for sections, gap-8 for grids
- **Icons**: lucide-react, w-8 h-8 for service cards
- **Typography**: font-bold for headings, text-gray-600 for body

---

**Before marking complete**: Test navigation from header menu to new service page! 