import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Compirat - Computerkenntnisse mit Linux | RevampIT',
  description: 'Ein gemeinsames Projekt von Caritas Zürich und revamp-it, das Computerkurse und Internetzugangspunkte für Menschen mit geringem Einkommen im Kanton Zürich anbietet.'
}

export default function CompiratPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Compirat"
        description="Computerkenntnisse und Linux-Bildung für alle"
      >
        <div className="flex gap-4 mt-8">
          <Link href="/get-involved/volunteer">
            <Button size="lg" className="bg-white text-green-800 hover:bg-green-50">
              Freiwilliger werden
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Kontakt aufnehmen
            </Button>
          </Link>
        </div>
      </HeroBanner>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-center">Über Compirat</h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              Ein gemeinsames Projekt von Caritas Zürich und revamp-it, das zugängliche Computerkurse 
              und Internetzugangspunkte für Menschen mit geringem Einkommen im Kanton Zürich anbietet.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Lokale Kurse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Computer-Einstiegskurse in der Nachbarschaft der Teilnehmer oder in nahegelegenen Standorten
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Linux-Fokus</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Einführung in Linux als Betriebssystem und Bereitstellung einer kostenlosen und offenen Alternative
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Internetzugang</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Kostenlose Internetzugangspunkte mit professioneller Betreuung zum Üben und Lernen
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Unser Programm</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Einstiegskurse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Umfassende Computerkurse für Anfänger, die sich auf grundlegende Fähigkeiten und Linux-Grundlagen konzentrieren.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Grundlegende Computerbedienung</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Einführung in Linux</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Internet- und E-Mail-Grundlagen</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Internetzugangspunkte</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Betreute Übungsräume, in denen Teilnehmer ihre Fähigkeiten anwenden und das Internet nutzen können.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Professionelle Betreuung</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Kostenloser Internetzugang</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Übung und Unterstützung</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Fortgeschrittenenkurse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Spezialisierte Kurse für Teilnehmer, die ihr Wissen und ihre Fähigkeiten vertiefen möchten.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Fortgeschrittene Linux-Nutzung</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Produktivitätstools</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Digitale Kommunikation</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Online-Ressourcen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Umfassende Online-Plattform mit Lernmaterialien und Unterstützungsressourcen.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Kursmaterialien</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Linux-Tutorials</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Übungsaufgaben</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Unsere Standorte</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Wetzikon</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Unser erster Standort, gegründet 2010, bietet regelmässige Kurse und einen Internetzugangspunkt.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Zürich</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Regelmässige Kurse und Aktivitäten in der Stadt Zürich, weitere Standorte folgen bald.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Get Involved Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Mitmachen</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Freiwilliger werden</h3>
                <p className="text-gray-600 mb-4 flex-grow">Unterstützen Sie Kurse und Internetzugangspunkte als Freiwilliger</p>
                <Link href="/get-involved/volunteer" className="block w-full">
                  <Button variant="outline" className="w-full">Mitmachen</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Mehr erfahren</h3>
                <p className="text-gray-600 mb-4 flex-grow">Besuchen Sie unsere Website für detaillierte Informationen und Ressourcen</p>
                <a href="https://www.compirat.ch" target="_blank" rel="noopener noreferrer" className="block w-full">
                  <Button variant="outline" className="w-full">Compirat.ch besuchen</Button>
                </a>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Kontakt</h3>
                <p className="text-gray-600 mb-4 flex-grow">Kontaktieren Sie uns für weitere Informationen über unsere Programme</p>
                <Link href="/contact" className="block w-full">
                  <Button variant="outline" className="w-full">Kontakt aufnehmen</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 