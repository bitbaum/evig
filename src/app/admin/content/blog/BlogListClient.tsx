'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatDateNumeric } from '@/lib/date-formats'
import {
  Search,
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'

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

interface BlogListClientProps {
  posts: BlogPost[]
}

export function BlogListClient({ posts }: BlogListClientProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'published' | 'draft'>('')

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (search.trim() && !p.title.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter === 'published' && !p.is_published) return false
      if (statusFilter === 'draft' && p.is_published) return false
      return true
    })
  }, [posts, search, statusFilter])

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-100 dark:border-white/[0.06] overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-white/[0.06]">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Titel suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg dark:bg-neutral-900 dark:border-neutral-600 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as '' | 'published' | 'draft')}
            className="px-3 py-2 text-sm border rounded-lg dark:bg-neutral-900 dark:border-neutral-600"
          >
            <option value="">Alle Status</option>
            <option value="published">Veröffentlicht</option>
            <option value="draft">Entwurf</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  Titel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-white/[0.04]">
              {filtered.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-neutral-50 dark:hover:bg-white/[0.06]"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {post.title}
                      </div>
                      {post.excerpt && (
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                          {post.excerpt}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900 dark:text-white">
                      {post.category_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        post.is_published
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300'
                      }`}
                    >
                      {post.is_published ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900 dark:text-white flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      {formatDateNumeric(post.published_at || post.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {post.is_published && post.published_at && new Date(post.published_at) <= new Date() ? (
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-300"
                          target="_blank"
                          title="Artikel ansehen"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      ) : (
                        <span
                          className="text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                          title="Artikel muss veröffentlicht sein"
                        >
                          <Eye className="w-4 h-4" />
                        </span>
                      )}
                      <Link
                        href={`/admin/content/blog/${post.id}`}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        title="Artikel bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        className="text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300"
                        title="Artikel löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            {search.trim() || statusFilter
              ? 'Keine Ergebnisse'
              : 'Noch keine Blog-Artikel'}
          </Heading>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {search.trim() || statusFilter
              ? 'Versuche andere Suchkriterien.'
              : 'Erstelle deinen ersten Blog-Artikel.'}
          </p>
          {!search.trim() && !statusFilter && (
            <Link
              href={ROUTES.admin.contentBlogNew}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Ersten Artikel erstellen
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
