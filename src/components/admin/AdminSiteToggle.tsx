'use client'

import { Link } from '@/i18n/navigation'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Globe, ChevronRight } from 'lucide-react'
import { ROUTES } from '@/config/routes'

interface AdminSiteToggleProps {
  /** User's name for display */
  userName?: string | null
  /** User's email for display */
  userEmail: string
  /** Whether the user is staff */
  isStaff: boolean
  /** Compact mode for mobile/small spaces */
  compact?: boolean
  /** Custom class name */
  className?: string
}

/**
 * Toggle button for switching between Admin and Public Site views.
 *
 * Shows:
 * - "Go to Admin" when on public pages (for staff only)
 * - "View Site" when in admin area
 *
 * DRY: Single component for all admin/site navigation
 * SSOT: Path detection logic in one place
 */
export function AdminSiteToggle({
  isStaff,
  compact = false,
  className = '',
}: AdminSiteToggleProps) {
  const pathname = usePathname()
  const isInAdmin = pathname?.startsWith('/admin')

  // Non-staff users don't see this toggle
  if (!isStaff) return null

  if (isInAdmin) {
    // Show "View Site" button when in admin
    return (
      <Link
        href="/"
        className={`
          inline-flex items-center gap-2
          px-4 py-2 rounded-lg
          bg-primary-600 text-white
          hover:bg-primary-700
          transition-colors
          font-medium text-sm
          ${className}
        `}
      >
        <Globe className="w-4 h-4" />
        {!compact && <span>Website anzeigen</span>}
        <ChevronRight className="w-4 h-4" />
      </Link>
    )
  }

  // Show "Go to Admin" button when on public pages
  return (
    <Link
      href={ROUTES.admin.dashboard}
      className={`
        inline-flex items-center gap-2
        px-4 py-2 rounded-lg
        bg-neutral-800 text-white
        hover:bg-neutral-900
        transition-colors
        font-medium text-sm
        ${className}
      `}
    >
      <LayoutDashboard className="w-4 h-4" />
      {!compact && <span>Admin</span>}
    </Link>
  )
}

/**
 * Floating admin toggle button
 *
 * Shows a fixed position button in the corner for easy access
 * to switch between admin and public views.
 */
export function FloatingAdminToggle({
  isStaff,
}: {
  isStaff: boolean
}) {
  const pathname = usePathname()
  const isInAdmin = pathname?.startsWith('/admin')

  // Don't show in admin area (has its own navigation)
  // Only show for staff on public pages
  if (!isStaff || isInAdmin) return null

  return (
    <Link
      href={ROUTES.admin.dashboard}
      className="
        fixed bottom-6 right-6 z-50
        flex items-center gap-2
        px-4 py-3 rounded-full
        bg-neutral-900 text-white
        shadow-lg hover:shadow-xl
        hover:bg-neutral-800
        transition-all
        font-medium
      "
      title="Admin-Bereich öffnen"
    >
      <LayoutDashboard className="w-5 h-5" />
      <span className="hidden sm:inline">Admin</span>
    </Link>
  )
}
