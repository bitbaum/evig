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

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

// Get all products
const productsResult = await client.query('SELECT id, title, handle FROM product');
const products = productsResult.rows;

// Product prices mapping
const pricesMap = {
  'thinkpad-t480-refurbished': 59900,
  'dell-monitor-24-full-hd': 14900,
  'wireless-ergonomic-mouse': 2900,
  'macbook-pro-13-2019-refurbished': 89900,
  'hp-laserjet-printer': 19900,
};

const quantitiesMap = {
  'thinkpad-t480-refurbished': 5,
  'dell-monitor-24-full-hd': 10,
  'wireless-ergonomic-mouse': 20,
  'macbook-pro-13-2019-refurbished': 3,
  'hp-laserjet-printer': 7,
};

// Get stock location
const stockLocationResult = await client.query('SELECT id FROM stock_location LIMIT 1');
const stockLocationId = stockLocationResult.rows[0]?.id;

console.log('Creating variants for products...\n');

for (const product of products) {
  const variantId = generateId('variant');
  const priceSetId = generateId('pset');
  const priceId = generateId('price');
  const inventoryItemId = generateId('iitem');
  const price = pricesMap[product.handle] || 9900;
  const quantity = quantitiesMap[product.handle] || 10;

  try {
    console.log(`Processing: ${product.title}`);

    // Insert variant
    await client.query(`
      INSERT INTO product_variant (id, title, product_id, sku, manage_inventory, allow_backorder, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [variantId, 'Default', product.id, product.handle, true, false]);

    console.log('  ✓ Created variant');

    // Insert price set
    await client.query(`
      INSERT INTO price_set (id, created_at, updated_at)
      VALUES ($1, NOW(), NOW())
    `, [priceSetId]);

    // Link variant to price set
    const variantPriceSetId = generateId('vps');
    await client.query(`
      INSERT INTO product_variant_price_set (id, variant_id, price_set_id)
      VALUES ($1, $2, $3)
    `, [variantPriceSetId, variantId, priceSetId]);

    console.log('  ✓ Created price set');

    // Insert price
    await client.query(`
      INSERT INTO price (id, price_set_id, amount, currency_code, raw_amount, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [priceId, priceSetId, price, 'chf', JSON.stringify({value: price.toString()})]);

    console.log(`  ✓ Set price: ${price / 100} CHF`);

    // Create inventory item
    await client.query(`
      INSERT INTO inventory_item (id, sku, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
    `, [inventoryItemId, product.handle + '-inv']);

    // Link variant to inventory
    const variantInventoryId = generateId('pvii');
    await client.query(`
      INSERT INTO product_variant_inventory_item (id, variant_id, inventory_item_id, required_quantity)
      VALUES ($1, $2, $3, $4)
    `, [variantInventoryId, variantId, inventoryItemId, 1]);

    console.log('  ✓ Created inventory item');

    // Add inventory level
    if (stockLocationId) {
      const inventoryLevelId = generateId('ilev');
      await client.query(`
        INSERT INTO inventory_level (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [inventoryLevelId, inventoryItemId, stockLocationId, quantity, 0, 0]);

      console.log(`  ✓ Set inventory: ${quantity} units\n`);
    }

  } catch (error) {
    console.error(`  ✗ Error:`, error.message, '\n');
  }
}

console.log('✅ Variants creation complete!');

await client.end();
