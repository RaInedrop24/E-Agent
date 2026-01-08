# Implementation Plan: Sensitive PII Storage & GDPR Compliance

**Feature ID:** 001
**Estimated Duration:** 4-6 weeks (1 developer)
**Last Updated:** 2026-01-08

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Encryption Foundation](#phase-1-encryption-foundation-week-1-2)
3. [Phase 2: GDPR Features](#phase-2-gdpr-features-week-3-4)
4. [Phase 3: UI & Integration](#phase-3-ui--integration-week-5)
5. [Phase 4: Testing & Deployment](#phase-4-testing--deployment-week-6)
6. [Rollback Plan](#rollback-plan)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Before You Begin

- [ ] **Supabase Pro Plan** - Vault feature requires Pro tier ($25/month minimum)
- [ ] **Backup Database** - Full backup before any schema changes
- [ ] **Staging Environment** - Test all changes in staging first
- [ ] **Legal Review** - Consult GDPR attorney for privacy policy updates
- [ ] **Project Kickoff** - Stakeholder approval and timeline commitment

### Required Tools

- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] PostgreSQL client (for testing)
- [ ] OpenSSL (for generating encryption keys)
- [ ] Playwright (already installed for E2E tests)

### Environment Variables

Ensure these are set in `.env.local` (development) and Vercel/production:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://skvfgvlwccxetglmfhpm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # Keep secret!
SUPABASE_PROJECT_REF=skvfgvlwccxetglmfhpm
```

---

## Phase 1: Encryption Foundation (Week 1-2)

### Step 1.1: Enable Supabase Vault Extension

**Duration:** 30 minutes

**File:** `supabase/migrations/20260108_enable_vault.sql`

```sql
-- Enable vault extension for encryption key management
CREATE EXTENSION IF NOT EXISTS supabase_vault CASCADE;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'supabase_vault';
```

**Execute:**
```bash
# Create migration
cd estate-portal
echo "CREATE EXTENSION IF NOT EXISTS supabase_vault CASCADE;" > supabase/migrations/20260108_enable_vault.sql

# Push to Supabase
npx supabase db push
```

**Verify:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_extension WHERE extname = 'supabase_vault';
-- Should return 1 row
```

---

### Step 1.2: Generate and Store Encryption Key

**Duration:** 30 minutes

**Generate Key Locally:**
```bash
# Generate 256-bit random key (64 hex characters)
openssl rand -hex 32

# Example output:
# a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**⚠️ CRITICAL:** Store this key securely! Never commit to git!

**File:** `supabase/migrations/20260108_create_encryption_key.sql`

```sql
-- Create encryption key in Vault
-- IMPORTANT: Replace 'YOUR_GENERATED_KEY_HERE' with actual key from openssl command above
SELECT vault.create_secret(
  'YOUR_GENERATED_KEY_HERE',  -- Replace this!
  'pii_encryption_key',
  'AES-256 encryption key for buyer PII (NI numbers, passport numbers, addresses)'
);

-- Verify key was created
SELECT id, name, description, created_at
FROM vault.secrets
WHERE name = 'pii_encryption_key';
```

**Execute:**
```bash
# Edit the migration file with your actual key
nano supabase/migrations/20260108_create_encryption_key.sql

# Push to Supabase
npx supabase db push

# ⚠️ IMMEDIATELY delete local file with key (it's now in Vault)
rm supabase/migrations/20260108_create_encryption_key.sql

# Or at minimum, remove the key from the file:
sed -i "s/'YOUR_GENERATED_KEY_HERE'/'***REDACTED***'/g" supabase/migrations/20260108_create_encryption_key.sql
```

**Verify:**
```sql
-- Run in Supabase SQL Editor (should return 1 row)
SELECT id, name, description, created_at
FROM vault.secrets
WHERE name = 'pii_encryption_key';

-- ✅ If you see the row, encryption key is ready
```

---

### Step 1.3: Create Encryption/Decryption Functions

**Duration:** 1 hour

**File:** `supabase/migrations/20260108_pii_encryption_functions.sql`

```sql
-- Enable pgcrypto extension for AES encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function: Encrypt sensitive PII
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
  -- Input validation
  IF plaintext IS NULL OR plaintext = '' THEN
    RAISE EXCEPTION 'Cannot encrypt null or empty value';
  END IF;

  -- Retrieve key from Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key';

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault';
  END IF;

  -- Encrypt using AES-256 (pgcrypto)
  encrypted_data := encrypt(
    plaintext::bytea,
    encryption_key,
    'aes'
  );

  RETURN encrypted_data;
END;
$$;

-- Function: Decrypt sensitive PII
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
  -- Input validation
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;

  -- Retrieve key from Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key';

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in Vault';
  END IF;

  -- Decrypt
  decrypted_data := decrypt(
    ciphertext,
    encryption_key,
    'aes'
  );

  RETURN convert_from(decrypted_data, 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Decryption failed: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.encrypt_pii(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_pii(bytea) TO authenticated, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION public.encrypt_pii(text) IS 'Encrypts sensitive PII using AES-256 with key from Supabase Vault';
COMMENT ON FUNCTION public.decrypt_pii(bytea) IS 'Decrypts sensitive PII using AES-256 with key from Supabase Vault';
```

**Execute:**
```bash
npx supabase db push
```

**Test Functions:**
```sql
-- Test encryption
SELECT public.encrypt_pii('AB123456C') AS encrypted_ni_number;
-- Should return bytea like: \x9a3f2b1c...

-- Test decryption (replace with your encrypted value)
SELECT public.decrypt_pii('\x9a3f2b1c...'::bytea) AS decrypted_value;
-- Should return: AB123456C

-- Test round-trip
SELECT public.decrypt_pii(public.encrypt_pii('Test Value')) AS round_trip;
-- Should return: Test Value

-- ✅ If all tests pass, functions are working correctly
```

---

### Step 1.4: Create Database Schema for Identity Documents

**Duration:** 2 hours

**File:** `supabase/migrations/20260108_buyer_identity_documents.sql`

```sql
-- Table: buyer_identity_documents
CREATE TABLE public.buyer_identity_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,

  -- Encrypted PII fields (stored as bytea)
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
  verification_notes text,

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

-- RLS Policy: Buyers can view own documents
CREATE POLICY "buyer_identity_documents_select_own"
  ON public.buyer_identity_documents FOR SELECT
  USING (profile_id = auth.uid());

-- RLS Policy: Agents can view their buyers' documents
CREATE POLICY "buyer_identity_documents_select_agent"
  ON public.buyer_identity_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_agent_associations
      WHERE buyer_id = buyer_identity_documents.profile_id
        AND agent_id = auth.uid()
    )
  );

-- RLS Policy: Super admins can view all documents
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

-- RLS Policy: Agents can update verification status for their buyers
CREATE POLICY "buyer_identity_documents_update_agent"
  ON public.buyer_identity_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_agent_associations
      WHERE buyer_id = buyer_identity_documents.profile_id
        AND agent_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Agents can only update verification fields, not PII
    NEW.profile_id = OLD.profile_id
    AND NEW.national_insurance_encrypted = OLD.national_insurance_encrypted
    AND NEW.passport_number_encrypted = OLD.passport_number_encrypted
  );

-- RLS Policy: Super admins can update all documents
CREATE POLICY "buyer_identity_documents_update_admin"
  ON public.buyer_identity_documents FOR UPDATE
  USING (public.is_super_admin());

-- Indexes
CREATE INDEX idx_buyer_identity_documents_profile_id
  ON public.buyer_identity_documents(profile_id);

CREATE INDEX idx_buyer_identity_documents_verification_status
  ON public.buyer_identity_documents(verification_status);

-- Trigger: Update updated_at timestamp
CREATE TRIGGER set_updated_at_buyer_identity_documents
  BEFORE UPDATE ON public.buyer_identity_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.buyer_identity_documents IS 'Stores encrypted buyer identity documents (NI numbers, passports, addresses)';
COMMENT ON COLUMN public.buyer_identity_documents.national_insurance_encrypted IS 'Encrypted National Insurance number (UK)';
COMMENT ON COLUMN public.buyer_identity_documents.passport_number_encrypted IS 'Encrypted passport number';
```

**Execute:**
```bash
npx supabase db push
```

**Verify:**
```sql
-- Check table exists
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'buyer_identity_documents';

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'buyer_identity_documents';
-- rowsecurity should be true

-- Check policies exist
SELECT policyname
FROM pg_policies
WHERE tablename = 'buyer_identity_documents';
-- Should return 8 policies
```

---

### Step 1.5: Create Audit Logging Tables

**Duration:** 1 hour

**File:** `supabase/migrations/20260108_pii_audit_logging.sql`

```sql
-- Table: pii_access_log
CREATE TABLE public.pii_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id),  -- Whose data was accessed
  accessed_by uuid NOT NULL REFERENCES public.profiles(id), -- Who accessed it
  field_accessed text NOT NULL,  -- e.g., 'national_insurance', 'full_identity'
  access_reason text,  -- e.g., 'User viewed own data', 'Agent verified buyer'
  ip_address inet,
  user_agent text,
  accessed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pii_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view logs of access to their own data
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
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_pii_access_log_profile_id
  ON public.pii_access_log(profile_id);

CREATE INDEX idx_pii_access_log_accessed_by
  ON public.pii_access_log(accessed_by);

CREATE INDEX idx_pii_access_log_accessed_at
  ON public.pii_access_log(accessed_at DESC);

-- Comments
COMMENT ON TABLE public.pii_access_log IS 'Audit log of all accesses to sensitive PII for GDPR compliance';
```

**Execute:**
```bash
npx supabase db push
```

---

### Step 1.6: Create Consent Management Table

**Duration:** 1 hour

**File:** `supabase/migrations/20260108_user_consents.sql`

```sql
-- Table: user_consents
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
  consent_given boolean NOT NULL,  -- true = consented, false = revoked
  consent_version text NOT NULL,  -- e.g., '1.0', '2.1'
  ip_address inet,
  user_agent text,
  consented_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view own consents
CREATE POLICY "user_consents_select"
  ON public.user_consents FOR SELECT
  USING (profile_id = auth.uid() OR public.is_super_admin());

-- RLS Policy: Users can insert own consents
CREATE POLICY "user_consents_insert"
  ON public.user_consents FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR public.is_super_admin());

-- Indexes
CREATE INDEX idx_user_consents_profile_id
  ON public.user_consents(profile_id);

CREATE INDEX idx_user_consents_type
  ON public.user_consents(consent_type);

CREATE INDEX idx_user_consents_given
  ON public.user_consents(consent_given);

-- Helper function: Check if user has current consent
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

GRANT EXECUTE ON FUNCTION public.has_consent(uuid, text, text) TO authenticated, service_role;

-- Comments
COMMENT ON TABLE public.user_consents IS 'Tracks user consent for GDPR compliance';
COMMENT ON FUNCTION public.has_consent(uuid, text, text) IS 'Check if user has given consent for a specific type and version';
```

**Execute:**
```bash
npx supabase db push
```

---

## Phase 2: GDPR Features (Week 3-4)

### Step 2.1: Data Export API (GDPR Article 20)

**Duration:** 1 day

**File:** `src/app/api/profile/export/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Gather all user data
    const exportData: any = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      data: {}
    }

    // 1. Profile data
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    exportData.data.profile = profile

    // 2. Transactions (as participant or creator)
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('*, transaction_participants(*)')
      .or(`created_by.eq.${user.id},transaction_participants.profile_id.eq.${user.id}`)
    exportData.data.transactions = transactions

    // 3. Messages
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('author_profile_id', user.id)
    exportData.data.messages = messages

    // 4. Files uploaded
    const { data: files } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('uploaded_by_profile_id', user.id)
    exportData.data.files = files

    // 5. Identity documents (decrypt if exists)
    const { data: identityDoc } = await supabaseAdmin
      .from('buyer_identity_documents')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (identityDoc) {
      const decryptField = async (ciphertext: any) => {
        if (!ciphertext) return null
        const { data } = await supabaseAdmin.rpc('decrypt_pii', { ciphertext })
        return data
      }

      exportData.data.identity_documents = {
        national_insurance: await decryptField(identityDoc.national_insurance_encrypted),
        passport_number: await decryptField(identityDoc.passport_number_encrypted),
        passport_expiry: await decryptField(identityDoc.passport_expiry_encrypted),
        date_of_birth: await decryptField(identityDoc.date_of_birth_encrypted),
        address: {
          line1: await decryptField(identityDoc.address_line1_encrypted),
          line2: await decryptField(identityDoc.address_line2_encrypted),
          city: await decryptField(identityDoc.city_encrypted),
          postcode: await decryptField(identityDoc.postcode_encrypted),
          country: await decryptField(identityDoc.country_encrypted)
        },
        nationality: await decryptField(identityDoc.nationality_encrypted),
        verification_status: identityDoc.verification_status,
        created_at: identityDoc.created_at
      }
    }

    // 6. Consents
    const { data: consents } = await supabaseAdmin
      .from('user_consents')
      .select('*')
      .eq('profile_id', user.id)
    exportData.data.consents = consents

    // 7. Access logs (who accessed my data)
    const { data: accessLogs } = await supabaseAdmin
      .from('pii_access_log')
      .select('*, accessed_by_profile:profiles!accessed_by(full_name, email)')
      .eq('profile_id', user.id)
    exportData.data.access_logs = accessLogs

    // Log the export
    await supabaseAdmin.from('pii_access_log').insert({
      profile_id: user.id,
      accessed_by: user.id,
      field_accessed: 'full_data_export',
      access_reason: 'User exported all personal data (GDPR Article 20)',
      ip_address: request.headers.get('x-forwarded-for'),
      user_agent: request.headers.get('user-agent')
    })

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="estate-portal-data-export-${user.id}-${Date.now()}.json"`
      }
    })

  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
```

**Test:**
```bash
# As authenticated user
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/profile/export \
  -o data-export.json
```

---

### Step 2.2: Account Deletion Workflow (GDPR Article 17)

**Duration:** 2 days

**File:** `src/app/api/profile/delete/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { confirmDelete } = await request.json()

    if (!confirmDelete) {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 })
    }

    // GDPR allows retaining some data for legal compliance
    // We'll anonymize the user rather than hard delete

    // 1. Delete/anonymize identity documents
    await supabaseAdmin
      .from('buyer_identity_documents')
      .delete()
      .eq('profile_id', user.id)

    // 2. Anonymize profile data
    await supabaseAdmin
      .from('profiles')
      .update({
        full_name: '[DELETED USER]',
        phone_number: null,
        avatar_url: null,
        email_alerts_enabled: false,
        sms_alerts_enabled: false
      })
      .eq('id', user.id)

    // 3. Delete files from storage
    const { data: userFiles } = await supabaseAdmin
      .from('files')
      .select('storage_path')
      .eq('uploaded_by_profile_id', user.id)

    if (userFiles && userFiles.length > 0) {
      const paths = userFiles.map(f => f.storage_path)
      await supabaseAdmin.storage
        .from('transaction-files')
        .remove(paths)
    }

    // 4. Anonymize messages
    await supabaseAdmin
      .from('messages')
      .update({
        content_original: '[Message from deleted user]',
        content_translated: {}
      })
      .eq('author_profile_id', user.id)

    // 5. Record deletion consent
    await supabaseAdmin.from('user_consents').insert({
      profile_id: user.id,
      consent_type: 'privacy_policy',
      consent_given: false,  // User withdrew consent
      consent_version: '1.0',
      ip_address: request.headers.get('x-forwarded-for'),
      user_agent: request.headers.get('user-agent')
    })

    // 6. Log the deletion
    await supabaseAdmin.from('pii_access_log').insert({
      profile_id: user.id,
      accessed_by: user.id,
      field_accessed: 'account_deletion',
      access_reason: 'User requested account deletion (GDPR Article 17)',
      ip_address: request.headers.get('x-forwarded-for'),
      user_agent: request.headers.get('user-agent')
    })

    // 7. Delete auth user (will cascade to anonymized profile)
    await supabaseAdmin.auth.admin.deleteUser(user.id)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })

  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
```

**UI Component:** `src/app/profile/settings/delete-account-button.tsx`

*(Omitted for brevity - create dialog with confirmation checkbox)*

---

## Phase 3: UI & Integration (Week 5)

### Step 3.1: Identity Documents Submission Form

**Duration:** 2 days

**File:** `src/app/profile/identity-documents/page.tsx`

*(See technical-analysis.md for full example - create form with Zod validation)*

### Step 3.2: Identity Documents View (with masking)

**Duration:** 1 day

*(Create view component using MaskedPII component from technical-analysis.md)*

### Step 3.3: Agent Verification Interface

**Duration:** 1 day

*(Create interface for agents to verify buyer documents and update verification_status)*

---

## Phase 4: Testing & Deployment (Week 6)

### Step 4.1: Unit Tests

```typescript
// tests/encryption.test.ts

import { createClient } from '@supabase/supabase-js'

describe('PII Encryption', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  it('should encrypt and decrypt correctly', async () => {
    const plaintext = 'AB123456C'

    const { data: encrypted } = await supabase.rpc('encrypt_pii', { plaintext })
    expect(encrypted).toBeTruthy()

    const { data: decrypted } = await supabase.rpc('decrypt_pii', { ciphertext: encrypted })
    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertext for same input', async () => {
    const { data: encrypted1 } = await supabase.rpc('encrypt_pii', { plaintext: 'test' })
    const { data: encrypted2 } = await supabase.rpc('encrypt_pii', { plaintext: 'test' })

    // Should be different due to IV randomness
    expect(encrypted1).not.toBe(encrypted2)
  })
})
```

### Step 4.2: Integration Tests

*(Test RLS policies, consent flow, audit logging)*

### Step 4.3: E2E Tests (Playwright)

```typescript
// tests/e2e/identity-documents.spec.ts

import { test, expect } from '@playwright/test'

test('buyer can submit identity documents', async ({ page }) => {
  // Login as buyer
  await page.goto('/login')
  await page.fill('[name="email"]', 'buyer@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // Navigate to identity documents
  await page.goto('/profile/identity-documents')

  // Fill form
  await page.fill('[name="ni_number"]', 'AB123456C')
  await page.fill('[name="passport"]', '123456789')
  // ... fill other fields

  // Accept consent
  await page.check('[name="consent"]')

  // Submit
  await page.click('button[type="submit"]')

  // Verify success
  await expect(page.locator('text=Documents submitted successfully')).toBeVisible()
})
```

### Step 4.4: Security Testing

**Penetration Testing Checklist:**
- [ ] SQL injection attempts (should be blocked)
- [ ] XSS attempts (should be blocked by CSP)
- [ ] CSRF attempts
- [ ] Unauthorized access to other users' PII
- [ ] Service role key compromise simulation
- [ ] Encryption key extraction attempts

**Hire External Security Firm (Recommended):**
- Budget: $2,000 - $5,000
- Duration: 1-2 weeks
- Deliverable: Penetration test report

### Step 4.5: Deployment

```bash
# 1. Deploy to staging
git checkout -b feature/001-pii-encryption
git add .
git commit -m "[001] Implement PII encryption and GDPR compliance"
git push origin feature/001-pii-encryption

# 2. Create PR and review
gh pr create --title "[001] PII Encryption & GDPR Compliance" \
  --body "See backlog/features/001-sensitive-pii-storage/README.md"

# 3. After approval, merge to main
gh pr merge

# 4. Deploy to production (Vercel auto-deploys)
# Verify all environment variables are set in Vercel dashboard
```

---

## Rollback Plan

### If Critical Issue Discovered

**Step 1: Disable Feature Flag** (if using feature flags)
```typescript
// In .env
FEATURE_PII_STORAGE_ENABLED=false
```

**Step 2: Revert Migrations** (if database corruption)
```bash
# Identify migration to revert to
npx supabase db reset --db-url "postgresql://..."

# Or manually drop tables
DROP TABLE IF EXISTS public.buyer_identity_documents CASCADE;
DROP TABLE IF EXISTS public.pii_access_log CASCADE;
DROP TABLE IF EXISTS public.user_consents CASCADE;
```

**Step 3: Notify Affected Users**
- Send email explaining issue
- Provide timeline for fix
- Offer data export if requested

---

## Monitoring & Maintenance

### Post-Launch Monitoring

**Week 1-2: Daily Monitoring**
- [ ] Check error logs for encryption failures
- [ ] Review audit logs for suspicious access
- [ ] Monitor API latency (should be <500ms)
- [ ] Check RLS policy effectiveness

**Week 3-4: Weekly Monitoring**
- [ ] Review access patterns
- [ ] Check for data export requests
- [ ] Monitor storage usage (encrypted data is larger)

**Ongoing: Monthly Reviews**
- [ ] Quarterly security audit
- [ ] Review and rotate encryption keys (every 90 days)
- [ ] Update DPAs with vendors
- [ ] Review GDPR compliance

### Key Rotation Procedure

**Every 90 days:**

1. Generate new key: `openssl rand -hex 32`
2. Create new secret in Vault: `pii_encryption_key_v2`
3. Decrypt all data with old key
4. Re-encrypt with new key
5. Update functions to use new key
6. Delete old key

---

## Success Criteria

**Phase 1 Complete:**
- [ ] ✅ Encryption/decryption functions working
- [ ] ✅ All database tables created
- [ ] ✅ RLS policies tested and verified

**Phase 2 Complete:**
- [ ] ✅ Data export API returns all user data
- [ ] ✅ Account deletion anonymizes PII
- [ ] ✅ Consent management tracks all consents

**Phase 3 Complete:**
- [ ] ✅ UI allows PII submission
- [ ] ✅ Data masking works correctly
- [ ] ✅ Agents can verify buyer documents

**Phase 4 Complete:**
- [ ] ✅ All tests passing (unit, integration, E2E)
- [ ] ✅ Security audit completed
- [ ] ✅ Deployed to production
- [ ] ✅ Monitoring dashboard operational

**GDPR Compliance Achieved:**
- [ ] ✅ PII encrypted at rest
- [ ] ✅ Data export feature available (Article 20)
- [ ] ✅ Account deletion implemented (Article 17)
- [ ] ✅ Consent tracking operational (Article 7)
- [ ] ✅ Audit logging captures all access (Article 32)
- [ ] ✅ DPAs signed with all processors (Article 28)

---

**Implementation Plan Created:** 2026-01-08
**Next Review:** After Phase 1 completion or in 2 weeks (whichever comes first)
