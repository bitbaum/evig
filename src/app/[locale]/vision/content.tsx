import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ORG, ORG_ORIGIN } from '@/config/org'
import { ROUTES } from '@/config/routes'
import { EVIG_MARK } from '@/config/brand'
import type { ReactNode } from 'react'

/**
 * evig — the vision (manifesto).
 * Full-bleed dark brand surface; opts out of the standard chrome via
 * ConditionalMainLayout and renders its own header/footer. All colour comes
 * from the scoped `.theme-vision` tokens in globals.css — zero literal hex.
 */

// The mark geometry is the brand SSOT (src/config/brand.ts) — no divergence.
const { loopPath: LOOP, sparkPath: SPARK, loopTransform: TILT } = EVIG_MARK

function Mark({ className, width = EVIG_MARK.strokeWidth }: { className?: string; width?: number }) {
  return (
    <svg className={className} viewBox={EVIG_MARK.viewBox} fill="none" aria-hidden="true">
      <g transform={TILT}>
        <path d={LOOP} stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d={SPARK} fill="currentColor" />
    </svg>
  )
}

function HeroLoop({ label }: { label: string }) {
  return (
    <svg className="v-loop" viewBox={EVIG_MARK.viewBox} fill="none" role="img" aria-label={label}>
      <g transform={TILT}>
        <path className="v-draw" pathLength={100} d={LOOP} stroke="currentColor" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <path className="v-pulse" pathLength={100} d={LOOP} stroke="var(--text-primary)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d={SPARK} fill="currentColor" />
    </svg>
  )
}

export default async function VisionContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'vision' })

  // Rich-text tag handlers shared across paragraphs.
  const tags = {
    b: (c: ReactNode) => <strong>{c}</strong>,
    em: (c: ReactNode) => <em>{c}</em>,
    lime: (c: ReactNode) => <strong className="lime">{c}</strong>,
    // External link to the origin org (Revamp-IT). close.commercial overrides
    // this with its own internal contact Link via a later spread.
    a: (c: ReactNode) => (
      <a className="lime underline underline-offset-2" href={ORG_ORIGIN.url} target="_blank" rel="noreferrer">
        {c}
      </a>
    ),
  }

  return (
    <div className="theme-vision">
      {/* top bar */}
      <header className="v-header">
        <div className="v-bar">
          <Link href="/" className="v-brand" aria-label={ORG.name}>
            <Mark className="mk" />
            <span className="wm">{ORG.name}</span>
          </Link>
          <div className="v-status">
            {t('badge.region')}
            <br />
            {t('badge.legal')}
          </div>
        </div>
      </header>

      <main>
        <div className="v-wrap">
          {/* HERO */}
          <div className="v-hero">
            <HeroLoop label={t('hero.eyebrow')} />
            <span className="v-eyebrow">
              <span className="dot">&#9670;</span>&nbsp; {t('hero.eyebrow')}
            </span>
            <h1 className="v-h1">{t('hero.title')}</h1>
            <p className="v-lede">{t.rich('hero.lede', tags)}</p>
            <span className="v-tag">{t('hero.tag')}</span>
          </div>
        </div>

        <div className="v-rule" />

        {/* THESIS — the inequality that matters */}
        <section className="v-wrap v-section">
          <div className="v-col">
            <span className="v-eyebrow">{t('thesis.eyebrow')}</span>
            <h2 className="v-h2">{t('thesis.title')}</h2>
            <p className="v-after">{t.rich('thesis.p1', tags)}</p>
            <p>{t.rich('thesis.ai', tags)}</p>
            <p>{t.rich('thesis.robot', tags)}</p>
            <p className="v-pull">{t('thesis.pull')}</p>
            <p>{t.rich('thesis.p2', tags)}</p>
          </div>
        </section>

        <div className="v-rule" />

        {/* ORIGIN */}
        <section className="v-wrap v-section">
          <div className="v-col">
            <span className="v-eyebrow">{t('origin.eyebrow')}</span>
            <p className="v-leadq">{t('origin.quote')}</p>
            <p>{t.rich('origin.p1', tags)}</p>
            <p>{t.rich('origin.p2', tags)}</p>
          </div>
        </section>

        <div className="v-rule" />

        {/* DIFFERENCE */}
        <section className="v-wrap v-section">
          <div className="v-col">
            <span className="v-eyebrow">{t('diff.eyebrow')}</span>
            <h2 className="v-h2">{t('diff.title')}</h2>
            <p className="v-after">{t('diff.intro')}</p>
            <div className="v-promises">
              {(['p1', 'p2', 'p3'] as const).map((k) => (
                <div className="v-promise" key={k}>
                  <Mark className="glyph" />
                  <div>
                    <h3 className="v-h3">{t(`diff.${k}.title`)}</h3>
                    <p>{t.rich(`diff.${k}.body`, tags)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="v-rule" />

        {/* RESEARCH */}
        <section className="v-wrap v-section">
          <div className="v-col">
            <span className="v-eyebrow">{t('research.eyebrow')}</span>
            <h2 className="v-h2">{t('research.title')}</h2>
            <p className="v-after">{t('research.p1')}</p>
            <p className="v-pull">{t('research.pull')}</p>
            <p>{t.rich('research.p2', tags)}</p>
          </div>
        </section>

        <div className="v-rule" />

        {/* AFFORD */}
        <section className="v-wrap v-section">
          <div className="v-col">
            <span className="v-eyebrow">{t('afford.eyebrow')}</span>
            <h2 className="v-h2">{t('afford.title')}</h2>
            <p className="v-after">{t.rich('afford.intro', tags)}</p>
            <div className="v-ways">
              {(['w1', 'w2', 'w3'] as const).map((k) => (
                <div className="v-way" key={k}>
                  <span className="k">{t(`afford.${k}.k`)}</span>
                  <h3 className="v-h3">{t(`afford.${k}.title`)}</h3>
                  <p>{t(`afford.${k}.body`)}</p>
                </div>
              ))}
            </div>
            <p className="v-gap">{t.rich('afford.close', tags)}</p>
          </div>
        </section>

        <div className="v-rule" />

        {/* FUTURE */}
        <section className="v-wrap v-section">
          <div className="v-col">
            <span className="v-eyebrow">{t('future.eyebrow')}</span>
            <h2 className="v-h2">{t('future.title')}</h2>
            <p className="v-after">{t('future.p1')}</p>
            <p className="v-pull">{t('future.pull')}</p>
            <p>{t.rich('future.p2', tags)}</p>
          </div>
        </section>

        {/* CLOSE */}
        <section className="v-wrap v-close">
          <span className="v-eyebrow">{t('close.eyebrow')}</span>
          <h2 className="v-h2">{t('close.title')}</h2>
          <div className="v-doors">
            <Link className="v-door primary" href={ROUTES.public.partnerships}>
              <span className="k">{t('close.support.k')}</span>
              <h3 className="v-h3">{t('close.support.title')}</h3>
              <p>{t('close.support.body')}</p>
              <span className="arr">{t('close.support.cta')} &rarr;</span>
            </Link>
            <Link className="v-door ghost" href={ROUTES.public.getInvolved}>
              <span className="k">{t('close.build.k')}</span>
              <h3 className="v-h3">{t('close.build.title')}</h3>
              <p>{t('close.build.body')}</p>
              <span className="arr">{t('close.build.cta')} &rarr;</span>
            </Link>
          </div>
          <p className="v-commercial">
            {t.rich('close.commercial', {
              ...tags,
              a: (c: ReactNode) => <Link href={ROUTES.public.contact}>{c}</Link>,
            })}
          </p>
        </section>
      </main>

      <footer className="v-foot">
        <div className="v-wrap">
          <div className="fbar">
            <Mark className="mk" />
            <span className="wm">evig</span>
          </div>
          <p>{t.rich('footer.legal', tags)}</p>
        </div>
      </footer>
    </div>
  )
}
