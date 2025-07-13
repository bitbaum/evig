import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Server, Users, Settings, CheckCircle, Rocket, Phone } from 'lucide-react'
import React from 'react'

const cardClass = 'bg-white rounded-2xl shadow-sm p-8 flex flex-col items-start gap-4 hover:shadow-md transition-shadow duration-300'

export const metadata: Metadata = {
  title: 'LTSP - Linux Terminal Server Project',
  description: 'Das Linux Terminal Server Project ermöglicht es mehreren Benutzern, gleichzeitig an älteren Computern zu arbeiten, indem sie mit einem leistungsstarken Server verbunden werden, was die Ressourcennutzung optimiert und die Lebensdauer der Hardware verlängert.'
}

export default function LTSPPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <HeroBanner
        title="LTSP - Linux Terminal Server Project"
        description="Verlängerung der Lebensdauer älterer Computer durch serverbasiertes Computing"
        className="bg-gradient-to-r from-green-600 to-blue-700"
      />

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className={cardClass}>
              <Server className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold">Über LTSP</h2>
              <p>
                Das Linux Terminal Server Project (LTSP) ermöglicht es mehreren Benutzern, gleichzeitig an älteren Computern zu arbeiten, indem sie mit einem leistungsstarken Server verbunden werden. Dies optimiert die Ressourcennutzung und verlängert die Lebensdauer der Hardware.
              </p>
            </div>
            <div className={cardClass}>
              <Settings className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold">Wie es funktioniert</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Anwendungen laufen auf einem zentralen Server</li>
                <li>Thin Clients oder alte PCs fungieren als Terminals</li>
                <li>Effizientes Ressourcenmanagement</li>
                <li>Konsistente Benutzererfahrung</li>
                <li>Minimale Anforderungen an die Client-Rechner</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className={cardClass}>
              <CheckCircle className="w-8 h-8 text-green-500" />
              <h2 className="text-xl font-semibold">Vorteile</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Verlängerung der Hardware-Lebensdauer</li>
                <li>Reduzierung der Wartungskosten</li>
                <li>Zentralisierte Verwaltung & Updates</li>
                <li>Verbesserte Sicherheit</li>
                <li>Geringerer Energieverbrauch</li>
              </ul>
            </div>
            <div className={cardClass}>
              <Rocket className="w-8 h-8 text-blue-500" />
              <h2 className="text-xl font-semibold">Implementierung</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Server-Einrichtung & Konfiguration</li>
                <li>Client-Vorbereitung</li>
                <li>Netzwerkoptimierung</li>
                <li>Benutzerverwaltung & Sicherheit</li>
                <li>Laufender Support</li>
              </ul>
            </div>
            <div className={cardClass}>
              <Users className="w-8 h-8 text-green-700" />
              <h2 className="text-xl font-semibold">Anwendungsfälle</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Schulen & Bildung</li>
                <li>Öffentliche Computerräume</li>
                <li>Unternehmen</li>
                <li>Gemeindezentren</li>
                <li>Gemeinnützige Organisationen</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className={cardClass}>
              <h2 className="text-xl font-semibold">Erste Schritte</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Bewertung Ihrer Infrastruktur</li>
                <li>Planung Ihrer Implementierung</li>
                <li>Einrichtung von Server & Clients</li>
                <li>Schulung der Mitarbeiter</li>
                <li>Laufender Support</li>
              </ul>
            </div>
            <div className={cardClass}>
              <Phone className="w-8 h-8 text-blue-700" />
              <h2 className="text-xl font-semibold">Kontaktieren Sie uns</h2>
              <p>
                Möchten Sie mehr darüber erfahren, wie LTSP Ihrer Organisation zugute kommen kann? <br />
                <a href="/contact" className="text-blue-700 underline font-medium">Kontaktieren Sie uns</a>, um Ihre Bedürfnisse zu besprechen und wie wir Ihnen bei der Implementierung dieser leistungsstarken Lösung helfen können.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 