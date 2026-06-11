import { getTranslations } from 'next-intl/server'
import { ApplicationsExperience, type ApplicationsMessages } from './ApplicationsExperience'
import { ogFor } from '../og-images'

/**
 * Applications — the cinematic spectrum surface of the Monitor-Upcycling
 * mini-site. Server component handles i18n + metadata only; the full
 * experience lives in <ApplicationsExperience> (client) so the sticky
 * scene index and intersection-tracked progress have the state they need.
 */

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.applications') as ApplicationsMessages
  return {
    title: m.meta.title,
    description: m.meta.description,
    ...ogFor('applications', m.meta),
  }
}

export default async function UpcyclingApplicationsPage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.applications') as ApplicationsMessages
  return <ApplicationsExperience messages={m} />
}
