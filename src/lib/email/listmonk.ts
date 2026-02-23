/**
 * Listmonk Transactional Email Client
 *
 * Sends transactional emails via Listmonk's API.
 * Listmonk is a free, open-source newsletter and mailing list manager.
 *
 * @see https://listmonk.app/docs/apis/transactional/
 */

import { logger } from '@/lib/logger';
import { LISTMONK_CONFIG } from '@/config/email';
import type { EmailContent, SendEmailResult } from './types';

/**
 * Check if Listmonk is configured and enabled
 */
export function isListmonkEnabled(): boolean {
  return LISTMONK_CONFIG.ENABLED;
}

/**
 * Get Listmonk configuration (for debugging)
 */
export function getListmonkConfig() {
  return {
    url: LISTMONK_CONFIG.URL,
    username: LISTMONK_CONFIG.USERNAME,
    fromEmail: LISTMONK_CONFIG.FROM_EMAIL,
    fromName: LISTMONK_CONFIG.FROM_NAME,
    enabled: LISTMONK_CONFIG.ENABLED,
  };
}

/**
 * Create Basic Auth header for Listmonk API
 */
function getAuthHeader(): string {
  const credentials = Buffer.from(
    `${LISTMONK_CONFIG.USERNAME}:${LISTMONK_CONFIG.PASSWORD}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Send a transactional email via Listmonk
 *
 * @param to - Recipient email address
 * @param content - Email content (subject, html, text)
 * @param subscriberAttrs - Optional subscriber attributes for template variables
 */
export async function sendViaListmonk(
  to: string,
  content: EmailContent,
  subscriberAttrs?: Record<string, unknown>
): Promise<SendEmailResult> {
  if (!LISTMONK_CONFIG.ENABLED) {
    logger.warn('Listmonk is not enabled, skipping email', { to });
    return {
      success: false,
      error: 'Listmonk is not enabled. Set LISTMONK_ENABLED=true',
    };
  }

  try {
    const payload = {
      subscriber_email: to,
      subscriber_name: subscriberAttrs?.name || '',
      from_email: LISTMONK_CONFIG.FROM_EMAIL,
      subject: content.subject,
      body: content.html,
      alt_body: content.text,
      content_type: 'html',
      // Messenger is the SMTP configuration name in Listmonk
      messenger: 'email',
      // Optional: subscriber attributes for template variables
      data: subscriberAttrs || {},
    };

    const response = await fetch(`${LISTMONK_CONFIG.URL}/api/tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Listmonk API error', {
        status: response.status,
        error: errorText,
        to,
      });
      throw new Error(`Listmonk API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    logger.info('Email sent via Listmonk', { to, subject: content.subject });

    return {
      success: true,
      messageId: result.data?.id || 'listmonk-tx',
    };
  } catch (error) {
    logger.error('Listmonk send error', { error, to });
    throw error;
  }
}

/**
 * Test Listmonk connection
 */
export async function testListmonkConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${LISTMONK_CONFIG.URL}/api/health`, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
      },
    });

    if (response.ok) {
      return { success: true };
    }

    return {
      success: false,
      error: `Listmonk health check failed: ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Subscribe an email to a list in Listmonk
 *
 * @param email - Email address
 * @param name - Subscriber name
 * @param listIds - List IDs to subscribe to
 */
export async function subscribeToList(
  email: string,
  name: string,
  listIds: number[]
): Promise<{ success: boolean; error?: string }> {
  if (!LISTMONK_CONFIG.ENABLED) {
    return { success: false, error: 'Listmonk is not enabled' };
  }

  try {
    const response = await fetch(`${LISTMONK_CONFIG.URL}/api/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify({
        email,
        name,
        status: 'enabled',
        lists: listIds,
        preconfirm_subscriptions: false, // Will send confirmation email
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Check if subscriber already exists
      if (response.status === 409) {
        return { success: true }; // Already subscribed
      }
      return {
        success: false,
        error: `Failed to subscribe: ${errorText}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Subscription failed',
    };
  }
}
