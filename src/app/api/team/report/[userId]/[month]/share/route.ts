import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { logger } from '@/lib/logger'
import { canAccessSection } from '@/lib/permissions'
import { REPORT_MONTH_REGEX } from '@/lib/services/report'
import { ensureReportShareToken, revokeReportShare } from '@/lib/services/report-shares'

/**
 * Mint (POST) or revoke (DELETE) the public share link for one person's
 * Monatsrapport. Same access rule as viewing the report: the owner, or a
 * timecard approver. The link itself needs no login (it's for social workers).
 */
async function authorize(userId: string, month: string) {
  if (!REPORT_MONTH_REGEX.test(month)) return { error: 'Invalid month', status: 400 as const }
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized', status: 401 as const }
  const mayShare = session.user.id === userId || canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
    is_super_admin: session.user.isSuperAdmin,
  }, 'timecards')
  if (!mayShare) return { error: 'Forbidden', status: 403 as const }
  return { session }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ userId: string; month: string }> }) {
  try {
    const { userId, month } = await params
    const gate = await authorize(userId, month)
    if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status })
    const token = await ensureReportShareToken(userId, month, gate.session.user.id)
    return NextResponse.json({ success: true, data: { token } })
  } catch (error) {
    logger.error('Report share create failed', { error })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string; month: string }> }) {
  try {
    const { userId, month } = await params
    const gate = await authorize(userId, month)
    if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status })
    await revokeReportShare(userId, month)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Report share revoke failed', { error })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
