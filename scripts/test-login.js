const { createClient } = require('@supabase/supabase-js');

// Read env manually
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl, supabaseAnonKey;

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)\s*=\s*(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseAnonKey = value;
  }
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testing login...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_AGENT_EMAIL || 'Eagent_Admin@rainedrop.co.uk',
    password: process.env.TEST_AGENT_PASSWORD || 'CHANGE_ME',
  });
  
  if (error) {
    console.error('Login error:', error);
    return;
  }
  
  console.log('✅ Login successful!');
  console.log('User ID:', data.user.id);
  console.log('Email:', data.user.email);
  
  // Try to fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  if (profileError) {
    console.error('❌ Profile fetch error:', profileError.message);
    
    // Try to create profile
    console.log('\nAttempting to create profile...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('create_profile_for_current_user');
    
    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
    } else {
      console.log('✅ Profile created:', rpcData);
    }
  } else {
    console.log('✅ Profile exists:', profile);
  }
}

testLogin();
