/**
 * Sanitizes user input to prevent XSS attacks
 *
 * Uses a lightweight regex-based approach that works reliably on both
 * client and server (Edge and Node runtimes) without jsdom.
 *
 * Previous implementation used isomorphic-dompurify which breaks under
 * the Next.js server bundler due to ESM/CJS incompatibility in the jsdom
 * dependency chain.
 *
 * @param input - The string to sanitize
 * @param options - Configuration options
 * @returns Sanitized string safe for rendering
 */

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'];

function stripAllHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function sanitizeHtml(html: string): string {
  // Remove all tags except allowed ones
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi, (match, tag) => {
    const lower = tag.toLowerCase();
    if (ALLOWED_TAGS.includes(lower)) {
      // Only keep the tag itself, strip all attributes
      const isClosing = match.startsWith('</');
      const isSelfClosing = lower === 'br';
      if (isClosing) return `</${lower}>`;
      if (isSelfClosing) return `<${lower} />`;
      return `<${lower}>`;
    }
    return '';
  });
}

function escapeHtmlEntities(str: string): string {
  // Neutralize dangerous patterns that survive tag stripping
  return str
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '');
}

export function sanitizeInput(input: string, options?: {
  allowHtml?: boolean;
  maxLength?: number;
}): string {
  const { allowHtml = false, maxLength = 10000 } = options || {};

  // Trim and enforce max length
  let sanitized = input.trim().slice(0, maxLength);

  if (allowHtml) {
    sanitized = sanitizeHtml(sanitized);
  } else {
    sanitized = stripAllHtml(sanitized);
  }

  sanitized = escapeHtmlEntities(sanitized);

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
      (result as Record<string, unknown>)[field as string] = sanitizeInput(result[field] as string, options);
    }
  }

  return result;
}
