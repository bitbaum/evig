/**
 * Impact Stats Section Component
 *
 * Displays RevampIT's impact metrics using data from the SSOT data layer.
 * Replaces hardcoded stats with verified, documented metrics.
 */

import { Leaf, Users } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { getMetricsByCategory } from '@/data/impact-metrics'

export default function ImpactStatsSection() {
  const environmentalMetrics = getMetricsByCategory('environmental')
  const socialMetrics = getMetricsByCategory('social')

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Heading level={2} className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center">
          Zahlen & Fakten
        </Heading>
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Environmental Impact */}
          <div className="bg-green-50 p-6 sm:p-8 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-600 p-2 rounded-lg">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <Heading level={3} className="text-xl sm:text-2xl font-bold text-green-800">
                Umweltwirkung
              </Heading>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {environmentalMetrics.slice(0, 3).map((metric) => (
                <div key={metric.id}>
                  <p className="text-3xl sm:text-4xl font-bold text-green-700 mb-2">
                    {metric.value}
                  </p>
                  <p className="text-sm sm:text-base text-gray-600">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Social Impact */}
          <div className="bg-green-50 p-6 sm:p-8 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-600 p-2 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <Heading level={3} className="text-xl sm:text-2xl font-bold text-green-800">
                Soziale Wirkung
              </Heading>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {socialMetrics.map((metric) => (
                <div key={metric.id}>
                  <p className="text-3xl sm:text-4xl font-bold text-green-700 mb-2">
                    {metric.value}
                  </p>
                  <p className="text-sm sm:text-base text-gray-600">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Link to full impact page */}
        <div className="text-center mt-8">
          <a
            href="/about/impact"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            Mehr zu unserer Wirkung erfahren
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
