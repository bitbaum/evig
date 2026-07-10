'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { MessageSquare, Trash2, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { formatDate } from '@/lib/date-formats'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ROUTES } from '@/config/routes'
import { COMMENT_BODY_MAX } from '@/config/blog-comments'

interface Comment {
  id: string
  body: string
  createdAt: string | null
  userId: string
  authorName: string | null
  authorImage: string | null
}

function initials(name: string | null): string {
  if (!name) return 'U'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function BlogComments({ slug }: { slug: string }) {
  const t = useTranslations('blog.comments')
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiFetch<{ comments: Comment[] }>(`/api/blog/${slug}/comments`).then((res) => {
      if (active && res.data) setComments(res.data.comments)
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [slug])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    setPosting(true)
    setError('')
    const res = await apiFetch<{ comment: Comment }>(`/api/blog/${slug}/comments`, {
      method: 'POST',
      body: { body: trimmed },
    })
    if (res.data?.comment) {
      setComments((prev) => [...prev, res.data!.comment])
      setBody('')
    } else {
      setError(res.error || t('error'))
    }
    setPosting(false)
  }

  const remove = async (id: string) => {
    const prev = comments
    setComments((c) => c.filter((x) => x.id !== id))
    const res = await apiFetch(`/api/blog/comments/${id}`, { method: 'DELETE' })
    if (res.error) setComments(prev) // rollback on failure
  }

  const canModerate = (c: Comment) =>
    session?.user?.id === c.userId || Boolean(session?.user?.isStaff)

  return (
    <section className="mx-auto max-w-[720px] px-4 pb-20 sm:px-6">
      <div className="border-t border-subtle pt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-text-primary">
          <MessageSquare className="h-5 w-5 text-text-tertiary" aria-hidden="true" />
          {t('title')}
          {comments.length > 0 && (
            <span className="font-mono text-sm text-text-tertiary">({comments.length})</span>
          )}
        </h2>

        {/* Composer */}
        {session?.user ? (
          <form onSubmit={submit} className="mt-6">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={COMMENT_BODY_MAX}
              rows={3}
              placeholder={t('placeholder')}
              className="resize-y"
            />
            {error && <p className="mt-2 text-sm text-error-600">{error}</p>}
            <div className="mt-3 flex justify-end">
              <Button type="submit" variant="primary" disabled={posting || !body.trim()} className="gap-2">
                {posting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {posting ? t('posting') : t('submit')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-lg border border-subtle bg-surface-raised px-4 py-4 text-sm text-text-secondary">
            {t('loginPrompt')}{' '}
            <Link href={ROUTES.public.login} className="font-medium text-action underline">
              {t('login')}
            </Link>
          </div>
        )}

        {/* Thread */}
        <div className="mt-8 space-y-6">
          {loading ? (
            <p className="text-sm text-text-tertiary">…</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-text-tertiary">{t('empty')}</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                {c.authorImage ? (
                  <img src={c.authorImage} alt="" className="h-9 w-9 shrink-0 rounded-full" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-action text-xs font-semibold text-white">
                    {initials(c.authorName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-text-primary">{c.authorName || t('anon')}</span>
                    {c.createdAt && (
                      <time className="font-mono text-xs text-text-tertiary">{formatDate(c.createdAt)}</time>
                    )}
                    {canModerate(c) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(c.id)}
                        className="ml-auto h-7 w-7 text-text-tertiary hover:text-error-600"
                        aria-label={t('delete')}
                        title={t('delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-text-secondary">
                    {c.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
