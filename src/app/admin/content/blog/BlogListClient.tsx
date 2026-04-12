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
import Heading from '@/components/ui/Heading'

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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Titel suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as '' | 'published' | 'draft')}
            className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600"
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
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Titel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {post.title}
                      </div>
                      {post.excerpt && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {post.excerpt}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {post.category_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        post.is_published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}
                    >
                      {post.is_published ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDateNumeric(post.published_at || post.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {post.is_published && post.published_at && new Date(post.published_at) <= new Date() ? (
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          target="_blank"
                          title="Artikel ansehen"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      ) : (
                        <span
                          className="text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          title="Artikel muss veröffentlicht sein"
                        >
                          <Eye className="w-4 h-4" />
                        </span>
                      )}
                      <Link
                        href={`/admin/content/blog/${post.id}`}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Artikel bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {search.trim() || statusFilter
              ? 'Keine Ergebnisse'
              : 'Noch keine Blog-Artikel'}
          </Heading>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {search.trim() || statusFilter
              ? 'Versuche andere Suchkriterien.'
              : 'Erstelle deinen ersten Blog-Artikel.'}
          </p>
          {!search.trim() && !statusFilter && (
            <Link
              href="/admin/content/blog/new"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
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
