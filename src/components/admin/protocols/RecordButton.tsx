'use client'

/**
 * RecordButton — browser-native audio recorder.
 *
 * Uses the standard MediaRecorder API. WebM/Opus output (~1 MB/min).
 * Tap once to start, tap again to stop. On stop, emits a single
 * `File` object the parent can slot into SourceValue.audio so the
 * downstream pipeline doesn't know whether the audio came from an
 * upload or a recording.
 *
 * No third-party SDKs, no API keys, no external service — runs
 * entirely in the user's browser using a Web API that ships on every
 * modern browser (Firefox / Chromium / Safari ≥14.1).
 */

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mic, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

interface Props {
  /** Called when the user finishes a recording. Filename is timestamped. */
  onRecorded: (file: File) => void
  /** Block recording until the consent checkbox is ticked. */
  disabled?: boolean
  /** Override the disabled-tooltip — defaults to consent reminder. */
  disabledReason?: string
}

const PREFERRED_MIME = 'audio/webm;codecs=opus'

function pickMimeType(): string {
  // Safari ships MediaRecorder but doesn't support webm — falls back to
  // mp4. Trust the platform here; the server-side Whisper service
  // accepts both.
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(PREFERRED_MIME)) {
    return PREFERRED_MIME
  }
  return ''
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000)
  const min = Math.floor(total / 60).toString().padStart(2, '0')
  const sec = (total % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

export function RecordButton({ onRecorded, disabled, disabledReason }: Props) {
  const t = useTranslations('admin.protocols.record')

  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number>(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tick the elapsed clock while recording.
  useEffect(() => {
    if (!isRecording) {
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
      return
    }
    tickRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current)
    }, 250)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [isRecording])

  // Stop the stream + the recorder if the component unmounts mid-recording.
  useEffect(() => {
    return () => {
      const r = recorderRef.current
      if (r && r.state !== 'inactive') {
        r.stop()
      }
      r?.stream.getTracks().forEach((tr) => tr.stop())
    }
  }, [])

  const start = async () => {
    if (disabled) return
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = pickMimeType()
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blobMime = recorder.mimeType || mime || 'audio/webm'
        const ext = blobMime.includes('mp4') ? 'm4a' : 'webm'
        const blob = new Blob(chunksRef.current, { type: blobMime })
        const stamp = new Date().toISOString().replace(/[:.]/g, '-')
        const file = new File([blob], `aufnahme-${stamp}.${ext}`, { type: blobMime })
        // Free the mic immediately — don't keep the indicator on after stop.
        stream.getTracks().forEach((tr) => tr.stop())
        onRecorded(file)
      }

      startedAtRef.current = Date.now()
      setElapsedMs(0)
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      logger.warn('RecordButton: getUserMedia denied or failed', { error: String(err) })
      setError(t('errorPermission'))
    }
  }

  const stop = () => {
    const r = recorderRef.current
    if (r && r.state !== 'inactive') {
      r.stop()
    }
    setIsRecording(false)
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="destructive"
          onClick={stop}
          className="gap-2"
          aria-label={t('stopAriaLabel')}
        >
          <Square className="w-4 h-4 fill-current" aria-hidden="true" />
          {t('stop')}
        </Button>
        <span className="font-mono tabular-nums text-sm text-text-secondary">
          ● {formatElapsed(elapsedMs)}
        </span>
      </div>
    )
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={start}
        disabled={disabled}
        title={disabled ? (disabledReason || t('consentRequired')) : undefined}
        className="gap-2"
      >
        <Mic className="w-4 h-4" aria-hidden="true" />
        {t('start')}
      </Button>
      {error && (
        <p className="text-xs text-error-700 dark:text-error-300 mt-2">{error}</p>
      )}
    </div>
  )
}
