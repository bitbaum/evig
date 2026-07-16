/**
 * Error message constants
 *
 * Single Source of Truth for all user-facing error messages
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

import { TECHNICIAN_LABEL, technicianNotFoundMessage } from '@/config/terminology'

export const ERROR_MESSAGES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'Nicht authentifiziert',
  ADMIN_REQUIRED: 'Nur Administratoren haben Zugriff',
  AUTHENTICATION_REQUIRED: 'Authentifizierung erforderlich',

  // Not Found
  NOT_FOUND: 'nicht gefunden',
  CONVERSATION_NOT_FOUND: 'Unterhaltung nicht gefunden',
  PRODUCT_NOT_FOUND: 'Produkt nicht gefunden',
  USER_NOT_FOUND: 'Benutzer nicht gefunden',
  APPOINTMENT_NOT_FOUND: 'Termin nicht gefunden',
  DOCUMENT_NOT_FOUND: 'Dokument nicht gefunden',
  CERTIFICATION_NOT_FOUND: 'Zertifizierung nicht gefunden',
  CERTIFICATION_ALREADY_VERIFIED: 'Diese Zertifizierung wurde bereits verifiziert',
  WORKSHOP_NOT_FOUND: 'Workshop nicht gefunden',
  LOCATION_NOT_FOUND: 'Ort nicht gefunden',
  REPAIRER_NOT_FOUND: technicianNotFoundMessage(),
  REVIEW_NOT_FOUND: 'Bewertung nicht gefunden',
  LISTING_NOT_FOUND: 'Inserat nicht gefunden',
  REPORT_NOT_FOUND: 'Meldung nicht gefunden',
  IT_HILFE_REQUEST_NOT_FOUND: 'IT-Hilfe-Anfrage nicht gefunden',
  HELPER_NOT_FOUND: 'Techniker nicht gefunden',
  INTAKE_ITEM_NOT_FOUND: 'Gerät nicht gefunden',
  INTAKE_CHECKLIST_INCOMPLETE: 'Checkliste nicht vollständig — alle Pflichtpunkte müssen bestanden sein',
  INTAKE_CHECKLIST_FAILED: 'Prüfung fehlgeschlagen — Problem beheben und erneut prüfen, oder Stufe ändern',
  INTAKE_QC_REQUIRED: 'Dieses Gerät benötigt eine Qualitätskontrolle — Prüfung im Geräte-Eingang starten',
  INTAKE_ALREADY_PUBLISHED: 'Gerät ist bereits im Shop veröffentlicht',
  INTAKE_INVALID_CHECKLIST_ITEM: 'Ungültiger Checklist-Eintrag',
  INTAKE_FAIL_NOTES_REQUIRED: 'Bei „Fehlgeschlagen“ ist eine Begründung erforderlich',
  REPAIRER_APPLICATION_NOT_FOUND: `${TECHNICIAN_LABEL}-Bewerbung nicht gefunden`,
  WORKSHOP_PROPOSAL_NOT_FOUND: 'Workshop-Vorschlag nicht gefunden',
  POOL_NOT_FOUND: 'Pool nicht gefunden',
  DIENSTLEISTUNG_NOT_FOUND: 'Dienstleistung nicht gefunden',

  // Validation
  VALIDATION_FAILED: 'Validierung fehlgeschlagen',
  VALIDATION_ERROR: 'Validierungsfehler',
  PROTOCOL_ID_REQUIRED: 'Protokoll-ID erforderlich',
  ID_REQUIRED: 'ID erforderlich',
  PROJECT_ID_REQUIRED: 'Projekt-ID erforderlich',
  DECISION_ID_REQUIRED: 'Entscheidungs-ID erforderlich',
  TASK_ID_REQUIRED: 'Task-ID erforderlich',
  INVALID_REQUEST_ID: 'Ungültige Anfrage-ID',
  NO_FIELDS_TO_UPDATE: 'Keine Felder zum Aktualisieren',
  NO_VALID_FIELDS: 'Keine gültigen Felder zum Aktualisieren',
  NO_CHANGES_SPECIFIED: 'Keine Änderungen angegeben',
  INVALID_FILTER_PARAMS: 'Ungültige Filterparameter',
  INVALID_ACTION: 'Ungültige Aktion',
  INVALID_REQUEST: 'Ungültige Anfrage',
  INVALID_ID: 'Ungültige ID',
  ORDER_ID_REQUIRED: 'Bestell-ID fehlt',
  POOL_ID_REQUIRED: 'Pool-ID fehlt',
  NO_AUDIO_RECEIVED: 'Keine Audiodatei empfangen',
  EMAIL_REQUIRED: 'E-Mail erforderlich',
  EMAIL_PASSWORD_REQUIRED: 'E-Mail und Passwort sind erforderlich',
  ALL_FIELDS_REQUIRED: 'Alle erforderlichen Felder müssen ausgefüllt sein',
  ADMIN_NOTES_MUST_BE_STRING: 'Admin-Notizen müssen ein Text sein',
  REJECTION_REASON_REQUIRED: 'Ein Ablehnungsgrund ist erforderlich',
  PRODUCT_ID_REQUIRED: 'Produkt-ID erforderlich',

  // Server Errors
  INTERNAL_SERVER_ERROR: 'Interner Serverfehler',
  DB_CONNECTION_FAILED: 'Datenbankverbindung fehlgeschlagen. Bitte versuche es später erneut.',
  UNEXPECTED_ERROR: 'Ein unerwarteter Fehler ist aufgetreten',
  RATE_LIMITED: 'Zu viele Anfragen. Bitte versuche es später erneut.',
  RATE_LIMITED_REGISTRATION: 'Zu viele Registrierungsversuche. Bitte versuche es später erneut.',
  RATE_LIMITED_VERIFICATION: 'Zu viele Versuche. Bitte versuche es später erneut.',
  PRODUCT_LOAD_FAILED: 'Fehler beim Laden des Produkts',
  PRODUCT_UPDATE_FAILED: 'Fehler beim Aktualisieren des Produkts',
  EXTRACTION_FAILED: 'Extraktionsfehler',
  INVALID_INPUT: 'Ungültige Eingabe',
  STATUS_CHECK_FAILED: 'Statusprüfung fehlgeschlagen',

  // Workshops
  WORKSHOP_PROPOSALS_LOAD_FAILED: 'Fehler beim Laden der Workshop-Vorschläge',
  ALREADY_REGISTERED_WORKSHOP: 'Bereits für diesen Workshop angemeldet',
  NO_WORKSHOP_INSTANCES: 'Aktuell sind keine Termine für diesen Workshop verfügbar',
  NETWORK_ERROR: 'Netzwerkfehler',
  PENDING_APPLICATION: 'Du hast bereits eine ausstehende Bewerbung',

  // Protocols
  PROTOCOL_NOT_FOUND: 'Protokoll nicht gefunden',
  PROTOCOL_CREATE_FAILED: 'Fehler beim Erstellen des Protokolls',
  PROTOCOL_NOT_EDITABLE: 'Protokoll kann in diesem Status nicht bearbeitet werden',
  TRANSCRIPT_TOO_SHORT: 'Transkript zu kurz (mindestens 50 Zeichen)',
  PROCESSING_FAILED: 'Fehler bei der KI-Verarbeitung des Transkripts',
  NOTES_PROCESSING_FAILED: 'Fehler bei der KI-Verarbeitung der Notizen',
  TASKS_PROCESSING_FAILED: 'Fehler bei der KI-Verarbeitung der Aufgabenliste',

  // Decisions
  DECISION_NOT_FOUND: 'Entscheidung nicht gefunden',
  DECISION_CREATE_FAILED: 'Fehler beim Erstellen der Entscheidung',
  DECISION_UPDATE_FAILED: 'Fehler beim Aktualisieren der Entscheidung',
  DECISION_NOT_EDITABLE: 'Entscheidung kann in diesem Status nicht bearbeitet werden',
  DECISION_INVALID_TRANSITION: 'Ungültiger Statusübergang',
  INVALID_STATUS_TRANSITION: 'Ungültiger Statuswechsel',
  VOTE_NOT_IN_VOTING_PHASE: 'Abstimmung ist nicht in der Abstimmungsphase',
  VOTE_NOT_PARTICIPANT: 'Nicht zur Teilnahme an dieser Abstimmung berechtigt',
  VOTE_INVALID_DATA: 'Ungültige Abstimmungsdaten',
  VOTE_SUBMIT_FAILED: 'Fehler beim Abgeben der Stimme',
  VOTE_DATA_REQUIRED: 'Stimmdaten erforderlich',
  VOTE_NOT_PUBLIC: 'Diese Abstimmung ist nicht öffentlich. Bitte melde dich mit einem registrierten Konto an.',
  DECISION_NOT_ACTIVE: 'Entscheidung nicht gefunden oder nicht aktiv',
  VOTE_NOT_IN_VOTING_PHASE_PUBLIC: 'Diese Abstimmung läuft gerade nicht',
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
  REPAIRER_APPLICATION_SUBMITTED: 'Ihre Bewerbung wurde erfolgreich eingereicht! Du erhältst in Kürze eine E-Mail mit weiteren Informationen.',
  APPOINTMENT_BOOKED: 'Termin erfolgreich gebucht!',

  // Protocols
  PROTOCOL_FINALIZED: 'Protokoll abgeschlossen',

  // Workshops
  WORKSHOP_REGISTERED: 'Erfolgreich für Workshop angemeldet',
} as const;
