import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getPostBySlug, getAllPosts } from '@/lib/blog-db'
import { getPostBySlug as getFilePost, getAllPosts as getFilePosts } from '@/lib/blog'
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

// Helper to get all posts from DB or file system
async function getPosts(locale: string) {
  const dbPosts = await getAllPosts()
  if (dbPosts.length > 0) return dbPosts
  return getFilePosts(locale)
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

  // Get related posts from same category
  const allPosts = await getPosts(locale);
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  return (
    <main>
      <BlogPostHeader post={post} />
      <BlogPostContent post={post} />
      {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
    </main>
  );
}
