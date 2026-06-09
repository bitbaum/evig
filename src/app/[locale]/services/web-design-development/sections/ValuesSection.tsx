import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

const VALUE_KEYS = [
  'openSource',
  'decentralization',
  'privacyFirst',
  'ownYourData',
  'ownYourCode',
  'maxAutomation',
  'userExperience',
  'developerExperience',
] as const

export async function ValuesSection() {
  const t = await getTranslations('services.webDesign.values')
  const tEye = await getTranslations('common.eyebrows')

  return (
    <section className="ui-public-band py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="ui-public-eyebrow">{tEye('principles')}</div>
          <Heading level={2} className="ui-public-display-lg mt-4">{t('title')}</Heading>
          <p
            className="ui-public-section-lede mt-6 mx-auto"
            dangerouslySetInnerHTML={{ __html: t.raw('subtitle') as string }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VALUE_KEYS.map((key, index) => (
            <article key={key} className="ui-public-card">
              <div className="ui-public-card-label font-mono tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </div>
              <Heading level={3} className="ui-public-card-title">{t(`${key}.title`)}</Heading>
              <p className="ui-public-card-body">{t(`${key}.description`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
