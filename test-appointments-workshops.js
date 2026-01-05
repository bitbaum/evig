#!/usr/bin/env node

// Test script to verify appointments and workshops functionality
// This script tests the core functionality without requiring a running frontend

const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:5432'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function testAppointmentsAndWorkshops() {
  console.log('🧪 Testing Appointments and Workshops functionality...\n')

  try {
    // Test 1: Check if service types exist
    console.log('1. Checking service types...')
    const { data: serviceTypes, error: serviceError } = await supabase
      .from('service_types')
      .select('*')
      .limit(5)

    if (serviceError) {
      console.log('❌ Service types query failed:', serviceError.message)
    } else {
      console.log('✅ Found service types:', serviceTypes.length)
      serviceTypes.forEach(st => console.log(`   - ${st.name} (${st.slug})`))
    }

    // Test 2: Check if workshops exist
    console.log('\n2. Checking workshops...')
    const { data: workshops, error: workshopError } = await supabase
      .from('workshops')
      .select('*')
      .limit(5)

    if (workshopError) {
      console.log('❌ Workshops query failed:', workshopError.message)
    } else {
      console.log('✅ Found workshops:', workshops.length)
      workshops.forEach(w => console.log(`   - ${w.title} (${w.slug})`))
    }

    // Test 3: Check if users exist
    console.log('\n3. Checking users...')
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(3)

    if (userError) {
      console.log('❌ Users query failed:', userError.message)
    } else {
      console.log('✅ Found users:', users.length)
      users.forEach(u => console.log(`   - ${u.name || u.email} (${u.role})`))
    }

    // Test 4: Try to create a test appointment (if we have a user)
    if (users && users.length > 0 && serviceTypes && serviceTypes.length > 0) {
      console.log('\n4. Testing appointment creation...')
      const testUser = users[0]
      const testService = serviceTypes[0]

      // Note: This would normally go through the API endpoint, but for testing we'll insert directly
      console.log(`   Attempting to create appointment for user ${testUser.id} with service ${testService.name}`)

      // Check if we can insert (this will fail if RLS is enabled and we don't have proper auth)
      try {
        const { data: appointment, error: insertError } = await supabase
          .from('service_appointments')
          .insert({
            user_id: testUser.id,
            service_type_id: testService.id,
            description: 'Test appointment from script',
            urgency: 'normal',
            status: 'requested'
          })
          .select()
          .single()

        if (insertError) {
          console.log('❌ Appointment creation failed:', insertError.message)
          console.log('   This might be due to RLS policies or missing authentication')
        } else {
          console.log('✅ Appointment created successfully:', appointment.id)
        }
      } catch (err) {
        console.log('❌ Appointment creation error:', err.message)
      }
    }

    // Test 5: Check workshop instances
    console.log('\n5. Checking workshop instances...')
    const { data: instances, error: instanceError } = await supabase
      .from('workshop_instances')
      .select(`
        id,
        workshop_id,
        start_date,
        status,
        workshops (
          title,
          category
        )
      `)
      .limit(3)

    if (instanceError) {
      console.log('❌ Workshop instances query failed:', instanceError.message)
    } else {
      console.log('✅ Found workshop instances:', instances.length)
      instances.forEach(inst => console.log(`   - ${inst.workshops?.title} on ${new Date(inst.start_date).toLocaleDateString('de-CH')}`))
    }

    // Summary
    console.log('\n📊 Summary:')
    console.log(`   Service Types: ${serviceTypes?.length || 0}`)
    console.log(`   Workshops: ${workshops?.length || 0}`)
    console.log(`   Users: ${users?.length || 0}`)
    console.log(`   Workshop Instances: ${instances?.length || 0}`)

    console.log('\n🎯 Next steps to make appointments & workshops work:')
    console.log('   1. Ensure database is running and accessible')
    console.log('   2. Verify authentication is working')
    console.log('   3. Test API endpoints for appointment booking')
    console.log('   4. Test workshop registration functionality')
    console.log('   5. Set up proper scheduling/calendar integration')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testAppointmentsAndWorkshops().catch(console.error)



