import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import { Settings, Globe, Mail, Shield, Database, Bell } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Einstellungen | RevampIT Admin',
  description: 'Systemkonfiguration und Einstellungen.',
}

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/settings')
  }

  // Check permission for sensitive settings section
  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'settings')

  if (!hasAccess) {
    redirect('/admin?error=no_settings_access')
  }

  const settingsSections = [
    {
      icon: Globe,
      title: 'Allgemein',
      description: 'Website-Name, Logo, Kontaktdaten',
      href: '/admin/settings/general',
      color: 'blue',
    },
    {
      icon: Mail,
      title: 'E-Mail',
      description: 'SMTP-Konfiguration, Templates',
      href: '/admin/settings/email',
      color: 'green',
    },
    {
      icon: Shield,
      title: 'Sicherheit',
      description: 'Authentifizierung, Berechtigungen',
      href: '/admin/settings/security',
      color: 'red',
    },
    {
      icon: Database,
      title: 'Datenbank',
      description: 'Backup, Wartung, Logs',
      href: '/admin/settings/database',
      color: 'purple',
    },
    {
      icon: Bell,
      title: 'Benachrichtigungen',
      description: 'E-Mail- und Push-Benachrichtigungen',
      href: '/admin/settings/notifications',
      color: 'orange',
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <Settings className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Einstellungen
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Systemkonfiguration und Einstellungen
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map(section => (
          <div
            key={section.title}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(section.color)}`}>
                <section.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Achtung:</strong> Änderungen an den Einstellungen können sich auf das gesamte System auswirken.
          Nur autorisierte Administratoren haben Zugriff auf diese Seite.
        </p>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>In Entwicklung:</strong> Die Einstellungsseiten werden schrittweise implementiert.
        </p>
      </div>
    </div>
  )
}
