import { z } from 'zod';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { REGISTRATION_ROLES } from '@/config/registration';

// Email validation (RFC 5322 compliant)
const emailSchema = z.string()
  .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
  .transform(email => email.toLowerCase().trim());

// ============================================================================
// PASSWORD SCHEMA - Derived from AUTH_CONFIG (SSOT)
// ============================================================================

/**
 * Create password schema from AUTH_CONFIG
 * This ensures schema matches the config - no duplicate definitions
 */
function createPasswordSchema() {
  const { minLength, maxLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, specialChars } = AUTH_CONFIG.password;

  let schema = z.string()
    .min(minLength, `Passwort muss mindestens ${minLength} Zeichen lang sein`)
    .max(maxLength, `Passwort darf maximal ${maxLength} Zeichen lang sein`);

  if (requireUppercase) {
    schema = schema.regex(/[A-Z]/, 'Passwort muss mindestens einen Grossbuchstaben enthalten');
  }
  if (requireLowercase) {
    schema = schema.regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten');
  }
  if (requireNumbers) {
    schema = schema.regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten');
  }
  if (requireSpecialChars) {
    // Escape special regex characters in the specialChars string
    const escapedChars = specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    schema = schema.regex(new RegExp(`[${escapedChars}]`), 'Passwort muss mindestens ein Sonderzeichen enthalten');
  }

  return schema;
}

const passwordSchema = createPasswordSchema();

// ============================================================================
// ROLE SCHEMA - Derived from REGISTRATION_ROLES (SSOT)
// ============================================================================

/**
 * Registration role schema - derived from config
 * Used for validating role during registration
 */
export const RegistrationRoleSchema = z.enum(REGISTRATION_ROLES);
export type RegistrationRoleType = z.infer<typeof RegistrationRoleSchema>;

// Legacy user role schema for backward compatibility
export const UserRoleSchema = z.enum(['customer', 'seller', 'repairer', 'staff']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Registration schema
export const RegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string()
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(100, 'Name darf maximal 100 Zeichen lang sein')
    .optional(),
  role: RegistrationRoleSchema.optional().default('customer'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// Login schema
export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Passwort ist erforderlich'),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Forgot password schema
export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

// Reset password schema
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// Change password schema
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// Verify code schema
export const VerifyCodeSchema = z.object({
  email: emailSchema,
  code: z.string()
    .length(6, 'Code muss 6 Zeichen lang sein')
    .regex(/^\d+$/, 'Code darf nur Zahlen enthalten'),
});

export type VerifyCodeInput = z.infer<typeof VerifyCodeSchema>;

// Resend code schema
export const ResendCodeSchema = z.object({
  email: emailSchema,
});

export type ResendCodeInput = z.infer<typeof ResendCodeSchema>;

// Verify email token schema (for token-based email verification)
export const VerifyEmailTokenSchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich'),
});

export type VerifyEmailTokenInput = z.infer<typeof VerifyEmailTokenSchema>;
