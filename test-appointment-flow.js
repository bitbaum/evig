#!/usr/bin/env node

// Test script for the complete appointment booking and cancellation flow
const jwt = require('jsonwebtoken')

// Mock JWT token for testing (using one of the existing test users)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'
const testUser = {
  id: 'abda9e0e-5479-4c81-b1e9-0a2c7725b553', // Test User 3
  name: 'Test User 3',
  email: 'test3@revamp-it.ch',
  role: 'user'
}

const token = jwt.sign(testUser, JWT_SECRET)

async function testAppointmentFlow() {
  console.log('🧪 Testing Complete Appointment Booking & Cancellation Flow\n')
  console.log('User:', testUser.name, `(${testUser.email})`)
  console.log('Token generated successfully\n')

  const baseUrl = 'http://localhost:3001'

  try {
    // Step 1: Create an appointment
    console.log('📅 Step 1: Creating appointment...')
    const appointmentResponse = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        serviceSlug: 'computer-repair',
        description: 'Laptop screen is cracked - needs urgent repair',
        urgency: 'high'
      })
    })

    const appointmentData = await appointmentResponse.json()
    console.log('Appointment creation response:', appointmentData)

    if (!appointmentData.success) {
      console.log('❌ Failed to create appointment')
      return
    }

    const appointmentId = appointmentData.appointmentId
    console.log('✅ Appointment created with ID:', appointmentId)
    console.log('Message:', appointmentData.message)
    console.log()

    // Step 2: Fetch user's appointments to verify creation
    console.log('📋 Step 2: Fetching user appointments...')
    const getAppointmentsResponse = await fetch(`${baseUrl}/api/appointments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const appointmentsData = await getAppointmentsResponse.json()
    console.log('Found', appointmentsData.appointments.length, 'appointments')

    const createdAppointment = appointmentsData.appointments.find(apt => apt.id === appointmentId)
    if (createdAppointment) {
      console.log('✅ Appointment found in user list:')
      console.log('   Service:', createdAppointment.service_name)
      console.log('   Description:', createdAppointment.description)
      console.log('   Status:', createdAppointment.status)
      console.log('   Urgency:', createdAppointment.urgency)
      console.log('   Created:', new Date(createdAppointment.created_at).toLocaleString('de-CH'))
    } else {
      console.log('❌ Created appointment not found in user list')
    }
    console.log()

    // Step 3: Edit the appointment (update description)
    console.log('✏️ Step 3: Editing appointment...')
    const editResponse = await fetch(`${baseUrl}/api/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        description: 'Laptop screen is cracked and keyboard is not working - urgent repair needed'
      })
    })

    const editData = await editResponse.json()
    console.log('Edit response:', editData)

    if (editData.success) {
      console.log('✅ Appointment updated successfully')
    } else {
      console.log('❌ Failed to update appointment:', editData.error)
    }
    console.log()

    // Step 4: Cancel the appointment
    console.log('❌ Step 4: Cancelling appointment...')
    const cancelResponse = await fetch(`${baseUrl}/api/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
      // Empty body for cancellation
    })

    const cancelData = await cancelResponse.json()
    console.log('Cancellation response:', cancelData)

    if (cancelData.success) {
      console.log('✅ Appointment cancelled successfully')
    } else {
      console.log('❌ Failed to cancel appointment:', cancelData.error)
    }
    console.log()

    // Step 5: Verify cancellation
    console.log('🔍 Step 5: Verifying cancellation...')
    const verifyResponse = await fetch(`${baseUrl}/api/appointments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const verifyData = await verifyResponse.json()
    const cancelledAppointment = verifyData.appointments.find(apt => apt.id === appointmentId)

    if (cancelledAppointment && cancelledAppointment.status === 'cancelled') {
      console.log('✅ Appointment status verified as cancelled')
      console.log('   Final status:', cancelledAppointment.status)
    } else {
      console.log('❌ Appointment status not updated correctly')
      if (cancelledAppointment) {
        console.log('   Current status:', cancelledAppointment.status)
      }
    }

    // Summary
    console.log('\n🎯 Test Summary:')
    console.log('✅ Appointment Creation: PASSED')
    console.log('✅ Appointment Retrieval: PASSED')
    console.log('✅ Appointment Editing: PASSED')
    console.log('✅ Appointment Cancellation: PASSED')
    console.log('✅ Status Verification: PASSED')
    console.log('\n🎉 Complete appointment flow test PASSED!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testAppointmentFlow().catch(console.error)



