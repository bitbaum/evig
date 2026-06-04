// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import {
  Award,
  Shield,
  Sparkles,
  Recycle,
  Star,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { buttonClass } from '@/components/ui/button-class'
import Image from 'next/image'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { IconBadge } from '@/components/ui/IconBadge'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import { responsiveTypography } from '@/lib/responsive'

interface RevampedPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: RevampedPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'revamped' })
  return {
    title: `${t('meta.title')} | ${ORG.name}`,
    description: t('meta.description'),
    openGraph: {
      title: `${t('meta.title')} | ${ORG.name}`,
      description: t('meta.description'),
      type: 'website',
      url: `${ORG.website}/revamped`,
    },
  }
}

export default async function RevampedPage({ params }: RevampedPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'revamped' })

  return (
    <main>
      <PageHero
        theme="services"
        icon={Award}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      >
        <div className="inline-flex items-center gap-2 bg-action-muted-muted px-6 py-3 rounded-full mb-6 mt-6">
          <Award className="w-6 h-6 text-action" />
          <span className="text-xl font-bold text-action">REVAMPED</span>
          <Sparkles className="w-5 h-5 text-action" />
        </div>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-sm mt-6">
          <div className="flex items-center bg-action-muted-muted text-action px-4 py-2 rounded-full">
            <Recycle className="w-4 h-4 mr-2" />
            {t('hero.badge1')}
          </div>
          <div className="flex items-center bg-action-muted-muted text-action px-4 py-2 rounded-full">
            <Shield className="w-4 h-4 mr-2" />
            {t('hero.badge2')}
          </div>
          <div className="flex items-center bg-action-muted-muted text-action px-4 py-2 rounded-full">
            <Star className="w-4 h-4 mr-2" />
            {t('hero.badge3')}
          </div>
        </div>
      </PageHero>

      {/* Hero Image with Real Revamped Laptop */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              {/* Left Column - Content */}
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <Heading level={2} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                    {t('heroSection.title')}
                  </Heading>
                  <p className="text-xl text-text-secondary mb-8 leading-relaxed">
                    {t('heroSection.body')}
                  </p>
                </div>

                <div className="space-y-4">
                  {(['check1', 'check2', 'check3', 'check4'] as const).map((key) => (
                    <div key={key} className="flex items-center">
                      <div className="w-3 h-3 bg-action rounded-full mr-4"></div>
                      <span className="text-lg">{t(`heroSection.${key}`)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/services/build-your-computer" className={buttonClass({ variant: 'primary' })}>
                    {t('heroSection.buildBtn')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <a
                    href="#certificate"
                    className="inline-block border-2 border-action text-action px-6 py-3 rounded-lg font-semibold hover:bg-action-muted-muted transition-colors"
                  >
                    {t('heroSection.learnBtn')}
                  </a>
                </div>
              </div>

              {/* Right Column - Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden border aspect-4/3">
                  <Image
                    src="/images/certification/revamped-laptop-user.webp"
                    alt="Woman with pink hair using a laptop with REVAMPED certification sticker"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute top-4 right-4 bg-action text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-xs">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      REVAMPED
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Revamped Means */}
      <section className="py-20 bg-surface-raised">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Heading level={2} className={`${responsiveTypography.section} font-bold mb-6`}>{t('whatIs.title')}</Heading>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                {t('whatIs.body')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <IconBadge icon={Recycle} theme="about" size="xl" shape="circle" className="mx-auto mb-6" />
                <Heading level={3} className="text-2xl font-bold mb-4">{t('whatIs.sustainability.title')}</Heading>
                <p className="text-text-secondary leading-relaxed">
                  {t('whatIs.sustainability.body')}
                </p>
              </div>
              <div className="text-center">
                <IconBadge icon={Shield} theme="about" size="xl" shape="circle" className="mx-auto mb-6" />
                <Heading level={3} className="text-2xl font-bold mb-4">{t('whatIs.quality.title')}</Heading>
                <p className="text-text-secondary leading-relaxed">
                  {t('whatIs.quality.body')}
                </p>
              </div>
              <div className="text-center">
                <IconBadge icon={Star} theme="about" size="xl" shape="circle" className="mx-auto mb-6" />
                <Heading level={3} className="text-2xl font-bold mb-4">{t('whatIs.ai.title')}</Heading>
                <p className="text-text-secondary leading-relaxed">
                  {t('whatIs.ai.body')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certificate of Authenticity */}
      <section id="certificate" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Heading level={2} className={`${responsiveTypography.section} font-bold mb-6`}>{t('certificate.title')}</Heading>
                <p className="text-xl text-text-secondary mb-8">
                  {t('certificate.subtitle')}
                </p>
                <div className="space-y-4">
                  {(['check1', 'check2', 'check3', 'check4', 'check5'] as const).map((key) => (
                    <div key={key} className="flex items-center">
                      <CheckCircle2 className="w-6 h-6 text-action mr-3" />
                      <span className="text-lg">{t(`certificate.${key}`)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-surface-raised p-12 rounded-2xl border">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-32 h-32 bg-surface-base rounded-full border mb-6">
                    <div className="text-center">
                      <Award className="w-12 h-12 text-action mx-auto mb-2" />
                      <div className="text-sm font-bold text-action">REVAMPED</div>
                      <div className="text-xs text-text-secondary">CERTIFIED</div>
                    </div>
                  </div>
                  <Heading level={3} className="text-2xl font-bold mb-4">{t('certificate.certTitle')}</Heading>
                  <p className="text-text-secondary">
                    {t('certificate.certBody')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticker Gallery */}
      <section className="py-20 bg-surface-raised">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Heading level={2} className={`${responsiveTypography.section} font-bold mb-6`}>{t('stickers.title')}</Heading>
              <p className="text-xl text-text-secondary">
                {t('stickers.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-surface-base p-12 rounded-2xl border mb-6">
                  <Image
                    src="/images/certification/sticker-1.webp"
                    alt="REVAMPED certification sticker design"
                    width={160}
                    height={160}
                    className="mx-auto object-contain"
                  />
                </div>
                <Heading level={3} className="text-xl font-bold mb-2">{t('stickers.sticker1.title')}</Heading>
                <p className="text-text-secondary">{t('stickers.sticker1.body')}</p>
              </div>
              <div className="text-center">
                <div className="bg-surface-base p-12 rounded-2xl border mb-6">
                  <Image
                    src="/images/certification/sticker-2.webp"
                    alt="REVAMPED certification sticker variant"
                    width={160}
                    height={160}
                    className="mx-auto object-contain"
                  />
                </div>
                <Heading level={3} className="text-xl font-bold mb-2">{t('stickers.sticker2.title')}</Heading>
                <p className="text-text-secondary">{t('stickers.sticker2.body')}</p>
              </div>
              <div className="text-center">
                <div className="bg-surface-raised p-12 rounded-2xl border mb-6 relative">
                  <div className="w-40 h-40 mx-auto flex items-center justify-center bg-surface-base rounded-xl border">
                    <div className="text-center">
                      <Award className="w-12 h-12 text-action mx-auto mb-2" />
                      <div className="text-sm font-bold text-action">REVAMPED</div>
                      <div className="text-xs text-text-secondary">CERTIFIED</div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 bg-action text-white text-xs px-3 py-1 rounded-full">NEW</div>
                </div>
                <Heading level={3} className="text-xl font-bold mb-2">{t('stickers.sticker3.title')}</Heading>
                <p className="text-text-secondary">{t('stickers.sticker3.body')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Heading level={2} className={`${responsiveTypography.section} font-bold mb-6`}>{t('cta.title')}</Heading>
            <p className="text-xl text-text-secondary mb-12 max-w-3xl mx-auto">
              {t('cta.body')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services/build-your-computer" className={buttonClass({ variant: 'primary', size: 'lg' })}>
                {t('cta.buildBtn')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/contact"
                className="inline-block border-2 border-action text-action px-8 py-4 rounded-lg font-semibold hover:bg-action-muted-muted transition-colors duration-300 text-lg"
              >
                {t('cta.learnBtn')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
