'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CircleHelp, ExternalLink, Lightbulb, X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { resolveHirnContext } from '@/config/hirn/page-contexts'
import { adminChrome, adminInteractive } from '@/lib/admin-ui'

/**
 * Page-local help for every admin route. It resolves the exact same context
 * that Hirn receives, turning workflow documentation into an interface and AI
 * contract instead of another drifting block of page copy.
 */
export function AdminPageGuide() {
  const pathname = usePathname()
  const context = resolveHirnContext(pathname ?? '/admin', 'admin')
  const t = useTranslations('admin.pageGuide')
  const tCtx = useTranslations('admin.hirnContexts')
  const [open, setOpen] = useState(false)
  const panelRef = useFocusTrap<HTMLDivElement>(open, () => setOpen(false))

  // Localized guide content: messages own the human-facing strings
  // (admin.hirnContexts.<area>.*); the German config text is only the
  // LLM context + last-resort fallback for a brand-new area.
  const L = (key: string, fallback: string) => {
    const k = `${context.area}.${key}`
    return tCtx.has(k as never) ? tCtx(k as never) : fallback
  }
  const guide = context.guide
  const title = guide ? L('guideTitle', guide.title) : L('title', t('fallbackTitle'))
  const purpose = guide ? L('guidePurpose', guide.purpose) : L('description', context.description)
  const steps = guide?.steps.map((step, i) => ({
    title: L(`step${i}Title`, step.title),
    description: L(`step${i}Desc`, step.description),
  }))
  const note = guide?.note ? L('guideNote', guide.note) : undefined
  const suggestions = context.suggestions.map((sug, i) => L(`s${i}`, sug))

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={t('helpAria')}
        title={t('helpTitle')}
        className={`h-9 w-9 shrink-0 rounded-lg ${adminInteractive.rowHover}`}
      >
        <CircleHelp className="h-4.5 w-4.5 text-text-secondary" aria-hidden="true" />
      </Button>

      {open && (
        <>
          <Button
            type="button"
            variant="ghost"
            className={`${adminChrome.modalBackdrop} h-auto w-auto rounded-none p-0`}
            aria-label={t('closeAria')}
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-page-guide-title"
            tabIndex={-1}
            className={adminChrome.modalPanel}
          >
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-subtle bg-surface-base px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-action">{t('panelLabel')}</p>
                <Heading id="admin-page-guide-title" level={2} className="mt-0.5 text-lg font-semibold text-text-primary">
                  {title}
                </Heading>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label={t('closeAria')}
                className="-mr-1 -mt-1"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="space-y-5 p-4 sm:p-5">
              <p className="text-sm leading-6 text-text-secondary">
                {purpose}
              </p>

              {steps ? (
                <ol className="space-y-3">
                  {steps.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action-muted text-xs font-semibold text-action">
                        {index + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-text-primary">{step.title}</span>
                        <span className="mt-0.5 block text-sm leading-5 text-text-secondary">{step.description}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div>
                  <p className="mb-2 text-sm font-medium text-text-primary">{t('typicalQuestions')}</p>
                  <ul className="space-y-1.5 text-sm text-text-secondary">
                    {suggestions.map(suggestion => (
                      <li key={suggestion} className="flex gap-2">
                        <span className="text-action" aria-hidden="true">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {note && (
                <div className="flex gap-3 rounded-lg bg-surface-raised p-3 text-sm leading-5 text-text-secondary">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
                  <p>{note}</p>
                </div>
              )}

              {context.guide?.learnMore && (
                <Link
                  href={context.guide.learnMore.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-action hover:underline"
                >
                  {L('guideLearnMore', context.guide.learnMore.label)}
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
