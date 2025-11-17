/**
 * Script to check if SQL fix has been applied and apply it if needed
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkIfFixApplied() {
  console.log('🔍 Checking if SQL fix has been applied...');

  try {
    // Check if the create_profile_for_current_user function exists
    const { data, error } = await supabase.rpc('create_profile_for_current_user');

    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ SQL fix NOT applied - function does not exist');
        return false;
      }
      // Function exists but we're not authenticated (expected)
      if (error.message.includes('Not authenticated') || error.message.includes('JWT')) {
        console.log('✅ SQL fix appears to be applied (function exists)');
        return true;
      }
      console.log('⚠️  Unexpected error:', error.message);
      return false;
    }

    console.log('✅ SQL fix is applied');
    return true;
  } catch (err) {
    console.error('Error checking fix status:', err.message);
    return false;
  }
}

async function applySQLFix() {
  console.log('\n📝 Applying SQL fix...');

  const sqlFilePath = path.join(__dirname, '..', 'supabase', 'APPLY_THIS_FIX.sql');

  if (!fs.existsSync(sqlFilePath)) {
    console.error('❌ SQL fix file not found:', sqlFilePath);
    return false;
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.length < 10) {
      continue;
    }

    console.log(`Executing statement ${i + 1}/${statements.length}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception on statement ${i + 1}:`, err.message);
    }
  }

  console.log('\n⚠️  Note: Direct SQL execution via RPC may not be available.');
  console.log('If the above failed, you need to apply the SQL manually:');
  console.log('1. Go to: https://skvfgvlwccxetglmfhpm.supabase.co');
  console.log('2. Navigate to SQL Editor → New Query');
  console.log('3. Copy contents of: supabase/APPLY_THIS_FIX.sql');
  console.log('4. Paste and click RUN');

  return false;
}

async function main() {
  console.log('🚀 SQL Fix Application Tool\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Service Key:', supabaseServiceKey ? '***' + supabaseServiceKey.slice(-8) : 'Missing');
  console.log('');

  const isApplied = await checkIfFixApplied();

  if (isApplied) {
    console.log('\n✅ SQL fix is already applied. No action needed.');
    console.log('You can proceed with testing at http://localhost:3001/debug/profile');
    process.exit(0);
  }

  console.log('\n⚠️  SQL fix needs to be applied manually.');
  console.log('\n📋 Instructions:');
  console.log('1. Open: https://skvfgvlwccxetglmfhpm.supabase.co');
  console.log('2. Go to: SQL Editor → New Query');
  console.log('3. Open file: supabase/APPLY_THIS_FIX.sql');
  console.log('4. Copy the ENTIRE file contents');
  console.log('5. Paste into SQL Editor');
  console.log('6. Click RUN');
  console.log('7. Run this script again to verify');

  process.exit(1);
}

main();
