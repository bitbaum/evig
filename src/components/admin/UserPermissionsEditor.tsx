'use client'

import { useState } from 'react'
import { Shield, Crown, Check, Save } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { Modal } from '@/components/ui/Modal'

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
    <Modal isOpen={true} onClose={onClose} title="Berechtigungen bearbeiten" size="lg">
        <p className="text-sm text-text-secondary -mt-3 mb-4">
          {userName || userEmail}
        </p>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {/* Super Admin Toggle */}
          <div className="mb-6 p-4 bg-action-muted-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-action" />
                <div>
                  <p className="font-medium text-action-text">
                    Super Admin Status
                  </p>
                  <p className="text-sm text-action">
                    Voller Zugriff auf alle Bereiche inkl. Benutzerverwaltung
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuperAdminStatus(!superAdminStatus)}
                disabled={isInHardcodedList && superAdminStatus}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  superAdminStatus
                    ? 'bg-action'
                    : 'bg-neutral-300'
                } ${isInHardcodedList && superAdminStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface-base rounded-full transition-transform ${
                  superAdminStatus ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>
            {isInHardcodedList && (
              <p className="mt-2 text-xs text-action">
                Dieser Benutzer ist in der Kern-Super-Admin-Liste und kann nicht herabgestuft werden.
              </p>
            )}
          </div>

          {/* Full Access Toggle */}
          {!superAdminStatus && (
            <div className="mb-6 p-4 bg-action-muted-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-action" />
                  <div>
                    <p className="font-medium text-action-text">
                      Voller Zugriff
                    </p>
                    <p className="text-sm text-action">
                      Zugriff auf alle Bereiche (ohne Super Admin Rechte)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setGrantFullAccess(!grantFullAccess)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    grantFullAccess
                      ? 'bg-action'
                      : 'bg-neutral-300'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface-base rounded-full transition-transform ${
                    grantFullAccess ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Individual Permissions */}
          {!superAdminStatus && !grantFullAccess && (
            <div>
              <Heading level={3} className="font-medium text-text-primary mb-3">
                Einzelne Bereiche
              </Heading>
              <div className="grid grid-cols-2 gap-2">
                {SECTIONS.map(section => (
                  <button
                    key={section.id}
                    onClick={() => togglePermission(section.id)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      selectedPermissions.includes(section.id)
                        ? 'border-action bg-action-muted-muted'
                        : 'border hover:border-strong'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedPermissions.includes(section.id)
                          ? 'bg-action border-action'
                          : 'border-neutral-300'
                      }`}>
                        {selectedPermissions.includes(section.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className={`font-medium ${
                        section.sensitive
                          ? 'text-error-700 dark:text-error-400'
                          : 'text-text-primary'
                      }`}>
                        {section.label}
                      </span>
                      {section.sensitive && (
                        <span className="text-xs text-error-500">Sensibel</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
              <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border flex justify-end gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="ghost"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
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
          </Button>
        </div>
    </Modal>
  )
}
