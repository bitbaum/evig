'use client'

import { useState } from 'react'
import { Loader2, FileText, Mic, Users, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { MEETING_TYPE_LABELS, PROTOCOL_VISIBILITY_LABELS } from '@/config/protocols'
import type { MeetingType, ProtocolVisibility } from '@/config/protocols'
import Heading from '@/components/admin/AdminHeading'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { useProtocolForm } from '@/hooks/useProtocolForm'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { StatusBanner } from '@/components/ui/status-banner'
import { SourceUploader } from '@/components/admin/protocols/SourceUploader'
import { RecordButton } from '@/components/admin/protocols/RecordButton'
import { ProtocolConsent } from '@/components/admin/protocols/ProtocolConsent'
import { CaptureAlternatives } from '@/components/admin/protocols/CaptureAlternatives'
import { adminInteractive } from '@/lib/admin-ui'

interface ProtocolFormClientProps {
  teamMembers: Array<{ id: string; name: string }>
}

export default function ProtocolFormClient({ teamMembers }: ProtocolFormClientProps) {
  const {
    meetingType, setMeetingType,
    title, setTitle,
    meetingDate, setMeetingDate,
    visibility, setVisibility,
    selectedAttendees,
    showAttendees, setShowAttendees,
    attendeeSearch, setAttendeeSearch,
    content, setContent,
    sources, setSources,
    loading, processing, error, setError,
    canSubmit,
    contentFormat,
    filteredTeamMembers,
    handleAIFieldsFilled,
    toggleAttendee,
    selectAllAttendees,
    handleSubmit,
  } = useProtocolForm(teamMembers)

  const hasAudio = sources.audio !== null
  const hasTextFiles = sources.textFiles.length > 0
  const hasTypedText = content.trim().length > 0
  // Meeting details are optional (the AI fills type/title/attendees from the
  // recording), so keep them collapsed by default — the upload is the hero.
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="max-w-3xl space-y-6">
      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      {/* Inhalt — the hero. Drop a recording, record live, or paste notes;
          the AI transcribes and structures everything in one pass. This is the
          one thing the user came here to do, so it leads. */}
      <div className="bg-surface-base rounded-lg border p-6 space-y-5">
        <div>
          <Heading level={2} className="text-lg font-semibold text-text-primary">Inhalt</Heading>
          <p className="text-sm text-text-secondary mt-1">
            Lade Audio, Notizen oder Dateien hoch oder tippe direkt hinein.
            Die KI strukturiert alles in einem Durchgang und ergänzt Titel, Typ
            und Teilnehmer selbst.
          </p>
        </div>

        {/* Record + upload sit side-by-side — same data target. The
            consent gate is browser-side legal (StGB Art. 179bis); audio
            recorded without it is a CH criminal offence regardless of
            our app's policy. */}
        <CaptureControls
          sources={sources}
          setSources={setSources}
          setError={setError}
          disabled={loading || processing}
        />

        <CaptureAlternatives />

        <FormField label="Notizen / Text einfügen (optional)" htmlFor="content">
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Notizen, Stichpunkte oder eine ganze Mitschrift — die KI macht ein Protokoll daraus..."
            rows={8}
            className="font-mono text-sm"
          />
          <div className="flex items-center justify-between mt-1">
            {contentFormat ? (
              <span className={`text-xs px-2 py-0.5 rounded-full ${contentFormat === 'json' ? 'bg-action-muted text-action' : 'bg-surface-raised text-text-secondary'}`}>
                {contentFormat === 'json' ? 'JSON erkannt' : 'Freitext'}
              </span>
            ) : <span />}
            <span className="text-xs text-text-tertiary">{content.length} Zeichen</span>
          </div>
        </FormField>
      </div>

      {/* Sitzungsdetails — optional; collapsed by default. Describe the meeting
          in words (KI-Assistent) or set the fields by hand to override what the
          AI infers from the recording. */}
      <div className="bg-surface-base rounded-lg border p-6 space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center justify-between text-left h-auto p-0 bg-transparent hover:bg-transparent"
        >
          <span className="text-lg font-semibold text-text-primary">
            Sitzungsdetails{' '}
            <span className="text-sm font-normal text-text-tertiary">— optional, die KI ergänzt fehlende Angaben</span>
          </span>
          {showDetails ? <ChevronUp className="w-5 h-5 text-text-tertiary" /> : <ChevronDown className="w-5 h-5 text-text-tertiary" />}
        </Button>

        {showDetails && (
          <div className="space-y-4">
            {/* Natural-language field filler — pairs with the fields it fills. */}
            <AIFormAssist
              formType="protocol"
              variant="bar"
              defaultExpanded={true}
              placeholder="z.B. Vorstandssitzung März 2026 mit Andreas und Maria..."
              currentData={{ title, meeting_type: meetingType, meeting_date: meetingDate, visibility }}
              onFieldsFilled={handleAIFieldsFilled}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Sitzungstyp" htmlFor="meeting_type">
                <Select
                  id="meeting_type"
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                >
                  <option value="">Typ wählen...</option>
                  {Object.entries(MEETING_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Datum" htmlFor="meeting_date">
                <Input
                  id="meeting_date"
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Titel" htmlFor="title">
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Teamsitzung — 2. April 2026"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Sichtbarkeit" htmlFor="visibility">
                <Select
                  id="visibility"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as ProtocolVisibility)}
                >
                  {Object.entries(PROTOCOL_VISIBILITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
              </FormField>
            </div>

            {/* Attendees */}
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAttendees(!showAttendees)}
                className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                <Users className="w-4 h-4" />
                Teilnehmer ({selectedAttendees.length}/{teamMembers.length})
                {showAttendees ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {showAttendees && (
                <div className="mt-2 p-3 bg-surface-raised rounded-lg border space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      type="text"
                      value={attendeeSearch}
                      onChange={(e) => setAttendeeSearch(e.target.value)}
                      placeholder="Teilnehmer suchen..."
                      className="flex-1 py-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={selectAllAttendees}
                      className="text-xs text-action hover:text-action font-medium whitespace-nowrap"
                    >
                      {selectedAttendees.length === teamMembers.length ? 'Keine auswählen' : 'Alle auswählen'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-64 overflow-y-auto">
                    {filteredTeamMembers.map((member) => (
                      <label
                        key={member.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-sm ${adminInteractive.rowHover} cursor-pointer text-sm`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAttendees.includes(member.id)}
                          onChange={() => toggleAttendee(member.id)}
                          className="rounded-sm border-default text-action focus:ring-action"
                        />
                        {member.name}
                      </label>
                    ))}
                    {filteredTeamMembers.length === 0 && (
                      <p className="text-sm text-text-tertiary px-2 py-1">Keine Teilnehmer gefunden</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit — its own footer so the primary action reads clearly after
          content + optional details. */}
      <div className="bg-surface-base rounded-lg border p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-text-tertiary flex items-center gap-2">
            {hasAudio && (
              <span className="inline-flex items-center gap-1">
                <Mic className="w-3 h-3" /> Audio
              </span>
            )}
            {(hasTextFiles || hasTypedText) && (
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {hasTextFiles && hasTypedText
                  ? 'Notizen + Dateien'
                  : hasTextFiles
                    ? `${sources.textFiles.length} Datei${sources.textFiles.length === 1 ? '' : 'en'}`
                    : 'Notizen'}
              </span>
            )}
            {!hasAudio && !hasTextFiles && !hasTypedText && (
              <span>Quellen hochladen oder Notizen eingeben</span>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            variant="primary"
            size="lg"
            className="flex items-center gap-2"
          >
            {(loading || processing) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {processing ? 'KI verarbeitet...' : 'Erstellt...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Protokoll erstellen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * CaptureControls — record button + upload zone + consent gate.
 *
 * Keeps consent state local (it's UX, not part of the submitted form),
 * persists "remember me" via ProtocolConsent's localStorage handler.
 */
interface CaptureControlsProps {
  sources: ReturnType<typeof useProtocolForm>['sources']
  setSources: ReturnType<typeof useProtocolForm>['setSources']
  setError: (msg: string | null) => void
  disabled?: boolean
}

function CaptureControls({ sources, setSources, setError, disabled }: CaptureControlsProps) {
  const [consented, setConsented] = useState(false)

  const handleRecorded = (audioFile: File) => {
    setSources({ ...sources, audio: audioFile })
  }

  return (
    <div className="space-y-4">
      <ProtocolConsent value={consented} onChange={setConsented} />

      <div className="flex flex-wrap items-center gap-3">
        <RecordButton onRecorded={handleRecorded} disabled={disabled || !consented} />
        <span className="text-xs text-text-tertiary">oder</span>
        <span className="text-xs text-text-tertiary">Datei hochladen / Notizen einfügen ↓</span>
      </div>

      <SourceUploader
        value={sources}
        onChange={setSources}
        onError={setError}
        disabled={disabled}
      />
    </div>
  )
}
