interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface BlogPost {
  id: number;
  attributes: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_image?: {
      data?: {
        attributes: {
          url: string;
          alternativeText?: string;
          width: number;
          height: number;
        };
      };
    };
    author: {
      data: {
        attributes: {
          username: string;
          email: string;
        };
      };
    };
    status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'published' | 'rejected';
    categories?: {
      data: Array<{
        id: number;
        attributes: {
          name: string;
          slug: string;
          color?: string;
        };
      }>;
    };
    tags?: {
      data: Array<{
        id: number;
        attributes: {
          name: string;
          slug: string;
        };
      }>;
    };
    published_at?: string;
    seo_title?: string;
    seo_description?: string;
    view_count: number;
    createdAt: string;
    updatedAt: string;
  };
}

interface StaticPage {
  id: number;
  attributes: {
    page_key: string;
    title: string;
    content: string;
    meta_title?: string;
    meta_description?: string;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface Category {
  id: number;
  attributes: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
  };
}

interface Tag {
  id: number;
  attributes: {
    name: string;
    slug: string;
  };
}

class StrapiClient {
  private baseURL: string;
  private apiToken?: string;

  constructor(baseURL?: string, apiToken?: string) {
    this.baseURL = baseURL || process.env.STRAPI_API_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    this.apiToken = apiToken || process.env.STRAPI_API_TOKEN;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiToken) {
      headers.Authorization = `Bearer ${this.apiToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Blog Posts
  async getBlogPosts(params?: {
    page?: number;
    pageSize?: number;
    sort?: string;
    filters?: Record<string, any>;
    populate?: string[];
  }): Promise<StrapiResponse<BlogPost[]>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('pagination[page]', params.page.toString());
    if (params?.pageSize) searchParams.append('pagination[pageSize]', params.pageSize.toString());
    if (params?.sort) searchParams.append('sort', params.sort);
    
    if (params?.populate) {
      params.populate.forEach(field => {
        searchParams.append('populate', field);
      });
    }

    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        searchParams.append(`filters[${key}]`, value);
      });
    }

    const endpoint = `/blog-posts?${searchParams.toString()}`;
    return this.request<StrapiResponse<BlogPost[]>>(endpoint);
  }

  async getBlogPost(slug: string, populate?: string[]): Promise<StrapiResponse<BlogPost[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('filters[slug][$eq]', slug);
    
    if (populate) {
      populate.forEach(field => {
        searchParams.append('populate', field);
      });
    }

    const endpoint = `/blog-posts?${searchParams.toString()}`;
    return this.request<StrapiResponse<BlogPost[]>>(endpoint);
  }

  async getBlogPostsByCategory(categorySlug: string, params?: {
    page?: number;
    pageSize?: number;
    populate?: string[];
  }): Promise<StrapiResponse<BlogPost[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('filters[categories][slug][$eq]', categorySlug);
    searchParams.append('filters[status][$eq]', 'published');
    
    if (params?.page) searchParams.append('pagination[page]', params.page.toString());
    if (params?.pageSize) searchParams.append('pagination[pageSize]', params.pageSize.toString());
    
    if (params?.populate) {
      params.populate.forEach(field => {
        searchParams.append('populate', field);
      });
    }

    const endpoint = `/blog-posts?${searchParams.toString()}`;
    return this.request<StrapiResponse<BlogPost[]>>(endpoint);
  }

  async getBlogPostsByTag(tagSlug: string, params?: {
    page?: number;
    pageSize?: number;
    populate?: string[];
  }): Promise<StrapiResponse<BlogPost[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('filters[tags][slug][$eq]', tagSlug);
    searchParams.append('filters[status][$eq]', 'published');
    
    if (params?.page) searchParams.append('pagination[page]', params.page.toString());
    if (params?.pageSize) searchParams.append('pagination[pageSize]', params.pageSize.toString());
    
    if (params?.populate) {
      params.populate.forEach(field => {
        searchParams.append('populate', field);
      });
    }

    const endpoint = `/blog-posts?${searchParams.toString()}`;
    return this.request<StrapiResponse<BlogPost[]>>(endpoint);
  }

  // Static Pages
  async getStaticPage(pageKey: string): Promise<StrapiResponse<StaticPage[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('filters[page_key][$eq]', pageKey);
    searchParams.append('filters[is_active][$eq]', 'true');

    const endpoint = `/static-pages?${searchParams.toString()}`;
    return this.request<StrapiResponse<StaticPage[]>>(endpoint);
  }

  // Categories
  async getCategories(): Promise<StrapiResponse<Category[]>> {
    return this.request<StrapiResponse<Category[]>>('/categories?sort=name:asc');
  }

  async getCategory(slug: string): Promise<StrapiResponse<Category[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('filters[slug][$eq]', slug);

    const endpoint = `/categories?${searchParams.toString()}`;
    return this.request<StrapiResponse<Category[]>>(endpoint);
  }

  // Tags
  async getTags(): Promise<StrapiResponse<Tag[]>> {
    return this.request<StrapiResponse<Tag[]>>('/tags?sort=name:asc');
  }

  async getTag(slug: string): Promise<StrapiResponse<Tag[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('filters[slug][$eq]', slug);

    const endpoint = `/tags?${searchParams.toString()}`;
    return this.request<StrapiResponse<Tag[]>>(endpoint);
  }

  // Search
  async searchBlogPosts(query: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<StrapiResponse<BlogPost[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('filters[status][$eq]', 'published');
    searchParams.append('filters[$or][0][title][$containsi]', query);
    searchParams.append('filters[$or][1][content][$containsi]', query);
    searchParams.append('filters[$or][2][excerpt][$containsi]', query);
    
    if (params?.page) searchParams.append('pagination[page]', params.page.toString());
    if (params?.pageSize) searchParams.append('pagination[pageSize]', params.pageSize.toString());
    
    searchParams.append('populate', 'author');
    searchParams.append('populate', 'categories');
    searchParams.append('populate', 'tags');
    searchParams.append('populate', 'featured_image');

    const endpoint = `/blog-posts?${searchParams.toString()}`;
    return this.request<StrapiResponse<BlogPost[]>>(endpoint);
  }
}

// Helper function to get media URL
export function getStrapiMediaURL(url?: string): string {
  if (!url) return '';
  
  // If it's already a full URL, return as is
  if (url.startsWith('http')) return url;
  
  // Otherwise, prepend Strapi base URL
  const baseURL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  return `${baseURL}${url}`;
}

// Helper function to format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Export default instance
const strapi = new StrapiClient();
export default strapi;

// Export types
export type {
  BlogPost,
  StaticPage,
  Category,
  Tag,
  StrapiResponse
};