import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { auth } from '@/auth'
import { PRESENTATION_DECKS } from '@/config/presentations'
import { canAccessAudience } from '@/lib/content-access'

/**
 * Serves a presentation deck at its pretty URL (`/presentations/<slug>`) and
 * enforces the deck's `audience` access level.
 *
 * Decks are static HTML under `public/presentations/<slug>/index.html`. A plain
 * static rewrite can't gate them, so this route handler owns the bare deck URL:
 * it runs `auth()`, checks the audience, then streams the file. Filesystem/app
 * routes are matched before `afterFiles` rewrites, so this wins for the deck
 * index; nested assets (`/presentations/<slug>/<file>`) and shared
 * `/presentations/_assets/**` are 2+ segments and stay statically served.
 *
 * Failure modes: a restricted deck is 404 (logged-in but not entitled) or a
 * login redirect (anonymous). Public and unregistered decks serve as before.
 */

// Deck slugs are simple kebab tokens — reject anything else (path-traversal guard).
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!SLUG_RE.test(slug)) return new NextResponse('Not found', { status: 404 })

  const deck = PRESENTATION_DECKS.find((d) => d.slug === slug)
  const restricted = deck ? deck.audience !== 'public' : false

  // Access gate — only restricted decks need a session check. Config-defined
  // decks have no per-user owner, so `author` audience ⇒ super-admins only.
  if (deck && restricted) {
    const session = await auth().catch(() => null)
    const viewer = session?.user
      ? {
          userId: session.user.id,
          isStaff: session.user.isStaff,
          email: session.user.email,
          isSuperAdmin: session.user.isSuperAdmin,
        }
      : null
    if (!canAccessAudience(deck.audience, viewer, null)) {
      if (!session?.user) {
        const url = new URL('/auth/login', req.url)
        url.searchParams.set('callbackUrl', `/presentations/${slug}`)
        return NextResponse.redirect(url)
      }
      return new NextResponse('Not found', { status: 404 })
    }
  }

  try {
    const file = path.join(process.cwd(), 'public', 'presentations', slug, 'index.html')
    const html = await fs.readFile(file, 'utf8')
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Decks are link-only; keep them out of the index (belt-and-suspenders
        // with the next.config headers rule).
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': restricted ? 'private, no-store' : 'public, max-age=300',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
