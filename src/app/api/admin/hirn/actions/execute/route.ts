import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiForbidden, apiSuccess, apiError } from '@/lib/api/helpers'
import { canAccessSection } from '@/lib/permissions'
import { getDbUserId } from '@/lib/api/task-helpers'
import { executeHirnAction } from '@/lib/hirn/action-executor'
import { isRiskyAction, validateExecuteActionInput } from '@/lib/hirn/action-executor-contracts'
import type { HirnActionType } from '@/lib/hirn/action-cockpit'

const ACTION_SECTION_REQUIREMENTS: Record<HirnActionType, string> = {
  create_task: 'tasks',
  create_product_draft: 'products',
  create_decision_draft: 'decisions',
  create_protocol_draft: 'protocols',
}

export const POST = withAdmin(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json()
    const parsed = validateExecuteActionInput(body)

    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0]?.message || 'Ungültigi Aktions-Date')
    }

    const { actionType, dryRun } = parsed.data
    const requiredSection = ACTION_SECTION_REQUIREMENTS[actionType]

    if (!canAccessSection({
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }, requiredSection)) {
      return apiForbidden('Du hesch kei Berechtigung für die Aktion')
    }

    if (isRiskyAction(actionType) && !dryRun) {
      return apiBadRequest('Für die Aktion isch zerscht en Dry-Run nötig')
    }

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error

    const result = await executeHirnAction(parsed.data, userLookup.dbUserId)

    return apiSuccess(result)
  } catch (error) {
    return apiError(error, 'Aktion konnt nöd usgführt werde')
  }
})
