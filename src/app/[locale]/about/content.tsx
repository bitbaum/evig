import { Eyebrow } from '@/components/ui/Eyebrow';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/layout/PageHero';
import { GeschichteSection } from '@/components/about';
import { Cpu, Wrench, Recycle, Quote, Leaf } from 'lucide-react';
import Heading from '@/components/ui/Heading';
import { getTranslations } from 'next-intl/server';
import { Section } from '@/components/layout/Section';

export default async function AboutContent() {
  const t = await getTranslations('about');
  const tEye = await getTranslations('common.eyebrows');

  return (
    <main className="min-h-screen">
      <PageHero theme="about" icon={Leaf} title={t('hero.title')} subtitle={t('hero.subtitle')} />

      {/* Mission Section - Redesigned */}
      <Section density="default" contained={false}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Eyebrow as="div">{t('mission.badge').toUpperCase()}</Eyebrow>
            <Heading level={2} className="ui-public-display-lg mt-4">
              {t('mission.title')}
            </Heading>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image Column */}
            <div className="relative">
              <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border">
                <Image
                  src="/images/logo/evig-brand-panel.webp"
                  alt={t('mission.imageAlt')}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>

            {/* Content Column */}
            <div className="space-y-6">
              {/* Quote Box */}
              <div className="bg-surface-raised border-l-4 border-action p-6 rounded-r-xl">
                <Quote className="h-8 w-8 text-action mb-3" />
                <p className="text-xl md:text-2xl font-medium text-text-primary italic">
                  &ldquo;{t('mission.quote')}&rdquo;
                </p>
              </div>

              <p className="text-lg text-text-secondary leading-relaxed">
                {t.rich('mission.paragraph1', {
                  strong: (chunks) => <strong className="text-text-primary">{chunks}</strong>,
                })}
              </p>

              <p className="text-lg text-text-secondary leading-relaxed">
                {t('mission.paragraph2')}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Impact Areas - Redesigned */}
      <Section density="default" contained={false}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Heading level={2} className="ui-public-display-lg mb-4">
              {t('impactAreas.title')}
            </Heading>
            <p className="ui-public-section-lede mx-auto">{t('impactAreas.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Card 1 - Access to intelligence */}
            <article className="ui-public-card group">
              <div className="w-14 h-14 bg-action-muted/15 rounded-xl flex items-center justify-center mb-6 group-hover:bg-action group-hover:scale-110 transition-all duration-300">
                <Cpu className="h-7 w-7 text-action group-hover:text-action-text transition-colors" />
              </div>
              <h3 className="ui-public-card-title">{t('impactAreas.hardware.title')}</h3>
              <p className="ui-public-card-body">{t('impactAreas.hardware.description')}</p>
            </article>

            {/* Card 2 - Accessible repair */}
            <article className="ui-public-card group">
              <div className="w-14 h-14 bg-action-muted/15 rounded-xl flex items-center justify-center mb-6 group-hover:bg-action group-hover:scale-110 transition-all duration-300">
                <Wrench className="h-7 w-7 text-action group-hover:text-action-text transition-colors" />
              </div>
              <h3 className="ui-public-card-title">{t('impactAreas.openSource.title')}</h3>
              <p className="ui-public-card-body">{t('impactAreas.openSource.description')}</p>
            </article>

            {/* Card 3 - Circular marketplace */}
            <article className="ui-public-card group">
              <div className="w-14 h-14 bg-action-muted/15 rounded-xl flex items-center justify-center mb-6 group-hover:bg-action group-hover:scale-110 transition-all duration-300">
                <Recycle className="h-7 w-7 text-action group-hover:text-action-text transition-colors" />
              </div>
              <h3 className="ui-public-card-title">{t('impactAreas.community.title')}</h3>
              <p className="ui-public-card-body">{t('impactAreas.community.description')}</p>
            </article>
          </div>
        </div>
      </Section>

      {/* Origin story — why evig exists. No track-record stats: evig is new
          and never shows numbers it hasn't genuinely earned (removed until real). */}
      <GeschichteSection />

      {/* Call to Action */}
      <Section density="spacious" contained={false} className="border-t border-subtle text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Eyebrow as="div">{tEye('ready')}</Eyebrow>
          <h2 className="ui-public-display-lg mt-4">{t('cta.title')}</h2>
          <p className="ui-public-section-lede mt-6 mx-auto">{t('cta.description')}</p>
          <div className="mt-10">
            <Link href="/get-involved" className="ui-public-cta-lg">
              {t('cta.button')}
            </Link>
          </div>
        </div>
      </Section>
    </main>
  );
}
