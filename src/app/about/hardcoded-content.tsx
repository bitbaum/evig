import Image from 'next/image'
import { HeroBanner } from '@/components/ui/hero-banner'

export default function HardcodedAboutPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Technik ein zweites Leben geben"
        description="Seit 15 Jahren setzen wir uns gegen die vorschnelle Ausmusterung von Computern ein und fördern nachhaltige IT-Praktiken."
      />

      {/* Mission Section */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold">Unsere Mission</h2>
          <div className="space-y-6">
            <p className="text-lg">
              Bei RevampIT glauben wir an das Motto "10 Jahre sind das Minimum für ein Velo – und für einen Laptop auch!" Als gemeinnütziger Verein verändern wir seit 2009 den Umgang mit Technik. Unsere Mission ist klar: Die Lebensdauer von IT-Geräten verlängern und Elektroschrott durch Reparatur, Wiederaufbereitung und nachhaltige Praktiken reduzieren.
            </p>
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden my-8">
              <Image
                src="/images/Article Pics/storefront.png"
                alt="RevampIT Schaufenster mit Computern und Geräten"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>
            <p className="text-lg">
              In unseren Räumlichkeiten – einer ehemaligen Bank – haben wir einen Treffpunkt geschaffen, wo Technik und Nachhaltigkeit zusammenkommen. Unser Ansatz verbindet Hardware-Recycling mit Open Source-Software und schafft so nachhaltige IT-Lösungen für Mensch und Umwelt.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Areas */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Unsere Wirkung</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Hardware-Recycling</h3>
              <p className="text-lg">
                Wir reparieren und überholen IT-Geräte jeden Alters und schenken ihnen ein zweites Leben. So reduzieren wir Elektroschrott und ermöglichen Zugang zu Technik für alle. Von alten MacBooks bis zu Vintage-Computern – jedes Gerät verdient eine zweite Chance.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Open Source-Software</h3>
              <p className="text-lg">
                Wir setzen auf Linux und andere Open Source-Lösungen. Diese Technologien halten ältere Geräte effizient am Laufen und bieten Sicherheit durch Kontrolle über das eigene System. In unseren Workshops vermitteln wir praxisnahes Wissen rund um nachhaltige IT.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Gemeinschaft & Soziales</h3>
              <p className="text-lg">
                Wir schaffen sinnvolle Arbeitsplätze für Menschen, die es auf dem regulären Arbeitsmarkt schwer haben. Mit unserem Tauschsystem kann man Dienstleistungen (z.B. einen Haarschnitt) gegen Technik tauschen. Zudem bieten wir Hosting und Cloud-Services für Schweizer KMU, die ihre Daten in der Schweiz behalten möchten.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* By the Numbers Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Zahlen & Fakten</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Umweltwirkung</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">5+</p>
                  <p className="text-gray-600">Durchschnittliche Lebensdauerverlängerung pro Gerät (in Jahren)</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">1000+</p>
                  <p className="text-gray-600">Geräte, die wir jährlich vor dem Entsorgen retten</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">75%</p>
                  <p className="text-gray-600">Anteil der gespendeten Geräte, die wir erfolgreich wiederverwenden</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Soziale Wirkung</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">20+</p>
                  <p className="text-gray-600">Personen, die wir jährlich in Open Source und nachhaltiger IT schulen</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">90%</p>
                  <p className="text-gray-600">Unserer Praktikant:innen finden den Einstieg in die IT oder eine Weiterbildung</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">10+</p>
                  <p className="text-gray-600">Erfolgreiche Wiedereinstiege ins Berufsleben durch unser Programm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold">Unsere Geschichte</h2>
          <div className="space-y-6 text-lg">
            <p>
              2009 als kleine Reparaturwerkstatt gegründet, ist RevampIT heute eine Bewegung, die den Umgang mit Technik nachhaltig verändert. Was mit einer einfachen Idee begann – Technik länger nutzen – ist heute ein Vorbild für nachhaltige IT in der Schweiz.
            </p>
            <p>
              Unser Team aus 20 engagierten Menschen setzt sich täglich für nachhaltige IT ein. Wir sind Anlaufstelle für Privatpersonen und Unternehmen, die ihren ökologischen Fussabdruck reduzieren und trotzdem auf zuverlässige Technik setzen wollen.
            </p>
            <p>
              Unser Engagement geht über Reparaturen hinaus: Wir beteiligen uns an Klimademos, teilen Wissen zu nachhaltigen digitalen Alternativen und setzen uns für einen bewussteren Umgang mit Technik ein.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Werde Teil unserer Mission</h2>
          <p className="text-xl mb-8">
            Ob du ein Gerät reparieren lassen möchtest, mehr über nachhaltige IT erfahren willst oder unsere Sache unterstützen möchtest – bei uns bist du willkommen. Gemeinsam machen wir Technik nachhaltiger und zugänglicher für alle.
          </p>
          <a
            href="/get-involved"
            className="inline-block bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Mitmachen
          </a>
        </div>
      </section>
    </main>
  )
} 