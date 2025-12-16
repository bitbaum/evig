/**
 * Seed IT Products Script
 * 
 * This script adds realistic refurbished IT products to the store
 * matching RevampIT's product categories.
 * 
 * Run with: npx medusa exec ./scripts/seed-it-products.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// Product data for RevampIT - refurbished IT equipment
const itProducts = [
  // Laptops
  {
    title: "Dell Latitude E7470 Refurbished",
    handle: "dell-latitude-e7470-refurbished",
    description: "Generalüberholter Dell Latitude E7470 Business Laptop. Intel Core i5-6300U, 8GB DDR4 RAM, 256GB SSD, 14\" Full HD Display. Ideal für Büro und Home Office.",
    category: "Laptops",
    sku: "dell-latitude-e7470",
    price: 34900, // CHF 349.00
  },
  {
    title: "HP EliteBook 840 G5 Refurbished",
    handle: "hp-elitebook-840-g5-refurbished",
    description: "Generalüberholter HP EliteBook 840 G5. Intel Core i5-8350U, 16GB RAM, 512GB NVMe SSD, 14\" Full HD IPS. Premium Business Laptop mit Fingerprint Reader.",
    category: "Laptops",
    sku: "hp-elitebook-840-g5",
    price: 44900, // CHF 449.00
  },
  // Desktop PCs
  {
    title: "Lenovo ThinkCentre M720s SFF",
    handle: "lenovo-thinkcentre-m720s-sff",
    description: "Kompakter Lenovo ThinkCentre Desktop PC. Intel Core i5-8500, 8GB RAM, 256GB SSD. Small Form Factor - perfekt für beengten Arbeitsplatz.",
    category: "Desktop PCs",
    sku: "lenovo-thinkcentre-m720s",
    price: 29900, // CHF 299.00
  },
  {
    title: "Dell OptiPlex 7080 Micro Refurbished",
    handle: "dell-optiplex-7080-micro-refurbished",
    description: "Ultra-kompakter Dell OptiPlex 7080 Micro PC. Intel Core i7-10700T, 16GB RAM, 512GB NVMe SSD. Flüsterleise und energieeffizient.",
    category: "Desktop PCs",
    sku: "dell-optiplex-7080-micro",
    price: 54900, // CHF 549.00
  },
  // Monitors
  {
    title: "LG 27UK850-W 4K Monitor 27\"",
    handle: "lg-27uk850-4k-monitor",
    description: "27 Zoll 4K UHD Monitor mit USB-C Anschluss. IPS Panel, HDR10, 99% sRGB. Ideal für Grafikarbeiten und Büro.",
    category: "Monitore",
    sku: "lg-27uk850-w",
    price: 27900, // CHF 279.00
  },
  {
    title: "Samsung S24E650PL 24\" Business Monitor",
    handle: "samsung-s24e650pl-business-monitor",
    description: "24 Zoll Full HD Business Monitor mit ergonomischem Standfuss. PLS Panel, Pivot-Funktion, Blaulichtfilter. Augenschonend für lange Arbeitstage.",
    category: "Monitore",
    sku: "samsung-s24e650pl",
    price: 12900, // CHF 129.00
  },
  // Keyboards & Mice
  {
    title: "Logitech MK270 Wireless Combo",
    handle: "logitech-mk270-wireless-combo",
    description: "Kabelloses Tastatur-Maus Set von Logitech. Zuverlässige 2.4GHz Verbindung, lange Batterielaufzeit. Perfekt für Büro und Home Office.",
    category: "Peripheriegeräte",
    sku: "logitech-mk270",
    price: 3900, // CHF 39.00
  },
  {
    title: "Cherry KC 1000 Tastatur USB",
    handle: "cherry-kc-1000-tastatur",
    description: "Hochwertige Cherry USB-Tastatur mit Schweizer Layout. Flaches Design, leise Tastenanschläge. Made in Germany.",
    category: "Peripheriegeräte",
    sku: "cherry-kc-1000",
    price: 2490, // CHF 24.90
  },
  // Printers
  {
    title: "Brother HL-L2350DW Laserdrucker",
    handle: "brother-hl-l2350dw-laserdrucker",
    description: "Kompakter Schwarz-Weiss Laserdrucker mit WLAN und Duplexdruck. Ideal für Home Office. Bis 30 Seiten pro Minute.",
    category: "Drucker",
    sku: "brother-hl-l2350dw",
    price: 14900, // CHF 149.00
  },
  // Storage
  {
    title: "Samsung 870 EVO SSD 500GB",
    handle: "samsung-870-evo-ssd-500gb",
    description: "Zuverlässige Samsung 2.5\" SSD mit 500GB Kapazität. Bis zu 560 MB/s Lesegeschwindigkeit. Ideal als Upgrade für ältere PCs.",
    category: "Speicher",
    sku: "samsung-870-evo-500",
    price: 5900, // CHF 59.00
  },
  {
    title: "WD Elements 2TB Externe Festplatte",
    handle: "wd-elements-2tb-externe-festplatte",
    description: "Western Digital externe USB 3.0 Festplatte mit 2TB Speicher. Kompakt und zuverlässig für Backups und Datentransfer.",
    category: "Speicher",
    sku: "wd-elements-2tb",
    price: 6900, // CHF 69.00
  },
  // Networking
  {
    title: "TP-Link Archer C6 WLAN Router",
    handle: "tp-link-archer-c6-wlan-router",
    description: "Dual-Band WLAN Router mit AC1200 Geschwindigkeit. 4 Gigabit LAN Ports, MU-MIMO Technologie. Einfache Einrichtung.",
    category: "Netzwerk",
    sku: "tp-link-archer-c6",
    price: 4900, // CHF 49.00
  },
  {
    title: "Netgear GS308 8-Port Switch",
    handle: "netgear-gs308-8-port-switch",
    description: "8-Port Gigabit Ethernet Switch. Lüfterlos und energiesparend. Plug & Play ohne Konfiguration.",
    category: "Netzwerk",
    sku: "netgear-gs308",
    price: 2900, // CHF 29.00
  },
  // Cables & Accessories
  {
    title: "USB-C Hub 7-in-1 mit HDMI",
    handle: "usb-c-hub-7-in-1-hdmi",
    description: "Vielseitiger USB-C Hub mit HDMI 4K, USB 3.0, SD-Kartenleser und USB-C PD Charging. Für MacBook und moderne Laptops.",
    category: "Zubehör",
    sku: "usb-c-hub-7in1",
    price: 3900, // CHF 39.00
  },
  {
    title: "Cat 6 Netzwerkkabel 5m",
    handle: "cat6-netzwerkkabel-5m",
    description: "Hochwertiges Cat 6 Ethernet Kabel, 5 Meter. Vergoldete Kontakte, 1Gbit/s Übertragung. Für zuverlässige Kabelverbindungen.",
    category: "Kabel",
    sku: "cat6-5m",
    price: 990, // CHF 9.90
  },
]

export default async function seedItProducts({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT)
  
  console.log("🖥️  Starting IT product seeding...")
  
  // Get existing products to avoid duplicates
  const existingProducts = await productService.listProducts({}, {
    select: ["handle"],
  })
  const existingHandles = new Set(existingProducts.map(p => p.handle))
  
  // Filter out products that already exist
  const newProducts = itProducts.filter(p => !existingHandles.has(p.handle))
  
  if (newProducts.length === 0) {
    console.log("✅ All IT products already exist in the database!")
    return
  }
  
  console.log(`Adding ${newProducts.length} new IT products...`)
  
  for (const product of newProducts) {
    try {
      // Create product without variants first
      const createdProduct = await productService.createProducts([{
        title: product.title,
        handle: product.handle,
        description: product.description,
        is_giftcard: false,
        discountable: true,
        status: "published",
      }])
      
      console.log(`  ✅ Created: ${product.title}`)
    } catch (error: any) {
      console.error(`  ❌ Failed to create ${product.title}:`, error.message)
    }
  }
  
  console.log("\n🎉 IT product seeding complete!")
  
  // List all products
  const allProducts = await productService.listProducts({}, {
    select: ["id", "handle", "title"],
  })
  
  console.log(`\n📦 Total products in store (${allProducts.length}):`)
  allProducts.forEach(p => console.log(`  - ${p.title}`))
}




