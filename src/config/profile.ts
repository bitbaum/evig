/**
 * Profile and Settings Configuration (SSOT)
 *
 * Single Source of Truth for all labels, validation rules, and constants
 * related to user profiles and settings.
 *
 * Ground Truth #2: One source of truth for every piece of data
 */

import { FILE_SIZE_LIMITS } from '@/config/limits'
import { CONTACT } from '@/config/org'

// ============================================================================
// PROFILE CONFIGURATION (Public View)
// ============================================================================

export const PROFILE_CONFIG = {
  labels: {
    // Page header
    pageTitle: 'Profil',
    pageDescription: 'Verwalte dein öffentliches Profil',

    // Avatar section
    avatar: 'Profilbild',
    avatarDescription: 'Dein öffentliches Profilbild',
    uploadAvatar: 'Bild hochladen',
    removeAvatar: 'Bild entfernen',
    changeAvatar: 'Bild ändern',

    // Public profile section
    publicProfile: 'Öffentliches Profil',
    displayName: 'Anzeigename',
    displayNamePlaceholder: 'Wie möchtest du genannt werden?',
    displayNameDescription: 'Dieser Name wird öffentlich angezeigt',

    bio: 'Bio',
    bioPlaceholder: 'Erzähl etwas über dich...',
    bioDescription: 'Kurze Beschreibung über dich (max. 500 Zeichen)',

    profileVisibility: 'Profil-Sichtbarkeit',
    profileVisibilityPublic: 'Öffentlich',
    profileVisibilityPrivate: 'Privat',
    profileVisibilityDescription: 'Bestimme, wer dein Profil sehen kann',

    // Service provider section
    serviceProvider: 'Dienstleister-Profil',
    serviceProviderActive: 'Als Dienstleister aktiv',
    serviceProviderDescription: 'Biete Dienstleistungen auf dem Marktplatz an',

    // Actions
    save: 'Speichern',
    saving: 'Speichert...',
    cancel: 'Abbrechen',

    // Messages
    saveSuccess: 'Profil erfolgreich gespeichert',
    saveError: 'Fehler beim Speichern des Profils',
    uploadSuccess: 'Bild erfolgreich hochgeladen',
    uploadError: 'Fehler beim Hochladen des Bildes',

    // Links
    goToSettings: 'Zu den Einstellungen',
  },

  validation: {
    displayName: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZäöüÄÖÜ\s'-]+$/,
      errorMessages: {
        required: 'Anzeigename ist erforderlich',
        minLength: 'Anzeigename muss mindestens 2 Zeichen lang sein',
        maxLength: 'Anzeigename darf maximal 50 Zeichen lang sein',
        pattern: 'Anzeigename enthält ungültige Zeichen',
      },
    },
    bio: {
      maxLength: 500,
      errorMessages: {
        maxLength: 'Bio darf maximal 500 Zeichen lang sein',
      },
    },
  },

  avatar: {
    maxSizeBytes: FILE_SIZE_LIMITS.AVATAR_MAX,
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'] as const,
    thumbnailSize: 256,
    errorMessages: {
      fileType: 'Nur JPG, PNG und WebP Bilder sind erlaubt',
      fileSize: 'Bild darf maximal 5MB gross sein',
      uploadFailed: 'Upload fehlgeschlagen. Bitte versuche es erneut.',
    },
  },
} as const;

// ============================================================================
// SETTINGS CONFIGURATION (Private Settings)
// ============================================================================

export const SETTINGS_CONFIG = {
  labels: {
    // Page header
    pageTitle: 'Einstellungen',
    pageDescription: 'Verwalte deine Kontoeinstellungen',

    // Tabs
    tabs: {
      account: 'Konto',
      notifications: 'Benachrichtigungen',
      privacy: 'Privatsphäre',
      personalInfo: 'Persönliche Daten',
    },

    // Account tab
    account: {
      title: 'Konto-Verwaltung',
      description: 'Verwalte deine Konto-Informationen',

      name: 'Name',
      firstName: 'Vorname',
      firstNamePlaceholder: 'Dein Vorname',
      lastName: 'Nachname',
      lastNamePlaceholder: 'Dein Nachname',

      email: 'E-Mail',
      emailDescription: 'deine E-Mail-Adresse kann nicht geändert werden',
      emailReadonly: 'E-Mail-Adresse (schreibgeschützt)',

      password: 'Passwort',
      currentPassword: 'Aktuelles Passwort',
      newPassword: 'Neues Passwort',
      confirmPassword: 'Passwort bestätigen',
      changePassword: 'Passwort ändern',
      passwordDescription: 'Ändere dein Passwort für mehr Sicherheit',

      deleteAccount: 'Konto löschen',
      deleteAccountWarning: 'Diese Aktion kann nicht rückgängig gemacht werden',
      deleteAccountButton: 'Konto dauerhaft löschen',
    },

    // Notifications tab
    notifications: {
      title: 'Benachrichtigungs-Einstellungen',
      description: 'Verwalte, wie du benachrichtigt werden möchtest',

      emailNotifications: 'E-Mail-Benachrichtigungen',
      emailNotificationsDescription: 'Erhalte Updates per E-Mail',

      smsNotifications: 'SMS-Benachrichtigungen',
      smsNotificationsDescription: 'Erhalte wichtige Updates per SMS',

      marketplaceUpdates: 'Marktplatz-Updates',
      marketplaceUpdatesDescription: 'Benachrichtigungen über deine Marktplatz-Aktivitäten',

      workshopReminders: 'Workshop-Erinnerungen',
      workshopRemindersDescription: 'Erinnerungen für bevorstehende Workshops',
    },

    // Privacy tab
    privacy: {
      title: 'Privatsphäre-Einstellungen',
      description: 'Kontrolliere, welche Informationen öffentlich sind',

      profileVisibility: 'Profil-Sichtbarkeit',
      profileVisibilityDescription: 'Bestimme, wer dein Profil sehen kann',
      profilePublic: 'Öffentlich',
      profilePrivate: 'Privat',

      contactVisibility: 'Kontaktinformationen',
      contactVisibilityDescription: 'Kontrolliere die Sichtbarkeit deiner Kontaktdaten',

      showEmail: 'E-Mail-Adresse anzeigen',
      showEmailDescription: 'Zeige deine E-Mail auf deinem öffentlichen Profil',

      showPhone: 'Telefonnummer anzeigen',
      showPhoneDescription: 'Zeige deine Telefonnummer auf deinem öffentlichen Profil',
    },

    // Personal Info tab
    personalInfo: {
      title: 'Persönliche Informationen',
      description: 'Verwalte deine persönlichen Daten',

      company: 'Firma',
      companyName: 'Firmenname',
      companyNamePlaceholder: 'Name deiner Firma',

      contact: 'Kontaktinformationen',
      phone: 'Telefon',
      phonePlaceholder: CONTACT.phonePlaceholderLandline,
      mobile: 'Mobile',
      mobilePlaceholder: CONTACT.phonePlaceholder,

      address: 'Adresse',
      addressLine1: 'Strasse',
      addressLine1Placeholder: 'Strassenname und Hausnummer',
      addressLine2: 'Zusatz',
      addressLine2Placeholder: 'Adresszusatz (optional)',
      postalCode: 'PLZ',
      postalCodePlaceholder: '8000',
      city: 'Ort',
      cityPlaceholder: 'Zürich',
      canton: 'Kanton',
      country: 'Land',

      lookupPostalCode: 'PLZ nachschlagen',
      lookupInProgress: 'Suche...',
    },

    // Common actions
    save: 'Speichern',
    saving: 'Speichert...',
    cancel: 'Abbrechen',

    // Messages
    saveSuccess: 'Einstellungen erfolgreich gespeichert',
    saveError: 'Fehler beim Speichern der Einstellungen',
    passwordChangeSuccess: 'Passwort erfolgreich geändert',
    passwordChangeError: 'Fehler beim Ändern des Passworts',
  },

  validation: {
    firstName: {
      minLength: 2,
      maxLength: 50,
      errorMessages: {
        required: 'Vorname ist erforderlich',
        minLength: 'Vorname muss mindestens 2 Zeichen lang sein',
        maxLength: 'Vorname darf maximal 50 Zeichen lang sein',
      },
    },
    lastName: {
      minLength: 2,
      maxLength: 50,
      errorMessages: {
        required: 'Nachname ist erforderlich',
        minLength: 'Nachname muss mindestens 2 Zeichen lang sein',
        maxLength: 'Nachname darf maximal 50 Zeichen lang sein',
      },
    },
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      errorMessages: {
        required: 'Passwort ist erforderlich',
        minLength: 'Passwort muss mindestens 8 Zeichen lang sein',
        uppercase: 'Passwort muss mindestens einen Grossbuchstaben enthalten',
        lowercase: 'Passwort muss mindestens einen Kleinbuchstaben enthalten',
        number: 'Passwort muss mindestens eine Zahl enthalten',
        mismatch: 'Passwörter stimmen nicht überein',
      },
    },
    phone: {
      pattern: /^\+?[0-9\s()-]+$/,
      errorMessages: {
        pattern: 'Ungültige Telefonnummer',
      },
    },
    postalCode: {
      pattern: /^[0-9]{4}$/,
      errorMessages: {
        required: 'PLZ ist erforderlich',
        pattern: 'PLZ muss 4 Ziffern enthalten',
      },
    },
  },
} as const;

// ============================================================================
// SWISS CANTONS
// ============================================================================

export const SWISS_CANTONS = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE',
  'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG',
  'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS',
  'ZG', 'ZH'
] as const;

export const CANTON_NAMES: Record<typeof SWISS_CANTONS[number], string> = {
  AG: 'Aargau',
  AI: 'Appenzell Innerrhoden',
  AR: 'Appenzell Ausserrhoden',
  BE: 'Bern',
  BL: 'Basel-Landschaft',
  BS: 'Basel-Stadt',
  FR: 'Freiburg',
  GE: 'Genf',
  GL: 'Glarus',
  GR: 'Graubünden',
  JU: 'Jura',
  LU: 'Luzern',
  NE: 'Neuenburg',
  NW: 'Nidwalden',
  OW: 'Obwalden',
  SG: 'St. Gallen',
  SH: 'Schaffhausen',
  SO: 'Solothurn',
  SZ: 'Schwyz',
  TG: 'Thurgau',
  TI: 'Tessin',
  UR: 'Uri',
  VD: 'Waadt',
  VS: 'Wallis',
  ZG: 'Zug',
  ZH: 'Zürich',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ProfileVisibility = 'public' | 'private';
export type SwissCanton = typeof SWISS_CANTONS[number];
export type AvatarFileType = typeof PROFILE_CONFIG.avatar.allowedTypes[number];
