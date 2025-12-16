/**
 * Cleanup Demo Products Script
 * 
 * This script removes Medusa demo clothing products and ensures
 * only IT-related products remain in the store.
 * 
 * Run with: npx medusa exec ./scripts/cleanup-demo-products.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function cleanupDemoProducts({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT)
  
  // Demo product handles to delete (Medusa clothing)
  const demoProductHandles = [
    "shorts",
    "sweatpants", 
    "t-shirt",
    "sweatshirt",
    "longsleeve",
    "hoodie",
  ]
  
  console.log("🧹 Starting demo product cleanup...")
  
  // Get all products
  const products = await productService.listProducts({}, {
    select: ["id", "handle", "title"],
  })
  
  // Filter demo products
  const demoProducts = products.filter(p => 
    demoProductHandles.includes(p.handle) || 
    p.title.toLowerCase().includes("medusa")
  )
  
  if (demoProducts.length === 0) {
    console.log("✅ No demo products found. Store is clean!")
    return
  }
  
  console.log(`Found ${demoProducts.length} demo products to delete:`)
  demoProducts.forEach(p => console.log(`  - ${p.title} (${p.handle})`))
  
  // Delete demo products
  for (const product of demoProducts) {
    try {
      await productService.deleteProducts([product.id])
      console.log(`  ✅ Deleted: ${product.title}`)
    } catch (error) {
      console.error(`  ❌ Failed to delete ${product.title}:`, error)
    }
  }
  
  console.log("\n🎉 Demo product cleanup complete!")
  
  // List remaining products
  const remainingProducts = await productService.listProducts({}, {
    select: ["id", "handle", "title"],
  })
  
  console.log(`\n📦 Remaining products (${remainingProducts.length}):`)
  remainingProducts.forEach(p => console.log(`  - ${p.title}`))
}




