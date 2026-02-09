/**
 * Task Management Zod Schemas
 *
 * Validation schemas derived from config (SSOT)
 * Following dev guide: docs/development/DEV_GUIDE.md
 *
 * Created: 2026-02-05
 */

import { z } from 'zod';
import {
  TASK_TYPES,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  PROJECT_STATUSES,
  REQUEST_STATUSES,
} from '@/config/tasks';

// Derive enums from config
const taskTypes = Object.values(TASK_TYPES) as [string, ...string[]];
const taskCategories = Object.values(TASK_CATEGORIES) as [string, ...string[]];
const taskPriorities = Object.values(TASK_PRIORITIES) as [string, ...string[]];
const taskStatuses = Object.values(TASK_STATUSES) as [string, ...string[]];
const projectStatuses = Object.values(PROJECT_STATUSES) as [string, ...string[]];
const requestStatuses = Object.values(REQUEST_STATUSES) as [string, ...string[]];

/**
 * Task creation schema
 */
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel erforderlich')
    .max(200, 'Titel zu lang (max 200 Zeichen)'),
  description: z
    .string()
    .max(2000, 'Beschreibung zu lang')
    .optional()
    .nullable(),
  instructions: z
    .string()
    .max(5000, 'Anleitung zu lang')
    .optional()
    .nullable(),
  task_type: z.enum(taskTypes),
  schedule_cron: z.string().max(100).optional().nullable(),
  schedule_human: z.string().max(200).optional().nullable(),
  category: z.enum(taskCategories),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
  priority: z.enum(taskPriorities).default('normal'),
  estimated_minutes: z.number().int().min(1).max(480).optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
});

/**
 * Task update schema (all fields optional)
 */
export const updateTaskSchema = createTaskSchema.partial().extend({
  current_status: z.enum(taskStatuses).optional(),
  is_archived: z.boolean().optional(),
});

/**
 * Task completion schema
 */
export const taskCompletionSchema = z.object({
  notes: z.string().max(1000, 'Notiz zu lang').optional().nullable(),
  duration_minutes: z.number().int().min(1).max(480).optional().nullable(),
});

/**
 * Attention flag schema
 */
export const attentionFlagSchema = z.object({
  message: z.string().max(500, 'Nachricht zu lang').optional().nullable(),
});

/**
 * Task request schema
 * If requested_user_id is null/omitted, it's a broadcast to all team members
 */
export const taskRequestSchema = z.object({
  requested_user_id: z.string().uuid().optional().nullable(),
  message: z.string().max(500, 'Nachricht zu lang').optional().nullable(),
});

/**
 * Request response schema (accept/decline)
 */
export const requestResponseSchema = z.object({
  status: z.enum([REQUEST_STATUSES.ACCEPTED, REQUEST_STATUSES.DECLINED]),
  response_message: z.string().max(500).optional().nullable(),
});

/**
 * Project schema
 */
export const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel erforderlich')
    .max(200, 'Titel zu lang'),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(projectStatuses).default('planning'),
  target_date: z.string().optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();

// Derived types from schemas
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskCompletionInput = z.infer<typeof taskCompletionSchema>;
export type AttentionFlagInput = z.infer<typeof attentionFlagSchema>;
export type TaskRequestInput = z.infer<typeof taskRequestSchema>;
export type RequestResponseInput = z.infer<typeof requestResponseSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ============================================================
// Database row types (SSOT for task data shapes across pages)
// ============================================================

import type {
  TaskType,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '@/config/tasks';

/** Task row for list pages (minimal fields for table display) */
export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  category: TaskCategory;
  priority: TaskPriority;
  current_status: TaskStatus;
  estimated_minutes: number | null;
  is_completed: boolean;
  completion_count: number;
  created_at: string;
  created_by_name: string | null;
}

/** Task row for detail page (full fields) */
export interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  task_type: TaskType;
  category: TaskCategory;
  priority: TaskPriority;
  current_status: TaskStatus;
  estimated_minutes: number | null;
  schedule_human: string | null;
  is_completed: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_name: string | null;
  created_by_email: string | null;
}

/** Task row for edit form (editable fields only) */
export interface TaskEditItem {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  task_type: string;
  category: string;
  priority: string;
  schedule_human: string | null;
  estimated_minutes: number | null;
  tags: string[];
}

/** Completion history record */
export interface TaskCompletion {
  id: string;
  completed_by: string;
  completed_by_name: string | null;
  completed_by_email: string | null;
  completed_at: string;
  notes: string | null;
  duration_minutes: number | null;
}

/** Attention flag record */
export interface TaskAttentionFlag {
  id: string;
  flagged_by: string;
  flagged_by_name: string | null;
  message: string | null;
  created_at: string;
  is_resolved: boolean;
}

/** Task request record */
export interface TaskRequestRecord {
  id: string;
  requested_by: string;
  requested_by_name: string | null;
  requested_user_id: string | null;
  requested_user_name: string | null;
  is_broadcast: boolean;
  message: string | null;
  status: string;
  created_at: string;
}
