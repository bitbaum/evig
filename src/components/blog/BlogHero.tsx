import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Clock } from 'lucide-react'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/date-formats'
import { getReadingTime } from '@/lib/blog-utils'
import Heading from '@/components/ui/Heading'

interface BlogHeroProps {
  post: BlogPost
}

export default function BlogHero({ post }: BlogHeroProps) {
  const readingTime = getReadingTime(post.body)

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Image */}
        {post.featuredImage ? (
          <div className="aspect-[16/10] lg:aspect-[4/3] overflow-hidden rounded-lg bg-gray-200 order-2 lg:order-1 relative">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          </div>
        ) : (
          <div className="aspect-[16/10] lg:aspect-[4/3] bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center order-2 lg:order-1">
            <span className="text-primary-700 text-6xl font-bold">R</span>
          </div>
        )}

        {/* Content */}
        <div className="order-1 lg:order-2">
          {/* Category Badge */}
          {post.category && (
            <span className="inline-block px-3 py-1 bg-primary-600 text-white text-sm font-semibold rounded mb-4 uppercase tracking-wide">
              {post.category}
            </span>
          )}

          {/* Title */}
          <Heading level={2} className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-primary-700 transition-colors">
            {post.title}
          </Heading>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{post.author}</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <time>{formatDate(post.publishedAt || post.createdAt)}</time>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {readingTime} min read
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
