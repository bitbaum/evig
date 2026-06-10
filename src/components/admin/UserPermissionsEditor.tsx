'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Shield, Crown, Check, Save } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { Modal } from '@/components/ui/Modal'
import { getSection } from '@/config/sections'

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

// Editable sections — labels resolved at render time from admin.sectionLabels,
// with the section-config SSOT label as a fallback.
const SECTION_IDS: { id: string; sensitive: boolean }[] = [
  { id: 'dashboard', sensitive: false },
  { id: 'products', sensitive: false },
  { id: 'workshops-admin', sensitive: false },
  { id: 'services', sensitive: false },
  { id: 'locations', sensitive: false },
  { id: 'reviews', sensitive: false },
  { id: 'content', sensitive: false },
  { id: 'approvals', sensitive: false },
  { id: 'analytics', sensitive: false },
  { id: 'users', sensitive: true },
  { id: 'team', sensitive: true },
  { id: 'finances', sensitive: true },
  { id: 'settings', sensitive: true },
  { id: 'hirn', sensitive: true },
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
  const t = useTranslations('admin.permissions.editor')
  const tLabels = useTranslations('admin.sectionLabels')
  const tForms = useTranslations('admin.forms')
  const sectionLabelFor = (id: string): string => {
    const fallback = getSection(id)?.ui.label ?? id
    try { return tLabels(id as never) || fallback } catch { return fallback }
  }
  const hasFullAccess = currentPermissions.includes('*')

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    hasFullAccess ? SECTION_IDS.map(s => s.id) : currentPermissions
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
        throw new Error(result.error || t('saveError'))
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unknownError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={t('title')} size="lg">
        <p className="text-sm text-text-secondary -mt-3 mb-4">
          {userName || userEmail}
        </p>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {/* Super Admin Toggle */}
          <div className="mb-6 p-4 bg-action-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-action" />
                <div>
                  <p className="font-medium text-action-text">
                    {t('superAdminLabel')}
                  </p>
                  <p className="text-sm text-action">
                    {t('superAdminDescription')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSuperAdminStatus(!superAdminStatus)}
                disabled={isInHardcodedList && superAdminStatus}
                className={`relative w-12 h-6 rounded-full p-0 ${
                  superAdminStatus
                    ? 'bg-action hover:bg-action'
                    : 'bg-surface-overlay hover:bg-surface-overlay'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface-base rounded-full transition-transform ${
                  superAdminStatus ? 'translate-x-6' : ''
                }`} />
              </Button>
            </div>
            {isInHardcodedList && (
              <p className="mt-2 text-xs text-action">
                {t('superAdminHardcoded')}
              </p>
            )}
          </div>

          {/* Full Access Toggle */}
          {!superAdminStatus && (
            <div className="mb-6 p-4 bg-action-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-action" />
                  <div>
                    <p className="font-medium text-action-text">
                      {t('fullAccessLabel')}
                    </p>
                    <p className="text-sm text-action">
                      {t('fullAccessDescription')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setGrantFullAccess(!grantFullAccess)}
                  className={`relative w-12 h-6 rounded-full p-0 ${
                    grantFullAccess
                      ? 'bg-action hover:bg-action'
                      : 'bg-surface-overlay hover:bg-surface-overlay'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface-base rounded-full transition-transform ${
                    grantFullAccess ? 'translate-x-6' : ''
                  }`} />
                </Button>
              </div>
            </div>
          )}

          {/* Individual Permissions */}
          {!superAdminStatus && !grantFullAccess && (
            <div>
              <Heading level={3} className="font-medium text-text-primary mb-3">
                {t('individualHeading')}
              </Heading>
              <div className="grid grid-cols-2 gap-2">
                {SECTION_IDS.map(section => (
                  <Button
                    key={section.id}
                    variant="ghost"
                    onClick={() => togglePermission(section.id)}
                    className={`p-3 text-left rounded-lg border h-auto justify-start ${
                      selectedPermissions.includes(section.id)
                        ? 'border-action bg-action-muted'
                        : 'border hover:border-strong'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedPermissions.includes(section.id)
                          ? 'bg-action border-action'
                          : 'border-default'
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
                        {sectionLabelFor(section.id)}
                      </span>
                      {section.sensitive && (
                        <span className="text-xs text-error-500">{t('sensitiveBadge')}</span>
                      )}
                    </div>
                  </Button>
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
            {tForms('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {tForms('save')}
              </>
            )}
          </Button>
        </div>
    </Modal>
  )
}
