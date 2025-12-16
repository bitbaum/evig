/**
 * Test script for the new database schema
 * Run with: npx ts-node test-new-schema.ts
 */

import { query, getUserWithProfile, createUser, updateProfile, getActiveUserRoles, getRolePermissions, setUserPreference, getUserPreferences } from './src/lib/auth/db';

async function testNewSchema() {
  console.log('🧪 Testing new database schema...\n');

  try {
    // Test 1: Check user roles
    console.log('1. Testing user roles...');
    const roles = await getActiveUserRoles();
    console.log(`   Found ${roles.length} active roles:`, roles.map(r => r.slug).join(', '));

    if (roles.length === 0) {
      throw new Error('No user roles found!');
    }

    // Test 2: Check permissions for customer role
    console.log('\n2. Testing permissions system...');
    const customerRole = roles.find(r => r.slug === 'customer');
    if (customerRole) {
      const permissions = await getRolePermissions(customerRole.id);
      console.log(`   Customer role has ${permissions.length} permissions`);
      console.log('   Sample permissions:', permissions.slice(0, 3).map(p => `${p.resource}:${p.action}`).join(', '));
    }

    // Test 3: Create a test user
    console.log('\n3. Testing user creation with new schema...');
    const testUser = await createUser({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'customer'
    });
    console.log(`   Created user: ${testUser.email} with role_id: ${testUser.role_id}`);

    // Test 4: Test profile creation/update
    console.log('\n4. Testing profile functionality...');
    const testProfile = await updateProfile(testUser.id, {
      first_name: 'Test',
      last_name: 'User',
      bio: 'This is a test profile',
      skills: ['JavaScript', 'TypeScript', 'React'],
      expertise_areas: ['Web Development', 'Database Design'],
      gender: 'prefer_not_to_say',
      occupation: 'Software Developer'
    });
    console.log(`   Updated profile for user ${testUser.id}`);

    // Test 5: Get user with full profile and role info
    console.log('\n5. Testing getUserWithProfile...');
    const fullUser = await getUserWithProfile(testUser.id);
    console.log(`   User has profile: ${!!fullUser?.profile}`);
    console.log(`   User has role info: ${!!fullUser?.role_info}`);
    console.log(`   User has permissions: ${!!fullUser?.permissions}`);

    if (fullUser?.profile) {
      console.log(`   Profile skills: ${fullUser.profile.skills?.join(', ') || 'none'}`);
      console.log(`   Profile expertise: ${fullUser.profile.expertise_areas?.join(', ') || 'none'}`);
    }

    // Test 6: Test customer preferences
    console.log('\n6. Testing customer preferences...');
    const { setUserPreference, getUserPreferences } = require('./src/lib/auth/db.ts');
    await setUserPreference(testUser.id, 'theme', 'dark');
    await setUserPreference(testUser.id, 'notifications', { email: true, push: false });

    const preferences = await getUserPreferences(testUser.id);
    console.log(`   User has ${preferences.length} preferences set`);

    console.log('\n✅ All tests passed! New schema is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testNewSchema();
