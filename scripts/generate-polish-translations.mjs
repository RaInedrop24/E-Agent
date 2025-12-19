/**
 * Generate Polish translations using DeepL API
 * This script extracts English translations and generates Polish versions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note: DEEPL_API_KEY should be set in environment
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

if (!DEEPL_API_KEY) {
  console.error('❌ DEEPL_API_KEY environment variable not set');
  console.error('Please set it with: export DEEPL_API_KEY="your-key-here"');
  process.exit(1);
}

async function translateText(text, targetLang = 'PL') {
  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      target_lang: targetLang,
      source_lang: 'EN',
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepL API error: ${response.status} - ${await response.text()}`);
  }

  const result = await response.json();
  return result.translations[0].text;
}

async function translateBatch(texts, targetLang = 'PL') {
  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: texts,
      target_lang: targetLang,
      source_lang: 'EN',
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepL API error: ${response.status} - ${await response.text()}`);
  }

  const result = await response.json();
  return result.translations.map(t => t.text);
}

// Extract English translations from ui-translations.ts
function extractEnglishTranslations() {
  const filePath = path.join(__dirname, '..', 'src', 'lib', 'ui-translations.ts');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Find the start of en object
  const enStart = content.indexOf('  en: {');
  if (enStart === -1) {
    throw new Error('Could not find "en: {" in file');
  }

  // Find the end of en object (closing brace before it:)
  const itStart = content.indexOf('  it: {', enStart);
  if (itStart === -1) {
    throw new Error('Could not find "it: {" in file');
  }

  // Extract just the en section
  const enSection = content.substring(enStart, itStart);
  const translations = {};

  // Parse key-value pairs - handle single quotes in values
  const lines = enSection.split('\n');
  for (const line of lines) {
    // Match pattern: '    'key': 'value','
    const match = line.match(/^\s*'([^']+)':\s*'(.*)'/);
    if (match) {
      const key = match[1];
      let value = match[2];
      // Remove trailing comma if present
      value = value.replace(/,\s*$/, '')
      translations[key] = value;
    }
  }

  return translations;
}

async function main() {
  console.log('🚀 Starting Polish translation generation...\n');

  // Extract English translations
  console.log('📖 Extracting English translations...');
  const englishTranslations = extractEnglishTranslations();
  const keys = Object.keys(englishTranslations);
  console.log(`✓ Found ${keys.length} translation keys\n`);

  // Translate in batches (DeepL allows up to 50 texts per request)
  const BATCH_SIZE = 50;
  const polishTranslations = {};

  console.log('🌐 Translating to Polish using DeepL API...');

  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE);
    const texts = batch.map(key => englishTranslations[key]);

    try {
      console.log(`  Translating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(keys.length / BATCH_SIZE)} (${batch.length} texts)...`);
      const translated = await translateBatch(texts);

      batch.forEach((key, index) => {
        polishTranslations[key] = translated[index];
      });

      // Rate limiting - wait 1 second between batches
      if (i + BATCH_SIZE < keys.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error translating batch: ${error.message}`);
      throw error;
    }
  }

  console.log('✓ Translation complete!\n');

  // Generate Polish translations object
  console.log('📝 Generating Polish translations object...');
  let plObject = '  pl: {\n';

  keys.forEach((key, index) => {
    const value = polishTranslations[key].replace(/'/g, "\\'");
    plObject += `    '${key}': '${value}'`;
    if (index < keys.length - 1) {
      plObject += ',';
    }
    plObject += '\n';
  });

  plObject += '  },';

  // Write to output file
  const outputPath = path.join(__dirname, 'polish-translations-output.txt');
  fs.writeFileSync(outputPath, plObject, 'utf-8');

  console.log(`✓ Polish translations written to: ${outputPath}\n`);
  console.log('📋 Next steps:');
  console.log('1. Review the translations in polish-translations-output.txt');
  console.log('2. Add the pl object to src/lib/ui-translations.ts after the it object');
  console.log('3. Update supportedTranslations array to include "pl"');
  console.log('4. Update getSupportedLanguages() function to include Polish\n');

  console.log('✅ Done!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
