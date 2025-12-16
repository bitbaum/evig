#!/usr/bin/env node

/**
 * Medusa Setup Script
 * Creates publishable API key and sample products
 */

async function setup() {
  try {
    console.log("🚀 Starting Medusa setup...")

    // Login as admin
    console.log("\n1. Logging in as admin...")
    const authResponse = await fetch("http://localhost:9000/auth/user/emailpass", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@revampit.ch",
        password: "Admin123!",
      }),
    })

    if (!authResponse.ok) {
      throw new Error(`Login failed: ${authResponse.statusText}`)
    }

    const authData = await authResponse.json()
    const authToken = authData.token
    console.log("✅ Login successful")

    // Get existing regions
    console.log("\n2. Fetching regions...")
    const regionsResponse = await fetch("http://localhost:9000/admin/regions", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    const regionsData = await regionsResponse.json()
    const regionId = regionsData.regions?.[0]?.id
    console.log(`✅ Found region: ${regionId}`)

    // Check for existing publishable API keys (v2: consolidated under /admin/api-keys)
    console.log("\n3. Checking for publishable API keys...")
    const keysResponse = await fetch("http://localhost:9000/admin/api-keys", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    const keysData = await keysResponse.json()

    let publishableKey
    const existing = (keysData.api_keys || []).find((k) => k.type === "publishable")
    if (existing) {
      publishableKey = existing.id || existing.token
      console.log(`✅ Using existing publishable key: ${publishableKey}`)
    } else {
      // Create publishable API key
      console.log("\n4. Creating publishable API key...")
      const keyResponse = await fetch("http://localhost:9000/admin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: "Web Storefront",
          type: "publishable",
        }),
      })

      if (!keyResponse.ok) {
        throw new Error(`Failed to create API key: ${keyResponse.statusText}`)
      }

      const keyData = await keyResponse.json()
      publishableKey = keyData.api_key?.id || keyData.api_key?.token
      console.log(`✅ Created publishable key: ${publishableKey}`)
    }

    // Check for existing products
    console.log("\n5. Checking for existing products...")
    const productsResponse = await fetch("http://localhost:9000/admin/products", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
    const productsData = await productsResponse.json()

    if (productsData.products?.length > 0) {
      console.log(`✅ Found ${productsData.products.length} existing products`)
    } else {
      console.log("\n6. Creating sample products...")

      const sampleProducts = [
        {
          title: "ThinkPad T480 Refurbished",
          handle: "thinkpad-t480-refurbished",
          description: "Generalüberholter Lenovo ThinkPad T480 mit Intel Core i5, 16GB RAM, 256GB SSD. Perfekt für Business und Home Office.",
          status: "published",
          variants: [
            {
              title: "Standard",
              prices: [{ amount: 59900, currency_code: "chf" }],
              manage_inventory: true,
              inventory_quantity: 5,
            },
          ],
        },
        {
          title: "Dell Monitor 24\" Full HD",
          handle: "dell-monitor-24-full-hd",
          description: "24-Zoll Full HD Monitor von Dell. IPS-Panel, 60Hz, HDMI und DisplayPort. Ideal für Büroarbeit.",
          status: "published",
          variants: [
            {
              title: "Standard",
              prices: [{ amount: 14900, currency_code: "chf" }],
              manage_inventory: true,
              inventory_quantity: 10,
            },
          ],
        },
        {
          title: "Wireless Ergonomic Mouse",
          handle: "wireless-ergonomic-mouse",
          description: "Ergonomische kabellose Maus mit 2.4GHz Verbindung. Lange Akkulaufzeit, komfortables Design.",
          status: "published",
          variants: [
            {
              title: "Standard",
              prices: [{ amount: 2900, currency_code: "chf" }],
              manage_inventory: true,
              inventory_quantity: 20,
            },
          ],
        },
      ]

      for (const product of sampleProducts) {
        const response = await fetch("http://localhost:9000/admin/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(product),
        })

        if (response.ok) {
          console.log(`✅ Created product: ${product.title}`)
        } else {
          console.error(`❌ Failed to create product: ${product.title}`)
        }
      }
    }

    console.log("\n🎉 Setup complete!")
    console.log(`\n📋 Add this to your .env.local:`)
    console.log(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${publishableKey}`)
    console.log(`\n🌐 Admin panel: http://localhost:9000/app`)
    console.log(`   Email: admin@revampit.ch`)
    console.log(`   Password: Admin123!`)

  } catch (error) {
    console.error("\n❌ Setup failed:", error.message)
    process.exit(1)
  }
}

setup()
