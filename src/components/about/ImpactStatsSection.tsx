/**
 * Impact Stats Section Component
 *
 * Displays live impact metrics fetched from the DB at render time.
 * Falls back to static estimates if DB is unavailable.
 */

import { Leaf, Users } from 'lucide-react'
import Link from 'next/link'
import Heading from '@/components/ui/Heading'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { CATEGORY_WEIGHT_KG, CO2_PER_KG } from '@/config/co2-impact'
import { getDefaultNumeric } from '@/lib/org-numbers.defaults'
import { logger } from '@/lib/logger'

async function fetchImpactStats() {
  try {
    const [listingRows, repairRows, userRows] = await Promise.all([
      query<{ category: string; status: string; count: string }>(
        `SELECT category, status, COUNT(*) as count
         FROM ${TABLE_NAMES.LISTINGS}
         WHERE status != 'removed'
         GROUP BY category, status`
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.IT_HILFE_REQUESTS}`
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}`
      ),
    ])

    let totalDevices = 0
    let soldDevices = 0
    let co2SavedKg = 0

    for (const row of listingRows.rows) {
      const count = Number(row.count)
      totalDevices += count
      if (row.status === 'sold') {
        soldDevices += count
        const weightKg = CATEGORY_WEIGHT_KG[row.category] ?? 2.0
        co2SavedKg += Math.round(count * weightKg * CO2_PER_KG)
      }
    }

    return {
      totalDevices,
      soldDevices,
      co2SavedTons: Math.round((co2SavedKg / 1000) * 10) / 10,
      repairs: Number(repairRows.rows[0]?.count || 0),
      users: Number(userRows.rows[0]?.count || 0),
      live: true,
    }
  } catch (error) {
    logger.warn('ImpactStatsSection: DB unavailable, using defaults', { error })
    return {
      totalDevices: getDefaultNumeric('devices_sold_per_year'),
      soldDevices: getDefaultNumeric('devices_sold_per_year'),
      co2SavedTons: getDefaultNumeric('annual_co2_saved_tons'),
      repairs: 0,
      users: 0,
      live: false,
    }
  }
}

export default async function ImpactStatsSection() {
  const stats = await fetchImpactStats()

  const environmentalStats = [
    {
      value: `${stats.totalDevices}+`,
      description: 'IT-Geräte gerettet statt entsorgt',
    },
    {
      value: `~${stats.co2SavedTons} t`,
      description: 'CO₂ eingespart durch Wiederverwendung',
    },
    {
      value: `${Math.round((stats.totalDevices * 2.5) / 1000 * 10) / 10} t`,
      description: 'Elektroschrott verhindert',
    },
  ]

  const socialStats = [
    {
      value: `${stats.users}+`,
      description: 'Mitglieder in unserer Community',
    },
    {
      value: `${stats.repairs}+`,
      description: 'IT-Hilfe Anfragen bearbeitet',
    },
    {
      value: `${getDefaultNumeric('annual_people_trained')}+`,
      description: 'Menschen in Workshops ausgebildet',
    },
  ]

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
              {environmentalStats.map((stat) => (
                <div key={stat.description}>
                  <p className="text-3xl sm:text-4xl font-bold text-green-700 mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm sm:text-base text-gray-600">
                    {stat.description}
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
              {socialStats.map((stat) => (
                <div key={stat.description}>
                  <p className="text-3xl sm:text-4xl font-bold text-green-700 mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm sm:text-base text-gray-600">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/about/impact"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            Mehr zu unserer Wirkung erfahren
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
