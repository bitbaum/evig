/**
 * BlogByline — the author name in a post byline.
 *
 * A real person, linked to their public profile when we can resolve one.
 * Server component: it resolves the author (a cached DB lookup) itself, so the
 * four byline sites (post header, hero, featured grid, related) stay one-liners.
 */

import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/config/routes'
import { resolveAuthorProfile } from '@/lib/blog/author'

interface BlogBylineProps {
  author: string
  authorId?: string | null
  /** Text styling to match the surrounding meta row. */
  className?: string
}

export default async function BlogByline({ author, authorId, className }: BlogBylineProps) {
  const { name, profileId } = await resolveAuthorProfile(author, authorId)

  if (profileId) {
    return (
      <Link
        href={ROUTES.public.member(profileId)}
        className={`${className ?? ''} font-medium underline decoration-transparent underline-offset-2 transition-colors hover:decoration-inherit hover:text-action`}
      >
        {name}
      </Link>
    )
  }

  return <span className={className}>{name}</span>
}
