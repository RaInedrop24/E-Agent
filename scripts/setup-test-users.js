const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupUsers() {
  console.log('🚀 Setting up test users...');

  const users = [
    {
      email: 'Eagent_Admin@rainedrop.co.uk',
      password: process.env.TEST_AGENT_PASSWORD || 'PLACEHOLDER_PASSWORD_CHANGE_ME',
      full_name: 'Admin',
      role: 'agent'
    },
    {
      email: 'eagent_louise@rainedrop.co.uk',
      password: process.env.TEST_BUYER_PASSWORD || 'PLACEHOLDER_PASSWORD_CHANGE_ME', // We reset password to ensure we know it if needed, or just ensure existence
      full_name: 'Louise',
      role: 'buyer'
    }
  ];

  for (const u of users) {
    console.log(`\nProcessing ${u.email}...`);
    
    // Check if user exists
    const { data: { users: foundUsers }, error: searchError } = await supabase.auth.admin.listUsers();
    let userId;
    
    // Simple search (listUsers doesn't support filter by email easily in all versions, checking manually)
    const existingUser = foundUsers.find(user => user.email === u.email);

    if (existingUser) {
      console.log('✅ User exists in Auth');
      userId = existingUser.id;
    } else {
      console.log('⚠️  User not found, creating...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
          role: u.role,
          preferred_language: 'en'
        }
      });

      if (createError) {
        console.error('❌ Failed to create user:', createError.message);
        continue;
      }
      console.log('✅ User created');
      userId = newUser.user.id;
    }

    // Check/Create Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      console.log('✅ Profile exists');
      // Update role if needed
      if (profile.role !== u.role) {
         console.log(`Updating role from ${profile.role} to ${u.role}`);
         await supabase.from('profiles').update({ role: u.role }).eq('id', userId);
      }
    } else {
      console.log('⚠️  Profile missing, creating...');
      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: u.full_name,
        role: u.role,
        preferred_language: 'en'
      });

      if (insertError) {
        console.error('❌ Failed to create profile:', insertError.message);
      } else {
        console.log('✅ Profile created');
      }
    }
  }
}

setupUsers().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});

