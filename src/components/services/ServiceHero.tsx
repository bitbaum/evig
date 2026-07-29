/**
 * ServiceHero Component
 * 
 * Reusable hero section for service pages.
 * Follows existing design patterns from the site.
 */

import type { ServiceHero as ServiceHeroType } from '@/lib/services'
import Heading from '@/components/ui/Heading'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Section } from '@/components/layout/Section'

interface ServiceHeroProps {
  hero: ServiceHeroType
}

export default function ServiceHero({ hero }: ServiceHeroProps) {
  return (
    <Section density="default" tone="surface" className="border-b border-subtle">
      <div className="max-w-3xl">
          <Eyebrow as="div">Service</Eyebrow>
          <Heading level={1} className="mt-3 text-3xl font-semibold leading-tight text-text-primary sm:text-4xl md:text-4xl lg:text-4xl">
            {hero.title}
          </Heading>
          <Heading level={2} className="mt-4 text-lg font-medium leading-relaxed text-text-secondary sm:text-xl">
            {hero.subtitle}
          </Heading>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">{hero.description}</p>
      </div>
    </Section>
  )
}
