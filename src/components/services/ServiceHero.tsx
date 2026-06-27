/**
 * ServiceHero Component
 * 
 * Reusable hero section for service pages.
 * Follows existing design patterns from the site.
 */

import type { ServiceHero as ServiceHeroType } from '@/lib/services'
import Heading from '@/components/ui/Heading'

interface ServiceHeroProps {
  hero: ServiceHeroType
}

export default function ServiceHero({ hero }: ServiceHeroProps) {
  return (
    <section className="border-b border-subtle bg-surface-base py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="ui-public-eyebrow">Service</div>
          <Heading level={1} className="mt-3 text-3xl font-semibold leading-tight text-text-primary sm:text-4xl md:text-4xl lg:text-4xl">
            {hero.title}
          </Heading>
          <Heading level={2} className="mt-4 text-lg font-medium leading-relaxed text-text-secondary sm:text-xl">
            {hero.subtitle}
          </Heading>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">{hero.description}</p>
        </div>
      </div>
    </section>
  )
}
