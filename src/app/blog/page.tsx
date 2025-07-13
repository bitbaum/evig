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

export default function BlogPage() {
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
              Bald verfügbar: Ein Raum für die Erforschung von Nachhaltigkeit, Open Source und der Kunst, Technologie ein zweites Leben zu geben.
            </p>
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

      {/* Coming Soon Section */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            Bald verfügbar
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Begleiten Sie unsere Reise
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Wir arbeiten daran, Ihnen aufschlussreiche Inhalte über nachhaltige Technologie, Open-Source-Lösungen und innovative Wege zur Reduzierung von Elektroschrott zu bringen. Bleiben Sie dran für unsere Einführung!
          </p>
          <Link 
            href="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Kontakt aufnehmen
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  )
} 