'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Wrench,
  Calendar,
  Star,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  User,
  Loader2,
  RefreshCw,
  Plus
} from 'lucide-react'
import { ROLES } from '@/lib/constants'

interface Booking {
  id: string
  customer: string
  service: string
  status: string
  urgency: string
  preferredDate: string | null
  description: string
  deviceInfo: string
  price: number | null
  createdAt: string
}

interface Service {
  id: string
  name: string
  description: string
  basePrice: number
  hourlyRate: number
  isActive: boolean
}

interface Stats {
  totalBookings: number
  completedBookings: number
  pendingBookings: number
  confirmedBookings: number
  totalRevenue: number
  averageRating: number
  reviewCount: number
}

interface DashboardData {
  stats: Stats
  bookings: Booking[]
  services: Service[]
  repairerId: string | null
}

export default function RepairerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Repairer Dashboard | RevampIT'
  }, [])

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/auth/login')
      return
    }

    const userRole = session.user.role as string
    const hasAccess = userRole === ROLES.REPAIRER || userRole === ROLES.REVAMPIT_ADMIN

    if (!hasAccess) {
      router.push('/dashboard')
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/repairer/dashboard')
      const result = await response.json()

      if (result.success && result.data) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Fehler beim Laden des Dashboards')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return { label: 'Abgeschlossen', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' }
      case 'confirmed': return { label: 'Bestätigt', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' }
      case 'in_progress': return { label: 'In Bearbeitung', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' }
      case 'requested': return { label: 'Ausstehend', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' }
      case 'cancelled': return { label: 'Abgesagt', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
      default: return { label: status, className: 'bg-gray-100 text-gray-800' }
    }
  }

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
      href: '/dashboard/profile',
      icon: Clock,
      color: 'bg-purple-500',
    },
    {
      title: 'Bewertungen',
      description: 'Kundenfeedback anzeigen',
      href: '/dashboard/reviews',
      icon: Star,
      color: 'bg-orange-500',
    },
  ]

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Dashboard wird geladen...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Fehler beim Laden
        </h3>
        <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Erneut versuchen
        </button>
      </div>
    )
  }

  const stats = data?.stats || {
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    reviewCount: 0,
  }

  const bookings = data?.bookings || []
  const services = data?.services || []

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Repairer Dashboard
            </h1>
            <p className="text-orange-100">
              Verwalten Sie Ihre Reparaturdienste und helfen Sie Kunden, ihre Geräte wieder zum Laufen zu bringen.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Buchungen</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
              <p className="text-sm text-green-600">{stats.completedBookings} abgeschlossen</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ausstehende Jobs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingBookings}</p>
              <p className="text-sm text-blue-600">{stats.confirmedBookings} bestätigt</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Durchschnittliche Bewertung</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
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
                <span className="text-xs text-gray-500 ml-1">({stats.reviewCount})</span>
              </div>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Umsatz</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                CHF {stats.totalRevenue.toLocaleString('de-CH')}
              </p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Gesamtumsatz
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
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Noch keine Buchungen vorhanden.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const statusInfo = getStatusLabel(booking.status)
                  return (
                    <div key={booking.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {booking.customer}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.service}
                          {booking.price && ` • CHF ${booking.price}`}
                        </p>
                        {booking.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {booking.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

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
            {services.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Sie haben noch keine Dienstleistungen erstellt.
                </p>
                <Link
                  href="/dashboard/repairer/services"
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Dienstleistung hinzufügen
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {services.slice(0, 3).map((service) => (
                  <div key={service.id} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {service.name}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        service.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}>
                        {service.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-600">
                        Ab CHF {service.basePrice}
                        {service.hourlyRate > 0 && ` / CHF ${service.hourlyRate}/h`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {services.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  href="/dashboard/repairer/services"
                  className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium flex items-center gap-1"
                >
                  Dienstleistungen bearbeiten
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
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
                href="/dashboard/profile"
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
