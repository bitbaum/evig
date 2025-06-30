export interface StrapiMediaFormat {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
  sizeInBytes: number;
}

export interface StrapiMedia {
  id: number;
  attributes: {
    name: string;
    alternativeText?: string;
    caption?: string;
    width: number;
    height: number;
    formats: {
      large?: StrapiMediaFormat;
      medium?: StrapiMediaFormat;
      small?: StrapiMediaFormat;
      thumbnail?: StrapiMediaFormat;
    };
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl?: string;
    provider: string;
    provider_metadata: any;
    createdAt: string;
    updatedAt: string;
  };
}

export interface StrapiUser {
  id: number;
  attributes: {
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface StrapiBlogPost {
  id: number;
  attributes: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_image?: {
      data?: StrapiMedia;
    };
    author: {
      data: StrapiUser;
    };
    status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'published' | 'rejected';
    categories?: {
      data: StrapiCategory[];
    };
    tags?: {
      data: StrapiTag[];
    };
    published_at?: string;
    editor_feedback?: string;
    seo_title?: string;
    seo_description?: string;
    view_count: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface StrapiStaticPage {
  id: number;
  attributes: {
    page_key: string;
    title: string;
    content: string;
    meta_title?: string;
    meta_description?: string;
    updated_by?: {
      data: StrapiUser;
    };
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface StrapiCategory {
  id: number;
  attributes: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    blog_posts?: {
      data: StrapiBlogPost[];
    };
    createdAt: string;
    updatedAt: string;
  };
}

export interface StrapiTag {
  id: number;
  attributes: {
    name: string;
    slug: string;
    blog_posts?: {
      data: StrapiBlogPost[];
    };
    createdAt: string;
    updatedAt: string;
  };
}

export interface StrapiResponse<T> {
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

export interface StrapiErrorResponse {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details?: any;
  };
}

// Utility types for easier consumption
export type BlogPostStatus = StrapiBlogPost['attributes']['status'];

export interface BlogPostSummary {
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

export interface StaticPageContent {
  id: number;
  pageKey: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  updatedAt: string;
}