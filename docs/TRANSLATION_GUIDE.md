# Translation Quick Reference Guide

**🌍 The Property Gateway - Multi-Language Support**

## 🌐 Supported Languages

The site supports **7 languages**:
- 🇬🇧 **English (en)** - Base language
- 🇮🇹 **Italian (it)**
- 🇵🇱 **Polish (pl)**
- 🇪🇸 **Spanish (es)**
- 🇫🇷 **French (fr)**
- 🇳🇱 **Dutch (nl)**
- 🇩🇪 **German (de)**

## 📋 Quick Checklist

Before committing ANY UI changes:
- [ ] Added translation keys to `src/lib/ui-translations.ts` for **ALL 7 languages** (en, it, pl, es, fr, nl, de)
- [ ] Used `useLanguage()` hook in component
- [ ] Replaced all hardcoded strings with `t()` or `tVar()`
- [ ] Tested in at least 2-3 languages (English + Italian recommended minimum)
- [ ] No untranslated text remains

---

## 🚀 Quick Start (5 Steps)

### 1️⃣ Add Translation Keys

**File:** `src/lib/ui-translations.ts`

**⚠️ CRITICAL: You MUST add translations for ALL 7 languages!**

The file structure has 7 language sections in this order:
1. `en` (English) - Base language
2. `it` (Italian)
3. `pl` (Polish)
4. `es` (Spanish)
5. `fr` (French)
6. `nl` (Dutch)
7. `de` (German)

```typescript
const translations = {
  en: {
    'category.myKey': 'My English Text',
    'category.withVar': 'Hello {{name}}!',
  },
  it: {
    'category.myKey': 'Il Mio Testo Italiano',
    'category.withVar': 'Ciao {{name}}!',
  },
  pl: {
    'category.myKey': 'Mój Tekst Polski',
    'category.withVar': 'Cześć {{name}}!',
  },
  es: {
    'category.myKey': 'Mi Texto Español',
    'category.withVar': '¡Hola {{name}}!',
  },
  fr: {
    'category.myKey': 'Mon Texte Français',
    'category.withVar': 'Bonjour {{name}}!',
  },
  nl: {
    'category.myKey': 'Mijn Nederlandse Tekst',
    'category.withVar': 'Hallo {{name}}!',
  },
  de: {
    'category.myKey': 'Mein Deutscher Text',
    'category.withVar': 'Hallo {{name}}!',
  }
};
```

**💡 Tip:** Use DeepL (https://www.deepl.com/translator) for accurate translations. Start with English, translate to Italian, then use DeepL to translate from English to the remaining languages.

### 2️⃣ Import Hook

```typescript
import { useLanguage } from '@/contexts/LanguageContext';
```

### 3️⃣ Use in Component

```typescript
export default function MyComponent() {
  const { t, tVar } = useLanguage();
  
  return (
    <div>
      <h1>{t('category.myKey')}</h1>
      <p>{tVar('category.withVar', { name: 'Mario' })}</p>
    </div>
  );
}
```

### 4️⃣ Test Multiple Languages

1. Go to `/settings`
2. Change language to test different translations
3. Save and navigate to your page
4. Verify all text is translated correctly
5. **Recommended:** Test at least English and Italian (minimum), ideally test 2-3 languages

### 5️⃣ Done! ✅

---

## 📚 Common Patterns

### Simple Text
```typescript
<Button>{t('action.save')}</Button>
<h1>{t('dashboard.title')}</h1>
<Label>{t('form.email')}</Label>
```

### Text with Variables
```typescript
// Use tVar() when text has {{placeholders}}
<p>{tVar('dashboard.welcome', { name: user.name })}</p>
<span>{tVar('transaction.count', { count: 5 })}</span>
```

### Conditional Text
```typescript
{isLoading ? t('status.loading') : t('status.ready')}
```

### In Attributes
```typescript
<Input placeholder={t('form.enterEmail')} />
<Button title={t('action.deleteTooltip')} />
```

---

## 🗂️ Translation Categories

Use these prefixes for your keys:

| Category | Usage | Example |
|----------|-------|---------|
| `nav.*` | Navigation | `nav.dashboard`, `nav.settings` |
| `action.*` | Buttons | `action.save`, `action.delete` |
| `status.*` | Status labels | `status.active`, `status.pending` |
| `form.*` | Form fields | `form.email`, `form.password` |
| `error.*` | Errors | `error.required`, `error.generic` |
| `message.*` | Messages | `message.success`, `message.warning` |
| `settings.*` | Settings | `settings.profile`, `settings.security` |
| `dashboard.*` | Dashboard | `dashboard.title`, `dashboard.stats` |
| `transaction.*` | Transactions | `transaction.new`, `transaction.details` |
| `buyer.*` | Buyers | `buyer.manage`, `buyer.create` |
| `messaging.*` | Messages | `messaging.send`, `messaging.translate` |
| `auth.*` | Authentication | `auth.registerAsAgent`, `auth.signIn` |

---

## ❌ Common Mistakes

### 1. Hardcoded Text
```typescript
❌ <Button>Save Changes</Button>
✅ <Button>{t('action.save')}</Button>
```

### 2. Missing Translations for All Languages
```typescript
❌ 'myKey': 'English only'  // Only in 'en' section
❌ 'myKey': 'English only'  // Only in 'en' and 'it' sections
✅ Add the key to ALL 7 language sections (en, it, pl, es, fr, nl, de)
```

### 3. Wrong Function for Variables
```typescript
❌ {t('hello.user') + userName}
✅ {tVar('hello.user', { name: userName })}
```

### 4. Not Using Hook
```typescript
❌ import { t } from '@/lib/ui-translations';
✅ const { t } = useLanguage();
```

---

## 🧪 Testing

### Manual Test
```bash
# 1. Start dev server
npm run dev

# 2. Open browser
# 3. Go to /settings
# 4. Change language to Italian
# 5. Navigate to your page
# 6. Verify all text is Italian
```

### What to Check
- ✅ All visible text is translated
- ✅ Variables are replaced correctly
- ✅ No English text remains
- ✅ Buttons work correctly
- ✅ Forms submit properly

---

## 🆘 Need Help?

### Getting Translations for All Languages

**Recommended Workflow:**
1. **Write the English text** (base language)
2. **Translate to Italian** using DeepL or native speaker
3. **Use DeepL to translate from English** to the remaining languages (Polish, Spanish, French, Dutch, German)
4. **Review translations** - DeepL is very accurate, but context matters

**Translation Tools:**
- **Best:** DeepL - https://www.deepl.com/translator (most accurate)
- **Good:** Ask native speakers for review
- **OK:** Google Translate (less accurate, use as last resort)

**Pro Tip:** Keep translations consistent - if you use "Register" in one place, use the same translation pattern elsewhere.

### Common Issues

**Issue:** "useLanguage must be used within a LanguageProvider"
- **Fix:** Make sure component is wrapped in `<LanguageProvider>` (already in `app/layout.tsx`)

**Issue:** Translation key not found
- **Fix:** Check spelling, ensure key exists in ALL 7 language objects (en, it, pl, es, fr, nl, de)

**Issue:** Variables not replacing
- **Fix:** Use `tVar()` instead of `t()` for text with `{{variables}}`

---

## 📖 Full Documentation

See `TRANSLATION_IMPLEMENTATION.md` for:
- Complete implementation details
- DeepL API integration
- Message translation system
- Testing procedures
- Troubleshooting guide

---

## 💡 Pro Tips

1. **Add translations as you code** - Don't leave it until the end
2. **Use descriptive keys** - `transaction.deleteConfirmTitle` not `delTitle`
3. **Group related keys** - Keep all form labels together
4. **Test frequently** - Switch languages often while developing
5. **Check the existing keys** - Your translation may already exist!

---

## 🌟 Example: Adding a New Feature

```typescript
// 1. Add to ui-translations.ts - ALL 7 languages required!
const translations = {
  en: {
    'invoice.title': 'Invoices',
    'invoice.create': 'Create Invoice',
    'invoice.total': 'Total: €{{amount}}',
  },
  it: {
    'invoice.title': 'Fatture',
    'invoice.create': 'Crea Fattura',
    'invoice.total': 'Totale: €{{amount}}',
  },
  pl: {
    'invoice.title': 'Faktury',
    'invoice.create': 'Utwórz fakturę',
    'invoice.total': 'Razem: €{{amount}}',
  },
  es: {
    'invoice.title': 'Facturas',
    'invoice.create': 'Crear factura',
    'invoice.total': 'Total: €{{amount}}',
  },
  fr: {
    'invoice.title': 'Factures',
    'invoice.create': 'Créer une facture',
    'invoice.total': 'Total: €{{amount}}',
  },
  nl: {
    'invoice.title': 'Facturen',
    'invoice.create': 'Factuur aanmaken',
    'invoice.total': 'Totaal: €{{amount}}',
  },
  de: {
    'invoice.title': 'Rechnungen',
    'invoice.create': 'Rechnung erstellen',
    'invoice.total': 'Gesamt: €{{amount}}',
  }
};

// 2. Use in component
'use client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function InvoicesPage() {
  const { t, tVar } = useLanguage();
  
  return (
    <div>
      <h1>{t('invoice.title')}</h1>
      <Button>{t('invoice.create')}</Button>
      <p>{tVar('invoice.total', { amount: '1,234.56' })}</p>
    </div>
  );
}

// 3. Test in multiple languages (at least English and Italian)
// 4. Done! ✅

**Remember:** Always add translations to ALL 7 language sections, not just English and Italian!
```

---

**Remember: Every piece of UI text must be translatable!** 🌍

When in doubt, check existing pages (Dashboard, Transactions, Settings) for examples.

