'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { apiFetch } from '@/lib/api/client'
import { toast } from 'sonner'
import { formatDateNumeric } from '@/lib/date-formats'
import {
  Search,
  FileText,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Calendar,
  GitBranch,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'

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
  source: 'db' | 'file'
  visibility: 'public' | 'unlisted'
}

const sourceBadgeClass =
  'inline-flex items-center gap-1 rounded-full border border-default px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-text-tertiary'

interface BlogListClientProps {
  posts: BlogPost[]
}

export function BlogListClient({ posts }: BlogListClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'published' | 'draft'>('')
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await apiFetch(`/api/admin/blog/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (result.success) {
      toast.success('Artikel gelöscht')
      setDeleteTarget(null)
      router.refresh()
    } else {
      toast.error(result.error || 'Artikel konnte nicht gelöscht werden')
    }
  }

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (search.trim() && !p.title.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter === 'published' && !p.is_published) return false
      if (statusFilter === 'draft' && p.is_published) return false
      return true
    })
  }, [posts, search, statusFilter])

  const columns: AdminTableColumn<BlogPost>[] = [
    {
      header: 'Titel',
      cell: (post) => (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{post.title}</span>
            {post.source === 'file' && (
              <span
                className={sourceBadgeClass}
                title="In Git verwaltet (content/posts) — hier schreibgeschützt"
              >
                <GitBranch className="w-3 h-3" />
                Git
              </span>
            )}
            {post.visibility === 'unlisted' && (
              <span className={sourceBadgeClass} title="Nicht gelistet — nur per Link erreichbar">
                <EyeOff className="w-3 h-3" />
                Nicht gelistet
              </span>
            )}
          </div>
          {post.excerpt && (
            <div className="text-sm text-text-tertiary line-clamp-1">{post.excerpt}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Kategorie',
      className: 'whitespace-nowrap',
      cell: (post) => <span className="text-sm text-text-primary">{post.category_name || '-'}</span>,
    },
    {
      header: 'Status',
      className: 'whitespace-nowrap',
      cell: (post) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            post.is_published
              ? 'bg-action-muted text-action'
              : 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300'
          }`}
        >
          {post.is_published ? 'Veröffentlicht' : 'Entwurf'}
        </span>
      ),
    },
    {
      header: 'Datum',
      className: 'whitespace-nowrap',
      cell: (post) => (
        <div className="text-sm text-text-primary flex items-center gap-1">
          <Calendar className="w-4 h-4 text-text-muted" />
          {formatDateNumeric(post.published_at || post.created_at)}
        </div>
      ),
    },
    {
      header: 'Aktionen',
      className: 'whitespace-nowrap',
      cell: (post) => (
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
          {post.source === 'db' ? (
            <>
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
                onClick={() => setDeleteTarget(post)}
                aria-label="Artikel löschen"
                title="Artikel löschen"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <span
              className="text-text-muted cursor-not-allowed"
              title="In Git verwaltet — im Repository (content/posts) bearbeiten"
            >
              <GitBranch className="w-4 h-4" />
            </span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="rounded-lg border border-default bg-surface-base p-4">
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
        <AdminTable columns={columns} rows={filtered} rowKey={(p) => p.id} />
      ) : (
        <div className="rounded-lg border border-default bg-surface-base text-center py-12">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
            Keine Ergebnisse
          </Heading>
          <p className="text-text-secondary">Versuche andere Suchkriterien.</p>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Artikel löschen"
        message="Dieser Blog-Artikel wird endgültig gelöscht."
        itemName={deleteTarget?.title}
        confirmLabel="Löschen"
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
