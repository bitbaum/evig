import { type OSSAlternative, getAlternativesByCategory } from '@/config/open-source-registry'
import { AlternativeCard } from './AlternativeCard'

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
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Weitere Alternativen in dieser Kategorie
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {related.map(alt => (
          <AlternativeCard key={alt.id} alternative={alt} />
        ))}
      </div>
    </section>
  )
}
