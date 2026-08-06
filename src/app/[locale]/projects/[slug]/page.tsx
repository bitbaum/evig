// SSR only — lucide-react in server component scope can cause React-null in
// certain Turbopack SSG bundles (same guard as /space, /transparenz/kennzahlen).
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, ExternalLink, GitBranch, Scale } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'
import { ROUTES } from '@/config/routes'
import { getEvigProject, getEvigProjectSlugs, PROJECT_STATUS_STYLE } from '@/config/evig-projects'

interface ProjectDetailProps {
  params: Promise<{ locale: string; slug: string }>
}

export function generateStaticParams() {
  return getEvigProjectSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: ProjectDetailProps): Promise<Metadata> {
  const { locale, slug } = await params
  const project = getEvigProject(slug)
  if (!project) return {}
  const t = await getTranslations({ locale, namespace: 'projects' })
  const title = `${project.name} — ${ORG.name}`
  const description = t(`items.${slug}.tagline` as never)
  return { title: { absolute: title }, description, openGraph: { title, description, type: 'website' } }
}

export default async function ProjectDetailPage({ params }: ProjectDetailProps) {
  const { slug } = await params
  const project = getEvigProject(slug)
  if (!project) notFound()

  const t = await getTranslations('projects')

  return (
    <main className="min-h-screen">
      <PageHero theme="about" icon={project.icon} title={project.name} subtitle={t(`items.${slug}.tagline` as never)} />

      <Section density="default" contained={false}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href={ROUTES.public.projects}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-action hover:text-action mb-10"
          >
            <ArrowLeft className="h-4 w-4" /> {t('detail.back')}
          </Link>

          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${PROJECT_STATUS_STYLE[project.status]}`}
          >
            {t(`status.${project.status}`)}
          </span>

          <p className="ui-public-section-lede mt-6">{t(`items.${slug}.description` as never)}</p>

          {(project.repoUrl || project.liveUrl || project.license) && (
            <div className="mt-12 border-t border-subtle pt-8">
              <Heading level={2} className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4">
                {t('detail.resources')}
              </Heading>
              <div className="flex flex-col gap-3">
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-action hover:underline underline-offset-2">
                    <ExternalLink className="h-4 w-4" /> {t('detail.visit')}
                  </a>
                )}
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-action hover:underline underline-offset-2">
                    <GitBranch className="h-4 w-4" /> {t('detail.source')}
                  </a>
                )}
                {project.license && (
                  <span className="inline-flex items-center gap-2 text-text-secondary">
                    <Scale className="h-4 w-4 text-text-tertiary" /> {t('detail.license', { license: project.license })}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Section>
    </main>
  )
}
