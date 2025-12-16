import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5435,
  database: 'medusa_db',
  user: 'medusa',
  password: 'medusa_password',
});

await client.connect();

console.log('Connected to database');

// Get the default sales channel
const salesChannelResult = await client.query(
  'SELECT id FROM sales_channel WHERE name = $1 LIMIT 1',
  ['Default Sales Channel']
);

const salesChannelId = salesChannelResult.rows[0]?.id;

if (!salesChannelId) {
  console.error('No default sales channel found!');
  process.exit(1);
}

console.log('Sales channel ID:', salesChannelId);

// Helper function to generate IDs
function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

// Sample products
const products = [
  {
    title: 'ThinkPad T480 Refurbished',
    handle: 'thinkpad-t480-refurbished',
    description: 'Generalüberholter Lenovo ThinkPad T480 mit Intel Core i5, 16GB RAM, 256GB SSD. Perfekt für Business und Home Office.',
    price: 59900, // 599.00 CHF in cents
    quantity: 5,
  },
  {
    title: 'Dell Monitor 24" Full HD',
    handle: 'dell-monitor-24-full-hd',
    description: '24-Zoll Full HD Monitor von Dell. IPS-Panel, 60Hz, HDMI und DisplayPort.',
    price: 14900, // 149.00 CHF
    quantity: 10,
  },
  {
    title: 'Wireless Ergonomic Mouse',
    handle: 'wireless-ergonomic-mouse',
    description: 'Ergonomische kabellose Maus mit 2.4GHz Verbindung.',
    price: 2900, // 29.00 CHF
    quantity: 20,
  },
  {
    title: 'MacBook Pro 13" 2019 Refurbished',
    handle: 'macbook-pro-13-2019-refurbished',
    description: 'Generalüberholtes MacBook Pro 13" (2019) mit Intel Core i5, 8GB RAM, 256GB SSD. Touch Bar, Space Grau.',
    price: 89900, // 899.00 CHF
    quantity: 3,
  },
  {
    title: 'HP LaserJet Printer',
    handle: 'hp-laserjet-printer',
    description: 'Zuverlässiger HP LaserJet Drucker. Schwarz-Weiß, USB und WLAN.',
    price: 19900, // 199.00 CHF
    quantity: 7,
  },
];

console.log('Creating products...');

for (const product of products) {
  const productId = generateId('prod');
  const variantId = generateId('variant');
  const priceSetId = generateId('pset');
  const moneyAmountId = generateId('ma');
  const inventoryItemId = generateId('iitem');
  const stockLocationId = await client.query('SELECT id FROM stock_location LIMIT 1').then(r => r.rows[0]?.id);

  try {
    // Insert product
    await client.query(`
      INSERT INTO product (id, title, handle, description, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [productId, product.title, product.handle, product.description, 'published']);

    console.log(`✓ Created product: ${product.title}`);

    // Link product to sales channel
    const productSalesChannelId = generateId('prodsc');
    await client.query(`
      INSERT INTO product_sales_channel (id, product_id, sales_channel_id)
      VALUES ($1, $2, $3)
    `, [productSalesChannelId, productId, salesChannelId]);

    // Insert variant
    await client.query(`
      INSERT INTO product_variant (id, title, product_id, sku, manage_inventory, allow_backorder, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [variantId, 'Default Variant', productId, product.handle, true, false]);

    // Insert price set
    await client.query(`
      INSERT INTO price_set (id, created_at, updated_at)
      VALUES ($1, NOW(), NOW())
    `, [priceSetId]);

    // Link variant to price set
    await client.query(`
      INSERT INTO product_variant_price_set (variant_id, price_set_id)
      VALUES ($1, $2)
    `, [variantId, priceSetId]);

    // Insert money amount
    await client.query(`
      INSERT INTO price (id, price_set_id, amount, currency_code, min_quantity, max_quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [moneyAmountId, priceSetId, product.price, 'chf', null, null]);

    // Create inventory item
    await client.query(`
      INSERT INTO inventory_item (id, sku, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
    `, [inventoryItemId, product.handle]);

    // Link variant to inventory
    await client.query(`
      INSERT INTO product_variant_inventory_item (variant_id, inventory_item_id, required_quantity)
      VALUES ($1, $2, $3)
    `, [variantId, inventoryItemId, 1]);

    // Add inventory level if we have a stock location
    if (stockLocationId) {
      const inventoryLevelId = generateId('ilev');
      await client.query(`
        INSERT INTO inventory_level (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [inventoryLevelId, inventoryItemId, stockLocationId, product.quantity, 0, 0]);
    }

    console.log(`  ✓ Created variant and pricing for ${product.title}`);
  } catch (error) {
    console.error(`✗ Error creating ${product.title}:`, error.message);
  }
}

console.log('\n✅ Product seeding complete!');

await client.end();
