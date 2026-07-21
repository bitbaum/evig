import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/date-formats'
import { Card } from '@/components/ui/card'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'
import BlogByline from './BlogByline'

interface RelatedPostsProps {
  posts: BlogPost[]
}

export default async function RelatedPosts({ posts }: RelatedPostsProps) {
  const t = await getTranslations('blog')

  return (
    <section className="bg-surface-raised py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <Heading level={2} className="text-3xl font-bold text-text-primary mb-8">{t('relatedArticles')}</Heading>
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group"
            >
              <Card className="overflow-hidden transition-all hover:border-strong">
                {post.featuredImage && (
                  <div className="aspect-video overflow-hidden bg-surface-overlay relative">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  <Heading level={3} className="text-xl font-bold text-text-primary mb-2 group-hover:text-action dark:group-hover:text-action transition-colors line-clamp-2">
                    {post.title}
                  </Heading>
                  {post.excerpt && (
                    <p className="text-text-secondary mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-text-tertiary">
                    <BlogByline author={post.author} authorId={post.authorId} />
                    <span>·</span>
                    <time>{formatDate(post.publishedAt || post.createdAt)}</time>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
