import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface AvailabilityRow {
  id: string
  date: string
  start_time: string
  end_time: string
  duration_hours: number | null
  availability_type: string
  notes: string | null
}

interface RepairerCheckRow {
  id: string
  status: string
  is_active: boolean
  availability_schedule: Record<string, unknown>
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
    const repairerCheck = await query(`
      SELECT id, status, is_active, availability_schedule
      FROM ${TABLE_NAMES.REPAIRER_PROFILES}
      WHERE id = $1
    `, [id])

    if (repairerCheck.rows.length === 0) {
      return apiNotFound('Reparateur nicht gefunden')
    }

    const repairer = repairerCheck.rows[0] as RepairerCheckRow

    if (!repairer.is_active || repairer.status !== 'active') {
      return apiNotFound('Reparateur ist derzeit nicht verfügbar')
    }

    // Get explicit availability slots
    const availabilityResult = await query(`
      SELECT
        id,
        date::text,
        start_time::text,
        end_time::text,
        duration_hours,
        availability_type,
        notes
      FROM ${TABLE_NAMES.REPAIRER_AVAILABILITY}
      WHERE repairer_id = $1
        AND date >= $2::date
        AND date <= $3::date
        AND availability_type = 'available'
      ORDER BY date, start_time
    `, [id, startDate, endDate])

    const explicitSlots = availabilityResult.rows as AvailabilityRow[]

    // Get booked slots to exclude
    const bookedResult = await query(`
      SELECT
        ra.date::text,
        ra.start_time::text,
        ra.end_time::text
      FROM ${TABLE_NAMES.REPAIRER_AVAILABILITY} ra
      WHERE ra.repairer_id = $1
        AND ra.date >= $2::date
        AND ra.date <= $3::date
        AND ra.availability_type = 'booked'
    `, [id, startDate, endDate])

    const bookedSlots = bookedResult.rows as { date: string; start_time: string; end_time: string }[]

    // If no explicit slots defined, generate default slots from weekly schedule
    let slots = explicitSlots

    if (explicitSlots.length === 0 && repairer.availability_schedule) {
      // Generate slots from weekly schedule
      slots = generateSlotsFromSchedule(
        repairer.availability_schedule,
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
      duration_hours?: number | null
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

    return apiSuccess({
      repairer_id: id,
      date_range: {
        start: startDate,
        end: endDate
      },
      slots: slotsByDate,
      total_available_slots: slots.filter(s =>
        !bookedSlots.some(b => b.date === s.date && b.start_time === s.start_time)
      ).length
    })

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
            duration_hours: slotDuration,
            availability_type: 'available',
            notes: null
          })
        }
      }
    }

    current.setDate(current.getDate() + 1)
  }

  return slots
}
