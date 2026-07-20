'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/db'
import { blogPosts, blogHiddenSlugs } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { canAccessSection, toStaffUser } from '@/lib/permissions'
import { getPostBySlug as getFilePost } from '@/lib/blog'
import { logger } from '@/lib/logger'

async function requireContentAdmin() {
  const session = await auth()
  if (!session?.user?.id || !canAccessSection(toStaffUser(session.user), 'content')) {
    throw new Error('Unauthorized')
  }
  return session.user
}

/**
 * Make a git/file-authored post editable: copy it into blog_posts (DB wins on
 * slug in the merged reader), then open the normal editor. Idempotent — if a DB
 * row already exists for the slug we just edit that.
 */
export async function importFilePostForEdit(slug: string): Promise<void> {
  const user = await requireContentAdmin()

  const existing = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
  let id = existing[0]?.id

  if (!id) {
    const file = getFilePost(slug, 'de')
    if (!file) throw new Error(`File post not found: ${slug}`)
    const [row] = await db
      .insert(blogPosts)
      .values({
        slug: file.slug,
        title: file.title,
        excerpt: file.excerpt ?? null,
        content: file.body,
        featuredImage: file.featuredImage ?? null,
        tags: file.tags ?? [],
        visibility: file.visibility,
        audience: file.audience ?? 'public',
        isPublished: file.published !== false,
        publishedAt: file.publishedAt ?? new Date().toISOString(),
        createdBy: user.id,
      })
      .returning({ id: blogPosts.id })
    id = row.id
    logger.info('Imported file post to DB for editing', { slug, id, by: user.id })
  }

  // A slug that was previously "deleted" (hidden) becomes live again on edit.
  await db.delete(blogHiddenSlugs).where(eq(blogHiddenSlugs.slug, slug))
  revalidatePath('/admin/content/blog')
  redirect(`/admin/content/blog/${id}`)
}

/**
 * "Delete" a git/file post from the admin UI. The markdown can't be removed at
 * runtime, so its slug is hidden and the public readers skip it (the file stays
 * in the repo as a harmless fallback). DB-authored posts are deleted for real
 * via the /api/admin/blog/[id] DELETE route instead.
 */
export async function hideFilePost(slug: string): Promise<void> {
  const user = await requireContentAdmin()
  await db
    .insert(blogHiddenSlugs)
    .values({ slug, hiddenBy: user.id })
    .onConflictDoNothing()
  logger.info('Hid file post from public blog', { slug, by: user.id })
  revalidatePath('/admin/content/blog')
  revalidatePath('/blog')
}
