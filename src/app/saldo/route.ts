import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

/**
 * Serves the Saldo product landing at the pretty URL `/saldo`.
 *
 * The page is a self-contained static file under `public/saldo/index.html`
 * (the same artifact shipped with the `packages/saldo` engine). A route handler
 * owns the bare URL — mirroring the presentations pattern — because `afterFiles`
 * rewrites are matched before app routes and we keep next.config's rewrites
 * empty. Unlike a deck, this page is PUBLIC and indexable.
 *
 * `/saldo` is excluded from the i18n proxy matcher so middleware doesn't try to
 * locale-route it.
 */
export async function GET() {
  try {
    const file = path.join(process.cwd(), 'public', 'saldo', 'index.html')
    const html = await fs.readFile(file, 'utf8')
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=600',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
