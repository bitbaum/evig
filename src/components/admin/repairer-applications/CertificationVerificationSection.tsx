import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { CERTIFICATION_STATUS, CERTIFICATION_STATUS_LABELS, getCertificationStatusBadge } from '@/config/certification-status'
import type { RepairerApplication, Certification, ActionDialogState } from './types'

interface Props {
  application: RepairerApplication
  isSelected: boolean
  certifications: Certification[]
  certificationActionLoading: string | null
  onSelect: (application: RepairerApplication) => void
  onOpenDialog: (type: ActionDialogState['type'], targetId: string) => void
}

export function CertificationVerificationSection({
  application,
  isSelected,
  certifications,
  certificationActionLoading,
  onSelect,
  onOpenDialog,
}: Props) {
  return (
    <div className="mt-6 pt-6 border-t border">
      <div className="flex items-center justify-between mb-4">
        <Heading level={4} className="text-text-primary">Zertifizierungsverifizierung</Heading>
        <button
          onClick={() => onSelect(application)}
          className="text-sm text-action hover:text-primary-700 font-medium"
        >
          Zertifizierungen prüfen
        </button>
      </div>

      {isSelected && (
        <div className="space-y-4">
          {certifications.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-text-secondary mb-2">Eingereichte Zertifizierungen</h5>
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <div key={cert.id} className="p-4 bg-surface-raised rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h6 className="font-medium text-text-primary">
                            {cert.certificationTypeName || cert.customName}
                          </h6>
                          {cert.category && (
                            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full text-xs">
                              {cert.category}
                            </span>
                          )}
                          {cert.isExpired && (
                            <span className="px-2 py-1 bg-error-100 dark:bg-error-900/30 text-error-800 dark:text-error-400 rounded-full text-xs">
                              {CERTIFICATION_STATUS_LABELS.expired}
                            </span>
                          )}
                          {cert.daysUntilExpiry && cert.daysUntilExpiry <= 90 && cert.daysUntilExpiry > 0 && (
                            <span className="px-2 py-1 bg-secondary-100 text-secondary-800 rounded-full text-xs">
                              Läuft ab in {cert.daysUntilExpiry} Tagen
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary">
                          {cert.issuingAuthority && (
                            <div>
                              <span className="font-medium">Ausstellende Stelle:</span><br />
                              {cert.issuingAuthority}
                            </div>
                          )}
                          {cert.certificationNumber && (
                            <div>
                              <span className="font-medium">Zertifizierungsnummer:</span><br />
                              {cert.certificationNumber}
                            </div>
                          )}
                          {cert.issueDate && (
                            <div>
                              <span className="font-medium">Ausstellungsdatum:</span><br />
                              {formatDateShort(cert.issueDate)}
                            </div>
                          )}
                          {cert.expiryDate && (
                            <div>
                              <span className="font-medium">Ablaufdatum:</span><br />
                              {formatDateShort(cert.expiryDate)}
                            </div>
                          )}
                        </div>

                        {cert.adminNotes && (
                          <div className="mt-2 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-sm text-sm text-primary-800 dark:text-primary-300">
                            <strong>Admin-Notiz:</strong> {cert.adminNotes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {cert.verificationStatus === CERTIFICATION_STATUS.PENDING && (
                          <>
                            <Button
                              onClick={() => onOpenDialog('verify_cert', cert.id)}
                              disabled={certificationActionLoading === cert.id}
                              variant="primary"
                              size="sm"
                            >
                              {certificationActionLoading === cert.id ? '...' : 'Verifizieren'}
                            </Button>
                            <Button
                              onClick={() => onOpenDialog('reject_cert', cert.id)}
                              disabled={certificationActionLoading === cert.id}
                              variant="destructive"
                              size="sm"
                            >
                              {certificationActionLoading === cert.id ? '...' : 'Ablehnen'}
                            </Button>
                          </>
                        )}
                        {cert.verificationStatus !== CERTIFICATION_STATUS.PENDING && (() => {
                          const badge = getCertificationStatusBadge(cert.verificationStatus)
                          return (
                            <span className={`px-3 py-1.5 ${badge.bg} ${badge.color} rounded-sm text-xs font-medium`}>
                              {badge.label}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications.length === 0 && (
            <p className="text-sm text-text-secondary">Keine Zertifizierungen eingereicht</p>
          )}
        </div>
      )}
    </div>
  )
}
