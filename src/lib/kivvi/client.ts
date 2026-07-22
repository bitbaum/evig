/**
 * Kivvi ERP API client for RevampIT.
 *
 * RevampIT calls this module after erfassung to push inventory records to
 * Kivvi, where they become the canonical ERP entries (accounting, stock,
 * documents). The Kivvi API token is scoped to the RevampIT company account.
 *
 * Configuration (add to .env):
 *   KIVVI_API_URL=https://kivvi.orangecat.ch
 *   KIVVI_API_TOKEN=kv_...
 *
 * All calls are server-side only. Never import this in client components.
 */

// ============================================================================
// CONFIG
// ============================================================================

function getConfig(): { baseUrl: string; token: string } {
  const baseUrl = process.env.KIVVI_API_URL;
  const token = process.env.KIVVI_API_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      "Kivvi integration not configured. Set KIVVI_API_URL and KIVVI_API_TOKEN in .env",
    );
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), token };
}

function isConfigured(): boolean {
  return !!(process.env.KIVVI_API_URL && process.env.KIVVI_API_TOKEN);
}

/**
 * Public config check so callers outside syncToKivvi (e.g. the admin edit-sync
 * path) can skip silently when Kivvi is not configured, instead of flagging
 * every edit as a sync error in development.
 */
export function isKivviConfigured(): boolean {
  return isConfigured();
}

function getDefaultWarehouseId(): string | undefined {
  return process.env.KIVVI_DEFAULT_WAREHOUSE_ID || undefined;
}

// ============================================================================
// TYPES — mirror Kivvi API shapes (subset we actually use)
// ============================================================================

export interface KivviInventoryItem {
  id: string;
  itemNumber: string;
  description: string;
  condition: string;
  status: string;
  warehouseId: string | null;
  askingPrice: string | null;
  estimatedValue: string | null;
  minPrice: string | null;
  specs: Record<string, string> | null;
  serialNumber: string | null;
  location: string | null;
  createdAt: string;
}

export interface CreateKivviInventoryItemInput {
  description: string;
  condition?:
    | "untested"
    | "like_new"
    | "good"
    | "fair"
    | "poor"
    | "parts_only"
    | "scrap";
  warehouseId?: string;
  estimatedValue?: string;
  askingPrice?: string;
  minPrice?: string;
  specs?: Record<string, string>;
  serialNumber?: string;
  location?: string;
  notes?: string;
}

export interface KivviDocument {
  id: string;
  number: string;
  type: string;
  status: string;
  total: string;
  currency: string;
}

export interface CreateKivviInvoiceInput {
  contactName: string;
  contactEmail?: string;
  items: Array<{
    description: string;
    kivviInventoryItemId?: string;
    quantity: string; // Kivvi uses decimal strings for all financial values
    unitPrice: string;
    vatRate?: string;
  }>;
  notes?: string;
}

// ============================================================================
// CONDITION MAPPING — RevampIT zustand → Kivvi ITEM_CONDITION enum
// ============================================================================

type KivviCondition = NonNullable<CreateKivviInventoryItemInput["condition"]>;

/**
 * RevampIT's condition vocabulary (ZUSTAND_OPTIONS: new/like_new/good/fair/poor/
 * defect + aliases) does not match Kivvi's enum (untested/like_new/good/fair/
 * poor/parts_only/scrap). Without this map a brand-new ('new') or defective
 * ('defect') item is rejected by Kivvi's z.enum with HTTP 400 and never syncs
 * (it lands in kivviSyncStatus='error' with no retry). Unknown values fall back
 * to Kivvi's own default, 'untested'.
 */
const CONDITION_TO_KIVVI: Readonly<Record<string, KivviCondition>> = {
  new: "like_new",
  like_new: "like_new",
  excellent: "like_new",
  very_good: "like_new",
  good: "good",
  fair: "fair",
  acceptable: "fair",
  poor: "poor",
  defect: "parts_only",
  defective: "parts_only",
  damaged: "parts_only",
  parts_only: "parts_only",
  scrap: "scrap",
  untested: "untested",
};

export function mapConditionToKivvi(condition?: string | null): KivviCondition {
  if (!condition) return "untested";
  return CONDITION_TO_KIVVI[condition.toLowerCase().trim()] ?? "untested";
}

/**
 * Reverse direction — Kivvi ITEM_CONDITION enum → RevampIT's condition_override
 * vocabulary. Used by the inbound Kivvi webhook receiver to write a valid local
 * grade. RevampIT's inventory_items.condition_override only accepts
 * new/like_new/good/fair/poor/damaged (DB CHECK), so Kivvi's parts_only/scrap
 * collapse to 'damaged' and its 'untested' (no local equivalent) falls back to
 * the neutral 'fair'. Symmetric with mapConditionToKivvi where it can be.
 */
const CONDITION_FROM_KIVVI: Readonly<Record<KivviCondition, string>> = {
  untested: "fair",
  like_new: "like_new",
  good: "good",
  fair: "fair",
  poor: "poor",
  parts_only: "damaged",
  scrap: "damaged",
};

export function mapConditionFromKivvi(condition?: string | null): string {
  if (!condition) return "fair";
  return CONDITION_FROM_KIVVI[condition.toLowerCase().trim() as KivviCondition] ?? "fair";
}

// ============================================================================
// HTTP HELPER
// ============================================================================

async function kivviFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { baseUrl, token } = getConfig();

  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const json = (await response.json()) as { success: boolean; data?: T; error?: string };

  if (!json.success || !response.ok) {
    throw new Error(
      `Kivvi API error (${response.status}): ${json.error || "Unknown error"}`,
    );
  }

  return json.data as T;
}

// ============================================================================
// INVENTORY ITEMS
// ============================================================================

/**
 * Create a canonical inventory item in Kivvi after RevampIT erfassung.
 * Returns the Kivvi item ID to store on RevampIT's inventoryItems record.
 */
export async function createKivviInventoryItem(
  input: CreateKivviInventoryItemInput,
): Promise<KivviInventoryItem> {
  return kivviFetch<KivviInventoryItem>("/inventory-items", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Update an existing Kivvi inventory item — e.g. when checklist passes
 * and status changes from intake → ready_for_sale, or when sold.
 */
export async function updateKivviInventoryItem(
  kivviId: string,
  input: Partial<CreateKivviInventoryItemInput> & { status?: string },
  // Optional idempotency key (RevampIT item id + updatedAt) so Kivvi can
  // de-duplicate retries of the same forward edit-sync push. Kivvi's PATCH is
  // an idempotent upsert regardless, but the key makes retries provably safe.
  idempotencyKey?: string,
): Promise<KivviInventoryItem> {
  return kivviFetch<KivviInventoryItem>(`/inventory-items/${kivviId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    ...(idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : {}),
  });
}

/**
 * Get a Kivvi inventory item by ID.
 */
export async function getKivviInventoryItem(
  kivviId: string,
): Promise<KivviInventoryItem> {
  return kivviFetch<KivviInventoryItem>(`/inventory-items/${kivviId}`);
}

// ============================================================================
// DOCUMENTS (Invoice creation after sale)
// ============================================================================

/**
 * Create a sales invoice in Kivvi when a RevampIT order is confirmed.
 * Returns the Kivvi document with its RE- number for sending to the buyer.
 */
export async function createKivviInvoice(
  input: CreateKivviInvoiceInput,
): Promise<KivviDocument> {
  return kivviFetch<KivviDocument>("/documents", {
    method: "POST",
    body: JSON.stringify({
      type: "invoice",
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      notes: input.notes,
      // Kivvi's documentItemSchema expects `inventoryItemId`. RevampIT names it
      // kivviInventoryItemId internally, so rename here — otherwise zod strips
      // the unknown key and the invoice line is never linked to the item.
      items: input.items.map(({ kivviInventoryItemId, ...rest }) => ({
        ...rest,
        ...(kivviInventoryItemId ? { inventoryItemId: kivviInventoryItemId } : {}),
      })),
    }),
  });
}

// ============================================================================
// DOCUMENT STATUS TRANSITIONS
// ============================================================================

/**
 * Transition a Kivvi document to a new status (e.g. "sent", "paid").
 * Use this after creating an invoice to trigger GL entries ("sent") and
 * to close the accounting loop after payment is confirmed.
 */
export async function updateKivviDocumentStatus(
  kivviDocumentId: string,
  status: string,
): Promise<KivviDocument> {
  return kivviFetch<KivviDocument>(`/documents/${kivviDocumentId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export interface RecordKivviPaymentInput {
  amount: string;
  date: string; // YYYY-MM-DD
  method?: "bank_transfer" | "cash" | "card" | "other";
  reference?: string;
}

/** P2P marketplace agency sale — books pass-through liability + commission only. */
export interface RecordKivviAgencySaleInput {
  orderReference: string;
  date: string; // YYYY-MM-DD
  grossAmount: string;
  commissionAmount: string;
  commissionVatAmount: string;
  sellerPayout?: string;
  sourceId: string;
  description?: string;
}

export interface KivviJournalEntryRef {
  journalEntryId: string;
  reference: string;
  sourceType: string;
}

/**
 * Record a payment against a Kivvi invoice.
 * The invoice must already be in "sent" or "partially_paid" status.
 * This creates the GL entry: Debit 1020 (Bank) / Credit 1100 (AR).
 */
export async function recordKivviPayment(
  kivviDocumentId: string,
  input: RecordKivviPaymentInput,
): Promise<{ id: string }> {
  return kivviFetch<{ id: string }>(`/documents/${kivviDocumentId}/payments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ============================================================================
// MARKETPLACE AGENCY (P2P pass-through economics)
// ============================================================================

/**
 * Book a facilitated (P2P) marketplace sale in Kivvi — agency model only.
 * No invoice, no inventory mark-sold. Idempotency key required for Payrexx retries.
 */
export async function recordKivviAgencySale(
  input: RecordKivviAgencySaleInput,
  idempotencyKey: string,
): Promise<KivviJournalEntryRef> {
  return kivviFetch<KivviJournalEntryRef>("/marketplace/agency-sales", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export interface RecordKivviPayoutInput {
  amount: string;
  date: string; // YYYY-MM-DD
  reference: string;
  description?: string;
}

/**
 * Settle a P2P seller payable (Dr 2140 / Cr 1020) when escrow is released.
 * Idempotency key required — use `marketplace-order:{orderId}:payout`.
 */
export async function recordKivviPayout(
  input: RecordKivviPayoutInput,
  idempotencyKey: string,
): Promise<KivviJournalEntryRef> {
  return kivviFetch<KivviJournalEntryRef>("/marketplace/payouts", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

// ============================================================================
// SYNC HELPER — safe wrapper with error handling for use in erfassung flow
// ============================================================================

export type KivviSyncResult =
  | { success: true; kivviInventoryItemId: string; itemNumber: string }
  | { success: false; error: string };

/**
 * Push an erfassung result to Kivvi. Never throws — returns success/error.
 * If Kivvi is not configured (KIVVI_API_URL/TOKEN not set), returns success: false
 * without logging an error (allows development without Kivvi configured).
 */
export async function syncToKivvi(
  input: CreateKivviInventoryItemInput,
): Promise<KivviSyncResult> {
  if (!isConfigured()) {
    return { success: false, error: "Kivvi not configured" };
  }

  try {
    const warehouseId = getDefaultWarehouseId();
    const item = await createKivviInventoryItem(
      warehouseId && !input.warehouseId ? { ...input, warehouseId } : input,
    );
    return { success: true, kivviInventoryItemId: item.id, itemNumber: item.itemNumber };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Kivvi sync failed",
    };
  }
}
