import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import { Settings, Globe, Mail, Shield, Database, Bell } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Heading from '@/components/admin/AdminHeading'

export const metadata: Metadata = {
  title: 'Einstellungen',
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

  // None of the sub-pages exist yet — keep cards informational, not navigational
  const settingsSections = [
    {
      icon: Globe,
      title: 'Allgemein',
      description: 'Website-Name, Logo, Kontaktdaten',
      color: 'blue',
    },
    {
      icon: Mail,
      title: 'E-Mail',
      description: 'SMTP-Konfiguration, Templates',
      color: 'green',
    },
    {
      icon: Shield,
      title: 'Sicherheit',
      description: 'Authentifizierung, Berechtigungen',
      color: 'red',
    },
    {
      icon: Database,
      title: 'Datenbank',
      description: 'Backup, Wartung, Logs',
      color: 'purple',
    },
    {
      icon: Bell,
      title: 'Benachrichtigungen',
      description: 'E-Mail- und Push-Benachrichtigungen',
      color: 'orange',
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-primary-100 text-primary-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
    }
    return colors[color] || colors.blue
  }

  return (
    <AdminPageWrapper
      title="Einstellungen"
      description="Systemkonfiguration und Einstellungen"
      icon={Settings}
      iconColor="gray"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map(section => (
          <div
            key={section.title}
            className="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 opacity-70"
            aria-disabled="true"
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(section.color)}`}>
                <section.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Heading level={3} className="font-semibold text-neutral-900 dark:text-white">{section.title}</Heading>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                    Demnächst
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{section.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>In Entwicklung:</strong> Die Einstellungsseiten werden schrittweise implementiert.
          Aktuell werden Konfigurationen über Code (<code>src/config/org.ts</code>) und Umgebungsvariablen verwaltet.
        </p>
      </div>
    </AdminPageWrapper>
  )
}
