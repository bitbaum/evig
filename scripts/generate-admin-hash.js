#!/usr/bin/env node
/**
 * Generate bcrypt hash for admin password
 *
 * Usage:
 *   node scripts/generate-admin-hash.js "your-password"
 *   npm run generate:admin-hash -- "your-password"
 *
 * Then add the hash to your .env file as:
 *   ADMIN_PASSWORD_HASH=$2b$12$...
 */

const bcrypt = require('bcryptjs')

const SALT_ROUNDS = 12 // Same as in src/lib/auth/password.ts

async function main() {
  const password = process.argv[2]

  if (!password) {
    console.error('\n❌ Error: Please provide a password as an argument')
    console.log('\nUsage:')
    console.log('  node scripts/generate-admin-hash.js "your-password"')
    console.log('  npm run generate:admin-hash -- "your-password"\n')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('\n❌ Error: Password must be at least 8 characters\n')
    process.exit(1)
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS)

    console.log('\n✅ Bcrypt hash generated successfully!\n')
    console.log('Add this to your .env file:\n')
    console.log(`ADMIN_PASSWORD_HASH=${hash}`)
    console.log('\n⚠️  IMPORTANT: Never commit passwords or hashes to git!\n')
  } catch (error) {
    console.error('\n❌ Error generating hash:', error.message)
    process.exit(1)
  }
}

main()
