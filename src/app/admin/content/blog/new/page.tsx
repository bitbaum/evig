/**
 * Admin: Create New Blog Post
 *
 * Form to create a new blog post.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { BlogPostForm } from '@/components/admin/BlogPostForm'
import { canAccessSection, toStaffUser } from '@/lib/permissions'

export const metadata: Metadata = {
  title: 'Neuer Artikel',
  description: 'Neuen Blog-Artikel erstellen.',
}

export default async function NewBlogPostPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/content/blog/new')
  }
  if (!canAccessSection(toStaffUser(session.user), 'content')) {
    redirect('/?error=no_admin_access')
  }

  return <BlogPostForm />
}
