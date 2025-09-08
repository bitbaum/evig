import { initializeDatabase } from './utils/database';
import { closeDatabase } from './utils/database';

/**
 * Migration runner script
 * This script runs all pending database migrations
 */
async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');

    await initializeDatabase();

    console.log('✅ Database migrations completed successfully!');
    console.log('🎉 Your CMS is ready to use!');

    // Close database connection
    await closeDatabase();

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connection...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connection...');
  await closeDatabase();
  process.exit(0);
});

// Run migrations
runMigrations();


