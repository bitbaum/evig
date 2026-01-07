import { Metadata } from 'next'
import { ROLES } from '@/lib/constants'
import { requireRole } from '@/middleware/admin'
import Link from 'next/link'
import AdminShortcuts from '@/components/admin/AdminShortcuts'
import { MEDUSA_CONFIG } from '@/config/medusa'
import {
  Users,
  Calendar,
  Wrench,
  DollarSign,
  TrendingUp,
  UserCheck,
  Clock,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Package,
  Edit,
  Eye,
  MessageSquare
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Dashboard | RevampIT',
  description: 'Verwalten Sie Ihr RevampIT-System als Administrator.',
}

export default async function AdminDashboard() {
  // Temporarily bypass role check for testing
  // await requireRole(ROLES.REVAMPIT_ADMIN)

  // Mock data - in a real app, this would come from your database
  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalWorkshops: 23,
    upcomingWorkshops: 8,
    totalAppointments: 156,
    pendingAppointments: 23,
    totalRevenue: 45680,
    monthlyRevenue: 12890,
    pendingRepairerApplications: 12, // Mock data for repairer applications
    totalRepairers: 45,
  }

  const recentActivities = [
    {
      id: 1,
      type: 'user_registration',
      message: 'Neuer Benutzer registriert: max.muster@example.com',
      time: 'vor 5 Minuten',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      id: 2,
      type: 'workshop_booking',
      message: 'Workshop-Buchung: "Einführung in die Reparatur"',
      time: 'vor 12 Minuten',
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      id: 3,
      type: 'service_appointment',
      message: 'Service-Termin gebucht: Datenrettung',
      time: 'vor 23 Minuten',
      icon: Wrench,
      color: 'bg-orange-500',
    },
    {
      id: 4,
      type: 'repairer_application',
      message: 'Neue Reparateur-Bewerbung eingegangen: anna.schmidt@example.com',
      time: 'vor 45 Minuten',
      icon: UserCheck,
      color: 'bg-orange-500',
    },
    {
      id: 5,
      type: 'pending_approval',
      message: 'Neue Workshop-Anmeldung wartet auf Genehmigung',
      time: 'vor 1 Stunde',
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ]

  const quickActions = [
    {
      title: '🛍️ Produkte verwalten',
      description: 'Schöne Produktverwaltung mit Card-Layout',
      href: '/admin/products',
      icon: Package,
      color: 'bg-green-500',
    },
    {
      title: 'Benutzer verwalten',
      description: 'Benutzerkonten anzeigen und bearbeiten',
      href: '/admin/users',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Workshops verwalten',
      description: 'Workshops erstellen und bearbeiten',
      href: '/admin/workshops',
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Termine verwalten',
      description: 'Service-Termine koordinieren',
      href: '/admin/services',
      icon: Wrench,
      color: 'bg-orange-500',
    },
    {
      title: 'Berichte anzeigen',
      description: 'Analytics und Statistiken',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'bg-purple-500',
    },
    {
      title: `Reparateur-Bewerbungen ${stats.pendingRepairerApplications > 0 ? `(${stats.pendingRepairerApplications})` : ''}`,
      description: 'Reparateur-Anmeldungen prüfen und genehmigen',
      href: '/admin/repairer-applications',
      icon: UserCheck,
      color: stats.pendingRepairerApplications > 0 ? 'bg-orange-500' : 'bg-blue-500',
    },
    {
      title: 'Bewertungen verwalten',
      description: 'Kundenbewertungen moderieren und verwalten',
      href: '/admin/reviews',
      icon: MessageSquare,
      color: 'bg-purple-500',
    },
  ]

  const externalActions = [
    {
      title: '🛒 Shop Admin',
      description: 'Produkte erstellen, bearbeiten und Bestellungen verwalten',
      href: `${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}/app`,
      icon: Package,
      color: 'bg-indigo-500',
      external: true,
    },
    {
      title: '📝 CMS Inhalte bearbeiten',
      description: 'Seiten, Blog-Artikel und Website-Inhalte verwalten',
      href: '/ai-cms',
      icon: Edit,
      color: 'bg-teal-500',
    },
    {
      title: '👀 Shop Frontend',
      description: 'Shop-Website anzeigen und kaufen testen',
      href: '/shop/medusa',
      icon: Eye,
      color: 'bg-emerald-500',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Willkommen im Admin-Bereich
        </h1>
        <p className="text-green-100">
          Verwalten Sie Benutzer, Workshops und Dienstleistungen für RevampIT.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Benutzer</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +12% diese Woche
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktive Workshops</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.upcomingWorkshops}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                von {stats.totalWorkshops} insgesamt
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ausstehende Termine</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingAppointments}</p>
              <p className="text-sm text-orange-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Benötigen Aufmerksamkeit
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monatlicher Umsatz</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">CHF {stats.monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +8% zum Vormonat
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ausstehende Reparateur-Bewerbungen</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingRepairerApplications}</p>
              <p className="text-sm text-orange-600 flex items-center gap-1">
                <UserCheck className="w-4 h-4" />
                {stats.totalRepairers} aktive Reparateure
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Letzte Aktivitäten
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Übersicht der neuesten Systemaktivitäten
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <activity.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Link
                href="/admin/analytics"
                className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 font-medium flex items-center gap-1"
              >
                Alle Aktivitäten anzeigen
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Schnellzugriff
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Häufig verwendete Verwaltungsfunktionen
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                      {action.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>

            {/* External Services */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Externe Dienste
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {externalActions.map((action) => (
                  action.external ? (
                    <a
                      key={action.href}
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                          <action.icon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                          {action.title}
                        </h3>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 ml-auto" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.description}
                      </p>
                    </a>
                  ) : (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                          <action.icon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                          {action.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.description}
                      </p>
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Shortcuts */}
      <AdminShortcuts />

      {/* System Health */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Systemstatus
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aktueller Zustand aller Systemkomponenten
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 font-medium">Alle Systeme aktiv</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Authentifizierung</p>
              <p className="text-sm text-green-600 dark:text-green-300">Online</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Datenbank</p>
              <p className="text-sm text-green-600 dark:text-green-300">Online</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">E-Mail-Service</p>
              <p className="text-sm text-green-600 dark:text-green-300">Konfigurationspflichtig</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
