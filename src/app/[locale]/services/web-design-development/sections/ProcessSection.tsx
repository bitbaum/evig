import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

const STEP_NUMBERS = ['01', '02', '03', '04']
const STEP_KEYS = ['discovery', 'planning', 'development', 'launch'] as const

export async function ProcessSection() {
  const t = await getTranslations('services.webDesign.process')

  const processSteps = STEP_KEYS.map((key, i) => ({
    step: STEP_NUMBERS[i],
    title: t(`steps.${key}.title`),
    description: t(`steps.${key}.description`),
  }))

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Heading level={2} className="mb-6">{t('title')}</Heading>
          <p className="text-lg text-neutral-600">
            {t('subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {processSteps.map((phase, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {phase.step}
              </div>
              <Heading level={3} className="mb-3">{phase.title}</Heading>
              <p className="text-neutral-600">{phase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
