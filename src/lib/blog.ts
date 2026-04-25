import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'content/posts')

export interface BlogPost {
  slug: string
  title: string
  excerpt?: string
  featuredImage?: string
  author: string
  category?: string
  tags?: string[]
  publishedAt?: string
  published?: boolean
  body: string
  createdAt: string
}

export function getAllPosts(): BlogPost[] {
  // Ensure directory exists
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      // Get file stats for creation date
      const stats = fs.statSync(fullPath)

      return {
        slug,
        title: data.title || 'Untitled',
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        author: data.author || 'RevampIt Team',
        category: data.category,
        tags: data.tags || [],
        publishedAt: data.publishedAt,
        published: data.published !== false, // default to true if not specified
        body: content,
        createdAt: stats.birthtime.toISOString(),
      }
    })
    // Filter only published posts
    .filter((post) => post.published)
    // Sort by published date (newest first)
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(a.createdAt)
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })

  return allPostsData
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    const stats = fs.statSync(fullPath)

    return {
      slug,
      title: data.title || 'Untitled',
      excerpt: data.excerpt,
      featuredImage: data.featuredImage,
      author: data.author || 'RevampIt Team',
      category: data.category,
      tags: data.tags || [],
      publishedAt: data.publishedAt,
      published: data.published !== false,
      body: content,
      createdAt: stats.birthtime.toISOString(),
    }
  } catch (error) {
    return null
  }
}

