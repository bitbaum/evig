import { Metadata } from 'next'
import Link from 'next/link'
import {
  Plus,
  Calendar,
  Users,
  Clock,
  MapPin,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  ArrowRight
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Workshops verwalten | RevampIT Admin',
  description: 'Workshops erstellen, bearbeiten und verwalten.',
}

export default function AdminWorkshopsPage() {
  // Mock data - replace with actual database queries
  const workshops = [
    {
      id: '1',
      title: 'Einführung in die Computer-Reparatur',
      description: 'Lernen Sie die Grundlagen der Computer-Reparatur kennen.',
      instructor: 'Hans Müller',
      date: '2024-12-15',
      time: '14:00 - 17:00',
      location: 'Zürich, Werkstatt',
      maxParticipants: 12,
      currentParticipants: 8,
      price: 120,
      status: 'published',
      category: 'Reparatur'
    },
    {
      id: '2',
      title: 'Linux für Anfänger',
      description: 'Entdecken Sie die Möglichkeiten von Linux als Alternative zu Windows.',
      instructor: 'Anna Schmidt',
      date: '2024-12-18',
      time: '10:00 - 13:00',
      location: 'Online',
      maxParticipants: 20,
      currentParticipants: 15,
      price: 80,
      status: 'published',
      category: 'Software'
    },
    {
      id: '3',
      title: 'Datenrettung und Backup-Strategien',
      description: 'Professionelle Techniken zur Datenrettung und präventiven Massnahmen.',
      instructor: 'Peter Weber',
      date: '2024-12-20',
      time: '09:00 - 16:00',
      location: 'Zürich, Seminarraum',
      maxParticipants: 8,
      currentParticipants: 0,
      price: 250,
      status: 'draft',
      category: 'Datenrettung'
    }
  ]

  const stats = {
    totalWorkshops: workshops.length,
    publishedWorkshops: workshops.filter(w => w.status === 'published').length,
    draftWorkshops: workshops.filter(w => w.status === 'draft').length,
    totalParticipants: workshops.reduce((sum, w) => sum + w.currentParticipants, 0),
    upcomingWorkshops: workshops.filter(w => new Date(w.date) > new Date()).length
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workshops verwalten
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Erstellen und verwalten Sie Ihre Workshop-Angebote
          </p>
        </div>
        <Link
          href="/admin/workshops/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Workshop erstellen
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Workshops</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalWorkshops}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Veröffentlicht</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.publishedWorkshops}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Edit className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entwürfe</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draftWorkshops}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Teilnehmer</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalParticipants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bevorstehend</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingWorkshops}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workshops Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Workshop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Datum & Uhrzeit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ort
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Teilnehmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Preis
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
              {workshops.map((workshop) => (
                <tr key={workshop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {workshop.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {workshop.instructor} • {workshop.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(workshop.date).toLocaleDateString('de-CH')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {workshop.time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">{workshop.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {workshop.currentParticipants}/{workshop.maxParticipants}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${(workshop.currentParticipants / workshop.maxParticipants) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      CHF {workshop.price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      workshop.status === 'published'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {workshop.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
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

        {workshops.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Noch keine Workshops
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Erstellen Sie Ihren ersten Workshop, um mit der Vermittlung von Wissen zu beginnen.
            </p>
            <Link
              href="/admin/workshops/new"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Ersten Workshop erstellen
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200">
              Workshop-Verwaltung
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 mb-3">
              Workshps sind eine hervorragende Möglichkeit, Wissen zu vermitteln und gleichzeitig Einnahmen zu generieren.
              Planen Sie Workshops zu Themen wie Computer-Reparatur, Linux-Einführung oder Datenrettung.
            </p>
            <div className="flex gap-3">
              <Link
                href="/admin/workshops/new"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                Workshop erstellen
              </Link>
              <Link
                href="/workshops"
                className="text-sm bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                Workshops ansehen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



