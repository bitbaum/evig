import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { HelpCircle } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import ITHilfeAdminClient from './ITHilfeAdminClient'

export const metadata: Metadata = {
  title: 'IT-Hilfe',
  description: 'Hilfsanfragen und Techniker verwalten.',
}

export default async function ITHilfePage() {
  const t = await getTranslations('admin.it-hilfe')
  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={HelpCircle}
      iconColor="blue"
    >
      <ITHilfeAdminClient />
    </AdminPageWrapper>
  )
}
