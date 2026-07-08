import Link from 'next/link'
import { ScanLine, PackageCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Mode switcher for the single "Produkt aufnehmen" entry point.
 *
 * The admin sidebar used to list "Geräte-Eingang" and "Inventar-Erfassung" as
 * two separate doors whose descriptions BOTH said "erfassen" — so staff never
 * knew which to click. They are the same job (get a product into inventory) at
 * two levels of ceremony, so they are now one nav entry with two modes:
 *   - Physische Annahme  → /admin/intake     (checklist + donation/provenance)
 *   - Schnellerfassung   → /admin/erfassung  (product data straight in)
 */
const MODES = [
  { id: 'annahme', label: 'Physische Annahme', hint: 'Checkliste & Spende', href: '/admin/intake', icon: PackageCheck },
  { id: 'schnell', label: 'Schnellerfassung', hint: 'Produktdaten direkt', href: '/admin/erfassung', icon: ScanLine },
] as const

export function ProduktAufnehmenModeToggle({ active }: { active: 'annahme' | 'schnell' }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-default bg-surface-base p-1">
      {MODES.map((m) => {
        const isActive = m.id === active
        const Icon = m.icon
        return (
          <Link
            key={m.id}
            href={m.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-action-muted text-action font-medium'
                : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{m.label}</span>
            <span className="hidden sm:inline text-xs text-text-tertiary">· {m.hint}</span>
          </Link>
        )
      })}
    </div>
  )
}
