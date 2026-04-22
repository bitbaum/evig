import AppShell from '@/components/layout/AppShell'
import ConditionalMainLayout from '@/components/layout/ConditionalMainLayout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ConditionalMainLayout>
        {children}
      </ConditionalMainLayout>
    </AppShell>
  )
}
