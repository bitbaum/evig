import { z } from 'zod';

// Newsletter subscription schema
//
// `name` and `source` were silently dropped at the schema layer for a while —
// the component's name input collected the value, the client sent it, then
// Zod's default strip-unknown behavior threw it away before the route could
// see it. Adding them here is what makes the form's name field actually mean
// something (it flows through to Listmonk for personalised mail).
export const NewsletterSubscribeSchema = z.object({
  email: z.string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein')
    .transform(email => email.toLowerCase().trim()),
  name: z.string().trim().min(1).max(100).optional(),
  source: z.string().trim().min(1).max(50).optional(),
});

export type NewsletterSubscribeInput = z.infer<typeof NewsletterSubscribeSchema>;

// Newsletter confirmation schema
export const NewsletterConfirmSchema = z.object({
  token: z.string()
    .min(32, 'Ungültiger Bestätigungstoken')
    .max(128, 'Ungültiger Bestätigungstoken'),
});

export type NewsletterConfirmInput = z.infer<typeof NewsletterConfirmSchema>;

// Newsletter unsubscribe schema
export const NewsletterUnsubscribeSchema = z.object({
  email: z.string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein')
    .transform(email => email.toLowerCase().trim()),
  token: z.string().optional(),
});

export type NewsletterUnsubscribeInput = z.infer<typeof NewsletterUnsubscribeSchema>;
