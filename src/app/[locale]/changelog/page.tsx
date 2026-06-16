import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ChangelogHero } from '@/components/changelog/ChangelogHero'
import { ChangelogLatestBar } from '@/components/changelog/ChangelogLatestBar'
import { ChangelogMobileNav } from '@/components/changelog/ChangelogMobileNav'
import { ChangelogRelease } from '@/components/changelog/ChangelogRelease'
import { ChangelogVersionRail } from '@/components/changelog/ChangelogVersionRail'
import { ORG } from '@/config/org'
import {
  buildChangelogNav,
  formatChangelogDateShort,
  getChangelogReleases,
  getLatestRelease,
} from '@/lib/changelog'

interface ChangelogPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ChangelogPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'changelog' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function ChangelogPage({ params }: ChangelogPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'changelog' })
  const releases = getChangelogReleases()
  const latest = getLatestRelease()
  const navItems = buildChangelogNav(locale)
  const latestDateShort = formatChangelogDateShort(latest.date, locale)

  return (
    <article className="bg-canvas">
      <ChangelogHero
        eyebrow={t('hero.eyebrow')}
        badge={t('hero.badge')}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      <ChangelogLatestBar
        latestLabel={t('latest.label')}
        version={latest.version}
        dateIso={latest.date}
        dateShort={latestDateShort}
        commandLabel={t('command.label')}
        command={t('command.text')}
      />

      <ChangelogMobileNav label={t('nav.label')} items={navItems} />

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
          <ChangelogVersionRail label={t('nav.label')} items={navItems} />
          <main className="min-w-0 max-w-3xl">
            {releases.map((release) => (
              <ChangelogRelease key={release.id} release={release} locale={locale} />
            ))}
          </main>
        </div>
      </div>
    </article>
  )
}
