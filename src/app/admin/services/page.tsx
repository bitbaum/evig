import { Metadata } from 'next'
import Link from 'next/link'
import {
  Plus,
  Wrench,
  Users,
  Clock,
  DollarSign,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dienstleistungen verwalten | RevampIT Admin',
  description: 'Dienstleistungen erstellen, bearbeiten und verwalten.',
}

export default function AdminServicesPage() {
  // Mock data - replace with actual database queries
  const services = [
    {
      id: '1',
      name: 'Computer-Reparatur',
      description: 'Professionelle Reparatur und Wartung von Computern aller Art',
      category: 'Hardware',
      price: 120,
      duration: '1-2 Stunden',
      availability: 'Mo-Fr 09:00-18:00',
      status: 'active',
      totalBookings: 45,
      rating: 4.8,
      lastBooking: '2024-12-10'
    },
    {
      id: '2',
      name: 'Datenrettung',
      description: 'Wiederherstellung verlorener Daten von Festplatten und Speichermedien',
      category: 'Datenrettung',
      price: 250,
      duration: '2-4 Stunden',
      availability: 'Mo-Fr 09:00-17:00',
      status: 'active',
      totalBookings: 23,
      rating: 4.9,
      lastBooking: '2024-12-09'
    },
    {
      id: '3',
      name: 'Linux-Installation',
      description: 'Installation und Konfiguration von Linux-Betriebssystemen',
      category: 'Software',
      price: 180,
      duration: '2-3 Stunden',
      availability: 'Mo-Fr 10:00-16:00',
      status: 'active',
      totalBookings: 18,
      rating: 4.7,
      lastBooking: '2024-12-08'
    },
    {
      id: '4',
      name: 'Hardware-Upgrade',
      description: 'Aufrüstung von Computern mit neuer Hardware',
      category: 'Hardware',
      price: 150,
      duration: '1-2 Stunden',
      availability: 'Di, Do, Fr 09:00-15:00',
      status: 'draft',
      totalBookings: 0,
      rating: 0,
      lastBooking: null
    }
  ]

  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.status === 'active').length,
    draftServices: services.filter(s => s.status === 'draft').length,
    totalBookings: services.reduce((sum, s) => sum + s.totalBookings, 0),
    averageRating: services.filter(s => s.rating > 0).reduce((sum, s) => sum + s.rating, 0) / services.filter(s => s.rating > 0).length,
    totalRevenue: services.reduce((sum, s) => sum + (s.price * s.totalBookings), 0)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dienstleistungen verwalten
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Erstellen und verwalten Sie Ihre Service-Angebote
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Dienstleistung erstellen
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Services</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktiv</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Edit className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entwürfe</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draftServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Buchungen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-yellow-500">⭐</span>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ø Bewertung</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Umsatz</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">CHF {stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dienstleistung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Preis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dauer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Buchungen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Bewertung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {service.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {service.description.substring(0, 60)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {service.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      CHF {service.price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {service.duration}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {service.totalBookings}
                    </div>
                    {service.lastBooking && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Letzte: {new Date(service.lastBooking).toLocaleDateString('de-CH')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {service.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {service.rating}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Keine Bewertungen</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      service.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {service.status === 'active' ? 'Aktiv' : 'Entwurf'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Noch keine Dienstleistungen
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Erstellen Sie Ihre erste Dienstleistung, um Service-Termine anzubieten.
            </p>
            <Link
              href="/admin/services/new"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Erste Dienstleistung erstellen
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200">
              Dienstleistungs-Verwaltung
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 mb-3">
              Dienstleistungen sind die Kernkompetenz von RevampIT. Bieten Sie Reparaturen, Installationen,
              Beratungen und andere technische Services an. Kunden können online Termine buchen und direkt bezahlen.
            </p>
            <div className="flex gap-3">
              <Link
                href="/admin/services/new"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                Dienstleistung erstellen
              </Link>
              <Link
                href="/admin/services"
                className="text-sm bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                Buchungen verwalten
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






