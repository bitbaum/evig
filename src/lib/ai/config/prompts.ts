/**
 * AI Prompts Configuration — backward-compat barrel
 *
 * This file re-exports everything from the prompts/ subdirectory so that
 * all existing imports (`@/lib/ai/config/prompts`) continue to work without
 * any changes. Feature-specific prompts now live in:
 *
 *   prompts/erfassung.ts  — product extraction / device intake
 *   prompts/content.ts    — blog, IT-Hilfe
 *   prompts/decisions.ts  — protocols, governance
 *   prompts/index.ts      — FORM_AI_REGISTRY + barrel
 */

export * from './prompts/index'
