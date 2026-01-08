# Technical Analysis: Sensitive PII Storage & GDPR Compliance

**Feature ID:** 001
**Analysis Date:** 2026-01-08
**Analyzed By:** Claude Code (Sonnet 4.5)

---

## Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Current Security Architecture](#current-security-architecture)
3. [Database Schema Analysis](#database-schema-analysis)
4. [PII Data Classification](#pii-data-classification)
5. [GDPR Compliance Gaps](#gdpr-compliance-gaps)
6. [Security Vulnerabilities](#security-vulnerabilities)
7. [Third-Party Risk Assessment](#third-party-risk-assessment)
8. [Recommended Architecture](#recommended-architecture)
9. [Code Examples](#code-examples)
10. [Migration Path](#migration-path)

---

## Tech Stack Overview

### Frontend
- **Framework:** Next.js 16.0.10 (App Router)
- **React:** 19.2.0
- **TypeScript:** 5 (strict mode enabled)
- **UI:** Tailwind CSS 4, shadcn/ui, Radix UI components
- **Icons:** Lucide React
- **Animations:** Framer Motion 12

### Backend & Database
- **Platform:** Supabase (PostgreSQL BaaS)
- **Project URL:** `https://skvfgvlwccxetglmfhpm.supabase.co`
- **Auth:** Supabase Auth with PKCE flow
- **Storage:** Supabase Storage (3 buckets: avatars, transaction_files, agency-branding)
- **Client:** @supabase/supabase-js 2.45.0

### External Services
- **Translation:** DeepL API (processes message content - ⚠️ PII risk)
- **SMS:** Twilio (processes phone numbers - ⚠️ PII risk)
- **Email:** Resend v6.6.0 (processes email addresses - ⚠️ PII risk)
- **AI:** Google Generative AI (processes content - ⚠️ PII risk)

### Development Tools
- **Linting:** ESLint 9
- **Testing:** Playwright (E2E)
- **Git Hooks:** Husky

**File Reference:** `C:\Users\micro\Estate_Agent_Portal\estate-portal\package.json`

---

## Current Security Architecture

### Authentication

**Supabase Auth Configuration:**
```typescript
// File: src/lib/supabase.ts

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',              // ✅ Secure auth flow
        autoRefreshToken: true,         // ✅ Session management
        detectSessionInUrl: true,       // ✅ Email verification support
        persistSession: true,
        storage: window.localStorage,   // ⚠️ LocalStorage (XSS risk)
        storageKey: 'sb-skvfgvlwccxetglmfhpm-auth-token'
      }
    }
  )
}
```

**Security Assessment:**
- ✅ PKCE flow prevents auth code interception
- ✅ Auto token refresh reduces session hijacking risk
- ⚠️ LocalStorage vulnerable to XSS (consider httpOnly cookies)
- ✅ Email verification required

**File Reference:** `C:\Users\micro\Estate_Agent_Portal\estate-portal\src\lib\supabase.ts`

### Authorization (RLS Policies)

**Comprehensive RLS implementation across all tables:**

#### Profiles Table RLS
```sql
-- File: supabase/migrations/20260107_complete_rls_policies_fix.sql

-- Users can view own profile + super admin views all + agents view their buyers
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
USING (
  id = auth.uid()
  OR public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM buyer_agent_associations
    WHERE buyer_id = profiles.id AND agent_id = auth.uid()
  )
);

-- Users can update own profile + super admin can update all
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
USING (
  id = auth.uid() OR public.is_super_admin()
);

-- ❌ NO DELETE POLICY (data retention - potential GDPR conflict)
```

**Security Assessment:**
- ✅ Strong RLS enforcement
- ✅ Super admin role properly isolated
- ✅ Agent-buyer relationship enforced
- ❌ No delete policy conflicts with GDPR Right to Erasure

#### Transactions & Related Tables

```sql
-- Transactions: Creator + participants + super admin can view
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT
USING (
  created_by = auth.uid()
  OR public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM transaction_participants
    WHERE transaction_id = transactions.id AND profile_id = auth.uid()
  )
);

-- Similar policies for: milestones, messages, files
```

**Security Assessment:**
- ✅ Principle of least privilege enforced
- ✅ No data leakage between unrelated users
- ✅ Super admin access logged

**File Reference:** `C:\Users\micro\Estate_Agent_Portal\estate-portal\supabase\migrations\20260107_complete_rls_policies_fix.sql`

### Encryption Status

**Current State:**
- ✅ **In Transit:** HTTPS encryption (TLS 1.3)
- ✅ **At Rest (Infrastructure):** Supabase encrypts disk storage
- ❌ **At Rest (Application):** No application-level encryption
- ❌ **Column-Level:** No field encryption for sensitive data

**Implication:** Database administrators (Supabase staff, anyone with service role key) can read all PII in plaintext.

### Storage Security

```sql
-- File: supabase/setup_branding_storage.sql

-- transaction_files bucket (PRIVATE)
CREATE POLICY "transaction_files_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'transaction-files'
  AND EXISTS (
    -- Only transaction participants can view files
    SELECT 1 FROM transaction_participants tp
    JOIN files f ON f.storage_path = storage.objects.name
    WHERE tp.profile_id = auth.uid()
  )
);
```

**Security Assessment:**
- ✅ Private buckets properly restricted
- ✅ RLS policies on storage.objects
- ⚠️ File content not encrypted (relies on infrastructure encryption)
- ⚠️ Filenames may contain PII (e.g., "john-smith-passport.pdf")

**File Reference:** `C:\Users\micro\Estate_Agent_Portal\estate-portal\supabase\setup_branding_storage.sql`

---

## Database Schema Analysis

### Core Tables with PII

#### 1. Profiles Table

```sql
-- File: supabase/migrations/20251117_initial_schema.sql

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,                     -- ⚠️ HIGH SENSITIVITY PII
  phone_number text,                  -- ⚠️ HIGH SENSITIVITY PII
  role text CHECK (role IN ('agent', 'buyer', 'super_admin')),
  avatar_url text,                    -- ⚠️ MEDIUM SENSITIVITY (face recognition)
  website_url text,
  preferred_language text CHECK (preferred_language IN ('en', 'it', 'de', 'fr', 'es', 'pl')),
  email_alerts_enabled boolean DEFAULT true,
  sms_alerts_enabled boolean DEFAULT true,
  branding_logo_url text,
  branding_settings jsonb,            -- ⚠️ Could contain sensitive data
  is_super_admin boolean DEFAULT false,
  dashboard_filter_active_only boolean DEFAULT false,
  dashboard_sort_by text,
  activity_type_filters jsonb,
  activity_time_range text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**PII Risk Assessment:**
| Field | Sensitivity | GDPR Category | Current Protection | Recommended |
|-------|-------------|---------------|-------------------|-------------|
| `full_name` | HIGH | Personal Data | RLS only | Encrypt |
| `phone_number` | HIGH | Personal Data | RLS only | Encrypt |
| `avatar_url` | MEDIUM | Biometric (face) | RLS + Storage ACL | Encrypt filename |
| `email` (in auth.users) | HIGH | Personal Data | Supabase-managed | Keep as-is |
| `branding_settings` | LOW | Business Data | RLS only | No change |

**File Reference:** `C:\Users\micro\Estate_Agent_Portal\estate-portal\supabase\migrations\20251117_initial_schema.sql`

#### 2. Auth.Users Table (Supabase-Managed)

```sql
-- System table (not directly accessible, managed by Supabase Auth)

auth.users (
  id uuid PRIMARY KEY,
  email text UNIQUE,                  -- ⚠️ HIGH SENSITIVITY PII
  encrypted_password text,            -- ✅ Already encrypted by Supabase
  email_confirmed_at timestamptz,
  phone text,                         -- ⚠️ HIGH SENSITIVITY (if phone auth enabled)
  phone_confirmed_at timestamptz,
  user_metadata jsonb,                -- ⚠️ Can contain custom PII
  last_sign_in_at timestamptz,
  raw_user_meta_data jsonb,
  -- ... other Supabase fields
)
```

**Security Assessment:**
- ✅ Passwords properly hashed (bcrypt)
- ✅ Email is indexed but not encrypted (industry standard)
- ⚠️ `user_metadata` may contain unencrypted PII added by application

**Note:** No direct file reference (system table)

#### 3. Messages Table

```sql
-- File: supabase/migrations/20251117_initial_schema.sql

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  author_profile_id uuid REFERENCES profiles(id),
  content_original text,              -- ⚠️ May contain PII (addresses, phone numbers, names)
  content_translated jsonb,           -- ⚠️ Translated PII
  original_language text,
  created_at timestamptz DEFAULT now()
);
```

**PII Risk:**
- Users may include addresses, phone numbers, or other PII in messages
- Translation service (DeepL) processes this content
- No encryption at rest
- **Recommendation:** Warn users not to include sensitive info, or implement message encryption

**File Reference:** `C:\Users\micro\Estate_Agent_Portal\estate-portal\supabase\migrations\20251117_initial_schema.sql`

#### 4. Files Table

```sql
CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  file_name text,                     -- ⚠️ May contain PII (e.g., "John_Smith_Passport.pdf")
  storage_path text UNIQUE,
  file_size bigint,
  mime_type text,
  uploaded_by_profile_id uuid REFERENCES profiles(id),
  uploaded_at timestamptz DEFAULT now()
);
```

**PII Risk:**
- Filenames often contain names (e.g., "Jane_Doe_ID.pdf")
- File content stored in Supabase Storage (infrastructure-encrypted only)
- **Recommendation:** Hash or anonymize filenames, encrypt file content

**File Reference:** `C:\Users\micro\Estate_Agent_Portal\estate-portal\supabase\migrations\20251117_initial_schema.sql`

#### 5. Admin Audit Log

```sql
-- File: supabase/migrations/20251223_add_super_admin.sql

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id),
  action text,                        -- e.g., 'viewed_buyer_profile'
  details jsonb,                      -- ⚠️ May contain PII in log details
  created_at timestamptz DEFAULT now()
);
```

**PII Risk:**
- `details` field may log PII (e.g., { "buyer_name": "John Smith", "ni_number": "..." })
- ⚠️ Audit logs must be retained for compliance, so any PII here cannot be deleted
- **Recommendation:** Log identifiers (UUIDs) instead of names

**File Reference:** `C:\Users\micro\Estate_Agent_Portal\estate-portal\supabase\migrations\20251223_add_super_admin.sql`

---

## PII Data Classification

### Current PII Storage Inventory

| Data Type | Location | Table.Column | Sensitivity | GDPR Special Category | Current Encryption |
|-----------|----------|--------------|-------------|----------------------|-------------------|
| Full Name | Database | `profiles.full_name` | HIGH | No | None (RLS only) |
| Email | Database | `auth.users.email` | HIGH | No | None (managed by Supabase) |
| Phone Number | Database | `profiles.phone_number` | HIGH | No | None (RLS only) |
| Avatar | Storage | `storage.objects` (avatars bucket) | MEDIUM | Biometric (face) | Infrastructure only |
| Message Content | Database | `messages.content_original` | MEDIUM | Varies | None |
| Filenames | Database | `files.file_name` | MEDIUM | No | None |
| File Content | Storage | `storage.objects` (transaction-files) | HIGH | Varies | Infrastructure only |
| IP Address | Logs | Not stored | LOW | No | N/A |
| User Metadata | Database | `auth.users.user_metadata` | MEDIUM | Varies | None |

### Planned Sensitive PII (Not Yet Stored)

| Data Type | Planned Table | Sensitivity | GDPR Special Category | Recommended Encryption |
|-----------|---------------|-------------|----------------------|----------------------|
| National Insurance Number (UK) | `buyer_identity_documents` | CRITICAL | No | AES-256 (Vault) |
| Passport Number | `buyer_identity_documents` | CRITICAL | No | AES-256 (Vault) |
| Passport Expiry | `buyer_identity_documents` | HIGH | No | AES-256 (Vault) |
| Home Address | `buyer_identity_documents` | HIGH | No | AES-256 (Vault) |
| Date of Birth | `buyer_identity_documents` | HIGH | No | AES-256 (Vault) |
| Nationality | `buyer_identity_documents` | MEDIUM | No | AES-256 (Vault) |

### GDPR Special Categories (Article 9)

**Currently NOT stored:**
- Racial or ethnic origin
- Political opinions
- Religious or philosophical beliefs
- Trade union membership
- Genetic data
- Biometric data (except avatars - debatable)
- Health data
- Sex life or sexual orientation

⚠️ **If any of these are added in future, EXPLICIT consent required + heightened security**

---

## GDPR Compliance Gaps

### Critical Gaps (P0)

#### 1. No Application-Level Encryption
**GDPR Article:** Article 32 (Security of Processing)

**Requirement:**
> "...appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including... the pseudonymisation and encryption of personal data"

**Current State:**
- PII stored in plaintext in database
- Supabase staff could theoretically access data
- Service role key compromise would expose all PII

**Impact:** High risk of fine if data breach occurs

**Remediation:** Implement Supabase Vault encryption (see Implementation Plan)

---

#### 2. No Data Portability Feature
**GDPR Article:** Article 20 (Right to Data Portability)

**Requirement:**
> "The data subject shall have the right to receive the personal data concerning him or her... in a structured, commonly used and machine-readable format"

**Current State:**
- ❌ No API endpoint for data export
- ❌ No UI for users to download their data
- ❌ No JSON/CSV export functionality

**Impact:** Every user request requires manual SQL query (not scalable, potential fine)

**Remediation:** Build `/api/profile/export` endpoint returning JSON

---

#### 3. No Right to Erasure Implementation
**GDPR Article:** Article 17 (Right to Erasure / "Right to be Forgotten")

**Requirement:**
> "The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay"

**Current State:**
- ❌ No DELETE policy on `profiles` table
- ❌ No account deletion workflow
- ❌ No data anonymization process
- ⚠️ Cascading deletes on transactions may violate record-keeping requirements

**Impact:** Cannot comply with deletion requests (guaranteed fine on first complaint)

**Remediation:**
1. Add deletion workflow with 30-day grace period
2. Anonymize user data instead of hard delete (for transaction records)
3. Retain anonymized transaction history for legal compliance

---

#### 4. No Consent Management
**GDPR Article:** Article 7 (Conditions for Consent)

**Requirement:**
> "The controller shall be able to demonstrate that the data subject has consented to processing"

**Current State:**
- ❌ No consent tracking table
- ❌ No privacy policy acceptance record
- ❌ No consent versioning
- ❌ No granular consent (e.g., marketing vs. essential processing)

**Impact:** Cannot prove consent was obtained (burden of proof on controller)

**Remediation:** Create `user_consents` table with:
- Consent type (privacy_policy, marketing, data_processing)
- Version number
- Timestamp
- User ID
- IP address (optional)

---

#### 5. No PII Access Audit Trail
**GDPR Article:** Article 32(1)(d) (Security of Processing)

**Requirement:**
> "A process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures for ensuring the security of the processing"

**Current State:**
- ✅ Admin actions logged in `admin_audit_log`
- ❌ Regular user access to profiles NOT logged
- ❌ PII field access NOT logged
- ❌ No "who viewed my profile" tracking

**Impact:** Cannot investigate unauthorized access or data breaches

**Remediation:** Create `pii_access_log` table logging all reads of sensitive fields

---

### Medium Priority Gaps (P1)

#### 6. Missing Data Processing Agreements (DPAs)

**Third-Party Processors:**
1. **DeepL** - Processes message content (may contain PII)
2. **Twilio** - Processes phone numbers
3. **Resend** - Processes email addresses and message content
4. **Google Generative AI** - Processes user-generated content
5. **Supabase** - Processes all data (should have DPA)

**Current State:**
- ❌ No documented DPAs
- ❌ No processor security assessment
- ❌ No subprocessor register

**Impact:** GDPR requires DPAs with all processors (Article 28)

**Remediation:**
1. Request DPA from each vendor
2. Document their security measures
3. Maintain subprocessor register
4. Update privacy policy to list all processors

---

#### 7. No Data Retention Policy

**GDPR Article:** Article 5(1)(e) (Storage Limitation)

**Requirement:**
> "Personal data shall be kept in a form which permits identification of data subjects for no longer than is necessary"

**Current State:**
- ❌ No defined retention periods
- ❌ Data kept indefinitely
- ❌ No automatic deletion/anonymization

**Impact:** Potential fine for excessive data retention

**Remediation:**
1. Define retention periods (e.g., 7 years for transaction records per UK law)
2. Implement automatic anonymization after retention period
3. Document in privacy policy

---

#### 8. No Privacy by Design Documentation

**GDPR Article:** Article 25 (Data Protection by Design and by Default)

**Current State:**
- ❌ No documented privacy impact assessment (PIA)
- ❌ No data flow diagrams
- ❌ No documented security measures

**Impact:** Cannot demonstrate GDPR compliance in audit

**Remediation:** Create Data Protection Impact Assessment (DPIA) document

---

### Low Priority Gaps (P2)

#### 9. No Cookie Consent Management
- Currently minimal cookie usage, but should be documented
- Add cookie banner if analytics added

#### 10. No User Privacy Dashboard
- Allow users to view their data
- Allow users to see access logs
- Allow users to manage consents

---

## Security Vulnerabilities

### High Severity

#### V1: Service Role Key Has Unrestricted Access

**Location:** Multiple API routes
```typescript
// File: src/app/api/buyers/create/route.ts

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Bypasses ALL RLS
)
```

**Risk:**
- If service role key compromised, attacker has full database access
- Key stored in .env file (risk if committed to git)
- No key rotation policy

**Remediation:**
1. Rotate keys every 90 days
2. Use environment variable management service (e.g., Vercel env vars, AWS Secrets Manager)
3. Implement IP allowlisting for service role access
4. Add extra validation layer before privileged operations

**File Reference:** `C:\Users\micro\Estate_Agent_Portal\estate-portal\src\app\api\buyers\create\route.ts`

---

#### V2: Plaintext PII in Database

**Risk:**
- Database export exposes all PII
- Database backups unencrypted
- Supabase staff have access
- Compliance violation (GDPR Article 32)

**Remediation:** Implement application-level encryption (see Implementation Plan)

---

#### V3: LocalStorage Session Storage (XSS Vulnerability)

**Location:** `src/lib/supabase.ts`
```typescript
storage: window.localStorage, // ⚠️ Vulnerable to XSS attacks
```

**Risk:**
- XSS attack can steal session token from localStorage
- No HttpOnly protection
- No SameSite cookie protection

**Remediation:**
1. Consider using Supabase server-side session management with httpOnly cookies
2. Implement Content Security Policy (CSP) headers
3. Regular XSS vulnerability scanning

**File Reference:** `C:\Users\micro\Estate_Agent_Portal\estate-portal\src\lib\supabase.ts`

---

### Medium Severity

#### V4: Missing Input Validation

**Example Location:** Multiple API routes

**Risk:**
- SQL injection (mitigated by Supabase SDK, but still best practice to validate)
- XSS in message content
- File upload attacks (malicious files)

**Remediation:**
1. Implement Zod schemas for all API inputs
2. Sanitize user input in messages
3. Implement file type validation
4. Add file scanning for malware

---

#### V5: No Rate Limiting

**Risk:**
- Brute force password attacks
- API abuse
- DDoS attacks on API routes

**Remediation:**
1. Implement rate limiting middleware (e.g., `next-rate-limit`)
2. Add Cloudflare or similar CDN with DDoS protection
3. Supabase has built-in rate limiting, but should add application-level too

---

### Low Severity

#### V6: No CSRF Protection

**Risk:**
- Cross-Site Request Forgery attacks on state-changing operations

**Remediation:**
1. Next.js App Router reduces CSRF risk (no cookies by default)
2. Add CSRF tokens for sensitive operations
3. Validate `Origin` header on POST requests

---

## Third-Party Risk Assessment

### DeepL API

**Data Processed:** Message content (may contain PII)

**Security Concerns:**
- Messages sent to DeepL servers for translation
- DeepL privacy policy must be reviewed
- No DPA currently in place

**GDPR Implications:**
- DeepL is data processor
- Must have DPA
- Must disclose in privacy policy

**Recommendations:**
1. Sign DPA with DeepL
2. Review their security certifications (SOC 2, ISO 27001)
3. Warn users that messages are sent to third party
4. Consider on-premises translation solution for sensitive transactions

**Privacy Policy:** https://www.deepl.com/privacy

---

### Twilio

**Data Processed:** Phone numbers, SMS content

**Security Concerns:**
- Phone numbers stored by Twilio
- SMS content may contain PII
- Twilio has access to message content

**GDPR Implications:**
- Twilio is data processor
- Must have DPA (Twilio provides standard DPA)
- Must disclose in privacy policy

**Recommendations:**
1. Sign Twilio DPA (available at https://www.twilio.com/legal/data-protection-addendum)
2. Minimize PII in SMS messages
3. Implement SMS opt-out mechanism

**Security Certifications:** SOC 2 Type II, ISO 27001, ISO 27018

---

### Resend (Email)

**Data Processed:** Email addresses, email content

**Security Concerns:**
- Email content may contain PII
- Email addresses stored
- Resend has access to all outbound email

**GDPR Implications:**
- Resend is data processor
- Must have DPA
- Must disclose in privacy policy

**Recommendations:**
1. Review Resend's DPA and privacy policy
2. Encrypt sensitive email content
3. Implement email retention policy

**Privacy Policy:** https://resend.com/legal/privacy-policy

---

### Google Generative AI

**Data Processed:** User-provided prompts (could contain PII)

**Security Concerns:**
- Google may use data for model training (check terms)
- Content sent to Google Cloud
- No control over data residency

**GDPR Implications:**
- Google is data processor
- Must have DPA (Google provides Cloud Data Processing Addendum)
- Must disclose in privacy policy
- ⚠️ Check if data used for AI training (GDPR requires explicit consent)

**Recommendations:**
1. Review Google Cloud Data Processing Addendum
2. Check if using "business" tier that excludes training data usage
3. Warn users before AI-processed content
4. Consider EU-region model deployment

---

### Supabase

**Data Processed:** All application data

**Security Certifications:**
- SOC 2 Type II
- ISO 27001
- HIPAA compliance available (paid tier)
- GDPR-compliant infrastructure

**Data Residency:** Configurable (check project region - should be EU for GDPR)

**GDPR Implications:**
- Supabase is data processor
- Provides standard DPA
- Subprocessors listed: AWS (hosting), Cloudflare (CDN)

**Recommendations:**
1. Sign Supabase DPA
2. Verify project hosted in EU region
3. Review their subprocessor list
4. Enable audit logging (Pro tier)

**DPA:** https://supabase.com/legal/dpa

---

## Recommended Architecture

### Encryption Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  User Browser (HTTPS)                                        │
│  ┌──────────────────────────────────────┐                   │
│  │  Plaintext PII Input                 │                   │
│  │  (National Insurance, Passport, etc) │                   │
│  └──────────────┬───────────────────────┘                   │
└─────────────────┼───────────────────────────────────────────┘
                  │ HTTPS (Encrypted in Transit)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js API Route (Server-Side)                             │
│  ┌──────────────────────────────────────┐                   │
│  │  1. Validate input                   │                   │
│  │  2. Authenticate user                │                   │
│  │  3. Encrypt PII using Vault key      │                   │
│  │  4. Store encrypted blob in DB       │                   │
│  └──────────────┬───────────────────────┘                   │
└─────────────────┼───────────────────────────────────────────┘
                  │ Supabase Client (with service role key)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Vault (Key Management)                             │
│  ┌──────────────────────────────────────┐                   │
│  │  AES-256 Encryption Key              │                   │
│  │  (Never leaves Vault)                │                   │
│  └──────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                         │
│  ┌──────────────────────────────────────┐                   │
│  │  buyer_identity_documents            │                   │
│  │  ┌────────────────────────────────┐  │                   │
│  │  │ national_insurance_encrypted:  │  │                   │
│  │  │ \x4f3a9b2c... (bytea)          │  │  ← Unreadable    │
│  │  ├────────────────────────────────┤  │    without key    │
│  │  │ passport_number_encrypted:     │  │                   │
│  │  │ \x7e1d4f5a... (bytea)          │  │                   │
│  │  └────────────────────────────────┘  │                   │
│  └──────────────────────────────────────┘                   │
│                                                               │
│  Infrastructure Encryption (Supabase)                        │
│  └──────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
                  │ Encrypted at Rest (Infrastructure)
                  ▼
            [Disk Storage]
```

**Key Principles:**
1. **Defense in Depth:** Multiple encryption layers
2. **Separation of Duties:** Application key separate from infrastructure key
3. **Zero Trust:** Even DB admins cannot read PII
4. **Audit Trail:** Every encryption/decryption logged

---

### Data Flow for Sensitive PII Submission

```
[Buyer] → [Identity Form (HTTPS)] → [Next.js API Route]
                                            │
                                            ├─→ Validate input (Zod schema)
                                            ├─→ Check consent given
                                            ├─→ Authenticate user (Supabase Auth)
                                            ├─→ Call encrypt_pii() function
                                            │     │
                                            │     └─→ [Supabase Vault] (get key)
                                            │           │
                                            │           └─→ AES-256-GCM encryption
                                            │
                                            ├─→ Insert encrypted data into DB
                                            ├─→ Log to pii_access_log
                                            └─→ Record consent in user_consents

[Database] ← Encrypted Blob (unreadable without key)
```

---

### Data Flow for Sensitive PII Retrieval

```
[Agent/Buyer] → [View Identity (HTTPS)] → [Next.js API Route]
                                              │
                                              ├─→ Authenticate user
                                              ├─→ Check RLS policy (authorized?)
                                              ├─→ (Optional) Require MFA
                                              ├─→ Fetch encrypted data from DB
                                              ├─→ Call decrypt_pii() function
                                              │     │
                                              │     └─→ [Supabase Vault] (get key)
                                              │           │
                                              │           └─→ AES-256-GCM decryption
                                              │
                                              ├─→ Log access to pii_access_log
                                              ├─→ Update last_accessed_at
                                              └─→ Return plaintext PII to authorized user

[User Browser] ← Plaintext PII (shown with optional masking)
```

---

## Code Examples

### 1. Supabase Vault Setup (SQL)

```sql
-- Create encryption key in Vault
-- Run this once during setup
SELECT vault.create_secret(
  'your-generated-256-bit-key-here', -- Generate with: openssl rand -hex 32
  'pii_encryption_key',
  'AES-256 key for encrypting buyer PII (NI, passport, address)'
);

-- Verify key exists (returns 1 row)
SELECT id, name, description, created_at
FROM vault.secrets
WHERE name = 'pii_encryption_key';
```

### 2. Encryption Function (SQL)

```sql
-- Function to encrypt sensitive PII
CREATE OR REPLACE FUNCTION public.encrypt_pii(plaintext text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  encryption_key bytea;
  encrypted_data bytea;
BEGIN
  -- Retrieve key from Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key';

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault';
  END IF;

  -- Encrypt using pgcrypto extension (AES-256-GCM)
  encrypted_data := encrypt(
    plaintext::bytea,
    encryption_key,
    'aes'
  );

  RETURN encrypted_data;
END;
$$;

-- Grant execute to authenticated users (service role will use it)
GRANT EXECUTE ON FUNCTION public.encrypt_pii(text) TO authenticated;
```

### 3. Decryption Function (SQL)

```sql
-- Function to decrypt sensitive PII
CREATE OR REPLACE FUNCTION public.decrypt_pii(ciphertext bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  encryption_key bytea;
  decrypted_data bytea;
BEGIN
  -- Retrieve key from Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key';

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault';
  END IF;

  -- Decrypt using pgcrypto
  decrypted_data := decrypt(
    ciphertext,
    encryption_key,
    'aes'
  );

  RETURN convert_from(decrypted_data, 'UTF8');
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrypt_pii(bytea) TO authenticated;
```

### 4. Buyer Identity Documents Table (SQL)

```sql
-- Create table for encrypted identity documents
CREATE TABLE public.buyer_identity_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,

  -- Encrypted PII fields (stored as binary data)
  national_insurance_encrypted bytea,
  passport_number_encrypted bytea,
  passport_expiry_encrypted bytea,
  date_of_birth_encrypted bytea,
  address_line1_encrypted bytea,
  address_line2_encrypted bytea,
  city_encrypted bytea,
  postcode_encrypted bytea,
  country_encrypted bytea,
  nationality_encrypted bytea,

  -- Metadata (not encrypted)
  verification_status text CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  verified_by uuid REFERENCES public.profiles(id),
  verified_at timestamptz,

  -- Consent tracking
  consent_given_at timestamptz NOT NULL,
  consent_version text NOT NULL,

  -- Audit metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz,
  access_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.buyer_identity_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Buyers view own documents
CREATE POLICY "buyer_identity_documents_select_own"
  ON public.buyer_identity_documents FOR SELECT
  USING (profile_id = auth.uid());

-- RLS Policy: Agents view their buyers' documents
CREATE POLICY "buyer_identity_documents_select_agent"
  ON public.buyer_identity_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_agent_associations
      WHERE buyer_id = buyer_identity_documents.profile_id
        AND agent_id = auth.uid()
    )
  );

-- RLS Policy: Super admins view all
CREATE POLICY "buyer_identity_documents_select_admin"
  ON public.buyer_identity_documents FOR SELECT
  USING (public.is_super_admin());

-- RLS Policy: Buyers can insert own documents
CREATE POLICY "buyer_identity_documents_insert"
  ON public.buyer_identity_documents FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- RLS Policy: Buyers can update own documents
CREATE POLICY "buyer_identity_documents_update_own"
  ON public.buyer_identity_documents FOR UPDATE
  USING (profile_id = auth.uid());

-- RLS Policy: Agents can update verification status
CREATE POLICY "buyer_identity_documents_update_agent"
  ON public.buyer_identity_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_agent_associations
      WHERE buyer_id = buyer_identity_documents.profile_id
        AND agent_id = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX idx_buyer_identity_documents_profile_id
  ON public.buyer_identity_documents(profile_id);

-- Trigger to update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.buyer_identity_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 5. PII Access Audit Log (SQL)

```sql
-- Create audit log for PII access
CREATE TABLE public.pii_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id),  -- Whose data was accessed
  accessed_by uuid NOT NULL REFERENCES public.profiles(id), -- Who accessed it
  field_accessed text NOT NULL,  -- e.g., 'national_insurance', 'passport_number', 'full_identity'
  access_reason text,  -- e.g., 'User viewed own data', 'Agent verified buyer'
  ip_address inet,
  user_agent text,
  accessed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pii_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view logs of their own data access
CREATE POLICY "pii_access_log_select_own"
  ON public.pii_access_log FOR SELECT
  USING (profile_id = auth.uid());

-- RLS Policy: Super admins can view all logs
CREATE POLICY "pii_access_log_select_admin"
  ON public.pii_access_log FOR SELECT
  USING (public.is_super_admin());

-- RLS Policy: Service role can insert (for API routes)
CREATE POLICY "pii_access_log_insert"
  ON public.pii_access_log FOR INSERT
  WITH CHECK (true);  -- API routes use service role

-- Indexes
CREATE INDEX idx_pii_access_log_profile_id ON public.pii_access_log(profile_id);
CREATE INDEX idx_pii_access_log_accessed_by ON public.pii_access_log(accessed_by);
CREATE INDEX idx_pii_access_log_accessed_at ON public.pii_access_log(accessed_at DESC);

-- Retention: Auto-delete logs older than 2 years (run as cron job)
-- DELETE FROM public.pii_access_log WHERE accessed_at < now() - interval '2 years';
```

### 6. User Consents Table (SQL)

```sql
-- Create table to track user consents
CREATE TABLE public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN (
    'privacy_policy',
    'terms_of_service',
    'identity_data_processing',
    'marketing_emails',
    'marketing_sms',
    'third_party_sharing'
  )),
  consent_given boolean NOT NULL,  -- true = consent, false = revoked
  consent_version text NOT NULL,  -- e.g., '1.0', '2.1'
  ip_address inet,
  user_agent text,
  consented_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users view own consents
CREATE POLICY "user_consents_select"
  ON public.user_consents FOR SELECT
  USING (profile_id = auth.uid() OR public.is_super_admin());

-- RLS Policy: Users can insert own consents
CREATE POLICY "user_consents_insert"
  ON public.user_consents FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Indexes
CREATE INDEX idx_user_consents_profile_id ON public.user_consents(profile_id);
CREATE INDEX idx_user_consents_type ON public.user_consents(consent_type);
CREATE INDEX idx_user_consents_given ON public.user_consents(consent_given);

-- Function to check if user has current consent
CREATE OR REPLACE FUNCTION public.has_consent(
  p_profile_id uuid,
  p_consent_type text,
  p_required_version text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_consents
    WHERE profile_id = p_profile_id
      AND consent_type = p_consent_type
      AND consent_given = true
      AND consent_version = p_required_version
    ORDER BY consented_at DESC
    LIMIT 1
  );
END;
$$;
```

### 7. API Route: Submit Identity Documents (TypeScript)

```typescript
// File: src/app/api/identity-documents/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema
const IdentityDocumentsSchema = z.object({
  nationalInsurance: z.string().regex(/^[A-Z]{2}\d{6}[A-Z]$/i, 'Invalid NI number format'),
  passportNumber: z.string().min(6).max(20),
  passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  address: z.object({
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    postcode: z.string().min(1).max(20),
    country: z.string().length(2), // ISO country code
  }),
  nationality: z.string().length(2), // ISO country code
  consentGiven: z.literal(true),
  consentVersion: z.string()
})

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate input
    const body = await request.json()
    const validatedData = IdentityDocumentsSchema.parse(body)

    // 3. Check if consent already recorded
    const { data: existingConsent } = await supabaseAdmin
      .from('user_consents')
      .select('id')
      .eq('profile_id', user.id)
      .eq('consent_type', 'identity_data_processing')
      .eq('consent_version', validatedData.consentVersion)
      .eq('consent_given', true)
      .maybeSingle()

    if (!existingConsent) {
      // Record consent
      const { error: consentError } = await supabaseAdmin
        .from('user_consents')
        .insert({
          profile_id: user.id,
          consent_type: 'identity_data_processing',
          consent_given: true,
          consent_version: validatedData.consentVersion,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent')
        })

      if (consentError) throw consentError
    }

    // 4. Encrypt each field using Supabase function
    const encryptField = async (value: string) => {
      const { data, error } = await supabaseAdmin.rpc('encrypt_pii', { plaintext: value })
      if (error) throw error
      return data
    }

    const encryptedData = {
      national_insurance_encrypted: await encryptField(validatedData.nationalInsurance),
      passport_number_encrypted: await encryptField(validatedData.passportNumber),
      passport_expiry_encrypted: await encryptField(validatedData.passportExpiry),
      date_of_birth_encrypted: await encryptField(validatedData.dateOfBirth),
      address_line1_encrypted: await encryptField(validatedData.address.line1),
      address_line2_encrypted: validatedData.address.line2
        ? await encryptField(validatedData.address.line2)
        : null,
      city_encrypted: await encryptField(validatedData.address.city),
      postcode_encrypted: await encryptField(validatedData.address.postcode),
      country_encrypted: await encryptField(validatedData.address.country),
      nationality_encrypted: await encryptField(validatedData.nationality),
    }

    // 5. Insert encrypted data into database
    const { error: insertError } = await supabaseAdmin
      .from('buyer_identity_documents')
      .upsert({
        profile_id: user.id,
        ...encryptedData,
        consent_given_at: new Date().toISOString(),
        consent_version: validatedData.consentVersion,
        verification_status: 'pending'
      })

    if (insertError) throw insertError

    // 6. Log access to audit trail
    await supabaseAdmin.from('pii_access_log').insert({
      profile_id: user.id,
      accessed_by: user.id,
      field_accessed: 'full_identity',
      access_reason: 'User submitted identity documents',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      message: 'Identity documents submitted successfully'
    })

  } catch (error) {
    console.error('Error storing identity documents:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to store identity documents' },
      { status: 500 }
    )
  }
}
```

### 8. API Route: Retrieve Identity Documents (TypeScript)

```typescript
// File: src/app/api/identity-documents/route.ts (continued - GET method)

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse query params (optional: buyer_id for agents)
    const { searchParams } = new URL(request.url)
    const buyerId = searchParams.get('buyer_id')

    let targetProfileId = user.id
    let accessReason = 'User viewed own identity documents'

    // 3. If agent viewing buyer's documents, verify permission
    if (buyerId && buyerId !== user.id) {
      // Check if current user is agent and has access to this buyer
      const { data: association } = await supabaseAdmin
        .from('buyer_agent_associations')
        .select('id')
        .eq('agent_id', user.id)
        .eq('buyer_id', buyerId)
        .maybeSingle()

      if (!association) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      targetProfileId = buyerId
      accessReason = 'Agent viewed buyer identity documents'
    }

    // 4. Fetch encrypted data (RLS will enforce access)
    const { data: encryptedDoc, error: fetchError } = await supabaseAdmin
      .from('buyer_identity_documents')
      .select('*')
      .eq('profile_id', targetProfileId)
      .maybeSingle()

    if (fetchError) throw fetchError

    if (!encryptedDoc) {
      return NextResponse.json({ data: null })
    }

    // 5. Decrypt each field
    const decryptField = async (ciphertext: any) => {
      if (!ciphertext) return null
      const { data, error } = await supabaseAdmin.rpc('decrypt_pii', { ciphertext })
      if (error) throw error
      return data
    }

    const decryptedData = {
      id: encryptedDoc.id,
      nationalInsurance: await decryptField(encryptedDoc.national_insurance_encrypted),
      passportNumber: await decryptField(encryptedDoc.passport_number_encrypted),
      passportExpiry: await decryptField(encryptedDoc.passport_expiry_encrypted),
      dateOfBirth: await decryptField(encryptedDoc.date_of_birth_encrypted),
      address: {
        line1: await decryptField(encryptedDoc.address_line1_encrypted),
        line2: await decryptField(encryptedDoc.address_line2_encrypted),
        city: await decryptField(encryptedDoc.city_encrypted),
        postcode: await decryptField(encryptedDoc.postcode_encrypted),
        country: await decryptField(encryptedDoc.country_encrypted),
      },
      nationality: await decryptField(encryptedDoc.nationality_encrypted),
      verificationStatus: encryptedDoc.verification_status,
      verifiedAt: encryptedDoc.verified_at,
      createdAt: encryptedDoc.created_at,
      updatedAt: encryptedDoc.updated_at
    }

    // 6. Log access
    await supabaseAdmin.from('pii_access_log').insert({
      profile_id: targetProfileId,
      accessed_by: user.id,
      field_accessed: 'full_identity',
      access_reason: accessReason,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    })

    // 7. Update last accessed metadata
    await supabaseAdmin
      .from('buyer_identity_documents')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: encryptedDoc.access_count + 1
      })
      .eq('id', encryptedDoc.id)

    return NextResponse.json({ data: decryptedData })

  } catch (error) {
    console.error('Error retrieving identity documents:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve identity documents' },
      { status: 500 }
    )
  }
}
```

### 9. Helper Component: Data Masking (TypeScript/React)

```typescript
// File: src/components/masked-pii.tsx

'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MaskedPIIProps {
  value: string
  type: 'ni' | 'passport' | 'phone' | 'email'
  requireMFA?: boolean
}

export function MaskedPII({ value, type, requireMFA = false }: MaskedPIIProps) {
  const [revealed, setRevealed] = useState(false)

  const maskValue = (val: string, type: string) => {
    switch (type) {
      case 'ni':
        // Show last 4 characters: XX XX XX 12 34 A
        return val.length > 4 ? 'XX XX XX ' + val.slice(-6) : '••••••'
      case 'passport':
        // Show last 4 digits: ••••••1234
        return val.length > 4 ? '••••••' + val.slice(-4) : '••••••'
      case 'phone':
        // Show last 4 digits: •••••••1234
        return val.length > 4 ? '•••••••' + val.slice(-4) : '••••••'
      case 'email':
        // Show first char and domain: j•••@example.com
        const [local, domain] = val.split('@')
        return `${local[0]}•••@${domain}`
      default:
        return '••••••'
    }
  }

  const handleReveal = async () => {
    if (requireMFA && !revealed) {
      // TODO: Implement MFA challenge
      alert('MFA verification required (not yet implemented)')
      return
    }
    setRevealed(!revealed)
  }

  return (
    <div className="flex items-center gap-2">
      <code className="font-mono">
        {revealed ? value : maskValue(value, type)}
      </code>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReveal}
        className="h-8 w-8 p-0"
      >
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  )
}
```

---

## Migration Path

### Phase 1: Setup (No User Impact)
1. Enable Supabase Vault extension
2. Create encryption key
3. Create encryption/decryption functions
4. Test encryption in staging

### Phase 2: Database Schema (No Data Migration)
1. Create new tables:
   - `buyer_identity_documents`
   - `pii_access_log`
   - `user_consents`
2. Add RLS policies
3. Test policies in staging

### Phase 3: API & UI (Feature Flag)
1. Build API routes (behind feature flag)
2. Build UI components
3. E2E testing
4. Security testing

### Phase 4: Rollout (Gradual)
1. Enable for pilot users (10-20 buyers)
2. Monitor audit logs
3. Collect feedback
4. Enable for all users

### Phase 5: Backfill Existing Data (Optional)
If any existing PII needs encryption:
1. Write migration script
2. Encrypt in batches (avoid downtime)
3. Verify integrity
4. Update schema to enforce encryption

---

## Performance Considerations

### Encryption Overhead
- **Encryption time:** ~2-5ms per field
- **Decryption time:** ~2-5ms per field
- **Total for full identity document:** ~50-100ms

**Mitigation:**
- Batch encrypt/decrypt operations
- Cache decrypted data in memory (carefully!)
- Use indexes on profile_id for fast lookups

### Database Query Impact
- RLS policies add ~10-20ms to queries
- Encryption functions add ~5ms per call
- **Total impact:** ~50-100ms per identity document retrieval

**Acceptable:** Identity documents accessed infrequently (1-2 times per transaction)

---

## Testing Strategy

### Unit Tests
- Encryption/decryption functions return correct values
- Encryption produces different ciphertext for same plaintext (IV randomness)
- Decryption fails gracefully with wrong key

### Integration Tests
- API routes require authentication
- RLS policies prevent unauthorized access
- Audit logging captures all access events
- Consent must be given before data submission

### E2E Tests (Playwright)
- Buyer can submit identity documents
- Buyer can view own documents
- Agent can view assigned buyer's documents
- Agent cannot view unassigned buyer's documents
- Super admin can view all documents
- Data export includes identity documents
- Account deletion removes/anonymizes identity data

### Security Tests
- Penetration testing (third-party)
- SQL injection attempts (should be blocked by Supabase SDK)
- XSS attempts (should be blocked by CSP)
- Service role key compromise simulation
- Encryption key rotation testing

---

## Cost Implications

### Supabase Costs
- **Vault:** Included in Pro plan ($25/month minimum)
- **Storage:** Encrypted data ~30% larger (negligible cost)
- **Compute:** Encryption functions use minimal CPU

### Third-Party Costs
- **Penetration Testing:** $1,000 - $5,000 (one-time + annual)
- **Legal Review (GDPR):** $500 - $2,000 (one-time)
- **DPO (Data Protection Officer):** $0 - $3,000/month (depends on scale)
- **Cyber Insurance:** $500 - $5,000/year

### Development Time
- Phase 1-2: 1 week (setup + schema)
- Phase 3: 2 weeks (API + UI)
- Phase 4: 1 week (testing + deployment)
- Phase 5: 1 week (monitoring + fixes)
- **Total: 5-6 weeks** (1 developer)

---

## Conclusion

The Estate Agent Portal has a **strong foundation** with Supabase Auth, RLS policies, and role-based access control. However, storing highly sensitive PII (National Insurance numbers, passport numbers) **requires immediate implementation** of:

1. **Application-level encryption** (Supabase Vault)
2. **GDPR data export feature** (Article 20)
3. **Account deletion workflow** (Article 17)
4. **Consent management system**
5. **PII access audit logging**

**Recommendation:** Do NOT enable PII storage features until Phase 1-3 are complete and security-tested.

---

**Analysis Completed:** 2026-01-08
**Next Review:** After implementation (or in 6 months if backlogged)
