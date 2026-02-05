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
