import Link from 'next/link'
import {
  Rocket,
  Database,
  Settings,
  Users,
  Package,
  FileText,
  BarChart3,
  Terminal,
  RefreshCw,
  Shield,
  Eye,
  Plus
} from 'lucide-react'

interface ShortcutItem {
  title: string
  description: string
  href?: string
  action?: () => void
  icon: React.ComponentType<any>
  color: string
  external?: boolean
}

export default function AdminShortcuts() {
  const shortcuts: ShortcutItem[] = [
    // Quick Setup Actions
    {
      title: 'Alle Services starten',
      description: 'Startet Frontend, CMS und Medusa mit einem Befehl',
      action: () => {
        navigator.clipboard.writeText('npm run d')
        alert('Befehl in Zwischenablage kopiert: npm run d')
      },
      icon: Rocket,
      color: 'bg-green-500'
    },
    {
      title: 'Admin Benutzer einrichten',
      description: 'Erstellt Admin-Benutzer für CMS und Medusa',
      action: () => {
        navigator.clipboard.writeText('npm run setup-admins')
        alert('Befehl in Zwischenablage kopiert: npm run setup-admins')
      },
      icon: Shield,
      color: 'bg-blue-500'
    },

    // Internal Admin Interfaces
    {
      title: 'Produktverwaltung',
      description: 'Produkte hinzufügen, bearbeiten und löschen',
      href: '/admin/products',
      icon: Package,
      color: 'bg-indigo-500'
    },

    // External Admin Interfaces
    {
      title: 'Medusa Admin',
      description: 'Direkter Zugriff auf Medusa Admin-Interface',
      href: 'http://localhost:9000/app',
      icon: Settings,
      color: 'bg-gray-500',
      external: true
    },
    {
      title: 'CMS Inhalte bearbeiten',
      description: 'Seiten, Blog-Artikel und Inhalte verwalten',
      href: '/ai-cms',
      icon: FileText,
      color: 'bg-teal-500'
    },

    // System Management
    {
      title: 'Datenbank Status',
      description: 'Überprüft den Status aller Datenbanken',
      action: () => {
        navigator.clipboard.writeText('docker ps')
        alert('Befehl in Zwischenablage kopiert: docker ps')
      },
      icon: Database,
      color: 'bg-orange-500'
    },
    {
      title: 'Logs anzeigen',
      description: 'Container-Logs für Fehlerbehebung',
      action: () => {
        navigator.clipboard.writeText('npm run medusa:logs')
        alert('Befehl in Zwischenablage kopiert: npm run medusa:logs')
      },
      icon: Terminal,
      color: 'bg-gray-500'
    },

    // Marketplace Management
    {
      title: 'User Marketplace',
      description: 'Benutzer-Anzeigen und Marketplace-Übersicht',
      href: '/marketplace',
      icon: Users,
      color: 'bg-purple-500'
    },

    // Quick Access
    {
      title: 'Shop Frontend',
      description: 'E-Commerce Shop in neuem Tab öffnen',
      href: '/shop/medusa',
      icon: Eye,
      color: 'bg-emerald-500'
    },
    {
      title: 'Produkt auflisten',
      description: 'Neues Produkt als Benutzer auflisten',
      href: '/marketplace/list',
      icon: Plus,
      color: 'bg-green-500'
    },
    {
      title: 'Neues Produkt',
      description: 'Schnellzugriff für neue Produkte im Medusa Admin',
      href: 'http://localhost:9000/app/products/new',
      icon: Plus,
      color: 'bg-purple-500',
      external: true
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Admin-Schnellzugriff
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Häufig verwendete Befehle und Verknüpfungen
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shortcuts.map((shortcut, index) => {
          const IconComponent = shortcut.icon

          if (shortcut.action) {
            return (
              <button
                key={index}
                onClick={shortcut.action}
                className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 ${shortcut.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                    {shortcut.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {shortcut.description}
                </p>
              </button>
            )
          }

          if (shortcut.external) {
            return (
              <a
                key={index}
                href={shortcut.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 ${shortcut.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                    {shortcut.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {shortcut.description}
                </p>
              </a>
            )
          }

          return (
            <Link
              key={index}
              href={shortcut.href!}
              className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 ${shortcut.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                  {shortcut.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {shortcut.description}
              </p>
            </Link>
          )
        })}
      </div>

      {/* Quick Commands Section */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Nützliche Befehle
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded p-3">
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              Alle Services starten
            </div>
            <code className="text-gray-600 dark:text-gray-400">npm run d</code>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded p-3">
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              Admin-Benutzer einrichten
            </div>
            <code className="text-gray-600 dark:text-gray-400">npm run setup-admins</code>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded p-3">
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              Container-Status prüfen
            </div>
            <code className="text-gray-600 dark:text-gray-400">docker ps</code>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded p-3">
            <div className="font-medium text-gray-900 dark:text-white mb-1">
              Medusa-Logs anzeigen
            </div>
            <code className="text-gray-600 dark:text-gray-400">npm run medusa:logs</code>
          </div>
        </div>
      </div>
    </div>
  )
}
