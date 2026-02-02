/**
 * Admin - New Blog Category Page
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import CategoryForm from '@/components/admin/CategoryForm'

export const metadata: Metadata = {
  title: 'Neue Kategorie | RevampIT Admin',
  description: 'Neue Blog-Kategorie erstellen.',
}

export default async function NewCategoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/categories/new')
  }

  return <CategoryForm />
}
