import { Metadata } from 'next'
import { Ticket } from 'lucide-react'
import { requireSection } from '@/lib/admin/guards'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { db } from '@/db'
import { promoCodes } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { PromoCodesClient } from './PromoCodesClient'

export const metadata: Metadata = {
  title: 'Aktionscodes',
  description: 'Rabatt- und Gutscheincodes ausstellen und verwalten.',
}

export default async function PromoCodesPage() {
  await requireSection('promo-codes')
  const codes = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt))

  return (
    <AdminPageWrapper
      title="Aktionscodes"
      description="Rabatt- und Gutscheincodes ausstellen und verwalten"
      icon={Ticket}
      iconColor="green"
    >
      <PromoCodesClient initialCodes={codes} />
    </AdminPageWrapper>
  )
}
