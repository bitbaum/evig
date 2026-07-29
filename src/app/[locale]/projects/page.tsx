// SSR only — lucide-react in server component scope can cause React-null in
// certain Turbopack SSG bundles (same guard as /space, /transparenz/kennzahlen).
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { FolderGit2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { IconBadge } from '@/components/ui/IconBadge'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'
import { ROUTES } from '@/config/routes'
import { EVIG_PROJECTS, PROJECT_STATUS_STYLE } from '@/config/evig-projects'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projects' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return { title: { absolute: title }, description, openGraph: { title, description, type: 'website' } }
}

export default async function ProjectsPage() {
  const t = await getTranslations('projects')

  return (
    <main className="min-h-screen">
      <PageHero theme="about" icon={FolderGit2} title={t('hero.title')} subtitle={t('hero.subtitle')} />

      <Section density="default" contained={false}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {EVIG_PROJECTS.map((project) => (
              <Link
                key={project.slug}
                href={ROUTES.public.project(project.slug)}
                className="ui-public-card group flex flex-col"
              >
                <div className="flex items-center justify-between gap-3">
                  <IconBadge icon={project.icon} theme="about" size="md" />
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${PROJECT_STATUS_STYLE[project.status]}`}
                  >
                    {t(`status.${project.status}`)}
                  </span>
                </div>
                <Heading level={3} className="ui-public-card-title mt-5">
                  {project.name}
                </Heading>
                <p className="ui-public-card-body flex-1">
                  {t(`items.${project.slug}.tagline` as never)}
                </p>
                <span className="ui-public-card-meta mt-4 inline-flex items-center gap-1 group-hover:text-text-primary transition-colors">
                  {t('index.more')} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Section>
    </main>
  )
}
