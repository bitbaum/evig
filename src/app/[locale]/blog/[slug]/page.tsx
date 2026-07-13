import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getPostBySlug, getHiddenSlugs, getDbPostLocales, getDbPostForPreview } from '@/lib/blog-db'
import { auth } from '@/auth'
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
async function getPost(slug: string, locale: string, allowDraft = false) {
  const dbPost = await getPostBySlug(slug, locale)
  if (dbPost) return dbPost
  // Staff previewing an unpublished DB post (draft) — fetch regardless of state.
  if (allowDraft) {
    const draft = await getDbPostForPreview(slug, locale)
    if (draft) return draft
  }
  // A file post the admin "deleted" is hidden (its markdown stays as fallback).
  const file = getFilePost(slug, locale)
  if (!file) return null
  const hidden = await getHiddenSlugs()
  return hidden.has(slug) ? null : file
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
  // Union of file-post locales (sibling .md files) and DB-post locales
  // (translation rows) so hreflang is correct wherever the post lives.
  const localesForSlug = Array.from(
    new Set([...getPostLocales(slug), ...(await getDbPostLocales(slug))]),
  )
  const languages: Record<string, string> = {}
  for (const loc of localesForSlug) {
    languages[loc] = loc === defaultLocale ? canonical : `${APP_URL}/${loc}/blog/${slug}`
  }

  return {
    // SEO overrides (DB posts) take precedence over the display title/excerpt.
    title: { absolute: `${post.seoTitle || post.title} | Revamp-IT Blog` },
    description: post.seoDescription || post.excerpt || '',
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
  // Staff may preview drafts; everyone else only sees published posts.
  const session = await auth();
  const isStaff = !!session?.user?.isStaff;
  const post = await getPost(slug, locale, isStaff);

  if (!post) notFound();
  const isDraft = !post.published;
  if (isDraft && !isStaff) notFound();

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
      {isDraft && (
        <div className="mx-auto mt-4 max-w-[960px] px-4 sm:px-6">
          <div className="rounded-lg border border-warning-300 bg-warning-50 px-4 py-2.5 text-sm text-warning-800 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-200">
            Entwurf — nur für angemeldete Mitarbeitende sichtbar. Mit „Veröffentlichen" wird der Beitrag öffentlich.
          </div>
        </div>
      )}
      {post.isMachine && (
        <div className="mx-auto mt-4 max-w-[960px] px-4 sm:px-6">
          <div className="rounded-lg border border-subtle bg-surface-raised px-4 py-2.5 text-sm text-text-secondary">
            Diese Übersetzung wurde automatisch erstellt und noch nicht redaktionell geprüft.
          </div>
        </div>
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
