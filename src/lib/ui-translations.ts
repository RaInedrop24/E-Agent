/**
 * UI Translation System
 * Provides translations for all static UI elements across the site.
 *
 * ⚠️ IMPORTANT - Translation Workflow for Developers:
 *
 * 1. ALWAYS add translations when creating new UI elements
 * 2. Add keys to EVERY language file in src/lib/translations/ (en, it, pl,
 *    es, fr, de, nl) — run `npm run validate:translations` to check parity
 * 3. Use dot notation: 'category.subcategory.key'
 * 4. Use {{variables}} for dynamic content
 *
 * This module imports all dictionaries statically and is intended for
 * SERVER code (notifications, email rendering) and type definitions.
 * Client components get translations through LanguageContext, which uses
 * the code-split loader in src/lib/translations/client.ts so browsers only
 * download the languages they actually use.
 */

import { SupportedLanguage } from './translation';
import en, { type TranslationKey } from './translations/en';
import it from './translations/it';
import pl from './translations/pl';
import es from './translations/es';
import fr from './translations/fr';
import de from './translations/de';
import nl from './translations/nl';

export type { TranslationKey };
export { getSupportedLanguages } from './translations/languages';

export const translations = { en, it, pl, es, fr, de, nl } as const;

/**
 * Get translation for a key in the specified language
 */
export function t(key: TranslationKey, lang: SupportedLanguage = 'en'): string {
  const dict = translations[lang as keyof typeof translations] ?? translations.en;
  return dict[key] || translations.en[key] || key;
}

/**
 * Get translation with variable substitution
 * Example: tVar('time.minutesAgo', 'en', { count: 5 }) => "5 minutes ago"
 */
export function tVar(
  key: TranslationKey,
  lang: SupportedLanguage = 'en',
  variables: Record<string, string | number> = {}
): string {
  let translation = t(key, lang);

  // Replace every occurrence of {{variableName}} with the actual value
  Object.entries(variables).forEach(([varKey, value]) => {
    translation = translation.split(`{{${varKey}}}`).join(String(value));
  });

  return translation;
}
