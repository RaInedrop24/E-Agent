# Email Setup Guide

## 📧 Automated Buyer Welcome Emails

The system now automatically sends multilingual welcome emails to new buyers with their login credentials.

---

## 🔧 Setup Instructions

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### 2. Get Your API Key

1. Log into Resend dashboard
2. Go to **API Keys** section
3. Click **Create API Key**
4. Copy the API key (starts with `re_...`)

### 3. Verify Your Domain (Production)

For production use, you need to verify your domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `thepropertygateway.com`)
4. Add the provided DNS records (TXT, MX, etc.) to your domain
5. Wait for verification (usually takes a few minutes)

**Note:** For development/testing, you can use the default Resend sandbox domain.

### 4. Add Environment Variables

Add these to your `.env.local` (development) and production environment:

```env
# Resend Email Service
RESEND_API_KEY=re_YOUR_API_KEY_HERE

# Email "From" address (must match your verified domain)
EMAIL_FROM="The Property Gateway <noreply@thepropertygateway.com>"
```

**Important:**
- Replace `re_YOUR_API_KEY_HERE` with your actual Resend API key
- The `EMAIL_FROM` domain must match your verified domain in Resend
- For testing, you can use `onboarding@resend.dev` as the from address

### 5. Test the Email System

1. Restart your Next.js server
2. Login as an agent
3. Go to `/buyers` page
4. Create a new test buyer
5. Check if the welcome email is sent

---

## 🌍 Multilingual Support

Emails are automatically sent in the buyer's preferred language:
- 🇬🇧 English (en)
- 🇮🇹 Italian (it)
- 🇵🇱 Polish (pl)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇳🇱 Dutch (nl)
- 🇩🇪 German (de)

---

## 📋 Email Content

The welcome email includes:
- Greeting in buyer's language
- Login credentials (email + a temporary password generated per buyer)
- Direct link to login page
- Security notice about required password change
- Professional formatting matching the site design

---

## 🚨 Troubleshooting

### Email not sending?

1. **Check API key:** Make sure `RESEND_API_KEY` is set correctly
2. **Check logs:** Look for `[Email Service]` messages in console
3. **Verify domain:** Ensure your domain is verified in Resend (for production)
4. **Rate limits:** Free tier has 100 emails/day limit
5. **Check spam:** Test emails might go to spam folder

### Manual fallback

If email fails, the agent sees an alert with credentials to share manually:
```
✅ Buyer created successfully!

⚠️ Email failed to send - please share these credentials manually:

Email: buyer@example.com
Temporary Password: (generated during buyer creation)
```

---

## 💰 Pricing

**Resend Pricing:**
- **Free:** 100 emails/day, 3,000/month
- **Paid:** $20/month for 50,000 emails/month

For most real estate agencies, the free tier should be sufficient.

---

## 🔐 Security Notes

- API keys should NEVER be committed to Git
- Always use environment variables
- The temporary password is unique per buyer and must be changed on first login
- Emails contain sensitive information - ensure your domain is properly secured

---

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Node.js SDK](https://resend.com/docs/send-with-nodejs)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)

