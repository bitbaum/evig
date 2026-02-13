import Image from 'next/image'
import { PageHero } from '@/components/layout/PageHero'
import { AboutSubNav, GeschichteSection, ImpactStatsSection } from '@/components/about'
import { Target, Recycle, Code, Users, Quote, Leaf } from 'lucide-react'
import Heading from '@/components/ui/Heading'

export default function HardcodedAboutPage() {
  return (
    <main className="min-h-screen">
      <PageHero
        theme="about"
        icon={Leaf}
        title="Technik ein zweites Leben geben"
        subtitle="Seit über 20 Jahren setzen wir uns gegen die vorschnelle Ausmusterung von Computern ein und fördern nachhaltige IT-Praktiken."
      />

      {/* Sub Navigation */}
      <AboutSubNav />

      {/* Mission Section - Redesigned */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Target className="h-4 w-4" />
              Unsere Mission
            </div>
            <Heading level={2} className="text-gray-900 mb-4">
              Nachhaltigkeit trifft Technologie
            </Heading>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image Column */}
            <div className="relative">
              <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/Article Pics/storefront.png"
                  alt="RevampIT Schaufenster mit Computern und Geräten"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-green-600 text-white p-4 rounded-xl shadow-lg hidden md:block">
                <p className="text-3xl font-bold">20+</p>
                <p className="text-sm">Jahre Erfahrung</p>
              </div>
            </div>

            {/* Content Column */}
            <div className="space-y-6">
              {/* Quote Box */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-xl">
                <Quote className="h-8 w-8 text-green-500 mb-3" />
                <p className="text-xl md:text-2xl font-medium text-gray-800 italic">
                  "10 Jahre sind das Minimum für ein Velo – und für einen Laptop auch!"
                </p>
              </div>

              <p className="text-lg text-gray-600 leading-relaxed">
                Als gemeinnütziger Verein verändern wir seit 2003 den Umgang mit Technik.
                Unsere Mission ist klar: <strong className="text-gray-900">Die Lebensdauer von IT-Geräten verlängern</strong> und
                Elektroschrott durch Reparatur, Wiederaufbereitung und nachhaltige Praktiken reduzieren.
              </p>

              <p className="text-lg text-gray-600 leading-relaxed">
                In unseren Räumlichkeiten – einer ehemaligen Bank – haben wir einen Treffpunkt geschaffen,
                wo Technik und Nachhaltigkeit zusammenkommen. Unser Ansatz verbindet Hardware-Recycling
                mit Open Source-Software und schafft so nachhaltige IT-Lösungen für Mensch und Umwelt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Areas - Redesigned */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Heading level={2} className="text-gray-900 mb-4">Unsere Wirkungsbereiche</Heading>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Drei Säulen, ein Ziel: Technologie nachhaltiger und zugänglicher machen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 - Hardware Recycling */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:scale-110 transition-all duration-300">
                <Recycle className="h-7 w-7 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hardware-Recycling</h3>
              <p className="text-gray-600 leading-relaxed">
                Wir reparieren und überholen IT-Geräte jeden Alters und schenken ihnen ein zweites Leben.
                Von alten MacBooks bis zu Vintage-Computern – jedes Gerät verdient eine zweite Chance.
              </p>
            </div>

            {/* Card 2 - Open Source */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300">
                <Code className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Open Source-Software</h3>
              <p className="text-gray-600 leading-relaxed">
                Wir setzen auf Linux und andere Open Source-Lösungen. Diese Technologien halten ältere
                Geräte effizient am Laufen und bieten Sicherheit durch Kontrolle über das eigene System.
              </p>
            </div>

            {/* Card 3 - Community */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:scale-110 transition-all duration-300">
                <Users className="h-7 w-7 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gemeinschaft & Soziales</h3>
              <p className="text-gray-600 leading-relaxed">
                Wir schaffen sinnvolle Arbeitsplätze für Menschen, die es auf dem regulären Arbeitsmarkt
                schwer haben. Mit unserem Tauschsystem kann man Dienstleistungen gegen Technik tauschen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* By the Numbers Section - Data from SSOT */}
      <ImpactStatsSection />

      {/* Our Story - Full Timeline */}
      <GeschichteSection />

      {/* Call to Action */}
      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Heading level={2} className="mb-6">Werde Teil unserer Mission</Heading>
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
