import type { APIRequestContext } from '@playwright/test'
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_TYPES } from '@/config/tasks'
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

export interface TaskCreatePayload {
  title: string
  description?: string | null
  task_type?: string
  category?: string
  priority?: string
}

export interface TaskRow {
  id: string
  title: string
  task_type: string
  category: string
  current_status: string
  is_completed: boolean
}

export interface TaskDetailResponse {
  task: TaskRow
  completions: Array<{
    id: string
    notes: string | null
    completed_by_name: string | null
  }>
}

export function buildE2ETaskTitle(suffix = Date.now()): string {
  return `E2E Task ${suffix}`
}

export async function createAdminTask(
  request: APIRequestContext,
  payload: TaskCreatePayload,
): Promise<TaskRow> {
  const response = await csrfPost(request, '/api/tasks', {
    title: payload.title,
    description: payload.description ?? 'Automatisierter E2E-Test',
    task_type: payload.task_type ?? TASK_TYPES.ONE_TIME,
    category: payload.category ?? TASK_CATEGORIES.OTHER,
    priority: payload.priority ?? TASK_PRIORITIES.NORMAL,
  })
  return parseApi<TaskRow>(response)
}

export async function fetchAdminTaskDetail(
  request: APIRequestContext,
  taskId: string,
): Promise<TaskDetailResponse> {
  const response = await request.get(`/api/tasks/${taskId}`)
  return parseApi<TaskDetailResponse>(response)
}

export async function completeAdminTask(
  request: APIRequestContext,
  taskId: string,
  notes = 'E2E erledigt',
): Promise<void> {
  const response = await csrfPost(request, `/api/tasks/${taskId}/complete`, { notes })
  await parseApi(response)
}

export async function archiveAdminTask(
  request: APIRequestContext,
  taskId: string,
): Promise<void> {
  const response = await csrfPatch(request, `/api/tasks/${taskId}`, { is_archived: true })
  await parseApi(response)
}
