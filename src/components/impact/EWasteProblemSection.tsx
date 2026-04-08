/**
 * E-Waste Problem Section
 *
 * Displays the global e-waste crisis with verified statistics.
 * Red/urgent theme to convey the severity of the problem.
 * All statistics have verified sources displayed.
 */

import { AlertTriangle, ExternalLink, Globe, Recycle, Laptop, Scale } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { EWASTE_GLOBAL_STATS, type EWasteStat } from '@/data/impact-metrics'

const getStatIcon = (id: string) => {
  switch (id) {
    case 'global-total': return <Globe className="h-8 w-8" />
    case 'recycling-rate': return <Recycle className="h-8 w-8" />
    case 'europe-per-capita': return <Scale className="h-8 w-8" />
    case 'laptop-co2': return <Laptop className="h-8 w-8" />
    default: return <AlertTriangle className="h-8 w-8" />
  }
}

function StatCard({ stat }: { stat: EWasteStat }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/20 rounded-lg text-white">
          {getStatIcon(stat.id)}
        </div>
        <div className="flex-1">
          <div className="text-4xl font-bold text-white mb-1">
            {stat.value}
            <span className="text-lg font-normal ml-2 text-white/80">{stat.unit}</span>
          </div>
          <Heading level={3} className="text-lg font-semibold text-white/90 mb-2">{stat.label}</Heading>
          <p className="text-sm text-white/70 mb-3">{stat.description}</p>
          <a
            href={stat.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {stat.source} ({stat.year})
          </a>
        </div>
      </div>
    </div>
  )
}

export default function EWasteProblemSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-red-700 via-red-600 to-red-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full" />
        <div className="absolute bottom-20 right-20 w-60 h-60 border-2 border-white rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-20 h-20 border-2 border-white rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <AlertTriangle className="h-4 w-4" />
            Das Problem
          </div>
          <Heading level={2} className="text-4xl md:text-5xl font-bold text-white mb-6">
            Die E-Waste Krise
          </Heading>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Elektroschrott ist der am schnellsten wachsende Abfallstrom der Welt.
            Die Zahlen zeigen das Ausmass des Problems – und warum Handeln dringend nötig ist.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {EWASTE_GLOBAL_STATS.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>

        {/* Key Message */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
          <p className="text-2xl md:text-3xl font-semibold text-white mb-4">
            Weniger als ein Viertel aller Elektrogeräte werden korrekt recycelt.
          </p>
          <p className="text-lg text-white/80">
            Der Rest landet auf Deponien, wird illegal exportiert oder unsachgemäss verarbeitet –
            mit verheerenden Folgen für Mensch und Umwelt.
          </p>
        </div>
      </div>
    </section>
  )
}
