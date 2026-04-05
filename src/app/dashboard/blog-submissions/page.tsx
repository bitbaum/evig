import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import BlogSubmissionsClient from './BlogSubmissionsClient'

export const metadata: Metadata = {
  title: 'Meine Einreichungen | RevampIT',
  description: 'Status Ihrer eingereichten Blog-Beiträge einsehen und überarbeiten.',
}

export default async function BlogSubmissionsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard/blog-submissions')
  }

  return <BlogSubmissionsClient />
}
