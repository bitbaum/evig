/**
 * Monthly report (Monatsrapport) data assembly — the printable sheet that
 * replaces the legacy SMALL-Time PDF and doubles as the update for referring
 * social workers (Arbeitsintegration). Pure data here; rendering lives in
 * /admin/team/report. Content is intentionally German — it is an official
 * document (ArG record, authorities, referring institutions).
 */

import { and, desc, eq, lte } from 'drizzle-orm'
import { db } from '@/db'
import { teamProfiles, timecards, users } from '@/db/schema'
import { getTimecardByIdForReview, type TimecardWithEntries } from '@/lib/services/timecards'
import { getPersonSaldo, type PersonSaldo } from '@/lib/services/saldo'
import { getPublicHolidays } from '@/config/holidays'

export interface MonthlyReport {
  person: { name: string; email: string; position: string | null; employmentType: string | null }
  month: string // YYYY-MM
  card: TimecardWithEntries | null
  reviewerName: string | null
  saldo: PersonSaldo | null
  holidays: { date: string; name: string }[]
  /** The date the figures are computed through (month-end, or today if the
   *  month is still running). Entries after this are not yet "worked". */
  asOfDate: string
  /** True while the month is still in progress — the sheet is a Zwischenstand,
   *  not a final record, and must not present future days as done. */
  isInterim: boolean
}

function lastDayOfMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m, 0))
  return d.toISOString().slice(0, 10)
}

function todayIsoZurich(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date())
}

export async function getMonthlyReport(userId: string, month: string): Promise<MonthlyReport | null> {
  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) return null

  const [profile] = await db
    .select({ position: teamProfiles.position, employmentType: teamProfiles.employmentType })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, userId))
    .limit(1)

  const monthStart = `${month}-01`
  const [cardRow] = await db
    .select({ id: timecards.id, reviewedBy: timecards.reviewedBy })
    .from(timecards)
    .where(and(
      eq(timecards.userId, userId),
      eq(timecards.periodStart, monthStart),
      eq(timecards.periodType, 'month'),
    ))
    .orderBy(desc(timecards.createdAt))
    .limit(1)

  const card = cardRow ? await getTimecardByIdForReview(cardRow.id) : null

  let reviewerName: string | null = null
  if (cardRow?.reviewedBy) {
    const [reviewer] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, cardRow.reviewedBy))
      .limit(1)
    reviewerName = reviewer?.name || reviewer?.email || null
  }

  // A finished month reports its closing state (month-end). A month still in
  // progress reports as of today — otherwise pre-filled future days would show
  // as "worked" and the Soll/Ist/Saldo would diverge from the live dashboard.
  const monthEnd = lastDayOfMonth(month)
  const today = todayIsoZurich()
  const asOfDate = today < monthEnd ? today : monthEnd
  const isInterim = asOfDate < monthEnd
  const saldo = await getPersonSaldo(userId, asOfDate).catch(() => null)

  const year = Number(month.slice(0, 4))
  const holidays = getPublicHolidays(year).filter(h => h.date.startsWith(month))

  return {
    person: {
      name: user.name || user.email,
      email: user.email,
      position: profile?.position ?? null,
      employmentType: profile?.employmentType ?? null,
    },
    month,
    card,
    reviewerName,
    saldo,
    holidays,
    asOfDate,
    isInterim,
  }
}

// Referenced by the page to keep param validation in one place.
export const REPORT_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/
export { lastDayOfMonth }
