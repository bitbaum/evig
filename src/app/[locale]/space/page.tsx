import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin,
  Clock,
  Store,
  Wrench,
  Users,
  BookOpen,
  Coffee,
  UtensilsCrossed,
  Heart,
  TrendingUp,
  Calendar,
  ChevronRight,
  ExternalLink,
  Building2,
  Sparkles,
  Target,
  Leaf
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { STORE_ADDRESS, STORE_GOOGLE_MAPS_URL, STORE_OSM_URL } from '@/lib/constants'
import { ORG, LOCATIONS } from '@/config/org'

export const metadata: Metadata = {
  title: `Unsere Standorte | ${ORG.name}`,
  description: 'Von der Toni Molkerei bis heute - die Geschichte unserer Standorte und unsere Vision für einen neuen Community Space in Zürich.',
}

// Location history data
const locationHistory = [
  {
    period: '2003 - 2008',
    name: 'Toni Molkerei',
    description: 'Unser Geburtsort im alten Käsekeller. Hier fand das legendäre Debian 10-Jahre-Jubiläum auf dem Dach statt.',
    highlight: 'Gründungsort'
  },
  {
    period: '2008 - 2012',
    name: 'Reformierte Kirche Wipkingen',
    description: 'Im 6./7. Stock des Kirchturms und Kellerabteilen. Hier starteten unsere ersten Sozialprojekte.',
    highlight: 'Soziale Projekte'
  },
  {
    period: '2012 - 2015',
    name: 'Röschibachstrasse',
    description: 'Grosser Raum mit vielen Arbeitsplätzen. Expansion unserer Werkstatt.',
    highlight: 'Expansion'
  },
  {
    period: '2015 - heute',
    name: LOCATIONS.store.street,
    description: `Unser aktuelles Ladenlokal mit Werkstatt. Zusätzliches Lager an der ${LOCATIONS.warehouse.street}.`,
    highlight: 'Aktuell',
    current: true
  }
]

// Future space features
const spaceFeatures = [
  {
    icon: Store,
    name: 'Shop-Bereich',
    description: 'Ausstellungsfläche für aufbereitete Geräte mit Beratung'
  },
  {
    icon: Wrench,
    name: 'Reparatur-Werkstatt',
    description: 'Arbeitsplätze für Techniker:innen und Community-Reparaturen'
  },
  {
    icon: Users,
    name: 'Coworking',
    description: 'Flexible Arbeitsplätze für unsere Community'
  },
  {
    icon: Calendar,
    name: 'Event-Raum',
    description: 'Platz für Workshops, Meetups und kleine Veranstaltungen (15-20 Personen)'
  },
  {
    icon: BookOpen,
    name: 'Mini-Bibliothek',
    description: 'Einige Regale mit Tech-Büchern, Zeitschriften und Ressourcen'
  },
  {
    icon: Coffee,
    name: 'Kaffee-Ecke',
    description: 'Treffpunkt für informellen Austausch und Networking'
  },
  {
    icon: UtensilsCrossed,
    name: 'Küche',
    description: 'Vollausgestattete Küche für Zero Food Waste Initiativen'
  },
  {
    icon: Leaf,
    name: 'Zero Food Waste',
    description: 'Gerettete Lebensmittel für Community-Mittagessen'
  }
]

// KPI impact of better space
const kpiImpact = [
  {
    metric: 'Geräte pro Jahr',
    current: '~500',
    potential: '2\'000+',
    reason: 'Mehr Werkstattplätze = mehr Kapazität'
  },
  {
    metric: 'Workshop-Teilnehmer',
    current: '~100',
    potential: '500+',
    reason: 'Eigener Event-Raum für regelmässige Kurse'
  },
  {
    metric: 'Community-Mitglieder',
    current: '~50',
    potential: '200+',
    reason: 'Coworking zieht mehr Freiwillige an'
  },
  {
    metric: 'Soziale Integration',
    current: '~10',
    potential: '30+',
    reason: 'Mehr Praktikumsplätze durch grössere Räume'
  }
]

export default function SpacePage() {
  return (
    <main>
      <PageHero
        theme="about"
        icon={Building2}
        title="Von der Molkerei zum Community Space"
        subtitle="Seit 2003 bewegen wir uns durch Zürich. Jetzt suchen wir ein neues Zuhause - einen Ort, an dem Nachhaltigkeit, Technologie und Gemeinschaft zusammenkommen."
      >
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link href="#zukunft">
            <Button size="lg" className="bg-green-600 text-white hover:bg-green-700">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Unsere Vision
                </Button>
              </Link>
              <Link href="/get-involved/donate">
                <Button size="lg" variant="outline-light">
                  <Heart className="w-5 h-5 mr-2" />
                  Standort-Budget unterstützen
                </Button>
              </Link>
            </div>
      </PageHero>

      {/* Timeline / History */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Heading level={2} className="text-3xl md:text-4xl mb-4">Unsere Reise durch Zürich</Heading>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Über 20 Jahre, mehrere Standorte, eine Mission: Technologie nachhaltig nutzen.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-green-200 hidden md:block" />

              <div className="space-y-8">
                {locationHistory.map((location, index) => (
                  <div key={index} className="relative flex gap-6 md:gap-8">
                    {/* Timeline dot */}
                    <div className={`hidden md:flex w-16 h-16 rounded-full items-center justify-center flex-shrink-0 z-10 ${
                      location.current
                        ? 'bg-green-600 text-white'
                        : 'bg-white border-2 border-green-300 text-green-700'
                    }`}>
                      <MapPin className="w-6 h-6" />
                    </div>

                    <Card className={`flex-1 ${location.current ? 'ring-2 ring-green-500' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="text-sm font-medium text-green-600 mb-1">{location.period}</p>
                            <CardTitle className="text-xl">{location.name}</CardTitle>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            location.current
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {location.highlight}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{location.description}</p>
                        {location.current && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm font-medium text-gray-900 mb-2">{STORE_ADDRESS}</p>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={STORE_GOOGLE_MAPS_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-green-600 hover:text-green-700 inline-flex items-center"
                              >
                                Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                              <span className="text-gray-300">|</span>
                              <a
                                href={STORE_OSM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-green-600 hover:text-green-700 inline-flex items-center"
                              >
                                OpenStreetMap <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Location Quick Info */}
      <section className="py-12 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Store className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Aktuelles Ladenlokal</p>
                <p className="text-gray-600">{STORE_ADDRESS}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Öffnungszeiten</p>
                <p className="text-gray-600">Mo: 9-12 | Di-Fr: 13-17</p>
              </div>
            </div>
            <Link href="/shop#ladenlokal">
              <Button variant="outline">
                Mehr zum Ladenlokal <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Future Space Vision */}
      <section id="zukunft" className="py-16 md:py-24 bg-gradient-to-b from-white to-green-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full mb-6">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Umzug bis Ende 2026</span>
            </div>
            <Heading level={2} className="text-3xl md:text-4xl mb-4">Unser Traumlokal</Heading>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Wir müssen unser aktuelles Lokal bis Ende 2026 verlassen.
              Das ist unsere Chance, etwas Grösseres zu schaffen.
            </p>
          </div>

          {/* Vision Image Placeholder */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="relative aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded-2xl overflow-hidden border-2 border-green-300">
              {/* Replace this div with actual AI-generated image */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <Sparkles className="w-16 h-16 text-green-600 mb-4" />
                <p className="text-xl font-semibold text-green-800 mb-2">
                  Vision: {ORG.name} Community Space
                </p>
                <p className="text-green-700 max-w-md">
                  Ein offener Raum wo Technologie, Nachhaltigkeit und Gemeinschaft zusammenkommen.
                  Shop, Werkstatt, Coworking, Events - alles unter einem Dach.
                </p>
              </div>
              {/* Uncomment when image is ready:
              <Image
                src="/images/future-space-vision.jpg"
                alt="Vision für den neuen RevampIT Community Space"
                fill
                className="object-cover"
              />
              */}
            </div>
            <p className="text-sm text-gray-500 text-center mt-3">
              Konzept-Visualisierung unseres idealen Community Space
            </p>
          </div>

          {/* Space Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-16">
            {spaceFeatures.map((feature, index) => (
              <Card key={index} className="text-center p-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-green-700" />
                </div>
                <Heading level={3} className="font-semibold text-gray-900 mb-1">{feature.name}</Heading>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* Parameters */}
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Was wir suchen
              </CardTitle>
              <CardDescription>
                Die Parameter für unseren idealen Standort
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-700 mb-1">250+ m²</p>
                  <p className="text-sm text-gray-600">Nutzfläche</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-700 mb-1">CHF 6\'000</p>
                  <p className="text-sm text-gray-600">Budget pro Monat</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-700 mb-1">Zürich</p>
                  <p className="text-sm text-gray-600">Standort</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Ideal wäre:</strong> Erdgeschoss oder gut erreichbar, rollstuhlgängig,
                  Laderampe oder Anlieferungsmöglichkeit, in einem lebendigen Quartier mit guter ÖV-Anbindung.
                </p>
              </div>
              <div className="mt-4 text-center">
                <p className="text-gray-600 mb-4">
                  Kennst du einen passenden Raum? Wir freuen uns über jeden Hinweis!
                </p>
                <Link href="/contact">
                  <Button>
                    Kontaktiere uns
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* KPI Impact / Why Donate */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Heading level={2} className="text-3xl md:text-4xl mb-4">
                Warum ein grösserer Raum mehr Wirkung bedeutet
              </Heading>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Mit mehr Platz können wir unsere KPIs vervielfachen -
                mehr Geräte retten, mehr Menschen ausbilden, mehr Wirkung erzielen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {kpiImpact.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          {item.metric}
                        </p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex items-end gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Heute</p>
                        <p className="text-2xl font-bold text-gray-400">{item.current}</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-green-500 mb-2" />
                      <div>
                        <p className="text-sm text-green-600">Potenzial</p>
                        <p className="text-2xl font-bold text-green-700">{item.potential}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{item.reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Donation CTA */}
            <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
              <CardContent className="p-8 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-90" />
                <Heading level={3} className="text-2xl mb-3">
                  Unterstütze unser Standort-Budget
                </Heading>
                <p className="text-green-100 max-w-xl mx-auto mb-6">
                  Mit einem grösseren Budget können wir einen besseren Standort finden -
                  und damit unsere Wirkung für Umwelt und Gesellschaft vervielfachen.
                  Jeder Beitrag hilft uns, unseren Traum vom Community Space zu verwirklichen.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/get-involved/donate">
                    <Button size="lg" className="bg-white text-green-700 hover:bg-green-50">
                      <Heart className="w-5 h-5 mr-2" />
                      Jetzt spenden
                    </Button>
                  </Link>
                  <Link href="/about/impact">
                    <Button size="lg" variant="outline-light">
                      Unsere Wirkung ansehen
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Links to Shop Options */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <Heading level={3} className="text-xl mb-2">Alle Einkaufsmöglichkeiten</Heading>
            <p className="text-gray-600">Physisch und online - wähle, was am besten passt.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/shop#ladenlokal">
              <Button variant="outline">
                <Store className="w-4 h-4 mr-2" /> Aktuelles Ladenlokal
              </Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline">
                <Store className="w-4 h-4 mr-2" /> Shop-Übersicht
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button>
                Online-Shop <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
