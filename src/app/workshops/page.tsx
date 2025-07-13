import { Metadata } from 'next'
import { Calendar, Clock, Users, ArrowRight, Sparkles, CheckCircle2, Briefcase, Rocket } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { WorkshopCard, Workshop } from '@/components/workshops/WorkshopCard'

export const metadata: Metadata = {
  title: 'Unsere Workshops | RevampIT',
  description: 'Nehmen Sie an unseren expertengeleiteten Workshops zu Linux, Open-Source-Software und Computerreparatur teil. Weitere Workshops kommen bald!'
}

const workshops: Workshop[] = [
  {
    title: 'Linux Workshop',
    description: 'Meistern Sie das Linux-Betriebssystem von den Grundlagen bis zu fortgeschrittenen Themen. Lernen Sie über Systemadministration, Kommandozeilen-Tools und Open-Source-Software-Verwaltung.',
    icon: '🐧',
    duration: '2 Tage',
    level: 'Anfänger bis Fortgeschrittene',
    category: 'Betriebssysteme',
    isAvailable: true,
    outcomes: [
      'Linux-Server sicher einrichten und verwalten',
      'Systemaufgaben mit Shell-Scripting automatisieren',
      'Häufige Linux-Probleme professionell lösen',
      'Linux-Umgebung effektiv absichern'
    ]
  },
  {
    title: 'Open-Source-Software',
    description: 'Entdecken Sie die Welt der Open-Source-Software-Entwicklung. Lernen Sie, wie Sie zu Open-Source-Projekten beitragen, Lizenzierung verstehen und in der Gemeinschaft mitarbeiten können.'
    icon: '🔓',
    duration: '1 Tag',
    level: 'Alle Stufen',
    category: 'Entwicklung',
    isAvailable: true,
    outcomes: [
      'Ihren ersten Open-Source-Beitrag leisten',
      'Lizenzierung und Compliance sicher handhaben',
      'Ein starkes Entwickler-Portfolio aufbauen',
      'Open-Source-Gemeinschaften beitreten und darin erfolgreich sein'
    ]
  },
  {
    title: 'Computerreparatur',
    description: 'Lernen Sie grundlegende Hardware-Reparatur- und Wartungsfähigkeiten. Von der Grunddiagnose bis zum Komponententausch - werden Sie sicher im Umgang mit Computerproblemen.'
    icon: '🔧',
    duration: '2 Tage',
    level: 'Anfänger',
    category: 'Hardware',
    isAvailable: true,
    outcomes: [
      'Häufige Hardware-Probleme sicher diagnostizieren und beheben',
      'Computer professionell ausrüsten und warten',
      'Massgeschneiderte PC-Konfigurationen von Grund auf erstellen',
      'Ihr eigenes Computerreparatur-Geschäft starten'
    ]
  },
  {
    title: 'Bitcoin & Blockchain',
    description: 'Verstehen Sie die Grundlagen von Bitcoin, Blockchain-Technologie und Kryptowährungen. Lernen Sie über Wallets, Transaktionen und die Zukunft digitaler Währungen.'
    icon: '₿',
    duration: '1 Tag',
    level: 'Anfänger',
    category: 'Blockchain',
    isAvailable: false,
    comingSoon: true
  },
  {
    title: 'Künstliche Intelligenz',
    description: 'Tauchen Sie ein in die Welt der KI und des maschinellen Lernens. Lernen Sie über neuronale Netzwerke, Datenverarbeitung und praktische Anwendungen der KI-Technologie.'
    icon: '🤖',
    duration: '2 Tage',
    level: 'Fortgeschrittene',
    category: 'KI & ML',
    isAvailable: false,
    comingSoon: true
  },
  {
    title: 'Kreatives Programmieren',
    description: 'Verwandeln Sie Ideen in funktionierende Prototypen mit KI-gestützten Programmier-Workflows und modernem Tech-Stack. Erstellen Sie einen vollständigen Next.js + Supabase MVP in praktischen Sitzungen.'
    icon: '🎨',
    duration: '4 Sitzungen',
    level: 'Anfänger bis Fortgeschrittene',
    category: 'Kreativ',
    isAvailable: false,
    comingSoon: true
  }
]

const benefits = [
  {
    title: 'Praktisches Lernen',
    description: 'Sammeln Sie praktische Erfahrungen mit realen Beispielen und angeleiteten Übungssitzungen'
    icon: Rocket
  },
  {
    title: 'In Ihrem Tempo lernen',
    description: 'Angenehme Lernumgebung mit geduldigen, erfahrenen Instruktoren, die sich an Ihre Bedürfnisse anpassen'
    icon: Briefcase
  },
  {
    title: 'Neue Technologien entdecken',
    description: 'Entdecken und meistern Sie verschiedene Technologiebereiche, die Sie am meisten interessieren'
    icon: Users
  }
]

const WorkshopsPage: React.FC = () => {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Technische Fähigkeiten meistern, Zukunft gestalten</h1>
            <p className="text-xl text-green-100 mb-8">
              Verwandeln Sie Ihre Neugier in praktisches Fachwissen mit unseren praxisorientierten Workshops. Von Linux-Expertise bis zur Computerreparatur - lernen Sie direkt von Branchenexperten in einer unterstützenden Umgebung. Keine Vorerfahrung nötig - bringen Sie einfach Ihre Begeisterung mit!
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                <Users className="w-5 h-5 mr-2" />
                <span>Expertengeleitete Sitzungen</span>
              </div>
              <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                <Clock className="w-5 h-5 mr-2" />
                <span>Praktische Übungen</span>
              </div>
              <div className="flex items-center bg-white/10 rounded-lg px-4 py-2">
                <Calendar className="w-5 h-5 mr-2" />
                <span>Flexibles Lernen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-6">Warum unsere Workshops wählen?</h2>
            <p className="text-lg text-gray-600">
              Unsere Workshops sind darauf ausgelegt, Ihnen praxisnahe Fähigkeiten zu vermitteln, die Sie sofort anwenden können. Ob Sie Ihre Karriere vorantreiben, eine neue beginnen oder einfach Technologie besser verstehen möchten - wir bieten das praktische Wissen und die Erfahrung, die Sie brauchen.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-green-50 transition-colors duration-300">
                <benefit.icon className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Workshops */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Aktuell verfügbare Workshops</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {workshops.filter(w => w.isAvailable).map((workshop, index) => (
              <WorkshopCard key={index} workshop={workshop} variant="available" />
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Workshops */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Bald verfügbar</h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Wir erweitern ständig unser Workshop-Angebot. Hier ist, woran wir als nächstes arbeiten. Bleiben Sie dran für Ankündigungen!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {workshops.filter(w => w.comingSoon).map((workshop, index) => (
              <WorkshopCard key={index} workshop={workshop} variant="coming-soon" />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Was unsere Teilnehmer sagen</h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-xl">
              <p className="text-gray-600 mb-4">"Der Linux-Workshop war eine grossartige Einführung in das Betriebssystem. Der praxisorientierte Ansatz und die geduldigen Instruktoren machten es einfach, die Grundlagen zu verstehen und Vertrauen in die Kommandozeile zu entwickeln."</p>
              <div className="font-semibold">- G.B., Workshop-Teilnehmer</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Bereit, Technologie zu entdecken?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Nehmen Sie an unseren Workshops teil und entdecken Sie die praktische Seite der Technologie. Lernen Sie in Ihrem eigenen Tempo in einer unterstützenden Umgebung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
            >
              Für Workshop anmelden
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
              Dienstleistungen entdecken
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default WorkshopsPage 