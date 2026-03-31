import { Metadata } from 'next'
import { requirePermission } from '@/middleware/admin'
import Link from 'next/link'
import {
  Wrench,
  Plus,
  Edit,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Meine Dienstleistungen | Repairer Dashboard',
  description: 'Verwalten Sie Ihre Reparaturdienstleistungen.',
}

export default async function RepairerServicesPage() {
  // Require repairer permission
  await requirePermission('services')

  // Mock repairer services data
  const services = [
    {
      id: 'service_1',
      name: 'Laptop Reparaturen',
      category: 'Laptops',
      description: 'Hardware-Reparaturen für alle Laptop-Marken',
      priceRange: '80-300 CHF',
      estimatedDuration: '1-3 Tage',
      active: true,
      completedJobs: 15,
      averageRating: 4.8,
      totalEarnings: 2250,
      createdAt: '2024-10-15',
      skills: ['Bildschirmtausch', 'Tastaturreparatur', 'Akkuersatz', 'Mainboard-Reparaturen']
    },
    {
      id: 'service_2',
      name: 'Smartphone Reparaturen',
      category: 'Smartphones',
      description: 'Display, Akku, und andere Reparaturen',
      priceRange: '50-200 CHF',
      estimatedDuration: '1-2 Tage',
      active: true,
      completedJobs: 8,
      averageRating: 4.7,
      totalEarnings: 890,
      createdAt: '2024-11-01',
      skills: ['Displaytausch', 'Akkuersatz', 'Ladeportereparatur', 'Wasserschaden']
    },
    {
      id: 'service_3',
      name: 'Desktop PC Service',
      category: 'Desktop PCs',
      description: 'Komplette PC-Reparaturen und Upgrades',
      priceRange: '100-500 CHF',
      estimatedDuration: '2-5 Tage',
      active: false,
      completedJobs: 0,
      averageRating: 0,
      totalEarnings: 0,
      createdAt: '2024-12-01',
      skills: ['Grafikkarten-Upgrade', 'RAM-Erweiterung', 'Festplatten-Upgrade', 'Kühlung']
    },
  ]

  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.active).length,
    totalCompletedJobs: services.reduce((sum, s) => sum + s.completedJobs, 0),
    totalEarnings: services.reduce((sum, s) => sum + s.totalEarnings, 0),
    averageRating: services.filter(s => s.completedJobs > 0).length > 0
      ? services.filter(s => s.completedJobs > 0).reduce((sum, s) => sum + s.averageRating, 0) /
        services.filter(s => s.completedJobs > 0).length
      : 0
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meine Dienstleistungen
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verwalten Sie Ihre Reparaturdienstleistungen und Preise
          </p>
        </div>
        <Link
          href="/dashboard/repairer/services/new"
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neue Dienstleistung
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktive Services</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeServices}</p>
            </div>
            <Wrench className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Abgeschlossene Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCompletedJobs}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Durchschnittliche Bewertung</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating.toFixed(1)}
              </p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(stats.averageRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamteinnahmen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                CHF {stats.totalEarnings.toLocaleString('de-CH')}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {service.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    service.active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                  }`}>
                    {service.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {service.description}
              </p>

              {/* Skills */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Fachgebiete:
                </h4>
                <div className="flex flex-wrap gap-1">
                  {service.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Preisspanne</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{service.priceRange}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Dauer</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{service.estimatedDuration}</p>
                </div>
              </div>

              {/* Performance */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Abgeschlossen</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{service.completedJobs}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Bewertung</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {service.averageRating > 0 ? service.averageRating.toFixed(1) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Einnahmen</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      CHF {service.totalEarnings}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/repairer/services/${service.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Bearbeiten
                </Link>
                <button
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    service.active
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/30'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/30'
                  }`}
                >
                  {service.active ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Deaktivieren
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Aktivieren
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-orange-900 dark:text-orange-200">
              Tipps für erfolgreiche Reparaturdienste
            </h3>
            <ul className="mt-2 text-sm text-orange-700 dark:text-orange-300 space-y-1">
              <li>• Definieren Sie klare Preise und Lieferzeiten für Ihre Dienstleistungen</li>
              <li>• Spezialisieren Sie sich auf bestimmte Gerätetypen für bessere Bewertungen</li>
              <li>• Bieten Sie Garantie auf Ihre Reparaturen an</li>
              <li>• Kommunizieren Sie transparent mit Ihren Kunden</li>
              <li>• Sammeln Sie Bewertungen und zeigen Sie Ihre Expertise</li>
            </ul>
            <Link
              href="/help/repairer-guide"
              className="inline-flex items-center gap-1 mt-3 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              Vollständige Anleitung lesen
              <Wrench className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}



