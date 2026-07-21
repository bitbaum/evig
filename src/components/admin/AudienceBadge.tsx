import { Globe, Users, Lock } from 'lucide-react'
import type { ContentAudience } from '@/config/content-audience'
import { CONTENT_AUDIENCE_SHORT } from '@/config/content-audience'

/**
 * One access-level badge for both blog posts and presentation decks (SSOT).
 * `public` renders nothing by default (it's the norm); pass `showPublic` where
 * seeing the "public" state explicitly is useful (e.g. the presentations grid).
 */
const AUDIENCE_ICON = { public: Globe, team: Users, author: Lock } as const
const AUDIENCE_TITLE: Record<ContentAudience, string> = {
  public: 'Zugriff: öffentlich — für alle',
  team: 'Zugriff: nur angemeldete Mitarbeitende',
  author: 'Zugriff: nur Autor und Super-Admins',
}

const badgeClass =
  'inline-flex items-center gap-1 rounded-full border border-default px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-text-tertiary'

export function AudienceBadge({
  audience,
  showPublic = false,
}: {
  audience: ContentAudience
  showPublic?: boolean
}) {
  if (audience === 'public' && !showPublic) return null
  const Icon = AUDIENCE_ICON[audience]
  return (
    <span className={badgeClass} title={AUDIENCE_TITLE[audience]}>
      <Icon className="w-3 h-3" />
      {CONTENT_AUDIENCE_SHORT[audience]}
    </span>
  )
}
