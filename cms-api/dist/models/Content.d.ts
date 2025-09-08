export interface StaticPage {
    id: string;
    slug: string;
    title: string;
    content: string;
    seo_title?: string;
    seo_description?: string;
    meta_keywords?: string;
    is_published: boolean;
    published_at?: Date;
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateStaticPageData {
    slug: string;
    title: string;
    content: string;
    seo_title?: string;
    seo_description?: string;
    meta_keywords?: string;
    is_published?: boolean;
}
export interface UpdateStaticPageData {
    slug?: string;
    title?: string;
    content?: string;
    seo_title?: string;
    seo_description?: string;
    meta_keywords?: string;
    is_published?: boolean;
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
    tags: string[];
    is_published: boolean;
    published_at?: Date;
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateBlogPostData {
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
}
export interface UpdateBlogPostData {
    slug?: string;
    title?: string;
    content?: string;
    excerpt?: string;
    featured_image?: string;
    seo_title?: string;
    seo_description?: string;
    meta_keywords?: string;
    category_id?: string;
    tags?: string[];
    is_published?: boolean;
}
export interface Category {
    id: string;
    slug: string;
    name: string;
    description?: string;
    color?: string;
    is_active: boolean;
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateCategoryData {
    slug: string;
    name: string;
    description?: string;
    color?: string;
}
export interface UpdateCategoryData {
    slug?: string;
    name?: string;
    description?: string;
    color?: string;
    is_active?: boolean;
}
export interface ContentQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    is_published?: boolean;
    category_id?: string;
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
//# sourceMappingURL=Content.d.ts.map