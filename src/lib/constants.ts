/**
 * Application-wide constants
 *
 * Centralizes magic numbers and commonly used values
 * for better maintainability and consistency.
 */

// Languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italiano' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pl', name: 'Polski' },
] as const;

// UI & Layout
export const UI = {
  /** Max characters for text truncation */
  MAX_CHARS_TRUNCATE: 100,

  /** Default page size for pagination */
  DEFAULT_PAGE_SIZE: 10,

  /** Maximum file size in bytes (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Debounce delay in milliseconds */
  DEBOUNCE_DELAY: 300,

  /** Toast notification duration in milliseconds */
  TOAST_DURATION: 3000,

  /** Animation duration in milliseconds */
  ANIMATION_DURATION: 200,

  /** Stagger delay for list animations in milliseconds */
  STAGGER_DELAY: 50,
} as const;

// Data Limits
export const LIMITS = {
  /** Maximum recent activity items to display */
  MAX_RECENT_ACTIVITY: 10,

  /** Maximum notifications to fetch */
  MAX_NOTIFICATIONS: 50,

  /** Maximum messages to display before pagination */
  MAX_MESSAGES_PER_PAGE: 50,

  /** Maximum participants per transaction */
  MAX_PARTICIPANTS: 20,
} as const;

// Timeouts & Intervals
export const TIMEOUTS = {
  /** API request timeout in milliseconds */
  API_TIMEOUT: 30000,

  /** Polling interval for real-time updates in milliseconds */
  POLLING_INTERVAL: 5000,

  /** Cache TTL in milliseconds (15 minutes) */
  CACHE_TTL: 15 * 60 * 1000,

  /** Session check interval in milliseconds */
  SESSION_CHECK_INTERVAL: 60000,
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Database
export const DB = {
  /** Supabase PGRST error code for not found */
  ERROR_CODE_NOT_FOUND: 'PGRST116',

  /** Default order by direction */
  DEFAULT_ORDER: 'created_at' as const,

  /** Default ordering direction */
  DEFAULT_DIRECTION: 'desc' as const,
} as const;

// Feature Flags
export const FEATURES = {
  /** Enable real-time subscriptions */
  ENABLE_REALTIME: true,

  /** Enable email notifications */
  ENABLE_EMAIL_NOTIFICATIONS: true,

  /** Enable SMS notifications */
  ENABLE_SMS_NOTIFICATIONS: false,

  /** Enable analytics tracking */
  ENABLE_ANALYTICS: false,
} as const;

// Validation
export const VALIDATION = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,

  /** Maximum file name length */
  MAX_FILE_NAME_LENGTH: 255,

  /** Maximum transaction title length */
  MAX_TITLE_LENGTH: 200,

  /** Maximum message length */
  MAX_MESSAGE_LENGTH: 5000,
} as const;
