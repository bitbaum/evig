'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
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
  const [open, setOpen] = useState(false)
  const panelRef = useFocusTrap<HTMLDivElement>(open, () => setOpen(false))

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Hilfe zu dieser Seite"
        title="Was kann ich auf dieser Seite tun?"
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
            aria-label="Hilfe schliessen"
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
                <p className="text-xs font-semibold uppercase tracking-wide text-action">Seitenhilfe</p>
                <Heading id="admin-page-guide-title" level={2} className="mt-0.5 text-lg font-semibold text-text-primary">
                  {context.guide?.title ?? 'Was kann ich hier tun?'}
                </Heading>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Hilfe schliessen"
                className="-mr-1 -mt-1"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="space-y-5 p-4 sm:p-5">
              <p className="text-sm leading-6 text-text-secondary">
                {context.guide?.purpose ?? context.description}
              </p>

              {context.guide ? (
                <ol className="space-y-3">
                  {context.guide.steps.map((step, index) => (
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
                  <p className="mb-2 text-sm font-medium text-text-primary">Typische Fragen</p>
                  <ul className="space-y-1.5 text-sm text-text-secondary">
                    {context.suggestions.map(suggestion => (
                      <li key={suggestion} className="flex gap-2">
                        <span className="text-action" aria-hidden="true">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {context.guide?.note && (
                <div className="flex gap-3 rounded-lg bg-surface-raised p-3 text-sm leading-5 text-text-secondary">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
                  <p>{context.guide.note}</p>
                </div>
              )}

              {context.guide?.learnMore && (
                <Link
                  href={context.guide.learnMore.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-action hover:underline"
                >
                  {context.guide.learnMore.label}
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
