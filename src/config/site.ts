import { ORG, CONTACT, LOCATIONS, OPENING_HOURS } from '@/config/org'

export const siteConfig = {
  name: ORG.name,
  description: ORG.description,
  contact: {
    email: CONTACT.email,
    phone: CONTACT.phone,
    address: LOCATIONS.store.fullWithCountry,
    locations: [
      {
        name: LOCATIONS.store.name,
        addressLines: [
          LOCATIONS.store.street,
          `${LOCATIONS.store.postalCode} ${LOCATIONS.store.city}`,
          LOCATIONS.store.country,
        ]
      },
      {
        name: LOCATIONS.warehouse.name,
        addressLines: [
          LOCATIONS.warehouse.street,
          `${LOCATIONS.warehouse.postalCode} ${LOCATIONS.warehouse.city}`,
        ],
        extra: LOCATIONS.warehouse.note,
      }
    ]
  },
  openingHours: {
    monday: OPENING_HOURS.monday,
    tuesdayToFriday: OPENING_HOURS.tuesdayToFriday,
  },
  social: {
    // Add social media links when available
  },
} as const

// Type for the site configuration
export type SiteConfig = typeof siteConfig
