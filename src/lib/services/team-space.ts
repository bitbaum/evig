/**
 * Team space queries — the work a team sees on its own page (SoC: no HTTP/JSX).
 *
 * A team page is a working space: its open tasks and recent meeting protocols
 * live there. Both relations are optional (tasks/protocols with team_id NULL
 * stay org-wide) — these queries only surface explicitly team-linked records.
 */

import { alias } from 'drizzle-orm/pg-core'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { tasks } from '@/db/schema/tasks'
import { meetingProtocols } from '@/db/schema/protocols'
import { users } from '@/db/schema/auth'

export interface TeamOpenTask {
  id: string
  title: string
  priority: string
  due_date: string | null
  assigned_to_name: string | null
}

export interface TeamProtocolItem {
  id: string
  title: string
  meeting_date: string
  status: string
}

/** Open (not completed, not archived) tasks of a team, due-first. */
export async function listTeamOpenTasks(teamId: string, limit = 8): Promise<TeamOpenTask[]> {
  const assignee = alias(users, 'assignee')
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      priority: tasks.priority,
      due_date: tasks.dueDate,
      assigned_to_name: assignee.name,
    })
    .from(tasks)
    .leftJoin(assignee, eq(tasks.assignedTo, assignee.id))
    .where(and(
      eq(tasks.teamId, teamId),
      eq(tasks.isCompleted, false),
      eq(tasks.isArchived, false),
    ))
    .orderBy(sql`${tasks.dueDate} ASC NULLS LAST`, desc(tasks.createdAt))
    .limit(limit)
  return rows
}

/** Count of a team's open tasks (for the section header). */
export async function countTeamOpenTasks(teamId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(tasks)
    .where(and(
      eq(tasks.teamId, teamId),
      eq(tasks.isCompleted, false),
      eq(tasks.isArchived, false),
    ))
  return row?.count ?? 0
}

/** A team's most recent meeting protocols, newest first. */
export async function listTeamProtocols(teamId: string, limit = 5): Promise<TeamProtocolItem[]> {
  const rows = await db
    .select({
      id: meetingProtocols.id,
      title: meetingProtocols.title,
      meeting_date: meetingProtocols.meetingDate,
      status: meetingProtocols.status,
    })
    .from(meetingProtocols)
    .where(eq(meetingProtocols.teamId, teamId))
    .orderBy(desc(meetingProtocols.meetingDate), desc(meetingProtocols.createdAt))
    .limit(limit)
  return rows
}
