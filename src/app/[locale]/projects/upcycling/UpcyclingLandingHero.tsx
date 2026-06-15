import Image from 'next/image'
import { Lightbulb } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { UPCYCLING_ASSETS } from '@/config/upcycling-assets'
import { UPCYCLING_ROUTES } from '@/config/upcycling-routes'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

interface UpcyclingLandingHeroProps {
  title: string
  description: string
  cta1: string
  cta2: string
  photoAlt: string
}

/** Landing hero with real workshop photography (Lenovo retrofit, May 2026). */
export function UpcyclingLandingHero({
  title,
  description,
  cta1,
  cta2,
  photoAlt,
}: UpcyclingLandingHeroProps) {
  return (
    <section className="border-b border-subtle bg-surface-base">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="min-w-0 text-center lg:text-left">
            <div className="inline-flex items-center justify-center lg:justify-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-action-muted/15">
                <Lightbulb className="h-6 w-6 text-action" aria-hidden="true" />
              </span>
            </div>
            <h1 className="ui-public-hero-title mt-6">{title}</h1>
            <p className="ui-public-hero-lede mx-auto mt-6 max-w-2xl lg:mx-0">{description}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href={UPCYCLING_ROUTES.applications}
                className={cn(
                  designPrimitive.buttonBase,
                  designPrimitive.buttonSize.lg,
                  designPrimitive.button.primary,
                )}
              >
                {cta1}
              </Link>
              <Link
                href="/get-involved"
                className={cn(
                  designPrimitive.buttonBase,
                  designPrimitive.buttonSize.lg,
                  designPrimitive.button.outline,
                )}
              >
                {cta2}
              </Link>
            </div>
          </div>
          <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-subtle bg-surface-raised">
            <Image
              src={UPCYCLING_ASSETS.gallery.lenovoPoster}
              alt={photoAlt}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </figure>
        </div>
      </div>
    </section>
  )
}
