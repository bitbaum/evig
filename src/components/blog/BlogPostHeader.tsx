import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'
import { ROUTES } from '@/config/routes'
import { responsiveTypography } from '@/lib/responsive'

interface BlogPostHeaderProps {
  post: BlogPost
}

export default function BlogPostHeader({ post }: BlogPostHeaderProps) {
  return (
    <header className="max-w-[680px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back Link */}
      <Link
        href={ROUTES.public.blog}
        className="inline-flex items-center text-text-secondary hover:text-neutral-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Blog
      </Link>

      {/* Category */}
      {post.category && (
        <div className="mb-4">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-400 uppercase tracking-wide">
            {post.category}
          </span>
        </div>
      )}

      {/* Title */}
      <Heading level={1} className={`${responsiveTypography.hero} font-bold text-text-primary leading-tight mb-6`}>
        {post.title}
      </Heading>

      {/* Excerpt */}
      {post.excerpt && (
        <p className={`${responsiveTypography.bodyLarge} text-text-secondary leading-relaxed mb-8`}>
          {post.excerpt}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-text-secondary text-sm border-b border pb-8">
        <span className="font-medium">{post.author}</span>
        <span>·</span>
        <time>{formatDate(post.publishedAt || post.createdAt)}</time>
      </div>
    </header>
  )
}
