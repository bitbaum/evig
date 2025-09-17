import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hardware-Entwicklung',
  description: 'Die Hardware-Entwicklungsarbeit von RevampIT konzentriert sich auf die Entdeckung neuer Möglichkeiten für ausgemusterte Computer-Hardware, die Optimierung des Energieverbrauchs und die Erstellung von Anleitungen für die Montage von Open-Source-Hardware.'
}

export default function HardwarePage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Hardware-Entwicklung"
        description="Innovative Lösungen für nachhaltiges Computing"
      >
        <div className="flex gap-4 mt-8">
          <Link href="/get-involved/volunteer">
            <Button size="lg" className="bg-white text-green-800 hover:bg-green-50">
              An unseren Projekten teilnehmen
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="ghost" size="lg" className="border border-white text-white hover:bg-white/10">
              Kontakt
            </Button>
          </Link>
        </div>
      </HeroBanner>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-center">Über unsere Hardware-Arbeit</h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              Bei revamp-it konzentrieren wir uns darauf, neue Anwendungen für ausgemusterte Computer-Hardware zu finden,
              die noch voll funktionsfähig ist, aber aufgrund des technologischen Fortschritts nicht mehr für ihren ursprünglichen Zweck geeignet ist.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Hardware-Wiederverwendung</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Neue Funktionalitäten für gebrauchte elektronische Komponenten finden und deren Lebenszyklus verlängern
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Energieoptimierung</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Entwicklung von energie- und ressourceneffizienten Computerlösungen
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Open-Source-Anleitungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Erstellung umfassender Anleitungen für die Montage von Open-Source-Hardware
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Current Projects */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Aktuelle Projekte</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">12V-Stromversorgung für rezyklierte Computer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Entwicklung von Lösungen zum Ersatz von 220V-Netzteilen durch 12V-Alternativen für den Einsatz mit
                    erneuerbaren Energiequellen (Solar-, Wind- oder Pedalkraft).
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Erstellung von Selbstbauanleitungen für 12V-Netzteile</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Maximierung der Nutzung von rezyklierten Komponenten</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Ermöglichung der Computernutzung in Gebieten mit begrenzter Strominfrastruktur</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">EPROM-Wiederverwendung</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Sammeln und Umprogrammieren von BIOS-Chips von alten Motherboards, Erweiterungskarten und Druckern.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Verwendung eines EPROM-Programmiergeräts zur Chip-Umprogrammierung</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Implementierung in Netzwerkkarten mit leeren Sockeln</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Ermöglichung des Netzwerk-Boots für LTSP-Clients</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Interessiert an diesen Chips:</p>
                    <p className="text-sm text-gray-600">27C128, 27C256, 27C512</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Netzteil-Reparatur</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Entwicklung von Fachwissen in der Reparatur von Computer-Netzteilen und dem Austausch von Komponenten.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Fokus auf grosse, leicht austauschbare Komponenten</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Verlängerung der Lebensdauer von teilweise beschädigten Netzteilen</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Erstellung von Reparaturanleitungen und Dokumentationen</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">LCD-Monitor-Reparatur</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Erweiterung unserer Expertise in der Reparatur von Flachbildschirmen mit kleineren Defekten.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Diagnose und Behebung gängiger LCD-Probleme</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Reparaturtechniken auf Komponentenebene</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Dokumentation erfolgreicher Reparaturmethoden</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* SCSI Project */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">SCSI-Kabel-Wiederverwendung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Erforschung neuer Anwendungen für SCSI-Kabel und -Schnittstellen, die einst der Standard
                  für zuverlässige Datenübertragung in Serverumgebungen waren.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Finden neuer Verwendungszwecke für robuste SCSI-Kabel</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Entwicklung alternativer Anwendungen für SCSI-Schnittstellen</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Erstellung von Dokumentationen für Wiederverwendungsmethoden</span>
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
                <h3 className="text-xl font-semibold mb-4">Wissen teilen</h3>
                <p className="text-gray-600 mb-4 flex-grow">Bringen Sie Ihr Fachwissen in der Hardware-Reparatur und -Optimierung ein</p>
                <Link href="/get-involved/volunteer" className="block w-full">
                  <Button variant="outline" className="w-full">Engagieren Sie sich</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Hardware spenden</h3>
                <p className="text-gray-600 mb-4 flex-grow">Spenden Sie alte Hardware für unsere Wiederverwendungsprojekte</p>
                <Link href="/get-involved/donate" className="block w-full">
                  <Button variant="outline" className="w-full">Spenden</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Zusammenarbeiten</h3>
                <p className="text-gray-600 mb-4 flex-grow">Arbeiten Sie mit uns an Hardware-Entwicklungsprojekten</p>
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