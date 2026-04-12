import { z } from 'zod';

// Newsletter subscription schema
export const NewsletterSubscribeSchema = z.object({
  email: z.string()
    .email('Bitte gib eine gültige E-Mail-Adresse ein')
    .transform(email => email.toLowerCase().trim()),
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
