#!/usr/bin/env node

/**
 * Translation Generator for E-Portal
 *
 * Automatically generates UI translations for a new language using DeepL API.
 *
 * Usage:
 *   node generate-translations.mjs <target_language_code>
 *
 * Examples:
 *   node generate-translations.mjs pt   # Portuguese
 *   node generate-translations.mjs nl   # Dutch
 *   node generate-translations.mjs sv   # Swedish
 *
 * Requirements:
 *   - DEEPL_API_KEY environment variable must be set
 *   - Node.js 18+
 *
 * Output:
 *   Creates: scripts/translations-output-<lang>.txt
 */

import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get target language from command line
const targetLang = process.argv[2];

if (!targetLang) {
  console.error('Error: Target language code is required');
  console.error('Usage: node generate-translations.mjs <target_language_code>');
  console.error('Example: node generate-translations.mjs pt');
  process.exit(1);
}

// Validate DeepL API key
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
if (!DEEPL_API_KEY) {
  console.error('Error: DEEPL_API_KEY environment variable is not set');
  console.error('Please set your DeepL API key:');
  console.error('  export DEEPL_API_KEY="your-api-key-here"');
  process.exit(1);
}

// DeepL language code mapping
const DEEPL_LANGUAGE_MAP = {
  'en': 'EN',
  'it': 'IT',
  'es': 'ES',
  'fr': 'FR',
  'de': 'DE',
  'pl': 'PL',
  'pt': 'PT-PT',     // European Portuguese
  'pt-br': 'PT-BR',  // Brazilian Portuguese
  'nl': 'NL',        // Dutch
  'sv': 'SV',        // Swedish
  'da': 'DA',        // Danish
  'fi': 'FI',        // Finnish
  'no': 'NB',        // Norwegian
  'cs': 'CS',        // Czech
  'hu': 'HU',        // Hungarian
  'ro': 'RO',        // Romanian
  'sk': 'SK',        // Slovak
  'sl': 'SL',        // Slovenian
  'bg': 'BG',        // Bulgarian
  'el': 'EL',        // Greek
  'et': 'ET',        // Estonian
  'lv': 'LV',        // Latvian
  'lt': 'LT',        // Lithuanian
  'ja': 'JA',        // Japanese
  'zh': 'ZH',        // Chinese (simplified)
  'ko': 'KO',        // Korean
  'ru': 'RU',        // Russian
  'uk': 'UK',        // Ukrainian
  'tr': 'TR',        // Turkish
  'ar': 'AR',        // Arabic
  'id': 'ID',        // Indonesian
};

// Get DeepL language code
const deeplLangCode = DEEPL_LANGUAGE_MAP[targetLang.toLowerCase()];
if (!deeplLangCode) {
  console.error(`Error: Unsupported language code '${targetLang}'`);
  console.error('\nSupported languages:');
  Object.keys(DEEPL_LANGUAGE_MAP).forEach(code => {
    console.error(`  ${code}`);
  });
  process.exit(1);
}

console.log(`Generating translations for: ${targetLang} (DeepL: ${deeplLangCode})`);
console.log('');

// Function to translate text using DeepL API
async function translateText(text, targetLang) {
  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      text: text,
      target_lang: targetLang,
      source_lang: 'EN',
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.translations[0].text;
}

// Function to translate batch of texts
async function translateBatch(texts, targetLang) {
  const params = new URLSearchParams({
    target_lang: targetLang,
    source_lang: 'EN',
  });

  // Add each text as a separate 'text' parameter
  texts.forEach(text => {
    params.append('text', text);
  });

  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepL API error: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();
  return data.translations.map(t => t.text);
}

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    // Read the ui-translations.ts file
    const filePath = join(__dirname, '..', 'src', 'lib', 'ui-translations.ts');
    console.log(`Reading translations from: ${filePath}`);
    const content = await readFile(filePath, 'utf-8');

    // Extract English translations using indexOf approach
    const enStart = content.indexOf('en: {');
    if (enStart === -1) {
      throw new Error('Could not find English translations section (en: {)');
    }

    // Find the matching closing brace for the en object
    let braceCount = 0;
    let inEnObject = false;
    let enEnd = -1;

    for (let i = enStart; i < content.length; i++) {
      const char = content[i];

      if (char === '{') {
        braceCount++;
        inEnObject = true;
      } else if (char === '}') {
        braceCount--;
        if (inEnObject && braceCount === 0) {
          enEnd = i;
          break;
        }
      }
    }

    if (enEnd === -1) {
      throw new Error('Could not find end of English translations section');
    }

    const englishSection = content.substring(enStart, enEnd + 1);
    console.log(`Extracted ${englishSection.length} characters from English section`);

    // Extract key-value pairs from English translations
    const translationRegex = /'([^']+)':\s*'([^']+)'/g;
    const translations = [];
    let match;

    while ((match = translationRegex.exec(englishSection)) !== null) {
      translations.push({
        key: match[1],
        value: match[2],
      });
    }

    console.log(`Found ${translations.length} translation keys to translate`);
    console.log('');

    if (translations.length === 0) {
      throw new Error('No translations found. Check the regex pattern or file format.');
    }

    // Translate in batches
    const batchSize = 50; // DeepL can handle multiple texts in one request
    const batches = [];

    for (let i = 0; i < translations.length; i += batchSize) {
      batches.push(translations.slice(i, i + batchSize));
    }

    console.log(`Processing ${batches.length} batches of translations...`);
    console.log('');

    const translatedResults = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Batch ${i + 1}/${batches.length}: Translating ${batch.length} keys...`);

      try {
        const textsToTranslate = batch.map(t => t.value);
        const translatedTexts = await translateBatch(textsToTranslate, deeplLangCode);

        batch.forEach((translation, index) => {
          translatedResults.push({
            key: translation.key,
            original: translation.value,
            translated: translatedTexts[index],
          });
        });

        console.log(`✓ Batch ${i + 1} completed`);
      } catch (error) {
        console.error(`✗ Batch ${i + 1} failed:`, error.message);
        throw error;
      }

      // Rate limiting: wait 1 second between batches
      if (i < batches.length - 1) {
        await sleep(1000);
      }
    }

    console.log('');
    console.log('Translation complete!');
    console.log('');

    // Format output for easy copying into ui-translations.ts
    let output = `// ${targetLang.toUpperCase()} Translations\n`;
    output += `// Generated: ${new Date().toISOString()}\n`;
    output += `// Total keys: ${translatedResults.length}\n\n`;
    output += `${targetLang}: {\n`;

    translatedResults.forEach(result => {
      // Escape single quotes in translated text
      const escapedTranslation = result.translated.replace(/'/g, "\\'");
      output += `  '${result.key}': '${escapedTranslation}',\n`;
    });

    output += '},\n\n';

    // Add instructions
    output += `\n// INSTRUCTIONS:\n`;
    output += `// 1. Copy the ${targetLang} object above\n`;
    output += `// 2. Paste it into src/lib/ui-translations.ts in the translations object\n`;
    output += `// 3. Update supportedTranslations array to include '${targetLang}'\n`;
    output += `// 4. Update the t() function type to include '${targetLang}'\n`;
    output += `// 5. Test the translations in the application\n`;

    // Write output to file
    const outputPath = join(__dirname, `translations-output-${targetLang}.txt`);
    await writeFile(outputPath, output, 'utf-8');

    console.log(`✓ Translations written to: ${outputPath}`);
    console.log('');
    console.log('Next steps:');
    console.log(`1. Review the translations in: translations-output-${targetLang}.txt`);
    console.log('2. Copy the translation object into src/lib/ui-translations.ts');
    console.log(`3. Update supportedTranslations array to include '${targetLang}'`);
    console.log(`4. Update the t() function type to include '${targetLang}'`);
    console.log('5. Follow the complete guide in docs/ADDING_NEW_LANGUAGES.md');
    console.log('');
    console.log('Done!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
