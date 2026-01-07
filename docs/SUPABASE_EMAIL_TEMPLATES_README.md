# Supabase Email Templates Configuration

## 📧 **Overview**

This folder contains multilingual email templates for Supabase Auth emails. These templates provide a professional, branded experience for users in 7 languages.

---

## 🎨 **Agent-Branded Buyer Emails**

**NEW:** Buyer welcome and connection emails now include **agent branding** automatically:

- ✅ Agent logo displayed in email header
- ✅ Agent primary color in email design
- ✅ Agent name prominently displayed
- ✅ "via The Property Gateway" subtitle for platform trust

### How It Works

When an agent creates or connects with a buyer:
1. System fetches agent's `branding_logo_url` and `branding_settings.primary` color
2. Email template automatically includes agent branding
3. Buyer receives professionally branded email from their agent

---

## 📁 **Template Files**

### 1. **Password Reset Email** (`SUPABASE_PASSWORD_RESET_EMAIL_TEMPLATE_MULTILINGUAL.html`)
- Used when user clicks "Forgot Password"
- Contains secure reset link (expires in 1 hour)
- Available in: EN, IT, PL, ES, FR, NL, DE

### 2. **Password Changed Confirmation** (`SUPABASE_PASSWORD_CHANGED_EMAIL_TEMPLATE_MULTILINGUAL.html`)
- Sent after successful password change
- Security notification
- Available in: EN, IT, PL, ES, FR, NL, DE

---

## 🚀 **Supabase Configuration**

### **Step 1: Access Supabase Dashboard**

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Authentication > Email Templates**

### **Step 2: Configure Password Reset Email**

1. Select **"Reset Password"** template
2. **Subject Line:**
   ```
   Reset Your Password - The Property Gateway
   ```

3. **Email Body:**
   - Copy the entire contents of `SUPABASE_PASSWORD_RESET_EMAIL_TEMPLATE_MULTILINGUAL.html`
   - Paste into the "Email Body (HTML)" field
   - Click **Save**

### **Step 3: Configure Password Changed Email**

1. Select **"Change Email Address"** or **"Password Changed"** template (depending on Supabase version)
2. **Subject Line:**
   ```
   Password Changed - The Property Gateway
   ```

3. **Email Body:**
   - Copy the entire contents of `SUPABASE_PASSWORD_CHANGED_EMAIL_TEMPLATE_MULTILINGUAL.html`
   - Paste into the "Email Body (HTML)" field
   - Click **Save**

---

## 🌍 **Supported Languages**

| Language | Code | Flag |
|----------|------|------|
| English | `en` | 🇬🇧 |
| Italian | `it` | 🇮🇹 |
| Polish | `pl` | 🇵🇱 |
| Spanish | `es` | 🇪🇸 |
| French | `fr` | 🇫🇷 |
| Dutch | `nl` | 🇳🇱 |
| German | `de` | 🇩🇪 |

---

## 🔑 **Template Variables**

Supabase provides these variables automatically:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ .Email }}` | User's email address | buyer@example.com |
| `{{ .ConfirmationURL }}` | Password reset link | https://... |
| `{{ .SentAt }}` | Timestamp | 2025-01-06 12:00:00 |
| `{{ .Data.preferred_language }}` | User's language preference | `it` |

---

## ⚙️ **How Language Detection Works**

1. User's `preferred_language` is stored in `profiles` table
2. Supabase passes this via `{{ .Data.preferred_language }}`
3. Template uses conditional logic:
   ```html
   {{ if eq .Data.preferred_language "it" }}
     Contenuto italiano
   {{ else if eq .Data.preferred_language "pl" }}
     Treść polska
   {{ else }}
     English content
   {{ end }}
   ```

---

## 🎯 **Email Flow**

### **Buyer Creation Flow:**
```
Agent Creates Buyer
       ↓
Agent Branding Fetched (logo + colors)
       ↓
Welcome Email Sent WITH Agent Branding
       ↓
Buyer Receives Branded Email
       ↓
Buyer Logs In & Changes Password
       ↓
Password Changed Email (Platform Branding)
```

### **Password Reset Flow:**
```
User Clicks "Forgot Password"
       ↓
Password Reset Email Sent (Platform Branding)
       ↓
User Clicks Reset Link
       ↓
User Sets New Password
       ↓
Password Changed Email (Platform Branding)
```

---

## 🔒 **Security Features**

- ✅ Reset links expire after 1 hour
- ✅ Warning if user didn't request reset
- ✅ Security tips included
- ✅ Clear account details (email, timestamp)

---

## 📋 **Testing**

### **Test Password Reset:**
1. Go to `/login`
2. Click "Forgot Password"
3. Enter test email
4. Check email inbox
5. Verify template renders correctly
6. Test reset link

### **Test Password Changed:**
1. Log in to account
2. Go to `/settings` or profile
3. Change password
4. Check email inbox
5. Verify confirmation email

---

## 🛠️ **Customization**

### **Change Platform Colors:**

Find this line in the header:
```html
background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
```

Replace with your preferred colors.

### **Add Support Email:**

In the footer, update contact information:
```html
If you have questions, contact support@thepropertygateway.com
```

---

## 📝 **Notes**

1. **Agent Branding:** Only applies to buyer welcome/connection emails (application-sent)
2. **Platform Branding:** Used for all Supabase system emails (password reset, etc.)
3. **Multilingual:** All templates automatically detect and use user's preferred language
4. **Mobile Responsive:** Templates tested on all major email clients

---

## 🆘 **Troubleshooting**

### **Emails not being sent:**
- Check Supabase SMTP settings are configured
- Verify email templates are saved in Supabase dashboard
- Check Resend API key is configured (`RESEND_API_KEY`)

### **Wrong language displayed:**
- Ensure user has `preferred_language` set in profile
- Check profile table has all 7 languages in CHECK constraint
- Verify conditional logic in template

### **Agent branding not showing:**
- Agent must have `branding_logo_url` set
- Agent must have `branding_settings.primary` color
- Only applies to buyer welcome/connection emails
- System emails (password reset) use platform branding

---

## ✅ **Completion Checklist**

- [ ] Password Reset template uploaded to Supabase
- [ ] Password Changed template uploaded to Supabase
- [ ] Test password reset flow
- [ ] Test password change notification
- [ ] Verify all 7 languages display correctly
- [ ] Check mobile rendering
- [ ] Verify agent branding appears in buyer emails
- [ ] Test with agents who have/don't have branding set

---

**🎉 All templates ready for production use!**


