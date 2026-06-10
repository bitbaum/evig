import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { eq } from 'drizzle-orm'
import { Clock } from 'lucide-react'
import { db } from '@/db'
import { teamProfiles } from '@/db/schema'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { requireSection } from '@/lib/admin/guards'
import { TimecardsClient } from './TimecardsClient'

export const metadata: Metadata = {
  title: 'Zeitkarten',
  description: 'Arbeitszeiten erfassen und genehmigen.',
}

export default async function TimecardsPage() {
  const session = await requireSection('timecards')
  const t = await getTranslations('admin.timecards')

  const [profile] = await db
    .select({ workingHours: teamProfiles.workingHours })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, session.user.id))
    .limit(1)

  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={Clock}
      iconColor="blue"
    >
      <TimecardsClient
        workingHours={profile?.workingHours ?? null}
        userName={session.user.name || session.user.email || 'Teammitglied'}
      />
    </AdminPageWrapper>
  )
}
