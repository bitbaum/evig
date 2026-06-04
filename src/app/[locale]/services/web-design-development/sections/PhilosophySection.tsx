import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

const RATING_KEYS = ['openSource', 'decentralization', 'privacy', 'dataOwnership', 'codeOwnership', 'automation', 'ux', 'dx'] as const
const RATING_COLORS = ['bg-action', 'bg-action', 'bg-info-500', 'bg-secondary-500', 'bg-warning-500', 'bg-error-500', 'bg-info-700', 'bg-surface-overlay']

export async function PhilosophySection() {
  const t = await getTranslations('services.webDesign.philosophy')

  const freedomRatings = RATING_KEYS.map((key, i) => ({
    label: t(`ratings.${key}.label`),
    color: RATING_COLORS[i],
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

                <div className="border-l-4 border-info-500 pl-4">
                  <p className="font-semibold text-info-800 mb-2">{t('choiceNotCoercion.label')}</p>
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
              <div className="space-y-3">
                {freedomRatings.map((item, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center space-x-3 mb-1">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm font-medium text-text-secondary">{item.label}</span>
                      <div className="flex-1 bg-surface-overlay rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{width: '95%'}}></div>
                      </div>
                    </div>
                    <p className="text-xs text-text-tertiary ml-6 mb-2">{item.desc}</p>
                  </div>
                ))}
              </div>
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
