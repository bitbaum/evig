import { Metadata } from 'next'
import { CheckSquare, Clock, CheckCircle, XCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Freigaben | RevampIT Admin',
  description: 'Eingereichte Inhalte prüfen und freigeben.',
}

export default function ApprovalsPage() {
  // Mock data - will be replaced with real data
  const pendingItems = [
    { id: 1, type: 'workshop', title: 'Linux Grundlagen Workshop', author: 'Max Muster', submitted: '2024-01-15' },
    { id: 2, type: 'product', title: 'ThinkPad X230', author: 'Anna Schmidt', submitted: '2024-01-14' },
    { id: 3, type: 'service', title: 'Datenrettung SSD', author: 'Peter Weber', submitted: '2024-01-13' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
          <CheckSquare className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Freigaben
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Eingereichte Inhalte von Benutzern prüfen und freigeben
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{pendingItems.length}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Ausstehend</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">24</p>
              <p className="text-sm text-green-600 dark:text-green-400">Genehmigt (30 Tage)</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-800 dark:text-red-200">3</p>
              <p className="text-sm text-red-600 dark:text-red-400">Abgelehnt (30 Tage)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Ausstehende Freigaben</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {pendingItems.map(item => (
            <div key={item.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.type === 'workshop' && 'Workshop'}
                  {item.type === 'product' && 'Produkt'}
                  {item.type === 'service' && 'Dienstleistung'}
                  {' • '}{item.author} • {item.submitted}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors">
                  Genehmigen
                </button>
                <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors">
                  Ablehnen
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Hinweis:</strong> Alle von Benutzern eingereichten Inhalte (Produkte, Workshops, Dienstleistungen, Blog-Artikel)
          müssen hier geprüft und freigegeben werden, bevor sie öffentlich sichtbar sind.
        </p>
      </div>
    </div>
  )
}
