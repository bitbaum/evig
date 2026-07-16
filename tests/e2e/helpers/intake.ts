import type { APIRequestContext } from '@playwright/test'
import {
  CHECKLIST_RESULTS,
  getChecklistForDevice,
  INTAKE_TIERS,
  type ChecklistResult,
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

/** Set a verdict (pass/fail/na; null resets to open) on a checklist item. */
export async function setIntakeChecklistVerdict(
  request: APIRequestContext,
  inventoryId: string,
  itemId: string,
  result: ChecklistResult | null = CHECKLIST_RESULTS.PASS,
  notes = '',
): Promise<{ checklist_complete: boolean }> {
  const response = await csrfPatch(request, `/api/admin/intake/${inventoryId}/checklist`, {
    item_id: itemId,
    result,
    notes,
  })
  return parseApi<{ checklist_complete: boolean }>(response)
}

/** Non-throwing verdict attempt — for asserting the Vier-Augen 400. */
export async function trySetIntakeChecklistVerdict(
  request: APIRequestContext,
  inventoryId: string,
  itemId: string,
  result: ChecklistResult | null = CHECKLIST_RESULTS.PASS,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const response = await csrfPatch(request, `/api/admin/intake/${inventoryId}/checklist`, {
    item_id: itemId,
    result,
    notes: '',
  })
  const body = (await response.json()) as ApiEnvelope<unknown>
  return {
    ok: response.ok() && body.success === true,
    status: response.status(),
    error: body.error,
  }
}

/**
 * Mark every required checklist item passed for the device's tier + category.
 *
 * Items flagged `requiresSecondPerson` (final QA, Vier-Augen-Prinzip) cannot
 * be signed off by the account that did all other work — pass a second staff
 * request context for those; they are signed off last.
 */
export async function completeRequiredIntakeChecklist(
  request: APIRequestContext,
  inventoryId: string,
  tier: IntakeTier = INTAKE_TIERS.RECYCLE,
  category?: string | null,
  secondPersonRequest?: APIRequestContext,
): Promise<void> {
  const detail = await fetchIntakeDetail(request, inventoryId)
  const cat = category ?? detail.category
  const requiredItems = getChecklistForDevice(tier, cat ?? undefined).filter(item => item.required)
  const ordinary = requiredItems.filter(item => !item.requiresSecondPerson)
  const fourEyes = requiredItems.filter(item => item.requiresSecondPerson)

  for (const item of ordinary) {
    await setIntakeChecklistVerdict(request, inventoryId, item.id)
  }
  for (const item of fourEyes) {
    if (!secondPersonRequest) {
      throw new Error(
        `Checklist item "${item.id}" requires a second staff account (Vier-Augen-Prinzip) — pass secondPersonRequest`,
      )
    }
    await setIntakeChecklistVerdict(secondPersonRequest, inventoryId, item.id)
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
