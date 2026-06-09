import { getTranslations } from 'next-intl/server'
import { Github, BookOpen, Globe, Wrench, ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { MonitorLampPlaceholder } from '../MonitorLampPlaceholder'

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
    pillars: { title: string; body: string }[]
  }
  guides: {
    title: string
    intro: string
    openCta: string
    items: GuideItem[]
    empty: string
    moreComing: { title: string; body: string; cta: string }
  }
  source: {
    title: string
    body: string
    repoCta: string
    repoUrl: string
    licenseLabel: string
  }
  contribute: {
    title: string
    body: string
    items: string[]
    cta: string
  }
}

const PILLAR_ICONS = [BookOpen, Globe, Wrench]

export async function generateMetadata() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.buildYourOwn') as PageMessages
  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: { title: m.meta.title, description: m.meta.description, type: 'website' },
  }
}

export default async function UpcyclingBuildYourOwnPage() {
  const t = await getTranslations('projects')
  const m = t.raw('upcycling.buildYourOwn') as PageMessages

  return (
    <article className="bg-canvas">
      <header className="border-b border-subtle bg-surface-base">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 sm:pb-14">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <div className="ui-public-eyebrow">{m.eyebrow}</div>
              <h1 className="ui-public-display-lg mt-3">{m.title}</h1>
              <p className="ui-public-section-lede mt-4">{m.intro}</p>

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
                  href="/projects/upcycling/gallery"
                  className="ui-public-cta-ghost inline-flex items-center gap-2"
                >
                  {m.guides.openCta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-subtle">
              <MonitorLampPlaceholder variant="cool" seed={7} className="h-full w-full" />
            </div>
          </div>
        </div>
      </header>

      {/* Manifesto — the philosophical core. The body line is set as a
          pull-quote at section width so it carries the weight of a stance;
          the three pillars below are numbered, full-width rows (not small
          cards) so each one reads as a beat in the argument. */}
      <section className="border-t border-subtle bg-surface-raised">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="ui-public-eyebrow">{m.philosophy.title}</div>
          <p className="mt-6 max-w-3xl text-2xl font-medium leading-snug tracking-tight text-text-primary sm:text-3xl md:text-4xl">
            {m.philosophy.body}
          </p>

          <ol className="mt-14 space-y-10 sm:space-y-12">
            {m.philosophy.pillars.map((pillar, i) => {
              const Icon = PILLAR_ICONS[i] ?? BookOpen
              return (
                <li
                  key={i}
                  className="grid gap-4 border-t border-subtle pt-8 sm:grid-cols-[auto_auto_1fr] sm:items-start sm:gap-6"
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-4xl font-light leading-none tabular-nums text-text-tertiary sm:text-5xl"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-action-muted/15">
                    <Icon className="h-5 w-5 text-action" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary sm:text-xl">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
                      {pillar.body}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section className="border-t border-subtle bg-surface-base">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="ui-public-display-md">{m.guides.title}</h2>
          <p className="ui-public-section-lede mt-4 max-w-3xl">{m.guides.intro}</p>

          {m.guides.items.length === 0 ? (
            <p className="mt-10 text-sm text-text-tertiary">{m.guides.empty}</p>
          ) : (
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {m.guides.items.map((g) => (
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
              {m.guides.items.length === 1 && m.guides.moreComing && (
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
