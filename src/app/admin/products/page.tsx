import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ProductManagement from '@/components/admin/ProductManagement'
import Link from 'next/link'
import { buttonClass } from '@/components/ui/button-class'
import { Package } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Produktverwaltung',
  description: 'Verwalte die RevampIT Shop-Produkte.',
}

export default async function ProductsAdminPage() {
  const t = await getTranslations('admin.products')
  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={Package}
      iconColor="indigo"
      backButton={{ href: ROUTES.admin.dashboard, label: 'Zurück zum Dashboard' }}
      actions={
        <Link href={ROUTES.admin.erfassung} className={buttonClass({ variant: 'primary', size: 'sm' })}>
          Neues Produkt
        </Link>
      }
    >
      <ProductManagement />
    </AdminPageWrapper>
  )
}