/**
 * Admin Blog Comment Moderation
 *
 * Overview of every blog comment across all posts (DB- and git/file-authored,
 * keyed by slug). Staff can hide/unhide (reversible) or delete comments.
 * Comments post live with no pre-publish queue, so this is the moderation surface.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { MessageSquare, AlertTriangle } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid, type StatCardItem } from '@/components/admin/AdminStatsGrid'
import { EyeOff, Eye } from 'lucide-react'
import { ROUTES } from '@/config/routes'
import { canAccessSection, toStaffUser } from '@/lib/permissions'
import { COMMENT_STATUS } from '@/config/blog-comments'
import { CommentModerationClient, type ModComment } from './CommentModerationClient'

export const metadata: Metadata = {
  title: 'Kommentare moderieren',
  description: 'Blog-Kommentare moderieren.',
}

interface CommentRow {
  id: string
  post_slug: string
  body: string
  status: string
  created_at: string
  author_name: string | null
  author_email: string | null
}

async function getComments(): Promise<{ comments: ModComment[]; dbError: boolean }> {
  try {
    const result = await query<CommentRow>(
      `SELECT
        c.id,
        c.post_slug,
        c.body,
        c.status,
        c.created_at,
        u.name  AS author_name,
        u.email AS author_email
       FROM ${TABLE_NAMES.BLOG_COMMENTS} c
       JOIN ${TABLE_NAMES.USERS} u ON u.id = c.user_id
       ORDER BY c.created_at DESC
       LIMIT 200`
    )
    return {
      comments: result.rows.map((r): ModComment => ({
        id: r.id,
        postSlug: r.post_slug,
        body: r.body,
        status: r.status === COMMENT_STATUS.HIDDEN ? 'hidden' : 'visible',
        createdAt: r.created_at,
        authorName: r.author_name,
        authorEmail: r.author_email,
      })),
      dbError: false,
    }
  } catch (error) {
    logger.error('Admin comment moderation: DB query failed', { error })
    return { comments: [], dbError: true }
  }
}

export default async function AdminBlogCommentsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/blog/comments')
  }
  if (!canAccessSection(toStaffUser(session.user), 'content')) {
    redirect('/?error=no_admin_access')
  }

  const { comments, dbError } = await getComments()
  const visibleCount = comments.filter((c) => c.status === 'visible').length
  const hiddenCount = comments.length - visibleCount

  const statCards: StatCardItem[] = [
    { icon: MessageSquare, color: 'gray', label: 'Kommentare', value: comments.length },
    { icon: Eye, color: 'green', label: 'Sichtbar', value: visibleCount },
    { icon: EyeOff, color: 'gray', label: 'Ausgeblendet', value: hiddenCount },
  ]

  return (
    <AdminPageWrapper
      title="Kommentare moderieren"
      description="Blog-Kommentare ausblenden oder löschen"
      icon={MessageSquare}
      iconColor="blue"
      backButton={{ href: ROUTES.admin.contentBlog, label: 'Zurück' }}
    >
      {dbError && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning-300 bg-warning-50 p-4 text-warning-800 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">Kommentare konnten nicht geladen werden — Datenbank nicht erreichbar.</p>
        </div>
      )}
      <AdminStatsGrid items={statCards} />
      <CommentModerationClient comments={comments} />
    </AdminPageWrapper>
  )
}
