import AppShell from '@/components/layout/AppShell'
import ConditionalMainLayout from '@/components/layout/ConditionalMainLayout'
import { CookieBanner } from '@/components/ui/CookieBanner'

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ConditionalMainLayout>
        {children}
      </ConditionalMainLayout>
      <CookieBanner />
    </AppShell>
  )
}
