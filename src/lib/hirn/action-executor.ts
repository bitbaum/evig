import { z } from 'zod'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { MEDUSA_CONFIG } from '@/config/medusa'
import { createTaskSchema } from '@/lib/schemas/tasks'
import { createDecisionSchema } from '@/lib/schemas/decisions'
import { createProtocolSchema } from '@/lib/schemas/protocols'
import { createDecision } from '@/lib/services/decisions'
import { createProtocol } from '@/lib/services/protocols'
import { logger } from '@/lib/logger'
import {
  type ExecuteActionInput,
  isRiskyAction,
} from './action-executor-contracts'

export async function executeHirnAction(input: ExecuteActionInput, dbUserId: string) {
  if (isRiskyAction(input.actionType) && input.dryRun) {
    return {
      mode: 'dry-run' as const,
      preview: buildPreview(input.actionType, input.payload),
      suggestedNextStep: 'Wenn alles passt, klick uf «Jetzt usfüehre».',
    }
  }

  switch (input.actionType) {
    case 'create_task': {
      const parsed = createTaskSchema.safeParse(input.payload)
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Ungültigi Task-Date')
      }

      const result = await query<{ id: string; title: string }>(
        `INSERT INTO ${TABLE_NAMES.TASKS} (
          title, description, instructions, task_type, schedule_cron, schedule_human,
          category, tags, priority, estimated_minutes, project_id, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING id, title`,
        [
          parsed.data.title,
          parsed.data.description || null,
          parsed.data.instructions || null,
          parsed.data.task_type,
          parsed.data.schedule_cron || null,
          parsed.data.schedule_human || null,
          parsed.data.category,
          parsed.data.tags || [],
          parsed.data.priority,
          parsed.data.estimated_minutes || null,
          parsed.data.project_id || null,
          dbUserId,
        ]
      )
      const task = result.rows[0]
      return {
        mode: 'executed' as const,
        entity: { type: 'task', id: task.id, title: task.title, link: `/admin/tasks/${task.id}` },
        suggestedNextStep: 'Wötsch grad Verantwortlichi oder Fälligkeit ergänze?',
      }
    }

    case 'create_decision_draft': {
      const parsed = createDecisionSchema.safeParse(input.payload)
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Ungültigi Entscheid-Date')
      }

      const decision = await createDecision({ ...parsed.data, initialStatus: 'draft' }, dbUserId)
      return {
        mode: 'executed' as const,
        entity: { type: 'decision', id: decision.id, title: decision.title, link: `/admin/decisions/${decision.id}` },
        suggestedNextStep: 'Lad Teilnehmer:innen ii oder starte d Diskussionsphase.',
      }
    }

    case 'create_protocol_draft': {
      const parsed = createProtocolSchema.safeParse(input.payload)
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Ungültigi Protokoll-Date')
      }

      const protocol = await createProtocol(parsed.data, dbUserId)
      return {
        mode: 'executed' as const,
        entity: { type: 'protocol', id: protocol.id, title: parsed.data.title, link: `/admin/protocols/${protocol.id}` },
        suggestedNextStep: 'Füeg jetzt Notize oder es Transkript fürs Processing hinzu.',
      }
    }

    case 'create_product_draft': {
      if (!MEDUSA_CONFIG.PUBLISHABLE_KEY) {
        throw new Error('Medusa-Konfiguration fehlt')
      }

      const payloadSchema = z.object({
        title: z.string().min(1).max(255),
        subtitle: z.string().max(255).optional(),
        description: z.string().max(5000).optional(),
      })
      const parsed = payloadSchema.safeParse(input.payload)
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Ungültigi Produkt-Date')
      }

      const medusaResponse = await fetch(`${MEDUSA_CONFIG.BACKEND_URL}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': MEDUSA_CONFIG.PUBLISHABLE_KEY,
          Authorization: `Basic ${MEDUSA_CONFIG.ADMIN_API_KEY || ''}`,
        },
        body: JSON.stringify({
          title: parsed.data.title,
          subtitle: parsed.data.subtitle,
          description: parsed.data.description,
          status: 'draft',
        }),
      })

      if (!medusaResponse.ok) {
        const details = await medusaResponse.text()
        logger.error('Hirn action product create failed', {
          status: medusaResponse.status,
          details,
        })
        throw new Error('Produkt-Entwurf konnte nöd erstellt werde')
      }

      const created = await medusaResponse.json() as { product?: { id?: string; title?: string } }
      const productId = created.product?.id
      if (!productId) {
        throw new Error('Produkt-ID fehlt i de Antwort')
      }

      return {
        mode: 'executed' as const,
        entity: {
          type: 'product',
          id: productId,
          title: created.product?.title || parsed.data.title,
          link: `/admin/products`,
        },
        suggestedNextStep: 'Prüef Bilder, Preis und Lagerbestand, bevor du veröffentlichsch.',
      }
    }
  }
}

function buildPreview(actionType: ExecuteActionInput['actionType'], payload: Record<string, unknown>) {
  switch (actionType) {
    case 'create_product_draft':
      return {
        title: 'Produkt-Entwurf wird erstellt (nöd veröffentlicht)',
        fields: {
          titel: payload.title,
          untertitel: payload.subtitle,
          beschrieb: payload.description,
          status: 'draft',
        },
      }
    default:
      return {
        title: 'Aktion wird vorbereitet',
        fields: payload,
      }
  }
}
