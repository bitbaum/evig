import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import Heading from '@/components/ui/Heading'
import {
  DIVISION_PAGES,
  DIVISION_STATUS_STYLE,
  getDivisionPage,
  type Division,
  type DivisionPageId,
} from '@/config/divisions'

/**
 * Shared metadata for a division page. The brand half of the title comes from
 * the config wordmark (which composes ORG.name), so no message file ever holds
 * the org's name — only the translatable half after the dash.
 */
export async function divisionMetadata(locale: string, id: DivisionPageId): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'divisions' })
  const title = `${getDivisionPage(id).wordmark} — ${t(`pages.${id}.meta.title` as never)}`
  const description = t(`pages.${id}.meta.description` as never)

  return { title: { absolute: title }, description, openGraph: { title, description, type: 'website' } }
}

/**
 * One shape for every evig division page that owns a page of its own.
 *
 * Hero → thesis → numbered strands → honesty boundary → closing CTA. The order
 * is the argument: what we claim, why we claim it, what we are actually doing,
 * and — before the CTA, never after it — what we are explicitly NOT claiming.
 *
 * A further division page adds a DIVISION_PAGES entry plus its strings under
 * `divisions.pages.<id>`; it does not fork this component. Strand and boundary
 * ids come from config and are read by KEY (never by array index), so a locale
 * can never desync its way into an out-of-bounds render.
 */
export async function DivisionPage({
  locale,
  division,
}: {
  locale: string
  division: Division & { id: DivisionPageId }
}) {
  const { strands, boundaries, ctaHref } = DIVISION_PAGES[division.id]
  const t = await getTranslations({ locale, namespace: 'divisions' })

  // Page copy is namespaced by division id; next-intl's key union can't see the
  // dynamic segment, hence the cast (same pattern as /projects).
  const k = (suffix: string) => t(`pages.${division.id}.${suffix}` as never)

  return (
    <main className="min-h-screen">
      <PageHero
        theme={division.theme}
        icon={division.icon}
        size="display"
        title={k('hero.title')}
        subtitle={k('hero.lede')}
      >
        <span className="inline-flex flex-wrap items-center justify-center gap-3">
          <Eyebrow as="span">{division.wordmark}</Eyebrow>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIVISION_STATUS_STYLE[division.status]}`}
          >
            {t(`status.${division.status}` as never)}
          </span>
        </span>
      </PageHero>

      {/* ── Thesis — why this division exists at all ─────────────────── */}
      <Section density="spacious" contained={false}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Eyebrow as="div">{k('thesis.eyebrow')}</Eyebrow>
          <Heading level={2} className="ui-public-display-md mt-3">
            {k('thesis.title')}
          </Heading>
          <p className="ui-public-body-lg mt-6">{k('thesis.body')}</p>
        </div>
      </Section>

      {/* ── Strands — the actual work, numbered ──────────────────────── */}
      <Section density="spacious" tone="tinted" contained={false} className="border-y border-subtle">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Eyebrow as="div">{k('strands.eyebrow')}</Eyebrow>
          <Heading level={2} className="ui-public-display-lg mt-4">
            {k('strands.heading')}
          </Heading>

          <div className="mt-14 space-y-14">
            {strands.map((strand, index) => (
              <div key={strand} className="flex gap-6 sm:gap-8">
                <div className="ui-public-step-num">{String(index + 1).padStart(2, '0')}</div>
                <div>
                  <Heading level={3} className="ui-public-card-title">
                    {k(`strands.${strand}.title`)}
                  </Heading>
                  <p className="ui-public-prose-muted mt-3">{k(`strands.${strand}.body`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Honesty boundary — what this is NOT ──────────────────────── */}
      <Section density="spacious" contained={false}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Eyebrow as="div">{k('boundary.eyebrow')}</Eyebrow>
          <Heading level={2} className="ui-public-display-md mt-3">
            {k('boundary.heading')}
          </Heading>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {boundaries.map((boundary) => (
              <article key={boundary} className="ui-public-card">
                <Heading level={3} className="ui-public-card-title">
                  {k(`boundary.${boundary}.title`)}
                </Heading>
                <p className="ui-public-card-body">{k(`boundary.${boundary}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Closing CTA ──────────────────────────────────────────────── */}
      <Section density="spacious" contained={false} className="border-t border-subtle text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Heading level={2} className="ui-public-display-lg">
            {k('cta.heading')}
          </Heading>
          <p className="ui-public-section-lede mx-auto mt-6">{k('cta.body')}</p>
          <div className="mt-10">
            <Link href={ctaHref} className="ui-public-cta-lg">
              {k('cta.button')}
            </Link>
          </div>
        </div>
      </Section>
    </main>
  )
}
