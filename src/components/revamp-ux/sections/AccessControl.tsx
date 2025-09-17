/**
 * Access Control Section
 * @fileoverview Marketing-focused access control options
 */

import { Users, Shield, Brain } from 'lucide-react'

export function AccessControl() {
  const options = [
    {
      icon: Users,
      title: 'Öffentlich',
      description: 'Perfekt für Community-getriebene Projekte',
      features: ['Kein Login nötig', 'Maximale Beteiligung', 'Natürliche Moderation']
    },
    {
      icon: Shield,
      title: 'Registriert',
      description: 'Geeignet für Member- oder Kundenbereiche',
      features: ['Account-Verifikation', 'Qualitätskontrolle', 'Personalisierte Erfahrung']
    },
    {
      icon: Brain,
      title: 'Team-Only',
      description: 'Für interne Verbesserungsprozesse',
      features: ['Schnelle Iteration', 'Qualitätsfokus', 'Direkte Kommunikation']
    }
  ]

  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Flexibler Zugriff
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Passen Sie das System an Ihre Bedürfnisse an - von öffentlich bis team-intern.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {options.map((option, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <option.icon className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {option.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {option.description}
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                {option.features.map((feature, idx) => (
                  <li key={idx}>• {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 max-w-2xl mx-auto">
            Wählen Sie das Modell, das zu Ihrer Organisation passt. Das System skaliert mit Ihren Anforderungen.
          </p>
        </div>
      </div>
    </div>
  )
}
