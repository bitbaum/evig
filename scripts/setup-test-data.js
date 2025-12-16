#!/usr/bin/env node

/**
 * Setup test data for Reboot Content admin interface testing
 */

const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'revampit_cms',
  user: 'postgres',
  password: 'postgres_password_2024',
});

async function setupTestData() {
  try {
    await client.connect();
    console.log('📡 Connected to database');

    // Create tables if they don't exist
    console.log('🏗️ Creating tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'editor',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS static_pages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT,
        seo_title VARCHAR(500),
        seo_description TEXT,
        is_published BOOLEAN DEFAULT false,
        published_at TIMESTAMP,
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables created');

    // Create admin user
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('Admin123!', 12);

    const adminResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['admin@revampit.ch', adminPassword, 'Admin', 'RevampIT', 'admin']);

    if (adminResult.rows.length > 0) {
      console.log('👤 Admin user created');
    } else {
      console.log('👤 Admin user already exists');
    }

    // Create sample pages
    const pages = [
      {
        slug: 'about',
        title: 'About RevampIT',
        content: '<h2>Our Mission</h2><p>At RevampIT, we believe in giving technology a second life.</p>',
        seo_title: 'About Us - RevampIT',
        seo_description: 'Learn about RevampIT\'s mission to extend the life of IT devices.',
        is_published: true,
      },
      {
        slug: 'contact',
        title: 'Contact Us',
        content: '<h2>Get in Touch</h2><p>Ready to give your old computer a second life?</p>',
        seo_title: 'Contact RevampIT',
        seo_description: 'Get in touch with RevampIT for computer repair and support.',
        is_published: true,
      },
    ];

    for (const page of pages) {
      const result = await client.query(`
        INSERT INTO static_pages (slug, title, content, seo_title, seo_description, is_published, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (slug) DO NOTHING
      `, [page.slug, page.title, page.content, page.seo_title, page.seo_description, page.is_published]);

      if (result.rowCount > 0) {
        console.log(`📄 Created page: ${page.title}`);
      } else {
        console.log(`📄 Page already exists: ${page.title}`);
      }
    }

    console.log('🎉 Test data setup complete!');
    console.log('📊 Ready for testing:');
    console.log('   - Admin user: admin@revampit.ch / Admin123!');
    console.log('   - Sample pages: About, Contact');
    console.log('   - Frontend: http://localhost:3001');
    console.log('   - Admin: http://localhost:3001/admin');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupTestData().catch(console.error);
}

module.exports = { setupTestData };
