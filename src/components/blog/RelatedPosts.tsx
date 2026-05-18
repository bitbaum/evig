import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

interface RelatedPostsProps {
  posts: BlogPost[]
}

export default async function RelatedPosts({ posts }: RelatedPostsProps) {
  const t = await getTranslations('blog')

  return (
    <section className="bg-neutral-50 py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <Heading level={2} className="text-3xl font-bold text-neutral-900 mb-8">{t('relatedArticles')}</Heading>
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group"
            >
              <article className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:border-neutral-300 transition-all">
                {post.featuredImage && (
                  <div className="aspect-video overflow-hidden bg-neutral-200 dark:bg-neutral-700 relative">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>
                )}
                <div className="p-6">
                  <Heading level={3} className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                    {post.title}
                  </Heading>
                  {post.excerpt && (
                    <p className="text-neutral-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <span>{post.author}</span>
                    <span>·</span>
                    <time>{formatDate(post.publishedAt || post.createdAt)}</time>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
