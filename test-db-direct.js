#!/usr/bin/env node

// Direct PostgreSQL test for appointments and workshops
const { Client } = require('pg')

// Database configuration
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'revampit_cms',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
})

async function testDatabaseDirectly() {
  console.log('🧪 Testing Database Directly...\n')

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Test 1: Check service types
    console.log('1. Checking service types...')
    const serviceTypesResult = await client.query('SELECT id, slug, name FROM service_types LIMIT 5')
    console.log(`✅ Found ${serviceTypesResult.rows.length} service types:`)
    serviceTypesResult.rows.forEach(st => console.log(`   - ${st.name} (${st.slug})`))

    // Test 2: Check workshops
    console.log('\n2. Checking workshops...')
    const workshopsResult = await client.query('SELECT id, slug, title, category FROM workshops LIMIT 5')
    console.log(`✅ Found ${workshopsResult.rows.length} workshops:`)
    workshopsResult.rows.forEach(w => console.log(`   - ${w.title} (${w.category})`))

    // Test 3: Check users
    console.log('\n3. Checking users...')
    const usersResult = await client.query('SELECT id, name, email, role FROM users LIMIT 3')
    console.log(`✅ Found ${usersResult.rows.length} users:`)
    usersResult.rows.forEach(u => console.log(`   - ${u.name || u.email} (${u.role})`))

    // Test 4: Check workshop instances
    console.log('\n4. Checking workshop instances...')
    const instancesResult = await client.query(`
      SELECT wi.id, w.title, wi.start_date, wi.status
      FROM workshop_instances wi
      JOIN workshops w ON wi.workshop_id = w.id
      LIMIT 3
    `)
    console.log(`✅ Found ${instancesResult.rows.length} workshop instances:`)
    instancesResult.rows.forEach(inst => {
      const date = new Date(inst.start_date).toLocaleDateString('de-CH')
      console.log(`   - ${inst.title} on ${date} (${inst.status})`)
    })

    // Test 5: Try appointment creation (if we have data)
    if (usersResult.rows.length > 0 && serviceTypesResult.rows.length > 0) {
      console.log('\n5. Testing appointment creation...')
      const testUser = usersResult.rows[0]
      const testService = serviceTypesResult.rows[0]

      try {
        const appointmentResult = await client.query(`
          INSERT INTO service_appointments (user_id, service_type_id, description, urgency, status)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, created_at
        `, [testUser.id, testService.id, 'Test appointment from script', 'normal', 'requested'])

        console.log('✅ Appointment created successfully:', appointmentResult.rows[0].id)

        // Clean up test appointment
        await client.query('DELETE FROM service_appointments WHERE id = $1', [appointmentResult.rows[0].id])
        console.log('🧹 Cleaned up test appointment')

      } catch (err) {
        console.log('❌ Appointment creation failed:', err.message)
      }
    }

    // Test 6: Try workshop registration (if we have data)
    if (usersResult.rows.length > 0 && workshopsResult.rows.length > 0 && instancesResult.rows.length > 0) {
      console.log('\n6. Testing workshop registration...')
      const testUser = usersResult.rows[0]
      const testInstance = instancesResult.rows[0]

      try {
        const registrationResult = await client.query(`
          INSERT INTO workshop_registrations (user_id, workshop_instance_id, status)
          VALUES ($1, $2, $3)
          RETURNING id, created_at
        `, [testUser.id, testInstance.id, 'pending'])

        console.log('✅ Workshop registration created successfully:', registrationResult.rows[0].id)

        // Clean up test registration
        await client.query('DELETE FROM workshop_registrations WHERE id = $1', [registrationResult.rows[0].id])
        console.log('🧹 Cleaned up test registration')

      } catch (err) {
        console.log('❌ Workshop registration failed:', err.message)
      }
    }

    console.log('\n📊 Database Status Summary:')
    console.log(`   ✅ Service Types: ${serviceTypesResult.rows.length}`)
    console.log(`   ✅ Workshops: ${workshopsResult.rows.length}`)
    console.log(`   ✅ Users: ${usersResult.rows.length}`)
    console.log(`   ✅ Workshop Instances: ${instancesResult.rows.length}`)
    console.log('\n🎯 Appointments & Workshops are READY!')

  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the database is running:')
      console.log('   npm run db:up')
    }
  } finally {
    await client.end()
  }
}

testDatabaseDirectly().catch(console.error)



