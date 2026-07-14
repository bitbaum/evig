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
import { Search, MessageSquare, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { COMMENT_STATUS } from '@/config/blog-comments'

export interface ModComment {
  id: string
  postSlug: string
  body: string
  status: 'visible' | 'hidden'
  createdAt: string
  authorName: string | null
  authorEmail: string | null
}

export function CommentModerationClient({ comments }: { comments: ModComment[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'visible' | 'hidden'>('')
  const [deleteTarget, setDeleteTarget] = useState<ModComment | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const setStatus = async (c: ModComment, status: 'visible' | 'hidden') => {
    setBusyId(c.id)
    const res = await apiFetch(`/api/blog/comments/${c.id}`, { method: 'PATCH', body: { status } })
    if (res.success) {
      toast.success(status === COMMENT_STATUS.HIDDEN ? 'Kommentar ausgeblendet' : 'Kommentar sichtbar')
      router.refresh()
    } else {
      toast.error(res.error || 'Aktion fehlgeschlagen')
    }
    setBusyId(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    const res = await apiFetch(`/api/blog/comments/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.success) {
      toast.success('Kommentar gelöscht')
      setDeleteTarget(null)
      router.refresh()
    } else {
      toast.error(res.error || 'Kommentar konnte nicht gelöscht werden')
    }
    setBusyId(null)
  }

  const filtered = useMemo(() => {
    return comments.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          c.body.toLowerCase().includes(q) ||
          c.postSlug.toLowerCase().includes(q) ||
          (c.authorName ?? '').toLowerCase().includes(q) ||
          (c.authorEmail ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [comments, search, statusFilter])

  const columns: AdminTableColumn<ModComment>[] = [
    {
      header: 'Autor',
      className: 'whitespace-nowrap align-top',
      cell: (c) => (
        <div>
          <div className="text-sm font-medium text-text-primary">{c.authorName || 'Unbekannt'}</div>
          {c.authorEmail && <div className="text-xs text-text-tertiary">{c.authorEmail}</div>}
        </div>
      ),
    },
    {
      header: 'Kommentar',
      cell: (c) => (
        <p className={`max-w-md text-sm ${c.status === 'hidden' ? 'text-text-tertiary line-through' : 'text-text-secondary'}`}>
          {c.body}
        </p>
      ),
    },
    {
      header: 'Beitrag',
      className: 'whitespace-nowrap align-top',
      cell: (c) => (
        <Link
          href={`/blog/${c.postSlug}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-sm text-action hover:underline"
          title="Beitrag ansehen"
        >
          {c.postSlug}
          <ExternalLink className="h-3 w-3" />
        </Link>
      ),
    },
    {
      header: 'Status',
      className: 'whitespace-nowrap align-top',
      cell: (c) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            c.status === 'visible'
              ? 'bg-action-muted text-action'
              : 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300'
          }`}
        >
          {c.status === 'visible' ? 'Sichtbar' : 'Ausgeblendet'}
        </span>
      ),
    },
    {
      header: 'Datum',
      className: 'whitespace-nowrap align-top',
      cell: (c) => <span className="text-sm text-text-primary">{formatDateNumeric(c.createdAt)}</span>,
    },
    {
      header: 'Aktionen',
      className: 'whitespace-nowrap align-top',
      cell: (c) => (
        <div className="flex items-center gap-2">
          {c.status === 'visible' ? (
            <Button
              variant="ghost"
              size="icon"
              disabled={busyId === c.id}
              onClick={() => setStatus(c, 'hidden')}
              aria-label="Ausblenden"
              title="Ausblenden"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              disabled={busyId === c.id}
              onClick={() => setStatus(c, 'visible')}
              aria-label="Wieder einblenden"
              title="Wieder einblenden"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="destructive-ghost"
            size="icon"
            disabled={busyId === c.id}
            className="text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300"
            onClick={() => setDeleteTarget(c)}
            aria-label="Löschen"
            title="Endgültig löschen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-default bg-surface-base p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <Input
              type="text"
              placeholder="Kommentar, Autor oder Beitrag suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | 'visible' | 'hidden')}
            className="w-auto"
          >
            <option value="">Alle</option>
            <option value="visible">Sichtbar</option>
            <option value="hidden">Ausgeblendet</option>
          </Select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <AdminTable columns={columns} rows={filtered} rowKey={(c) => c.id} />
      ) : (
        <div className="rounded-lg border border-default bg-surface-base text-center py-12">
          <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
            Keine Kommentare
          </Heading>
          <p className="text-text-secondary">Es gibt noch keine Kommentare zum Moderieren.</p>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Kommentar löschen"
        message="Dieser Kommentar wird endgültig gelöscht. Zum reversiblen Entfernen nutze stattdessen „Ausblenden“."
        confirmLabel="Löschen"
        isLoading={busyId === deleteTarget?.id}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
