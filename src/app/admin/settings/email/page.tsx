import { Metadata } from 'next'
import { Mail } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { requireSection } from '@/lib/admin/guards'
import { EmailDiagnostics } from '@/components/admin/settings/EmailDiagnostics'

export const metadata: Metadata = {
  title: 'E-Mail-Diagnose',
  description: 'E-Mail-Anbieter, Verbindungstest und Test-Versand.',
}

export default async function EmailDiagnosticsPage() {
  await requireSection('settings')

  return (
    <AdminPageWrapper
      title="E-Mail-Diagnose"
      description="Aktiver Anbieter, Verbindungstest und Test-Versand — um Zustellprobleme zu finden."
      icon={Mail}
      iconColor="blue"
      backButton={{ href: '/admin/settings', label: 'Einstellungen' }}
    >
      <EmailDiagnostics />
    </AdminPageWrapper>
  )
}
