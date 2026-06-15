import { getTranslations } from 'next-intl/server'
import { DesktopTocRail } from './DesktopTocRail'
import { BusinessPlanHero, BusinessPlanMobileToc } from './components/HeroAndToc'
import {
  Alternativen,
  Belege,
  CE,
  ExecutiveSummary,
  Foerderung,
  Kunden,
  Lieferanten,
  Mitmachen,
  Partner,
  Produkt,
  Risiken,
  Status,
  Wirtschaftlichkeit,
  Wissenschaft,
} from './components/sections'
import type { BusinessPlan } from './types'
import { ogFor } from '../og-images'

/**
 * /projects/upcycling/businessplan — source-grounded evidence page.
 * Content SSOT: messages/<lc>.json → projects.upcycling.businessPlan
 * Shape/invariant parity: npm run i18n:businessplan
 */

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.businessPlan') as BusinessPlan
  return {
    title: m.meta.title,
    description: m.meta.description,
    ...ogFor('businessplan', m.meta),
  }
}

export default async function UpcyclingBusinessPlanPage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.businessPlan') as BusinessPlan
  const citeMap = new Map(m.belege.citations.map((c, i) => [c.key, i + 1]))
  const sectionProps = { citeMap, ui: m.ui }

  return (
    <article className="bg-canvas">
      <BusinessPlanHero hero={m.hero} documentMeta={m.documentMeta} />
      <BusinessPlanMobileToc nav={m.nav} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
          <DesktopTocRail nav={m.nav} />
          <main className="min-w-0">
            <ExecutiveSummary section={m.executiveSummary} />
            <Status section={m.status} {...sectionProps} />
            <Produkt section={m.produkt} ui={m.ui} />
            <Lieferanten section={m.lieferanten} {...sectionProps} />
            <Alternativen section={m.alternativen} {...sectionProps} />
            <Kunden section={m.kunden} {...sectionProps} />
            <Wirtschaftlichkeit section={m.wirtschaftlichkeit} {...sectionProps} />
            <Wissenschaft section={m.wissenschaft} {...sectionProps} />
            <CE section={m.ce} {...sectionProps} />
            <Partner section={m.partner} {...sectionProps} />
            <Risiken section={m.risiken} {...sectionProps} />
            <Foerderung section={m.foerderung} {...sectionProps} />
            <Mitmachen section={m.mitmachen} />
            <Belege section={m.belege} />
          </main>
        </div>
      </div>
    </article>
  )
}
