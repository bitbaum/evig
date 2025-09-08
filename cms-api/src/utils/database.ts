import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'revampit_cms',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', (client) => {
  console.log('✅ New database client connected');
});

pool.on('remove', (client) => {
  console.log('🗑️ Database client removed from pool');
});

/**
 * Initialize database connection and run migrations
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');

    // Run migrations
    await runMigrations();

    client.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Run database migrations
 */
async function runMigrations(): Promise<void> {
  try {
    const migrationsPath = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsPath).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const migrationPath = path.join(migrationsPath, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Check if migration has been run
        const migrationName = file.replace('.sql', '');
        const result = await pool.query(
          'SELECT id FROM migrations WHERE name = $1',
          [migrationName]
        );

        if (result.rows.length === 0) {
          console.log(`📝 Running migration: ${migrationName}`);

          await pool.query('BEGIN');
          await pool.query(migrationSQL);

          // Record migration
          await pool.query(
            'INSERT INTO migrations (name, executed_at) VALUES ($1, $2)',
            [migrationName, new Date()]
          );

          await pool.query('COMMIT');
          console.log(`✅ Migration completed: ${migrationName}`);
        } else {
          console.log(`⏭️ Migration already run: ${migrationName}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Execute a database query with proper error handling
 */
export async function executeQuery<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute a single database query that returns one result
 */
export async function executeQuerySingle<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const results = await executeQuery<T>(text, params);
  return results.length > 0 ? (results[0] as T) : null;
}

/**
 * Execute a database transaction
 */
export async function executeTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  await pool.end();
  console.log('🛑 Database connection pool closed');
}

// Graceful shutdown
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
