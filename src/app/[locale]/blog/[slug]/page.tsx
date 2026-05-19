import { Metadata } from 'next'
import { notFound } from 'next/navigation'
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

// Helper to get post from DB or file system
async function getPost(slug: string) {
  const dbPost = await getPostBySlug(slug)
  if (dbPost) return dbPost
  return getFilePost(slug)
}

// Helper to get all posts from DB or file system
async function getPosts() {
  const dbPosts = await getAllPosts()
  if (dbPosts.length > 0) return dbPosts
  return getFilePosts()
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

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
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) {
    notFound();
  }

  // Get related posts from same category
  const allPosts = await getPosts();
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