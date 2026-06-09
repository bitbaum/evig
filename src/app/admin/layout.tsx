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
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { getAccessibleSections } from '@/lib/permissions'
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

  const messages = await getMessages()
  const locale = await getLocale()
  // Admin copy is German-only. If the visitor came in on a non-DE locale
  // (e.g. /ru/marketplace → click "Admin-Bereich"), surface a clear notice
  // in their language so the language jump isn't disorienting.
  const localeNotice =
    locale === 'de'
      ? null
      : await (async () => {
          const t = await getTranslations({ locale, namespace: 'admin.localeFallback' })
          return t('notice')
        })()

  return (
    <NextIntlClientProvider messages={messages}>
      {localeNotice && (
        <div
          role="note"
          className="bg-warning-50 dark:bg-warning-900/20 border-b border-warning-200 dark:border-warning-800 px-4 py-2 text-center text-xs text-warning-900 dark:text-warning-100"
        >
          {localeNotice}
        </div>
      )}
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
