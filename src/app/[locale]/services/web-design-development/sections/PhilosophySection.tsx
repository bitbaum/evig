import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

const RATING_KEYS = ['openSource', 'decentralization', 'privacy', 'dataOwnership', 'codeOwnership', 'automation', 'ux', 'dx'] as const

export async function PhilosophySection() {
  const t = await getTranslations('services.webDesign.philosophy')

  const freedomRatings = RATING_KEYS.map((key) => ({
    label: t(`ratings.${key}.label`),
    desc: t(`ratings.${key}.desc`),
  }))

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-surface-base">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Heading level={2} className="mb-6">{t('title')}</Heading>
            <p className="text-lg text-text-secondary mb-4"
              dangerouslySetInnerHTML={{ __html: t.raw('intro') as string }}
            />
            <p className="text-base text-text-tertiary">
              {t('automation')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Heading level={3} className="mb-6 text-text-primary">{t('effortTitle')}</Heading>
              <div className="space-y-6 text-text-secondary">
                <div className="border-l-4 border-action pl-4">
                  <p className="font-semibold text-action mb-2">{t('freedomPrinciple.label')}</p>
                  <p dangerouslySetInnerHTML={{ __html: t.raw('freedomPrinciple.text') as string }} />
                </div>

                <div className="border-l-4 border-action pl-4">
                  <p className="font-semibold text-action mb-2">{t('automationLiberation.label')}</p>
                  <p>{t('automationLiberation.text')}</p>
                </div>

                <div className="border-l-4 border-action pl-4">
                  <p className="font-semibold text-action mb-2">{t('choiceNotCoercion.label')}</p>
                  <p>{t('choiceNotCoercion.text')}</p>
                </div>

                <p className="italic text-text-tertiary text-sm mt-6">
                  &ldquo;{t('quote')}&rdquo;
                </p>
              </div>
            </div>

            <div className="bg-surface-raised rounded-xl p-8 border">
              <Heading level={4} className="mb-4 text-text-primary">{t('ratingTitle')}</Heading>
              <p className="text-text-secondary mb-4">
                {t('ratingIntro')}
              </p>
              <ul className="space-y-3">
                {freedomRatings.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-action" aria-hidden="true"></span>
                    <div>
                      <span className="text-sm font-medium text-text-secondary">{item.label}</span>
                      <p className="text-xs text-text-tertiary">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-surface-base rounded-lg border border-strong">
                <p className="text-sm text-action font-semibold mb-1">{t('commitment.label')}</p>
                <p className="text-xs text-action">
                  {t('commitment.text')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
