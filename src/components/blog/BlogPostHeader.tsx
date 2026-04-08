import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'

interface BlogPostHeaderProps {
  post: BlogPost
}

export default function BlogPostHeader({ post }: BlogPostHeaderProps) {
  return (
    <header className="max-w-[680px] mx-auto px-6 py-12">
      {/* Back Link */}
      <Link
        href="/blog"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Blog
      </Link>

      {/* Category */}
      {post.category && (
        <div className="mb-4">
          <span className="text-sm font-medium text-primary-700 uppercase tracking-wide">
            {post.category}
          </span>
        </div>
      )}

      {/* Title */}
      <Heading level={1} className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
        {post.title}
      </Heading>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-2xl text-gray-600 leading-relaxed mb-8">
          {post.excerpt}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-gray-600 text-sm border-b border-gray-200 pb-8">
        <span className="font-medium">{post.author}</span>
        <span>·</span>
        <time>{formatDate(post.publishedAt || post.createdAt)}</time>
      </div>
    </header>
  )
}
