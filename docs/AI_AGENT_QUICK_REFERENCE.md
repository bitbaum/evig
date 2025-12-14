# AI Agent Quick Reference - Medusa Integration

**Read First:** `docs/REVAMPIT_SHOP_STATUS.md` (full context)

---

## 🚦 Current State

**✅ Complete:**
- Docker services (PostgreSQL:5435, Redis:6380, Meilisearch:7700)
- Next.js integration with Medusa SDK
- Shop UI: homepage, product pages, cart
- Beautiful, responsive design with dark mode

**⏳ In Progress:**
- Medusa backend installation (`medusa-backend/` directory)

**❌ Not Started:**
- Payments (Stripe, PayPal, TWINT)
- Checkout flow
- Production deployment

---

## 📂 Key Files

### Read Before Modifying
```
docs/REVAMPIT_SHOP_STATUS.md      # Full project context (this session)
docs/REVAMPIT_SHOP_SETUP.md       # Architecture & deployment guide
README_MEDUSA.md                  # User quick start
MEDUSA_DEMO.md                    # Stakeholder demo script
```

### Medusa Integration
```
src/lib/medusa/
├── client.ts                     # SDK client setup
├── hooks.ts                      # React Query hooks (read these!)
└── providers.tsx                 # QueryClient wrapper

src/components/shop/
└── ProductCard.tsx               # Example component pattern

src/app/shop/medusa/
├── page.tsx                      # Shop homepage
├── cart/page.tsx                 # Cart
└── products/[handle]/page.tsx    # Product detail
```

### Configuration
```
docker-compose.medusa.yml         # Services config
.env.local                        # Environment (MEDUSA_URL)
next.config.js                    # API proxy + images
package.json                      # Scripts
```

---

## 🔧 Quick Commands

```bash
# Services
npm run medusa:up                 # Start Docker services
npm run medusa:down               # Stop services
npm run medusa:logs               # View logs
docker compose -f docker-compose.medusa.yml ps  # Check status

# Development
npm run dev                       # Start Next.js
open http://localhost:3000/shop/medusa  # Open shop

# Medusa Backend (after installation)
cd medusa-backend
npx medusa develop                # Start Medusa
open http://localhost:9000/app    # Open admin

# Database
docker exec -it revampit_medusa_db psql -U medusa -d medusa_db

# Health Checks
curl http://localhost:9000/health                # Medusa API
curl http://localhost:9000/store/products        # Products endpoint
```

---

## 🎯 Common Tasks

### 1. Add New API Hook

**File:** `src/lib/medusa/hooks.ts`

```typescript
export function useNewFeature(id: string) {
  return useQuery({
    queryKey: ["feature", id],
    queryFn: async () => {
      const response = await medusaClient.store.feature.retrieve(id);
      return response.feature;
    },
    enabled: !!id,
  });
}
```

### 2. Create New Shop Page

```bash
mkdir -p src/app/shop/medusa/new-page
```

**File:** `src/app/shop/medusa/new-page/page.tsx`

```typescript
"use client";

import { useNewFeature } from "@/lib/medusa/hooks";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewPage() {
  const { data, isLoading, error } = useNewFeature("id");

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/shop/medusa" className="inline-flex items-center...">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Shop
        </Link>
        {/* Your content */}
      </div>
    </div>
  );
}
```

### 3. Add New Component

**File:** `src/components/shop/NewComponent.tsx`

```typescript
"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface Props {
  // Define props
}

export function NewComponent({ }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="..."
    >
      {/* Component content */}
    </motion.div>
  );
}
```

### 4. Test Medusa API

```bash
# Get products
curl http://localhost:9000/store/products

# Get product by ID
curl http://localhost:9000/store/products/{product_id}

# Get collections
curl http://localhost:9000/store/collections

# Health check
curl http://localhost:9000/health
```

---

## 🎨 Design Patterns

### Component Structure
```typescript
"use client";  // Only for client components

import { /* hooks */ } from "@/lib/medusa/hooks";
import { /* icons */ } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Page() {
  // 1. Hooks
  const { data, isLoading, error } = useSomething();

  // 2. State
  const [state, setState] = useState();

  // 3. Loading state
  if (isLoading) return <LoadingSkeleton />;

  // 4. Error state
  if (error) return <ErrorMessage error={error} />;

  // 5. Empty state
  if (!data || data.length === 0) return <EmptyState />;

  // 6. Success render
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Content */}
    </div>
  );
}
```

### Styling Guidelines
```typescript
// Container
className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"

// Card
className="rounded-lg border border-gray-200 dark:border-gray-800 p-6"

// Button Primary
className="rounded-lg bg-primary-600 px-6 py-3 text-white hover:bg-primary-700"

// Button Secondary
className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3"

// Text
className="text-gray-900 dark:text-white"  // Heading
className="text-gray-600 dark:text-gray-400"  // Body

// Responsive Grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
```

---

## 🐛 Troubleshooting

### Services Not Running
```bash
docker compose -f docker-compose.medusa.yml ps
# If not running:
npm run medusa:up
```

### Can't Connect to Medusa
```bash
curl http://localhost:9000/health
# If fails:
# 1. Check services: docker compose -f docker-compose.medusa.yml ps
# 2. Check logs: npm run medusa:logs
# 3. Restart: npm run medusa:down && npm run medusa:up
```

### Products Not Showing
```bash
# Check API directly
curl http://localhost:9000/store/products

# If empty:
# 1. Open admin: http://localhost:9000/app
# 2. Add products
# 3. Ensure products are "published" not "draft"
```

### Images Not Loading
```typescript
// Verify next.config.js has:
images: {
  remotePatterns: [
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '9000',
      pathname: '/**',
    },
  ],
}
```

### TypeScript Errors
```bash
# Install types
npm install --save-dev @types/node

# Restart TypeScript server in IDE
```

---

## 🔐 Environment Variables

### Required
```bash
NEXT_PUBLIC_MEDUSA_URL=http://localhost:9000  # Must start with NEXT_PUBLIC_
MEDUSA_API_URL=http://localhost:9000          # Server-side only
```

### Optional
```bash
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxx     # For Medusa Cloud
```

---

## 📊 Project Status Check

### Before Starting Work
```bash
# 1. Check Docker services
docker compose -f docker-compose.medusa.yml ps

# 2. Check Medusa backend
curl http://localhost:9000/health

# 3. Check database
docker exec -it revampit_medusa_db psql -U medusa -d medusa_db -c "SELECT NOW();"

# 4. Check Next.js
npm run dev
```

### After Making Changes
```bash
# 1. Test locally
open http://localhost:3000/shop/medusa

# 2. Check console for errors
# (Browser DevTools)

# 3. Verify API calls
# (Network tab in DevTools)

# 4. Test responsive design
# (Device toolbar in DevTools)
```

---

## 🚀 Next Steps (Priority Order)

1. **Complete Backend Setup** (High)
   - Check if `medusa-backend/` exists
   - Run migrations: `npx medusa migrations run`
   - Create admin: `npx medusa user -e admin@revampit.ch -p admin123`
   - Start: `npx medusa develop`

2. **Add Sample Products** (High)
   - Open http://localhost:9000/app
   - Create 3-5 products with images
   - Publish products

3. **Test User Flow** (High)
   - Browse products
   - Add to cart
   - Update quantities
   - Remove items

4. **Add Collections** (Medium)
   - Create in admin
   - Update category buttons on shop page

5. **Integrate Search** (Low)
   - Install Meilisearch plugin
   - Add search UI component

---

## 📚 Important Links

- **Full Context:** `docs/REVAMPIT_SHOP_STATUS.md`
- **Medusa Docs:** https://docs.medusajs.com
- **JS SDK Docs:** https://docs.medusajs.com/references/js-sdk
- **React Query:** https://tanstack.com/query/latest
- **Medusa Discord:** https://discord.gg/medusajs

---

## ⚠️ Important Notes

1. **Always use "use client"** for components with hooks
2. **Handle all states:** loading, error, empty, success
3. **Follow existing patterns** in `src/lib/medusa/hooks.ts`
4. **Test responsive design** on mobile/tablet/desktop
5. **Use Dark mode classes** (`dark:` prefix)
6. **Invalidate React Query** after mutations
7. **Store cart ID** in localStorage
8. **Use Tailwind utilities** (don't write custom CSS)

---

**Last Updated:** 2025-12-02
**Next Review:** After backend setup complete
