import { z } from 'zod';

// Email validation (RFC 5322 compliant)
const emailSchema = z.string()
  .email('Bitte geben Sie eine gueltige E-Mail-Adresse ein')
  .transform(email => email.toLowerCase().trim());

// Password requirements
const passwordSchema = z.string()
  .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
  .max(128, 'Passwort darf maximal 128 Zeichen lang sein')
  .regex(/[A-Z]/, 'Passwort muss mindestens einen Grossbuchstaben enthalten')
  .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
  .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten');

// User roles
export const UserRoleSchema = z.enum(['customer', 'seller', 'technician', 'staff']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Registration schema
export const RegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string()
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(100, 'Name darf maximal 100 Zeichen lang sein')
    .optional(),
  role: UserRoleSchema.optional().default('customer'),
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
  message: 'Passwoerter stimmen nicht ueberein',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// Change password schema
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwoerter stimmen nicht ueberein',
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
