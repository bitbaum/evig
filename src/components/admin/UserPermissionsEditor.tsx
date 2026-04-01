'use client'

import { useState } from 'react'
import { Shield, Crown, Check, X, Save } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

interface UserPermissionsEditorProps {
  userId: string
  userName: string
  userEmail: string
  currentPermissions: string[]
  isSuperAdmin: boolean
  isInHardcodedList: boolean
  onClose: () => void
  onSaved: () => void
}

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', sensitive: false },
  { id: 'products', label: 'Produkte', sensitive: false },
  { id: 'workshops-admin', label: 'Workshops', sensitive: false },
  { id: 'services', label: 'Dienstleistungen', sensitive: false },
  { id: 'locations', label: 'Standorte', sensitive: false },
  { id: 'reviews', label: 'Bewertungen', sensitive: false },
  { id: 'content', label: 'Inhalte', sensitive: false },
  { id: 'approvals', label: 'Freigaben', sensitive: false },
  { id: 'analytics', label: 'Analytics', sensitive: false },
  { id: 'users', label: 'Benutzer', sensitive: true },
  { id: 'team', label: 'Team & HR', sensitive: true },
  { id: 'finances', label: 'Finanzen', sensitive: true },
  { id: 'settings', label: 'Einstellungen', sensitive: true },
  { id: 'hirn', label: 'Hirn', sensitive: true },
]

export function UserPermissionsEditor({
  userId,
  userName,
  userEmail,
  currentPermissions,
  isSuperAdmin: initialSuperAdmin,
  isInHardcodedList,
  onClose,
  onSaved,
}: UserPermissionsEditorProps) {
  const hasFullAccess = currentPermissions.includes('*')

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    hasFullAccess ? SECTIONS.map(s => s.id) : currentPermissions
  )
  const [superAdminStatus, setSuperAdminStatus] = useState(initialSuperAdmin)
  const [grantFullAccess, setGrantFullAccess] = useState(hasFullAccess)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const togglePermission = (sectionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(sectionId)
        ? prev.filter(p => p !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)

    try {
      const permissions = grantFullAccess ? ['*'] : selectedPermissions.filter(p => p !== '*')

      const result = await apiFetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PATCH',
        body: {
          permissions,
          isSuperAdmin: superAdminStatus,
        },
      })

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Speichern')
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Berechtigungen bearbeiten
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userName || userEmail}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Super Admin Toggle */}
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-200">
                    Super Admin Status
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Voller Zugriff auf alle Bereiche inkl. Benutzerverwaltung
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuperAdminStatus(!superAdminStatus)}
                disabled={isInHardcodedList && superAdminStatus}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  superAdminStatus
                    ? 'bg-purple-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                } ${isInHardcodedList && superAdminStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  superAdminStatus ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>
            {isInHardcodedList && (
              <p className="mt-2 text-xs text-purple-600">
                Dieser Benutzer ist in der Kern-Super-Admin-Liste und kann nicht herabgestuft werden.
              </p>
            )}
          </div>

          {/* Full Access Toggle */}
          {!superAdminStatus && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-200">
                      Voller Zugriff
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Zugriff auf alle Bereiche (ohne Super Admin Rechte)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setGrantFullAccess(!grantFullAccess)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    grantFullAccess
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    grantFullAccess ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Individual Permissions */}
          {!superAdminStatus && !grantFullAccess && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Einzelne Bereiche
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {SECTIONS.map(section => (
                  <button
                    key={section.id}
                    onClick={() => togglePermission(section.id)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      selectedPermissions.includes(section.id)
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedPermissions.includes(section.id)
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedPermissions.includes(section.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className={`font-medium ${
                        section.sensitive
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {section.label}
                      </span>
                      {section.sensitive && (
                        <span className="text-xs text-red-500">Sensibel</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Speichern
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
