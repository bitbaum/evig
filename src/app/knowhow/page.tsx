import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, FileText, Users, LinkIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Knowhow - Guides, Blog, Workshops | revamp-it',
  description: 'Lerne über Vintage Hardware, Linux und Open Source. Guides, Workshops, Blog und curatierte Ressourcen.',
}

export default function WissenPage() {
  const sections = [
    {
      id: 'guides',
      title: 'Guides',
      description: 'Schritt-für-Schritt Anleitungen für Linux, Vintage Hardware und Open Source',
      icon: BookOpen,
      href: '/#guides',
      cta: 'Zu den Guides',
      color: 'green',
    },
    {
      id: 'blog',
      title: 'Blog',
      description: 'Tipps, Geschichten und Best Practices von unseren Experten',
      icon: FileText,
      href: '/blog',
      cta: 'Zum Blog',
      color: 'blue',
    },
    {
      id: 'workshops',
      title: 'Workshops',
      description: 'Live-Kurse und Trainings zum Buchen - für Anfänger bis Experten',
      icon: Users,
      href: '/workshops',
      cta: 'Workshops ansehen',
      color: 'purple',
    },
    {
      id: 'ressourcen',
      title: 'Ressourcen',
      description: 'Curatierte externe Links und Open Source Alternativen',
      icon: LinkIcon,
      href: '#ressourcen',
      cta: 'Ressourcen durchstöbern',
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
      {/* Hero Section */}
      <section className="px-6 py-20 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
            Knowhow teilen über Vintage Hardware, Linux und Open Source
          </h1>
          <p className="text-lg leading-8 text-gray-600 mb-8">
            Wir teilen unser 16+ Jahre Knowhow, damit du Technologie besser verstehen und nutzen kannst. 
            Egal ob du gerade anfängst oder bereits ein Experte bist – hier findest du Ressourcen für deine Lernreise.
          </p>
        </div>
      </section>

      {/* Main Sections Grid */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section) => {
              const Icon = section.icon
              const colorClass = colorClasses[section.color as keyof typeof colorClasses]
              const buttonClass = buttonClasses[section.color as keyof typeof buttonClasses]
              
              return (
                <div
                  key={section.id}
                  className={`${colorClass} border rounded-lg p-8 flex flex-col`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                  </div>
                  <p className="text-base mb-6 flex-grow">{section.description}</p>
                  <Link
                    href={section.href}
                    className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-white font-semibold ${buttonClass} transition-colors`}
                  >
                    {section.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="ressourcen" className="px-6 py-20 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-16 text-center">
            Curatierte Ressourcen
          </h2>

          {/* Open Source Software */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Open Source Software Alternativen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.openSource.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{resource.name}</h4>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Linux Distributionen */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Linux Distributionen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.linux.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{resource.name}</h4>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Documentation */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Externe Dokumentation & Portale</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.documentation.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{resource.name}</h4>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">
            Bereit zu lernen?
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            Starte mit unserem Blog, besuche einen Workshop oder schau dir ein Guide an.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
          >
            Fragen? Kontaktiere uns
          </Link>
        </div>
      </section>
    </main>
  )
}
