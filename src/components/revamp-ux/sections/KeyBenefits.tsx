/**
 * Key Benefits Section
 * @fileoverview Marketing-focused benefits highlighting key value propositions
 */

import { Users, Zap, Shield, TrendingUp } from 'lucide-react'

export function KeyBenefits() {
  const benefits = [
    {
      icon: Users,
      title: 'Direkte Beteiligung',
      description: 'Nutzer können sofort Verbesserungen vorschlagen, ohne technische Kenntnisse.',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Zap,
      title: 'Blitzschnelle Umsetzung',
      description: 'Von Feedback zur Lösung in Minuten statt Wochen. Keine langen Wartezeiten.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Shield,
      title: 'Qualitätssicherung',
      description: 'Automatische Moderation und intelligente Kategorisierung garantieren hohe Qualität.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: TrendingUp,
      title: 'Messbare Ergebnisse',
      description: 'Tracken Sie Verbesserungen und messen Sie die Auswirkungen auf Ihre Nutzer.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Warum Revamp-UX anders ist
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Die Lösung für moderne Website-Optimierung, die wirklich funktioniert.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className={`w-16 h-16 ${benefit.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <benefit.icon className={`w-8 h-8 ${benefit.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Vertraut von führenden Unternehmen
          </h3>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-gray-600 font-semibold">WordPress</div>
            <div className="text-gray-600 font-semibold">Strapi</div>
            <div className="text-gray-600 font-semibold">Contentful</div>
            <div className="text-green-600 font-semibold">Revamp-UX</div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Die Zukunft der Content-Management-Systeme
          </p>
        </div>
      </div>
    </div>
  )
}


