import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Github, ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { UPCYCLING_ASSETS } from '@/config/upcycling-assets'
import { UPCYCLING_ROUTES, UPCYCLING_WIKI_URL } from '@/config/upcycling-routes'
import { orderPublishedGuides } from '@/data/upcycling-guides'
import { UpcyclingPageHeader } from '../UpcyclingPageHeader'
import { ogFor } from '../og-images'

/**
 * Build-Your-Own — the open-source-hardware hub.
 *
 * This is the page that pays off the project's MIT-licensed-hardware
 * pitch. It lists every model guide we've published, links to the
 * source repo, and explicitly invites people anywhere in the world to
 * fork the work. When the mini-site spins out to its own domain, this
 * page becomes the homepage for the "DIY" lane (vs. the future shop
 * lane for buying a finished unit).
 */

type GuideItem = {
  slug: string
  model: string
  href: string
  summary: string
  difficulty: string
  duration: string
  author: string
}

type PageMessages = {
  meta: { title: string; description: string }
  eyebrow: string
  title: string
  intro: string
  philosophy: {
    title: string
    body: string
  }
  guides: {
    title: string
    intro: string
    openCta: string
    items: GuideItem[]
    empty: string
    moreComing: { title: string; body: string; cta: string }
  }
  artifacts: {
    eyebrow: string
    title: string
    intro: string
    standby: { alt: string; caption: string }
    mount: { alt: string; caption: string }
  }
  teaching: {
    eyebrow: string
    title: string
    body: string
    workshop: { alt: string; caption: string }
    kreativ: { alt: string; caption: string }
  }
  source: {
    title: string
    body: string
    repoCta: string
    repoUrl: string
    licenseLabel: string
    wikiTitle: string
    wikiBody: string
    wikiCta: string
  }
  contribute: {
    title: string
    body: string
    items: string[]
    cta: string
  }
}

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.buildYourOwn') as PageMessages
  return {
    title: m.meta.title,
    description: m.meta.description,
    ...ogFor('buildYourOwn', m.meta),
  }
}

export default async function UpcyclingBuildYourOwnPage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.buildYourOwn') as PageMessages
  const guides = orderPublishedGuides(m.guides.items)

  return (
    <article className="bg-canvas">
      <UpcyclingPageHeader
        eyebrow={m.eyebrow}
        title={m.title}
        intro={m.intro}
        belowIntro={
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={m.source.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-public-cta inline-flex items-center gap-2"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              {m.source.repoCta}
            </a>
            <Link
              href={UPCYCLING_ROUTES.gallery}
              className="ui-public-cta-ghost inline-flex items-center gap-2"
            >
              {m.guides.openCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        }
        media={
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-subtle">
            <Image
              src={UPCYCLING_ASSETS.lenovoGuide.stepFrameRemoved}
              alt=""
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        }
      />

      {/* Why open — the philosophical core in one paragraph. The audit
          flagged the previous treatment (pull-quote + 3 numbered pillars +
          icons) as manifesto-scale chrome for a project with 1 published
          guide. The body line still carries the stance, but the page no
          longer reads as a marketing landing: it reads as a hub that
          gets out of the way and lets the guides speak. */}
      <section className="border-t border-subtle bg-surface-raised">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="ui-public-eyebrow">{m.philosophy.title}</div>
          <p className="mt-5 text-xl font-medium leading-snug tracking-tight text-text-primary sm:text-2xl">
            {m.philosophy.body}
          </p>
        </div>
      </section>

      <section className="border-t border-subtle bg-surface-base">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="ui-public-display-md">{m.guides.title}</h2>
          <p className="ui-public-section-lede mt-4 max-w-3xl">{m.guides.intro}</p>

          {guides.length === 0 ? (
            <p className="mt-10 text-sm text-text-tertiary">{m.guides.empty}</p>
          ) : (
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {guides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={g.href}
                    className="group flex h-full flex-col rounded-lg border border-subtle bg-surface-raised p-6 transition-colors hover:border-default"
                  >
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                      <span>{g.duration}</span>
                      <span aria-hidden="true">·</span>
                      <span>{g.difficulty}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-text-primary">{g.model}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{g.summary}</p>
                    <div className="mt-auto pt-6 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                        {g.author}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-action group-hover:gap-2 transition-all">
                        {m.guides.openCta}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
              {guides.length === 1 && m.guides.moreComing && (
                <li>
                  <div className="flex h-full flex-col rounded-lg border border-dashed border-subtle bg-canvas p-6">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                      {m.guides.moreComing.title}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">{m.guides.moreComing.body}</p>
                    <Link
                      href="/contact"
                      className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-medium text-action hover:gap-2 transition-all"
                    >
                      {m.guides.moreComing.cta}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              )}
            </ul>
          )}
        </div>
      </section>

      {/* Engineering artifacts — the two open-hardware parts every retrofit
          needs, photographed/rendered from our own workshop (Juli 2026):
          the Spannungsteiler standby plug and the printable ceiling mount. */}
      <section className="border-t border-subtle bg-canvas">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="ui-public-eyebrow">{m.artifacts.eyebrow}</div>
          <h2 className="ui-public-display-md mt-3">{m.artifacts.title}</h2>
          <p className="ui-public-section-lede mt-4 max-w-3xl">{m.artifacts.intro}</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-lg border border-subtle bg-surface-base">
              <div className="relative aspect-[4/3]">
                <Image
                  src={UPCYCLING_ASSETS.installs.standbyDongle}
                  alt={m.artifacts.standby.alt}
                  fill
                  sizes="(min-width: 640px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="border-t border-subtle px-4 py-3 text-sm leading-relaxed text-text-secondary">
                {m.artifacts.standby.caption}
              </figcaption>
            </figure>

            <figure className="overflow-hidden rounded-lg border border-subtle bg-surface-base">
              <div className="relative aspect-[4/3]">
                <Image
                  src={UPCYCLING_ASSETS.installs.deckenhalterungCad}
                  alt={m.artifacts.mount.alt}
                  fill
                  sizes="(min-width: 640px) 45vw, 100vw"
                  className="object-contain p-4"
                />
              </div>
              <figcaption className="border-t border-subtle px-4 py-3 text-sm leading-relaxed text-text-secondary">
                {m.artifacts.mount.caption}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Teaching — the open guides in the classroom. HSLU Bachelor module
          «Local Loops — Circularity locally made»: 14 students designed and
          prototyped their own lamps from our retired monitors (Nextcloud:
          hslu.txt). Knowledge-sharing proof for the philosophy section above. */}
      <section className="border-t border-subtle bg-surface-base">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="ui-public-eyebrow">{m.teaching.eyebrow}</div>
          <h2 className="ui-public-display-md mt-3">{m.teaching.title}</h2>
          <p className="ui-public-section-lede mt-4 max-w-3xl">{m.teaching.body}</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-lg border border-subtle bg-surface-raised">
              <div className="relative aspect-[4/3]">
                <Image
                  src={UPCYCLING_ASSETS.installs.hsluWorkshop1}
                  alt={m.teaching.workshop.alt}
                  fill
                  sizes="(min-width: 640px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="border-t border-subtle px-4 py-3 text-sm leading-relaxed text-text-secondary">
                {m.teaching.workshop.caption}
              </figcaption>
            </figure>

            <figure className="overflow-hidden rounded-lg border border-subtle bg-surface-raised">
              <div className="relative aspect-[4/3]">
                <Image
                  src={UPCYCLING_ASSETS.installs.hsluKreativ1}
                  alt={m.teaching.kreativ.alt}
                  fill
                  sizes="(min-width: 640px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="border-t border-subtle px-4 py-3 text-sm leading-relaxed text-text-secondary">
                {m.teaching.kreativ.caption}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Source — terminal frame around the canonical git URL.
          The fake-prompt block sells the "this is real code, take it" feel
          without inventing new tokens: surface-raised + mono + a green
          prompt that re-uses --action. */}
      <section className="border-t border-subtle bg-surface-raised">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 md:items-start md:gap-16">
            <div>
              <h2 className="ui-public-display-md">{m.source.title}</h2>
              <p className="ui-public-section-lede mt-4">{m.source.body}</p>
              <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                {m.source.licenseLabel}
              </p>

              <div className="mt-6 overflow-hidden rounded-lg border border-default bg-surface-base">
                <div className="flex items-center gap-2 border-b border-subtle bg-surface-raised px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                  <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-border-default" />
                  <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-border-default" />
                  <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-border-default" />
                  <span className="ml-2">{m.source.repoUrl.replace(/^https?:\/\//, '').replace(/^[^/]+/, '~')}</span>
                </div>
                <a
                  href={m.source.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block px-4 py-4 font-mono text-sm leading-relaxed"
                >
                  <span className="select-none text-action" aria-hidden="true">$ </span>
                  <span className="text-text-primary">git clone </span>
                  <span className="text-text-secondary underline-offset-4 group-hover:underline">
                    {m.source.repoUrl}
                  </span>
                </a>
              </div>

              <a
                href={m.source.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-action hover:underline"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                {m.source.repoCta}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              {/* Public Umbau-Wiki — the project's open documentation platform
                  (Swico Abschlussbericht). URL from config (SSOT). */}
              <div className="mt-8 rounded-lg border border-subtle bg-surface-base p-5">
                <h3 className="text-base font-semibold text-text-primary">{m.source.wikiTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{m.source.wikiBody}</p>
                <a
                  href={UPCYCLING_WIKI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-action hover:underline"
                >
                  {m.source.wikiCta}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div>
              <h2 className="ui-public-display-md">{m.contribute.title}</h2>
              <p className="ui-public-section-lede mt-4">{m.contribute.body}</p>

              <ol className="mt-6 space-y-4">
                {m.contribute.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 border-t border-subtle pt-4">
                    <span
                      aria-hidden="true"
                      className="font-mono text-sm font-medium tabular-nums text-text-tertiary"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm leading-relaxed text-text-secondary">{item}</span>
                  </li>
                ))}
              </ol>

              <Link
                href="/contact"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-action hover:underline"
              >
                {m.contribute.cta}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}
