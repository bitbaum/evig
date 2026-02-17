import { z } from 'zod'

export const executeActionSchema = z.object({
  actionId: z.string().min(1).max(80),
  actionType: z.enum([
    'create_task',
    'create_product_draft',
    'create_decision_draft',
    'create_protocol_draft',
  ]),
  payload: z.record(z.string(), z.unknown()),
  dryRun: z.boolean().default(false),
})

export type ExecuteActionInput = z.infer<typeof executeActionSchema>

export function validateExecuteActionInput(input: unknown) {
  return executeActionSchema.safeParse(input)
}

const RISKY_ACTIONS = new Set<ExecuteActionInput['actionType']>(['create_product_draft'])

export function isRiskyAction(actionType: ExecuteActionInput['actionType']): boolean {
  return RISKY_ACTIONS.has(actionType)
}
