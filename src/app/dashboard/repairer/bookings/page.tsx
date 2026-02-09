import { Metadata } from 'next'
import { ROLES } from '@/lib/constants'
import { requireRole } from '@/middleware/admin'
import Link from 'next/link'
import { getBookingStatusBadge, getUrgencyBadge } from '@/config/booking-status'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Phone,
  MapPin,
  User,
  DollarSign,
  Star
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reparatur-Buchungen | Repairer Dashboard',
  description: 'Verwalten Sie Ihre eingehenden Reparaturaufträge.',
}

export default async function RepairerBookingsPage() {
  // Require repairer role
  await requireRole(ROLES.REPAIRER)

  // Mock bookings data
  const bookings = [
    {
      id: 'booking_1',
      customer: {
        name: 'Max Müller',
        email: 'max@example.com',
        phone: '+41 79 123 45 67',
        location: 'Zürich',
        rating: 4.5,
      },
      service: {
        name: 'Laptop Bildschirm reparieren',
        category: 'Laptop Reparaturen',
        description: 'MacBook Pro 14" - Bildschirm ist gesprungen',
        price: 180,
      },
      status: 'pending',
      urgency: 'normal',
      requestedDate: '2024-12-05',
      estimatedCompletion: '2024-12-07',
      createdAt: '2024-12-01',
      messages: 2,
      images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=100'],
    },
    {
      id: 'booking_2',
      customer: {
        name: 'Anna Schmidt',
        email: 'anna@example.com',
        phone: '+41 78 987 65 43',
        location: 'Bern',
        rating: 4.8,
      },
      service: {
        name: 'Smartphone Akku ersetzen',
        category: 'Smartphone Reparaturen',
        description: 'iPhone 12 - Akku hält nicht mehr',
        price: 85,
      },
      status: 'confirmed',
      urgency: 'high',
      requestedDate: '2024-12-03',
      estimatedCompletion: '2024-12-04',
      createdAt: '2024-11-28',
      messages: 5,
      images: ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=100'],
    },
    {
      id: 'booking_3',
      customer: {
        name: 'Peter Weber',
        email: 'peter@example.com',
        phone: '+41 76 543 21 09',
        location: 'Basel',
        rating: 4.2,
      },
      service: {
        name: 'Desktop PC Grafikkarte tauschen',
        category: 'Desktop PC Service',
        description: 'Gaming PC - Neue RTX 4070 installieren',
        price: 250,
      },
      status: 'in_progress',
      urgency: 'normal',
      requestedDate: '2024-11-25',
      estimatedCompletion: '2024-11-30',
      createdAt: '2024-11-20',
      messages: 8,
      images: ['https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=100'],
    },
    {
      id: 'booking_4',
      customer: {
        name: 'Lisa Hofmann',
        email: 'lisa@example.com',
        phone: '+41 75 111 22 33',
        location: 'Genève',
        rating: 4.9,
      },
      service: {
        name: 'Laptop Datenrettung',
        category: 'Laptop Reparaturen',
        description: 'Festplatte ausgefallen - Daten müssen gerettet werden',
        price: 150,
      },
      status: 'completed',
      urgency: 'urgent',
      requestedDate: '2024-11-15',
      estimatedCompletion: '2024-11-18',
      createdAt: '2024-11-10',
      messages: 12,
      images: [],
    },
  ]

  // Status icons for repairer view (labels/colors from booking-status SSOT)
  const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    pending: AlertCircle,
    confirmed: Clock,
    in_progress: CheckCircle,
    completed: CheckCircle,
    cancelled: XCircle,
  }

  const getStatusInfo = (status: string) => {
    const badge = getBookingStatusBadge(status)
    return { ...badge, icon: STATUS_ICONS[status] ?? AlertCircle }
  }

  const getUrgencyInfo = (urgency: string) => getUrgencyBadge(urgency)

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    inProgressBookings: bookings.filter(b => b.status === 'in_progress').length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.service.price, 0),
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reparatur-Buchungen
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verwalten Sie Ihre eingehenden Reparaturaufträge
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ausstehende</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingBookings}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bestätigte</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.confirmedBookings}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Bearbeitung</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgressBookings}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamteinnahmen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                CHF {stats.totalRevenue.toLocaleString('de-CH')}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => {
          const statusInfo = getStatusInfo(booking.status)
          const urgencyInfo = getUrgencyInfo(booking.urgency)
          const StatusIcon = statusInfo.icon

          return (
            <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {/* Customer Avatar */}
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {booking.service.name}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${urgencyInfo.color}`}>
                          {urgencyInfo.label}
                        </span>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {booking.service.description}
                      </p>

                      {/* Customer Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{booking.customer.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.customer.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{booking.customer.rating}</span>
                        </div>
                      </div>

                      {/* Service Info */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Angefordert: {new Date(booking.requestedDate).toLocaleDateString('de-CH')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>Fertigestellt: {new Date(booking.estimatedCompletion).toLocaleDateString('de-CH')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">CHF {booking.service.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  {booking.images.length > 0 && (
                    <div className="flex gap-2">
                      {booking.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Booking ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>{booking.messages} Nachrichten</span>
                    <span>•</span>
                    <span>Erstellt am {new Date(booking.createdAt).toLocaleDateString('de-CH')}</span>
                  </div>

                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Annehmen
                        </button>
                        <button className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600">
                          <XCircle className="w-4 h-4" />
                          Ablehnen
                        </button>
                      </>
                    )}

                    {booking.status === 'confirmed' && (
                      <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        In Bearbeitung
                      </button>
                    )}

                    {booking.status === 'in_progress' && (
                      <button className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Abgeschlossen
                      </button>
                    )}

                    <Link
                      href={`/dashboard/repairer/bookings/${booking.id}`}
                      className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200">
              Tipps für die Buchungsverwaltung
            </h3>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Antworten Sie schnell auf neue Buchungsanfragen (innerhalb 24h)</li>
              <li>• Kommunizieren Sie klar über Preise und Lieferzeiten</li>
              <li>• Dokumentieren Sie den Zustand der Geräte vor der Reparatur</li>
              <li>• Bitten Sie um Bewertungen nach erfolgreichen Reparaturen</li>
              <li>• Halten Sie Ihre Kunden über den Fortschritt auf dem Laufenden</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}



