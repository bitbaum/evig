'use client'

/**
 * CaptureAlternatives — open-source-first list of "what to use when our
 * in-app flow doesn't work for you" for each of the three protocol
 * stages: record, transcribe, structure.
 *
 * The order of recommendations is deliberate:
 *   1. OS-native open tools (Linux first — Revamp-IT mission)
 *   2. Cross-platform open tools
 *   3. Cloud/proprietary fallbacks only if essential
 *
 * The structuring section ships a copy-paste prompt the user can hand
 * to a local LLM (Ollama / llama.cpp) or any chatbot — zero infra
 * required to recover from in-app AI downtime.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, ExternalLink, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ToolLink {
  name: string
  desc: string
  url: string
  /** True iff the project ships under an OSI-approved licence. */
  oss: boolean
}

const RECORD_TOOLS: ToolLink[] = [
  { name: 'GNOME Sound Recorder', desc: 'Linux · GNOME, eingebaut', url: 'https://gitlab.gnome.org/GNOME/gnome-sound-recorder', oss: true },
  { name: 'Audacity',             desc: 'Linux / macOS / Windows · Open Source', url: 'https://www.audacityteam.org/', oss: true },
  { name: 'OBS Studio',           desc: 'Linux / macOS / Windows · Open Source (auch Video)', url: 'https://obsproject.com/', oss: true },
  { name: 'Sprachmemos',          desc: 'iOS · eingebaut', url: 'https://support.apple.com/de-ch/guide/voice-memos/welcome/mac', oss: false },
  { name: 'Recorder by Google',   desc: 'Android · Pixel / Play Store', url: 'https://play.google.com/store/apps/details?id=com.google.android.apps.recorder', oss: false },
]

const TRANSCRIBE_TOOLS: ToolLink[] = [
  { name: 'whisper.cpp',          desc: 'Lokal, CPU/GPU · läuft auf Linux/Mac/Win · MIT-Lizenz', url: 'https://github.com/ggerganov/whisper.cpp', oss: true },
  { name: 'faster-whisper',       desc: 'Lokal, Python · GPU-optimiert · MIT', url: 'https://github.com/SYSTRAN/faster-whisper', oss: true },
  { name: 'Vosk',                 desc: 'Lokal · offline, kleiner Footprint · Apache 2.0', url: 'https://alphacephei.com/vosk/', oss: true },
  { name: 'Whisper (Original)',   desc: 'Lokal, OpenAI-Modell, MIT-Code · Modell-Gewichte gratis', url: 'https://github.com/openai/whisper', oss: true },
  { name: 'Speaches (Web-UI)',    desc: 'Selbstgehostet · OpenAI-API-kompatibel · MIT', url: 'https://github.com/speaches-ai/speaches', oss: true },
]

const STRUCTURE_TOOLS: ToolLink[] = [
  { name: 'Ollama',               desc: 'Lokaler LLM-Runner · Mistral, Llama, Qwen, etc. · MIT', url: 'https://ollama.com/', oss: true },
  { name: 'llama.cpp',            desc: 'Lokal, CPU/GPU · MIT-Lizenz', url: 'https://github.com/ggerganov/llama.cpp', oss: true },
  { name: 'LM Studio',            desc: 'Desktop-App · Linux/Mac/Win · gratis (closed source)', url: 'https://lmstudio.ai/', oss: false },
  { name: 'Mistral / Llama / Qwen', desc: 'Open-Weight-Modelle für lokale Inferenz', url: 'https://huggingface.co/models?pipeline_tag=text-generation&sort=trending', oss: true },
]

function ToolRow({ tool }: { tool: ToolLink }) {
  return (
    <li className="text-sm">
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-text-primary hover:text-action font-medium"
      >
        {tool.name}
        <ExternalLink className="w-3 h-3" aria-hidden="true" />
      </a>
      <span className="text-text-tertiary"> — {tool.desc}</span>
      {tool.oss && (
        <span
          className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-action"
          aria-label="Open Source"
        >
          OSS
        </span>
      )}
    </li>
  )
}

export function CaptureAlternatives() {
  const t = useTranslations('admin.protocols.alternatives')
  const [copied, setCopied] = useState(false)
  const promptTemplate = t('promptTemplate')

  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(promptTemplate)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard write can fail in iframes / non-secure contexts. Fail
      // silently — the user can still select-all + copy manually.
    }
  }

  return (
    <details className="mt-6 border-t border-subtle pt-5">
      <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary hover:text-text-primary">
        {t('title')}
      </summary>

      <p className="mt-4 text-sm text-text-secondary max-w-2xl">
        {t('subtitle')}
      </p>

      <div className="mt-6 space-y-6">
        <section>
          <h3 className="ui-public-prose-strong">{t('recordHeading')}</h3>
          <p className="text-sm text-text-secondary mt-1">{t('recordIntro')}</p>
          <ul className="mt-3 space-y-1.5 pl-1">
            {RECORD_TOOLS.map((tool) => <ToolRow key={tool.name} tool={tool} />)}
          </ul>
        </section>

        <section>
          <h3 className="ui-public-prose-strong">{t('transcribeHeading')}</h3>
          <p className="text-sm text-text-secondary mt-1">{t('transcribeIntro')}</p>
          <ul className="mt-3 space-y-1.5 pl-1">
            {TRANSCRIBE_TOOLS.map((tool) => <ToolRow key={tool.name} tool={tool} />)}
          </ul>
        </section>

        <section>
          <h3 className="ui-public-prose-strong">{t('structureHeading')}</h3>
          <p className="text-sm text-text-secondary mt-1">{t('structureIntro')}</p>
          <ul className="mt-3 space-y-1.5 pl-1">
            {STRUCTURE_TOOLS.map((tool) => <ToolRow key={tool.name} tool={tool} />)}
          </ul>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              {copied ? t('copied') : t('copyPrompt')}
            </Button>
          </div>
        </section>
      </div>
    </details>
  )
}
