/**
 * Editable Fields Configuration
 *
 * SSOT for admin-editable fields in workshop proposals and blog submissions.
 * Defines which fields can be edited, their types, validation rules, and labels.
 *
 * Following Ground Truth #2: One source of truth for field metadata.
 */

import { WORKSHOP_CATEGORIES, WORKSHOP_LEVELS } from './workshops';

/**
 * Field configuration interface
 */
export interface EditableFieldConfig {
  /** Display label (German) */
  label: string;
  /** Input type */
  type: 'text' | 'textarea' | 'number' | 'select' | 'markdown' | 'array' | 'tags';
  /** Whether field is required */
  required?: boolean;
  /** Maximum length for text fields */
  maxLength?: number;
  /** Minimum value for number fields */
  min?: number;
  /** Maximum value for number fields */
  max?: number;
  /** Options for select fields */
  options?: readonly { id: string; name: string }[] | readonly string[];
  /** Help text for the field */
  help?: string;
}

/**
 * Workshop Proposal Editable Fields
 *
 * These are the fields admins can edit before approving a workshop proposal.
 * Based on workshop_proposals table structure (016_workshop_proposals.sql)
 */
export const WORKSHOP_PROPOSAL_EDITABLE_FIELDS = {
  title: {
    label: 'Titel',
    type: 'text',
    required: true,
    maxLength: 500,
  },
  description: {
    label: 'Beschreibung',
    type: 'textarea',
    required: true,
    help: 'Vollständige Beschreibung des Workshops',
  },
  short_description: {
    label: 'Kurzbeschreibung',
    type: 'textarea',
    maxLength: 500,
    help: 'Kurze Zusammenfassung für Listenansichten',
  },
  category: {
    label: 'Kategorie',
    type: 'select',
    options: WORKSHOP_CATEGORIES.map(cat => ({ id: cat.id, name: cat.name })),
  },
  duration_minutes: {
    label: 'Dauer (Minuten)',
    type: 'number',
    required: true,
    min: 15,
    max: 480,
    help: 'Workshop-Dauer in Minuten (15-480)',
  },
  level: {
    label: 'Level',
    type: 'select',
    options: WORKSHOP_LEVELS.map(level => ({ id: level.id, name: level.name })),
  },
  max_participants: {
    label: 'Max. Teilnehmer',
    type: 'number',
    min: 1,
    max: 100,
  },
  min_participants: {
    label: 'Min. Teilnehmer',
    type: 'number',
    min: 1,
    max: 50,
  },
  price_cents: {
    label: 'Preis (CHF)',
    type: 'number',
    min: 0,
    help: 'Preis in Rappen (z.B. 5000 = CHF 50.00)',
  },
  prerequisites: {
    label: 'Voraussetzungen',
    type: 'textarea',
    help: 'Erforderliche Vorkenntnisse oder Fähigkeiten',
  },
  learning_objectives: {
    label: 'Lernziele',
    type: 'array',
    help: 'Was lernen Teilnehmer in diesem Workshop? (ein Ziel pro Zeile)',
  },
  target_audience: {
    label: 'Zielgruppe',
    type: 'text',
    help: 'Für wen ist dieser Workshop gedacht?',
  },
  materials_provided: {
    label: 'Bereitgestellte Materialien',
    type: 'text',
    help: 'Welche Materialien werden zur Verfügung gestellt?',
  },
  materials_required: {
    label: 'Benötigte Materialien',
    type: 'text',
    help: 'Was müssen Teilnehmer mitbringen?',
  },
  special_requirements: {
    label: 'Besondere Anforderungen',
    type: 'textarea',
    help: 'Spezielle Räumlichkeiten, Ausstattung, etc.',
  },
} as const satisfies Record<string, EditableFieldConfig>;

/**
 * Blog Submission Editable Fields
 *
 * These are the fields admins can edit before publishing a blog submission.
 * Based on blog_submissions table structure (019_blog_submissions.sql)
 */
export const BLOG_SUBMISSION_EDITABLE_FIELDS = {
  title: {
    label: 'Titel',
    type: 'text',
    required: true,
    help: 'Titel des Blog-Beitrags',
  },
  content: {
    label: 'Inhalt',
    type: 'markdown',
    required: true,
    help: 'Vollständiger Inhalt (Markdown-Format)',
  },
  excerpt: {
    label: 'Auszug',
    type: 'textarea',
    help: 'Kurze Zusammenfassung für Vorschauen',
  },
  category_id: {
    label: 'Kategorie',
    type: 'select',
    options: [], // Loaded dynamically from database
    help: 'Blog-Kategorie (wird aus Datenbank geladen)',
  },
  tags: {
    label: 'Tags',
    type: 'tags',
    help: 'Schlagwörter für den Beitrag (mit Komma trennen)',
  },
} as const satisfies Record<string, EditableFieldConfig>;

/**
 * Type exports
 */
export type WorkshopProposalEditableField = keyof typeof WORKSHOP_PROPOSAL_EDITABLE_FIELDS;
export type BlogSubmissionEditableField = keyof typeof BLOG_SUBMISSION_EDITABLE_FIELDS;

/**
 * Helper: Get field label
 */
export function getFieldLabel(
  field: WorkshopProposalEditableField | BlogSubmissionEditableField,
  type: 'workshop' | 'blog'
): string {
  const config = type === 'workshop'
    ? WORKSHOP_PROPOSAL_EDITABLE_FIELDS
    : BLOG_SUBMISSION_EDITABLE_FIELDS;
  return (config as Record<string, { label: string }>)[field]?.label || field;
}

/**
 * Helper: Get all editable field labels for a type
 */
export function getEditableFieldLabels(type: 'workshop' | 'blog'): Record<string, string> {
  const config = type === 'workshop'
    ? WORKSHOP_PROPOSAL_EDITABLE_FIELDS
    : BLOG_SUBMISSION_EDITABLE_FIELDS;

  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value.label])
  );
}
