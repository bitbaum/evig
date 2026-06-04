// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Heading from '@/components/ui/Heading'
import { buttonClass } from '@/components/ui/button-class'
import {
  Terminal,
  Shield,
  Users,
  Zap,
  Code,
  Server,
  Laptop,
  Download,
  Cpu,
  HardDrive,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { PageHero } from '@/components/layout/PageHero'
import { ORG, CONTACT } from '@/config/org'
import { getTranslations } from 'next-intl/server'

interface LinuxPageProps {
  params: Promise<{ locale: string }>
}

// Icons are positional — parallel to translation arrays
const BENEFIT_ICONS = [Shield, Zap, Code, Users]
const SERVICE_ICONS = [Download, Terminal, Users, Server]
const DISTRO_ICONS = [Laptop, Laptop, Cpu, Server, HardDrive]
const DISTRO_WEBSITES = [
  'https://ubuntu.com',
  'https://linuxmint.com',
  'https://fedoraproject.org',
  'https://www.debian.org',
  'https://mxlinux.org',
]
const DISTRO_NAMES = ['Ubuntu', 'Linux Mint', 'Fedora', 'Debian', 'MX Linux']

export async function generateMetadata({ params }: LinuxPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.linuxOpenSource' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function LinuxPage({ params }: LinuxPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.linuxOpenSource' })

  const serviceItems = t.raw('servicesSection.items') as Array<{ title: string; description: string }>
  const benefitItems = t.raw('benefitsSection.items') as Array<{ title: string; description: string }>
  const advantageItems = t.raw('advantages.items') as Array<{ title: string; points: string[] }>
  const distroItems = t.raw('distrosSection.items') as Array<{
    description: string
    useCases: string[]
    pros: string[]
    cons: string[]
  }>

  return (
    <main>
      <PageHero
        theme="services"
        icon={Terminal}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      >
        <p className="text-lg text-text-secondary max-w-2xl mx-auto mt-6">
          {t('hero.intro')}
        </p>
      </PageHero>

      {/* Services & Pricing Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-surface-base">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Heading level={2} className="mb-6">{t('servicesSection.heading')}</Heading>
            <p className="text-lg text-text-secondary mb-4">
              {t('servicesSection.subtitle')}
            </p>
            <div className="text-action font-semibold text-xl mb-8">
              {t('servicesSection.priceInfo')}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {serviceItems.map((service, index) => {
              const Icon = SERVICE_ICONS[index]
              return (
                <div key={index} className="bg-surface-raised rounded-xl p-8 border hover:border-strong transition-all duration-300">
                  <div className="flex items-start">
                    <div className="p-3 bg-action-muted rounded-lg text-action mr-4">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <Heading level={3} className="mb-3">{service.title}</Heading>
                      <p className="text-text-secondary">{service.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Value Proposition Section */}
          <div className="mt-20">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Heading level={2} className="mb-6">{t('advantages.heading')}</Heading>
              <p className="text-lg text-text-secondary">
                {t('advantages.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {advantageItems.map((adv, index) => (
                <div key={index} className="bg-surface-base rounded-xl p-8 border border-l-4 border-l-primary-600">
                  <Heading level={3} className="mb-4">{adv.title}</Heading>
                  <ul className="space-y-3">
                    {adv.points.map((point, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-action mr-3 mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Contact CTA */}
          <div className="mt-12 bg-surface-raised/50 rounded-xl p-8 text-center">
            <Heading level={3} className="mb-4">{t('quickCta.heading')}</Heading>
            <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
              {t('quickCta.body')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className={buttonClass({ variant: 'primary', size: 'lg' })}>
                {t('quickCta.consult')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href={CONTACT.phoneTel}
                className="inline-flex items-center border-2 border-action text-action px-8 py-4 rounded-lg font-semibold hover:bg-action-muted transition-colors"
              >
                {t('quickCta.call')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-surface-raised">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Heading level={2} className="mb-6">{t('benefitsSection.heading')}</Heading>
            <p className="text-lg text-text-secondary">
              {t('benefitsSection.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefitItems.map((benefit, index) => {
              const Icon = BENEFIT_ICONS[index]
              return (
                <div key={index} className="bg-surface-base rounded-xl p-8 border hover:border-strong transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <Icon className="w-6 h-6 text-action mr-3" />
                    <Heading level={3} className="">{benefit.title}</Heading>
                  </div>
                  <p className="text-text-secondary">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Distributions Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-surface-base">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Heading level={2} className="mb-6">{t('distrosSection.heading')}</Heading>
            <p className="text-lg text-text-secondary">
              {t('distrosSection.subtitle')}
            </p>
          </div>
          <div className="space-y-8">
            {distroItems.map((distro, index) => {
              const Icon = DISTRO_ICONS[index]
              return (
                <div key={index} className="bg-surface-raised rounded-xl p-8 border hover:border-strong transition-all duration-300">
                  <div className="flex items-start mb-6">
                    <div className="p-3 bg-action-muted rounded-lg text-action mr-4">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <Heading level={3} className="mb-2">{DISTRO_NAMES[index]}</Heading>
                      <a
                        href={DISTRO_WEBSITES[index]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-action hover:text-action text-sm mb-4 inline-flex items-center"
                      >
                        {t('distrosSection.visitWebsite')} <ArrowRight className="w-4 h-4 ml-1" />
                      </a>
                      <p className="text-text-secondary mb-4">{distro.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Heading level={4} className="mb-2">{t('distrosSection.bestFor')}</Heading>
                          <ul className="space-y-2">
                            {distro.useCases.map((useCase, i) => (
                              <li key={i} className="flex items-start">
                                <div className="p-1 bg-action-muted rounded-full mr-3 mt-0.5">
                                  <CheckCircle2 className="w-4 h-4 text-action" />
                                </div>
                                <span className="text-text-secondary">{useCase}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <Heading level={4} className="mb-2">{t('distrosSection.pros')}</Heading>
                          <ul className="space-y-2">
                            {distro.pros.map((pro, i) => (
                              <li key={i} className="flex items-start">
                                <div className="p-1 bg-action-muted rounded-full mr-3 mt-0.5">
                                  <CheckCircle2 className="w-4 h-4 text-action" />
                                </div>
                                <span className="text-text-secondary">{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {distro.cons && distro.cons.length > 0 && (
                        <div className="mt-6">
                          <Heading level={4} className="mb-2">{t('distrosSection.cons')}</Heading>
                          <ul className="space-y-2">
                            {distro.cons.map((con, i) => (
                              <li key={i} className="flex items-start">
                                <div className="p-1 bg-error-100 dark:bg-error-900/30 rounded-full mr-3 mt-0.5">
                                  <XCircle className="w-4 h-4 text-error-600 dark:text-error-400" />
                                </div>
                                <span className="text-text-secondary">{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-action text-white">
        <div className="container mx-auto px-4 text-center">
          <Heading level={2} className="mb-6">{t('finalCta.heading')}</Heading>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-action-text">
            {t('finalCta.body')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-surface-base text-action px-8 py-4 rounded-lg font-semibold hover:bg-action-muted transition-colors duration-300 text-lg"
            >
              {t('finalCta.start')}
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-surface-base/10 transition-colors duration-300 text-lg"
            >
              {t('finalCta.explore')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
