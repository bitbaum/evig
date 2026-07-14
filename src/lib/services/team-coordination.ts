/**
 * Team coordination sub-resources: goals + manual KPI metrics.
 * SoC: business logic only (no HTTP/JSX). Kept out of teams.ts to avoid a god
 * file — teams.ts owns teams + membership; this owns the coordination surface.
 */

import { db } from '@/db'
import { teamGoals, teamMetrics } from '@/db/schema/teams'
import { and, asc, eq, sql } from 'drizzle-orm'
import type { GoalStatus } from '@/config/teams'
import type {
  TeamGoalRow,
  TeamMetricRow,
  CreateGoalInput,
  UpdateGoalInput,
  CreateMetricInput,
  UpdateMetricInput,
} from '@/lib/schemas/teams'

// A numeric input arrives as a JS number; the column is NUMERIC (string in JS).
const num = (v: number | null | undefined) => (v == null ? null : String(v))

// ---- Goals ------------------------------------------------------------------

export async function listGoals(teamId: string): Promise<TeamGoalRow[]> {
  const rows = await db
    .select({
      id: teamGoals.id,
      team_id: teamGoals.teamId,
      title: teamGoals.title,
      detail: teamGoals.detail,
      status: teamGoals.status,
      target_label: teamGoals.targetLabel,
      sort_order: teamGoals.sortOrder,
      created_at: teamGoals.createdAt,
      updated_at: teamGoals.updatedAt,
    })
    .from(teamGoals)
    .where(eq(teamGoals.teamId, teamId))
    .orderBy(asc(teamGoals.sortOrder), asc(teamGoals.createdAt))
  return rows as TeamGoalRow[]
}

export async function createGoal(teamId: string, input: CreateGoalInput): Promise<{ id: string }> {
  const [row] = await db
    .insert(teamGoals)
    .values({
      teamId,
      title: input.title,
      detail: input.detail ?? null,
      status: input.status,
      targetLabel: input.target_label ?? null,
      sortOrder: input.sort_order ?? 0,
    })
    .returning({ id: teamGoals.id })
  return row
}

export async function updateGoal(teamId: string, goalId: string, input: UpdateGoalInput): Promise<boolean> {
  const set: Record<string, unknown> = {}
  if ('title' in input) set.title = input.title
  if ('detail' in input) set.detail = input.detail ?? null
  if ('status' in input) set.status = input.status as GoalStatus
  if ('target_label' in input) set.targetLabel = input.target_label ?? null
  if ('sort_order' in input) set.sortOrder = input.sort_order
  if (Object.keys(set).length === 0) return true
  set.updatedAt = sql`NOW()`
  const [row] = await db
    .update(teamGoals)
    .set(set)
    .where(and(eq(teamGoals.id, goalId), eq(teamGoals.teamId, teamId)))
    .returning({ id: teamGoals.id })
  return !!row
}

export async function deleteGoal(teamId: string, goalId: string): Promise<boolean> {
  const [row] = await db
    .delete(teamGoals)
    .where(and(eq(teamGoals.id, goalId), eq(teamGoals.teamId, teamId)))
    .returning({ id: teamGoals.id })
  return !!row
}

// ---- Metrics ----------------------------------------------------------------

export async function listMetrics(teamId: string): Promise<TeamMetricRow[]> {
  const rows = await db
    .select({
      id: teamMetrics.id,
      team_id: teamMetrics.teamId,
      label: teamMetrics.label,
      current_value: teamMetrics.currentValue,
      target_value: teamMetrics.targetValue,
      unit: teamMetrics.unit,
      higher_is_better: teamMetrics.higherIsBetter,
      sort_order: teamMetrics.sortOrder,
      updated_at: teamMetrics.updatedAt,
    })
    .from(teamMetrics)
    .where(eq(teamMetrics.teamId, teamId))
    .orderBy(asc(teamMetrics.sortOrder), asc(teamMetrics.createdAt))
  return rows as TeamMetricRow[]
}

export async function createMetric(teamId: string, input: CreateMetricInput): Promise<{ id: string }> {
  const [row] = await db
    .insert(teamMetrics)
    .values({
      teamId,
      label: input.label,
      currentValue: num(input.current_value),
      targetValue: num(input.target_value),
      unit: input.unit ?? null,
      higherIsBetter: input.higher_is_better ?? true,
      sortOrder: input.sort_order ?? 0,
    })
    .returning({ id: teamMetrics.id })
  return row
}

export async function updateMetric(teamId: string, metricId: string, input: UpdateMetricInput): Promise<boolean> {
  const set: Record<string, unknown> = {}
  if ('label' in input) set.label = input.label
  if ('current_value' in input) set.currentValue = num(input.current_value)
  if ('target_value' in input) set.targetValue = num(input.target_value)
  if ('unit' in input) set.unit = input.unit ?? null
  if ('higher_is_better' in input) set.higherIsBetter = input.higher_is_better
  if ('sort_order' in input) set.sortOrder = input.sort_order
  if (Object.keys(set).length === 0) return true
  set.updatedAt = sql`NOW()`
  const [row] = await db
    .update(teamMetrics)
    .set(set)
    .where(and(eq(teamMetrics.id, metricId), eq(teamMetrics.teamId, teamId)))
    .returning({ id: teamMetrics.id })
  return !!row
}

export async function deleteMetric(teamId: string, metricId: string): Promise<boolean> {
  const [row] = await db
    .delete(teamMetrics)
    .where(and(eq(teamMetrics.id, metricId), eq(teamMetrics.teamId, teamId)))
    .returning({ id: teamMetrics.id })
  return !!row
}
