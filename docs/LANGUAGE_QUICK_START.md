# Quick Start: Adding a New Language

This is a condensed version of the full guide. For complete details, see [ADDING_NEW_LANGUAGES.md](./ADDING_NEW_LANGUAGES.md).

## Prerequisites

- DeepL API key (free tier: 500K chars/month)
- Supabase access
- Node.js 18+

```bash
export DEEPL_API_KEY="your-api-key-here"
```

## Quick Steps

### 1. Generate Migration (30 seconds)

```bash
cd scripts
node generate-migration.mjs <code> <name>

# Example: Add Portuguese
node generate-migration.mjs pt Portuguese
```

This creates: `supabase/migrations/YYYYMMDD_add_portuguese_language.sql`

### 2. Apply Migration (1 minute)

```bash
# Via Supabase CLI
supabase db push

# Or copy SQL to Supabase Dashboard SQL Editor
```

### 3. Update Type Definitions (2 minutes)

**File**: `src/lib/translation.ts`

```typescript
// Add to type
export type SupportedLanguage = 'en' | 'it' | 'es' | 'fr' | 'de' | 'pl' | 'pt';

// Add to mapping
const DEEPL_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  // ... existing
  pt: 'PT-PT', // Add this
};
```

### 4. Add Language to Constants (1 minute)

**File**: `src/lib/constants.ts`

```typescript
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  // ... existing
  { code: 'pt', name: 'Português', flag: '🇵🇹' }, // Add this
];
```

### 5. Generate UI Translations (2 minutes)

```bash
cd scripts
node generate-translations.mjs pt
```

Output: `scripts/translations-output-pt.txt`

Copy the generated object into `src/lib/ui-translations.ts`:

```typescript
const translations = {
  en: { /* ... */ },
  it: { /* ... */ },
  pl: { /* ... */ },
  pt: { /* PASTE HERE */ },
};

// Update this array
const supportedTranslations: SupportedLanguage[] = ['en', 'it', 'pl', 'pt'];

// Update this type
export function t(key: TranslationKey, lang: SupportedLanguage = 'en'): string {
  const languageToUse = (supportedTranslations.includes(lang) ? lang : 'en') as 'en' | 'it' | 'pl' | 'pt';
  // ...
}
```

### 6. Update Default Milestones (3 minutes)

**File**: `src/lib/defaultMilestones.ts`

```typescript
export interface MilestoneDefinition {
  // ... existing fields
  label_pt: string; // Add this
}

export const DEFAULT_MILESTONES: MilestoneDefinition[] = [
  {
    code: 'OFFER_ACCEPTED',
    // ... existing labels
    label_pt: 'Oferta Aceita', // Add to all 5 milestones
  },
  // ... repeat for remaining 4 milestones
];
```

### 7. Update Translation API (30 seconds)

**File**: `src/app/api/translate/route.ts`

```typescript
const validLanguages: SupportedLanguage[] = ['en', 'it', 'es', 'fr', 'de', 'pl', 'pt'];
```

### 8. Update Milestone Editors (5 minutes per file)

Update **BOTH** files:
- `src/app/milestone-templates/[id]/page.tsx`
- `src/app/transaction/[id]/milestones/page.tsx`

**Changes needed in each file:**

1. Add to interface:
```typescript
interface TemplateItem { // or Milestone
  // ... existing
  label_pt: string | null;
}
```

2. Update allLanguages:
```typescript
const allLanguages: Array<'en' | 'it' | 'de' | 'fr' | 'es' | 'pl' | 'pt'> =
  ['en', 'it', 'de', 'fr', 'es', 'pl', 'pt'];
```

3. Add input field (after Polish input):
```tsx
<div className="space-y-1">
  <Label htmlFor={`label_pt_${index}`}>Portuguese Label</Label>
  <Input
    id={`label_pt_${index}`}
    value={item.label_pt || ''}
    onChange={(e) => handleUpdateItem(index, 'label_pt', e.target.value)}
    placeholder="e.g., Oferta Aceita"
    disabled={saving}
  />
</div>
```

4. Update handleAddItem/handleAddMilestone:
```typescript
const newItem = {
  // ... existing
  label_pt: null,
};
```

### 9. Test (5 minutes)

- [ ] Select language in Settings
- [ ] UI displays in new language
- [ ] Milestones show new language labels
- [ ] Auto-translate button works
- [ ] No TypeScript errors

### 10. Commit and Push

```bash
git add .
git commit -m "Add Portuguese language support

- Database migration for pt columns
- Added pt to type system
- Generated 311 UI translations
- Updated milestone editors
- Translation API supports pt"

git push
```

## Total Time: ~20 minutes

## Files Modified (Checklist)

- [ ] `supabase/migrations/YYYYMMDD_add_[lang]_language.sql` (NEW)
- [ ] `src/lib/translation.ts` (type + mapping)
- [ ] `src/lib/constants.ts` (language option)
- [ ] `src/lib/defaultMilestones.ts` (interface + data)
- [ ] `src/lib/ui-translations.ts` (translations object)
- [ ] `src/app/api/translate/route.ts` (validation)
- [ ] `src/app/milestone-templates/[id]/page.tsx` (4 changes)
- [ ] `src/app/transaction/[id]/milestones/page.tsx` (4 changes)

## Common DeepL Language Codes

| Language | Code | DeepL Code |
|----------|------|------------|
| Portuguese (EU) | pt | PT-PT |
| Portuguese (BR) | pt-br | PT-BR |
| Dutch | nl | NL |
| Swedish | sv | SV |
| Danish | da | DA |
| Norwegian | no | NB |
| Finnish | fi | FI |
| Czech | cs | CS |
| Hungarian | hu | HU |
| Romanian | ro | RO |
| Japanese | ja | JA |
| Chinese | zh | ZH |
| Korean | ko | KO |
| Russian | ru | RU |
| Turkish | tr | TR |
| Arabic | ar | AR |

See full list: https://developers.deepl.com/docs/resources/supported-languages

## Troubleshooting

**"Invalid target language" error**
→ Add to `validLanguages` in `/api/translate/route.ts`

**Auto-translate doesn't work**
→ Check `allLanguages` array in both milestone editors

**TypeScript errors**
→ Ensure language added to `SupportedLanguage` type

**Language not in selector**
→ Add to `SUPPORTED_LANGUAGES` in `constants.ts`

## Tools

- `scripts/generate-migration.mjs` - Creates database migration
- `scripts/generate-translations.mjs` - Generates UI translations via DeepL
- `docs/ADDING_NEW_LANGUAGES.md` - Complete detailed guide

## Need Help?

See the full guide: [ADDING_NEW_LANGUAGES.md](./ADDING_NEW_LANGUAGES.md)

Example implementation: Polish (pl) - Commit: 04e4434
