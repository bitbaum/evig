import { getTranslations } from 'next-intl/server'
import { GuideBody, type GuideData, type GuideStructure } from '../GuideBody'

/**
 * HP Z23n guide — DRAFT, not yet published.
 *
 * Transcribed from the workshop wiki. Intentionally NOT in UPCYCLING_GUIDE_SLUGS,
 * so it never appears in the landing / build-your-own / gallery guide lists —
 * reachable only by direct URL for review.
 *
 * Publish blockers (remove this notice + add to UPCYCLING_GUIDE_SLUGS once done):
 *  1. Bridging schematic is unverified — the wiki marks it "TODO", and this
 *     model bridges different pins than the L2251pwd voltage divider. Until
 *     verified, STRUCTURE.schematicAtStep stays null (no diagram shown).
 *  2. No result/step photos yet — every step ships with images: [].
 *  3. No OG image — generateMetadata omits openGraph until one exists.
 */

type WithMeta = GuideData & { meta: { title: string; description: string } }

const STRUCTURE: GuideStructure = {
  stageSteps: { disassemble: [1], bridge: [2], lcd: [3], assemble: [4] },
  schematicAtStep: null,
  hero: {},
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.hp_z23n') as WithMeta
  return { title: m.meta.title, description: m.meta.description }
}

export default async function HpZ23nGuidePage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.hp_z23n') as WithMeta
  return <GuideBody data={m} structure={STRUCTURE} />
}
