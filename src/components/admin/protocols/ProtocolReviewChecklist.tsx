import { CheckCircle2, Circle, CircleAlert, LoaderCircle } from 'lucide-react'
import type { ProtocolReviewChecklistItem } from '@/lib/protocols/review'
import { adminSurface, adminType } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'
import { AdminSectionHeader } from '@/components/admin/AdminSectionHeader'

interface ProtocolReviewChecklistProps {
  items: ProtocolReviewChecklistItem[]
}

const stateConfig: Record<ProtocolReviewChecklistItem['state'], {
  icon: typeof CheckCircle2
  className: string
  label: string
}> = {
  done: {
    icon: CheckCircle2,
    className: 'bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 border-primary-200',
    label: 'Erledigt',
  },
  active: {
    icon: LoaderCircle,
    className: 'bg-surface-raised text-neutral-800 border',
    label: 'Prüfen',
  },
  blocked: {
    icon: CircleAlert,
    className: 'bg-error-50 dark:bg-error-900/20 text-error-800 dark:text-error-400 border-error-200',
    label: 'Blockiert',
  },
  pending: {
    icon: Circle,
    className: 'bg-surface-raised text-text-secondary border',
    label: 'Offen',
  },
}

export function ProtocolReviewChecklist({ items }: ProtocolReviewChecklistProps) {
  return (
    <section className={cn(adminSurface.card, 'p-5')}>
      <AdminSectionHeader
        title="Review Checkliste"
        description="Vom KI-Entwurf zur belastbaren Arbeitsgrundlage."
      />

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const config = stateConfig[item.state]
          const Icon = config.icon
          return (
            <div key={item.id} className={cn('rounded-lg border p-4', config.className)}>
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={cn(adminType.body, 'font-semibold text-inherit')}>{item.label}</h3>
                    <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-sm font-medium">
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-1 text-base leading-relaxed text-inherit">{item.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
