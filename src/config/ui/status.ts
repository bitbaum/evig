/**
 * Semantic status color classes.
 *
 * This is the shared presentation SSOT for status badges. Domain configs may
 * map a business state to one of these semantic statuses, but should not
 * repeat Tailwind color strings.
 */

export const UI_STATUS = {
  success: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
  danger: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300',
  info: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
  neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
} as const

export type UiStatusKey = keyof typeof UI_STATUS
