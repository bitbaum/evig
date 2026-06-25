import type { APIRequestContext } from '@playwright/test'
import { csrfPatch, csrfPost } from './api-csrf'

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

async function parseApi<T>(response: {
  ok: () => boolean
  json: () => Promise<unknown>
  status: () => number
  url: () => string
}): Promise<T> {
  const body = (await response.json()) as ApiEnvelope<T>
  if (!response.ok() || !body.success) {
    throw new Error(body.error || `API ${response.status()} ${response.url()}`)
  }
  return body.data as T
}

export interface BlogCreateResult {
  id: string
  slug: string
}

export interface BlogPostRow {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string | null
  is_published: boolean
  published_at: string | null
}

export function buildE2EBlogTitle(suffix = Date.now()): string {
  return `E2E Blog ${suffix}`
}

export function buildE2EBlogSlug(suffix = Date.now()): string {
  return `e2e-blog-${suffix}`
}

export function buildE2EBlogContent(): string {
  return 'Automatisierter E2E-Test: Blog-Artikel als Entwurf erstellt und veröffentlicht.'
}

export async function createBlogDraft(
  request: APIRequestContext,
  title: string,
  slug: string,
  content = buildE2EBlogContent(),
): Promise<BlogCreateResult> {
  const response = await csrfPost(request, '/api/admin/blog', {
    title,
    slug,
    content,
    excerpt: 'E2E Kurztext für den Blog-Artikel.',
    isPublished: false,
  })
  return parseApi<BlogCreateResult>(response)
}

export async function fetchBlogPost(
  request: APIRequestContext,
  postId: string,
): Promise<BlogPostRow> {
  const response = await request.get(`/api/admin/blog/${postId}`)
  return parseApi<BlogPostRow>(response)
}

export async function publishBlogPost(
  request: APIRequestContext,
  postId: string,
): Promise<void> {
  const response = await csrfPatch(request, `/api/admin/blog/${postId}`, {
    isPublished: true,
  })
  await parseApi(response)
}
