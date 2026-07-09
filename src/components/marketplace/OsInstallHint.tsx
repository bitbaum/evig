'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Monitor, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

// listing.category holds the KATEGORIEN code (not a label). A Linux pre-install
// is relevant for full computers only — 10 = Laptops, 20 = Desktop PCs
// (src/config/erfassung/categories.ts). Not monitors/components/peripherals.
const OS_INSTALLABLE_CATEGORIES = ['10', '20']
const DISTROS = ['Linux Mint', 'Ubuntu', 'Fedora', 'Debian', 'MX Linux']

/**
 * Shown on computer/laptop listings: offers a free Linux pre-install and lets
 * the buyer pick a distro, with a link to the distro chooser for the undecided.
 * The pick is guidance (surfaced to the buyer to mention at order/contact) —
 * capturing it on the order is a follow-up once checkout is live.
 */
export function OsInstallHint({ category }: { category: string }) {
  const t = useTranslations('marketplace.osInstall')
  const [selected, setSelected] = useState<string | null>(null)

  if (!OS_INSTALLABLE_CATEGORIES.includes(category)) return null

  return (
    <div className="rounded-xl border border-subtle bg-surface-base p-5">
      <div className="flex items-center gap-2">
        <Monitor className="h-4 w-4 shrink-0 text-action" aria-hidden="true" />
        <h3 className="text-sm font-medium text-text-primary">{t('heading')}</h3>
      </div>
      <p className="mt-1.5 text-sm text-text-secondary">{t('body')}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {DISTROS.map((d) => (
          <Button
            key={d}
            type="button"
            variant={selected === d ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelected(selected === d ? null : d)}
            aria-pressed={selected === d}
          >
            {d}
          </Button>
        ))}
      </div>

      {selected && (
        <p className="mt-2 text-xs text-text-tertiary">{t('selected', { distro: selected })}</p>
      )}

      <Link
        href="/services/linux-open-source#distro-linux-mint"
        className="mt-3 inline-flex items-center gap-1 text-sm text-action hover:underline"
      >
        {t('compare')}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
