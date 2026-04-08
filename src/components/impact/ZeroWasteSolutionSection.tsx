/**
 * Zero-Waste Solution Section
 *
 * Displays RevampIT's approach to solving the e-waste problem.
 * Green/hopeful theme to show the positive path forward.
 * Presents the Repair > Refurbish > Recycle hierarchy.
 */

import { Wrench, RefreshCw, Recycle, Heart, ArrowDown, CheckCircle } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { ZERO_WASTE_PRINCIPLES, getEnvironmentalSummary, type ZeroWastePrinciple } from '@/data/impact-metrics'

const getIcon = (icon: ZeroWastePrinciple['icon']) => {
  switch (icon) {
    case 'wrench': return <Wrench className="h-8 w-8" />
    case 'refresh': return <RefreshCw className="h-8 w-8" />
    case 'recycle': return <Recycle className="h-8 w-8" />
    case 'heart': return <Heart className="h-8 w-8" />
  }
}

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1: return 'bg-green-600 text-white'
    case 2: return 'bg-green-500 text-white'
    case 3: return 'bg-green-400 text-white'
    case 4: return 'bg-green-300 text-green-900'
    default: return 'bg-green-200 text-green-900'
  }
}

function PrincipleCard({ principle, isLast }: { principle: ZeroWastePrinciple; isLast: boolean }) {
  return (
    <div className="relative">
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${getPriorityColor(principle.priority)}`}>
            {getIcon(principle.icon)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPriorityColor(principle.priority)}`}>
                Priorität {principle.priority}
              </span>
            </div>
            <Heading level={3} className="text-xl font-bold text-gray-900 mb-2">{principle.title}</Heading>
            <p className="text-gray-600">{principle.description}</p>
          </div>
        </div>
      </div>
      {/* Arrow connector */}
      {!isLast && (
        <div className="flex justify-center py-3">
          <ArrowDown className="h-6 w-6 text-green-400" />
        </div>
      )}
    </div>
  )
}

export default function ZeroWasteSolutionSection() {
  const envSummary = getEnvironmentalSummary()
  const sortedPrinciples = [...ZERO_WASTE_PRINCIPLES].sort((a, b) => a.priority - b.priority)

  return (
    <section className="py-20 bg-gradient-to-b from-white to-green-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle className="h-4 w-4" />
            Die Lösung
          </div>
          <Heading level={2} className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Unser Zero-Waste Ansatz
          </Heading>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            RevampIT folgt dem Prinzip: Reparieren vor Aufbereiten vor Recyceln.
            So maximieren wir den Wert jedes Geräts und minimieren Umweltauswirkungen.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Principles Hierarchy */}
          <div className="space-y-0">
            {sortedPrinciples.map((principle, index) => (
              <PrincipleCard
                key={principle.id}
                principle={principle}
                isLast={index === sortedPrinciples.length - 1}
              />
            ))}
          </div>

          {/* Impact Summary */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-green-600 rounded-2xl p-8 text-white">
              <Heading level={3} className="text-2xl font-bold mb-6">Unsere Wirkung durch diesen Ansatz</Heading>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold">{envSummary.devicesSaved}+</span>
                  </div>
                  <div>
                    <p className="font-semibold">Geräte pro Jahr gerettet</p>
                    <p className="text-sm text-white/80">Vor dem Schredder bewahrt und wiederverwendet</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold">{Math.round(envSummary.reuseRate * 100)}%</span>
                  </div>
                  <div>
                    <p className="font-semibold">Wiederverwendungsrate</p>
                    <p className="text-sm text-white/80">Der gespendeten Geräte werden wieder eingesetzt</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold">{envSummary.co2SavedTons}</span>
                  </div>
                  <div>
                    <p className="font-semibold">Tonnen CO₂ eingespart</p>
                    <p className="text-sm text-white/80">Durch Reparatur statt Neuproduktion</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insight */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <Heading level={4} className="font-bold text-gray-900 mb-3">Warum Reparatur zuerst?</Heading>
              <p className="text-gray-600 text-sm mb-4">
                Die Herstellung eines neuen Laptops verursacht durchschnittlich 331 kg CO₂.
                Eine Reparatur verursacht nur etwa 15 kg – eine Einsparung von über 95%.
              </p>
              <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>Die nachhaltigste Option ist immer die Reparatur</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
