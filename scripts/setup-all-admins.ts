import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { execSync } from 'child_process'
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

    // Setup Medusa Admin User
    console.log('🛒 Setting up Medusa admin user...')
    try {
      // Check if Medusa containers are running
      execSync('docker ps | grep -q revampit_medusa', { stdio: 'pipe' })

      // Check if Medusa admin user exists by parsing query output
      let medusaUserExists = false
      try {
        const queryOutput = execSync(
          `docker exec revampit_medusa_db psql -U medusa -d medusa_db -t -c "SELECT COUNT(*) FROM public.user WHERE email = 'admin2@revampit.ch';"`,
          { stdio: 'pipe', encoding: 'utf-8' }
        )
        // Parse output: should be a number (0 or 1)
        const count = parseInt(queryOutput.trim(), 10)
        medusaUserExists = count > 0
      } catch (error) {
        // Query failed, assume user doesn't exist
        medusaUserExists = false
      }

      if (medusaUserExists) {
        console.log('✅ Medusa admin user already exists')
        console.log(`   Email: admin2@revampit.ch`)
        console.log(`   Note: Password was set during initial setup. Use password reset if needed.`)
      } else {
        // User doesn't exist, create it
        const medusaPassword = process.env.MEDUSA_ADMIN_PASSWORD || getAdminPassword()
        console.log('   Creating Medusa admin user...')
        
        try {
          execSync(`npx medusa user -e admin2@revampit.ch -p ${medusaPassword}`, {
            stdio: 'pipe',
            cwd: '/home/g/dev/revampit/medusa-backend'
          })
          console.log('✅ Medusa admin user created successfully')
          console.log(`   Email: admin2@revampit.ch`)
          console.log(`   Password: [SECURE - Check .env or script output file]`)
          
          // Write password to secure file if configured
          if (typeof process.env.ADMIN_PASSWORD_FILE === 'string') {
            const fs = await import('fs/promises')
            await fs.appendFile(process.env.ADMIN_PASSWORD_FILE, `Medusa Admin Password: ${medusaPassword}\n`, { mode: 0o600 })
          } else if (!process.env.MEDUSA_ADMIN_PASSWORD) {
            console.log(`   ⚠️  Auto-generated password. Set MEDUSA_ADMIN_PASSWORD env var for reproducible setup.`)
            console.log(`   ⚠️  Password not displayed for security. Use password reset if needed.`)
          }
        } catch (createError) {
          console.error('❌ Failed to create Medusa admin user:', createError)
          throw createError
        }
      }
    } catch (error) {
      console.log('⚠️  Medusa containers not running. Start them with: npm run medusa:up')
      console.log('   Then run this script again to create the Medusa admin user.')
    }

    console.log('')
    console.log('🎉 Admin setup complete!')
    console.log('')
    console.log('📋 Admin Access URLs:')
    console.log(`   CMS Admin:    http://localhost:3000/admin`)
    console.log(`   Medusa Admin: http://localhost:9000/app`)
    console.log(`   Shop Frontend: http://localhost:3000/shop/medusa`)
    console.log('')
    console.log('🔐 Admin Credentials:')
    console.log(`   Email: admin@revampit.ch or admin2@revampit.ch`)
    console.log(`   Password: [Not displayed for security]`)
    console.log(`   Set ADMIN_PASSWORD or MEDUSA_ADMIN_PASSWORD env vars for reproducible setup.`)
    console.log(`   Or check ADMIN_PASSWORD_FILE if configured.`)

  } catch (error) {
    console.error('❌ Failed to setup admin users:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupAllAdmins()



