import { Metadata } from 'next'
import {
  Brain,
  CheckCircle2,
  Clock,
  Leaf,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import { PageHero } from '@/components/layout/PageHero'
import { ORG } from '@/config/org'
import {
  coreValues,
  painPoints,
  technicalStack,
  pricingTiers,
  industries,
  timeline,
  riskMitigation,
  deploymentExamples,
  technicalImplementation,
} from './data'

export const metadata: Metadata = {
  title: 'Nachhaltige KI-Lösungen für Unternehmen | RevampIT',
  description: 'Open-Source, souveräne KI-Systeme für professionelle Firmen. Nachhaltige, private und DSGVO-konforme KI, die deine Daten schützt und die digitale Souveränität unterstützt.',
  openGraph: {
    title: 'Nachhaltige KI-Lösungen für Unternehmen | RevampIT',
    description: 'Open-Source, souveräne KI-Systeme für professionelle Firmen. Nachhaltige, private und DSGVO-konforme KI, die deine Daten schützt und die digitale Souveränität unterstützt.',
    type: 'website',
    url: 'https://revampit.org/services/enterprise-ai-solutions',
  },
}

export default function EnterpriseAIPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Nachhaltige KI-Lösungen für Unternehmen',
            'description': 'Open-Source, souveräne KI-Systeme für professionelle Firmen mit vollständiger Datenprivatsphäre, digitaler Souveränität und nachhaltigen Computing-Praktiken.',
            'provider': {
              '@type': 'Organization',
              'name': 'Revamp-IT',
              'url': ORG.website
            },
            'serviceType': 'Nachhaltige KI-Lösungen für Unternehmen',
            'areaServed': {
              '@type': 'Country',
              'name': 'Switzerland'
            }
          })
        }}
      />
      <main className="min-h-screen bg-gray-50">
        {/* Coming Soon Banner */}
        <div className="bg-yellow-100 border-b border-yellow-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-semibold">Dieser Service ist bald verfügbar. Kontaktiere uns, um Interesse zu bekunden und benachrichtigt zu werden, wenn er verfügbar ist.</span>
            </div>
          </div>
        </div>

        <PageHero
          theme="services"
          icon={Brain}
          title="Nachhaltige Unternehmens-KI"
          subtitle="Die Zukunft der KI ist nachhaltiges, souveränes Computing. Setze fortschrittliche KI-Systeme ein, die deine Datensouveränität respektieren, auf Open-Source-Transparenz setzen und die Umweltbelastung minimieren."
        >
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">
            <strong>Souverän • Open Source • Nachhaltig</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Interesse bekunden
            </Link>
            <Link
              href="#case-study"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium px-6 py-3 bg-white text-blue-600 hover:bg-gray-50 border-2 border-blue-600 transition-colors"
            >
              Zukünftige Pläne ansehen
            </Link>
          </div>
        </PageHero>

        {/* Core Values */}
        <section className="py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Unser Ethos: Die Zukunft des Computing</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Nachhaltiges, souveränes Computing stellt einen grundlegenden Wandel hin zu einer verantwortungsvollen KI dar, die die Datensouveränität respektiert, Transparenz begrüsst und die Umweltbelastung minimiert.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {coreValues.map((value, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 text-center">
                  <div className={`w-20 h-20 mx-auto mb-6 bg-${value.color}-100 rounded-full flex items-center justify-center`}>
                    <value.icon className={`w-10 h-10 text-${value.color}-600`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Warum nachhaltige, souveräne KI?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Transformiere deine Dokumenten-Workflows mit einer KI, die den Schweizer Werten von Datenschutz, Nachhaltigkeit und Unabhängigkeit entspricht.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {painPoints.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">Herausforderung</h3>
                  </div>
                  <p className="text-gray-600 mb-4 font-medium">{item.pain}</p>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-green-600 mb-2">Souveräne Lösung</h4>
                    <p className="text-gray-700 mb-3">{item.solution}</p>
                    <div className="flex items-center text-green-600 font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      <span>{item.benefit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Architecture */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Technische Grundlage: Open Source</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Vollständig auf transparenten, überprüfbaren Open-Source-Technologien aufgebaut. Keine proprietären Abhängigkeiten, kein Anbieter-Lock-in, vollständige digitale Souveränität.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {technicalStack.map((component, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <component.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{component.component}</h3>
                      <p className="text-green-600 font-medium">{component.technology}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{component.description}</p>
                  <ul className="space-y-2">
                    {component.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section id="case-study" className="py-20 bg-green-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Bereitstellungsbeispiele nach Unternehmensgrösse</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Skalierbare KI-Lösungen von kleinen Start-ups bis hin zu grossen Unternehmen - wir haben Optionen für jedes Budget und jeden Umfang.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {deploymentExamples.map((example, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-green-600 mb-2">{example.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{example.scale}</p>
                  <p className="text-gray-600 mb-4">{example.description}</p>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">Dokumente:</span> {example.documents}</div>
                    <div><span className="font-semibold">Antwortzeit:</span> {example.responseTime}</div>
                    <div><span className="font-semibold">Hardware:</span> {example.infrastructure}</div>
                    <div><span className="font-semibold">Modell:</span> {example.model}</div>
                    <div><span className="font-semibold">Bereitstellung:</span> {example.deployment}</div>
                    <div className="text-lg font-bold text-green-600 mt-3">{example.cost}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Hardware-Optionen & Technologie-Stack</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Hardware-Stufen</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>&bull; <strong>Einstiegslevel:</strong> RTX 4090 24GB (hervorragendes Preis-Leistungs-Verhältnis)</li>
                    <li>&bull; <strong>Professionell:</strong> RTX 4090 Ti oder duale RTX 4090-Setups</li>
                    <li>&bull; <strong>Unternehmen:</strong> NVIDIA A100 80GB (maximale Leistung)</li>
                    <li>&bull; <strong>Spitzentechnologie:</strong> NVIDIA H100 (neueste Generation)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Software & KI-Modelle</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>&bull; <strong>Klein:</strong> Llama 3.1 8B (schnell, effizient, budgetfreundlich)</li>
                    <li>&bull; <strong>Mittel:</strong> Llama 3.1 13B (ausgewogene Leistung)</li>
                    <li>&bull; <strong>Gross:</strong> Llama 3.1 70B (maximale Fähigkeit)</li>
                    <li>&bull; <strong>Bereitstellung:</strong> vLLM, ChromaDB, LlamaIndex</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3">Klein anfangen, intelligent skalieren</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-semibold text-green-700">Einstiegspunkt</h5>
                    <p className="text-sm text-gray-700">Beginne mit einem RTX 4090-Setup für CHF 450/Monat. Perfekt für kleine Teams zum Testen und Lernen.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-green-700">Allmähliche Skalierung</h5>
                    <p className="text-sm text-gray-700">Aktualisiere Hardware und Modelle, wenn deine Anforderungen wachsen. du musst nicht mit unternehmenstauglicher Ausrüstung beginnen.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-green-700">Zukunftssicher</h5>
                    <p className="text-sm text-gray-700">Die offene Architektur ermöglicht nahtlose Upgrades ohne Anbieter-Lock-in oder Datenmigration.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Industry Applications */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Branchenanwendungen</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Unsere souveränen KI-Lösungen passen sich den spezifischen Bedürfnissen deiner Branche an und gewährleisten gleichzeitig vollständige Datensouveränität und Compliance.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {industries.map((industry, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <industry.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{industry.name}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{industry.description}</p>
                  <div className="space-y-2">
                    {industry.useCases.map((useCase, i) => (
                      <div key={i} className="flex items-center text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">{useCase}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Nachhaltige Investition in die digitale Souveränität</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Transparente Preise, die unser Engagement für nachhaltige, souveräne KI widerspiegeln. Skaliere vom Proof-of-Concept bis zur vollen Produktion mit vollständiger Kostentransparenz.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => (
                <div key={index} className={`rounded-xl shadow-lg overflow-hidden ${tier.popular ? 'ring-2 ring-green-500 bg-green-50' : 'bg-white'}`}>
                  <div className="p-8">
                    {tier.popular && (
                      <div className="bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                        Beliebteste Option
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-gray-600 mb-4">{tier.description}</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-green-600">{tier.price}</span>
                      <span className="text-gray-500 ml-2">({tier.duration})</span>
                    </div>
                    <div className="space-y-3 mb-8">
                      {tier.features.map((feature, i) => (
                        <div key={i} className="flex items-center">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-center">
                      <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full inline-block">
                        {tier.highlight}
                      </div>
                      {tier.note && (
                        <p className="text-xs text-gray-500 mt-2">{tier.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <div className="bg-green-50 rounded-xl p-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-center mb-4">
                  <Leaf className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-2xl font-bold text-green-800">Nachhaltigkeitsverpflichtung</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Unsere Preisgestaltung spiegelt die wahren Kosten nachhaltiger KI wider. Durch die Wahl energieeffizienter Modelle, optimierter Infrastruktur und transparenter Open-Source-Technologien liefern wir einen überlegenen Wert und minimieren gleichzeitig die Umweltbelastung. Jede Bereitstellung trägt zu einer nachhaltigeren digitalen Zukunft bei.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Implementation Timeline */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">8-12 Wochen Implementierungszeitplan</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Strukturierter Bereitstellungsprozess mit klaren Meilensteinen und Ergebnissen. Der Zeitplan variiert je nach Komplexität und Anforderungen.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={index} className="flex items-center bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-6">
                      <span className="text-2xl font-bold text-green-600">W{item.week}</span>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold mb-2">Woche {item.week}</h3>
                      <p className="text-gray-600">{item.milestone}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Risk Mitigation */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Risikomanagement</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Wir haben die Hauptrisiken bei der Bereitstellung von Unternehmens-KI identifiziert und gemindert.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {riskMitigation.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start mb-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600 mr-4 flex-shrink-0">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-red-700">Risiko: {item.risk}</h3>
                      <p className="text-gray-700">{item.mitigation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Implementation */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Technischer Implementierungsüberblick</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Ein vollständiger technischer Überblick über unseren souveränen KI-Bereitstellungsprozess und unsere Technologieentscheidungen.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {technicalImplementation.steps.map((step, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{step.phase}</h3>
                        <p className="text-green-600 font-medium">{step.duration}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    <div className="flex items-center text-green-600 font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span>{step.technical}</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-green-600 font-semibold">Nachhaltigkeitsauswirkungen:</span>
                      <p className="text-gray-700">{step.sustainability}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-6">
              <Brain className="w-12 h-12 mr-4 text-green-300" />
              <Heart className="w-8 h-8 mr-4 text-green-300" />
              <Leaf className="w-10 h-10 text-green-300" />
            </div>
            <h2 className="text-4xl font-bold mb-6">Bereit für nachhaltige, souveräne KI?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto text-green-100">
              Schliess dich der Bewegung zur digitalen Souveränität an. Setze eine KI ein, die deine Daten respektiert, Transparenz begrüsst und eine nachhaltige digitale Zukunft für die Schweiz und darüber hinaus schafft.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Starte deine souveräne KI-Reise
              </Link>
              <Link
                href="/services"
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Alle Dienstleistungen entdecken
              </Link>
            </div>

            <div className="mt-12 max-w-2xl mx-auto">
              <p className="text-green-200 text-lg italic">
                &ldquo;Nachhaltiges, souveränes Computing ist nicht nur die Zukunft &ndash; es ist die verantwortungsvolle Wahl für heute.&rdquo;
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
