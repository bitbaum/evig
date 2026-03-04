/**
 * Comparison Table Section
 * @fileoverview Simplified comparison focusing on key benefits
 */

import { Check, X } from 'lucide-react'

interface ComparisonItem {
  feature: string
  revamp: string | boolean
  others: string | boolean
}

export function ComparisonTable() {
  const comparisons: ComparisonItem[] = [
    {
      feature: 'Direktes Nutzer-Feedback',
      revamp: true,
      others: 'Plugins nötig'
    },
    {
      feature: 'Kontext-Erfassung',
      revamp: true,
      others: false
    },
    {
      feature: 'Schnelle Umsetzung',
      revamp: 'Minuten',
      others: 'Wochen'
    },
    {
      feature: 'Technisches Know-how nötig',
      revamp: false,
      others: true
    },
    {
      feature: 'Automatische Moderation',
      revamp: true,
      others: false
    }
  ]

  return (
    <div className="py-16 sm:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Vergleich mit anderen Systemen
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Warum Revamp-UX die überlegene Wahl ist.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {/* Header */}
              <div className="bg-gray-100 p-6 font-semibold text-gray-900 border-b border-gray-200">
                Funktion
              </div>
              <div className="bg-green-50 p-6 font-semibold text-green-700 border-b border-gray-200">
                Revamp-UX
              </div>
              <div className="bg-gray-100 p-6 font-semibold text-gray-600 border-b border-gray-200">
                Andere CMS
              </div>

              {/* Rows */}
              {comparisons.map((item, index) => (
                <div key={index} className="contents">
                  <div className={`p-4 border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    {item.feature}
                  </div>
                  <div className={`p-4 border-b border-gray-100 text-center ${index % 2 === 0 ? 'bg-green-50' : 'bg-white'}`}>
                    {typeof item.revamp === 'boolean' ? (
                      item.revamp ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-green-700 font-medium">{item.revamp}</span>
                    )}
                  </div>
                  <div className={`p-4 border-b border-gray-100 text-center ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    {typeof item.others === 'boolean' ? (
                      item.others ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-600">{item.others}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              Revamp-UX ist das einzige System, das Nutzer-Feedback nahtlos in den Entwicklungsprozess integriert.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


