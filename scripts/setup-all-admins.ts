import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * Generate a secure random password
 */
function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const randomBytes = crypto.randomBytes(length)
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }
  return password
}

/**
 * Get admin password from environment or generate a secure one
 * Never logs the password to console
 */
function getAdminPassword(): string {
  // Check for environment variable first (for CI/CD or manual setup)
  const envPassword = process.env.ADMIN_PASSWORD || process.env.SETUP_ADMIN_PASSWORD
  if (envPassword) {
    return envPassword
  }
  
  // Generate a secure password if not provided
  return generateSecurePassword(20)
}

async function setupAllAdmins() {
  console.log('🚀 Setting up admin users for RevampIT...')

  try {
    // Setup CMS Admin User
    console.log('📝 Setting up CMS admin user...')
    const existingAdmin = await prisma.user.findFirst({
      where: {
        roles: {
          has: 'revampit_admin'
        }
      }
    })

    if (existingAdmin) {
      console.log('✅ CMS admin user already exists')
      console.log(`   Email: admin@revampit.ch`)
      console.log(`   Note: Password was set during initial setup. Use password reset if needed.`)
    } else {
      // Generate or get password from environment
      const adminPassword = getAdminPassword()
      const hashedPassword = await bcrypt.hash(adminPassword, 12)

      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@revampit.ch',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'RevampIT',
          roles: ['revampit_admin'],
          emailVerified: new Date(),
        }
      })

      console.log('✅ CMS admin user created successfully')
      console.log(`   Email: admin@revampit.ch`)
      console.log(`   Password: [SECURE - Check .env or script output file]`)
      
      // Write password to a secure file (not logged to console)
      if (typeof process.env.ADMIN_PASSWORD_FILE === 'string') {
        const fs = await import('fs/promises')
        await fs.writeFile(process.env.ADMIN_PASSWORD_FILE, `CMS Admin Password: ${adminPassword}\n`, { mode: 0o600 })
        console.log(`   Password saved to: ${process.env.ADMIN_PASSWORD_FILE}`)
      } else if (!process.env.ADMIN_PASSWORD && !process.env.SETUP_ADMIN_PASSWORD) {
        // Only warn if password was auto-generated
        console.log(`   ⚠️  Auto-generated password. Set ADMIN_PASSWORD env var for reproducible setup.`)
        console.log(`   ⚠️  Password not displayed for security. Use password reset if needed.`)
      }
    }

    console.log('')
    console.log('🎉 Admin setup complete!')
    console.log('')
    console.log('📋 Admin Access URLs:')
    console.log(`   CMS Admin: http://localhost:3000/admin`)
    console.log('')
    console.log('🔐 Admin Credentials:')
    console.log(`   Email: admin@revampit.ch`)
    console.log(`   Password: [Not displayed for security]`)
    console.log(`   Set ADMIN_PASSWORD env var for reproducible setup.`)
    console.log(`   Or check ADMIN_PASSWORD_FILE if configured.`)

  } catch (error) {
    console.error('❌ Failed to setup admin users:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupAllAdmins()



