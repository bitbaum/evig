/**
 * ServiceHero Component
 * 
 * Reusable hero section for service pages.
 * Follows existing design patterns from the site.
 */

import type { ServiceHero as ServiceHeroType } from '@/lib/services'

interface ServiceHeroProps {
  hero: ServiceHeroType
}

export default function ServiceHero({ hero }: ServiceHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">{hero.title}</h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 md:mb-8 text-primary-200">{hero.subtitle}</h2>
          <p className="text-base sm:text-lg md:text-xl text-primary-100">{hero.description}</p>
        </div>
      </div>
    </section>
  )
}

