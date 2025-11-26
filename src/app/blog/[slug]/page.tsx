import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, getAllPosts } from '@/lib/blog'
import BlogPostHeader from '@/components/blog/BlogPostHeader'
import BlogPostContent from '@/components/blog/BlogPostContent'
import RelatedPosts from '@/components/blog/RelatedPosts'

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found | RevampIt Blog',
    };
  }

  return {
    title: `${post.title} | RevampIt Blog`,
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
  const post = getPostBySlug(params.slug);
  
  if (!post || !post.published) {
    notFound();
  }

  // Get related posts from same category
  const allPosts = getAllPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-white">
      <BlogPostHeader post={post} />
      <BlogPostContent post={post} />
      {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
    </main>
  );
}