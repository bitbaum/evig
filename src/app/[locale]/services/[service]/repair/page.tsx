import { Metadata } from 'next'
import { Wrench, CheckCircle2, Clock, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'

export const metadata: Metadata = {
  title: `Computer Reparaturen & Upgrades | ${ORG.name}`,
  description: 'Professionelle Computer-Reparaturen und Upgrades. Wir spezialisieren uns auf das, was andere nicht reparieren können — inklusive Mainboard-Reparaturen und komponentenseitige Fehler.',
}

const repairDetails = {
  hero: {
    title: 'Computer Reparaturen & Upgrades',
    subtitle: 'Reparaturen, auf die du dich verlassen kannst',
    description: 'Wir verbinden technisches Know-how mit nachhaltigem Handeln, um die Lebensdauer deiner Geräte zu verlängern. Unsere Reparaturleistungen fokussieren auf das, was andere aufgeben — das spart Geld und reduziert Elektroschrott.'
  },
  features: [
    {
      title: 'Reparaturen auf Komponentenebene',
      description: 'Wir tauschen nicht einfach Teile aus — wir reparieren sie. Unsere Techniker können Mainboards, Netzteile und andere Komponenten auf Schaltkreisebene instand setzen.',
      icon: Wrench
    },
    {
      title: 'Hardware-Upgrades',
      description: 'Verlängere die Lebensdauer deines Computers mit gezielten Upgrades. Wir helfen dir, die richtigen Komponenten auszuwählen und einzubauen.',
      icon: Zap
    },
    {
      title: 'Diagnose-Service',
      description: 'Umfassende Diagnose, um Probleme schnell zu identifizieren und zu beheben. Mit professionellem Werkzeug und jahrelanger Erfahrung treffen wir den Punkt.',
      icon: Shield
    },
    {
      title: 'Express-Service',
      description: 'Dringend? Für viele gängige Probleme bieten wir Same-Day-Reparaturen an. Bring das Gerät einfach während unserer Öffnungszeiten vorbei.',
      icon: Clock
    }
  ],
  pricing: {
    base: 'Ab CHF 70/Stunde',
    details: [
      'Kostenlose Erstdiagnose',
      'Keine Reparatur = keine Kosten',
      'Transparente Preisgestaltung',
      'Garantie auf Reparaturen'
    ]
  },
  process: [
    {
      step: 1,
      title: 'Diagnose',
      description: 'Wir untersuchen dein Gerät und liefern eine genaue Einschätzung des Problems.'
    },
    {
      step: 2,
      title: 'Kostenvoranschlag',
      description: 'Du erhältst einen transparenten Kostenvoranschlag — ohne versteckte Gebühren.'
    },
    {
      step: 3,
      title: 'Reparatur',
      description: 'Unsere Techniker reparieren dein Gerät mit hochwertigen Teilen und bewährten Methoden.'
    },
    {
      step: 4,
      title: 'Test',
      description: 'Alle Reparaturen werden gründlich geprüft, damit dein Gerät einwandfrei funktioniert.'
    }
  ]
}

export default function RepairPage() {
  return (
    <main>
      <PageHero
        theme="services"
        icon={Wrench}
        title={repairDetails.hero.title}
        subtitle={repairDetails.hero.description}
      >
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">
          <strong>{repairDetails.hero.subtitle}</strong>
        </p>
      </PageHero>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {repairDetails.features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                <div className="flex items-start mb-6">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <Heading level={3} className="text-2xl font-bold mb-3">{feature.title}</Heading>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <Heading level={2} className="text-3xl font-bold mb-12 text-center">Unser Reparaturprozess</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {repairDetails.process.map((step) => (
              <div key={step.step} className="bg-gray-50 rounded-xl p-8">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {step.step}
                </div>
                <Heading level={3} className="text-xl font-semibold mb-3">{step.title}</Heading>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-lg">
            <Heading level={2} className="text-3xl font-bold mb-8 text-center">Preise</Heading>
            <div className="text-center mb-8">
              <p className="text-2xl font-bold text-green-600">{repairDetails.pricing.base}</p>
            </div>
            <div className="space-y-4">
              {repairDetails.pricing.details.map((detail, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <Heading level={2} className="text-4xl font-bold mb-6">Gerät reparieren lassen?</Heading>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Melde dich für eine kostenlose Diagnose und ein Angebot. Wir helfen dir, dein Gerät schnell und günstig wieder zum Laufen zu bringen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
            >
              Kontakt aufnehmen
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
              Alle Services
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
