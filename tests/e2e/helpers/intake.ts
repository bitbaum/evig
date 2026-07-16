import type { APIRequestContext } from '@playwright/test'
import {
  getChecklistForDevice,
  INTAKE_TIERS,
  type IntakeTier,
} from '@/config/intake-checklist'
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

export interface IntakeCreatePayload {
  hersteller: string
  produktname: string
  kurzbeschreibung?: string
  verkaufspreis?: number
  zustand: string
  hauptkategorie?: string
  unterkategorie?: string
  intake_tier: IntakeTier
  is_donation?: boolean
}

export interface IntakeCreateResult {
  inventory_id: string
  item_uuid: string
  product_id: string
}

export interface IntakeDetail {
  id: string
  checklist_complete: boolean
  marketplace_status: string
  product_name: string
  brand: string
  intake_tier: IntakeTier
  category: string | null
  checklist_progress?: { completed: number; total: number; required: number }
}

export async function createIntakeItem(
  request: APIRequestContext,
  payload: IntakeCreatePayload,
): Promise<IntakeCreateResult> {
  const response = await csrfPost(request, '/api/admin/intake', payload)
  return parseApi<IntakeCreateResult>(response)
}

export async function fetchIntakeDetail(
  request: APIRequestContext,
  inventoryId: string,
): Promise<IntakeDetail> {
  const response = await request.get(`/api/admin/intake/${inventoryId}`)
  return parseApi<IntakeDetail>(response)
}

/** Set a verdict (pass/fail/na; null = reset) on a checklist item. */
export async function setIntakeChecklistVerdict(
  request: APIRequestContext,
  inventoryId: string,
  itemId: string,
  result: 'pass' | 'fail' | 'na' | null = 'pass',
  notes?: string,
): Promise<{ checklist_complete: boolean }> {
  const response = await csrfPatch(request, `/api/admin/intake/${inventoryId}/checklist`, {
    item_id: itemId,
    result,
    ...(notes !== undefined ? { notes } : {}),
  })
  return parseApi<{ checklist_complete: boolean }>(response)
}

/**
 * Mark every required checklist item as passed for the device's tier +
 * category. Items with the Vier-Augen flag (final QA) are signed off with an
 * explicit override note — the journey runs with a single staff account, and
 * the documented-override path is exactly what a solo shift uses.
 */
export async function completeRequiredIntakeChecklist(
  request: APIRequestContext,
  inventoryId: string,
  tier: IntakeTier = INTAKE_TIERS.RECYCLE,
  category?: string | null,
): Promise<void> {
  const detail = await fetchIntakeDetail(request, inventoryId)
  const cat = category ?? detail.category
  const requiredItems = getChecklistForDevice(tier, cat ?? undefined).filter(item => item.required)

  // Second-person items last — the rule looks at the other completed work.
  const ordered = [
    ...requiredItems.filter(i => !i.requiresSecondPerson),
    ...requiredItems.filter(i => i.requiresSecondPerson),
  ]
  for (const item of ordered) {
    await setIntakeChecklistVerdict(
      request,
      inventoryId,
      item.id,
      'pass',
      item.requiresSecondPerson ? 'E2E: Vier-Augen-Override (Testlauf, allein im Dienst)' : undefined,
    )
  }
}

/** Like setIntakeChecklistVerdict but never throws — returns the raw outcome. */
export async function trySetIntakeChecklistVerdict(
  request: APIRequestContext,
  inventoryId: string,
  itemId: string,
  result: 'pass' | 'fail' | 'na' | null,
  notes?: string,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const response = await csrfPatch(request, `/api/admin/intake/${inventoryId}/checklist`, {
    item_id: itemId,
    result,
    ...(notes !== undefined ? { notes } : {}),
  })
  const body = (await response.json()) as ApiEnvelope<unknown>
  return {
    ok: response.ok() && body.success === true,
    status: response.status(),
    error: body.error,
  }
}

export async function publishIntakeItem(
  request: APIRequestContext,
  inventoryId: string,
  options: { price_chf: number; title?: string; description?: string },
): Promise<{ published: boolean; price_chf: number }> {
  const response = await csrfPost(request, `/api/admin/intake/${inventoryId}/publish`, options)
  return parseApi<{ published: boolean; price_chf: number }>(response)
}

export async function tryPublishIntakeItem(
  request: APIRequestContext,
  inventoryId: string,
  priceChf = 0,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const response = await csrfPost(request, `/api/admin/intake/${inventoryId}/publish`, {
    price_chf: priceChf,
  })
  const body = (await response.json()) as ApiEnvelope<unknown>
  return {
    ok: response.ok() && body.success === true,
    status: response.status(),
    error: body.error,
  }
}

export function buildE2EIntakeProductName(suffix = Date.now()): string {
  return `E2E Intake ${suffix}`
}
