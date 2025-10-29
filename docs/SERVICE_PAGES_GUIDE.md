# Service Pages Guide

## Two Ways to Create Service Pages

RevampIT supports both custom-designed service pages AND CMS-managed pages. You can choose based on your needs for each service.

---

## Option 1: Custom Designed Pages (Recommended for Important Services)

### When to Use:
- Services that need unique designs, animations, or interactive elements
- Flagship services like "Build Your Computer" or "Web Design & Development"
- When you want complete creative control over layout and UX

### How to Create:
1. Create a new folder: `/src/app/services/your-service-name/`
2. Add `page.tsx` with your custom React components
3. Use any Tailwind classes, lucide-react icons, animations, etc.

### Example Structure:
```
/src/app/services/
  ├── build-your-computer/
  │   ├── page.tsx          ← Custom designed page
  │   └── layout.tsx        ← Optional custom layout
  ├── web-design-development/
  │   ├── page.tsx          ← Custom designed page
  │   └── layout.tsx
```

### Benefits:
✅ **Full design freedom** - Any layout, animations, interactivity
✅ **Optimized UX** - Design specifically for that service's needs
✅ **Better conversions** - Custom CTAs and user flows
✅ **Stand out** - Unique presentation for important services

---

## Option 2: CMS-Managed Pages (Good for Simple Services)

### When to Use:
- Simple services that just need text content
- Services that change frequently
- When you want non-technical staff to edit content
- Testing new service offerings

### How to Create:
1. Create a markdown file: `/content/services/your-service.md`
2. Add frontmatter metadata (title, description, features, etc.)
3. Write content in markdown
4. It automatically uses the generic template

### Example Markdown:
```markdown
---
title: Hardware Repair
slug: hardware-repair
description: Professional hardware repair services for all devices
category: Hardware
features:
  - Component-level repair
  - Data recovery
  - Quick turnaround
pricing: Starting at CHF 50
---

## Our Repair Services

We offer comprehensive hardware repair...
```

### Benefits:
✅ **Quick to create** - Just write markdown
✅ **Easy to edit** - Edit via TinaCMS or directly in files
✅ **Consistent design** - Uses proven template
✅ **Fallback ready** - Works even if CMS is down

---

## Routing Priority

Next.js automatically prioritizes specific folders over dynamic routes:

```
Priority 1: /services/build-your-computer/page.tsx     (Custom)
Priority 2: /services/web-design-development/page.tsx  (Custom)
Priority 3: /services/[service]/page.tsx                (Generic CMS template)
```

This means:
- If a custom page exists → Uses custom design
- If no custom page exists → Falls back to CMS template
- **You can mix and match!**

---

## Current Services Status

### Custom Designed Pages:
- ✅ `/services/build-your-computer` - Interactive build tool with AI recommendations
- ✅ `/services/web-design-development` - Tech stack showcase, portfolio
- ✅ `/services/enterprise-ai-solutions` - Custom AI solution page
- ✅ `/services/iot-solutions` - IoT showcase
- ✅ `/services/open-source-solutions` - Open source tech display
- ✅ `/services/cloud-infrastructure` - Cloud services page
- ✅ `/services/linux-open-source` - Linux solutions
- ✅ `/services/server-management` - Server management page

### CMS Template Pages:
- `/services/computer-repair-upgrades` - Generic template
- `/services/data-recovery-transfer` - Generic template
- `/services/hardware-recycling` - Generic template
- `/services/hardware-repair` - Generic template

---

## Best Practice Recommendations

### For New Services:

1. **Start with CMS** - Create markdown file, test demand
2. **Monitor performance** - See which services get traffic
3. **Upgrade popular ones** - Create custom design for high-traffic services
4. **Keep it simple** - Don't over-design services that don't need it

### Design Philosophy:

- **Custom pages** = Your "hero" services, the ones you want to stand out
- **CMS pages** = Supporting services, informational pages
- **Mix strategically** = Not everything needs a custom design

---

## Migration Path

### From CMS → Custom:
1. Keep the markdown file (for SEO metadata, fallback)
2. Create custom `page.tsx` in new folder
3. Custom page takes priority automatically
4. CMS file becomes backup/reference

### From Custom → CMS:
1. Extract content to markdown file
2. Delete custom folder
3. Falls back to CMS template automatically

---

## Technical Details

### Fallback System:
The generic `ServicePageContent.tsx` component:
1. Tries TinaCMS first (if running)
2. Falls back to filesystem API (`/api/services/[slug]`)
3. Loads from markdown files directly
4. **Always works, even if CMS is down**

### Data Loading:
```typescript
// Custom pages: Load data however you want
export default function CustomPage() {
  // Hardcoded, API calls, database, anything!
}

// CMS pages: Automatic data loading
// Content from /content/services/*.md
```

---

## Summary

**You have complete design flexibility!**

- Want a custom design? → Create a folder with `page.tsx`
- Want simple content management? → Use markdown + CMS
- Want both? → Mix and match as needed

The system is designed to give you the best of both worlds.
