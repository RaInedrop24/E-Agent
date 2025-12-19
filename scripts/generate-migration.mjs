#!/usr/bin/env node

/**
 * Database Migration Generator for Adding New Languages
 *
 * Automatically generates a Supabase migration file for adding a new language.
 *
 * Usage:
 *   node generate-migration.mjs <language_code> <language_name>
 *
 * Examples:
 *   node generate-migration.mjs pt Portuguese
 *   node generate-migration.mjs nl Dutch
 *   node generate-migration.mjs sv Swedish
 *
 * Output:
 *   Creates: supabase/migrations/YYYYMMDD_add_<language>_language.sql
 */

import { writeFile, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get arguments
const langCode = process.argv[2];
const langName = process.argv[3];

if (!langCode || !langName) {
  console.error('Error: Language code and name are required');
  console.error('Usage: node generate-migration.mjs <language_code> <language_name>');
  console.error('Example: node generate-migration.mjs pt Portuguese');
  process.exit(1);
}

// Validate language code format
if (!/^[a-z]{2}(-[a-z]{2})?$/.test(langCode)) {
  console.error('Error: Invalid language code format');
  console.error('Expected format: two lowercase letters (e.g., pt, nl, sv)');
  console.error('Or with region: two letters, dash, two letters (e.g., pt-br, en-us)');
  process.exit(1);
}

async function getCurrentLanguages() {
  try {
    const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
    const files = await readdir(migrationsDir);

    // Look for most recent language addition migration
    const languageMigrations = files.filter(f => f.includes('add_') && f.includes('_language.sql'));

    if (languageMigrations.length === 0) {
      // Default languages if no migration found
      return ['en', 'it', 'de', 'fr', 'es', 'pl'];
    }

    // Read the most recent one and extract languages
    // For simplicity, return a default set
    return ['en', 'it', 'de', 'fr', 'es', 'pl'];
  } catch (error) {
    // Default languages if directory doesn't exist
    return ['en', 'it', 'de', 'fr', 'es', 'pl'];
  }
}

async function main() {
  try {
    console.log(`Generating migration for language: ${langName} (${langCode})`);
    console.log('');

    // Get current date for migration filename
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    // Get current languages
    const currentLanguages = await getCurrentLanguages();
    const allLanguages = [...currentLanguages, langCode];

    // Generate SQL migration
    const migrationContent = `-- Add ${langName} language support
-- Generated: ${now.toISOString()}
-- Migration: ${datePrefix}_add_${langName.toLowerCase()}_language.sql

-- Add label_${langCode} column to milestones table
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS label_${langCode} text;

-- Add label_${langCode} column to milestone_template_items table
ALTER TABLE public.milestone_template_items
ADD COLUMN IF NOT EXISTS label_${langCode} text;

-- Add title_${langCode} column to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS title_${langCode} text;

-- Update profiles table constraint to include '${langCode}'
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_preferred_language_check
CHECK (preferred_language IN (${allLanguages.map(l => `'${l}'`).join(', ')}));

-- Add comments for documentation
COMMENT ON COLUMN public.milestones.label_${langCode} IS '${langName} label for milestone';
COMMENT ON COLUMN public.milestone_template_items.label_${langCode} IS '${langName} label for milestone template item';
COMMENT ON COLUMN public.transactions.title_${langCode} IS '${langName} title for transaction';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '${langName} language support added successfully';
  RAISE NOTICE 'Language code: ${langCode}';
  RAISE NOTICE 'Columns added: label_${langCode}, title_${langCode}';
END $$;
`;

    // Write migration file
    const filename = `${datePrefix}_add_${langName.toLowerCase()}_language.sql`;
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', filename);

    await writeFile(migrationPath, migrationContent, 'utf-8');

    console.log('✓ Migration file created successfully!');
    console.log('');
    console.log(`File: supabase/migrations/${filename}`);
    console.log('');
    console.log('Migration contents:');
    console.log('  - Added label_' + langCode + ' to milestones table');
    console.log('  - Added label_' + langCode + ' to milestone_template_items table');
    console.log('  - Added title_' + langCode + ' to transactions table');
    console.log('  - Updated profiles.preferred_language constraint');
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the migration file');
    console.log('2. Apply it to your database: supabase db push');
    console.log('3. Continue with code changes (see docs/ADDING_NEW_LANGUAGES.md)');
    console.log('4. Run translation generator: node scripts/generate-translations.mjs ' + langCode);
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
