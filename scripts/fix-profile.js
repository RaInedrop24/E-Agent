/**
 * Script to manually create profile for test user
 * Run with: node scripts/fix-profile.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  const envFile = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfile() {
  console.log('🔧 Fixing profile for test user...\n');

  // Login as the test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'Eagent_Admin@rainedrop.co.uk',
    password: 'EA@l0u15e001',
  });

  if (authError) {
    console.error('❌ Login failed:', authError.message);
    process.exit(1);
  }

  console.log('✅ Logged in as:', authData.user.email);
  console.log('   User ID:', authData.user.id);

  // Check if profile exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (existingProfile) {
    console.log('✅ Profile already exists:', existingProfile);
    return;
  }

  console.log('⚠️  No profile found, creating...');

  // Create profile
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      full_name: authData.user.user_metadata.full_name || 'Admin',
      role: authData.user.user_metadata.role || 'agent',
      preferred_language: authData.user.user_metadata.preferred_language || 'en',
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create profile:', createError);

    // Try to provide more details
    console.error('\nError details:', JSON.stringify(createError, null, 2));

    // Check RLS policies
    console.log('\n💡 This might be an RLS policy issue.');
    console.log('   Please run the fix SQL in Supabase Dashboard:');
    console.log('   File: supabase/fix_rls_recursion.sql\n');

    process.exit(1);
  }

  console.log('✅ Profile created successfully!', newProfile);
  console.log('\n🎉 Done! You should now be able to access the dashboard.');
}

fixProfile().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
