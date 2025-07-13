import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareButton } from '@/components/ui/share-button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Verein Linuxola',
  description: 'Linuxola ist eine Schweizer Organisation, die sich dem Zugang zu Informationstechnologie und der Anbindung afrikanischer Partner an die globalen digitalen Gemeingüter widmet.'
}

export default function LinuxolaPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Verein Linuxola"
        description="Die digitale Kluft zwischen der Schweiz und Afrika überbrücken"
      >
        <div className="flex gap-4 mt-8">
          <Link href="/get-involved/donate">
            <Button size="lg" className="bg-white text-green-800 hover:bg-green-50">
              Ausrüstung spenden
            </Button>
          </Link>
          <Link href="/get-involved/volunteer">
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Freiwillig engagieren
            </Button>
          </Link>
        </div>
      </HeroBanner>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Über Linuxola</h2>
            <p className="text-xl text-gray-600">
              Der Verein Linuxola wurde am 2. Dezember 2005 von acht Personen aus verschiedenen
              Regionen der Schweiz gegründet. Zweck des Vereins ist es, unseren
              Partnern in Afrika den Zugang zur Informationstechnologie und eine Anbindung an die globalen digitalen
              Gemeingüter zu ermöglichen.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Impact Cards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Unsere Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Bereitstellung von Zugang zu Technologie und Schulungen</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Unterstützung nachhaltiger IT-Infrastruktur</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Förderung von Open-Source-Lösungen</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Aufbau langfristiger Partnerschaften</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Unsere Wirkung</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Einrichtung von Computerräumen in Schulen und Gemeinden</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Ausbildung lokaler IT-Fachkräfte</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Implementierung nachhaltiger Technologielösungen</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Schaffung dauerhafter Partnerschaften mit afrikanischen Organisationen</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Equipment Needs Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Benötigte Ausrüstung</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Computer & Laptops</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Laptops (3-5 Jahre alt)</li>
                    <li>• Desktop-PCs</li>
                    <li>• Monitore</li>
                    <li>• Tastaturen & Mäuse</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Netzwerk</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Netzwerk-Switches</li>
                    <li>• WLAN-Router</li>
                    <li>• Netzwerkkabel</li>
                    <li>• USV-Systeme</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Zubehör</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>• USB-Sticks</li>
                    <li>• Externe Festplatten</li>
                    <li>• Netzteile</li>
                    <li>• RAM-Module</li>
                  </ul>
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
            <h2 className="text-4xl font-bold mb-8">Machen Sie mit</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Ausrüstung spenden</h3>
                <p className="text-gray-600 mb-4 flex-grow">Ihre gebrauchte IT-Ausrüstung kann in afrikanischen Gemeinden einen echten Unterschied machen</p>
                <Link href="/get-involved/donate" className="block w-full">
                  <Button variant="outline" className="w-full">Jetzt spenden</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Freiwillig engagieren</h3>
                <p className="text-gray-600 mb-4 flex-grow">Teilen Sie Ihr technisches Fachwissen und helfen Sie beim Aufbau von Computerräumen</p>
                <Link href="/get-involved/volunteer" className="block w-full">
                  <Button variant="outline" className="w-full">Engagieren Sie sich</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Weitersagen</h3>
                <p className="text-gray-600 mb-4 flex-grow">Helfen Sie uns, mehr potenzielle Spender und Freiwillige zu erreichen</p>
                <ShareButton 
                  className="w-full"
                  text="Unterstützen Sie Linuxola bei der Überbrückung der digitalen Kluft zwischen der Schweiz und Afrika! Erfahren Sie mehr über ihre Mission und wie Sie helfen können."
                  url="https://revampit.ch/projects/linuxola"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Treten Sie unserer Mission bei</h2>
            <p className="text-xl mb-8">
              Ob Sie Ausrüstung spenden, technische Fähigkeiten teilen oder unsere Sache auf andere Weise unterstützen möchten,
              wir würden uns freuen, von Ihnen zu hören. Gemeinsam können wir die digitale Kluft überbrücken.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/contact">
                <Button variant="secondary" size="lg">
                  Kontaktieren Sie uns
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Mehr erfahren
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 