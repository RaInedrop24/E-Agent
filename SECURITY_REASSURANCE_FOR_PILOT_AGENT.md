# Estate Agent Portal - Security & Privacy Reassurance

**For:** Pilot Estate Agent
**Date:** January 2026
**Platform:** Estate Agent Portal (E-Portal)

---

## Overview

Thank you for participating in the pilot of the Estate Agent Portal! This document provides transparency about how we protect your data and your buyers' information.

---

## What Data We Collect

### About Estate Agents (You)
- ✅ Full name
- ✅ Email address (for login)
- ✅ Preferred language
- ✅ Optional: Website URL, agency logo
- ❌ We do NOT collect: Bank details, government ID numbers, financial information

### About Buyers
- ✅ Full name
- ✅ Email address (for login)
- ✅ Preferred language
- ❌ We do NOT collect during pilot: Passport numbers, National Insurance numbers, home addresses, bank details

### About Transactions
- ✅ Property address (the property being purchased)
- ✅ Transaction title and status
- ✅ Milestone progress
- ✅ Messages between you and buyers
- ✅ Files uploaded (contracts, property photos)

---

## How We Protect Your Data

### 1. Encryption (Industry Standard)

**In Transit (when sending data):**
- All data transmitted over HTTPS (secure connection)
- Same technology used by banks and online shopping
- Prevents eavesdropping and man-in-the-middle attacks

**At Rest (when storing data):**
- Data stored in Supabase (AWS infrastructure)
- Encryption at rest (AES-256 encryption on disks)
- Passwords never stored in plaintext (bcrypt hashing)

### 2. Access Controls (Who Can See What)

**You can ONLY access:**
- Your own profile
- Buyers you created
- Transactions you created or where you're a participant
- Messages in your transactions
- Files in your transactions

**You CANNOT access:**
- Other agents' buyers or transactions
- System administration functions
- Other users' passwords or email addresses

**Buyers can ONLY access:**
- Their own profile
- Transactions they're invited to
- Messages in their transactions
- Files in their transactions

### 3. Authentication (Secure Login)

**Technology:**
- OAuth 2.0 with PKCE flow (industry standard)
- Same technology used by Google, Microsoft, Apple
- Session tokens expire after inactivity
- Password reset via secure email link

**Password Requirements:**
- Minimum 8 characters
- Must be changed on first login (for buyers)
- Securely hashed (never stored as plaintext)

### 4. File Security

**Upload Protection:**
- 20MB file size limit
- Files stored in private cloud storage (Supabase Storage)
- Each transaction has its own isolated folder
- Files cannot be accessed by unauthorized users

**Download Protection:**
- Time-limited download links (15-minute expiry)
- Links cannot be shared or reused
- Access logged for audit trail

### 5. No Third-Party Tracking

**What we DON'T do:**
- ❌ No Google Analytics tracking
- ❌ No Facebook Pixel
- ❌ No advertising cookies
- ❌ No selling data to third parties
- ❌ No marketing emails (unless you opt in)

**What we DO use:**
- ✅ Essential authentication cookies (required for login)
- ✅ DeepL API for translating messages (if you use translation feature)
- ✅ Twilio for SMS notifications (only if you enable SMS alerts)
- ✅ Resend for transactional emails (login, password reset)

---

## Your Rights (GDPR)

### Right to Access
You can request a copy of all data we hold about you at any time.
**How:** Email us or use the "Export Data" feature (coming soon)

### Right to Rectification
You can update your profile information anytime in Settings.
**How:** Go to Profile → Settings → Edit

### Right to Erasure ("Right to be Forgotten")
You can request deletion of your account and associated data.
**How:** Email us or use "Delete Account" (coming soon)
**Note:** We may retain anonymized transaction records for legal compliance

### Right to Object
You can object to processing of your data for marketing purposes.
**How:** Unsubscribe from emails or disable alerts in Settings

### Right to Data Portability
You can receive your data in a machine-readable format (JSON).
**How:** Email us or use "Export Data" feature (coming soon)

### Right to Lodge a Complaint
If you believe we've mishandled your data, you can complain to:
- **UK:** Information Commissioner's Office (ICO) - https://ico.org.uk
- **Ireland:** Data Protection Commission (DPC) - https://dataprotection.ie

---

## What We Do in Case of Security Incident

### Our Commitment:
1. **Immediate response** - Disable affected accounts, investigate scope
2. **Notify you within 24 hours** - Clear explanation of what happened
3. **Notify authorities within 72 hours** - As required by GDPR
4. **Remediation** - Fix the issue and prevent recurrence
5. **Transparency** - Keep you informed throughout the process

### What You Should Do:
1. Change your password immediately
2. Review recent activity in your account
3. Monitor for suspicious emails (phishing attempts)
4. Report anything unusual to us

---

## Data Retention (How Long We Keep Data)

**During Pilot:**
- **Active transactions:** Retained while transaction is ongoing
- **Completed transactions:** Retained for legal compliance (7 years in UK property law)
- **User accounts:** Retained until you request deletion
- **Audit logs:** Retained for 2 years

**After Pilot:**
- If you choose not to continue, we can delete your account and anonymize transaction records
- You can export your data before deletion

---

## Third-Party Services (Data Processors)

We use these trusted services to operate the platform:

| Service | Purpose | Data Shared | Location | Certifications |
|---------|---------|-------------|----------|----------------|
| **Supabase** | Database, authentication, file storage | All data | AWS (EU/US) | SOC 2 Type II, ISO 27001 |
| **DeepL** | Message translation (optional) | Message content | EU | ISO 27001, GDPR-compliant |
| **Twilio** | SMS notifications (if enabled) | Phone numbers | US | SOC 2, ISO 27001 |
| **Resend** | Transactional emails | Email addresses | EU/US | GDPR-compliant |

**Note:** All of these services have been vetted for security and GDPR compliance.

---

## What We DON'T Collect (During Pilot)

To keep the pilot simple and secure, we are **NOT collecting**:
- ❌ Passport numbers
- ❌ National Insurance numbers
- ❌ Tax ID numbers
- ❌ Bank account details
- ❌ Credit card numbers
- ❌ Buyer residential addresses (only property addresses)
- ❌ Health information
- ❌ Criminal records

**Reason:** These require enhanced encryption (Feature 001) which is planned for full launch.

---

## Technical Safeguards Summary

| Security Measure | Status | Details |
|-----------------|--------|---------|
| HTTPS Encryption | ✅ Enabled | All connections encrypted |
| Password Hashing | ✅ Enabled | bcrypt algorithm |
| Row Level Security | ✅ Enabled | Database-level access controls |
| Authentication | ✅ OAuth 2.0 | Industry standard |
| File Access Controls | ✅ Enabled | Transaction-scoped storage |
| Audit Logging | ✅ Enabled | Admin actions tracked |
| Rate Limiting | 🔶 Planned | API request throttling |
| Two-Factor Auth | 🔶 Available | Can be enabled per user |
| Application-Level Encryption | ❌ Not Yet | Required for sensitive PII (Feature 001) |

**Legend:**
- ✅ Enabled and active
- 🔶 Available but not mandatory
- ❌ Planned for full launch

---

## Support & Contact

**For Security Concerns:**
- Email: [YOUR EMAIL HERE]
- Response Time: Within 24 hours
- Emergency: [YOUR PHONE HERE]

**For Data Requests (Access, Deletion, etc.):**
- Email: [YOUR EMAIL HERE]
- We'll respond within 30 days (GDPR requirement)

**For Technical Support:**
- In-app: Help button in top navigation
- Email: [YOUR EMAIL HERE]

---

## Transparency Commitment

We believe in full transparency about data handling:
- ✅ This document will be updated if our practices change
- ✅ You'll be notified of any material changes
- ✅ Privacy Policy and Terms of Service available at all times
- ✅ Open to questions and feedback

---

## Questions We Anticipate

### Q: Can other agents see my buyers or transactions?
**A:** No. Each agent has isolated access to only their own buyers and transactions.

### Q: Can you see my password?
**A:** No. Passwords are hashed (one-way encryption). Even we cannot see them.

### Q: What if I accidentally upload sensitive documents?
**A:** You can delete files anytime. If you need urgent removal, contact us immediately.

### Q: Can buyers see each other's information?
**A:** No. Buyers can only see transactions they're invited to, not other buyers.

### Q: Will you use my data for marketing?
**A:** No. We don't sell data or use it for marketing. Email/SMS alerts are opt-in only.

### Q: What happens to data after the pilot?
**A:** You can export all data and request deletion. We'll anonymize transaction records for legal compliance.

### Q: Is this compliant with UK/EU regulations?
**A:** Yes. We follow GDPR (UK and EU) requirements. Privacy Policy and Terms of Service document our compliance.

### Q: What if Supabase gets hacked?
**A:** Supabase uses AWS infrastructure with enterprise-grade security (SOC 2, ISO 27001). In the unlikely event of a breach, we'd notify you immediately and follow our incident response plan.

---

## Certification Roadmap (Full Launch)

**Current (Pilot):**
- GDPR-compliant data processing
- Industry-standard security practices
- Privacy Policy and Terms of Service

**Planned (Full Launch):**
- Penetration testing by third-party security firm
- Data Protection Impact Assessment (DPIA)
- ISO 27001 consideration (if scaling to enterprise)
- Cyber liability insurance

---

## Feedback Welcome

We're constantly improving our security and privacy practices. If you have:
- Questions not answered here
- Suggestions for improvement
- Concerns about any aspect of data handling

Please reach out to: [YOUR EMAIL HERE]

---

**Thank you for trusting us with your data. We take this responsibility seriously.**

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Next Review:** After pilot completion or every 6 months
**Approved By:** [YOUR NAME/COMPANY]
