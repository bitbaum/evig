// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Shared small UI components
// ---------------------------------------------------------------------------

import { HelpCircle } from 'lucide-react'
import {
  getCategoryById, getUrgencyById, getRequestStatusById, getSkillById,
} from '@/config/it-hilfe'

export function StatsCard({ label, value, icon: Icon, color }: {
  label: string
  value: number | string
  icon: typeof HelpCircle
  color: string
}) {
  return (
    <div className={`p-4 ${color} rounded-lg border`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 opacity-70" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-80">{label}</p>
        </div>
      </div>
    </div>
  )
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const config = getUrgencyById(urgency)
  if (!config) return <span className="text-xs text-text-tertiary">{urgency}</span>
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>{config.name}</span>
}

export function RequestStatusBadge({ status }: { status: string }) {
  const config = getRequestStatusById(status)
  if (!config) return <span className="text-xs text-text-tertiary">{status}</span>
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>{config.name}</span>
}

export function CategoryIcon({ categoryId }: { categoryId: string }) {
  const cat = getCategoryById(categoryId)
  if (!cat) return null
  const Icon = cat.icon
  return <Icon className="w-4 h-4 text-text-tertiary" />
}

export function SkillTag({ skillId }: { skillId: string }) {
  const skill = getSkillById(skillId)
  return (
    <span className="px-1.5 py-0.5 text-[10px] rounded-sm bg-surface-raised text-text-secondary">
      {skill?.name ?? skillId}
    </span>
  )
}
