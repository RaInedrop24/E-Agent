#!/usr/bin/env node

/**
 * Integrate French, Spanish, and Dutch translations into ui-translations.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting translation integration...\n');

// Read the translation files
const frContent = readFileSync(join(__dirname, 'translations-output-fr.txt'), 'utf-8');
const esContent = readFileSync(join(__dirname, 'translations-output-es.txt'), 'utf-8');
const nlContent = readFileSync(join(__dirname, 'translations-output-nl.txt'), 'utf-8');

// Extract just the translation objects (remove the comments and instructions)
function extractTranslationObject(content) {
  const lines = content.split('\n');
  const start = lines.findIndex(line => line.match(/^(fr|es|nl):\s*\{/));
  const end = lines.findIndex((line, index) => index > start && line.match(/^\},/));

  if (start === -1 || end === -1) {
    throw new Error('Could not find translation object boundaries');
  }

  return lines.slice(start, end + 1).join('\n');
}

const frTranslations = extractTranslationObject(frContent);
const esTranslations = extractTranslationObject(esContent);
const nlTranslations = extractTranslationObject(nlContent);

console.log('✓ Extracted translation objects from generated files\n');

// Read the ui-translations.ts file
const uiTranslationsPath = join(__dirname, '..', 'src', 'lib', 'ui-translations.ts');
let uiContent = readFileSync(uiTranslationsPath, 'utf-8');

// Find the position to insert the translations (after the pl object)
// Look for the pattern "  },\n} as const;"
const insertMarker = '} as const;';
const insertPosition = uiContent.indexOf(insertMarker);

if (insertPosition === -1) {
  throw new Error('Could not find "} as const;" marker in ui-translations.ts');
}

// Find the position before "} as const;" to insert new translations
const beforeInsert = uiContent.substring(0, insertPosition);
const afterInsert = uiContent.substring(insertPosition);

// Build the new content with all translations (add proper indentation)
const newContent = beforeInsert +
  '\n  ' + esTranslations +
  '\n\n  ' + frTranslations +
  '\n\n  ' + nlTranslations +
  '\n' + afterInsert;

console.log('✓ Inserted French, Spanish, and Dutch translations\n');

// Update the supportedTranslations array
const updatedContent = newContent.replace(
  /const supportedTranslations: SupportedLanguage\[\] = \[[^\]]+\];/,
  "const supportedTranslations: SupportedLanguage[] = ['en', 'it', 'pl', 'es', 'fr', 'nl'];"
);

console.log('✓ Updated supportedTranslations array\n');

// Update the language type in the t() function
const finalContent = updatedContent.replace(
  /const languageToUse = \(supportedTranslations\.includes\(lang\) \? lang : 'en'\) as '[^']+';/,
  "const languageToUse = (supportedTranslations.includes(lang) ? lang : 'en') as 'en' | 'it' | 'pl' | 'es' | 'fr' | 'nl';"
);

console.log('✓ Updated language type in t() function\n');

// Update getSupportedLanguages to include Dutch
const contentWithNl = finalContent.replace(
  /({\s*code:\s*'pl',\s*name:\s*'Polish',\s*nativeName:\s*'Polski'\s*},)/,
  "$1\n    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },"
);

console.log('✓ Added Dutch to getSupportedLanguages()\n');

// Write the updated file
writeFileSync(uiTranslationsPath, contentWithNl, 'utf-8');

console.log('✅ Successfully integrated all translations!\n');
console.log('Next steps:');
console.log('1. Review the changes in src/lib/ui-translations.ts');
console.log('2. Test the application with different language settings');
console.log('3. Commit the changes to version control\n');
