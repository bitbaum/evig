import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, FileText, Users, LinkIcon, Lightbulb } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'knowhow' })
  return {
    title: t('meta.title'),
    description: t('meta.description'),
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
      color: 'green',
    },
    {
      id: 'blog',
      titleKey: 'sections.blog.title',
      descriptionKey: 'sections.blog.description',
      ctaKey: 'sections.blog.cta',
      icon: FileText,
      href: '/blog',
      color: 'blue',
    },
    {
      id: 'workshops',
      titleKey: 'sections.workshops.title',
      descriptionKey: 'sections.workshops.description',
      ctaKey: 'sections.workshops.cta',
      icon: Users,
      href: '/workshops',
      color: 'purple',
    },
    {
      id: 'ressourcen',
      titleKey: 'sections.resources.title',
      descriptionKey: 'sections.resources.description',
      ctaKey: 'sections.resources.cta',
      icon: LinkIcon,
      href: '#ressourcen',
      color: 'orange',
    },
  ]

  const resources = {
    openSource: [
      { name: 'LibreOffice', href: 'https://www.libreoffice.org', description: 'Office-Alternativen (Writer, Calc, Impress)' },
      { name: 'Firefox', href: 'https://www.mozilla.org/de/firefox/', description: 'Datenschutz-freundlicher Browser' },
      { name: 'Thunderbird', href: 'https://www.thunderbird.net/', description: 'E-Mail-Client und Kalender' },
      { name: 'GIMP', href: 'https://www.gimp.org/', description: 'Bildbearbeitung' },
      { name: 'Inkscape', href: 'https://inkscape.org/', description: 'Vektor-Grafik-Editor' },
      { name: 'Blender', href: 'https://www.blender.org/', description: '3D-Modellierung und Animation' },
    ],
    linux: [
      { name: 'Linux Mint', href: 'https://www.linuxmint.com/', description: 'Anfängerfreundlich, Windows-ähnliche Oberfläche' },
      { name: 'Ubuntu', href: 'https://ubuntu.com/', description: 'Beliebte und unterstützte Distribution' },
      { name: 'MX Linux', href: 'https://mxlinux.org/', description: 'Leichtgewichtig für ältere Hardware' },
      { name: 'Fedora', href: 'https://fedoraproject.org/', description: 'Modernste Technologien und Enterprise-ready' },
      { name: 'Debian', href: 'https://www.debian.org/', description: 'Stabil und zuverlässig, Basis vieler Distributionen' },
    ],
    documentation: [
      { name: 'Arch Linux Wiki', href: 'https://wiki.archlinux.org/', description: 'Beste technische Dokumentation für Linux' },
      { name: 'Linux Foundation', href: 'https://www.linuxfoundation.org/', description: 'Offizielles Wissensportal' },
      { name: 'GNU.org', href: 'https://www.gnu.org/', description: 'Alles über freie Software und GPL' },
    ],
  }

  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
  }

  const buttonClasses = {
    green: 'bg-green-600 hover:bg-green-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
  }

  return (
    <main className="min-h-screen bg-white">
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
              const colorClass = colorClasses[section.color as keyof typeof colorClasses]
              const buttonClass = buttonClasses[section.color as keyof typeof buttonClasses]

              return (
                <div
                  key={section.id}
                  className={`${colorClass} border rounded-lg p-6 sm:p-8 flex flex-col`}
                >
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <Heading level={2} className="text-xl sm:text-2xl">{t(section.titleKey as Parameters<typeof t>[0])}</Heading>
                  </div>
                  <p className="text-sm sm:text-base mb-4 sm:mb-6 flex-grow">{t(section.descriptionKey as Parameters<typeof t>[0])}</p>
                  <Link
                    href={section.href}
                    className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-white font-semibold text-sm sm:text-base ${buttonClass} transition-colors`}
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
      <section id="ressourcen" className="px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <Heading level={2} className="text-2xl sm:text-3xl tracking-tight text-gray-900 mb-8 sm:mb-12 md:mb-16 text-center">
            {t('curatedResources')}
          </Heading>

          {/* Open Source Software */}
          <div className="mb-12 sm:mb-16">
            <Heading level={3} className="text-xl sm:text-2xl text-gray-900 mb-4 sm:mb-6">{t('openSourceSoftware')}</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {resources.openSource.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 sm:p-6 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <Heading level={4} className="font-semibold text-sm sm:text-base text-gray-900 mb-2">{resource.name}</Heading>
                  <p className="text-xs sm:text-sm text-gray-600">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Linux Distributionen */}
          <div className="mb-12 sm:mb-16">
            <Heading level={3} className="text-xl sm:text-2xl text-gray-900 mb-4 sm:mb-6">{t('linuxDistros')}</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {resources.linux.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 sm:p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Heading level={4} className="font-semibold text-sm sm:text-base text-gray-900 mb-2">{resource.name}</Heading>
                  <p className="text-xs sm:text-sm text-gray-600">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Documentation */}
          <div>
            <Heading level={3} className="text-xl sm:text-2xl text-gray-900 mb-4 sm:mb-6">{t('externalDocs')}</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {resources.documentation.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 sm:p-6 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <Heading level={4} className="font-semibold text-sm sm:text-base text-gray-900 mb-2">{resource.name}</Heading>
                  <p className="text-xs sm:text-sm text-gray-600">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Heading level={2} className="text-2xl sm:text-3xl tracking-tight text-gray-900 mb-4 sm:mb-6">
            {t('cta.title')}
          </Heading>
          <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10">
            {t('cta.description')}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors text-sm sm:text-base"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>
    </main>
  )
}
