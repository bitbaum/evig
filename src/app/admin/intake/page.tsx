import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PackageCheck } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import IntakeClient from './IntakeClient'

export const metadata: Metadata = {
  title: 'Geräte-Eingang',
  description: 'Alle erfassten Geräte: Status, Checkliste und Publikation.',
}

// The pipeline of ALL captured devices (list + detail/checklist). Capturing
// itself happens on /admin/erfassung — no mode toggle here anymore; this
// page is where devices are FOUND, not where they are created.
export default async function IntakePage() {
  const t = await getTranslations('admin.intake')
  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={PackageCheck}
      iconColor="blue"
    >
      <IntakeClient />
    </AdminPageWrapper>
  )
}
