'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * AiBrainstormSection — copyable prompt cards for the Monitor-Upcycling page.
 *
 * Each prompt is treated as code-style content (mono surface, terminal-like
 * frame) with a single primary action: copy to clipboard. The previous
 * treatment was a generic <ProjectSection> grid where every prompt was a
 * paragraph blob with no affordance to actually USE it.
 *
 * SSOT: prompt content stays in messages/<locale>.json under
 *       projects.upcycling.ai_brainstorm.prompts[]. Only the rendering
 *       and the copy state are here.
 *
 * No analytics on copy events — keep the surface honest, no hidden tracking.
 */
type Prompt = { title: string; prompt: string }

type Messages = {
  eyebrow: string
  title: string
  intro: string
  prompts: Prompt[]
  copyButton: string
  copied: string
  why: string
  whyBody: string
}

export function AiBrainstormSection({ section }: { section: Messages }) {
  // TS type cache flakes on deep namespaces; pull from `projects` and prefix.
  const tRoot = useTranslations('projects')
  const t = (key: string): string => tRoot(`upcycling.ai_brainstorm.${key}` as never)
  if (!section?.prompts?.length) return null

  return (
    <section className="border-t border-subtle bg-surface-raised py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* min-w-0 on grid children is REQUIRED so the right column's <pre>
            can shrink — without it the prompt's longest unbroken word
            forces the column wider than the viewport and the whole page
            scrolls horizontally on mobile. */}
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-start lg:gap-16">
          {/* Left rail — header (eyebrow + short title + lede) + how-to tip.
              Prior version put the long intro inside an h2 with display-md
              typography — display heading on body copy reads as amateurish
              marketing. The fix: title carries the heading, intro stays
              body, eyebrow becomes the small kicker. */}
          <div className="min-w-0 lg:sticky lg:top-24">
            <div className="ui-public-eyebrow">{section.eyebrow}</div>
            <h2 className="ui-public-display-md mt-3">{section.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary sm:text-base">
              {section.intro}
            </p>
            <div className="mt-6 rounded-lg border border-subtle bg-surface-base/60 p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                {t('why')}
              </div>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {t('whyBody')}
              </p>
            </div>
          </div>

          {/* Right column — prompt cards */}
          <ol className="min-w-0 space-y-4">
            {section.prompts.map((p, i) => (
              <li key={i} className="min-w-0">
                <PromptCard
                  index={i + 1}
                  title={p.title}
                  prompt={p.prompt}
                  copyLabel={t('copyButton')}
                  copiedLabel={t('copied')}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function PromptCard({
  index,
  title,
  prompt,
  copyLabel,
  copiedLabel,
}: {
  index: number
  title: string
  prompt: string
  copyLabel: string
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      // Auto-revert after a short window so the button can be reused.
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can fail (insecure context, browser denial). Silent
      // fall-through is acceptable — user will retry.
    }
  }

  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-subtle bg-surface-base">
      {/* Header: numbered title + copy action */}
      <header className="flex items-center justify-between gap-3 border-b border-subtle bg-surface-raised/60 px-4 py-3 sm:px-5">
        <div className="flex items-baseline gap-3 min-w-0">
          <span
            aria-hidden="true"
            className="font-mono text-xs tabular-nums text-text-tertiary shrink-0"
          >
            {String(index).padStart(2, '0')}
          </span>
          <h3 className="text-sm font-semibold text-text-primary truncate">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? copiedLabel : copyLabel}
          className={cn(
            'shrink-0 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors',
            copied
              ? 'border-action/40 bg-action-muted/30 text-action'
              : 'border-subtle text-text-tertiary hover:text-text-primary hover:border-default'
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          <span>{copied ? copiedLabel : copyLabel}</span>
        </button>
      </header>

      {/* Body: prompt text in mono surface — visually clear it's code-like,
          copy-paste-able. `break-words` + the inline overflow-wrap make long
          German compounds / URLs / paths wrap instead of forcing the parent
          wider than the viewport on mobile. */}
      <pre
        className="whitespace-pre-wrap break-words px-4 py-4 sm:px-5 sm:py-5 font-mono text-[13px] leading-relaxed text-text-primary"
        style={{ overflowWrap: 'anywhere' }}
      >
        {prompt}
      </pre>
    </article>
  )
}
