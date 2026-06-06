/**
 * Data layer for workshop detail page.
 *
 * Pure SQL queries + DTO shaping — no React, no JSX. Keeps page.tsx
 * focused on orchestration and the section components focused on
 * presentation (SoC).
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { type WorkshopInstanceStatus } from '@/config/workshops'
import type { WorkshopInstanceWithCount } from '@/components/workshops/types'

// Extended workshop type (mirrors columns from migration 038)
export interface WorkshopDetail {
  id: string
  slug: string
  title: string
  description: string | null
  short_description: string | null
  category: string | null
  duration: string | null
  level: string | null
  max_participants: number
  price_cents: number
  is_active: boolean
  prerequisites: string | null
  learning_objectives: string[] | null
  target_audience: string | null
  materials_provided: string | null
  materials_required: string | null
  created_at: string
  updated_at: string
}

// DB row type — current_participants comes back as a string from COUNT()
interface WorkshopInstanceRow {
  id: string
  workshop_id: string
  start_date: string
  end_date: string | null
  location: string | null
  instructor: string | null
  max_participants: number | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
  current_participants: string
}

export async function getWorkshop(slug: string): Promise<WorkshopDetail | null> {
  try {
    const result = await query(
      `SELECT id, slug, title, description, short_description, category, duration, level,
              max_participants, price_cents, is_active, prerequisites, learning_objectives,
              target_audience, materials_provided, materials_required, created_at, updated_at
       FROM ${TABLE_NAMES.WORKSHOPS} WHERE slug = $1 AND is_active = true`,
      [slug]
    )
    return (result.rows[0] as WorkshopDetail) || null
  } catch (error) {
    logger.error('Error fetching workshop', { error })
    return null
  }
}

export async function getWorkshopInstances(workshopId: string): Promise<WorkshopInstanceWithCount[]> {
  try {
    const result = await query(`
      SELECT
        wi.*,
        COUNT(wr.id) as current_participants
      FROM ${TABLE_NAMES.WORKSHOP_INSTANCES} wi
      LEFT JOIN ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr ON wi.id = wr.workshop_instance_id
      WHERE wi.workshop_id = $1
      GROUP BY wi.id
      ORDER BY wi.start_date ASC
    `, [workshopId])

    return (result.rows as WorkshopInstanceRow[]).map((row): WorkshopInstanceWithCount => ({
      id: row.id,
      workshop_id: row.workshop_id,
      start_date: row.start_date,
      end_date: row.end_date,
      location: row.location,
      instructor: row.instructor,
      max_participants: row.max_participants,
      notes: row.notes,
      status: row.status as WorkshopInstanceStatus,
      created_at: row.created_at,
      updated_at: row.updated_at,
      current_participants: parseInt(row.current_participants) || 0,
    }))
  } catch (error) {
    logger.error('Error fetching workshop instances', { error })
    return []
  }
}
