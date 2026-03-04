import { z } from 'zod'

export const executeActionSchema = z.object({
  actionId: z.string().min(1).max(80),
  actionType: z.enum([
    'create_task',
    'create_decision_draft',
    'create_protocol_draft',
    'navigate',
  ]),
  payload: z.record(z.string(), z.unknown()),
  dryRun: z.boolean().default(false),
})

export type ExecuteActionInput = z.infer<typeof executeActionSchema>

export function validateExecuteActionInput(input: unknown) {
  return executeActionSchema.safeParse(input)
}

/** Navigate actions are never risky — they just redirect the user */
export function isRiskyAction(actionType: ExecuteActionInput['actionType']): boolean {
  return false // No current action types require dry-run; add back if needed
}
