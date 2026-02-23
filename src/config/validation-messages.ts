/**
 * Validation Messages Configuration
 *
 * SSOT for all form validation error messages.
 * Centralized to ensure consistent messaging and easy translation.
 */

export const VALIDATION_MESSAGES = {
  marketplace_sell: {
    title: {
      required: 'Titel ist erforderlich',
      minLength: 'Titel muss mindestens 3 Zeichen lang sein',
      maxLength: 'Titel darf maximal 100 Zeichen lang sein',
    },
    description: {
      required: 'Beschreibung ist erforderlich',
      minLength: 'Beschreibung muss mindestens 20 Zeichen lang sein',
    },
    price: {
      required: 'Preis ist erforderlich',
      min: 'Preis muss mindestens 1 CHF sein',
      max: 'Preis darf maximal 50\'000 CHF sein',
    },
    category: {
      required: 'Kategorie ist erforderlich',
    },
    condition: {
      required: 'Zustand ist erforderlich',
    },
    delivery: {
      required: 'Versandoptionen sind erforderlich',
    },
    payment: {
      required: 'Zahlungsmethode ist erforderlich',
    },
    location: {
      required: 'Standort ist erforderlich',
    },
  },
  it_hilfe_create: {
    category: {
      required: 'Gerätetyp ist erforderlich',
    },
    title: {
      required: 'Titel ist erforderlich',
      minLength: 'Titel muss mindestens 10 Zeichen lang sein',
    },
    description: {
      required: 'Beschreibung ist erforderlich',
      minLength: 'Beschreibung muss mindestens 30 Zeichen lang sein',
    },
    urgency: {
      required: 'Dringlichkeit ist erforderlich',
    },
    location: {
      postalCode: 'PLZ ist erforderlich',
      city: 'Ort ist erforderlich',
      canton: 'Kanton ist erforderlich',
    },
    serviceType: {
      required: 'Art der Dienstleistung ist erforderlich',
    },
  },
  it_hilfe_offer: {
    message: {
      required: 'Nachricht an den Anfragenden ist erforderlich',
      minLength: 'Nachricht muss mindestens 20 Zeichen lang sein',
    },
    availability: {
      required: 'Verfügbarkeit ist erforderlich',
    },
  },
  contact: {
    message: {
      required: 'Nachricht ist erforderlich',
      minLength: 'Nachricht muss mindestens 10 Zeichen lang sein',
    },
  },
} as const

/**
 * Helper function to get validation message
 */
export function getValidationMessage(
  form: keyof typeof VALIDATION_MESSAGES,
  field: string,
  error: string
): string {
  const formMessages = VALIDATION_MESSAGES[form] as Record<string, Record<string, string>> | undefined
  return formMessages?.[field]?.[error] || 'Ungültige Eingabe'
}
