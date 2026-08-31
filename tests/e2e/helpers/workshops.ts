import type { APIRequestContext } from '@playwright/test';
import { WORKSHOP_INSTANCE_STATUS } from '@/config/workshops';
import { csrfPatch, csrfPost } from './api-csrf';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WorkshopWithInstances {
  slug: string;
  title: string;
  price_cents: number;
  instances: Array<WorkshopInstanceSummary>;
  user_registered?: boolean;
}

export interface WorkshopInstanceSummary {
  id: string;
  status: string;
  start_date: string;
  current_participants: number;
  max_participants: number;
}

async function parseApi<T>(response: {
  ok: () => boolean;
  json: () => Promise<unknown>;
  status: () => number;
  url: () => string;
}): Promise<T> {
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok() || !body.success) {
    throw new Error(body.error || `API ${response.status()} ${response.url()}`);
  }
  return body.data as T;
}

export async function listWorkshopsWithInstances(
  request: APIRequestContext,
): Promise<WorkshopWithInstances[]> {
  const response = await request.get('/api/workshops?include=instances&active=true');
  return parseApi<WorkshopWithInstances[]>(response);
}

/**
 * The instance the workshop page actually registers for. Must mirror the page
 * exactly (src/app/[locale]/workshops/[slug]/page.tsx): scheduled AND in the
 * future, ordered by start_date ascending, first one — regardless of capacity.
 * Asserting on any other instance is how this journey used to go flaky: the UI
 * registered the page's next instance while the test watched a past one.
 */
export function pickPageNextInstance(
  instances: WorkshopInstanceSummary[] | undefined,
): WorkshopInstanceSummary | null {
  const upcoming = (instances ?? [])
    .filter(
      (inst) =>
        inst.status === WORKSHOP_INSTANCE_STATUS.SCHEDULED &&
        new Date(inst.start_date) > new Date(),
    )
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  return upcoming[0] ?? null;
}

function pickWorkshopWithOpenNextInstance(
  workshops: WorkshopWithInstances[],
  matchesPrice: (priceCents: number) => boolean,
): WorkshopWithInstances | null {
  for (const workshop of workshops) {
    if (!matchesPrice(workshop.price_cents)) continue;
    const next = pickPageNextInstance(workshop.instances);
    if (next && next.current_participants < next.max_participants) return workshop;
  }
  return null;
}

export function pickFreeWorkshopWithCapacity(
  workshops: WorkshopWithInstances[],
): WorkshopWithInstances | null {
  return pickWorkshopWithOpenNextInstance(workshops, (price) => price <= 0);
}

export function pickPaidWorkshopWithCapacity(
  workshops: WorkshopWithInstances[],
): WorkshopWithInstances | null {
  return pickWorkshopWithOpenNextInstance(workshops, (price) => price > 0);
}

export async function registerForFreeWorkshop(
  request: APIRequestContext,
  workshopSlug: string,
): Promise<{ registrationId: string }> {
  const response = await csrfPost(request, '/api/workshops/register', { workshopSlug });
  const data = await parseApi<{ registrationId: string }>(response);
  if (!data.registrationId) throw new Error('registerForFreeWorkshop: missing registrationId');
  return { registrationId: data.registrationId };
}

export async function cancelWorkshopRegistration(
  request: APIRequestContext,
  registrationId: string,
): Promise<void> {
  const response = await csrfPatch(request, `/api/workshops/registrations/${registrationId}`, {});
  await parseApi(response);
}

export async function getRegistrationForInstance(
  request: APIRequestContext,
  instanceId: string,
): Promise<{ registered: boolean; registration?: { id: string } }> {
  const response = await request.get(`/api/workshops/registration/${instanceId}`);
  return parseApi(response);
}
