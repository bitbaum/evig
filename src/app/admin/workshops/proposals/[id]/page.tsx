'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { EditHistoryView } from '@/components/admin/EditHistoryView';
import { EditProposalModal } from '@/components/admin/workshops/EditProposalModal';
import { getEditableFieldLabels } from '@/config/editable-fields';
import { formatDateTime, formatDateShort } from '@/lib/date-formats';
import { logger } from '@/lib/logger';
import type { WorkshopProposalWithProposer } from '@/components/workshops/types';

export default function WorkshopProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<WorkshopProposalWithProposer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const proposalId = params.id as string;

  useEffect(() => {
    fetchProposal();
  }, [proposalId]);

  const fetchProposal = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/workshops/proposals/${proposalId}`);
      const data = await response.json();

      if (data.success && data.data.proposal) {
        setProposal(data.data.proposal);
      } else {
        setError(data.error || 'Fehler beim Laden des Vorschlags');
      }
    } catch (err) {
      logger.error('Error fetching proposal', { error: err });
      setError('Netzwerkfehler beim Laden des Vorschlags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSaved = () => {
    setShowEditModal(false);
    fetchProposal(); // Refresh data
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || 'Vorschlag nicht gefunden'}</p>
            <Link
              href="/admin/workshops"
              className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700"
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
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin/workshops"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Liste
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
              <p className="mt-2 text-sm text-gray-600">
                Vorgeschlagen von {proposal.proposer_name} ({proposal.proposer_email}) •{' '}
                {formatDateShort(proposal.created_at)}
              </p>
            </div>
            {proposal.status === 'pending' && (
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center text-sm text-blue-800">
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
            {/* Description */}
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Beschreibung</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{proposal.description}</p>
            </section>

            {/* Short Description */}
            {proposal.short_description && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Kurzbeschreibung</h2>
                <p className="text-gray-700">{proposal.short_description}</p>
              </section>
            )}

            {/* Learning Objectives */}
            {proposal.learning_objectives && proposal.learning_objectives.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Lernziele</h2>
                <ul className="list-disc list-inside space-y-2">
                  {proposal.learning_objectives.map((obj: string, idx: number) => (
                    <li key={idx} className="text-gray-700">
                      {obj}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Prerequisites */}
            {proposal.prerequisites && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Voraussetzungen</h2>
                <p className="text-gray-700">{proposal.prerequisites}</p>
              </section>
            )}

            {/* Materials */}
            {(proposal.materials_provided || proposal.materials_required) && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Materialien</h2>
                {proposal.materials_provided && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Bereitgestellte Materialien:
                    </h3>
                    <p className="text-gray-700">{proposal.materials_provided}</p>
                  </div>
                )}
                {proposal.materials_required && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Benötigte Materialien:
                    </h3>
                    <p className="text-gray-700">{proposal.materials_required}</p>
                  </div>
                )}
              </section>
            )}

            {/* Edit History */}
            {proposal.edit_history && proposal.edit_history.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Bearbeitungsverlauf</h2>
                <EditHistoryView history={proposal.edit_history} fieldLabels={fieldLabels} />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold mb-4">Status</h3>
              <div className="flex items-center gap-2">
                {proposal.status === 'approved' && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
                {proposal.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
                {proposal.status === 'rejected' && <X className="w-5 h-5 text-red-600" />}
                {proposal.status === 'requires_changes' && (
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                )}
                <span className="font-medium capitalize">{proposal.status}</span>
              </div>
            </section>

            {/* Details */}
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold mb-4">Details</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-600 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Kategorie
                  </dt>
                  <dd className="font-medium mt-1">{proposal.category}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Level</dt>
                  <dd className="font-medium mt-1 capitalize">{proposal.level}</dd>
                </div>
                <div>
                  <dt className="text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Dauer
                  </dt>
                  <dd className="font-medium mt-1">{proposal.duration_minutes} Minuten</dd>
                </div>
                <div>
                  <dt className="text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Teilnehmer
                  </dt>
                  <dd className="font-medium mt-1">
                    {proposal.min_participants}-{proposal.max_participants}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Preis
                  </dt>
                  <dd className="font-medium mt-1">
                    CHF {(proposal.price_cents / 100).toFixed(2)}
                  </dd>
                </div>
                {proposal.target_audience && (
                  <div>
                    <dt className="text-gray-600">Zielgruppe</dt>
                    <dd className="font-medium mt-1">{proposal.target_audience}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Location */}
            <section className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Standort
              </h3>
              <p className="text-sm text-gray-700">
                {proposal.location_type === 'online'
                  ? 'Online'
                  : proposal.location_type === 'home'
                  ? 'Zu Hause'
                  : proposal.selected_location_name || proposal.proposed_location || 'Veranstaltungsort'}
              </p>
            </section>

            {/* Reviewer Info */}
            {proposal.reviewed_by && (
              <section className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold mb-4">Reviewer</h3>
                <p className="text-sm text-gray-700">
                  {proposal.reviewer_name || 'Admin'}
                  <br />
                  {proposal.reviewed_at && (
                    <span className="text-gray-500">
                      {formatDateTime(proposal.reviewed_at)}
                    </span>
                  )}
                </p>
                {proposal.admin_notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600">Notizen:</p>
                    <p className="text-sm text-gray-700 mt-1">{proposal.admin_notes}</p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
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
