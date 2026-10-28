import { z } from 'zod';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@bitbaum/accountkit/auth/password';

// Email validation (RFC 5322 compliant)
const emailSchema = z
  .string()
  .email('Bitte gib eine gültige E-Mail-Adresse ein')
  .transform((email) => email.toLowerCase().trim());

// The one bitbaum password rule (@bitbaum/accountkit/auth/password): not empty,
// at most 128 characters. No complexity, no other minimum.
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, 'Passwort ist erforderlich')
  .max(MAX_PASSWORD_LENGTH, `Passwort darf maximal ${MAX_PASSWORD_LENGTH} Zeichen lang sein`);

// Legacy user role schema for backward compatibility
// (still used by some admin-facing flows; not by registration anymore)
export const UserRoleSchema = z.enum(['customer', 'seller', 'repairer', 'staff']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Registration schema
// Note: no `role` field. Every new account is a regular customer; staff is
// never derived from the email domain (an @revamp-it.ch address proves only
// that the registrant can receive mail there). Staff is granted explicitly
// by a super admin or the HR hire flow — see registerUser in src/auth.ts.
export const RegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(100, 'Name darf maximal 100 Zeichen lang sein')
    .optional(),
  referralCode: z.string().optional(),
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
export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token ist erforderlich'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// Change password schema
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// Verify code schema
export const VerifyCodeSchema = z.object({
  email: emailSchema,
  code: z
    .string()
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
