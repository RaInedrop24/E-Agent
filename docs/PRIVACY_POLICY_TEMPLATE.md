# Privacy Policy - Estate Agent Portal

**Last Updated:** [DATE]
**Effective Date:** [DATE]

---

## 1. Introduction

[YOUR COMPANY NAME] ("we", "our", "us") operates the Estate Agent Portal (E-Portal) at [YOUR DOMAIN] (the "Service").

This Privacy Policy explains how we collect, use, store, and protect your personal data in compliance with:
- UK General Data Protection Regulation (UK GDPR)
- EU General Data Protection Regulation (EU GDPR)
- Data Protection Act 2018
- Privacy and Electronic Communications Regulations (PECR)

**Data Controller:**
[YOUR COMPANY NAME]
[YOUR ADDRESS]
[YOUR EMAIL]
[YOUR PHONE]

**Data Protection Officer (if applicable):**
[DPO NAME]
[DPO EMAIL]

---

## 2. What Data We Collect

### 2.1 Data You Provide Directly

**When you register as an estate agent:**
- Full name
- Email address
- Preferred language
- Optional: Website URL, agency logo, phone number

**When you create buyer accounts:**
- Buyer's full name
- Buyer's email address
- Buyer's preferred language

**When you use the Service:**
- Transaction details (property address, title, status)
- Messages sent to buyers
- Files uploaded (contracts, property photos, documents)
- Milestone progress updates

### 2.2 Data Collected Automatically

**Authentication Data:**
- Session tokens (stored in browser localStorage)
- Login timestamps
- IP addresses (for audit logging)
- Browser user agent

**Usage Data:**
- Pages visited
- Features used
- Error logs

### 2.3 Data We Do NOT Collect (During Pilot Phase)

- Passport numbers
- National Insurance numbers
- Bank account details
- Credit card information
- Government ID documents
- Sensitive personal data (health, biometric, etc.)

---

## 3. Legal Basis for Processing

We process your personal data under the following legal bases (GDPR Article 6):

### 3.1 Contract Performance (Article 6(1)(b))
To provide the Service and fulfill our contract with you:
- User authentication and account management
- Transaction management
- Messaging between agents and buyers
- File storage and sharing

### 3.2 Legitimate Interests (Article 6(1)(f))
For our legitimate business interests:
- Preventing fraud and abuse
- Improving Service functionality
- Customer support and troubleshooting
- Security monitoring and incident response

### 3.3 Legal Obligation (Article 6(1)(c))
To comply with legal requirements:
- Retaining transaction records (UK property law: 7 years)
- Responding to law enforcement requests
- Tax and accounting obligations

### 3.4 Consent (Article 6(1)(a))
For optional features (you can withdraw consent anytime):
- Email alerts and notifications
- SMS notifications (if enabled)
- Marketing communications (if opted in)

---

## 4. How We Use Your Data

### 4.1 Primary Purposes

**For Estate Agents:**
- Provide access to buyer management features
- Enable transaction creation and tracking
- Facilitate communication with buyers
- Store and share transaction files securely

**For Buyers:**
- Provide access to assigned transactions
- Enable communication with estate agent
- Display transaction progress and milestones
- Access uploaded documents

### 4.2 Secondary Purposes

- Send transactional emails (password reset, account notifications)
- Provide customer support
- Improve Service functionality
- Detect and prevent fraud or abuse
- Comply with legal obligations

### 4.3 Message Translation

If you use the translation feature:
- Message content is sent to DeepL API for translation
- DeepL is a GDPR-compliant EU company
- Original and translated messages are stored in our database

---

## 5. Data Sharing and Third Parties

We share your data only with trusted third-party processors:

### 5.1 Essential Service Providers

| Provider | Purpose | Data Shared | Location | Safeguards |
|----------|---------|-------------|----------|-----------|
| **Supabase** | Database, authentication, file storage | All data | AWS (EU/US) | SOC 2, ISO 27001, DPA signed |
| **DeepL** | Message translation | Message content | EU | ISO 27001, GDPR-compliant, DPA signed |
| **Twilio** | SMS notifications | Phone numbers (if enabled) | US | SOC 2, ISO 27001, DPA signed |
| **Resend** | Transactional emails | Email addresses | EU/US | GDPR-compliant, DPA signed |
| **Google Gemini AI** | Website color extraction | Website URLs (agents only) | US | GDPR-compliant, DPA signed |

**Data Processing Agreements (DPAs):**
We have signed DPAs with all third-party processors to ensure GDPR compliance.

### 5.2 Legal Requirements

We may disclose your data if required by:
- Court orders or legal process
- Law enforcement requests
- Protection of our legal rights
- Emergency situations (to prevent harm)

### 5.3 Business Transfers

If we're acquired or merged, your data may be transferred to the new owner. We'll notify you and ensure the new owner complies with this Privacy Policy.

---

## 6. Data Retention

### How Long We Keep Your Data

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| User accounts (active) | Until you request deletion | Contract performance |
| Transaction records | 7 years after completion | UK property law compliance |
| Messages | 7 years after transaction completion | Legal compliance |
| Files | 7 years after transaction completion | Legal compliance |
| Audit logs | 2 years | Security and compliance |
| Email/SMS consent records | 3 years after consent withdrawn | Evidence of consent |

### Anonymization

After retention periods expire:
- Personal identifiers are removed (name, email)
- Data is anonymized for statistical analysis
- Anonymous data may be retained indefinitely

---

## 7. Your Rights (GDPR)

You have the following rights under UK/EU GDPR:

### 7.1 Right to Access (Article 15)
Request a copy of all personal data we hold about you.
**How:** Email [YOUR EMAIL] or use "Export Data" feature
**Response Time:** Within 30 days (free of charge)

### 7.2 Right to Rectification (Article 16)
Correct inaccurate or incomplete personal data.
**How:** Update in Settings or email [YOUR EMAIL]
**Response Time:** Within 30 days

### 7.3 Right to Erasure (Article 17)
Request deletion of your personal data ("right to be forgotten").
**How:** Email [YOUR EMAIL] or use "Delete Account" feature
**Response Time:** Within 30 days
**Note:** We may retain anonymized transaction records for legal compliance

### 7.4 Right to Restrict Processing (Article 18)
Request temporary suspension of data processing.
**How:** Email [YOUR EMAIL]

### 7.5 Right to Data Portability (Article 20)
Receive your data in machine-readable format (JSON).
**How:** Email [YOUR EMAIL] or use "Export Data" feature

### 7.6 Right to Object (Article 21)
Object to processing based on legitimate interests or for marketing.
**How:** Unsubscribe from emails or email [YOUR EMAIL]

### 7.7 Right to Withdraw Consent
Withdraw consent for optional features (email/SMS alerts).
**How:** Disable in Settings or unsubscribe from emails

### 7.8 Right to Lodge a Complaint
Complain to a supervisory authority if you believe we've mishandled your data.
**UK:** Information Commissioner's Office (ICO) - https://ico.org.uk
**Ireland:** Data Protection Commission (DPC) - https://dataprotection.ie
**Other EU countries:** Your local data protection authority

**To Exercise Your Rights:**
Email: [YOUR EMAIL]
Response Time: Within 30 days (GDPR requirement)
No charge (unless request is excessive or unfounded)

---

## 8. Data Security

### 8.1 Technical Measures

- **Encryption in Transit:** HTTPS/TLS 1.3 for all connections
- **Encryption at Rest:** AES-256 encryption on Supabase servers
- **Password Security:** bcrypt hashing (never stored in plaintext)
- **Access Controls:** Role-based permissions and Row Level Security
- **Authentication:** OAuth 2.0 with PKCE flow
- **File Security:** Transaction-scoped storage with time-limited access links

### 8.2 Organizational Measures

- Regular security audits
- Employee training on data protection
- Incident response plan
- Limited access to personal data (need-to-know basis)
- Audit logging of admin actions

### 8.3 Data Breach Notification

In the event of a data breach:
- We'll notify affected users within 24 hours
- We'll notify the ICO/DPC within 72 hours (GDPR requirement)
- We'll provide clear information about the breach and steps to protect yourself

---

## 9. Cookies and Tracking

### 9.1 Essential Cookies (No Consent Required)

**Authentication Token:**
- Name: `sb-skvfgvlwccxetglmfhpm-auth-token` (localStorage)
- Purpose: Maintain login session
- Duration: 1 hour (auto-refresh)
- Legal Basis: Strictly necessary for Service functionality (GDPR Article 6(1)(b))

### 9.2 No Tracking Cookies

We do NOT use:
- Google Analytics or similar analytics cookies
- Facebook Pixel or social media tracking
- Advertising cookies
- Third-party marketing cookies

### 9.3 Managing Cookies

You can clear your browser's localStorage to remove the authentication token, but this will log you out.

**More Information:** See our [Cookie Policy]

---

## 10. International Data Transfers

### 10.1 Data Location

Your data is primarily stored in:
- Supabase servers (AWS) - EU region preferred
- DeepL servers - EU only

### 10.2 Transfers Outside EU/UK

Some processors (Twilio, Google) may process data in the US. We ensure adequate safeguards:
- **Standard Contractual Clauses (SCCs)** approved by EU Commission
- **Data Processing Agreements (DPAs)** with all processors
- **Privacy Shield alternative mechanisms** (post-Schrems II)

---

## 11. Children's Privacy

The Service is NOT intended for children under 16. We do not knowingly collect data from children. If you believe we've collected data from a child, contact us immediately and we'll delete it.

---

## 12. Changes to This Privacy Policy

We may update this Privacy Policy to reflect:
- Changes in our practices
- Legal or regulatory requirements
- New features or services

**Notification:**
- Material changes will be notified via email
- Updated policy will be posted at [YOUR DOMAIN]/privacy
- "Last Updated" date will be changed

**Your Consent:**
Continued use of the Service after changes constitutes acceptance of the updated policy.

---

## 13. Contact Us

**For privacy questions or data requests:**
Email: [YOUR EMAIL]
Address: [YOUR ADDRESS]
Phone: [YOUR PHONE]

**Data Protection Officer (if applicable):**
[DPO NAME]
Email: [DPO EMAIL]

**Supervisory Authority:**
If you're not satisfied with our response, you can contact:
- **UK:** Information Commissioner's Office (ICO) - https://ico.org.uk / 0303 123 1113
- **Ireland:** Data Protection Commission (DPC) - https://dataprotection.ie / +353 57 868 4800

---

## 14. Specific Provisions

### 14.1 For Estate Agents

- You control buyer accounts you create
- You're responsible for informing buyers about data processing
- You can access buyers' transaction data only while they're assigned to you
- You must not share buyer data outside the Service without consent

### 14.2 For Buyers

- Your estate agent created your account and can access your transaction data
- You can view all transactions you're invited to
- You can request account deletion at any time (subject to legal retention)
- You can download your data in JSON format

---

**This Privacy Policy complies with UK GDPR, EU GDPR, and Data Protection Act 2018.**

**Document Version:** 1.0
**Last Updated:** [DATE]
**Next Review:** [DATE + 12 months]

---

**[YOUR COMPANY NAME]**
[YOUR ADDRESS]
[YOUR EMAIL]
[YOUR PHONE]
Company Registration: [YOUR COMPANY NUMBER] (if applicable)
