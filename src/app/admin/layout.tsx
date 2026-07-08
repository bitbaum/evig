/**
 * Admin Layout - Server Component
 *
 * Handles authentication and authorization for the admin area.
 * Uses the simplified permission system.
 */

import type { Metadata } from 'next'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import deMessages from '../../../messages/de.json'
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

  // The admin area is German-only. SSOT: THIS is the single place that decides
  // the admin locale — we pin it to German and pass the German messages so the
  // cookie/URL locale can never leak in and half-translate the nav (e.g. a
  // stale ja cookie rendering the sidebar in Japanese).
  // Admin is forced to German by the i18n resolver, so read the visitor's real
  // language preference from the cookie to decide whether to show the notice.
  const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value
  const visitorLocale = hasLocale(routing.locales, cookieLocale) ? cookieLocale : 'de'
  // If the visitor came in on a non-DE locale (e.g. /ja/marketplace → click
  // "Admin-Bereich"), surface a notice IN THEIR LANGUAGE so the jump to German
  // isn't disorienting.
  const localeNotice =
    visitorLocale === 'de'
      ? null
      : await (async () => {
          const t = await getTranslations({ locale: visitorLocale, namespace: 'admin.localeFallback' })
          return t('notice')
        })()

  return (
    <NextIntlClientProvider locale="de" messages={deMessages}>
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
