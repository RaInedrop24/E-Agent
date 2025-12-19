# Scripts Directory

Utility scripts for E-Portal development and maintenance.

## Language Management Scripts

### `generate-migration.mjs`

Generates a Supabase migration file for adding a new language to the database.

**Usage:**
```bash
node generate-migration.mjs <language_code> <language_name>
```

**Examples:**
```bash
node generate-migration.mjs pt Portuguese
node generate-migration.mjs nl Dutch
node generate-migration.mjs sv Swedish
```

**Output:**
- Creates: `supabase/migrations/YYYYMMDD_add_<language>_language.sql`
- Adds `label_<code>` columns to relevant tables
- Updates profile language constraints

---

### `generate-translations.mjs`

Automatically translates all UI strings using the DeepL API.

**Requirements:**
- DeepL API key in `DEEPL_API_KEY` environment variable
- Node.js 18+

**Usage:**
```bash
export DEEPL_API_KEY="your-api-key-here"
node generate-translations.mjs <target_language_code>
```

**Examples:**
```bash
node generate-translations.mjs pt    # Portuguese
node generate-translations.mjs nl    # Dutch
node generate-translations.mjs ja    # Japanese
```

**Process:**
1. Extracts all English translation keys from `src/lib/ui-translations.ts`
2. Translates them using DeepL API (batched for efficiency)
3. Outputs formatted translation object to `translations-output-<lang>.txt`

**Output:**
- File: `scripts/translations-output-<lang>.txt`
- Contains ~311 translated UI strings ready to paste into `ui-translations.ts`

**Supported Languages:**

| Code | Language | Code | Language |
|------|----------|------|----------|
| pt | Portuguese (EU) | nl | Dutch |
| pt-br | Portuguese (BR) | sv | Swedish |
| es | Spanish | da | Danish |
| fr | French | fi | Finnish |
| de | German | no | Norwegian |
| it | Italian | cs | Czech |
| pl | Polish | hu | Hungarian |
| ja | Japanese | ro | Romanian |
| zh | Chinese | ru | Russian |
| ko | Korean | tr | Turkish |
| ar | Arabic | el | Greek |

Full list: https://developers.deepl.com/docs/resources/supported-languages

---

### `generate-polish-translations.mjs` (archived)

Original script specifically for Polish translations. Now superseded by the generic `generate-translations.mjs`.

Kept as a reference for the initial Polish implementation.

---

## Other Scripts

### Template Fix Scripts (archived)

Historical scripts for fixing template-related issues:
- `apply-template-fix.js`
- `apply-template-fix-simple.js`
- `show-function-fix.js`
- `apply-migration-direct.mjs`

These are kept for reference but are no longer needed for normal operations.

---

## Quick Start: Adding a New Language

**Time: ~20 minutes**

1. **Generate migration:**
   ```bash
   node generate-migration.mjs pt Portuguese
   ```

2. **Apply migration:**
   ```bash
   supabase db push
   ```

3. **Generate translations:**
   ```bash
   export DEEPL_API_KEY="your-key"
   node generate-translations.mjs pt
   ```

4. **Follow code changes:**
   - See: `docs/LANGUAGE_QUICK_START.md` for step-by-step
   - See: `docs/ADDING_NEW_LANGUAGES.md` for complete guide

---

## Development Notes

- All language scripts use ES modules (`.mjs` extension)
- Scripts output to console with progress indicators
- DeepL API rate limiting: 1 second delay between batches
- Batch size: 50 translations per API call

---

## File Outputs

Scripts create these output files:

- `translations-output-<lang>.txt` - Generated UI translations
- `polish-translations-output.txt` - Original Polish translations (archived)
- `supabase/migrations/YYYYMMDD_add_<language>_language.sql` - Generated migrations

---

## DeepL API Setup

1. Get free API key: https://www.deepl.com/pro-api
2. Free tier: 500,000 characters/month
3. Set environment variable:
   ```bash
   export DEEPL_API_KEY="your-api-key-here"
   ```

4. Or add to `.env.local`:
   ```
   DEEPL_API_KEY=your-api-key-here
   ```

---

## Troubleshooting

**"DEEPL_API_KEY not set"**
→ Export the environment variable before running scripts

**"Unsupported language code"**
→ Check supported languages list above or DeepL documentation

**"DeepL API error: 403"**
→ Check your API key is valid and not expired

**"DeepL API error: 456"**
→ Quota exceeded - upgrade plan or wait for reset

---

## Documentation

For complete language addition workflow:
- Quick start: `docs/LANGUAGE_QUICK_START.md`
- Full guide: `docs/ADDING_NEW_LANGUAGES.md`

For script development:
- Scripts use Node.js 18+ features
- ES modules syntax
- async/await for API calls
- File operations use fs/promises

---

Last Updated: 2025-12-19
