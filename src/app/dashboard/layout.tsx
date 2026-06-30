import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { auth } from '@/auth'
import { isSuperAdmin } from '@/lib/permissions'
import { getAllDashboardCards } from '@/config/dashboard'
import ConditionalMainLayout from '@/components/layout/ConditionalMainLayout'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { DashboardMobileNav } from '@/components/dashboard/DashboardMobileNav'

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
      {/* Session/Theme/Csrf providers come from the root layout (src/app/layout.tsx),
          seeded with the server session. We must NOT re-wrap in a second, unseeded
          <Providers> here — that nested SessionProvider starts unauthenticated and
          makes client pages (e.g. messages) false-redirect logged-in staff to /admin
          (React #418 hydration mismatch). /admin works precisely because it never
          double-wrapped. */}
      <ConditionalMainLayout leanChrome>
        <DashboardNav items={navItems} />
        {/* Mobile/tablet (<lg): bottom tab bar + "Mehr" sheet. The padding keeps
            content clear of the fixed bar. */}
        <div className="pb-16 lg:pb-0">{children}</div>
        <DashboardMobileNav items={navItems} />
      </ConditionalMainLayout>
    </NextIntlClientProvider>
  )
}
