import { formatDateShort } from '@/lib/date-formats'
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
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Zertifizierungsverifizierung</h4>
        <button
          onClick={() => onSelect(application)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Zertifizierungen prüfen
        </button>
      </div>

      {isSelected && (
        <div className="space-y-4">
          {certifications.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Eingereichte Zertifizierungen</h5>
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <div key={cert.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h6 className="font-medium text-gray-900">
                            {cert.certificationTypeName || cert.customName}
                          </h6>
                          {cert.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {cert.category}
                            </span>
                          )}
                          {cert.isExpired && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              Abgelaufen
                            </span>
                          )}
                          {cert.daysUntilExpiry && cert.daysUntilExpiry <= 90 && cert.daysUntilExpiry > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                              Läuft ab in {cert.daysUntilExpiry} Tagen
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
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
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                            <strong>Admin-Notiz:</strong> {cert.adminNotes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {cert.verificationStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => onOpenDialog('verify_cert', cert.id)}
                              disabled={certificationActionLoading === cert.id}
                              className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              {certificationActionLoading === cert.id ? '...' : 'Verifizieren'}
                            </button>
                            <button
                              onClick={() => onOpenDialog('reject_cert', cert.id)}
                              disabled={certificationActionLoading === cert.id}
                              className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                            >
                              {certificationActionLoading === cert.id ? '...' : 'Ablehnen'}
                            </button>
                          </>
                        )}
                        {cert.verificationStatus === 'verified' && (
                          <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Verifiziert
                          </span>
                        )}
                        {cert.verificationStatus === 'rejected' && (
                          <span className="px-3 py-1.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                            Abgelehnt
                          </span>
                        )}
                        {cert.verificationStatus === 'expired' && (
                          <span className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                            Abgelaufen
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications.length === 0 && (
            <p className="text-sm text-gray-600">Keine Zertifizierungen eingereicht</p>
          )}
        </div>
      )}
    </div>
  )
}
