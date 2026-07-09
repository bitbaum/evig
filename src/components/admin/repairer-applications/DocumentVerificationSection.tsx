import { APPROVAL_STATUS, getApprovalStatusLabel } from '@/config/approval-status'
import { getDocumentStatusBadge } from '@/config/document-status'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
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
    <div className="mt-6 pt-6 border-t border">
      <div className="flex items-center justify-between mb-4">
        <Heading level={4} className="text-text-primary">Dokumentenverifizierung</Heading>
        <Button
          type="button"
          onClick={() => onSelect(application)}
          variant="ghost"
          size="sm"
          className="text-sm text-action hover:text-action font-medium"
        >
          Dokumente prüfen
        </Button>
      </div>

      {isSelected && (
        <div className="space-y-4">
          {documents.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-text-secondary mb-2">Hochgeladene Dokumente</h5>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-surface-raised rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getDocumentStatusBadge(doc.status).bg}`} />
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {doc.documentTypeName || doc.originalFilename}
                        </p>
                        <p className="text-xs text-text-secondary">
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
                        className="text-action hover:text-action text-sm"
                      >
                        Anzeigen
                      </a>
                      {doc.status === APPROVAL_STATUS.PENDING && (
                        <>
                          <Button
                            type="button"
                            onClick={() => onOpenDialog('approve_doc', doc.id)}
                            disabled={documentActionLoading === doc.id}
                            variant="primary"
                            size="sm"
                            className="px-2 py-1 bg-action-muted text-action rounded-sm text-xs hover:bg-action-muted disabled:opacity-50"
                          >
                            {documentActionLoading === doc.id ? '...' : 'Genehmigen'}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => onOpenDialog('reject_doc', doc.id)}
                            disabled={documentActionLoading === doc.id}
                            variant="destructive-ghost"
                            size="sm"
                            className="px-2 py-1 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400 rounded-sm text-xs hover:bg-error-200 disabled:opacity-50"
                          >
                            {documentActionLoading === doc.id ? '...' : 'Ablehnen'}
                          </Button>
                        </>
                      )}
                      {doc.status === APPROVAL_STATUS.APPROVED && (
                        <span className="text-xs text-action font-medium">{getApprovalStatusLabel(APPROVAL_STATUS.APPROVED)}</span>
                      )}
                      {doc.status === APPROVAL_STATUS.REJECTED && (
                        <span className="text-xs text-error-600 font-medium">{getApprovalStatusLabel(APPROVAL_STATUS.REJECTED)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missingRequiredDocuments.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-error-700 mb-2">Fehlende erforderliche Dokumente</h5>
              <div className="space-y-2">
                {missingRequiredDocuments.map((docType) => (
                  <div key={docType.id} className="flex items-center gap-3 p-3 bg-error-50 dark:bg-error-900/20 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-error-500" />
                    <div>
                      <p className="text-sm font-medium text-error-800 dark:text-error-400">{docType.name}</p>
                      <p className="text-xs text-error-600 dark:text-error-400">{docType.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {documents.length === 0 && missingRequiredDocuments.length === 0 && (
            <p className="text-sm text-text-secondary">Keine Dokumente verfügbar</p>
          )}
        </div>
      )}
    </div>
  )
}
