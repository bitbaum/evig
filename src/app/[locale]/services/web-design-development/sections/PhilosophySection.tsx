import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

const RATING_KEYS = ['openSource', 'decentralization', 'privacy', 'dataOwnership', 'codeOwnership', 'automation', 'ux', 'dx'] as const
const RATING_COLORS = ['bg-primary-500', 'bg-primary-400', 'bg-info-500', 'bg-secondary-500', 'bg-warning-500', 'bg-error-500', 'bg-info-700', 'bg-neutral-400']

export async function PhilosophySection() {
  const t = await getTranslations('services.webDesign.philosophy')

  const freedomRatings = RATING_KEYS.map((key, i) => ({
    label: t(`ratings.${key}.label`),
    color: RATING_COLORS[i],
    desc: t(`ratings.${key}.desc`),
  }))

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Heading level={2} className="mb-6">{t('title')}</Heading>
            <p className="text-lg text-neutral-600 mb-4"
              dangerouslySetInnerHTML={{ __html: t.raw('intro') as string }}
            />
            <p className="text-base text-neutral-500">
              {t('automation')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Heading level={3} className="mb-6 text-neutral-800">{t('effortTitle')}</Heading>
              <div className="space-y-6 text-neutral-600">
                <div className="border-l-4 border-primary-500 pl-4">
                  <p className="font-semibold text-primary-800 mb-2">{t('freedomPrinciple.label')}</p>
                  <p dangerouslySetInnerHTML={{ __html: t.raw('freedomPrinciple.text') as string }} />
                </div>

                <div className="border-l-4 border-primary-400 pl-4">
                  <p className="font-semibold text-primary-800 mb-2">{t('automationLiberation.label')}</p>
                  <p>{t('automationLiberation.text')}</p>
                </div>

                <div className="border-l-4 border-info-500 pl-4">
                  <p className="font-semibold text-info-800 mb-2">{t('choiceNotCoercion.label')}</p>
                  <p>{t('choiceNotCoercion.text')}</p>
                </div>

                <p className="italic text-neutral-500 text-sm mt-6">
                  &ldquo;{t('quote')}&rdquo;
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-800 dark:to-neutral-900 rounded-xl p-8">
              <Heading level={4} className="mb-4 text-neutral-800">{t('ratingTitle')}</Heading>
              <p className="text-neutral-600 mb-4">
                {t('ratingIntro')}
              </p>
              <div className="space-y-3">
                {freedomRatings.map((item, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center space-x-3 mb-1">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm font-medium text-neutral-700">{item.label}</span>
                      <div className="flex-1 bg-neutral-200 rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{width: '95%'}}></div>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 ml-6 mb-2">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-white rounded-lg border border-primary-200">
                <p className="text-sm text-primary-800 font-semibold mb-1">{t('commitment.label')}</p>
                <p className="text-xs text-primary-700">
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
