import { getMergedPosts } from '@/lib/blog-merge'
import { isListedPost } from '@/lib/blog'
import { APP_URL } from '@/config/urls'
import { ORG } from '@/config/org'
import { defaultLocale } from '@/i18n/routing'

// Refresh hourly; posts change on deploy, not per-request.
export const revalidate = 3600

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string,
  )
}

/** RSS 2.0 feed of the public blog (unlisted posts are never included). */
export async function GET(): Promise<Response> {
  const posts = (await getMergedPosts(defaultLocale)).filter(isListedPost).slice(0, 50)

  const items = posts
    .map((p) => {
      const link = `${APP_URL}/blog/${p.slug}`
      const date = p.publishedAt || p.createdAt
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>${date ? `\n      <pubDate>${new Date(date).toUTCString()}</pubDate>` : ''}
      <description>${escapeXml(p.excerpt || '')}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(ORG.name)} — Blog</title>
    <link>${APP_URL}/blog</link>
    <atom:link href="${APP_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml('Wissen rund um nachhaltige IT, Reparatur und Open Source.')}</description>
    <language>${defaultLocale}</language>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
