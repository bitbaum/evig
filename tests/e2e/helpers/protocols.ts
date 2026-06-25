import type { APIRequestContext } from '@playwright/test'
import { MEETING_TYPES, PROTOCOL_VISIBILITY } from '@/config/protocols'
import { PROTOCOL_STATUS } from '@/config/protocol-status'
import type { StructuredNotes } from '@/lib/schemas/protocols'
import { csrfPost } from './api-csrf'

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

export interface ProtocolCreateResult {
  id: string
}

export interface ProtocolRow {
  id: string
  title: string
  status: string
  meeting_type: string
  structured_notes: StructuredNotes | null
}

export function buildE2EProtocolTitle(suffix = Date.now()): string {
  return `E2E Protokoll ${suffix}`
}

export function buildE2EStructuredNotes(summary: string): StructuredNotes {
  return {
    summary,
    detected_attendees: [],
    topics: [
      {
        id: 'e2e-topic-1',
        title: 'E2E Teamsitzung',
        discussion: 'Automatisierter Test ohne KI — JSON-Import via process-notes.',
        outcome: 'Notiert',
      },
    ],
    action_items: [],
    follow_ups: [],
  }
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function createProtocol(
  request: APIRequestContext,
  title: string,
): Promise<ProtocolCreateResult> {
  const response = await csrfPost(request, '/api/protocols', {
    title,
    meeting_date: todayIsoDate(),
    meeting_type: MEETING_TYPES.AD_HOC,
    visibility: PROTOCOL_VISIBILITY.TEAM,
    input_method: 'notes',
    attendees: [],
  })
  return parseApi<ProtocolCreateResult>(response)
}

/** Import structured notes as JSON (SSOT path — no LLM required). */
export async function importProtocolStructuredNotes(
  request: APIRequestContext,
  protocolId: string,
  notes: StructuredNotes,
): Promise<{ processed: boolean; source?: string }> {
  const response = await csrfPost(request, `/api/protocols/${protocolId}/process-notes`, {
    content: JSON.stringify(notes),
  })
  return parseApi<{ processed: boolean; source?: string }>(response)
}

export async function fetchProtocol(
  request: APIRequestContext,
  protocolId: string,
): Promise<ProtocolRow> {
  const response = await request.get(`/api/protocols/${protocolId}`)
  return parseApi<ProtocolRow>(response)
}

export async function finalizeProtocol(
  request: APIRequestContext,
  protocolId: string,
): Promise<void> {
  const response = await csrfPost(request, `/api/protocols/${protocolId}/finalize`, {})
  await parseApi(response)
}

export async function tryFinalizeProtocol(
  request: APIRequestContext,
  protocolId: string,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const response = await csrfPost(request, `/api/protocols/${protocolId}/finalize`, {})
  const body = (await response.json()) as ApiEnvelope<unknown>
  return {
    ok: response.ok() && body.success === true,
    status: response.status(),
    error: body.error,
  }
}

export { PROTOCOL_STATUS }
