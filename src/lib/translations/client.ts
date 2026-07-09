/**
 * Client-side translation loader.
 *
 * Only the English dictionary ships in the base client bundle; other
 * languages are code-split into their own chunks and fetched on demand
 * when the user's language becomes known (see LanguageContext).
 *
 * Server code should use src/lib/ui-translations.ts, which imports all
 * dictionaries statically and stays fully synchronous.
 */

import en, { type TranslationKey } from './en';
import type { SupportedLanguage } from '../translation';

type Dictionary = Record<TranslationKey, string>;

const cache: Partial<Record<SupportedLanguage, Dictionary>> = { en };

/**
 * Ensure the dictionary for `lang` is loaded. Resolves immediately when
 * already cached. The explicit switch keeps each language in its own chunk.
 */
export async function loadLanguage(lang: SupportedLanguage): Promise<void> {
  if (cache[lang]) return;
  switch (lang) {
    case 'it':
      cache.it = (await import('./it')).default;
      break;
    case 'pl':
      cache.pl = (await import('./pl')).default;
      break;
    case 'es':
      cache.es = (await import('./es')).default;
      break;
    case 'fr':
      cache.fr = (await import('./fr')).default;
      break;
    case 'de':
      cache.de = (await import('./de')).default;
      break;
    case 'nl':
      cache.nl = (await import('./nl')).default;
      break;
    default:
      // English is always cached
      break;
  }
}

/** Translate a key; falls back to English until the language is loaded. */
export function t(key: TranslationKey, lang: SupportedLanguage = 'en'): string {
  const dict = cache[lang] ?? en;
  return dict[key] || en[key] || key;
}

/** Translate with {{variable}} substitution. */
export function tVar(
  key: TranslationKey,
  lang: SupportedLanguage = 'en',
  variables: Record<string, string | number> = {}
): string {
  let translation = t(key, lang);
  Object.entries(variables).forEach(([varKey, value]) => {
    translation = translation.split(`{{${varKey}}}`).join(String(value));
  });
  return translation;
}

export type { TranslationKey };
