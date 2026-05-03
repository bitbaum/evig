import { Code2 } from 'lucide-react'
import { ORG } from '@/config/org'
import { PageHero } from '@/components/layout/PageHero'
import { RegistrySearch } from './components/RegistrySearch'
import {
  getAllAlternatives,
  getAllCategories,
  getAllProprietaryApps,
} from '@/config/open-source-registry'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.openSourceSolutions' })

  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    keywords: t.raw('meta.keywords') as string[],
    openGraph: { title, description, type: 'website' },
  }
}

export default async function OpenSourceSolutionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.openSourceSolutions' })

  const alternatives = getAllAlternatives()
  const categories = getAllCategories()
  const proprietaryApps = getAllProprietaryApps()

  return (
    <main>
      <PageHero
        theme="services"
        icon={Code2}
        title={t('meta.title')}
        subtitle={t('meta.description')}
      />

      <section className="py-12 sm:py-16 md:py-20 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-10 text-center">
            <div>
              <p className="text-3xl font-bold text-neutral-900">{alternatives.length}</p>
              <p className="text-sm text-neutral-500">{t('stats.alternativesLabel')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900">{proprietaryApps.length}</p>
              <p className="text-sm text-neutral-500">{t('stats.proprietaryLabel')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900">{categories.length}</p>
              <p className="text-sm text-neutral-500">{t('stats.categoriesLabel')}</p>
            </div>
          </div>

          <RegistrySearch alternatives={alternatives} categories={categories} />
        </div>
      </section>
    </main>
  )
}
