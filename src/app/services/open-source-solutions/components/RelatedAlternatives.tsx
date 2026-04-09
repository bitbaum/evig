import { type OSSAlternative, getAlternativesByCategory } from '@/config/open-source-registry'
import { AlternativeCard } from './AlternativeCard'
import Heading from '@/components/ui/Heading'

interface RelatedAlternativesProps {
  current: OSSAlternative
}

export function RelatedAlternatives({ current }: RelatedAlternativesProps) {
  const related = getAlternativesByCategory(current.categoryId)
    .filter(a => a.id !== current.id)
    .slice(0, 3)

  if (related.length === 0) return null

  return (
    <section className="mt-12">
      <Heading level={2} className="text-xl font-bold text-gray-900 mb-6">
        Weitere Alternativen in dieser Kategorie
      </Heading>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {related.map(alt => (
          <AlternativeCard key={alt.id} alternative={alt} />
        ))}
      </div>
    </section>
  )
}
