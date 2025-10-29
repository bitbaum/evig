import { Suspense } from 'react'
import { getAllPosts } from '@/lib/blog'
import BlogContent from '@/components/blog/BlogContent'

export const metadata = {
  title: 'Blog | RevampIt',
  description: 'Nachhaltigkeit, Open Source und die Kunst, Technologie ein zweites Leben zu geben'
}

export default function BlogPage() {
  const allPosts = getAllPosts()

  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <BlogContent posts={allPosts} />
    </Suspense>
  )
}
