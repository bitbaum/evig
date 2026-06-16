import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { auth } from '@/auth'
import { isSuperAdmin } from '@/lib/permissions'
import { getAllDashboardCards } from '@/config/dashboard'
import AppShell from '@/components/layout/AppShell'
import ConditionalMainLayout from '@/components/layout/ConditionalMainLayout'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()
  const locale = await getLocale()
  const session = await auth()

  const navItems = session?.user
    ? getAllDashboardCards({
        role: session.user.role,
        isStaff: session.user.isStaff,
        isSuperAdmin: isSuperAdmin(session.user.email ?? ''),
        communityRoles: [],
      })
    : []

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <AppShell>
        <ConditionalMainLayout leanChrome>
          <DashboardNav items={navItems} />
          {children}
        </ConditionalMainLayout>
      </AppShell>
    </NextIntlClientProvider>
  )
}
