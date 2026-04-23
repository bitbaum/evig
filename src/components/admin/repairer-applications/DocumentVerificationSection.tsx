import { APPROVAL_STATUS, getApprovalStatusLabel } from '@/config/approval-status'
import Heading from '@/components/admin/AdminHeading'
import type { RepairerApplication, VerificationDocument, DocumentType, ActionDialogState } from './types'

interface Props {
  application: RepairerApplication
  isSelected: boolean
  documents: VerificationDocument[]
  missingRequiredDocuments: DocumentType[]
  documentActionLoading: string | null
  onSelect: (application: RepairerApplication) => void
  onOpenDialog: (type: ActionDialogState['type'], targetId: string) => void
}

export function DocumentVerificationSection({
  application,
  isSelected,
  documents,
  missingRequiredDocuments,
  documentActionLoading,
  onSelect,
  onOpenDialog,
}: Props) {
  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <Heading level={4} className="text-gray-900">Dokumentenverifizierung</Heading>
        <button
          onClick={() => onSelect(application)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Dokumente prüfen
        </button>
      </div>

      {isSelected && (
        <div className="space-y-4">
          {documents.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Hochgeladene Dokumente</h5>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        doc.status === APPROVAL_STATUS.APPROVED ? 'bg-green-500' :
                        doc.status === APPROVAL_STATUS.REJECTED ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {doc.documentTypeName || doc.originalFilename}
                        </p>
                        <p className="text-xs text-gray-600">
                          {doc.originalFilename} • {
                            doc.fileSizeBytes
                              ? `${Math.round(doc.fileSizeBytes / 1024)} KB`
                              : 'Unbekannte Grösse'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Anzeigen
                      </a>
                      {doc.status === APPROVAL_STATUS.PENDING && (
                        <>
                          <button
                            onClick={() => onOpenDialog('approve_doc', doc.id)}
                            disabled={documentActionLoading === doc.id}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50"
                          >
                            {documentActionLoading === doc.id ? '...' : 'Genehmigen'}
                          </button>
                          <button
                            onClick={() => onOpenDialog('reject_doc', doc.id)}
                            disabled={documentActionLoading === doc.id}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50"
                          >
                            {documentActionLoading === doc.id ? '...' : 'Ablehnen'}
                          </button>
                        </>
                      )}
                      {doc.status === APPROVAL_STATUS.APPROVED && (
                        <span className="text-xs text-green-600 font-medium">{getApprovalStatusLabel(APPROVAL_STATUS.APPROVED)}</span>
                      )}
                      {doc.status === APPROVAL_STATUS.REJECTED && (
                        <span className="text-xs text-red-600 font-medium">{getApprovalStatusLabel(APPROVAL_STATUS.REJECTED)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missingRequiredDocuments.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-red-700 mb-2">Fehlende erforderliche Dokumente</h5>
              <div className="space-y-2">
                {missingRequiredDocuments.map((docType) => (
                  <div key={docType.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-medium text-red-800">{docType.name}</p>
                      <p className="text-xs text-red-600">{docType.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {documents.length === 0 && missingRequiredDocuments.length === 0 && (
            <p className="text-sm text-gray-600">Keine Dokumente verfügbar</p>
          )}
        </div>
      )}
    </div>
  )
}
