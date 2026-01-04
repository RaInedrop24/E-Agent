# Supabase Email Templates

## 🌍 Multilingual Support

**✅ RECOMMENDED**: Use the multilingual templates that automatically display content in the user's preferred language (en, it, pl, es, fr, nl, de).

The templates use Supabase's Go template syntax to check `{{ .Data.preferred_language }}` and display the appropriate language based on what the user selected during registration or when the buyer was created.

---

## 📧 Email Templates

This guide covers two email templates:
1. **Confirm Signup** - Sent to newly registered agents
2. **Invite User** - Sent to buyers when agents invite them to transactions

---

## 1. Confirm Signup Email (Agent Registration)

---

## Quick Setup (5 minutes)

### Option 1: Multilingual Template (Recommended)

1. Go to your **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Select **"Confirm signup"** template
3. **Subject Line**: Use the multilingual subject below (or keep it simple: `Welcome to The Property Gateway`)
4. **Body**: Open `SUPABASE_CONFIRM_EMAIL_TEMPLATE_MULTILINGUAL.html` in this folder, copy all content, and paste into the template editor
5. Click **Save**

### Option 2: English Only Template

1. Go to your **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Select **"Confirm signup"** template
3. **Subject Line**: `Welcome to The Property Gateway - Please Verify Your Email`
4. **Body**: Open `SUPABASE_CONFIRM_EMAIL_TEMPLATE.html` in this folder, copy all content, and paste into the template editor
5. Click **Save**

---

## Email Subject

### Multilingual Subject (Recommended)

Use this subject line that adapts to the user's language:

```
{{ if eq .Data.preferred_language "it" }}Benvenuto su The Property Gateway - Verifica la tua email{{ else if eq .Data.preferred_language "pl" }}Witamy w The Property Gateway - Zweryfikuj swój email{{ else if eq .Data.preferred_language "es" }}Bienvenido a The Property Gateway - Verifica tu correo{{ else if eq .Data.preferred_language "fr" }}Bienvenue sur The Property Gateway - Vérifiez votre email{{ else if eq .Data.preferred_language "nl" }}Welkom bij The Property Gateway - Verifieer je e-mail{{ else if eq .Data.preferred_language "de" }}Willkommen bei The Property Gateway - E-Mail bestätigen{{ else }}Welcome to The Property Gateway - Please Verify Your Email{{ end }}
```

### Simple English Subject (Alternative)

```
Welcome to The Property Gateway - Please Verify Your Email
```

---

## HTML Email Templates

### 🌍 Multilingual Template (Recommended)

**📄 Ready-to-use multilingual template**: See `SUPABASE_CONFIRM_EMAIL_TEMPLATE_MULTILINGUAL.html` in this folder

This template automatically displays content in the user's preferred language (en, it, pl, es, fr, nl, de) based on their registration selection. It uses Supabase's Go template syntax with conditional logic.

**How it works:**
- Checks `{{ .Data.preferred_language }}` from user metadata
- Displays content in the matching language
- Falls back to English if language is not recognized

### 🇬🇧 English Only Template

**📄 Ready-to-use English template**: See `SUPABASE_CONFIRM_EMAIL_TEMPLATE.html` in this folder

Or copy and paste this into the Supabase email template editor:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - The Property Gateway</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                The Property Gateway
              </h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">
                Welcome! Please Verify Your Email
              </h2>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for registering with The Property Gateway. We're excited to have you on board!
              </p>
              
              <p style="margin: 0 0 32px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                To complete your registration and start managing your property transactions, please verify your email address by clicking the button below:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="margin: 0 0 32px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 32px; padding: 12px; background-color: #f9fafb; border-radius: 4px; word-break: break-all; color: #374151; font-size: 13px; font-family: monospace; line-height: 1.5;">
                {{ .ConfirmationURL }}
              </p>
              
              <!-- Next Steps -->
              <div style="margin: 32px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px;">
                <p style="margin: 0 0 12px; color: #1e40af; font-size: 15px; font-weight: 600;">
                  What happens next?
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
                  <li>Click the verification link above</li>
                  <li>You'll be redirected to set your password</li>
                  <li>Log in and start managing your property transactions</li>
                  <li>If you provided a website URL, we'll automatically extract your brand colors</li>
                </ul>
              </div>
              
              <!-- Security Note -->
              <p style="margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; line-height: 1.6;">
                <strong>Security Note:</strong> This verification link will expire in 24 hours. If you didn't create an account with The Property Gateway, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; text-align: center;">
                <strong>The Property Gateway</strong><br>
                International Property Transaction Portal
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.6;">
                This email was sent to verify your account registration.<br>
                If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Plain Text Version (Optional)

For email clients that don't support HTML, you can also set a plain text version:

```
Welcome to The Property Gateway!

Thank you for registering with The Property Gateway. We're excited to have you on board!

To complete your registration and start managing your property transactions, please verify your email address by clicking the link below:

{{ .ConfirmationURL }}

What happens next?
- Click the verification link above
- You'll be redirected to set your password
- Log in and start managing your property transactions
- If you provided a website URL, we'll automatically extract your brand colors

Security Note: This verification link will expire in 24 hours. If you didn't create an account with The Property Gateway, please ignore this email.

---
The Property Gateway
International Property Transaction Portal

This email was sent to verify your account registration.
If you have any questions, please contact our support team.
```

---

## Template Variables

Supabase provides these variables you can use:

- `{{ .ConfirmationURL }}` - The verification link (required)
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your site URL (if configured)
- `{{ .Token }}` - The verification token (usually not needed)
- `{{ .Data.preferred_language }}` - User's preferred language from registration (e.g., "en", "it", "pl", "es", "fr", "nl", "de")
- `{{ .Data.full_name }}` - User's full name from registration
- `{{ .Data.role }}` - User's role ("agent" or "buyer")

### Using Conditional Logic

The multilingual template uses Go template syntax for conditional rendering:

```go
{{ if eq .Data.preferred_language "it" }}
  Italian text here
{{ else if eq .Data.preferred_language "pl" }}
  Polish text here
{{ else }}
  Default English text
{{ end }}
```

---

## Customization Tips

1. **Colors**: Update the gradient colors in the header to match your brand
2. **Logo**: Add an `<img>` tag in the header if you have a logo URL
3. **Support Contact**: Add your support email or contact information in the footer
4. **Language**: The multilingual template supports all 7 languages (en, it, pl, es, fr, nl, de) automatically
5. **Adding New Languages**: To add a new language, add `{{ else if eq .Data.preferred_language "xx" }}` conditions with translated text

---

## Testing

After updating the template:

1. **Test Each Language**: Register test accounts with different preferred languages (en, it, pl, es, fr, nl, de)
2. **Verify Language Display**: Check that emails appear in the correct language for each test account
3. **Check the Link**: Verify the confirmation link works correctly
4. **Email Client Testing**: Test on different email clients (Gmail, Outlook, Apple Mail)
5. **Mobile Testing**: Test on mobile devices to ensure responsive design works
6. **Fallback Testing**: Test with an unrecognized language code to ensure it falls back to English

---

---

## 2. Invite User Email (Buyer Invitation)

This email is sent to buyers when agents invite them to join a transaction. The email language is based on the **buyer's** preferred language (not the agent's).

### Quick Setup (5 minutes)

1. Go to your **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Select **"Invite user"** template
3. **Subject Line**: `The Property Gateway - Please Set Your Password` (or use the multilingual subject below)
4. **Body**: Open `SUPABASE_BUYER_INVITE_EMAIL_TEMPLATE_MULTILINGUAL.html` in this folder, copy all content, and paste into the template editor
5. Click **Save**

### Email Subject

#### Simple Subject (Recommended - under 255 characters)

```
The Property Gateway - Please Set Your Password
```

#### Multilingual Subject (Alternative)

```
{{ if eq .Data.preferred_language "it" }}The Property Gateway - Imposta la tua password{{ else if eq .Data.preferred_language "pl" }}The Property Gateway - Ustaw swoje hasło{{ else if eq .Data.preferred_language "es" }}The Property Gateway - Establece tu contraseña{{ else if eq .Data.preferred_language "fr" }}The Property Gateway - Définissez votre mot de passe{{ else if eq .Data.preferred_language "nl" }}The Property Gateway - Stel uw wachtwoord in{{ else if eq .Data.preferred_language "de" }}The Property Gateway - Legen Sie Ihr Passwort fest{{ else }}The Property Gateway - Please Set Your Password{{ end }}
```

### HTML Email Template

**📄 Ready-to-use multilingual template**: See `SUPABASE_BUYER_INVITE_EMAIL_TEMPLATE_MULTILINGUAL.html` in this folder

This template:
- Automatically displays content in the buyer's preferred language
- Uses the buyer's name: `{{ .Data.full_name }}`
- Includes branding for The Property Gateway
- Matches the design style of the confirmation email
- Supports all 7 languages (en, it, pl, es, fr, nl, de)

### Template Variables for Buyer Invite

- `{{ .ConfirmationURL }}` - The password setup link (required)
- `{{ .Data.full_name }}` - Buyer's full name from when agent created them
- `{{ .Data.preferred_language }}` - Buyer's preferred language (e.g., "en", "it", "pl", "es", "fr", "nl", "de")
- `{{ .Data.role }}` - Will be "buyer"
- `{{ .Email }}` - Buyer's email address

### Important Notes

- **Language Source**: The email language is determined by the buyer's `preferred_language` that was set when the agent created the buyer account
- **Branding**: All references to "E-Agent" have been replaced with "The Property Gateway"
- **Logo/Branding**: The template includes the branded header with "The Property Gateway" name. If you have a logo URL, you can add it to the header section

---

## General Notes

- The templates use inline CSS for maximum email client compatibility
- They're responsive and will work on mobile devices
- The design matches a professional property transaction platform
- All links use the `{{ .ConfirmationURL }}` variable provided by Supabase
- **Multilingual Support**: The preferred language is automatically captured during registration/buyer creation and stored in `auth.users.raw_user_meta_data.preferred_language`
- **Language Detection**: If `preferred_language` is not set or unrecognized, the template defaults to English
- **Supported Languages**: en (English), it (Italian), pl (Polish), es (Spanish), fr (French), nl (Dutch), de (German)
- **Subject Line Limit**: Supabase has a 255 character limit for email subjects, so keep subjects concise

