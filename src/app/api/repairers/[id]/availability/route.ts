import { NextRequest } from 'next/server'
import { db } from '@/db'
import { repairerProfiles, repairerAvailability } from '@/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { apiError, apiSuccessCached, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REPAIRER_STATUS, REPAIRER_AVAILABILITY_TYPE } from '@/config/repairer-status'

interface AvailabilityRow {
  id: string
  date: string
  start_time: string
  end_time: string
  duration_hours: string | null
  availability_type: string | null
  notes: string | null
}

// GET /api/repairers/[id]/availability - Get repairer availability slots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    // Parse date range parameters
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0]
    const endDateParam = searchParams.get('end_date')

    // Default to 30 days if no end date provided
    const endDate = endDateParam || (() => {
      const date = new Date(startDate)
      date.setDate(date.getDate() + 30)
      return date.toISOString().split('T')[0]
    })()

    // Verify repairer exists and is active
    const [repairer] = await db
      .select({
        id: repairerProfiles.id,
        status: repairerProfiles.status,
        isActive: repairerProfiles.isActive,
        availabilitySchedule: repairerProfiles.availabilitySchedule,
      })
      .from(repairerProfiles)
      .where(eq(repairerProfiles.id, id))

    if (!repairer) {
      return apiNotFound('Reparateur nicht gefunden')
    }

    if (!repairer.isActive || repairer.status !== REPAIRER_STATUS.ACTIVE) {
      return apiNotFound('Reparateur ist derzeit nicht verfügbar')
    }

    // Get explicit availability slots
    const explicitSlots = await db
      .select({
        id: repairerAvailability.id,
        date: sql<string>`${repairerAvailability.date}::text`,
        start_time: sql<string>`${repairerAvailability.startTime}::text`,
        end_time: sql<string>`${repairerAvailability.endTime}::text`,
        duration_hours: repairerAvailability.durationHours,
        availability_type: repairerAvailability.availabilityType,
        notes: repairerAvailability.notes,
      })
      .from(repairerAvailability)
      .where(and(
        eq(repairerAvailability.repairerId, id),
        gte(repairerAvailability.date, sql`${startDate}::date`),
        lte(repairerAvailability.date, sql`${endDate}::date`),
        eq(repairerAvailability.availabilityType, REPAIRER_AVAILABILITY_TYPE.AVAILABLE)
      ))
      .orderBy(repairerAvailability.date, repairerAvailability.startTime)

    // Get booked slots to exclude
    const bookedSlots = await db
      .select({
        date: sql<string>`${repairerAvailability.date}::text`,
        start_time: sql<string>`${repairerAvailability.startTime}::text`,
        end_time: sql<string>`${repairerAvailability.endTime}::text`,
      })
      .from(repairerAvailability)
      .where(and(
        eq(repairerAvailability.repairerId, id),
        gte(repairerAvailability.date, sql`${startDate}::date`),
        lte(repairerAvailability.date, sql`${endDate}::date`),
        eq(repairerAvailability.availabilityType, REPAIRER_AVAILABILITY_TYPE.BOOKED)
      ))

    // If no explicit slots defined, generate default slots from weekly schedule
    let slots: AvailabilityRow[] = explicitSlots as AvailabilityRow[]

    if (explicitSlots.length === 0 && repairer.availabilitySchedule) {
      slots = generateSlotsFromSchedule(
        repairer.availabilitySchedule as Record<string, unknown>,
        startDate,
        endDate,
        bookedSlots
      )
    }

    // Group slots by date for easier frontend consumption
    const slotsByDate: Record<string, Array<{
      id?: string
      start_time: string
      end_time: string
      duration_hours?: string | null
      available: boolean
    }>> = {}

    for (const slot of slots) {
      const dateKey = slot.date
      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = []
      }

      // Check if this slot is booked
      const isBooked = bookedSlots.some(
        booked => booked.date === dateKey &&
          booked.start_time === slot.start_time &&
          booked.end_time === slot.end_time
      )

      slotsByDate[dateKey].push({
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_hours: slot.duration_hours,
        available: !isBooked
      })
    }

    logger.info('Repairer availability fetched', {
      repairerId: id,
      startDate,
      endDate,
      slotsCount: slots.length
    })

    // Availability is public but time-sensitive — short cache 15s, stale 10s
    return apiSuccessCached({
      repairer_id: id,
      date_range: {
        start: startDate,
        end: endDate
      },
      slots: slotsByDate,
      total_available_slots: slots.filter(s =>
        !bookedSlots.some(b => b.date === s.date && b.start_time === s.start_time)
      ).length
    }, 15, 10)

  } catch (error) {
    logger.error('Error fetching repairer availability', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

// Helper function to generate slots from weekly schedule
function generateSlotsFromSchedule(
  schedule: Record<string, unknown>,
  startDate: string,
  endDate: string,
  bookedSlots: { date: string; start_time: string; end_time: string }[]
): AvailabilityRow[] {
  const slots: AvailabilityRow[] = []
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const dayName = dayNames[current.getDay()]
    const daySchedule = schedule[dayName] as { start: string; end: string; slots?: number } | undefined

    if (daySchedule && daySchedule.start && daySchedule.end) {
      const dateStr = current.toISOString().split('T')[0]

      // Generate time slots (default 1-hour slots)
      const startHour = parseInt(daySchedule.start.split(':')[0])
      const endHour = parseInt(daySchedule.end.split(':')[0])
      const slotDuration = 1 // 1 hour slots

      for (let hour = startHour; hour < endHour; hour += slotDuration) {
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`
        const endTime = `${(hour + slotDuration).toString().padStart(2, '0')}:00:00`

        // Check if not booked
        const isBooked = bookedSlots.some(
          b => b.date === dateStr && b.start_time === startTime
        )

        if (!isBooked) {
          slots.push({
            id: `generated-${dateStr}-${startTime}`,
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
            duration_hours: String(slotDuration),
            availability_type: REPAIRER_AVAILABILITY_TYPE.AVAILABLE,
            notes: null
          })
        }
      }
    }

    current.setDate(current.getDate() + 1)
  }

  return slots
}
