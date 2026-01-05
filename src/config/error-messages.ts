/**
 * Error message constants
 * 
 * Single Source of Truth for all user-facing error messages
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

export const ERROR_MESSAGES = {
  // Authentication
  UNAUTHORIZED: 'Nicht authentifiziert',
  FORBIDDEN: 'Keine Berechtigung',
  ADMIN_REQUIRED: 'Admin access required',
  
  // Not Found
  NOT_FOUND: 'nicht gefunden',
  CONVERSATION_NOT_FOUND: 'Unterhaltung nicht gefunden',
  SERVICE_NOT_FOUND: 'Service nicht gefunden',
  PRODUCT_NOT_FOUND: 'Produkt nicht gefunden',
  USER_NOT_FOUND: 'Benutzer nicht gefunden',
  APPOINTMENT_NOT_FOUND: 'Termin nicht gefunden',
  
  // Validation
  EMAIL_REQUIRED: 'E-Mail erforderlich',
  PASSWORD_REQUIRED: 'Passwort erforderlich',
  EMAIL_PASSWORD_REQUIRED: 'E-Mail und Passwort sind erforderlich',
  MESSAGE_REQUIRED: 'Nachricht erforderlich',
  SERVICE_SLUG_REQUIRED: 'Service-Slug erforderlich',
  ALL_FIELDS_REQUIRED: 'Alle erforderlichen Felder müssen ausgefüllt sein',
  IMAGE_REQUIRED: 'Image data or URL required',
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 'Interner Serverfehler',
  REGISTRATION_FAILED: 'Ein unerwarteter Fehler ist aufgetreten',
  STATUS_CHECK_FAILED: 'Statusprüfung fehlgeschlagen',
  
  // Business Logic
  SELLER_ONLY: 'Nur Verkäufer können Produkte erstellen',
  ALREADY_APPROVED: 'Sie sind bereits als Verkäufer zugelassen',
  PENDING_APPLICATION: 'Sie haben bereits eine ausstehende Bewerbung',
  CANNOT_CANCEL_COMPLETED: 'Abgeschlossene Termine können nicht storniert werden',
  CAN_ONLY_EDIT_REQUESTED: 'Nur angefragte Termine können bearbeitet werden',
  
  // Medusa/External Services
  MEDUSA_FETCH_FAILED: 'Failed to fetch products from Medusa',
  MEDUSA_CONNECTION_FAILED: 'Failed to connect to Medusa backend',
  MEDUSA_CREATE_FAILED: 'Failed to create product',
  AI_ANALYSIS_FAILED: 'Failed to analyze product image',
  
  // Configuration
  CONFIGURATION_MISSING: 'Medusa configuration is missing',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  ACCOUNT_CREATED: 'Konto erfolgreich erstellt',
  REGISTRATION_SUBMITTED: 'Ihre Bewerbung wurde erfolgreich eingereicht',
  SELLER_APPLICATION_SUBMITTED: 'Ihre Bewerbung wurde erfolgreich eingereicht. Sie erhalten in Kürze eine Bestätigung per E-Mail.',
  REPAIRER_APPLICATION_SUBMITTED: 'Ihre Bewerbung wurde erfolgreich eingereicht! Sie erhalten in Kürze eine E-Mail mit weiteren Informationen.',
  APPOINTMENT_REQUESTED: 'Terminanfrage eingereicht. Wir kontaktieren Sie bald für die Terminbestätigung.',
  APPOINTMENT_BOOKED: 'Termin erfolgreich gebucht!',
  APPOINTMENT_CANCELLED: 'Termin erfolgreich storniert',
} as const;
