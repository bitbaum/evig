import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PackageCheck } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import IntakeClient from './IntakeClient'

export const metadata: Metadata = {
  title: 'Geräte-Eingang',
  description: 'Alle erfassten Geräte: Status, Checkliste und Publikation.',
}

// One operational home: capture, pipeline, device workbench and publish.
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
