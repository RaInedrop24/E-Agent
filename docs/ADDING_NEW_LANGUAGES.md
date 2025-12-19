# Adding New Languages to E-Portal

This guide explains how to add new language support to the Estate Agent Portal application.

## Overview

The application uses a multi-layered i18n system:
- **Database**: Stores translations in language-specific columns (e.g., `label_en`, `label_it`, `label_pl`)
- **UI Translations**: Static interface text in `src/lib/ui-translations.ts`
- **DeepL API**: Provides automatic translation capabilities
- **Type Safety**: TypeScript enforces language support across the codebase

## Supported Languages

Current languages:
- English (en) 🇬🇧
- Italian (it) 🇮🇹
- Spanish (es) 🇪🇸
- French (fr) 🇫🇷
- German (de) 🇩🇪
- Polish (pl) 🇵🇱

## Adding a New Language

Follow these steps to add support for a new language (example uses Portuguese 'pt'):

### 1. Database Migration

Create a new migration file: `supabase/migrations/YYYYMMDD_add_[language]_language.sql`

```sql
-- Add Portuguese language support
-- Migration: YYYYMMDD_add_portuguese_language.sql

-- Add label_pt column to milestones table
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS label_pt text;

-- Add label_pt column to milestone_template_items table
ALTER TABLE public.milestone_template_items
ADD COLUMN IF NOT EXISTS label_pt text;

-- Add title_pt column to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS title_pt text;

-- Update profiles table constraint to include 'pt'
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_preferred_language_check
CHECK (preferred_language IN ('en', 'it', 'de', 'fr', 'es', 'pl', 'pt'));

-- Add comment
COMMENT ON COLUMN public.milestones.label_pt IS 'Portuguese label for milestone';
COMMENT ON COLUMN public.milestone_template_items.label_pt IS 'Portuguese label for milestone template item';
COMMENT ON COLUMN public.transactions.title_pt IS 'Portuguese title for transaction';
```

### 2. Update Type Definitions

**File**: `src/lib/translation.ts`

Add the language code to the `SupportedLanguage` type and DeepL mapping:

```typescript
export type SupportedLanguage = 'en' | 'it' | 'es' | 'fr' | 'de' | 'pl' | 'pt';

const DEEPL_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  en: 'EN-GB',
  it: 'IT',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  pl: 'PL',
  pt: 'PT-PT', // Or 'PT-BR' for Brazilian Portuguese
};
```

**DeepL Language Codes**: Check [DeepL API documentation](https://developers.deepl.com/docs/resources/supported-languages) for correct language codes.

### 3. Update Language Constants

**File**: `src/lib/constants.ts`

Add the language to the `SUPPORTED_LANGUAGES` array:

```typescript
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' }, // Add this
];
```

### 4. Update Default Milestones

**File**: `src/lib/defaultMilestones.ts`

Add the language field to the interface and all milestone definitions:

```typescript
export interface MilestoneDefinition {
  code: string;
  label_en: string;
  label_it: string;
  label_de: string;
  label_fr: string;
  label_es: string;
  label_pl: string;
  label_pt: string; // Add this
}

export const DEFAULT_MILESTONES: MilestoneDefinition[] = [
  {
    code: 'OFFER_ACCEPTED',
    label_en: 'Offer Accepted',
    label_it: 'Offerta Accettata',
    label_de: 'Angebot Angenommen',
    label_fr: 'Offre Acceptée',
    label_es: 'Oferta Aceptada',
    label_pl: 'Oferta Zaakceptowana',
    label_pt: 'Oferta Aceita', // Add translations for all milestones
  },
  // ... repeat for all milestones
];
```

### 5. Generate UI Translations

Use the provided script to auto-generate translations:

```bash
cd scripts
node generate-translations.mjs pt
```

This will:
1. Extract all English translation keys from `ui-translations.ts`
2. Use DeepL API to translate them to Portuguese
3. Output the translations to `scripts/translations-output-pt.txt`

**Manual Step**: Copy the generated translations from the output file into `src/lib/ui-translations.ts`:

```typescript
const translations = {
  en: { /* existing */ },
  it: { /* existing */ },
  pl: { /* existing */ },
  pt: { // Add this
    'nav.dashboard': 'Painel de Controle',
    'nav.transactions': 'Transações',
    // ... all 311+ translation keys
  },
};
```

Update the `supportedTranslations` array:

```typescript
const supportedTranslations: SupportedLanguage[] = ['en', 'it', 'pl', 'pt'];
```

Update the type in the `t()` function:

```typescript
export function t(key: TranslationKey, lang: SupportedLanguage = 'en'): string {
  const supportedTranslations: SupportedLanguage[] = ['en', 'it', 'pl', 'pt'];
  const languageToUse = (supportedTranslations.includes(lang) ? lang : 'en') as 'en' | 'it' | 'pl' | 'pt';
  return translations[languageToUse][key] || translations.en[key] || key;
}
```

### 6. Update Translation API

**File**: `src/app/api/translate/route.ts`

Add the language to the validation array:

```typescript
const validLanguages: SupportedLanguage[] = ['en', 'it', 'es', 'fr', 'de', 'pl', 'pt'];
```

### 7. Update Milestone Edit Components

Add the new language field to both milestone editors.

**Files**:
- `src/app/milestone-templates/[id]/page.tsx`
- `src/app/transaction/[id]/milestones/page.tsx`

**Changes needed in BOTH files**:

1. Update the interface:
```typescript
interface TemplateItem { // or Milestone
  // ... existing fields
  label_pt: string | null; // Add this
}
```

2. Update the `allLanguages` array for auto-translate:
```typescript
const allLanguages: Array<'en' | 'it' | 'de' | 'fr' | 'es' | 'pl' | 'pt'> =
  ['en', 'it', 'de', 'fr', 'es', 'pl', 'pt'];
```

3. Add the input field (add after the Polish label input):
```tsx
<div className="space-y-1">
  <Label htmlFor={`label_pt_${index}`}>Portuguese Label</Label>
  <Input
    id={`label_pt_${index}`}
    value={item.label_pt || ''} // or milestone.label_pt
    onChange={(e) => handleUpdateItem(index, 'label_pt', e.target.value)} // or handleUpdateMilestone
    placeholder="e.g., Oferta Aceita"
    disabled={saving}
  />
</div>
```

4. Update the `handleAddItem` or `handleAddMilestone` function to include the new field:
```typescript
const newItem = {
  // ... existing fields
  label_pt: null, // Add this
};
```

### 8. Apply Database Migration

Run the migration in Supabase:

```bash
# Via Supabase CLI
supabase db push

# Or via Supabase Dashboard:
# SQL Editor → Run the migration SQL
```

### 9. Testing Checklist

After implementation, verify:

- [ ] User can select the new language in Settings
- [ ] Profile saves with `preferred_language = 'pt'` (or your language code)
- [ ] UI text displays in the new language
- [ ] Milestones show the new language label when that language is selected
- [ ] Transaction titles show the new language title when available
- [ ] Auto-translate button populates the new language field
- [ ] Creating new milestones includes the new language field
- [ ] Language selector shows correct flag and name
- [ ] All language-dependent components render correctly
- [ ] No TypeScript errors in the codebase

### 10. Commit Changes

```bash
git add .
git commit -m "Add [Language] language support

- Added database columns for [language] labels
- Updated type system to include '[code]'
- Added [Language] to language selector
- Generated [number] UI translations
- Updated milestone editors with [language] fields
- Translation API now supports [language]"

git push
```

## File Checklist

When adding a new language, you must modify these files:

### Database
- [ ] `supabase/migrations/YYYYMMDD_add_[language]_language.sql` (NEW)

### Core Translation System
- [ ] `src/lib/translation.ts` - Add to type and DeepL mapping
- [ ] `src/lib/constants.ts` - Add to SUPPORTED_LANGUAGES array
- [ ] `src/lib/defaultMilestones.ts` - Add label field to interface and data
- [ ] `src/lib/ui-translations.ts` - Add full translation dictionary

### API
- [ ] `src/app/api/translate/route.ts` - Add to validLanguages array

### Components
- [ ] `src/app/milestone-templates/[id]/page.tsx` - Add interface field, input, allLanguages
- [ ] `src/app/transaction/[id]/milestones/page.tsx` - Add interface field, input, allLanguages

## Translation Tools

### Script: `scripts/generate-translations.mjs`

This script automates UI translation generation using DeepL API.

**Usage**:
```bash
node scripts/generate-translations.mjs <target_language_code>

# Examples:
node scripts/generate-translations.mjs pt  # Portuguese
node scripts/generate-translations.mjs nl  # Dutch
node scripts/generate-translations.mjs sv  # Swedish
```

**Requirements**:
- DeepL API key in environment variable `DEEPL_API_KEY`
- Node.js 18+
- `node-fetch` package

**Output**:
- Generates file: `scripts/translations-output-<lang>.txt`
- Contains all translated UI strings ready to copy into `ui-translations.ts`

### DeepL API Limits

Free tier: 500,000 characters/month
Pro tier: Pay per character

The script processes ~311 translation keys in batches of 50 to respect API rate limits.

## Common Issues

### Issue: "Invalid target language" error
**Solution**: Check that the language code is added to `validLanguages` in `/api/translate/route.ts`

### Issue: Auto-translate button doesn't populate new language field
**Solution**: Verify `allLanguages` array includes the new language in both milestone editor files

### Issue: TypeScript errors about missing language
**Solution**: Ensure the language is added to `SupportedLanguage` type in `translation.ts`

### Issue: Language not appearing in selector
**Solution**: Check that it's added to `SUPPORTED_LANGUAGES` in `constants.ts`

### Issue: Database constraint violation
**Solution**: Ensure migration was applied and constraint includes the new language code

## Future Enhancements

Consider implementing:
- Automated migration file generation
- One-command language addition script
- Translation quality review workflow
- Machine translation fallback for missing translations
- User-contributed translation improvements
- Translation version control and auditing

## Support

For questions or issues with adding languages:
1. Check this documentation
2. Review the Polish language implementation as a reference (commit: 04e4434)
3. Verify all checklist items are completed
4. Test thoroughly before deploying to production

---

**Last Updated**: 2025-12-19
**Example Implementation**: Polish (pl) language - See commit 04e4434
