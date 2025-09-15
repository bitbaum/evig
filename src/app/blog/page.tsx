import { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, User, Tag, Eye } from 'lucide-react'
import strapi, { formatDate, getStrapiMediaURL } from '@/lib/strapi'
import type { BlogPost } from '@/lib/strapi'

export const metadata: Metadata = {
  title: 'Blog | RevampIt',
  description: 'Entdecken Sie Wege, Dingen, die einst wertvoll waren, ein zweites Leben zu geben – Technologie, Nahrung, Kunst und mehr.'
}

// Transform blog post for easier use
interface BlogPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  author: {
    username: string;
    email: string;
  };
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    color?: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  publishedAt?: string;
  viewCount: number;
  createdAt: string;
}

async function getBlogPosts(): Promise<BlogPostSummary[]> {
  try {
    const response = await strapi.getBlogPosts({
      filters: { status: 'published' },
      populate: ['featured_image', 'author', 'categories', 'tags'],
      sort: 'published_at:desc',
      pageSize: 12
    });

    return response.data.map((post: BlogPost) => ({
      id: post.id,
      title: post.attributes.title,
      slug: post.attributes.slug,
      excerpt: post.attributes.excerpt,
      featuredImage: post.attributes.featured_image?.data?.attributes.url,
      author: {
        username: post.attributes.author.data.attributes.username,
        email: post.attributes.author.data.attributes.email
      },
      categories: post.attributes.categories?.data.map((cat: any) => ({
        id: cat.id,
        name: cat.attributes.name,
        slug: cat.attributes.slug,
        color: cat.attributes.color
      })) || [],
      tags: post.attributes.tags?.data.map((tag: any) => ({
        id: tag.id,
        name: tag.attributes.name,
        slug: tag.attributes.slug
      })) || [],
      publishedAt: post.attributes.published_at,
      viewCount: post.attributes.view_count,
      createdAt: post.attributes.createdAt
    }));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

const topics = [
  {
    title: 'Nachhaltigkeit',
    description: 'Entdecken Sie, wie wir Technologie neues Leben geben und Elektroschrott durch innovative Lösungen reduzieren.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    )
  },
  {
    title: 'Linux & Open Source',
    description: 'Tiefe Einblicke in Linux-Distributionen, Open-Source-Software und wie sie zu nachhaltigem Computing beitragen.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    )
  },
  {
    title: 'Hardware-Wiederbelebung',
    description: 'Lernen Sie über Hardware-Aufarbeitung, Upgrades und kreative Wege, die Lebensdauer von Technologie zu verlängern.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    )
  }
]

export default async function BlogPage() {
  // Fetch blog posts from Strapi
  const posts = await getBlogPosts();

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
              Entdecken Sie unsere Artikel über Nachhaltigkeit, Open Source und der Kunst, Technologie ein zweites Leben zu geben.
            </p>
            <div className="mt-6 text-green-200">
              {posts.length > 0 ? (
                <span>{posts.length} Artikel verfügbar</span>
              ) : (
                <span>Fügen Sie Ihre ersten Artikel in Strapi hinzu!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Topics Section */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Was Sie erwarten können
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
              Bleiben Sie auf dem Laufenden
            </h2>
            <p className="text-gray-600 mb-8">
              Abonnieren Sie unseren Newsletter, um als Erste zu erfahren, wann wir unseren Blog starten.
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex gap-4">
                <input
                  type="email"
                  placeholder="Geben Sie Ihre E-Mail ein"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Abonnieren
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Posts Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {posts.length === 0 ? (
        <div className="text-center">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
              Keine Artikel gefunden
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Fügen Sie Ihre ersten Blog-Artikel hinzu!
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Verwenden Sie Strapi Admin Panel, um Ihre ersten Artikel zu erstellen. Gehen Sie zu Content Manager → Blog Posts → Add new entry.
          </p>
          <Link 
              href="/admin"
              target="_blank"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
              Strapi Admin öffnen
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                Aktuelle Artikel
              </h2>
              <Link
                href="/admin"
                target="_blank"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Admin Panel
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100">
                  {post.featuredImage && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={getStrapiMediaURL(post.featuredImage)}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                      <Link href={`/blog/${post.slug}`} className="hover:text-green-600 transition-colors">
                        {post.title}
                      </Link>
                    </h3>

                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{post.author.username}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                    </div>

                    {post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.categories.slice(0, 2).map((category) => (
                          <span
                            key={category.id}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                    >
                      Weiterlesen
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
} 