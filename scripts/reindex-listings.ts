/**
 * Reindex all active listings into Meilisearch
 *
 * Run: npx tsx scripts/reindex-listings.ts
 */

import { Pool } from 'pg';

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || '';
const LISTINGS_INDEX = 'listings';

async function main() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'revampit',
    user: process.env.POSTGRES_USER || 'revampit',
    password: process.env.POSTGRES_PASSWORD || 'revampit',
  });

  try {
    // Fetch all active listings
    const result = await pool.query(`
      SELECT
        l.id, l.title, l.description, l.brand, l.model,
        l.category, l.condition, l.price_chf,
        l.delivery_options, l.payment_mode, l.status, l.is_revampit,
        l.pickup_location, l.view_count, l.favorite_count, l.created_at,
        u.name as seller_name,
        sp.city as seller_city,
        (SELECT li.url FROM listing_images li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as thumbnail
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      LEFT JOIN seller_profiles sp ON l.seller_id = sp.user_id
      WHERE l.status = 'active'
    `);

    const listings = result.rows;
    console.log(`Found ${listings.length} active listings to index`);

    if (listings.length === 0) {
      console.log('No listings to index');
      return;
    }

    // Configure index
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (MEILISEARCH_KEY) headers['Authorization'] = `Bearer ${MEILISEARCH_KEY}`;

    // Create index
    await fetch(`${MEILISEARCH_HOST}/indexes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ uid: LISTINGS_INDEX, primaryKey: 'id' }),
    });

    // Configure settings
    await fetch(`${MEILISEARCH_HOST}/indexes/${LISTINGS_INDEX}/settings`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        searchableAttributes: ['title', 'description', 'brand', 'model'],
        filterableAttributes: [
          'category', 'condition', 'delivery_options', 'payment_mode',
          'status', 'price_chf', 'is_revampit',
        ],
        sortableAttributes: ['price_chf', 'created_at', 'view_count', 'favorite_count'],
      }),
    });

    // Batch index (Meilisearch handles batches of any size)
    const response = await fetch(`${MEILISEARCH_HOST}/indexes/${LISTINGS_INDEX}/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify(listings),
    });

    if (response.ok) {
      const task = await response.json();
      console.log(`Indexing task enqueued: ${task.taskUid}`);
      console.log(`Successfully submitted ${listings.length} listings for indexing`);
    } else {
      const error = await response.text();
      console.error('Meilisearch indexing failed:', error);
    }
  } catch (error) {
    console.error('Reindex failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
