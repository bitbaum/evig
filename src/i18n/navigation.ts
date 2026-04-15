import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Typed navigation helpers — use these instead of next/link and next/navigation
// in locale-aware pages so locale prefix is handled automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
