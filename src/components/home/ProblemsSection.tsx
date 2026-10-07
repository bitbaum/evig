import { getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Section } from '@/components/layout/Section';
import { Link } from '@/i18n/navigation';
import { PROBLEM_SCALES, PROBLEMS_CTA } from '@/config/problems-we-solve';

/**
 * "Was es löst" — concrete problems, for one person and for everyone, each
 * answered with what evig does about it today and the page where you do it.
 * Structure: config/problems-we-solve.ts. Strings: `problems.*` in messages.
 */
export async function ProblemsSection() {
  const t = await getTranslations('problems');

  return (
    <Section density="spacious" contained={false} aria-labelledby="problems-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Eyebrow as="div">{t('eyebrow')}</Eyebrow>
          <h2 id="problems-heading" className="ui-public-display-lg mt-4">
            {t('heading')}
          </h2>
          <p className="ui-public-section-lede mt-6">{t('subtitle')}</p>
        </div>

        {PROBLEM_SCALES.map((scale) => (
          <div key={scale.id} className="mt-16">
            <h3 className="ui-public-card-title">{t(`scales.${scale.id}.title` as never)}</h3>
            <p className="ui-public-meta mt-2">{t(`scales.${scale.id}.subtitle` as never)}</p>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scale.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} className="flex">
                    <Link href={item.href} className="ui-public-card group w-full">
                      <Icon className="h-6 w-6 text-action" aria-hidden />
                      <p className="ui-public-card-title mt-4">
                        {t(`items.${item.id}.problem` as never)}
                      </p>
                      <p className="ui-public-card-body">
                        <span className="ui-public-prose-strong">{t('solutionLabel')} </span>
                        {t(`items.${item.id}.solution` as never)}
                      </p>
                      <span className="ui-public-card-meta inline-flex items-center gap-1 group-hover:text-text-primary transition-colors">
                        {t(`items.${item.id}.cta` as never)} →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mt-16 border-t border-subtle pt-10">
          <p className="ui-public-card-title">{t('cta.heading')}</p>
          <p className="ui-public-section-lede mt-3">{t('cta.body')}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={PROBLEMS_CTA.primary} className="ui-public-cta">
              {t('cta.primary')}
            </Link>
            <Link href={PROBLEMS_CTA.secondary} className="ui-public-cta-ghost">
              {t('cta.secondary')}
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
