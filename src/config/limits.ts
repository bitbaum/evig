/** File size limits in bytes */
export const FILE_SIZE_LIMITS = {
  UPLOAD_MAX: 10 * 1024 * 1024,        // 10MB - general uploads
  AVATAR_MAX: 5 * 1024 * 1024,         // 5MB - profile avatars
  CSV_MAX: 5 * 1024 * 1024,            // 5MB - CSV imports
  AUDIO_MAX: 25 * 1024 * 1024,         // 25MB - audio files
} as const

/** Time durations in milliseconds */
export const TIME_DURATIONS = {
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  ONE_DAY_S: 24 * 60 * 60,
  SEVEN_DAYS_MS: 7 * 24 * 60 * 60 * 1000,
} as const

/** UI feedback timeouts in milliseconds — how long transient states stay visible */
export const UI_FEEDBACK_MS = {
  /** "Saved" / "Success" confirmation banners */
  SUCCESS: 3000,
  /** Delay before redirecting after a successful form save (long enough to read the banner) */
  REDIRECT: 1500,
  /** "Copied to clipboard" confirmation */
  COPY: 2000,
  /** Link-copied indicator (slightly longer — gives time to paste) */
  LINK_COPY: 2500,
  /** Notification / result banners that auto-dismiss */
  NOTIFICATION: 6000,
} as const
