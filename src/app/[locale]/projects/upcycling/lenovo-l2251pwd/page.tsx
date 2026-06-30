import { getTranslations } from 'next-intl/server'
import { GuideBody, type GuideData, type GuideStructure } from '../GuideBody'
import { UPCYCLING_ASSETS } from '@/config/upcycling-assets'
import { ogFor } from '../og-images'

/**
 * Lenovo L2251pwd guide — server-side metadata + i18n loading only.
 * All rendering lives in <GuideBody> (client) so the lightbox, scroll
 * tracking, and tap-to-play hero have the state they need.
 */

type WithMeta = GuideData & { meta: { title: string; description: string } }

/** Language-independent shape of this guide (structure → not i18n). */
const STRUCTURE: GuideStructure = {
  stageSteps: { disassemble: [1, 2, 3], lcd: [4], bridge: [5] },
  schematicAtStep: 5,
  hero: {
    poster: UPCYCLING_ASSETS.lenovoGuide.heroPoster,
    video: UPCYCLING_ASSETS.lenovoGuide.heroVideo,
  },
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.lenovo_l2251pwd') as WithMeta
  return {
    title: m.meta.title,
    description: m.meta.description,
    ...ogFor('lenovoL2251pwd', m.meta, { type: 'article' }),
  }
}

export default async function LenovoL2251pwdGuidePage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.lenovo_l2251pwd') as WithMeta
  return <GuideBody data={m} structure={STRUCTURE} />
}
