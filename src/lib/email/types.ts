/**
 * Email Types
 *
 * Shared type definitions for email templates and services.
 */

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export type EmailTemplateFn<T extends unknown[] = unknown[]> = (...args: T) => EmailContent;

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface TestEmailResult {
  success: boolean;
  error?: string;
}
