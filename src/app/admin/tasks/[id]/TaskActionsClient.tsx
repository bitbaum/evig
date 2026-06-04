'use client'

import {
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Archive,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
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
    <div className="bg-surface-base rounded-lg border p-6">
      <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">Aktionen</Heading>

      {error && (
        <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowCompleteForm(!showCompleteForm)} variant="primary">
          <CheckCircle2 className="w-4 h-4" />
          Als erledigt markieren
        </Button>

        <Button
          onClick={() => setShowAttentionForm(!showAttentionForm)}
          variant="destructive"
        >
          <AlertTriangle className="w-4 h-4" />
          Aufmerksamkeit nötig
        </Button>

        <Button
          onClick={() => setShowRequestForm(!showRequestForm)}
          variant="warning"
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          Um Hilfe bitten
        </Button>
      </div>

      {/* Complete Form */}
      {showCompleteForm && (
        <div className="mt-4 p-4 bg-action-muted-muted rounded-lg border border-strong">
          <Heading level={3} className="font-medium text-action-text mb-3">
            Aufgabe als erledigt markieren
          </Heading>
          <div className="space-y-3">
            <FormField label="Dauer (Minuten)" htmlFor="task-duration">
              <Input
                id="task-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="z.B. 30"
              />
            </FormField>
            <FormField label="Notizen (optional)" htmlFor="task-notes">
              <Textarea
                id="task-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anmerkungen zur Erledigung..."
                rows={3}
              />
            </FormField>
            <div className="flex gap-2">
              <Button
                onClick={handleComplete}
                disabled={loading === 'complete'}
                variant="primary"
              >
                {loading === 'complete' && <Loader2 className="w-4 h-4 animate-spin" />}
                Bestätigen
              </Button>
              <Button
                onClick={() => setShowCompleteForm(false)}
                variant="ghost"
                size="sm"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Attention Form */}
      {showAttentionForm && (
        <div className="mt-4 p-4 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200">
          <Heading level={3} className="font-medium text-error-800 dark:text-error-200 mb-3">
            Aufgabe braucht Aufmerksamkeit
          </Heading>
          <div className="space-y-3">
            <FormField label="Nachricht (optional)" htmlFor="attention-message">
              <Textarea
                id="attention-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Was ist das Problem?"
                rows={3}
              />
            </FormField>
            <div className="flex gap-2">
              <Button
                onClick={handleFlagAttention}
                disabled={loading === 'attention'}
                variant="destructive"
              >
                {loading === 'attention' && <Loader2 className="w-4 h-4 animate-spin" />}
                Markieren
              </Button>
              <Button
                onClick={() => setShowAttentionForm(false)}
                variant="ghost"
                size="sm"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Request Form */}
      {showRequestForm && (
        <div className="mt-4 p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200">
          <Heading level={3} className="font-medium text-warning-800 dark:text-warning-200 mb-3">Um Hilfe bitten</Heading>
          <div className="space-y-3">
            <FormField label="An wen?" htmlFor="request-target">
              <Select
                id="request-target"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Alle Teammitglieder</option>
                {staffMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Nachricht (optional)" htmlFor="request-message">
              <Textarea
                id="request-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Was wird benötigt?"
                rows={3}
              />
            </FormField>
            <div className="flex gap-2">
              <Button
                onClick={handleRequest}
                disabled={loading === 'request'}
                variant="warning"
                className="gap-2"
              >
                {loading === 'request' && <Loader2 className="w-4 h-4 animate-spin" />}
                {selectedUserId ? 'Anfrage senden' : 'An alle senden'}
              </Button>
              <Button
                onClick={() => setShowRequestForm(false)}
                variant="ghost"
                size="sm"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Section */}
      {!isArchived && (
        <div className="mt-6 pt-4 border-t">
          {!showArchiveConfirm ? (
            <Button
              variant="destructive-outline"
              size="sm"
              onClick={() => setShowArchiveConfirm(true)}
              className="gap-2"
            >
              <Archive className="w-4 h-4" />
              Aufgabe archivieren
            </Button>
          ) : (
            <div className="p-4 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200">
              <p className="text-sm text-error-700 dark:text-error-300 mb-3">
                Aufgabe &ldquo;{taskTitle}&rdquo; wirklich archivieren? Diese wird aus der Liste entfernt.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleArchive}
                  disabled={loading === 'archive'}
                  variant="destructive"
                >
                  {loading === 'archive' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Archivieren
                </Button>
                <Button
                  onClick={() => setShowArchiveConfirm(false)}
                  variant="ghost"
                  size="sm"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
