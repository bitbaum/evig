/**
 * Deliverables domain service (SoC: business logic, no HTTP/JSX).
 *
 * Shared by the admin API, the public share endpoints, the agent-brief
 * endpoint, and the server-component pages — one place owns the queries so the
 * shapes never drift.
 */

import { randomUUID } from 'node:crypto'
import { db } from '@/db'
import { deliverables, deliverableFeedback } from '@/db/schema/deliverables'
import { users } from '@/db/schema/auth'
import { tasks } from '@/db/schema/tasks'
import { and, eq, desc, sql, type SQL } from 'drizzle-orm'
import { TABLE_NAMES } from '@/config/database'
import {
  FEEDBACK_KINDS,
  FEEDBACK_STATUSES,
  FEEDBACK_KIND_LABELS,
  DELIVERABLE_STATUSES,
  type FeedbackKind,
} from '@/config/deliverables'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'
import { createNotification } from '@/lib/services/notifications'
import { sendCustomEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/utils/escape-html'
import { APP_URL } from '@/config/urls'
import { logger } from '@/lib/logger'
import { EMAIL_INLINE_COLORS } from '@/config/ui-colors'
import type {
  DeliverableListItem,
  DeliverableDetail,
  FeedbackItem,
} from '@/lib/schemas/deliverables'

/** Correlated count of OPEN change requests — the "needs your attention" badge. */
const openChangeRequestCount = sql<number>`(
  SELECT COUNT(*)::int FROM ${sql.raw(TABLE_NAMES.DELIVERABLE_FEEDBACK)} f
  WHERE f.deliverable_id = ${deliverables.id}
    AND f.status = ${FEEDBACK_STATUSES.OPEN}
    AND f.kind = ${FEEDBACK_KINDS.CHANGE_REQUEST}
)`

export async function listDeliverables(filters: {
  type?: string
  status?: string
  ownerUserId?: string
} = {}): Promise<DeliverableListItem[]> {
  const conditions: SQL[] = []
  if (filters.type) conditions.push(eq(deliverables.type, filters.type))
  if (filters.status) conditions.push(eq(deliverables.status, filters.status))
  if (filters.ownerUserId) conditions.push(eq(deliverables.ownerUserId, filters.ownerUserId))

  const rows = await db
    .select({
      id: deliverables.id,
      title: deliverables.title,
      description: deliverables.description,
      type: deliverables.type,
      status: deliverables.status,
      visibility: deliverables.visibility,
      url: deliverables.url,
      current_version: deliverables.currentVersion,
      owner_name: users.name,
      open_feedback_count: openChangeRequestCount,
      created_at: deliverables.createdAt,
      updated_at: deliverables.updatedAt,
    })
    .from(deliverables)
    .leftJoin(users, eq(deliverables.ownerUserId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(deliverables.updatedAt))

  return rows as DeliverableListItem[]
}

async function selectDetail(where: SQL): Promise<DeliverableDetail | null> {
  const rows = await db
    .select({
      id: deliverables.id,
      title: deliverables.title,
      description: deliverables.description,
      type: deliverables.type,
      status: deliverables.status,
      visibility: deliverables.visibility,
      url: deliverables.url,
      source_path: deliverables.sourcePath,
      task_id: deliverables.taskId,
      task_title: tasks.title,
      share_token: deliverables.shareToken,
      current_version: deliverables.currentVersion,
      files: deliverables.files,
      delivered_at: deliverables.deliveredAt,
      owner_user_id: deliverables.ownerUserId,
      owner_name: users.name,
      owner_email: users.email,
      created_at: deliverables.createdAt,
      updated_at: deliverables.updatedAt,
    })
    .from(deliverables)
    .leftJoin(users, eq(deliverables.ownerUserId, users.id))
    .leftJoin(tasks, eq(deliverables.taskId, tasks.id))
    .where(where)
    .limit(1)

  return (rows[0] as DeliverableDetail) ?? null
}

export function getDeliverable(id: string): Promise<DeliverableDetail | null> {
  return selectDetail(eq(deliverables.id, id))
}

export function getDeliverableByToken(token: string): Promise<DeliverableDetail | null> {
  return selectDetail(eq(deliverables.shareToken, token))
}

export async function getFeedback(deliverableId: string): Promise<FeedbackItem[]> {
  const rows = await db
    .select({
      id: deliverableFeedback.id,
      kind: deliverableFeedback.kind,
      status: deliverableFeedback.status,
      target: deliverableFeedback.target,
      body: deliverableFeedback.body,
      author_user_id: deliverableFeedback.authorUserId,
      // Prefer the account name; fall back to the external reviewer's typed name.
      author_name: sql<string | null>`COALESCE(${users.name}, ${deliverableFeedback.authorName})`,
      created_at: deliverableFeedback.createdAt,
    })
    .from(deliverableFeedback)
    .leftJoin(users, eq(deliverableFeedback.authorUserId, users.id))
    .where(eq(deliverableFeedback.deliverableId, deliverableId))
    .orderBy(desc(deliverableFeedback.createdAt))

  return rows as FeedbackItem[]
}

export async function createDeliverable(
  ownerUserId: string,
  input: {
    title: string
    description?: string | null
    type: string
    url?: string | null
    source_path?: string | null
    task_id?: string | null
    visibility: string
    status: string
  },
) {
  const [row] = await db
    .insert(deliverables)
    .values({
      ownerUserId,
      title: input.title,
      description: input.description ?? null,
      type: input.type,
      url: input.url ?? null,
      sourcePath: input.source_path ?? null,
      taskId: input.task_id ?? null,
      visibility: input.visibility,
      status: input.status,
    })
    .returning()
  return row
}

/** Map snake_case update input to columns; only touch provided keys. */
export async function updateDeliverable(
  id: string,
  input: Record<string, unknown>,
) {
  const fieldMap: Record<string, string> = {
    title: 'title',
    description: 'description',
    type: 'type',
    url: 'url',
    source_path: 'sourcePath',
    task_id: 'taskId',
    visibility: 'visibility',
    status: 'status',
    current_version: 'currentVersion',
  }

  const set: Record<string, unknown> = {}
  for (const [snake, camel] of Object.entries(fieldMap)) {
    if (snake in input) set[camel] = input[snake] ?? null
  }
  if (Object.keys(set).length === 0) return getDeliverable(id)

  // Reaching APPROVED stamps the delivery time once.
  if (set.status === DELIVERABLE_STATUSES.APPROVED) {
    set.deliveredAt = sql`NOW()`
  }
  set.updatedAt = sql`NOW()`

  await db.update(deliverables).set(set).where(eq(deliverables.id, id))
  return getDeliverable(id)
}

export async function deleteDeliverable(id: string): Promise<boolean> {
  const [row] = await db
    .delete(deliverables)
    .where(eq(deliverables.id, id))
    .returning({ id: deliverables.id })
  return !!row
}

/** Generate a share token if one doesn't exist yet; returns the token. */
export async function ensureShareToken(id: string): Promise<string | null> {
  const current = await getDeliverable(id)
  if (!current) return null
  if (current.share_token) return current.share_token

  const token = randomUUID().replace(/-/g, '')
  await db
    .update(deliverables)
    .set({ shareToken: token, updatedAt: sql`NOW()` })
    .where(eq(deliverables.id, id))
  return token
}

/**
 * Add a feedback item and notify the owner (in-app bell). External reviewers
 * pass authorName (no authorUserId). We never notify the owner about their own
 * comment.
 */
export async function addFeedback(
  deliverableId: string,
  input: {
    kind: string
    body: string
    target?: string | null
    authorUserId?: string | null
    authorName?: string | null
  },
) {
  const [row] = await db
    .insert(deliverableFeedback)
    .values({
      deliverableId,
      kind: input.kind,
      body: input.body,
      target: input.target ?? null,
      authorUserId: input.authorUserId ?? null,
      authorName: input.authorName ?? null,
      status: FEEDBACK_STATUSES.OPEN,
    })
    .returning()

  // Notify the owner — unless they authored the feedback themselves.
  const deliverable = await getDeliverable(deliverableId)
  if (deliverable && deliverable.owner_user_id !== input.authorUserId) {
    const who = input.authorName ?? deliverable.owner_name ?? 'Jemand'
    // 1) In-app bell — the durable channel (never silently dropped).
    createNotification(
      deliverable.owner_user_id,
      {
        type: NOTIFICATION_TYPES.DELIVERABLE_FEEDBACK,
        title: `Neues Feedback: ${deliverable.title}`,
        content: `${who}: ${input.body.slice(0, 140)}`,
        related_type: RELATED_TYPES.DELIVERABLE,
        related_id: deliverableId,
      },
      // Dedicated styled email is sent separately below → bell only here.
      { skipEmail: true },
    ).catch((error) => logger.error('Deliverable feedback notification failed', { error, deliverableId }))

    // 2) Dedicated email to the owner — best-effort, result checked.
    void sendFeedbackEmail(deliverable, who, input).catch((error) =>
      logger.warn('Deliverable feedback email error', { error, deliverableId }),
    )
  }

  return row
}

/** Email the deliverable owner about new feedback, with a link to the review hub. */
async function sendFeedbackEmail(
  deliverable: DeliverableDetail,
  who: string,
  input: { kind: string; body: string; target?: string | null },
): Promise<void> {
  if (!deliverable.owner_email) return

  const kindLabel = FEEDBACK_KIND_LABELS[input.kind as FeedbackKind] ?? input.kind
  const link = `${APP_URL}/admin/deliverables/${deliverable.id}`
  const targetLine = input.target ? `<p><strong>Betrifft:</strong> ${escapeHtml(input.target)}</p>` : ''

  const res = await sendCustomEmail(deliverable.owner_email, {
    subject: `Neues Feedback (${kindLabel}): ${deliverable.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2>Neues Feedback zu «${escapeHtml(deliverable.title)}»</h2>
        <p><strong>Von:</strong> ${escapeHtml(who)}</p>
        <p><strong>Art:</strong> ${escapeHtml(kindLabel)}</p>
        ${targetLine}
        <div style="white-space: pre-wrap; padding: 16px; background: ${EMAIL_INLINE_COLORS.mutedBlockBg}; border-radius: 8px;">${escapeHtml(input.body)}</div>
        <p style="margin-top: 16px;"><a href="${link}">Im Review-Bereich öffnen</a></p>
      </div>
    `,
    text: `Neues Feedback zu «${deliverable.title}»\n\nVon: ${who}\nArt: ${kindLabel}${input.target ? `\nBetrifft: ${input.target}` : ''}\n\n${input.body}\n\nÖffnen: ${link}`,
  })
  if (!res?.success) {
    logger.warn('Deliverable feedback email not delivered', { deliverableId: deliverable.id })
  }
}

export async function updateFeedbackStatus(
  deliverableId: string,
  feedbackId: string,
  status: string,
): Promise<boolean> {
  const [row] = await db
    .update(deliverableFeedback)
    .set({ status })
    .where(and(eq(deliverableFeedback.id, feedbackId), eq(deliverableFeedback.deliverableId, deliverableId)))
    .returning({ id: deliverableFeedback.id })
  return !!row
}

/**
 * The agent brief (§4.8): exactly what an agent needs to iterate — WHAT to
 * change (open change_requests), WHERE (source_path), and CONTEXT (meta).
 * Returns a ready-to-run prompt plus the structured pieces.
 */
export async function buildAgentBrief(id: string) {
  const deliverable = await getDeliverable(id)
  if (!deliverable) return null

  const feedback = await getFeedback(id)
  const openChangeRequests = feedback.filter(
    (f) => f.kind === FEEDBACK_KINDS.CHANGE_REQUEST && f.status === FEEDBACK_STATUSES.OPEN,
  )
  const openComments = feedback.filter(
    (f) => f.kind === FEEDBACK_KINDS.COMMENT && f.status === FEEDBACK_STATUSES.OPEN,
  )

  const changeLines = openChangeRequests.length
    ? openChangeRequests
        .map((f, i) => `${i + 1}. ${f.target ? `[${f.target}] ` : ''}${f.body}`)
        .join('\n')
    : '(keine offenen Änderungswünsche)'

  const commentLines = openComments.length
    ? openComments.map((f) => `- ${f.body}`).join('\n')
    : ''

  const prompt = [
    `Du überarbeitest das Deliverable „${deliverable.title}“ (${deliverable.type}).`,
    deliverable.description ? `\nKontext: ${deliverable.description}` : '',
    deliverable.source_path
      ? `\nDie bearbeitbare Quelle liegt im Git-Ordner: ${deliverable.source_path}`
      : '\nHinweis: Für dieses Deliverable ist kein source_path hinterlegt.',
    `\nAktuelle Version: v${deliverable.current_version}`,
    `\n\nUmzusetzende Änderungswünsche:\n${changeLines}`,
    commentLines ? `\n\nWeitere Kommentare:\n${commentLines}` : '',
    `\n\nBearbeite die Dateien in ${deliverable.source_path ?? '(source_path fehlt)'}, committe die neue Version und setze den Status danach zurück auf „In Prüfung“.`,
  ].join('')

  return {
    prompt,
    deliverable: {
      id: deliverable.id,
      title: deliverable.title,
      type: deliverable.type,
      description: deliverable.description,
      source_path: deliverable.source_path,
      current_version: deliverable.current_version,
    },
    open_change_requests: openChangeRequests,
    open_comments: openComments,
  }
}
