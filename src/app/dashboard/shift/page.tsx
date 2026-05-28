/**
 * /dashboard/shift — mobile-first Clock-In flow
 *
 * For volunteers + paid staff who want to log "I'm here now". Optimised
 * for the realistic scenario: someone walks into the workshop, taps
 * "Schicht starten" on their phone, works for 3 hours, taps "Schicht
 * beenden", confirms, done. No date pickers, no category dropdown
 * required (defaults to the user's most common category), no 49-button
 * month grid.
 *
 * Persistence: active-shift state lives in localStorage on the device.
 * The shift only hits the server when the user clocks out — at which
 * point we POST the resulting entry into the current week's draft
 * timecard via the existing /api/timecards endpoint. Tradeoff: shift
 * doesn't sync across devices. For Phase 1 that's the right call —
 * single-device shifts are the realistic case and the data round-trip
 * stays minimal.
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { eq, and, sql } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { timecardEntries } from '@/db/schema'
import { ShiftClient } from '@/components/dashboard/timecards/ShiftClient'

export const metadata: Metadata = {
  title: 'Schicht erfassen',
  description: 'Aktuelle Schicht starten und beenden.',
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default async function ShiftPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard/shift')
  }

  const today = todayISO()

  // Today's entries so the client can show "you already logged X minutes
  // today" — purely informational, the active-shift state itself is
  // device-local.
  const todayEntries = await db
    .select({
      id: timecardEntries.id,
      startTime: timecardEntries.startTime,
      endTime: timecardEntries.endTime,
      durationMinutes: timecardEntries.durationMinutes,
      category: timecardEntries.category,
      description: timecardEntries.description,
    })
    .from(timecardEntries)
    .where(
      and(
        eq(timecardEntries.userId, session.user.id),
        eq(timecardEntries.workDate, today),
      ),
    )

  const totalMinutesToday = todayEntries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0)

  // This-month total via SUM aggregate — single round-trip, no large entry pull.
  const monthStart = new Date()
  monthStart.setDate(1)
  const monthStartISO = monthStart.toISOString().slice(0, 10)

  const [monthAgg] = await db
    .select({ total: sql<number>`COALESCE(SUM(${timecardEntries.durationMinutes}), 0)::int` })
    .from(timecardEntries)
    .where(
      and(
        eq(timecardEntries.userId, session.user.id),
        sql`${timecardEntries.workDate} >= ${monthStartISO}`,
      ),
    )

  const totalMinutesMonth = Number(monthAgg?.total ?? 0)

  return (
    <ShiftClient
      todayEntries={todayEntries}
      totalMinutesToday={totalMinutesToday}
      totalMinutesMonth={totalMinutesMonth}
      today={today}
      userName={session.user.name || session.user.email || 'Du'}
    />
  )
}
