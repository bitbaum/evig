import { Link } from '@/i18n/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { BlogPost } from '@/lib/blog'

interface BlogPrevNextProps {
  /** Chronologically newer post (published after the current one). */
  newer: BlogPost | null
  /** Chronologically older post (published before the current one). */
  older: BlogPost | null
}

/** Sequential navigation between posts: newer on the left, older on the right. */
export default async function BlogPrevNext({ newer, older }: BlogPrevNextProps) {
  if (!newer && !older) return null
  const t = await getTranslations('blog')

  return (
    <nav aria-label={t('prevNext.label')} className="mx-auto max-w-[720px] px-4 pb-4 sm:px-6">
      <div className="grid gap-4 border-t border-subtle pt-8 sm:grid-cols-2">
        {newer ? (
          <Link
            href={`/blog/${newer.slug}`}
            className="group rounded-xl border border-subtle p-5 transition-colors hover:border-strong"
          >
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t('prevNext.newer')}
            </span>
            <span className="mt-2 line-clamp-2 block font-semibold leading-snug text-text-primary transition-colors group-hover:text-action">
              {newer.title}
            </span>
          </Link>
        ) : (
          <span aria-hidden="true" className="hidden sm:block" />
        )}
        {older && (
          <Link
            href={`/blog/${older.slug}`}
            className="group rounded-xl border border-subtle p-5 text-right transition-colors hover:border-strong"
          >
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
              {t('prevNext.older')}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="mt-2 line-clamp-2 block font-semibold leading-snug text-text-primary transition-colors group-hover:text-action">
              {older.title}
            </span>
          </Link>
        )}
      </div>
    </nav>
  )
}
