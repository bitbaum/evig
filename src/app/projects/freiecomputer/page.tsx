import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FreieComputer.ch - Schweizer Label für freie Software',
  description: 'Das Schweizer Label für Computer mit vorinstallierter freier Software und garantiertem Support. Fördert die Wahlfreiheit in der Informatik seit 2010.'
}

export default function FreieComputerPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="FreieComputer.ch"
        description="Das Schweizer Label für Computer mit vorinstallierter freier Software und garantiertem Support"
      >
        <div className="flex gap-4 mt-8">
          <Link href="/get-involved/volunteer">
            <Button size="lg" className="bg-white text-green-800 hover:bg-green-50">
              Unterstützen Sie unsere Mission
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Kontakt
            </Button>
          </Link>
        </div>
      </HeroBanner>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-center">Über FreieComputer.ch</h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              Zusammen mit engagierten Leuten aus der Open-Source-Community hat revamp-it geholfen,
              dieses Label zu etablieren, um die Wahlfreiheit in der Informatik zu fördern und Händler zu unterstützen,
              die Computer mit vorinstallierter freier Software verkaufen.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Freie Software</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Computer mit vorinstalliertem Linux und anderen freien Software-Alternativen
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Garantierter Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Transparente Support-Leistungen mit klaren Kosteninformationen beim Kauf
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Community-betrieben</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Ein gemeinnütziger Verein, der von der Open-Source-Community getragen wird
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Unsere Mission</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Das Monopol brechen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Die Dominanz proprietärer Betriebssysteme durch zugängliche Alternativen herausfordern.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Förderung von Linux und freier Software</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Unterstützung unabhängiger Händler</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Schaffung von Bewusstsein für Alternativen</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Wahlfreiheit für Konsumenten</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Den Zugang zu Computern mit freier Software für Konsumenten erleichtern.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Vorinstallierte freie Software</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Transparente Support-Optionen</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Klare Kosteninformationen</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Support-Leistungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Einen reibungslosen Übergang zu freier Software mit umfassendem Support gewährleisten.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Garantierte Support-Pakete</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Transparente Preisgestaltung</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Professionelle Unterstützung</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Community-Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Aufbau einer Community, die sich der Förderung freier Software in der Schweiz widmet.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Open-Source-Zusammenarbeit</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Wissensaustausch</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Community-Support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Unsere Geschichte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Seit der Lancierung von FreieComputer.ch im Jahr 2010 bietet revamp-it zertifizierte Computer
                  unter dem Label zum Verkauf an. Wir arbeiten weiterhin mit engagierten Personen aus der Open-Source-
                  Community zusammen, um das Label bekannter und zugänglicher zu machen.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Gegründet 2010</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Struktur als gemeinnütziger Verein</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Laufende Weiterentwicklung durch die Community</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Get Involved Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Machen Sie mit</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Machen Sie mit</h3>
                <p className="text-gray-600 mb-4 flex-grow">Helfen Sie mit, das Label bekannter und zugänglicher zu machen</p>
                <Link href="/get-involved/volunteer" className="block w-full">
                  <Button variant="outline" className="w-full">Freiwillig engagieren</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Mehr erfahren</h3>
                <p className="text-gray-600 mb-4 flex-grow">Besuchen Sie unsere Website für detaillierte Informationen über das Label</p>
                <a href="https://www.freiecomputer.ch" target="_blank" rel="noopener noreferrer" className="block w-full">
                  <Button variant="outline" className="w-full">Besuchen Sie FreieComputer.ch</Button>
                </a>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Kontakt</h3>
                <p className="text-gray-600 mb-4 flex-grow">Kontaktieren Sie uns, um mehr über unsere Initiative zu erfahren</p>
                <Link href="/contact" className="block w-full">
                  <Button variant="outline" className="w-full">Kontaktieren Sie uns</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 