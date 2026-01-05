// RevampIT Reboot Content API Client
// This replaces the Strapi integration with our custom Reboot Content API

import { logger } from '@/lib/logger'
import { CMS_CONFIG } from '@/config/cms'

const REBOOT_CONTENT_URL = CMS_CONFIG.URL;
const ENABLE_CMS = CMS_CONFIG.ENABLED;
const REBOOT_CONTENT_TOKEN = CMS_CONFIG.TOKEN;

// Types for CMS API responses
export interface CMSResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  seo_title?: string;
  seo_description?: string;
  meta_keywords?: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  seo_title?: string;
  seo_description?: string;
  meta_keywords?: string;
  category_id?: string;
  category_name?: string;
  category_slug?: string;
  tags: string[];
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  token: string;
}

/**
 * Generic API request function
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<CMSResponse<T>> {
  if (!ENABLE_CMS) {
    return { success: false, error: 'CMS is disabled' };
  }
  const url = `${REBOOT_CONTENT_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (REBOOT_CONTENT_TOKEN) {
    (headers as Record<string, string>).Authorization = `Bearer ${REBOOT_CONTENT_TOKEN}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    logger.error(`API Request failed for ${endpoint}`, { error, endpoint });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Static Pages API
 */
export const staticPagesApi = {
  /**
   * Get all static pages
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_published?: boolean;
  }): Promise<CMSResponse<PaginatedResponse<StaticPage>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_published !== undefined) queryParams.append('is_published', params.is_published.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/content/static-pages${queryString ? `?${queryString}` : ''}`;

    return apiRequest<PaginatedResponse<StaticPage>>(endpoint);
  },

  /**
   * Get a single static page by slug
   */
  async getBySlug(slug: string): Promise<CMSResponse<StaticPage>> {
    return apiRequest<StaticPage>(`/api/content/static-pages/${slug}`);
  },

  /**
   * Create a new static page
   */
  async create(data: {
    slug: string;
    title: string;
    content: string;
    seo_title?: string;
    seo_description?: string;
    meta_keywords?: string;
    is_published?: boolean;
  }): Promise<CMSResponse<StaticPage>> {
    return apiRequest<StaticPage>('/api/content/static-pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a static page
   */
  async update(id: string, data: Partial<{
    slug: string;
    title: string;
    content: string;
    seo_title?: string;
    seo_description?: string;
    meta_keywords?: string;
    is_published?: boolean;
  }>): Promise<CMSResponse<StaticPage>> {
    return apiRequest<StaticPage>(`/api/content/static-pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a static page
   */
  async delete(id: string): Promise<CMSResponse<void>> {
    return apiRequest<void>(`/api/content/static-pages/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Blog Posts API
 */
export const blogPostsApi = {
  /**
   * Get all blog posts
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: string;
    is_published?: boolean;
  }): Promise<CMSResponse<PaginatedResponse<BlogPost>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category_id) queryParams.append('category_id', params.category_id);
    if (params?.is_published !== undefined) queryParams.append('is_published', params.is_published.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/content/blog-posts${queryString ? `?${queryString}` : ''}`;

    return apiRequest<PaginatedResponse<BlogPost>>(endpoint);
  },

  /**
   * Get a single blog post by slug
   */
  async getBySlug(slug: string): Promise<CMSResponse<BlogPost>> {
    return apiRequest<BlogPost>(`/api/content/blog-posts/${slug}`);
  },

  /**
   * Create a new blog post
   */
  async create(data: {
    slug: string;
    title: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    seo_title?: string;
    seo_description?: string;
    meta_keywords?: string;
    category_id?: string;
    tags?: string[];
    is_published?: boolean;
  }): Promise<CMSResponse<BlogPost>> {
    return apiRequest<BlogPost>('/api/content/blog-posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a blog post
   */
  async update(id: string, data: Partial<{
    slug: string;
    title: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    seo_title?: string;
    seo_description?: string;
    meta_keywords?: string;
    category_id?: string;
    tags?: string[];
    is_published?: boolean;
  }>): Promise<CMSResponse<BlogPost>> {
    return apiRequest<BlogPost>(`/api/content/blog-posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a blog post
   */
  async delete(id: string): Promise<CMSResponse<void>> {
    return apiRequest<void>(`/api/content/blog-posts/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Categories API
 */
export const categoriesApi = {
  /**
   * Get all categories
   */
  async getAll(): Promise<CMSResponse<Category[]>> {
    return apiRequest<Category[]>('/api/content/categories');
  },

  /**
   * Get a single category by slug
   */
  async getBySlug(slug: string): Promise<CMSResponse<Category>> {
    return apiRequest<Category>(`/api/content/categories/${slug}`);
  },

  /**
   * Create a new category
   */
  async create(data: {
    slug: string;
    name: string;
    description?: string;
    color?: string;
  }): Promise<CMSResponse<Category>> {
    return apiRequest<Category>('/api/content/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a category
   */
  async update(id: string, data: Partial<{
    slug: string;
    name: string;
    description?: string;
    color?: string;
    is_active?: boolean;
  }>): Promise<CMSResponse<Category>> {
    return apiRequest<Category>(`/api/content/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a category
   */
  async delete(id: string): Promise<CMSResponse<void>> {
    return apiRequest<void>(`/api/content/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Login user
   */
  async login(email: string, password: string): Promise<CMSResponse<AuthResponse>> {
    return apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<CMSResponse<any>> {
    return apiRequest('/api/auth/profile');
  },

  /**
   * Update user profile
   */
  async updateProfile(data: {
    email?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<CMSResponse<any>> {
    return apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Change password
   */
  async changePassword(data: {
    current_password: string;
    new_password: string;
  }): Promise<CMSResponse<any>> {
    return apiRequest('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Utility functions
 */

/**
 * Get image URL from CMS API
 */
export function getImageUrl(imagePath?: string): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${REBOOT_CONTENT_URL}${imagePath}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-CH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(content: string, maxLength: number = 150): string {
  // Remove HTML tags and get plain text
  const plainText = content.replace(/<[^>]*>/g, '');
  if (plainText.length <= maxLength) return plainText;

  // Find the last complete word within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  return lastSpaceIndex > 0
    ? truncated.substring(0, lastSpaceIndex) + '...'
    : truncated + '...';
}

/**
 * Check if content is published
 */
export function isPublished(item: { is_published: boolean; published_at?: string }): boolean {
  return item.is_published && (!item.published_at || new Date(item.published_at) <= new Date());
}
