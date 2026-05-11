'use client'

import {
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Archive,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { useTaskActions } from '@/hooks/useTaskActions'

interface TaskActionsClientProps {
  taskId: string
  taskTitle: string
  isArchived?: boolean
}

export default function TaskActionsClient({
  taskId,
  taskTitle,
  isArchived = false,
}: TaskActionsClientProps) {
  const {
    loading,
    showCompleteForm,
    showAttentionForm,
    showRequestForm,
    showArchiveConfirm,
    notes,
    duration,
    message,
    error,
    staffMembers,
    selectedUserId,
    setShowCompleteForm,
    setShowAttentionForm,
    setShowRequestForm,
    setShowArchiveConfirm,
    setNotes,
    setDuration,
    setMessage,
    setSelectedUserId,
    handleComplete,
    handleFlagAttention,
    handleRequest,
    handleArchive,
  } = useTaskActions(taskId)

  return (
    <div className="bg-white rounded-lg border p-6">
      <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-4">Aktionen</Heading>

      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowCompleteForm(!showCompleteForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          Als erledigt markieren
        </button>

        <button
          onClick={() => setShowAttentionForm(!showAttentionForm)}
          className="flex items-center gap-2 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Aufmerksamkeit nötig
        </button>

        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          className="flex items-center gap-2 px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors"
        >
          <Send className="w-4 h-4" />
          Um Hilfe bitten
        </button>
      </div>

      {/* Complete Form */}
      {showCompleteForm && (
        <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <Heading level={3} className="font-medium text-primary-800 mb-3">
            Aufgabe als erledigt markieren
          </Heading>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Dauer (Minuten)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="z.B. 30"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notizen (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anmerkungen zur Erledigung..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleComplete}
                disabled={loading === 'complete'}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {loading === 'complete' && <Loader2 className="w-4 h-4 animate-spin" />}
                Bestätigen
              </button>
              <button
                onClick={() => setShowCompleteForm(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attention Form */}
      {showAttentionForm && (
        <div className="mt-4 p-4 bg-error-50 rounded-lg border border-error-200">
          <Heading level={3} className="font-medium text-error-800 mb-3">
            Aufgabe braucht Aufmerksamkeit
          </Heading>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nachricht (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Was ist das Problem?"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-error-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFlagAttention}
                disabled={loading === 'attention'}
                className="flex items-center gap-2 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50"
              >
                {loading === 'attention' && <Loader2 className="w-4 h-4 animate-spin" />}
                Markieren
              </button>
              <button
                onClick={() => setShowAttentionForm(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Form */}
      {showRequestForm && (
        <div className="mt-4 p-4 bg-warning-50 rounded-lg border border-warning-200">
          <Heading level={3} className="font-medium text-warning-800 mb-3">Um Hilfe bitten</Heading>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                An wen?
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-warning-500"
              >
                <option value="">Alle Teammitglieder</option>
                {staffMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nachricht (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Was wird benötigt?"
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-warning-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRequest}
                disabled={loading === 'request'}
                className="flex items-center gap-2 px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors disabled:opacity-50"
              >
                {loading === 'request' && <Loader2 className="w-4 h-4 animate-spin" />}
                {selectedUserId ? 'Anfrage senden' : 'An alle senden'}
              </button>
              <button
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Section */}
      {!isArchived && (
        <div className="mt-6 pt-4 border-t">
          {!showArchiveConfirm ? (
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-error-600 border border-error-200 rounded-lg hover:bg-error-50 transition-colors"
            >
              <Archive className="w-4 h-4" />
              Aufgabe archivieren
            </button>
          ) : (
            <div className="p-4 bg-error-50 rounded-lg border border-error-200">
              <p className="text-sm text-error-700 mb-3">
                Aufgabe &ldquo;{taskTitle}&rdquo; wirklich archivieren? Diese wird aus der Liste entfernt.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleArchive}
                  disabled={loading === 'archive'}
                  className="flex items-center gap-2 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50"
                >
                  {loading === 'archive' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Archivieren
                </button>
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-900"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
