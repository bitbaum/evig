export const siteConfig = {
  name: 'RevampIT',
  description: 'Making technology sustainable and accessible for everyone.',
  contact: {
    email: 'empfang@revamp-it.ch',
    phone: '+41 44 586 86 86',
    address: 'Industriestrasse 4, 8630 Rüti ZH, Switzerland',
    locations: [
      {
        name: 'Retail Location',
        addressLines: [
          'Birmensdorferstr. 379',
          '8055 Zürich',
          'Schweiz'
        ]
      },
      {
        name: 'Warehouse',
        addressLines: [
          'Badenerstr. 816',
          '8048 Zürich'
        ],
        extra: '(by appointment only)'
      }
    ]
  },
  openingHours: {
    monday: '9:00 - 12:00',
    tuesdayToFriday: '13:00 - 17:00'
  },
  social: {
    // Add social media links when available
  },
} as const

// Type for the site configuration
export type SiteConfig = typeof siteConfig 