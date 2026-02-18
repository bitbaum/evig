export interface Category {
  id: string
  name: string
  slug: string
}

export interface BlogPostData {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: string
  categoryId: string
  tags: string[]
  isPublished: boolean
  seoTitle: string
  seoDescription: string
}

export interface BlogPostFormProps {
  initialData?: Partial<BlogPostData>
  isEdit?: boolean
}
