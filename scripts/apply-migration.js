/**
 * Apply a specific SQL migration to Supabase
 * Usage: node scripts/apply-migration.js <migration-file>
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
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const migrationFile = process.argv[2] || '20251211_add_buyer_by_id_function.sql';
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

console.log(`📖 Reading migration: ${migrationFile}`);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('\n⚙️  Applying migration to Supabase...\n');

// Use fetch to execute SQL via Supabase's PostgREST API
async function executeSql() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // If the RPC doesn't exist, we need to apply via SQL Editor
      console.log('⚠️  Direct SQL execution not available.');
      console.log('\nPlease apply this migration manually:\n');
      console.log('1. Go to Supabase Dashboard SQL Editor');
      console.log(`2. Copy contents from: ${migrationPath}`);
      console.log('3. Paste and run in SQL Editor\n');
      console.log('Migration SQL:');
      console.log('='.repeat(60));
      console.log(sql);
      console.log('='.repeat(60));
      return;
    }

    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPlease apply this migration manually:\n');
    console.log('1. Go to Supabase Dashboard SQL Editor');
    console.log(`2. Copy contents from: ${migrationPath}`);
    console.log('3. Paste and run in SQL Editor\n');
  }
}

executeSql();
