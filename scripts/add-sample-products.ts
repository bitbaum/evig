/**
 * Add Sample Products Script
 * Adds a few sample products to the store for testing
 */

import { createClient } from 'pg'

const client = new createClient({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'revampit_cms',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
})

async function addSampleProducts() {
  try {
    await client.connect()

    // Sample products data
    const products = [
      {
        title: 'Refurbished MacBook Pro 16" M3',
        handle: 'refurbished-macbook-pro-16-m3',
        description: `Dieser refurbished MacBook Pro 16" M3 wurde sorgfältig geprüft und ist in ausgezeichnetem Zustand. Das Gerät bietet die neueste M3-Technologie von Apple mit hervorragender Performance für alle Aufgaben.

Technische Daten:
- Apple M3 Pro Chip mit 11-Core CPU
- 16" Liquid Retina XDR Display
- 18GB unified Memory
- 512GB SSD Speicher
- 3x Thunderbolt 4 Ports
- MagSafe 3 Ladegerät
- Bis zu 22 Stunden Akkulaufzeit

Das Gerät wurde vollständig getestet, alle Funktionen arbeiten einwandfrei. Es ist bereit für den sofortigen Einsatz und wird mit dem originalen Netzteil geliefert.

Bei RevampIT legen wir grossen Wert auf Nachhaltigkeit - durch den Kauf eines refurbished Geräts schonen Sie die Umwelt und sparen dabei auch noch Geld!`,
        status: 'published',
        thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
        images: JSON.stringify([
          { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800' },
          { url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800' }
        ]),
        tags: JSON.stringify([
          { value: 'laptop' },
          { value: 'apple' },
          { value: 'macbook' },
          { value: 'refurbished' }
        ]),
        variants: JSON.stringify([
          {
            title: 'Standard',
            sku: 'mbp16-m3-001',
            inventory_quantity: 5,
            prices: [{ amount: 280000, currency_code: 'chf' }] // 2800 CHF in cents
          }
        ])
      },
      {
        title: 'Dell XPS 13 Laptop - Refurbished',
        handle: 'dell-xps-13-refurbished',
        description: `Professionell refurbished Dell XPS 13 Ultrabook in exzellentem Zustand.

Spezifikationen:
- Intel Core i7-1165G7 Prozessor
- 16GB DDR4 RAM
- 512GB NVMe SSD
- 13.3" Full HD InfinityEdge Display
- Windows 11 Pro vorinstalliert
- 1 Jahr Garantie

Perfekt für Business, Studium oder den täglichen Gebrauch. Voll funktionsfähig und bereit für den Einsatz.`,
        status: 'published',
        thumbnail: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
        images: JSON.stringify([
          { url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800' }
        ]),
        tags: JSON.stringify([
          { value: 'laptop' },
          { value: 'dell' },
          { value: 'business' },
          { value: 'ultrabook' }
        ]),
        variants: JSON.stringify([
          {
            title: 'Standard',
            sku: 'dell-xps13-001',
            inventory_quantity: 3,
            prices: [{ amount: 89900, currency_code: 'chf' }] // 899 CHF in cents
          }
        ])
      },
      {
        title: '27" 4K Monitor LG - Wie neu',
        handle: '4k-monitor-lg-27',
        description: `Hochwertiger 27" 4K UHD Monitor von LG in neuwertigem Zustand.

Eigenschaften:
- 27" IPS Panel
- 4K UHD Auflösung (3840x2160)
- HDR10 Unterstützung
- USB-C mit 65W Power Delivery
- Integrierte Lautsprecher
- VESA Mount kompatibel

Ideal für Content Creation, Gaming oder professionelle Anwendungen. Mit originaler Verpackung und Zubehör.`,
        status: 'published',
        thumbnail: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
        images: JSON.stringify([
          { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800' }
        ]),
        tags: JSON.stringify([
          { value: 'monitor' },
          { value: '4k' },
          { value: 'lg' },
          { value: 'display' }
        ]),
        variants: JSON.stringify([
          {
            title: 'Standard',
            sku: 'lg-27uk650-001',
            inventory_quantity: 2,
            prices: [{ amount: 34900, currency_code: 'chf' }] // 349 CHF in cents
          }
        ])
      }
    ]

    console.log('Adding sample products to store...')

    for (const product of products) {
      // Insert product
      const productResult = await client.query(`
        INSERT INTO product (
          id, title, handle, description, status, thumbnail, images, tags, variants,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          $1, $2, $3, $4, $5, $6, $7, $8,
          NOW(), NOW()
        )
        RETURNING id
      `, [
        product.title,
        product.handle,
        product.description,
        product.status,
        product.thumbnail,
        product.images,
        product.tags,
        product.variants
      ])

      console.log(`✅ Added product: ${product.title}`)
    }

    console.log('🎉 Sample products added successfully!')

  } catch (error) {
    console.error('Error adding sample products:', error)
  } finally {
    await client.end()
  }
}

// Run the script
addSampleProducts().catch(console.error)