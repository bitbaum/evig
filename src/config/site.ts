export const siteConfig = {
  name: 'RevampIT',
  description: 'Making technology sustainable and accessible for everyone.',
  contact: {
    email: 'empfang@revamp-it.ch',
    phone: '+41 44 586 86 86',
    address: 'Industriestrasse 4, 8630 Rüti ZH, Switzerland'
  },
  social: {
    // Add social media links when available
  },
  navigation: {
    main: [
      { name: 'Home', href: '/' },
      { name: 'Projects', href: '/projects' },
      { 
        name: 'Get Involved', 
        href: '/get-involved',
        children: [
          { name: 'Volunteer', href: '/get-involved/volunteer' },
          { name: 'Technical Experts', href: '/get-involved/technical-experts' },
          { name: 'Internships', href: '/get-involved/internships' },
          { name: 'Work Reintegration', href: '/get-involved/work-reintegration' },
          { name: 'Partnerships', href: '/get-involved/partnerships' },
          { name: 'Donate', href: '/get-involved/donate' }
        ]
      },
      { name: 'Blog', href: '/blog' },
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' }
    ]
  }
} as const

// Type for the site configuration
export type SiteConfig = typeof siteConfig 