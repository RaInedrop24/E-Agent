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

Add the new language field to milestone editors and save operations.

**Files to Update**:
- `src/app/milestone-templates/[id]/page.tsx` - Template editor
- `src/app/transaction/[id]/milestones/page.tsx` - Transaction milestone editor
- `src/components/features/transaction/SaveMilestoneTemplateModal.tsx` - Save template modal

#### 7.1 Template Editor (`src/app/milestone-templates/[id]/page.tsx`)

**Changes needed**:

1. Update the interface:
```typescript
interface TemplateItem {
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
    value={item.label_pt || ''}
    onChange={(e) => handleUpdateItem(index, 'label_pt', e.target.value)}
    placeholder="e.g., Oferta Aceita"
    disabled={saving}
  />
</div>
```

4. Update the `handleAddItem` function to include the new field:
```typescript
const newItem: TemplateItem = {
  // ... existing fields
  label_pt: null, // Add this
};
```

5. **CRITICAL**: Update the INSERT and UPDATE operations in `handleSave`:
```typescript
// For INSERT (new items)
const { error } = await supabase
  .from('milestone_template_items')
  .insert({
    // ... existing fields
    label_pt: item.label_pt, // Add this
  });

// For UPDATE (existing items)
const { error } = await supabase
  .from('milestone_template_items')
  .update({
    // ... existing fields
    label_pt: item.label_pt, // Add this
  })
  .eq('id', item.id);
```

#### 7.2 Transaction Milestone Editor (`src/app/transaction/[id]/milestones/page.tsx`)

**Changes needed** (same as above):

1. Update the `Milestone` interface to include `label_pt`
2. Update the `allLanguages` array
3. Add the input field for Portuguese
4. Update `handleAddMilestone` to include `label_pt: null`
5. Update database operations to include `label_pt`

#### 7.3 Save Template Modal (`src/components/features/transaction/SaveMilestoneTemplateModal.tsx`)

**Changes needed**:

1. Update the `Milestone` interface:
```typescript
interface Milestone {
  code: string;
  label_en: string;
  label_it?: string | null;
  label_de?: string | null;
  label_fr?: string | null;
  label_es?: string | null;
  label_pl?: string | null;
  label_pt?: string | null; // Add this
}
```

2. Update the milestone data preparation in `handleSave`:
```typescript
const milestonesData = milestones.map((m) => ({
  code: m.code,
  label_en: m.label_en,
  label_it: m.label_it || null,
  label_de: m.label_de || null,
  label_fr: m.label_fr || null,
  label_es: m.label_es || null,
  label_pl: m.label_pl || null,
  label_pt: m.label_pt || null, // Add this
}));
```

### 8. Update Database RPC Functions

**CRITICAL**: Update RPC functions to handle the new language.

Create a new migration file: `supabase/migrations/YYYYMMDD_fix_[language]_rpc_functions.sql`

```sql
-- Fix save_milestone_template function to include Portuguese
CREATE OR REPLACE FUNCTION public.save_milestone_template(
  p_template_name text,
  p_description text,
  p_milestones jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id uuid;
  v_agent_role text;
  v_template_id uuid;
  v_milestone jsonb;
  v_index int := 0;
BEGIN
  -- Get current user
  v_agent_id := auth.uid();

  -- Validate user is an agent
  SELECT role INTO v_agent_role
  FROM public.profiles
  WHERE id = v_agent_id;

  IF v_agent_role IS NULL OR v_agent_role != 'agent' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only agents can create milestone templates'
    );
  END IF;

  -- Validate template name
  IF p_template_name IS NULL OR trim(p_template_name) = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Template name is required'
    );
  END IF;

  -- Check if template name already exists for this agent
  IF EXISTS (
    SELECT 1 FROM public.milestone_templates
    WHERE agent_id = v_agent_id AND template_name = p_template_name
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'A template with this name already exists'
    );
  END IF;

  -- Create template
  INSERT INTO public.milestone_templates (agent_id, template_name, description)
  VALUES (v_agent_id, p_template_name, p_description)
  RETURNING id INTO v_template_id;

  -- Insert milestone items (INCLUDING label_pt)
  FOR v_milestone IN SELECT * FROM jsonb_array_elements(p_milestones)
  LOOP
    INSERT INTO public.milestone_template_items (
      template_id,
      order_index,
      code,
      label_en,
      label_it,
      label_de,
      label_fr,
      label_es,
      label_pl,
      label_pt  -- Add this
    )
    VALUES (
      v_template_id,
      v_index,
      v_milestone->>'code',
      v_milestone->>'label_en',
      v_milestone->>'label_it',
      v_milestone->>'label_de',
      v_milestone->>'label_fr',
      v_milestone->>'label_es',
      v_milestone->>'label_pl',
      v_milestone->>'label_pt'  -- Add this
    );

    v_index := v_index + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'template_id', v_template_id,
    'message', 'Template saved successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Fix apply_milestone_template function to include Portuguese
CREATE OR REPLACE FUNCTION public.apply_milestone_template(
  p_transaction_id uuid,
  p_template_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id uuid;
  v_transaction_creator uuid;
  v_milestone record;
BEGIN
  v_agent_id := auth.uid();

  -- Verify template belongs to current user
  IF NOT EXISTS (
    SELECT 1 FROM public.milestone_templates
    WHERE id = p_template_id AND agent_id = v_agent_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Template not found or access denied'
    );
  END IF;

  -- Verify user is transaction creator or participant
  SELECT created_by INTO v_transaction_creator
  FROM public.transactions
  WHERE id = p_transaction_id;

  IF v_transaction_creator IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Transaction not found'
    );
  END IF;

  IF v_transaction_creator != v_agent_id THEN
    -- Check if user is a participant
    IF NOT EXISTS (
      SELECT 1 FROM public.transaction_participants
      WHERE transaction_id = p_transaction_id
        AND profile_id = v_agent_id
        AND participant_role = 'agent'
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Access denied. You must be the transaction creator or an agent participant.'
      );
    END IF;
  END IF;

  -- Delete all existing milestones for this transaction
  DELETE FROM public.milestones
  WHERE transaction_id = p_transaction_id;

  -- Insert milestones from template (INCLUDING label_pt)
  FOR v_milestone IN
    SELECT * FROM public.milestone_template_items
    WHERE template_id = p_template_id
    ORDER BY order_index
  LOOP
    INSERT INTO public.milestones (
      transaction_id,
      order_index,
      code,
      label_en,
      label_it,
      label_de,
      label_fr,
      label_es,
      label_pl,
      label_pt,  -- Add this
      completed
    )
    VALUES (
      p_transaction_id,
      v_milestone.order_index,
      v_milestone.code,
      v_milestone.label_en,
      v_milestone.label_it,
      v_milestone.label_de,
      v_milestone.label_fr,
      v_milestone.label_es,
      v_milestone.label_pl,
      v_milestone.label_pt,  -- Add this
      false
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Template applied successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Fix get_milestone_template_items function to return Portuguese
-- Drop first because we're changing the return type
DROP FUNCTION IF EXISTS public.get_milestone_template_items(uuid);

CREATE OR REPLACE FUNCTION public.get_milestone_template_items(p_template_id uuid)
RETURNS TABLE (
  id uuid,
  order_index int,
  code text,
  label_en text,
  label_it text,
  label_de text,
  label_fr text,
  label_es text,
  label_pl text,
  label_pt text  -- Add this
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify template belongs to current user
  IF NOT EXISTS (
    SELECT 1 FROM public.milestone_templates mt
    WHERE mt.id = p_template_id AND mt.agent_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Template not found or access denied';
  END IF;

  RETURN QUERY
  SELECT
    mti.id,
    mti.order_index,
    mti.code,
    mti.label_en,
    mti.label_it,
    mti.label_de,
    mti.label_fr,
    mti.label_es,
    mti.label_pl,
    mti.label_pt  -- Add this
  FROM public.milestone_template_items mti
  WHERE mti.template_id = p_template_id
  ORDER BY mti.order_index;
END;
$$;

COMMENT ON FUNCTION public.save_milestone_template IS
  'Saves a set of milestones as a reusable template. Now includes Portuguese language support.';

COMMENT ON FUNCTION public.apply_milestone_template IS
  'Replaces all milestones in a transaction with milestones from a template. Now includes Portuguese language support.';

COMMENT ON FUNCTION public.get_milestone_template_items IS
  'Retrieves all milestone template items for a template. Now includes Portuguese language support.';
```

### 9. Apply Database Migrations

Run both migrations in Supabase:

```bash
# Via Supabase CLI
supabase db push

# Or via Supabase Dashboard:
# SQL Editor → Run the migration SQL files in order:
# 1. YYYYMMDD_add_[language]_language.sql
# 2. YYYYMMDD_fix_[language]_rpc_functions.sql
```

### 10. Testing Checklist

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

### 11. Commit Changes

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
- [ ] `supabase/migrations/YYYYMMDD_add_[language]_language.sql` (NEW - columns)
- [ ] `supabase/migrations/YYYYMMDD_fix_[language]_rpc_functions.sql` (NEW - RPC functions)

### Core Translation System
- [ ] `src/lib/translation.ts` - Add to type and DeepL mapping
- [ ] `src/lib/constants.ts` - Add to SUPPORTED_LANGUAGES array
- [ ] `src/lib/defaultMilestones.ts` - Add label field to interface and data
- [ ] `src/lib/ui-translations.ts` - Add full translation dictionary

### API
- [ ] `src/app/api/translate/route.ts` - Add to validLanguages array

### Components (UI)
- [ ] `src/app/milestone-templates/[id]/page.tsx` - Add interface field, input, allLanguages, INSERT/UPDATE
- [ ] `src/app/transaction/[id]/milestones/page.tsx` - Add interface field, input, allLanguages
- [ ] `src/components/features/transaction/SaveMilestoneTemplateModal.tsx` - Add interface field, data mapping

### RPC Functions (via migration)
- [ ] `public.save_milestone_template()` - Update to insert new language
- [ ] `public.apply_milestone_template()` - Update to copy new language
- [ ] `public.get_milestone_template_items()` - Update return type (requires DROP first)

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

### Issue: Language data saves but disappears when re-opening template
**Solution**: This is the most common issue! Check ALL of these:
1. ✅ Update INSERT operations in `milestone-templates/[id]/page.tsx` to include the new language
2. ✅ Update UPDATE operations in `milestone-templates/[id]/page.tsx` to include the new language
3. ✅ Update `SaveMilestoneTemplateModal.tsx` interface and data mapping
4. ✅ Run the RPC function fix migration to update `save_milestone_template()`, `apply_milestone_template()`, and `get_milestone_template_items()`
5. ✅ Verify the column exists in database: `SELECT label_[lang] FROM milestone_template_items LIMIT 1;`

### Issue: Error changing return type of function
**Solution**: When updating `get_milestone_template_items()`, you must DROP it first:
```sql
DROP FUNCTION IF EXISTS public.get_milestone_template_items(uuid);
-- Then CREATE OR REPLACE...
```

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

## Critical Lessons Learned

### Polish Language Implementation (December 2024)

When implementing Polish language support, we discovered that simply adding database columns and UI fields is **not enough**. The data was being entered but not persisted because:

1. **Frontend Save Operations**: The template editor page had INSERT and UPDATE operations that explicitly listed all columns. Missing `label_pl` meant it was never saved.

2. **RPC Functions**: Three critical functions needed updating:
   - `save_milestone_template()` - Wasn't extracting `label_pl` from JSON
   - `apply_milestone_template()` - Wasn't copying `label_pl` to transactions
   - `get_milestone_template_items()` - Wasn't returning `label_pl` (required DROP first)

3. **Modal Component**: The save template modal had its own milestone interface and data mapping that needed updating.

**Key Takeaway**: When adding a language, you must trace the entire data flow from UI input → database save → database retrieval → UI display. Missing any step will cause data loss.

---

**Last Updated**: 2024-12-24  
**Example Implementations**:  
- Polish (pl) language - Full implementation with RPC fixes
- Migration reference: `20251224_fix_save_milestone_template_polish.sql`
