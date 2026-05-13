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
import { getMessages } from 'next-intl/server'
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

  return (
    <NextIntlClientProvider messages={messages}>
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
