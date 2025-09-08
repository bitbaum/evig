#!/usr/bin/env node

/**
 * Sample data population script for Reboot Content
 * This creates sample pages that can be managed through the admin interface
 */

const samplePages = [
  {
    slug: 'about',
    title: 'About RevampIT',
    content: `
      <h2>Our Mission</h2>
      <p>At RevampIT, we believe in giving technology a second life. Founded in 2009, we've been at the forefront of sustainable IT practices in Switzerland.</p>

      <h2>What We Do</h2>
      <ul>
        <li>Computer repair and refurbishment</li>
        <li>Linux installation and support</li>
        <li>Open-source software consulting</li>
        <li>IT education and workshops</li>
      </ul>

      <h2>Our Impact</h2>
      <p>Every year, we save hundreds of devices from landfill and provide affordable technology solutions to those who need them most.</p>
    `,
    seo_title: 'About Us - RevampIT',
    seo_description: 'Learn about RevampIT\'s mission to extend the life of IT devices and promote sustainable computing practices.',
    is_published: true,
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    content: `
      <h2>Get in Touch</h2>
      <p>Ready to give your old computer a second life? We'd love to hear from you!</p>

      <h3>Visit Our Store</h3>
      <p>RevampIT<br>
      Sample Address 123<br>
      8000 Zurich, Switzerland</p>

      <h3>Opening Hours</h3>
      <p>Monday - Friday: 9:00 - 18:00<br>
      Saturday: 10:00 - 16:00<br>
      Sunday: Closed</p>

      <h3>Contact Information</h3>
      <p>Email: info@revampit.ch<br>
      Phone: +41 XX XXX XX XX</p>
    `,
    seo_title: 'Contact RevampIT',
    seo_description: 'Get in touch with RevampIT for computer repair, Linux support, and sustainable IT solutions.',
    is_published: true,
  },
  {
    slug: 'services',
    title: 'Our Services',
    content: `
      <h2>Professional IT Services</h2>
      <p>We offer comprehensive IT solutions tailored to your needs.</p>

      <h3>Computer Repair</h3>
      <p>From hardware diagnostics to component replacement, we fix all types of computer issues.</p>

      <h3>Linux Support</h3>
      <p>Installation, configuration, and troubleshooting for all major Linux distributions.</p>

      <h3>Data Recovery</h3>
      <p>Professional data recovery services for lost or corrupted files.</p>

      <h3>Consulting</h3>
      <p>Expert advice on sustainable IT practices and open-source solutions.</p>
    `,
    seo_title: 'IT Services - RevampIT',
    seo_description: 'Professional computer repair, Linux support, and IT consulting services in Zurich.',
    is_published: true,
  },
]

async function populateSampleData() {
  console.log('🚀 Populating sample pages for Reboot Content admin interface...')

  for (const page of samplePages) {
    try {
      const response = await fetch('http://localhost:3001/api/content/static-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(page),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Created page: ${page.title} (ID: ${result.data?.id})`)
      } else {
        const error = await response.json()
        console.log(`❌ Failed to create ${page.title}:`, error.message)
      }
    } catch (error) {
      console.log(`❌ Error creating ${page.title}:`, error.message)
    }
  }

  console.log('✨ Sample data population complete!')
  console.log('📝 You can now visit /admin to manage these pages')
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateSampleData().catch(console.error)
}

export { populateSampleData, samplePages }
