import 'server-only'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { canAccessSection, toStaffUser, type AdminSection } from '@/lib/permissions'

/**
 * Server-side guard for admin section pages.
 *
 * Resolves the session, converts it to a StaffUser, checks
 * `canAccessSection`, and redirects to the admin shell with a
 * `?error=no_<section>_access` query when access is denied.
 *
 * Why this exists:
 *   The admin layout already enforces auth + is_staff. But individual
 *   section pages still need to check the per-section permission key
 *   for non-super-admin staff. Before this helper, every section page
 *   had ~10 lines of identical boilerplate:
 *
 *     const session = await auth()
 *     if (!session?.user) redirect('/auth/login?callbackUrl=/admin/X')
 *     const user = { email: session.user.email, is_staff: ..., ... }
 *     if (!canAccessSection(user, 'X')) redirect('/admin?error=no_X_access')
 *
 *   23 admin pages repeated this. Now: `const session = await requireSection('X')`.
 *
 * The function returns the *session* (not just the user), because most
 * callers also need `session.user.id` / `session.user.email` downstream.
 * Returning the resolved session removes the duplicate auth() call.
 *
 * Login redirect: when there is no session at all, this still sends to
 * /auth/login (with the per-section callbackUrl), but in practice the
 * outer admin layout already caught that case — so this branch is the
 * defensive "if someone calls requireSection from outside /admin/*" path.
 */
export async function requireSection(section: AdminSection) {
  const session = await auth()
  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/admin/${section}`)
  }
  const staffUser = toStaffUser({
    email: session.user.email,
    isStaff: session.user.isStaff,
    staffPermissions: session.user.staffPermissions,
    isSuperAdmin: session.user.isSuperAdmin,
  })
  if (!canAccessSection(staffUser, section)) {
    redirect(`/admin?error=no_${section}_access`)
  }
  return session
}

/**
 * Any-of variant: a page accessible if the user can reach ANY one of
 * the listed sections. Used by /admin/analyse which is a dashboard
 * over both 'finanzen' and 'hirn'.
 *
 * The redirect parameter (when none match) uses a synthetic
 * `?error=no_<key>_access` key — the caller passes the URL slug.
 */
export async function requireAnySection(sections: AdminSection[], errorKey: string) {
  const session = await auth()
  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/admin/${errorKey}`)
  }
  const staffUser = toStaffUser({
    email: session.user.email,
    isStaff: session.user.isStaff,
    staffPermissions: session.user.staffPermissions,
    isSuperAdmin: session.user.isSuperAdmin,
  })
  if (!sections.some(section => canAccessSection(staffUser, section))) {
    redirect(`/admin?error=no_${errorKey}_access`)
  }
  return session
}
