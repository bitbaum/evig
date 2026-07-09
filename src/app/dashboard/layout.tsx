import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { auth } from '@/auth'
import { isSuperAdmin } from '@/lib/permissions'
import ConditionalMainLayout from '@/components/layout/ConditionalMainLayout'
import { DashboardMobileNav } from '@/components/dashboard/DashboardMobileNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()
  const locale = await getLocale()
  const session = await auth()

  // Pass only serializable primitives across the server→client boundary. The
  // dashboard cards carry lucide icon *components* (functions), which RSC can't
  // serialize — so the client nav computes its own cards from these flags.
  const navUser = {
    role: session?.user?.role ?? null,
    isStaff: session?.user?.isStaff ?? false,
    isSuperAdmin: session?.user ? isSuperAdmin(session.user.email ?? '') : false,
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {/* Session/Theme/Csrf providers come from the root layout (src/app/layout.tsx),
          seeded with the server session. We must NOT re-wrap in a second, unseeded
          <Providers> here — that nested SessionProvider starts unauthenticated and
          makes client pages (e.g. messages) false-redirect logged-in staff to /admin
          (React #418 hydration mismatch). /admin works precisely because it never
          double-wrapped. */}
      <ConditionalMainLayout leanChrome>
        {/* Desktop dashboard nav lives in the account dropdown + the home-page
            sectioned index — no redundant horizontal strip. Mobile (<lg) keeps a
            thumb-reachable bottom tab bar + "Mehr" sheet; the padding clears it. */}
        <div className="pb-16 lg:pb-0">{children}</div>
        <DashboardMobileNav {...navUser} />
      </ConditionalMainLayout>
    </NextIntlClientProvider>
  )
}
