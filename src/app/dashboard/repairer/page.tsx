import { Metadata } from 'next'
import { ROLES } from '@/lib/constants'
import { requireRole } from '@/middleware/admin'
import Link from 'next/link'
import {
  Wrench,
  Calendar,
  Star,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  User
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Repairer Dashboard | RevampIT',
  description: 'Verwalten Sie Ihre Reparaturdienste und Buchungen.',
}

export default async function RepairerDashboard() {
  // Require repairer role
  await requireRole(ROLES.REPAIRER)

  // Mock data for repairer dashboard
  const repairerStats = {
    totalBookings: 28,
    completedJobs: 23,
    pendingBookings: 5,
    monthlyRevenue: 1250,
    averageRating: 4.8,
    responseTime: '2h',
  }

  const recentBookings = [
    {
      id: '1',
      customer: 'Max Muster',
      service: 'Laptop Reparatur',
      status: 'pending',
      date: '2024-12-05',
      price: 120,
      description: 'Bildschirm austauschen',
    },
    {
      id: '2',
      customer: 'Anna Schmidt',
      service: 'Smartphone Reparatur',
      status: 'confirmed',
      date: '2024-12-03',
      price: 80,
      description: 'Akku ersetzen',
    },
    {
      id: '3',
      customer: 'Peter Weber',
      service: 'Desktop PC Reparatur',
      status: 'completed',
      date: '2024-11-28',
      price: 150,
      description: 'Neue Grafikkarte installieren',
    },
  ]

  const servicesOffered = [
    {
      name: 'Laptop Reparaturen',
      description: 'Hardware-Reparaturen für alle Laptop-Marken',
      price: '80-300 CHF',
      rating: 4.9,
      completed: 15,
    },
    {
      name: 'Smartphone Reparaturen',
      description: 'Display, Akku, und andere Reparaturen',
      price: '50-200 CHF',
      rating: 4.7,
      completed: 8,
    },
    {
      name: 'Desktop PC Service',
      description: 'Komplette PC-Reparaturen und Upgrades',
      price: '100-500 CHF',
      rating: 4.8,
      completed: 12,
    },
  ]

  const quickActions = [
    {
      title: 'Buchungen verwalten',
      description: 'Eingehende Reparatur-Aufträge',
      href: '/dashboard/repairer/bookings',
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Dienste bearbeiten',
      description: 'Angebotene Dienstleistungen verwalten',
      href: '/dashboard/repairer/services',
      icon: Wrench,
      color: 'bg-green-500',
    },
    {
      title: 'Verfügbarkeit',
      description: 'Terminplan und Verfügbarkeit setzen',
      href: '/dashboard/repairer/availability',
      icon: Clock,
      color: 'bg-purple-500',
    },
    {
      title: 'Bewertungen',
      description: 'Kundenfeedback anzeigen',
      href: '/dashboard/repairer/reviews',
      icon: Star,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Repairer Dashboard
        </h1>
        <p className="text-orange-100">
          Verwalten Sie Ihre Reparaturdienste und helfen Sie Kunden, ihre Geräte wieder zum Laufen zu bringen.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Buchungen</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{repairerStats.totalBookings}</p>
              <p className="text-sm text-green-600">{repairerStats.completedJobs} abgeschlossen</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ausstehende Jobs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{repairerStats.pendingBookings}</p>
              <p className="text-sm text-orange-600">Erfordern Aufmerksamkeit</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Durchschnittliche Bewertung</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{repairerStats.averageRating}</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(repairerStats.averageRating)
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monatlicher Umsatz</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">CHF {repairerStats.monthlyRevenue}</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +22%
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Letzte Buchungen
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Ihre aktuellen und kürzlich abgeschlossenen Reparaturaufträge
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {booking.customer}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : booking.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                      }`}>
                        {booking.status === 'completed' ? 'Abgeschlossen' :
                         booking.status === 'confirmed' ? 'Bestätigt' : 'Ausstehend'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.service} • CHF {booking.price}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {booking.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Link
                href="/dashboard/repairer/bookings"
                className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium flex items-center gap-1"
              >
                Alle Buchungen verwalten
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Services Offered */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Meine Dienstleistungen
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Die Reparaturdienste, die Sie anbieten
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {servicesOffered.map((service, index) => (
                <div key={index} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {service.rating}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600">
                      {service.price}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {service.completed} abgeschlossen
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Link
                href="/dashboard/repairer/services"
                className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium flex items-center gap-1"
              >
                Dienstleistungen bearbeiten
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
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
            Häufig verwendete Repairer-Funktionen
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                    {action.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Repairer Info */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-orange-900 dark:text-orange-200">
              Reparaturdienste bei RevampIT
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              Als zertifizierter Repairer helfen Sie dabei, die Lebensdauer von Elektrogeräten zu verlängern
              und Abfall zu reduzieren. Ihre Dienstleistungen tragen direkt zur Kreislaufwirtschaft bei.
            </p>
            <div className="mt-3 flex gap-3">
              <Link
                href="/services"
                className="text-sm bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700 transition-colors"
              >
                Reparatur-Services ansehen
              </Link>
              <Link
                href="/dashboard/repairer/profile"
                className="text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
              >
                Profil bearbeiten
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



