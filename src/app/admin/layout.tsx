/**
 * Admin Layout - Server Component
 *
 * Handles authentication and authorization for the admin area.
 * Uses the simplified permission system.
 */

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { auth } from '@/auth'
import { getAccessibleSections, isStaffEmail } from '@/lib/permissions'
import { AdminLayoutClient } from './AdminLayoutClient'
import { ORG } from '@/config/org'

export const metadata: Metadata = {
  title: {
    default: `${ORG.name} Admin`,
    template: `%s | ${ORG.name} Admin`,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const headerList = await headers()
  const currentPath = headerList.get('x-current-path') || '/admin'

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`)
  }

  if (!session.user.isStaff) {
    // A staff-email user who simply hasn't verified yet is staff — they just
    // haven't unlocked admin. Send them to complete verification (resends the
    // code + shows the entry step) rather than to a misleading "not staff" page.
    if (isStaffEmail(session.user.email ?? '') && !session.user.emailVerified) {
      redirect(`/auth/register?email=${encodeURIComponent(session.user.email!)}`)
    }
    redirect('/?error=not_staff')
  }

  const accessibleSections = getAccessibleSections({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  })

  if (accessibleSections.length === 0) {
    redirect('/?error=no_admin_access')
  }

  // Admin follows the user's language preference. SSOT: the i18n request
  // resolver (src/i18n/request.ts) decides the locale from the NEXT_LOCALE
  // cookie (written by the LocaleSwitcher, which is also in the admin top bar)
  // and deep-merges the locale's messages over German. We just hand the
  // resolved locale + messages to the client provider — no second decision here.
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AdminLayoutClient
        user={{
          name: session.user.name ?? null,
          email: session.user.email,
          isStaff: session.user.isStaff,
          staffPermissions: session.user.staffPermissions,
        }}
        accessibleSections={accessibleSections}
      >
        {children}
      </AdminLayoutClient>
    </NextIntlClientProvider>
  )
}
