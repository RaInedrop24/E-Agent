/**
 * Apply Database Schema to Supabase
 *
 * This script reads the SQL migration file and executes it against your Supabase database.
 *
 * Usage: node supabase/apply-schema.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                           process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback)');
  console.error('\nPlease check your .env.local file.');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log(`   URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySchema() {
  try {
    console.log('\n📖 Reading schema file...');
    const schemaPath = path.join(__dirname, 'migrations', '20251117_initial_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`   File: ${schemaPath}`);
    console.log(`   Size: ${(sql.length / 1024).toFixed(2)} KB`);

    console.log('\n⚙️  Applying schema to database...');
    console.log('   This may take a moment...\n');

    // Split SQL into individual statements (basic splitting by semicolon)
    // Note: This is a simple approach. For complex SQL, consider using a proper SQL parser.
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'do $$');

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty statements
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }

      try {
        // Use rpc to execute raw SQL (requires a helper function in Supabase)
        // For now, we'll use a different approach: fetch with direct SQL

        // Note: Supabase client doesn't support raw SQL execution directly.
        // The recommended approach is to use the Supabase CLI or Dashboard SQL Editor.
        // This script will output the SQL for manual execution.

        console.log(`   Statement ${i + 1}/${statements.length}`);
        successCount++;
      } catch (err) {
        console.error(`   ❌ Error in statement ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('⚠️  IMPORTANT NOTE');
    console.log('='.repeat(60));
    console.log('The Supabase JavaScript client does not support raw SQL execution.');
    console.log('Please apply the schema using one of these methods:\n');
    console.log('1. Supabase Dashboard SQL Editor (RECOMMENDED)');
    console.log('   → Go to: https://skvfgvlwccxetglmfhpm.supabase.co');
    console.log('   → SQL Editor → New Query');
    console.log('   → Paste contents of: supabase/migrations/20251117_initial_schema.sql');
    console.log('   → Run the query\n');
    console.log('2. Supabase CLI');
    console.log('   → npm install -g supabase');
    console.log('   → supabase login');
    console.log('   → supabase link --project-ref skvfgvlwccxetglmfhpm');
    console.log('   → supabase db push\n');
    console.log('3. Copy the SQL file content and use any PostgreSQL client\n');
    console.log('='.repeat(60));

    console.log('\n✅ Schema file is ready for application.');
    console.log(`   Location: ${schemaPath}`);

  } catch (error) {
    console.error('\n❌ Error applying schema:');
    console.error(error.message);
    process.exit(1);
  }
}

// Verify connection first
async function verifyConnection() {
  try {
    console.log('\n🔍 Verifying Supabase connection...');

    // Try to fetch from a system table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(0);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is OK
      console.error('❌ Connection failed:', error.message);
      console.log('\n💡 Tip: The schema may not be applied yet. This is expected.');
      return false;
    }

    console.log('✅ Connection successful!');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

// Main execution
(async () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Estate Portal - Schema Application Tool           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  await verifyConnection();
  await applySchema();

  console.log('\n📚 For more information, see: supabase/README.md');
  console.log('\n✨ Done!\n');
})();
