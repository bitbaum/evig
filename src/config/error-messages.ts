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
  REPAIRER_ONLY: 'Nur Reparateure können diesen Bereich nutzen',

  // Workshops
  WORKSHOP_PROPOSALS_LOAD_FAILED: 'Fehler beim Laden der Workshop-Vorschläge',
  WORKSHOP_APPROVAL_FAILED: 'Fehler bei der Workshop-Genehmigung',
  NETWORK_ERROR: 'Netzwerkfehler',
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

  // Protocols
  PROTOCOL_NOT_FOUND: 'Protokoll nicht gefunden',
  PROTOCOL_CREATE_FAILED: 'Fehler beim Erstellen des Protokolls',
  PROTOCOL_NOT_EDITABLE: 'Protokoll kann in diesem Status nicht bearbeitet werden',
  TRANSCRIPT_TOO_SHORT: 'Transkript zu kurz (mindestens 50 Zeichen)',
  PROCESSING_FAILED: 'Fehler bei der KI-Verarbeitung des Transkripts',
  NOTES_PROCESSING_FAILED: 'Fehler bei der KI-Verarbeitung der Notizen',
  TASKS_PROCESSING_FAILED: 'Fehler bei der KI-Verarbeitung der Aufgabenliste',
  INVALID_JSON_FORMAT: 'Ungültiges JSON-Format',

  // Decisions
  DECISION_NOT_FOUND: 'Entscheidung nicht gefunden',
  DECISION_CREATE_FAILED: 'Fehler beim Erstellen der Entscheidung',
  DECISION_UPDATE_FAILED: 'Fehler beim Aktualisieren der Entscheidung',
  DECISION_NOT_EDITABLE: 'Entscheidung kann in diesem Status nicht bearbeitet werden',
  DECISION_INVALID_TRANSITION: 'Ungültiger Statusübergang',
  VOTE_NOT_IN_VOTING_PHASE: 'Abstimmung ist nicht in der Abstimmungsphase',
  VOTE_NOT_PARTICIPANT: 'Nicht zur Teilnahme an dieser Abstimmung berechtigt',
  VOTE_INVALID_DATA: 'Ungültige Abstimmungsdaten',
  VOTE_SUBMIT_FAILED: 'Fehler beim Abgeben der Stimme',
  COMMENT_NOT_FOUND: 'Kommentar nicht gefunden',
  COMMENT_NOT_AUTHOR: 'Nur der Autor kann diesen Kommentar bearbeiten',
  COMMENT_CREATE_FAILED: 'Fehler beim Erstellen des Kommentars',

  // Decision Voting (Protocol)
  VOTE_FAILED: 'Fehler bei der Abstimmung',
  DECISION_ALREADY_CLOSED: 'Abstimmung ist bereits geschlossen',
  DECISION_NOT_APPROVED: 'Entscheidung wurde nicht angenommen',
  TASKS_ALREADY_CREATED: 'Aufgaben wurden bereits erstellt',
  AI_PROPOSAL_FAILED: 'KI-Vorschlag fehlgeschlagen',
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

  // Protocols
  PROTOCOL_CREATED: 'Protokoll erfolgreich erstellt',
  PROTOCOL_FINALIZED: 'Protokoll abgeschlossen',
  ACTION_LINKED: 'Aufgabe erfolgreich verknüpft',
  NOTES_PROCESSED: 'Notizen erfolgreich verarbeitet',
  TASKS_IMPORTED: 'Aufgaben erfolgreich importiert',

  // Decisions
  DECISION_CREATED: 'Entscheidung erfolgreich erstellt',
  DECISION_UPDATED: 'Entscheidung erfolgreich aktualisiert',
  DECISION_TRANSITIONED: 'Status erfolgreich geändert',
  VOTE_SUBMITTED: 'Stimme erfolgreich abgegeben',
  COMMENT_CREATED: 'Kommentar erfolgreich erstellt',
  COMMENT_UPDATED: 'Kommentar erfolgreich aktualisiert',
  COMMENT_DELETED: 'Kommentar erfolgreich gelöscht',

  // Decision Voting (Protocol)
  VOTE_RECORDED: 'Stimme abgegeben',
  VOTE_REMOVED: 'Stimme zurückgezogen',
  DECISION_CLOSED: 'Abstimmung geschlossen',
  TASKS_PROPOSED: 'Aufgabenvorschläge generiert',
  TASKS_BULK_CREATED: 'Aufgaben erstellt',
} as const;
