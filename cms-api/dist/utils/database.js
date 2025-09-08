"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initializeDatabase = initializeDatabase;
exports.executeQuery = executeQuery;
exports.executeQuerySingle = executeQuerySingle;
exports.executeTransaction = executeTransaction;
exports.closeDatabase = closeDatabase;
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'revampit_cms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
exports.pool = new pg_1.Pool(dbConfig);
exports.pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
exports.pool.on('connect', (client) => {
    console.log('✅ New database client connected');
});
exports.pool.on('remove', (client) => {
    console.log('🗑️ Database client removed from pool');
});
async function initializeDatabase() {
    try {
        const client = await exports.pool.connect();
        console.log('✅ Database connected successfully');
        await runMigrations();
        client.release();
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}
async function runMigrations() {
    try {
        const migrationsPath = path_1.default.join(__dirname, '../migrations');
        const files = fs_1.default.readdirSync(migrationsPath).sort();
        for (const file of files) {
            if (file.endsWith('.sql')) {
                const migrationPath = path_1.default.join(migrationsPath, file);
                const migrationSQL = fs_1.default.readFileSync(migrationPath, 'utf8');
                const migrationName = file.replace('.sql', '');
                const result = await exports.pool.query('SELECT id FROM migrations WHERE name = $1', [migrationName]);
                if (result.rows.length === 0) {
                    console.log(`📝 Running migration: ${migrationName}`);
                    await exports.pool.query('BEGIN');
                    await exports.pool.query(migrationSQL);
                    await exports.pool.query('INSERT INTO migrations (name, executed_at) VALUES ($1, $2)', [migrationName, new Date()]);
                    await exports.pool.query('COMMIT');
                    console.log(`✅ Migration completed: ${migrationName}`);
                }
                else {
                    console.log(`⏭️ Migration already run: ${migrationName}`);
                }
            }
        }
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}
async function executeQuery(text, params) {
    const client = await exports.pool.connect();
    try {
        const result = await client.query(text, params);
        return result.rows;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
async function executeQuerySingle(text, params) {
    const results = await executeQuery(text, params);
    return results.length > 0 ? results[0] : null;
}
async function executeTransaction(callback) {
    const client = await exports.pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Transaction failed:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
async function closeDatabase() {
    await exports.pool.end();
    console.log('🛑 Database connection pool closed');
}
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
//# sourceMappingURL=database.js.map