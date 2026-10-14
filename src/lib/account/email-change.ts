/**
 * Pending login-address change.
 *
 * The code lives in verification_tokens under an identifier that is NOT the
 * email, so it does not wipe a password-reset or signup code for that inbox.
 * Token shape: "123456:new.address@example.com"
 */

const CODE_LENGTH = 6;

export function emailChangeIdentifier(userId: string): string {
  return `email-change:${userId}`;
}

export function packEmailChangeToken(code: string, newEmail: string): string {
  return `${code}:${newEmail}`;
}

export function unpackEmailChangeToken(token: string): { code: string; newEmail: string } | null {
  const splitAt = token.indexOf(':');
  if (splitAt !== CODE_LENGTH) return null;
  const code = token.slice(0, CODE_LENGTH);
  const newEmail = token.slice(CODE_LENGTH + 1).toLowerCase();
  if (!/^\d{6}$/.test(code)) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return null;
  return { code, newEmail };
}

export function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}
