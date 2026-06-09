import { getTranslations } from 'next-intl/server'
import { GuideBody, type GuideData } from './GuideBody'

/**
 * Lenovo L2251pwd guide — server-side metadata + i18n loading only.
 * All rendering lives in <GuideBody> (client) so the lightbox, scroll
 * tracking, and tap-to-play hero have the state they need.
 */

type WithMeta = GuideData & { meta: { title: string; description: string } }

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.lenovo_l2251pwd') as WithMeta
  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: { title: m.meta.title, description: m.meta.description, type: 'article' },
  }
}

export default async function LenovoL2251pwdGuidePage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.lenovo_l2251pwd') as WithMeta
  return <GuideBody data={m} />
}
