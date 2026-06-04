// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { BookOpen, FileText, Users, LinkIcon, Lightbulb } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { buttonClass as btnClass } from '@/components/ui/button-class'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'knowhow' })
  const title = t('meta.title')
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function WissenPage() {
  const t = await getTranslations('knowhow')

  const sections = [
    {
      id: 'guides',
      titleKey: 'sections.guides.title',
      descriptionKey: 'sections.guides.description',
      ctaKey: 'sections.guides.cta',
      icon: BookOpen,
      href: '/#guides',
    },
    {
      id: 'blog',
      titleKey: 'sections.blog.title',
      descriptionKey: 'sections.blog.description',
      ctaKey: 'sections.blog.cta',
      icon: FileText,
      href: '/blog',
    },
    {
      id: 'workshops',
      titleKey: 'sections.workshops.title',
      descriptionKey: 'sections.workshops.description',
      ctaKey: 'sections.workshops.cta',
      icon: Users,
      href: '/workshops',
    },
    {
      id: 'ressourcen',
      titleKey: 'sections.resources.title',
      descriptionKey: 'sections.resources.description',
      ctaKey: 'sections.resources.cta',
      icon: LinkIcon,
      href: '#ressourcen',
    },
  ]

  const resources = {
    openSource: [
      { name: 'LibreOffice', href: 'https://www.libreoffice.org', description: t('resources.openSource.libreoffice') },
      { name: 'Firefox', href: 'https://www.mozilla.org/de/firefox/', description: t('resources.openSource.firefox') },
      { name: 'Thunderbird', href: 'https://www.thunderbird.net/', description: t('resources.openSource.thunderbird') },
      { name: 'GIMP', href: 'https://www.gimp.org/', description: t('resources.openSource.gimp') },
      { name: 'Inkscape', href: 'https://inkscape.org/', description: t('resources.openSource.inkscape') },
      { name: 'Blender', href: 'https://www.blender.org/', description: t('resources.openSource.blender') },
    ],
    linux: [
      { name: 'Linux Mint', href: 'https://www.linuxmint.com/', description: t('resources.linux.linuxMint') },
      { name: 'Ubuntu', href: 'https://ubuntu.com/', description: t('resources.linux.ubuntu') },
      { name: 'MX Linux', href: 'https://mxlinux.org/', description: t('resources.linux.mxLinux') },
      { name: 'Fedora', href: 'https://fedoraproject.org/', description: t('resources.linux.fedora') },
      { name: 'Debian', href: 'https://www.debian.org/', description: t('resources.linux.debian') },
    ],
    documentation: [
      { name: 'Arch Linux Wiki', href: 'https://wiki.archlinux.org/', description: t('resources.documentation.archWiki') },
      { name: 'Linux Foundation', href: 'https://www.linuxfoundation.org/', description: t('resources.documentation.linuxFoundation') },
      { name: 'GNU.org', href: 'https://www.gnu.org/', description: t('resources.documentation.gnu') },
    ],
  }

  const cardClass = 'bg-surface-base border text-text-primary'
  const buttonClass = 'bg-action hover:bg-action'

  return (
    <main>
      <PageHero
        theme="knowhow"
        icon={Lightbulb}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      {/* Main Sections Grid */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {sections.map((section) => {
              const Icon = section.icon

              return (
                <div
                  key={section.id}
                  className={`${cardClass} rounded-xl p-6 sm:p-8 flex flex-col`}
                >
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-action" />
                    <Heading level={2} className="text-xl sm:text-2xl">{t(section.titleKey as Parameters<typeof t>[0])}</Heading>
                  </div>
                  <p className="text-sm sm:text-base mb-4 sm:mb-6 grow text-text-secondary">{t(section.descriptionKey as Parameters<typeof t>[0])}</p>
                  <Link
                    href={section.href}
                    className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-white font-semibold text-sm sm:text-base ${buttonClass} transition-colors`}
                  >
                    {t(section.ctaKey as Parameters<typeof t>[0])}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="ressourcen" className="px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:px-8 bg-surface-raised">
        <div className="mx-auto max-w-6xl">
          <Heading level={2} className="text-2xl sm:text-3xl tracking-tight text-text-primary mb-8 sm:mb-12 md:mb-16 text-center">
            {t('curatedResources')}
          </Heading>

          {/* Open Source Software */}
          <div className="mb-12 sm:mb-16">
            <Heading level={3} className="text-xl sm:text-2xl text-text-primary mb-4 sm:mb-6">{t('openSourceSoftware')}</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {resources.openSource.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 sm:p-6 rounded-lg border hover:border-action hover:bg-action-muted-muted transition-colors"
                >
                  <Heading level={4} className="font-semibold text-sm sm:text-base text-text-primary mb-2">{resource.name}</Heading>
                  <p className="text-xs sm:text-sm text-text-secondary">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Linux Distributionen */}
          <div className="mb-12 sm:mb-16">
            <Heading level={3} className="text-xl sm:text-2xl text-text-primary mb-4 sm:mb-6">{t('linuxDistros')}</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {resources.linux.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 sm:p-6 rounded-lg border hover:border-action hover:bg-action-muted-muted transition-colors"
                >
                  <Heading level={4} className="font-semibold text-sm sm:text-base text-text-primary mb-2">{resource.name}</Heading>
                  <p className="text-xs sm:text-sm text-text-secondary">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Documentation */}
          <div>
            <Heading level={3} className="text-xl sm:text-2xl text-text-primary mb-4 sm:mb-6">{t('externalDocs')}</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {resources.documentation.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 sm:p-6 rounded-lg border hover:border-action hover:bg-action-muted-muted transition-colors"
                >
                  <Heading level={4} className="font-semibold text-sm sm:text-base text-text-primary mb-2">{resource.name}</Heading>
                  <p className="text-xs sm:text-sm text-text-secondary">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Heading level={2} className="text-2xl sm:text-3xl tracking-tight text-text-primary mb-4 sm:mb-6">
            {t('cta.title')}
          </Heading>
          <p className="text-base sm:text-lg text-text-secondary mb-8 sm:mb-10">
            {t('cta.description')}
          </p>
          <Link href="/contact" className={btnClass({ variant: 'primary' })}>
            {t('cta.button')}
          </Link>
        </div>
      </section>
    </main>
  )
}
