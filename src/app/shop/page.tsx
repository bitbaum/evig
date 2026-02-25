import { Metadata } from 'next'
import Link from 'next/link'
import { Store, ShoppingCart, MapPin, Clock, ExternalLink, Map as MapIcon, Shield } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SHOP_ONLINE_URL, SHOPWARE_URL, STORE_ADDRESS, STORE_GOOGLE_MAPS_URL, STORE_OSM_URL } from '@/lib/constants'
import Heading from '@/components/ui/Heading'
import { PageHero } from '@/components/layout/PageHero'

export const metadata: Metadata = {
  title: 'Shop | RevampIT',
  description: 'Wählen Sie, wie Sie bei RevampIT einkaufen möchten – Online-Shop, Shopware-Kanal oder Ladenlokal in Zürich.'
}

// URLs and address centralized in constants

export default function ShopPage() {
  return (
    <main>
      {/* Hero */}
      <PageHero
        theme="services"
        icon={ShoppingCart}
        title="Wie möchtest du einkaufen?"
        subtitle="Wähle den Kanal, der am besten zu dir passt: unseren Online-Shop, den Shopware-Shop oder unser Ladenlokal in Zürich."
      />

      {/* Removed redundant top quick actions – buttons remain inside the cards below */}

      {/* Routing Options */}
      <section className="py-12 sm:py-16 md:py-20 bg-white" id="routing">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Physical Store */}
            <Card className="overflow-hidden border-gray-200">
              <CardHeader className="bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600 text-white flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle id="ladenlokal">Ladenlokal (Zürich)</CardTitle>
                    <p className="text-sm text-gray-600">Beratung, Geräte ansehen, direkt mitnehmen</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 w-5 h-5 text-green-700" />
                  <div>
                    <p className="font-medium text-gray-900">{STORE_ADDRESS}</p>
                    <p className="text-sm text-gray-600">
                      Gut mit ÖV erreichbar. Parkmöglichkeiten in der Nähe.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 w-5 h-5 text-green-700" />
                  <div>
                    <p className="font-medium text-gray-900">Öffnungszeiten</p>
                    <p className="text-sm text-gray-600">Montag: 9:00 – 12:00<br />Dienstag – Freitag: 13:00 – 17:00</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a href={STORE_GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    <MapPin className="w-4 h-4 mr-2" /> In Google Maps öffnen
                  </a>
                  <a href={STORE_OSM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    <MapIcon className="w-4 h-4 mr-2" /> In OpenStreetMap öffnen
                  </a>
                  <Link href="/contact" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    Kontakt
                  </Link>
                </div>
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 w-4 h-4 text-green-700" />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Warum zwei Kartenoptionen?</p>
                      <p>
                        OpenStreetMap ist community‑getrieben und datensparsam. Google/Apple Maps bieten oft bessere Navigation, Live‑Verkehr und POIs. 
                        Wählen Sie, was für Sie am besten passt – Transparenz und Wahlfreiheit sind uns wichtig.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Online & zukünftige Shops */}
            <Card className="overflow-hidden border-gray-200">
              <CardHeader className="bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Online-Shops</CardTitle>
                    <p className="text-sm text-gray-600">
                      Wähle zwischen unserem Online-Shop und dem Shopware-Kanal.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Geprüfte Qualität und Garantie in allen Kanälen</li>
                  <li>Faire Preise, nachhaltige Auswahl</li>
                  <li>Sichere Zahlung</li>
                </ul>
                <div className="flex flex-wrap gap-3 pt-2">
                  {/* Legacy / aktueller Online-Shop */}
                  <a
                    href={SHOP_ONLINE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Aktueller Online‑Shop
                  </a>
                  {/* Shopware */}
                  <a href={SHOPWARE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    <ExternalLink className="w-4 h-4 mr-2" /> Zum Shopware‑Shop
                  </a>
                  {/* RevampIT Online-Shop */}
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" /> RevampIT Online‑Shop
                  </Link>
                </div>
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 w-4 h-4 text-blue-700" />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Mehrere Shop‑Kanäle?</p>
                      <p>
                        Unser RevampIT Online-Shop bietet dir die beste Auswahl an aufgearbeiteter IT-Hardware. 
                        Alternativ findest du unser Sortiment auch im Shopware-Shop und im Legacy-System.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
