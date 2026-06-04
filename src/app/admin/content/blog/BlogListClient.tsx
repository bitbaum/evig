'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
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
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <Input
              type="text"
              placeholder="Titel suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as '' | 'published' | 'draft')}
            className="w-auto"
          >
            <option value="">Alle Status</option>
            <option value="published">Veröffentlicht</option>
            <option value="draft">Entwurf</option>
          </Select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-raised">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Titel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-base divide-y divide-neutral-200 dark:divide-white/4">
              {filtered.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-surface-raised dark:hover:bg-surface-base/6"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {post.title}
                      </div>
                      {post.excerpt && (
                        <div className="text-sm text-text-tertiary line-clamp-1">
                          {post.excerpt}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-text-primary">
                      {post.category_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        post.is_published
                          ? 'bg-action-muted text-action-muted'
                          : 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300'
                      }`}
                    >
                      {post.is_published ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-text-primary flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-text-muted" />
                      {formatDateNumeric(post.published_at || post.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {post.is_published && post.published_at && new Date(post.published_at) <= new Date() ? (
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-text-secondary hover:text-text-primary"
                          target="_blank"
                          title="Artikel ansehen"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      ) : (
                        <span
                          className="text-text-muted dark:text-text-secondary cursor-not-allowed"
                          title="Artikel muss veröffentlicht sein"
                        >
                          <Eye className="w-4 h-4" />
                        </span>
                      )}
                      <Link
                        href={`/admin/content/blog/${post.id}`}
                        className="text-action hover:text-action"
                        title="Artikel bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Button
                        variant="destructive-ghost"
                        size="icon"
                        className="text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300"
                        title="Artikel löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
            {search.trim() || statusFilter
              ? 'Keine Ergebnisse'
              : 'Noch keine Blog-Artikel'}
          </Heading>
          <p className="text-text-secondary mb-6">
            {search.trim() || statusFilter
              ? 'Versuche andere Suchkriterien.'
              : 'Erstelle deinen ersten Blog-Artikel.'}
          </p>
          {!search.trim() && !statusFilter && (
            <Button as={Link} href={ROUTES.admin.contentBlogNew} variant="primary">
              <Plus className="w-5 h-5" />
              Ersten Artikel erstellen
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
