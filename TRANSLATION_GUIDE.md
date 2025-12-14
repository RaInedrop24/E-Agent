# Translation Quick Reference Guide

**🌍 The Property Gateway - Multi-Language Support**

## 📋 Quick Checklist

Before committing ANY UI changes:
- [ ] Added translation keys to `src/lib/ui-translations.ts` (EN & IT)
- [ ] Used `useLanguage()` hook in component
- [ ] Replaced all hardcoded strings with `t()` or `tVar()`
- [ ] Tested in both English and Italian
- [ ] No untranslated text remains

---

## 🚀 Quick Start (5 Steps)

### 1️⃣ Add Translation Keys

**File:** `src/lib/ui-translations.ts`

```typescript
const translations = {
  en: {
    'category.myKey': 'My English Text',
    'category.withVar': 'Hello {{name}}!',
  },
  it: {
    'category.myKey': 'Il Mio Testo Italiano',
    'category.withVar': 'Ciao {{name}}!',
  }
};
```

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

### 4️⃣ Test Both Languages

1. Go to `/settings`
2. Change language to Italian
3. Save and navigate to your page
4. Verify all text is Italian

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

---

## ❌ Common Mistakes

### 1. Hardcoded Text
```typescript
❌ <Button>Save Changes</Button>
✅ <Button>{t('action.save')}</Button>
```

### 2. Missing Italian Translation
```typescript
❌ 'myKey': 'English only'
✅ Add both EN and IT keys
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

### Getting Italian Translations
1. **Best:** Use DeepL - https://www.deepl.com/translator
2. **Good:** Ask Italian-speaking colleague
3. **OK:** Google Translate (less accurate)

### Common Issues

**Issue:** "useLanguage must be used within a LanguageProvider"
- **Fix:** Make sure component is wrapped in `<LanguageProvider>` (already in `app/layout.tsx`)

**Issue:** Translation key not found
- **Fix:** Check spelling, ensure key exists in both `en` and `it` objects

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
// 1. Add to ui-translations.ts
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

// 3. Test in both languages
// 4. Done! ✅
```

---

**Remember: Every piece of UI text must be translatable!** 🌍

When in doubt, check existing pages (Dashboard, Transactions, Settings) for examples.

