import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PackageCheck } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { ProduktAufnehmenModeToggle } from '@/components/admin/ProduktAufnehmenModeToggle'
import IntakeClient from './IntakeClient'

export const metadata: Metadata = {
  title: 'Geräte-Eingang',
  description: 'Geräte erfassen, prüfen und für den Verkauf freigeben.',
}

export default async function IntakePage() {
  const t = await getTranslations('admin.intake')
  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={PackageCheck}
      iconColor="blue"
    >
      <div className="mb-4">
        <ProduktAufnehmenModeToggle active="annahme" />
      </div>
      <IntakeClient />
    </AdminPageWrapper>
  )
}
