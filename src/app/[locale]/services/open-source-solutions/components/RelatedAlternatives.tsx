import { type OSSAlternative, getAlternativesByCategory } from '@/config/open-source-registry'
import { AlternativeCard } from './AlternativeCard'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

interface RelatedAlternativesProps {
  current: OSSAlternative
  locale: string
}

export async function RelatedAlternatives({ current, locale }: RelatedAlternativesProps) {
  const t = await getTranslations({ locale, namespace: 'services.openSourceSolutions' })
  const related = getAlternativesByCategory(current.categoryId)
    .filter(a => a.id !== current.id)
    .slice(0, 3)

  if (related.length === 0) return null

  return (
    <section className="mt-12">
      <Heading level={2} className="text-xl font-bold text-neutral-900 mb-6">
        {t('detail.relatedAlternatives')}
      </Heading>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {related.map(alt => (
          <AlternativeCard key={alt.id} alternative={alt} />
        ))}
      </div>
    </section>
  )
}
