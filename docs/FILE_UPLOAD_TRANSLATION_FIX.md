# File Upload Translation & Styling Fix

## Summary
Fixed the file upload inputs across the application to be properly translated and styled like buttons for better user experience.

## Issues Addressed
1. **Translation Issue**: File upload inputs showed browser default text "Choose file - No file chosen" in English regardless of the user's selected language
2. **UX Issue**: The default file input styling didn't look like a button and wasn't clear how to use

## Changes Made

### 1. Translation Keys Added (All 7 Languages)
Added to `src/lib/ui-translations.ts`:

- `settings.chooseFile` - "Choose file" button text
- `settings.noFileChosen` - "No file chosen" placeholder text

**Languages covered:**
- 🇬🇧 English: "Choose file" / "No file chosen"
- 🇮🇹 Italian: "Scegli file" / "Nessun file selezionato"
- 🇵🇱 Polish: "Wybierz plik" / "Nie wybrano pliku"
- 🇪🇸 Spanish: "Elegir archivo" / "Ningún archivo elegido"
- 🇫🇷 French: "Choisir un fichier" / "Aucun fichier choisi"
- 🇳🇱 Dutch: "Bestand kiezen" / "Geen bestand gekozen"
- 🇩🇪 German: "Datei auswählen" / "Keine Datei ausgewählt"

### 2. Settings Page (`src/app/settings/page.tsx`)

#### Avatar Upload Section
**Before:**
```tsx
<Input id="avatar" type="file" accept="image/*" onChange={onAvatarChange} className="max-w-xs" />
```

**After:**
- Custom styled button showing translated "Choose file" text
- Displays selected filename or translated "No file chosen" message
- Better visual hierarchy with separate "Choose file" and "Upload avatar" buttons

#### Brand Logo Upload Section
**Before:**
```tsx
<Input type="file" accept="image/*" onChange={onBrandLogoChange} />
```

**After:**
- Same custom styled button approach
- Consistent with avatar upload styling
- Proper translation support

### 3. Transaction Files Panel (`src/components/features/transaction/TransactionFilesPanel.tsx`)

**Before:**
```tsx
<Input
  type="file"
  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
/>
```

**After:**
- Custom styled file input with translated button text
- Shows selected filename in truncated text
- Consistent styling with settings page

## Technical Implementation

### Custom File Input Pattern
```tsx
<div className="relative">
  <input
    type="file"
    onChange={handleFileChange}
    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
  />
  <Button variant="outline" type="button" className="pointer-events-none">
    {t('settings.chooseFile')}
  </Button>
</div>
<span className="text-sm text-muted-foreground">
  {selectedFile ? selectedFile.name : t('settings.noFileChosen')}
</span>
```

**How it works:**
1. Invisible native file input positioned absolutely over the button
2. Visual button styled with our design system (pointer-events-none to not block clicks)
3. File input captures the click and opens the file picker
4. Selected filename or "No file chosen" message displayed next to button
5. All text properly translated using the language context

## Benefits

✅ **Multilingual Support**: File uploads now respect user's language preference
✅ **Better UX**: Clear button-style interface makes it obvious how to select files
✅ **Consistent Design**: Matches the rest of the application's design system
✅ **Accessibility**: Maintains native file input accessibility features
✅ **Filename Display**: Users can see which file they selected before uploading

## Testing Checklist

- [x] Translations added for all 7 languages
- [x] No linter errors
- [x] Applied to all file inputs in the application:
  - [x] Settings page - Avatar upload
  - [x] Settings page - Brand logo upload (agents only)
  - [x] Transaction files panel - Document upload

## Testing Instructions

1. **Test Translation:**
   - Go to `/settings`
   - Change language to Italian
   - Navigate back to settings
   - Click on avatar "Scegli file" button - should show Italian text
   - Try other languages (Polish, Spanish, French, Dutch, German)

2. **Test in Transaction Files:**
   - Open any transaction
   - Go to Files tab
   - Click "Choose file" button
   - Verify button text is translated
   - Verify "No file chosen" / filename is translated

3. **Test File Selection:**
   - Click the button to select a file
   - Verify the filename appears after selection
   - Verify you can upload the file successfully

## Files Modified

1. `estate-portal/src/lib/ui-translations.ts` - Added translation keys for all 7 languages
2. `estate-portal/src/app/settings/page.tsx` - Updated avatar and brand logo file inputs
3. `estate-portal/src/components/features/transaction/TransactionFilesPanel.tsx` - Updated document file input

## Notes

- The custom file input maintains full accessibility by using the native HTML file input
- The styling uses Tailwind CSS classes consistent with the rest of the application
- No changes to file upload logic - only UI/UX improvements
- Works for both buyer and agent settings pages

