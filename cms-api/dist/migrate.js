"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./utils/database");
const database_2 = require("./utils/database");
async function runMigrations() {
    try {
        console.log('🚀 Starting database migrations...');
        await (0, database_1.initializeDatabase)();
        console.log('✅ Database migrations completed successfully!');
        console.log('🎉 Your CMS is ready to use!');
        await (0, database_2.closeDatabase)();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
process.on('SIGINT', async () => {
    console.log('Received SIGINT, closing database connection...');
    await (0, database_2.closeDatabase)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, closing database connection...');
    await (0, database_2.closeDatabase)();
    process.exit(0);
});
runMigrations();
//# sourceMappingURL=migrate.js.map