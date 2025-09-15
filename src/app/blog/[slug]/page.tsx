import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import strapi, { getStrapiMediaURL, formatDate } from '@/lib/strapi'
import { BlogPost } from '@/lib/strapi'

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const response = await strapi.getBlogPost(params.slug, ['featured_image']);
    const post = response.data[0];
    
    if (!post) {
      return {
        title: 'Post Not Found | RevampIt Blog',
      };
    }

    const seoTitle = post.attributes.seo_title || post.attributes.title;
    const seoDescription = post.attributes.seo_description || post.attributes.excerpt || '';
    const featuredImage = post.attributes.featured_image?.data?.attributes;

    return {
      title: `${seoTitle} | RevampIt Blog`,
      description: seoDescription,
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        type: 'article',
        publishedTime: post.attributes.published_at,
        authors: [post.attributes.author.data.attributes.username],
        images: featuredImage ? [getStrapiMediaURL(featuredImage.url)] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: seoTitle,
        description: seoDescription,
        images: featuredImage ? [getStrapiMediaURL(featuredImage.url)] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Post Not Found | RevampIt Blog',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const response = await strapi.getBlogPost(params.slug, [
      'author',
      'categories',
      'tags',
      'featured_image'
    ]);
    
    const post = response.data[0];
    
    if (!post || post.attributes.status !== 'published') {
      notFound();
    }

    return (
      <main className="min-h-screen bg-gray-50">
        <BlogPostHeader post={post} />
        <BlogPostContent post={post} />
        <RelatedPosts currentPost={post} />
      </main>
    );
  } catch (error) {
    console.error('Error fetching blog post:', error);
    notFound();
  }
}

function BlogPostHeader({ post }: { post: BlogPost }) {
  const featuredImage = post.attributes.featured_image?.data?.attributes;
  const author = post.attributes.author.data.attributes;
  const categories = post.attributes.categories?.data || [];
  const publishedDate = post.attributes.published_at || post.attributes.createdAt;

  return (
    <header className="relative">
      {featuredImage && (
        <div className="relative h-96 w-full">
          <Image
            src={getStrapiMediaURL(featuredImage.url)}
            alt={featuredImage.alternativeText || post.attributes.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
      )}
      
      <div className={`${featuredImage ? 'absolute bottom-0 left-0 right-0 text-white' : 'bg-white'} py-12`}>
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex gap-2 mb-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/blog?category=${category.attributes.slug}`}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    featuredImage 
                      ? 'bg-white bg-opacity-20 text-white hover:bg-opacity-30' 
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                  style={category.attributes.color && !featuredImage ? { 
                    backgroundColor: `${category.attributes.color}20`, 
                    color: category.attributes.color 
                  } : {}}
                >
                  {category.attributes.name}
                </Link>
              ))}
            </div>
          )}

          <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${featuredImage ? 'text-white' : 'text-gray-900'}`}>
            {post.attributes.title}
          </h1>

          {post.attributes.excerpt && (
            <p className={`text-xl mb-6 ${featuredImage ? 'text-gray-200' : 'text-gray-600'}`}>
              {post.attributes.excerpt}
            </p>
          )}

          <div className={`flex items-center gap-4 text-sm ${featuredImage ? 'text-gray-200' : 'text-gray-500'}`}>
            <span>By {author.username}</span>
            <span>•</span>
            <span>{formatDate(publishedDate)}</span>
            <span>•</span>
            <span>{post.attributes.view_count} views</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function BlogPostContent({ post }: { post: BlogPost }) {
  const tags = post.attributes.tags?.data || [];

  return (
    <article className="bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          {/* Render rich text content */}
          <div dangerouslySetInnerHTML={{ __html: post.attributes.content }} />
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.attributes.slug}`}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  #{tag.attributes.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Share buttons */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
          <div className="flex gap-4">
            <ShareButton 
              platform="twitter" 
              url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://revampit.ch'}/blog/${post.attributes.slug}`}
              title={post.attributes.title}
            />
            <ShareButton 
              platform="linkedin" 
              url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://revampit.ch'}/blog/${post.attributes.slug}`}
              title={post.attributes.title}
            />
            <ShareButton 
              platform="facebook" 
              url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://revampit.ch'}/blog/${post.attributes.slug}`}
              title={post.attributes.title}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function ShareButton({ platform, url, title }: { platform: string; url: string; title: string }) {
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };

  const icons = {
    twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  };

  return (
    <a
      href={shareUrls[platform as keyof typeof shareUrls]}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
    >
      {icons[platform as keyof typeof icons]}
      <span className="capitalize">{platform}</span>
    </a>
  );
}

async function RelatedPosts({ currentPost }: { currentPost: BlogPost }) {
  try {
    const categories = currentPost.attributes.categories?.data || [];
    
    if (categories.length === 0) return null;

    // Get related posts from the same category
    const relatedResponse = await strapi.getBlogPostsByCategory(
      categories[0].attributes.slug,
      {
        pageSize: 4,
        populate: ['featured_image', 'categories', 'author'],
      }
    );

    // Filter out the current post
    const relatedPosts = relatedResponse.data.filter(
      (post) => post.id !== currentPost.id
    ).slice(0, 3);

    if (relatedPosts.length === 0) return null;

    return (
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((post) => (
              <RelatedPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return null;
  }
}

function RelatedPostCard({ post }: { post: BlogPost }) {
  const featuredImage = post.attributes.featured_image?.data?.attributes;
  const author = post.attributes.author.data.attributes;

  return (
    <article className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {featuredImage && (
        <div className="relative h-32 w-full">
          <Image
            src={getStrapiMediaURL(featuredImage.url)}
            alt={featuredImage.alternativeText || post.attributes.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link href={`/blog/${post.attributes.slug}`} className="hover:text-green-600 transition-colors">
            {post.attributes.title}
          </Link>
        </h3>
        
        <div className="text-sm text-gray-500">
          <span>By {author.username}</span>
          <span className="mx-2">•</span>
          <span>{formatDate(post.attributes.published_at || post.attributes.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}