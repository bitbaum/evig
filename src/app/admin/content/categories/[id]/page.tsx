/**
 * Admin - Edit Blog Category Page
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import CategoryForm from '@/components/admin/CategoryForm'
import { DEFAULT_CATEGORY_COLOR } from '@/config/ui-colors'

export const metadata: Metadata = {
  title: 'Kategorie bearbeiten',
  description: 'Blog-Kategorie bearbeiten.',
}

interface EditCategoryPageProps {
  params: Promise<{
    id: string
  }>
}

interface CategoryData {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  sort_order: number
  is_active: boolean
}

async function getCategory(id: string): Promise<CategoryData | null> {
  try {
    const result = await query<CategoryData>(
      `SELECT id, name, slug, description, color, sort_order, is_active
       FROM ${TABLE_NAMES.BLOG_CATEGORIES}
       WHERE id = $1`,
      [id]
    )
    return result.rows[0] || null
  } catch {
    return null
  }
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/categories')
  }

  const { id } = await params
  const category = await getCategory(id)

  if (!category) {
    notFound()
  }

  return (
    <CategoryForm
      initialData={{
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        color: category.color || DEFAULT_CATEGORY_COLOR,
        sort_order: category.sort_order,
        is_active: category.is_active,
      }}
      isEdit
    />
  )
}
