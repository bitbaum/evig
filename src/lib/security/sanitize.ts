import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 *
 * @param input - The string to sanitize
 * @param options - Configuration options
 * @returns Sanitized string safe for rendering
 */
export function sanitizeInput(input: string, options?: {
  allowHtml?: boolean;
  maxLength?: number;
}): string {
  const { allowHtml = false, maxLength = 10000 } = options || {};

  // Trim and enforce max length
  let sanitized = input.trim().slice(0, maxLength);

  if (allowHtml) {
    // For descriptions (allow safe HTML formatting)
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    });
  } else {
    // For titles, names (strip all HTML)
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true
    });
  }

  return sanitized;
}

/**
 * Sanitize an object of string fields
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fields: Array<keyof T>,
  options?: { allowHtml?: boolean; maxLength?: number }
): T {
  const result = { ...obj };

  for (const field of fields) {
    if (typeof result[field] === 'string') {
      result[field] = sanitizeInput(result[field] as string, options) as any;
    }
  }

  return result;
}
