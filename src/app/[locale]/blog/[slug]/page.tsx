import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getPostBySlug } from '@/lib/blog-db'
import { getPostBySlug as getFilePost, isListedPost, getPostLocales } from '@/lib/blog'
import { getMergedPosts } from '@/lib/blog-merge'
import { APP_URL } from '@/config/urls'
import { ORG } from '@/config/org'
import { defaultLocale } from '@/i18n/routing'
import { isUnlistedUnlocked } from '@/lib/blog-unlisted-auth'
import BlogPasswordGate from './BlogPasswordGate'
import BlogPostHeader from '@/components/blog/BlogPostHeader'
import BlogPostContent from '@/components/blog/BlogPostContent'
import BlogComments from '@/components/blog/BlogComments'
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

  const isUnlisted = post.visibility === 'unlisted'
  const canonical = `${APP_URL}/blog/${slug}`
  const localesForSlug = getPostLocales(slug)
  const languages: Record<string, string> = {}
  for (const loc of localesForSlug) {
    languages[loc] = loc === defaultLocale ? canonical : `${APP_URL}/${loc}/blog/${slug}`
  }

  return {
    title: { absolute: `${post.title} | Revamp-IT Blog` },
    description: post.excerpt || '',
    // Unlisted posts are link-only: keep them out of the index even if a crawler
    // ever finds the URL. Listed posts get canonical + hreflang alternates.
    ...(isUnlisted ? { robots: { index: false, follow: false } } : {}),
    alternates: {
      canonical,
      ...(!isUnlisted && Object.keys(languages).length > 1 ? { languages } : {}),
    },
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

  // Closed (unlisted) posts sit behind a shared password by default — the body
  // never reaches the HTML until it's unlocked.
  if (post.visibility === 'unlisted' && !(await isUnlistedUnlocked())) {
    return (
      <main>
        <BlogPasswordGate title={post.title} />
      </main>
    );
  }

  // Related = same category, public only (never surface unlisted posts to a
  // link visitor who just happens to land on an unlisted article).
  const allPosts = await getPosts(locale);
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category && isListedPost(p))
    .slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.featuredImage ? { image: `${APP_URL}${post.featuredImage}` } : {}),
    datePublished: post.publishedAt || post.createdAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: ORG.name },
    mainEntityOfPage: `${APP_URL}/blog/${post.slug}`,
    inLanguage: locale,
  }

  return (
    <main>
      {post.visibility !== 'unlisted' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
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
      <BlogComments slug={post.slug} />
      {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
    </main>
  );
}
