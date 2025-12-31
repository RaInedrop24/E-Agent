#!/usr/bin/env node

/**
 * Add German translations to ui-translations.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Adding German translations...\n');

// Read the German translation file
const deContent = readFileSync(join(__dirname, 'translations-output-de.txt'), 'utf-8');

// Extract just the translation object (remove the comments and instructions)
function extractTranslationObject(content) {
  const lines = content.split('\n');
  const start = lines.findIndex(line => line.match(/^de:\s*\{/));
  const end = lines.findIndex((line, index) => index > start && line.match(/^\},/));

  if (start === -1 || end === -1) {
    throw new Error('Could not find translation object boundaries');
  }

  return lines.slice(start, end + 1).join('\n');
}

const deTranslations = extractTranslationObject(deContent);

console.log('✓ Extracted German translation object\n');

// Read the ui-translations.ts file
const uiTranslationsPath = join(__dirname, '..', 'src', 'lib', 'ui-translations.ts');
let uiContent = readFileSync(uiTranslationsPath, 'utf-8');

// Find the position to insert German (after nl object, before "} as const;")
const insertMarker = '} as const;';
const insertPosition = uiContent.indexOf(insertMarker);

if (insertPosition === -1) {
  throw new Error('Could not find "} as const;" marker in ui-translations.ts');
}

// Insert German before "} as const;"
const beforeInsert = uiContent.substring(0, insertPosition);
const afterInsert = uiContent.substring(insertPosition);

const newContent = beforeInsert + '\n  ' + deTranslations + '\n' + afterInsert;

console.log('✓ Inserted German translations\n');

// Update the supportedTranslations array to include 'de'
const updatedContent = newContent.replace(
  /const supportedTranslations: SupportedLanguage\[\] = \['en', 'it', 'pl', 'es', 'fr', 'nl'\];/,
  "const supportedTranslations: SupportedLanguage[] = ['en', 'it', 'pl', 'es', 'fr', 'de', 'nl'];"
);

console.log('✓ Updated supportedTranslations array\n');

// Update the language type in the t() function
const finalContent = updatedContent.replace(
  /const languageToUse = \(supportedTranslations\.includes\(lang\) \? lang : 'en'\) as 'en' \| 'it' \| 'pl' \| 'es' \| 'fr' \| 'nl';/,
  "const languageToUse = (supportedTranslations.includes(lang) ? lang : 'en') as 'en' | 'it' | 'pl' | 'es' | 'fr' | 'de' | 'nl';"
);

console.log('✓ Updated language type in t() function\n');

// Write the updated file
writeFileSync(uiTranslationsPath, finalContent, 'utf-8');

console.log('✅ Successfully integrated German translations!\n');
console.log('Next steps:');
console.log('1. Verify German is in SystemAnnouncementEmail.tsx');
console.log('2. Test the application with German language setting');
console.log('3. Build to ensure no TypeScript errors\n');
