/**
 * Admin Blog Posts Page
 *
 * Manages blog posts - view, create, edit, publish.
 * Data comes from the main database blog_posts table.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { ORG } from '@/config/org'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  Tag,
} from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { BlogListClient } from './BlogListClient'
import Heading from '@/components/admin/AdminHeading'

export const metadata: Metadata = {
  title: 'Blog-Artikel',
  description: 'Blog-Artikel erstellen und verwalten.',
}

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  category_name: string | null
}

interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  categoriesCount: number
}

async function getBlogStats(): Promise<BlogStats> {
  let totalPosts = 0
  let publishedPosts = 0
  let draftPosts = 0
  let categoriesCount = 0

  try {
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_POSTS}`
    )
    totalPosts = parseInt(totalResult.rows[0]?.count || '0')

    const publishedResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_POSTS} WHERE is_published = true`
    )
    publishedPosts = parseInt(publishedResult.rows[0]?.count || '0')

    draftPosts = totalPosts - publishedPosts
  } catch {
    // Table might not exist
  }

  try {
    const catResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_CATEGORIES} WHERE is_active = true`
    )
    categoriesCount = parseInt(catResult.rows[0]?.count || '0')
  } catch {
    // Table might not exist
  }

  return { totalPosts, publishedPosts, draftPosts, categoriesCount }
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const result = await query<BlogPost>(
      `SELECT
        bp.id,
        bp.slug,
        bp.title,
        bp.excerpt,
        bp.is_published,
        bp.published_at,
        bp.created_at,
        bp.updated_at,
        c.name as category_name
       FROM ${TABLE_NAMES.BLOG_POSTS} bp
       LEFT JOIN ${TABLE_NAMES.BLOG_CATEGORIES} c ON bp.category_id = c.id
       ORDER BY bp.created_at DESC
       LIMIT 50`
    )
    return result.rows
  } catch {
    // Table might not exist
    return []
  }
}

export default async function AdminBlogPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/blog')
  }

  const [stats, posts] = await Promise.all([getBlogStats(), getBlogPosts()])

  return (
    <AdminPageWrapper
      title="Blog-Artikel"
      description="News, Tutorials und Ankündigungen verwalten"
      icon={FileText}
      iconColor="blue"
      backButton={{ href: '/admin/content', label: 'Zurück' }}
      actions={
        <Link
          href="/admin/content/blog/new"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neuer Artikel
        </Link>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Gesamt Artikel
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.totalPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Veröffentlicht
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.publishedPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Entwürfe
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.draftPosts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Kategorien
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats.categoriesCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Table with Search/Filters */}
      <BlogListClient posts={posts} />

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-blue-900 dark:text-blue-200">
              Blog-Verwaltung
            </Heading>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 mb-3">
              Blog-Artikel sind ein wichtiger Kommunikationskanal. Teile
              News über {ORG.name}, schreibe Tutorials zur
              Computeraufarbeitung oder kündige Workshops und Events an.
            </p>
            <div className="flex gap-3">
              <Link
                href="/admin/content/blog/new"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                Artikel erstellen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
