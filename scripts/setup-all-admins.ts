import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

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
    } else {
      // Create CMS admin user
      const hashedPassword = await bcrypt.hash('Admin123!', 12)

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
      console.log(`   Password: Admin123!`)
    }

    // Setup Medusa Admin User
    console.log('🛒 Setting up Medusa admin user...')
    try {
      // Check if Medusa containers are running
      execSync('docker ps | grep -q revampit_medusa', { stdio: 'pipe' })

      // Try to create Medusa admin user
      try {
        execSync(`docker exec revampit_medusa_db psql -U medusa -d medusa_db -c "SELECT id FROM public.user WHERE email = 'admin2@revampit.ch';"`, {
          stdio: 'pipe'
        })
        console.log('✅ Medusa admin user already exists')
      } catch {
        // User doesn't exist, create it
        console.log('   Creating Medusa admin user...')
        execSync(`npx medusa user -e admin2@revampit.ch -p Admin123!`, {
          stdio: 'pipe',
          cwd: '/home/g/dev/revampit/medusa-backend'
        })
        console.log('✅ Medusa admin user created successfully')
        console.log(`   Email: admin2@revampit.ch`)
        console.log(`   Password: Admin123!`)
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
    console.log(`   Password: Admin123!`)

  } catch (error) {
    console.error('❌ Failed to setup admin users:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupAllAdmins()



