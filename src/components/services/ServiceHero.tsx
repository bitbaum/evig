/**
 * ServiceHero Component
 * 
 * Reusable hero section for service pages.
 * Follows existing design patterns from the site.
 */

import { ServiceHero as ServiceHeroType } from '@/data/services'

interface ServiceHeroProps {
  hero: ServiceHeroType
}

export default function ServiceHero({ hero }: ServiceHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{hero.title}</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-primary-200">{hero.subtitle}</h2>
          <p className="text-xl text-primary-100">{hero.description}</p>
        </div>
      </div>
    </section>
  )
}

