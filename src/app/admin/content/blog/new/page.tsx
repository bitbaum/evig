/**
 * Admin: Create New Blog Post
 *
 * Form to create a new blog post.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { BlogPostForm } from '@/components/admin/BlogPostForm'

export const metadata: Metadata = {
  title: 'Neuer Artikel | RevampIT Admin',
  description: 'Neuen Blog-Artikel erstellen.',
}

export default async function NewBlogPostPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/blog/new')
  }

  return <BlogPostForm />
}
