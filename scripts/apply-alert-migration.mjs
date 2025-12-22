import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials.');
  process.exit(1);
}

console.log('🔧 Applying Alert Settings Migration...\n');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runSql(filePath) {
  try {
    const sql = readFileSync(filePath, 'utf8');
    console.log(`\n📄 Executing ${filePath.split(/[\\/]/).pop()}...`);
    
    // Using simple split for multiple statements if exec_sql is not available
    // Note: This simple split might break on complex SQL, but works for simple ALTER/CREATE
    // Ideally we use pg-postgres or the exec_sql RPC if it exists.
    // Let's try RPC first.
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
       console.log('   ⚠️  RPC exec_sql not found or failed, trying direct statement execution via client (only works if RLS allows or using service role on certain paths)...');
       console.log('   Actually, Supabase JS client cannot run raw SQL directly without RPC.');
       console.log('   Please run the SQL in the Supabase Dashboard SQL Editor.');
       console.log('   File:', filePath);
    } else {
      console.log('✅ Success');
    }
  } catch (err) {
    console.error('❌ Script Error:', err.message);
  }
}

(async () => {
  const migrationFile = join(__dirname, '../supabase/migrations/20251222_add_alert_settings.sql');
  await runSql(migrationFile);
  console.log('\n🎉 Done! (If RPC failed, please run SQL manually)');
})();
