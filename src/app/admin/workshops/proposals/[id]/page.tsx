'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Check,
  X,
  AlertCircle,
  Clock,
  Users,
  MapPin,
  DollarSign,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { EditHistoryView } from '@/components/admin/EditHistoryView';
import { EditProposalModal } from '@/components/admin/workshops/EditProposalModal';
import { getEditableFieldLabels } from '@/config/editable-fields';
import { formatDateTime, formatDateShort } from '@/lib/date-formats';
import { formatPriceCents } from '@/config/marketplace';
import { APPROVAL_STATUS } from '@/config/approval-status';
import Heading from '@/components/admin/AdminHeading';
import { useWorkshopProposalDetail } from '@/hooks/useWorkshopProposalDetail';

export default function WorkshopProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id as string;

  const { proposal, isLoading, error, showEditModal, setShowEditModal, handleEditSaved } =
    useWorkshopProposalDetail(proposalId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
              <div className="h-4 bg-neutral-200 rounded w-full"></div>
              <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg p-6">
            <p className="text-error-800 dark:text-error-400">{error || 'Vorschlag nicht gefunden'}</p>
            <Link
              href="/admin/workshops"
              className="inline-flex items-center mt-4 text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Liste
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fieldLabels = getEditableFieldLabels('workshop');

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin/workshops"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Liste
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="text-3xl font-bold text-neutral-900">{proposal.title}</Heading>
              <p className="mt-2 text-sm text-neutral-600">
                Vorgeschlagen von {proposal.proposer_name} ({proposal.proposer_email}) •{' '}
                {formatDateShort(proposal.created_at)}
              </p>
            </div>
            {proposal.status === APPROVAL_STATUS.PENDING && (
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Indicator */}
      {proposal.last_edited_at && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center text-sm text-neutral-800">
              <AlertCircle className="w-4 h-4 mr-2" />
              Bearbeitet durch Admin ({proposal.editor_name || 'Admin'}) am{' '}
              {formatDateTime(proposal.last_edited_at)}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <Heading level={2} className="text-xl font-semibold mb-4">Beschreibung</Heading>
              <p className="text-neutral-700 whitespace-pre-wrap">{proposal.description}</p>
            </section>

            {proposal.short_description && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Kurzbeschreibung</Heading>
                <p className="text-neutral-700">{proposal.short_description}</p>
              </section>
            )}

            {proposal.learning_objectives && proposal.learning_objectives.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Lernziele</Heading>
                <ul className="list-disc list-inside space-y-2">
                  {proposal.learning_objectives.map((obj: string, idx: number) => (
                    <li key={idx} className="text-neutral-700">{obj}</li>
                  ))}
                </ul>
              </section>
            )}

            {proposal.prerequisites && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Voraussetzungen</Heading>
                <p className="text-neutral-700">{proposal.prerequisites}</p>
              </section>
            )}

            {(proposal.materials_provided || proposal.materials_required) && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Materialien</Heading>
                {proposal.materials_provided && (
                  <div className="mb-4">
                    <Heading level={3} className="text-sm font-semibold text-neutral-700 mb-2">
                      Bereitgestellte Materialien:
                    </Heading>
                    <p className="text-neutral-700">{proposal.materials_provided}</p>
                  </div>
                )}
                {proposal.materials_required && (
                  <div>
                    <Heading level={3} className="text-sm font-semibold text-neutral-700 mb-2">
                      Benötigte Materialien:
                    </Heading>
                    <p className="text-neutral-700">{proposal.materials_required}</p>
                  </div>
                )}
              </section>
            )}

            {proposal.edit_history && proposal.edit_history.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Bearbeitungsverlauf</Heading>
                <EditHistoryView history={proposal.edit_history} fieldLabels={fieldLabels} />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <Heading level={3} className="font-semibold mb-4">Status</Heading>
              <div className="flex items-center gap-2">
                {proposal.status === APPROVAL_STATUS.APPROVED && (
                  <Check className="w-5 h-5 text-primary-600" />
                )}
                {proposal.status === APPROVAL_STATUS.PENDING && <Clock className="w-5 h-5 text-warning-600" />}
                {proposal.status === APPROVAL_STATUS.REJECTED && <X className="w-5 h-5 text-error-600" />}
                {proposal.status === APPROVAL_STATUS.REQUIRES_CHANGES && (
                  <AlertCircle className="w-5 h-5 text-secondary-600" />
                )}
                <span className="font-medium capitalize">{proposal.status}</span>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm border p-6">
              <Heading level={3} className="font-semibold mb-4">Details</Heading>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-neutral-600 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Kategorie
                  </dt>
                  <dd className="font-medium mt-1">{proposal.category}</dd>
                </div>
                <div>
                  <dt className="text-neutral-600">Level</dt>
                  <dd className="font-medium mt-1 capitalize">{proposal.level}</dd>
                </div>
                <div>
                  <dt className="text-neutral-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Dauer
                  </dt>
                  <dd className="font-medium mt-1">{proposal.duration_minutes} Minuten</dd>
                </div>
                <div>
                  <dt className="text-neutral-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Teilnehmer
                  </dt>
                  <dd className="font-medium mt-1">
                    {proposal.min_participants}-{proposal.max_participants}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Preis
                  </dt>
                  <dd className="font-medium mt-1">{formatPriceCents(proposal.price_cents)}</dd>
                </div>
                {proposal.target_audience && (
                  <div>
                    <dt className="text-neutral-600">Zielgruppe</dt>
                    <dd className="font-medium mt-1">{proposal.target_audience}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="bg-white rounded-lg shadow-sm border p-6">
              <Heading level={3} className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Standort
              </Heading>
              <p className="text-sm text-neutral-700">
                {proposal.location_type === 'online'
                  ? 'Online'
                  : proposal.location_type === 'home'
                  ? 'Zu Hause'
                  : proposal.selected_location_name || proposal.proposed_location || 'Veranstaltungsort'}
              </p>
            </section>

            {proposal.created_workshop && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <Heading level={3} className="font-semibold mb-3">Erstellter Workshop</Heading>
                <Link
                  href={`/admin/workshops/${proposal.created_workshop.id}`}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  {proposal.created_workshop.title}
                </Link>
              </section>
            )}

            {proposal.reviewed_by && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <Heading level={3} className="font-semibold mb-4">Reviewer</Heading>
                <p className="text-sm text-neutral-700">
                  {proposal.reviewer_name || 'Admin'}
                  <br />
                  {proposal.reviewed_at && (
                    <span className="text-neutral-500">
                      {formatDateTime(proposal.reviewed_at)}
                    </span>
                  )}
                </p>
                {proposal.admin_notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-neutral-600">Notizen:</p>
                    <p className="text-sm text-neutral-700 mt-1">{proposal.admin_notes}</p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProposalModal
          proposal={proposal}
          onClose={() => setShowEditModal(false)}
          onSaved={handleEditSaved}
        />
      )}
    </main>
  );
}
