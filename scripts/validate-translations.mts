/**
 * Validates translation dictionary parity across all languages.
 *
 * Checks, against the English reference dictionary:
 *  - missing keys in any language
 *  - extra keys not present in English
 *  - {{variable}} placeholder mismatches
 *  - empty values
 *
 * Run with: npm run validate:translations
 * Exits non-zero on any error so it can gate CI.
 */

import { translations } from '../src/lib/ui-translations';

const reference = translations.en as Record<string, string>;
const referenceKeys = new Set(Object.keys(reference));

// Unique variable names — reusing a variable multiple times is allowed
const extractVars = (value: string): string[] =>
  [...new Set([...value.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))].sort();

let errors = 0;

for (const [lang, dict] of Object.entries(translations)) {
  if (lang === 'en') continue;
  const entries = dict as Record<string, string>;
  const keys = new Set(Object.keys(entries));

  const missing = [...referenceKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !referenceKeys.has(k));

  for (const key of missing) {
    console.error(`[${lang}] MISSING key: ${key}`);
    errors++;
  }
  for (const key of extra) {
    console.error(`[${lang}] EXTRA key (not in en): ${key}`);
    errors++;
  }

  for (const [key, value] of Object.entries(entries)) {
    if (!referenceKeys.has(key)) continue;
    if (!value || value.trim().length === 0) {
      console.error(`[${lang}] EMPTY value for key: ${key}`);
      errors++;
      continue;
    }
    const refVars = extractVars(reference[key]).join(',');
    const langVars = extractVars(value).join(',');
    if (refVars !== langVars) {
      console.error(
        `[${lang}] VARIABLE mismatch for ${key}: en has [${refVars}], ${lang} has [${langVars}]`
      );
      errors++;
    }
  }
}

const total = referenceKeys.size;
if (errors > 0) {
  console.error(`\nTranslation validation FAILED with ${errors} error(s) (${total} reference keys).`);
  process.exit(1);
} else {
  console.log(
    `Translation validation passed: ${total} keys × ${Object.keys(translations).length} languages.`
  );
}
