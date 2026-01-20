import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import { Users, UserPlus, Briefcase, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Team & HR | RevampIT Admin',
  description: 'Mitarbeiter, Freiwillige und Praktikanten verwalten.',
}

export default async function TeamPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/team')
  }

  // Check permission for sensitive team section
  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'team')

  if (!hasAccess) {
    redirect('/admin?error=no_team_access')
  }

  // Mock data
  const teamStats = {
    employees: 5,
    volunteers: 12,
    interns: 3,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Team & HR
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Mitarbeiter, Freiwillige und Praktikanten verwalten
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
          <UserPlus className="w-5 h-5" />
          Person hinzufügen
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{teamStats.employees}</p>
              <p className="text-gray-600 dark:text-gray-400">Mitarbeiter</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{teamStats.volunteers}</p>
              <p className="text-gray-600 dark:text-gray-400">Freiwillige</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{teamStats.interns}</p>
              <p className="text-gray-600 dark:text-gray-400">Praktikanten</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Sensible Daten:</strong> Diese Seite enthält vertrauliche HR-Informationen und ist nur für autorisierte Mitarbeiter zugänglich.
        </p>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>In Entwicklung:</strong> Die Team-Verwaltung wird mit den HR-Daten aus dem Hirn verbunden.
        </p>
      </div>
    </div>
  )
}
