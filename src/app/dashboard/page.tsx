import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ROLES } from '@/lib/constants'
import { getCurrentUserRole } from '@/middleware/admin'

export const metadata: Metadata = {
  title: 'Dashboard | RevampIT',
  description: 'Verwalten Sie Ihr RevampIT-Konto, Workshops, Bestellungen und mehr.',
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard')
  }

  const userRole = await getCurrentUserRole()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Willkommen zurück, {session.user.name || session.user.email}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Verwalten Sie Ihr Konto und entdecken Sie alle verfügbaren Funktionen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Link
            href="/dashboard/profile"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Mein Profil
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Persönliche Daten verwalten
                </p>
              </div>
            </div>
          </Link>

          {/* Workshops Card */}
          <Link
            href="/dashboard/workshops"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-xl">🎓</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Meine Workshops
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Angemeldete Kurse verwalten
                </p>
              </div>
            </div>
          </Link>

          {/* Appointments Card */}
          <Link
            href="/dashboard/appointments"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-xl">📅</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Termine
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Service-Termin buchen
                </p>
              </div>
            </div>
          </Link>

          {/* Role-specific cards */}
          {userRole === ROLES.SELLER && (
            <Link
              href="/dashboard/seller"
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 text-xl">🏪</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Seller Dashboard
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Produkte und Verkäufe
                  </p>
                </div>
              </div>
            </Link>
          )}

          {userRole === ROLES.REPAIRER && (
            <Link
              href="/dashboard/repairer"
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 text-xl">🔧</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Repairer Dashboard
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Reparaturen verwalten
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Upsell cards for capabilities (visible if user doesn't have role yet) */}
          {userRole !== ROLES.SELLER && (
            <Link
              href="/dashboard/seller"
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 text-xl">🏪</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Auf Revamp‑IT verkaufen
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Eigene Produkte anbieten – Versand direkt an Käufer
                  </p>
                </div>
              </div>
            </Link>
          )}

          {userRole !== ROLES.REPAIRER && (
            <Link
              href="/dashboard/repairer"
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 text-xl">🔧</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Reparaturen anbieten
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Dienstleistungen publizieren und Anfragen erhalten
                  </p>
                </div>
              </div>
            </Link>
          )}

          {userRole === ROLES.REVAMPIT_ADMIN && (
            <Link
              href="/admin"
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 text-xl">⚙️</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Admin-Bereich
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    System verwalten
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
          {/* Blog Submit Card */}
          <Link
            href="/blog/submit"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 text-xl">✍️</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Beitrag verfassen
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Idee teilen oder Tutorial schreiben
                </p>
              </div>
            </div>
          </Link>
