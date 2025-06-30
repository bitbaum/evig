import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import strapi, { getStrapiMediaURL, formatDate } from '@/lib/strapi'
import { BlogPost, Category } from '@/lib/strapi'

export const metadata: Metadata = {
  title: 'Blog | RevampIt',
  description: 'Explore ways to give a second life to things that once held value—technology, food, art, and more.',
}

interface BlogPageProps {
  searchParams: {
    page?: string;
    category?: string;
    tag?: string;
    search?: string;
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const currentPage = parseInt(searchParams.page || '1');
  const categoryFilter = searchParams.category;
  const tagFilter = searchParams.tag;
  const searchQuery = searchParams.search;

  try {
    // Fetch blog posts
    let blogPostsResponse;
    
    if (searchQuery) {
      blogPostsResponse = await strapi.searchBlogPosts(searchQuery, {
        page: currentPage,
        pageSize: 6,
      });
    } else if (categoryFilter) {
      blogPostsResponse = await strapi.getBlogPostsByCategory(categoryFilter, {
        page: currentPage,
        pageSize: 6,
        populate: ['author', 'categories', 'tags', 'featured_image'],
      });
    } else if (tagFilter) {
      blogPostsResponse = await strapi.getBlogPostsByTag(tagFilter, {
        page: currentPage,
        pageSize: 6,
        populate: ['author', 'categories', 'tags', 'featured_image'],
      });
    } else {
      blogPostsResponse = await strapi.getBlogPosts({
        page: currentPage,
        pageSize: 6,
        sort: 'published_at:desc',
        filters: { status: 'published' },
        populate: ['author', 'categories', 'tags', 'featured_image'],
      });
    }

    // Fetch categories for filter menu
    const categoriesResponse = await strapi.getCategories();

    const blogPosts = blogPostsResponse.data || [];
    const categories = categoriesResponse.data || [];
    const pagination = blogPostsResponse.meta?.pagination;

    // If no posts are available, show the coming soon page
    if (blogPosts.length === 0 && !searchQuery && !categoryFilter && !tagFilter) {
      return <ComingSoonBlog categories={categories} />;
    }

    return (
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                RevampIt Blog
              </h1>
              <p className="text-xl text-green-100 max-w-2xl">
                Exploring sustainability, open source, and the art of giving technology a second life.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <form method="GET" className="relative">
                  <input
                    type="text"
                    name="search"
                    placeholder="Search articles..."
                    defaultValue={searchQuery}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </form>
              </div>

              {/* Categories Filter */}
              <div className="flex gap-2 flex-wrap">
                <Link
                  href="/blog"
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    !categoryFilter ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/blog?category=${category.attributes.slug}`}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      categoryFilter === category.attributes.slug
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={category.attributes.color ? { backgroundColor: categoryFilter === category.attributes.slug ? category.attributes.color : undefined } : {}}
                  >
                    {category.attributes.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="container mx-auto px-4 py-12">
          {blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
              <Link href="/blog" className="text-green-600 hover:text-green-700 mt-2 inline-block">
                View all articles
              </Link>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {blogPosts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pageCount > 1 && (
                <Pagination 
                  currentPage={currentPage}
                  totalPages={pagination.pageCount}
                  searchParams={searchParams}
                />
              )}
            </>
          )}
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error fetching blog data:', error);
    // Fallback to coming soon page on error
    return <ComingSoonBlog categories={[]} />;
  }
}

function BlogPostCard({ post }: { post: BlogPost }) {
  const featuredImage = post.attributes.featured_image?.data?.attributes;
  const author = post.attributes.author.data.attributes;
  const categories = post.attributes.categories?.data || [];
  const tags = post.attributes.tags?.data || [];

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {featuredImage && (
        <div className="relative h-48 w-full">
          <Image
            src={getStrapiMediaURL(featuredImage.url)}
            alt={featuredImage.alternativeText || post.attributes.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex gap-2 mb-3">
            {categories.slice(0, 2).map((category) => (
              <Link
                key={category.id}
                href={`/blog?category=${category.attributes.slug}`}
                className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                style={category.attributes.color ? { backgroundColor: `${category.attributes.color}20`, color: category.attributes.color } : {}}
              >
                {category.attributes.name}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
          <Link href={`/blog/${post.attributes.slug}`} className="hover:text-green-600 transition-colors">
            {post.attributes.title}
          </Link>
        </h3>

        {/* Excerpt */}
        {post.attributes.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.attributes.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>By {author.username}</span>
          <span>{formatDate(post.attributes.published_at || post.attributes.createdAt)}</span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-1 mt-4">
            {tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                href={`/blog?tag=${tag.attributes.slug}`}
                className="text-xs text-gray-500 hover:text-green-600 transition-colors"
              >
                #{tag.attributes.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Pagination({ 
  currentPage, 
  totalPages, 
  searchParams 
}: { 
  currentPage: number; 
  totalPages: number; 
  searchParams: any;
}) {
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'page' && value) {
        params.set(key, value as string);
      }
    });
    if (page > 1) {
      params.set('page', page.toString());
    }
    const queryString = params.toString();
    return `/blog${queryString ? `?${queryString}` : ''}`;
  };

  return (
    <div className="flex justify-center items-center gap-2">
      {/* Previous */}
      {currentPage > 1 && (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Previous
        </Link>
      )}

      {/* Page Numbers */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={createPageUrl(page)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            page === currentPage
              ? 'bg-green-600 text-white'
              : 'border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </Link>
      ))}

      {/* Next */}
      {currentPage < totalPages && (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Next
        </Link>
      )}
    </div>
  );
}

// Coming Soon fallback component
function ComingSoonBlog({ categories }: { categories: Category[] }) {
  const topics = [
    {
      title: 'Sustainability',
      description: 'Discover how we give new life to technology and reduce e-waste through innovative solutions.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    },
    {
      title: 'Linux & Open Source',
      description: 'Deep dives into Linux distributions, open source software, and how they contribute to sustainable computing.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      title: 'Hardware Revival',
      description: 'Learn about hardware refurbishment, upgrades, and creative ways to extend the life of technology.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      )
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              RevampIt Blog
            </h1>
            <p className="text-xl text-green-100 max-w-2xl">
              Coming soon: A space for exploring sustainability, open source, and the art of giving technology a second life.
            </p>
          </div>
        </div>
      </div>

      {/* Topics Section */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          What to Expect
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {topics.map((topic, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-green-600 mb-4">
                {topic.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {topic.title}
              </h3>
              <p className="text-gray-600">
                {topic.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-green-50 border-t border-b border-green-100">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-600 mb-8">
              Subscribe to our newsletter to be the first to know when we launch our blog.
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            Coming Soon
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Join Our Journey
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            We're working on bringing you insightful content about sustainable technology, open source solutions, and innovative ways to reduce e-waste. Stay tuned for our launch!
          </p>
          <Link 
            href="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Get in Touch
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}