/**
 * Error message constants
 * 
 * Single Source of Truth for all user-facing error messages
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

export const ERROR_MESSAGES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'Nicht authentifiziert',
  FORBIDDEN: 'Keine Berechtigung',
  ADMIN_REQUIRED: 'Nur Administratoren haben Zugriff',
  STAFF_ONLY: 'Nur Mitarbeiter können diese Aktion ausführen',

  // Section-specific access (repeated 3+ times across routes)
  NO_ACCESS_TEAM: 'Kein Zugriff auf Team-Bereich',
  NO_ACCESS_HIRN: 'Keine Berechtigung für Hirn',
  NO_ACCESS_ERFASSUNG: 'Keine Berechtigung für Produkterfassung',
  NO_ACCESS_CONTENT: 'Keine Berechtigung für diesen Bereich',

  // Not Found
  NOT_FOUND: 'nicht gefunden',
  CONVERSATION_NOT_FOUND: 'Unterhaltung nicht gefunden',
  SERVICE_NOT_FOUND: 'Service nicht gefunden',
  PRODUCT_NOT_FOUND: 'Produkt nicht gefunden',
  USER_NOT_FOUND: 'Benutzer nicht gefunden',
  APPOINTMENT_NOT_FOUND: 'Termin nicht gefunden',
  DOCUMENT_NOT_FOUND: 'Dokument nicht gefunden',
  CERTIFICATION_NOT_FOUND: 'Zertifizierung nicht gefunden',
  APPLICATION_NOT_FOUND: 'Bewerbung nicht gefunden',
  WORKSHOP_NOT_FOUND: 'Workshop nicht gefunden',
  LOCATION_NOT_FOUND: 'Ort nicht gefunden',
  LISTING_NOT_FOUND: 'Inserat nicht gefunden',
  REPORT_NOT_FOUND: 'Meldung nicht gefunden',
  IT_HILFE_REQUEST_NOT_FOUND: 'IT-Hilfe-Anfrage nicht gefunden',
  HELPER_NOT_FOUND: 'Techniker nicht gefunden',
  INTAKE_ITEM_NOT_FOUND: 'Gerät nicht gefunden',
  INTAKE_CHECKLIST_INCOMPLETE: 'Checkliste nicht vollständig — alle Pflichtpunkte müssen abgehakt sein',
  INTAKE_ALREADY_PUBLISHED: 'Gerät ist bereits im Shop veröffentlicht',
  INTAKE_INVALID_CHECKLIST_ITEM: 'Ungültiger Checklist-Eintrag',

  // Validation
  VALIDATION_FAILED: 'Validierung fehlgeschlagen',
  PROTOCOL_ID_REQUIRED: 'Protokoll-ID erforderlich',
  ID_REQUIRED: 'ID erforderlich',
  PROJECT_ID_REQUIRED: 'Projekt-ID erforderlich',
  DECISION_ID_REQUIRED: 'Entscheidungs-ID erforderlich',
  TASK_ID_REQUIRED: 'Task-ID erforderlich',
  INVALID_REQUEST_ID: 'Ungültige Anfrage-ID',
  NO_FIELDS_TO_UPDATE: 'Keine Felder zum Aktualisieren',
  NO_CHANGES_SPECIFIED: 'Keine Änderungen angegeben',
  INVALID_FILTER_PARAMS: 'Ungültige Filterparameter',
  EMAIL_REQUIRED: 'E-Mail erforderlich',
  PASSWORD_REQUIRED: 'Passwort erforderlich',
  EMAIL_PASSWORD_REQUIRED: 'E-Mail und Passwort sind erforderlich',
  MESSAGE_REQUIRED: 'Nachricht erforderlich',
  SERVICE_SLUG_REQUIRED: 'Service-Slug erforderlich',
  ALL_FIELDS_REQUIRED: 'Alle erforderlichen Felder müssen ausgefüllt sein',
  IMAGE_REQUIRED: 'Bilddaten oder URL erforderlich',
  ADMIN_NOTES_MUST_BE_STRING: 'Admin-Notizen müssen ein Text sein',
  REJECTION_REASON_REQUIRED: 'Ein Ablehnungsgrund ist erforderlich',

  // Server Errors
  INTERNAL_SERVER_ERROR: 'Interner Serverfehler',
  REGISTRATION_FAILED: 'Ein unerwarteter Fehler ist aufgetreten',
  STATUS_CHECK_FAILED: 'Statusprüfung fehlgeschlagen',

  // Business Logic
  SELLER_ONLY: 'Nur Verkäufer können Produkte erstellen',
  REPAIRER_ONLY: 'Nur Techniker können diesen Bereich nutzen',

  // Workshops
  WORKSHOP_PROPOSALS_LOAD_FAILED: 'Fehler beim Laden der Workshop-Vorschläge',
  WORKSHOP_APPROVAL_FAILED: 'Fehler bei der Workshop-Genehmigung',
  ALREADY_REGISTERED_WORKSHOP: 'Bereits für diesen Workshop angemeldet',
  NO_WORKSHOP_INSTANCES: 'Aktuell sind keine Termine für diesen Workshop verfügbar',
  NETWORK_ERROR: 'Netzwerkfehler',
  ALREADY_APPROVED: 'Sie sind bereits als Verkäufer zugelassen',
  PENDING_APPLICATION: 'Du hast bereits eine ausstehende Bewerbung',
  CANNOT_CANCEL_COMPLETED: 'Abgeschlossene Termine können nicht storniert werden',
  CAN_ONLY_EDIT_REQUESTED: 'Nur angefragte Termine können bearbeitet werden',

  // External Services (internal, not user-facing)
  AI_ANALYSIS_FAILED: 'KI-Bildanalyse fehlgeschlagen',

  // Configuration
  CONFIGURATION_MISSING: 'Erforderliche Konfiguration fehlt',

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
  SELLER_APPLICATION_SUBMITTED: 'Ihre Bewerbung wurde erfolgreich eingereicht. Du erhältst in Kürze eine Bestätigung per E-Mail.',
  REPAIRER_APPLICATION_SUBMITTED: 'Ihre Bewerbung wurde erfolgreich eingereicht! Du erhältst in Kürze eine E-Mail mit weiteren Informationen.',
  APPOINTMENT_REQUESTED: 'Terminanfrage eingereicht. Wir kontaktieren dich bald für die Terminbestätigung.',
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

  // Workshops
  WORKSHOP_REGISTERED: 'Erfolgreich für Workshop angemeldet',

  // Decision Voting (Protocol)
  VOTE_RECORDED: 'Stimme abgegeben',
  VOTE_REMOVED: 'Stimme zurückgezogen',
  DECISION_CLOSED: 'Abstimmung geschlossen',
  TASKS_PROPOSED: 'Aufgabenvorschläge generiert',
  TASKS_BULK_CREATED: 'Aufgaben erstellt',
} as const;
