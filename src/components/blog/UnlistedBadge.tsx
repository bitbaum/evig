import { EyeOff } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

/**
 * Marks an unlisted post — hidden from the public listing but viewable by
 * anyone with the direct link. Rendered on unlisted post cards (staff-only
 * listing) and on the reading page so a link recipient knows it isn't public.
 */
export default async function UnlistedBadge({ className = '' }: { className?: string }) {
  const t = await getTranslations('blog')
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-subtle px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary ${className}`}
    >
      <EyeOff className="h-3 w-3" aria-hidden="true" />
      {t('unlisted')}
    </span>
  )
}
