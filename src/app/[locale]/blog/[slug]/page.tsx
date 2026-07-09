import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getPostBySlug } from '@/lib/blog-db'
import { getPostBySlug as getFilePost, isListedPost } from '@/lib/blog'
import { getMergedPosts } from '@/lib/blog-merge'
import BlogPostHeader from '@/components/blog/BlogPostHeader'
import BlogPostContent from '@/components/blog/BlogPostContent'
import RelatedPosts from '@/components/blog/RelatedPosts'

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Helper to get post from DB or file system (file posts are locale-aware,
// falling back to the German original when a translation is absent).
async function getPost(slug: string, locale: string) {
  const dbPost = await getPostBySlug(slug)
  if (dbPost) return dbPost
  return getFilePost(slug, locale)
}

// Unified DB + git-file read layer (deduped by slug).
async function getPosts(locale: string) {
  return getMergedPosts(locale)
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await getPost(slug, locale);

  if (!post) {
    return {
      title: { absolute: 'Post not found | Revamp-IT Blog' },
    };
  }

  return {
    title: { absolute: `${post.title} | Revamp-IT Blog` },
    description: post.excerpt || '',
    openGraph: {
      title: post.title,
      description: post.excerpt || '',
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: post.featuredImage ? [post.featuredImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || '',
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await getPost(slug, locale);

  if (!post || !post.published) {
    notFound();
  }

  // Related = same category, public only (never surface unlisted posts to a
  // link visitor who just happens to land on an unlisted article).
  const allPosts = await getPosts(locale);
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category && isListedPost(p))
    .slice(0, 3);

  return (
    <main>
      <BlogPostHeader post={post} />
      {post.featuredImage && (
        <figure className="mx-auto max-w-[960px] px-4 sm:px-6">
          <div className="relative aspect-[1200/630] overflow-hidden rounded-xl border border-subtle bg-surface-raised">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 960px) 100vw, 960px"
              className="object-cover"
            />
          </div>
        </figure>
      )}
      <BlogPostContent post={post} />
      {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
    </main>
  );
}
