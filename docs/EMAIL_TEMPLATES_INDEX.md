# Email Templates Index

## Overview
This document provides an index of all email templates used in The Property Gateway system. Templates are categorized by their purpose and email service provider.

---

## 📧 Supabase Auth Emails

These emails are sent automatically by Supabase Authentication and must be configured in the Supabase Dashboard under **Authentication → Email Templates**.

### 1. Email Confirmation (Signup)
**Purpose:** Verify new user's email address during registration

**Files:**
- `SUPABASE_CONFIRM_EMAIL_TEMPLATE.html` - Original English-only version
- `SUPABASE_CONFIRM_EMAIL_TEMPLATE_MULTILINGUAL.html` - ✨ **Multilingual version (7 languages)**

**Languages:** English, Italian, Polish, Spanish, French, Dutch, German

**Triggered when:**
- Agent registers via `/register` page
- New user account is created

**Variables used:**
- `{{ .ConfirmationURL }}` - Verification link
- `{{ .Data.preferred_language }}` - User's preferred language

**Setup Guide:** See template file comments

---

### 2. Password Reset Request
**Purpose:** Send password reset link when user requests to reset their password

**Files:**
- `SUPABASE_PASSWORD_RESET_EMAIL_TEMPLATE_MULTILINGUAL.html` - ✨ **Multilingual version (7 languages)**

**Languages:** English, Italian, Polish, Spanish, French, Dutch, German

**Triggered when:**
- User clicks "Forgot Password" on login page
- Password reset is requested via Supabase Auth

**Variables used:**
- `{{ .ConfirmationURL }}` - Password reset link
- `{{ .Email }}` - User's email address
- `{{ .Data.preferred_language }}` - User's preferred language

**Setup Guide:** See template file comments

---

### 3. Password Change Confirmation ⭐ **NEW**
**Purpose:** Confirm that a password was successfully changed (security notification)

**Files:**
- `SUPABASE_PASSWORD_CHANGED_EMAIL_TEMPLATE_MULTILINGUAL.html` - ✨ **Multilingual version (7 languages)**

**Languages:** English, Italian, Polish, Spanish, French, Dutch, German

**Triggered when:**
- User successfully changes their password
- Password reset is completed
- Admin changes user password

**Variables used:**
- `{{ .Email }}` - User's email address
- `{{ .SentAt }}` - Timestamp of change
- `{{ .Data.preferred_language }}` - User's preferred language

**Setup Guide:** `SUPABASE_PASSWORD_CHANGED_EMAIL_SETUP.md`

**Features:**
- ✅ Success confirmation with green checkmark icon
- ⚠️ Security warning if user didn't make the change
- 💡 Security tips for password management
- 📋 Account details (email, timestamp)

---

## 📨 Application Emails (Resend)

These emails are sent by the application code using the Resend API and are configured via environment variables.

### 4. Buyer Invitation & Welcome
**Purpose:** Invite new buyers and provide login credentials

**Files:**
- `SUPABASE_BUYER_INVITE_EMAIL_TEMPLATE_MULTILINGUAL.html` - ✨ **Multilingual version (7 languages)**

**Languages:** English, Italian, Polish, Spanish, French, Dutch, German

**Triggered when:**
- Agent creates a new buyer account via `/buyers` page
- Buyer is added to a transaction

**Variables used:**
- Buyer email
- Default password
- Login link

**Setup Guide:** `EMAIL_SETUP.md`

**Service:** Resend API

---

## 🎨 Email Design System

All templates follow a consistent design system:

### Visual Identity
- **Primary Color:** Blue (#2563eb)
- **Success Color:** Green (#10b981)
- **Warning Color:** Amber (#f59e0b)
- **Danger Color:** Red (#dc2626)
- **Background:** Light gray (#f3f4f6)

### Layout
- **Max Width:** 600px (responsive)
- **Font Family:** System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, etc.)
- **Border Radius:** 8px for cards, 6px for buttons, 4px for inputs
- **Shadow:** Subtle box-shadow for depth

### Components

#### Header
- Gradient blue background (#2563eb to #1e40af)
- White "The Property Gateway" logo/title
- Centered text

#### Content Area
- White background
- 40px padding
- Clear typography hierarchy
- Generous line-height (1.6)

#### Call-to-Action Buttons
- Blue background (#2563eb)
- White text
- 14px vertical padding, 32px horizontal padding
- Font weight 600
- Centered in table cell

#### Info Boxes
- Blue left border (4px)
- Light blue background (#eff6ff)
- Dark blue text (#1e3a8a)

#### Warning Boxes
- Amber left border (4px)
- Light amber background (#fef3c7)
- Dark amber text (#78350f)

#### Footer
- Light gray background (#f9fafb)
- Smaller text (12-14px)
- Company info and support contact

---

## 🌍 Language Support

All multilingual templates support these 7 languages:

| Language | Code | Native Name |
|----------|------|-------------|
| English | `en` | English |
| Italian | `it` | Italiano |
| Polish | `pl` | Polski |
| Spanish | `es` | Español |
| French | `fr` | Français |
| Dutch | `nl` | Nederlands |
| German | `de` | Deutsch |

### How Language is Determined

1. **Supabase Emails:** Uses `{{ .Data.preferred_language }}` from user's profile
2. **Application Emails:** Uses `preferred_language` field from buyer's profile
3. **Fallback:** Defaults to English if language not set

---

## 📋 Template Checklist

When creating or updating email templates:

- [ ] Test in all 7 languages
- [ ] Verify all variables are correctly mapped
- [ ] Check responsive design on mobile
- [ ] Test in major email clients:
  - [ ] Gmail
  - [ ] Outlook
  - [ ] Apple Mail
  - [ ] Yahoo Mail
- [ ] Ensure inline styles (no external CSS)
- [ ] Validate HTML syntax
- [ ] Check accessibility (alt text, semantic HTML)
- [ ] Review security considerations
- [ ] Update documentation

---

## 🔒 Security Considerations

### Email Content
- Never include sensitive data like passwords (except initial temp password)
- Always include security warnings for account changes
- Provide clear action steps if user didn't initiate the action
- Show timestamps and account details for verification

### Link Security
- All confirmation/reset links expire after 24 hours (Supabase default)
- Links are single-use tokens
- Links are securely generated by Supabase Auth

### Best Practices
- ✅ Use HTTPS for all links
- ✅ Include contact/support information
- ✅ Warn about phishing attempts
- ✅ Show legitimate sender information
- ✅ Use verified domains (not free email providers)

---

## 📚 Related Documentation

- `EMAIL_SETUP.md` - Resend API setup for application emails
- `SUPABASE_PASSWORD_CHANGED_EMAIL_SETUP.md` - Password change confirmation setup
- `TRANSLATION_GUIDE.md` - UI translation guidelines
- `Project_Brief.md` - Overall project documentation

---

## 🛠️ Testing & Troubleshooting

### Testing Workflow

1. **Local Testing:**
   ```bash
   npm run dev
   ```

2. **Test Each Email Type:**
   - Signup confirmation: Register new agent
   - Password reset: Click "Forgot Password"
   - Password changed: Change password in settings
   - Buyer invite: Create new buyer as agent

3. **Test All Languages:**
   - Change user's `preferred_language` in Supabase
   - Trigger the email
   - Verify correct language is used

### Common Issues

**Problem:** Emails appear in English for all users
**Solution:** Verify `preferred_language` is set in user's profile metadata

**Problem:** Variables show as literal text (e.g., `{{ .Email }}`)
**Solution:** Check Supabase template syntax and variable names

**Problem:** Styling broken in Outlook
**Solution:** Ensure all styles are inline (already done in templates)

**Problem:** Email not sending
**Solution:** Check Supabase logs, verify domain configuration, check email service status

---

## 📞 Support

For issues with:
- **Supabase Auth Emails:** Check Supabase logs and email delivery status
- **Application Emails (Resend):** Check Resend dashboard and API limits
- **Template Content:** Review the specific template file
- **Translations:** Refer to `TRANSLATION_GUIDE.md`

---

**Last Updated:** 2026-01-05  
**Total Templates:** 4  
**Languages Supported:** 7  
**Email Services:** 2 (Supabase Auth, Resend API)

