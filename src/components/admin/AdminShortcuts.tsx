'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import {
  ADMIN_SHORTCUTS,
  ADMIN_QUICK_COMMANDS,
  type AdminShortcut,
} from '@/config/admin'

/**
 * Renders a single shortcut item based on its type
 */
function ShortcutCard({ shortcut }: { shortcut: AdminShortcut }) {
  const IconComponent = shortcut.icon

  const handleAction = () => {
    if (shortcut.command) {
      navigator.clipboard.writeText(shortcut.command)
      alert(`Befehl in Zwischenablage kopiert: ${shortcut.command}`)
    }
  }

  const cardContent = (
    <>
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-8 h-8 ${shortcut.color} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <IconComponent className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
          {shortcut.title}
        </h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {shortcut.description}
      </p>
    </>
  )

  const cardClassName =
    "group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"

  // Action shortcut (copy command to clipboard)
  if (shortcut.command && !shortcut.href) {
    return (
      <button onClick={handleAction} className={`${cardClassName} text-left`}>
        {cardContent}
      </button>
    )
  }

  // External link
  if (shortcut.external && shortcut.href) {
    return (
      <a
        href={shortcut.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClassName}
      >
        {cardContent}
      </a>
    )
  }

  // Internal link
  if (shortcut.href) {
    return (
      <Link href={shortcut.href} className={cardClassName}>
        {cardContent}
      </Link>
    )
  }

  return null
}

/**
 * AdminShortcuts Component
 *
 * Displays admin shortcuts and quick commands.
 * Configuration is loaded from @/config/admin (SSOT)
 */
export default function AdminShortcuts() {
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
        {ADMIN_SHORTCUTS.map((shortcut) => (
          <ShortcutCard key={shortcut.id} shortcut={shortcut} />
        ))}
      </div>

      {/* Quick Commands Section */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Nützliche Befehle
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {ADMIN_QUICK_COMMANDS.map((cmd) => (
            <div
              key={cmd.command}
              className="bg-gray-50 dark:bg-gray-700/30 rounded p-3"
            >
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                {cmd.title}
              </div>
              <code className="text-gray-600 dark:text-gray-400">
                {cmd.command}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
