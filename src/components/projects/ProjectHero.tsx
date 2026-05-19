import { Layers } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import type { ProjectHero as ProjectHeroType } from './types'

interface ProjectHeroProps {
  hero: ProjectHeroType
}

export function ProjectHero({ hero }: ProjectHeroProps) {
  const Icon = hero.icon ?? Layers

  return (
    <PageHero
      theme="projects"
      icon={Icon}
      title={hero.title}
      subtitle={hero.description}
    >
      {hero.ctas && hero.ctas.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {hero.ctas.map((cta, i) => (
            <Link
              key={i}
              href={cta.href}
              className={cn(
                designPrimitive.buttonBase,
                designPrimitive.buttonSize.lg,
                cta.variant === 'outline'
                  ? designPrimitive.button.outline
                  : designPrimitive.button.primary
              )}
            >
              {cta.text}
            </Link>
          ))}
        </div>
      )}
    </PageHero>
  )
}
