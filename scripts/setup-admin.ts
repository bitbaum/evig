/**
 * Setup Admin User Script
 * Run this to promote the first user to admin
 */

import { query } from '../src/lib/auth/db'

async function setupAdmin() {
  try {
    console.log('🔍 Looking for users...')

    // Get all users
    const usersResult = await query(
      'SELECT id, name, email, role FROM users ORDER BY "createdAt" ASC'
    )

    if (usersResult.rows.length === 0) {
      console.log('❌ No users found. Please create a user account first.')
      return
    }

    console.log('📋 Found users:')
    usersResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`)
    })

    // Find the first non-admin user
    const firstUser = usersResult.rows.find(user => user.role !== 'admin')

    if (!firstUser) {
      console.log('ℹ️  All users are already admins.')
      return
    }

    console.log(`\n🎯 Promoting first user to admin: ${firstUser.name} (${firstUser.email})`)

    // Promote to admin
    await query(
      'UPDATE users SET role = $1, "updatedAt" = NOW() WHERE id = $2',
      ['admin', firstUser.id]
    )

    console.log('✅ Successfully promoted user to admin!')
    console.log(`🔑 Admin login: ${firstUser.email}`)
    console.log('📍 Admin dashboard: /admin')

  } catch (error) {
    console.error('❌ Error setting up admin:', error)
  } finally {
    process.exit(0)
  }
}

// Run the script
setupAdmin()






