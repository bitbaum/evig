import { Metadata } from 'next'
import { BarChart3, TrendingUp, Users, ShoppingCart, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Analytics | RevampIT Admin',
  description: 'Statistiken und Auswertungen.',
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Statistiken und Auswertungen für RevampIT
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Benutzer</p>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12% diese Woche
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">89</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bestellungen</p>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +8% diese Woche
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">23</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Workshops</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">8 kommende</p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">CHF 12.8k</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Umsatz (Monat)</p>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +15% zum Vormonat
          </p>
        </div>
      </div>

      {/* Placeholder Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Besucher (letzte 30 Tage)</h3>
          <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Chart wird geladen...</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Umsatz nach Kategorie</h3>
          <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Chart wird geladen...</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>In Entwicklung:</strong> Analytics wird mit echten Daten aus der Datenbank und externen Quellen verbunden.
          Für detaillierte Finanz-Analytics, siehe <a href="/admin/hirn/finanzen" className="underline">Hirn Finanzen</a>.
        </p>
      </div>
    </div>
  )
}
