# Feature 001: Sensitive PII Storage & GDPR Compliance

**Status:** Proposed
**Priority:** P0 (Critical)
**Effort:** XL (4-6 weeks)
**Tags:** `security`, `compliance`, `database`, `gdpr`
**Created:** 2026-01-08
**Owner:** Unassigned

---

## Summary

Enable buyers to securely store highly sensitive personal information (National Insurance numbers, passport numbers, addresses) with application-level encryption, full GDPR compliance features, and comprehensive audit logging. This is required before piloting the Estate Agent Portal in the European Union.

---

## User Story

**As a** buyer in the EU
**I want to** securely store my sensitive identity documents (NI number, passport, address)
**So that** I can complete property transactions while being confident my data is protected and GDPR-compliant

**As an** estate agent
**I want to** access verified buyer identity information when needed
**So that** I can complete KYC (Know Your Customer) requirements for property transactions

**As a** data protection officer / compliance team
**I want to** provide users with data export and deletion capabilities
**So that** we comply with GDPR Articles 17 (Right to Erasure) and 20 (Data Portability)

---

## Business Context

### Why This Feature is P0 (Critical)

1. **Legal Requirement:** GDPR compliance is mandatory for EU operations. Storing unencrypted PII could result in fines up to €20M or 4% of annual revenue.

2. **Trust & Safety:** Estate agent industry requires high trust. Data breach would be catastrophic for reputation.

3. **Competitive Advantage:** Proper security and compliance is a differentiator in the proptech space.

4. **Blocking Other Features:** Cannot launch buyer verification, ID upload, or KYC features without this foundation.

### Current State

- ✅ Strong authentication (Supabase Auth with PKCE)
- ✅ Row Level Security (RLS) policies
- ✅ Role-based access control
- ✅ HTTPS encryption in transit
- ❌ **NO application-level encryption** (PII stored in plaintext)
- ❌ **NO GDPR data export feature** (Article 20 violation)
- ❌ **NO account deletion workflow** (Article 17 violation)
- ❌ **NO consent management system**
- ❌ **NO PII access audit logging**

### Risk Assessment

**If we launch without this feature:**
- High risk of GDPR fines (€10-20M)
- Data breach would expose unencrypted PII
- Users cannot exercise their GDPR rights
- No audit trail for compliance investigations
- Reputational damage from security incidents

**Mitigation:** Implement this feature before any PII collection

---

## Acceptance Criteria

### Must Have (P0)

- [ ] **Encryption:**
  - [ ] Supabase Vault configured with encryption keys
  - [ ] All sensitive PII fields encrypted at rest (NI number, passport, address)
  - [ ] Encryption uses AES-256 or stronger
  - [ ] Encryption keys stored securely (not in .env files)

- [ ] **Database Schema:**
  - [ ] `buyer_identity_documents` table created with encrypted fields
  - [ ] RLS policies restrict access to document owner + assigned agent + super admin
  - [ ] Separate from `profiles` table for security isolation

- [ ] **Consent Management:**
  - [ ] `user_consents` table tracks all consent events
  - [ ] Privacy policy version tracking
  - [ ] Users must consent before PII submission
  - [ ] Consent recorded with timestamp and version

- [ ] **GDPR Data Export (Article 20):**
  - [ ] API endpoint to export all user data in JSON format
  - [ ] Includes: profile, transactions, messages, files, consents, audit logs
  - [ ] Delivered as downloadable JSON file
  - [ ] Audit logged

- [ ] **GDPR Right to Erasure (Article 17):**
  - [ ] Account deletion workflow with 30-day cooling-off period
  - [ ] Anonymizes PII while retaining transaction records
  - [ ] Cascading deletion of related data
  - [ ] Audit logged

- [ ] **Audit Logging:**
  - [ ] `pii_access_log` table created
  - [ ] Every access to sensitive PII logged (who, when, what, why)
  - [ ] Logs retained for 2 years minimum
  - [ ] Super admin can view audit logs

- [ ] **UI Components:**
  - [ ] Identity documents submission form
  - [ ] Consent checkbox with privacy policy link
  - [ ] Data masking (show last 4 digits only)
  - [ ] MFA prompt before viewing full sensitive data

### Should Have (P1)

- [ ] **Enhanced Security:**
  - [ ] Multi-factor authentication for viewing PII
  - [ ] Time-limited access (auto-lock after transaction completes)
  - [ ] IP address logging for audit trail

- [ ] **Data Processing Agreements:**
  - [ ] DPA signed with DeepL (translation service)
  - [ ] DPA signed with Twilio (SMS notifications)
  - [ ] DPA signed with Resend (email service)
  - [ ] DPA signed with Google (Generative AI)

- [ ] **Documentation:**
  - [ ] Updated privacy policy
  - [ ] User-facing security documentation
  - [ ] Developer security guidelines
  - [ ] Incident response plan

### Nice to Have (P2)

- [ ] **Privacy Dashboard:**
  - [ ] Users can view their own access history
  - [ ] Users can revoke consent for specific data types
  - [ ] Users can download encrypted backup

- [ ] **Advanced Features:**
  - [ ] Document verification (passport OCR)
  - [ ] Automated expiry warnings (passport expiration)
  - [ ] Integration with identity verification services

---

## Dependencies

**None** - This is a foundational feature

**Blocks:**
- Feature: Buyer ID verification workflow
- Feature: KYC compliance reporting
- Feature: Automated background checks
- Feature: Credit check integration

---

## Security Considerations

### Threat Model

1. **Database Breach:** Attacker gains read access to database
   - **Mitigation:** Application-level encryption makes data unreadable

2. **Insider Threat:** Rogue employee accesses PII
   - **Mitigation:** RLS policies + audit logging + MFA

3. **Service Role Key Compromise:** Attacker steals service role key
   - **Mitigation:** Encryption keys stored separately in Vault

4. **Third-Party Data Breach:** Supabase breach
   - **Mitigation:** Encrypted at application level, Supabase can't read

5. **Man-in-the-Middle:** Attacker intercepts data in transit
   - **Mitigation:** HTTPS (already implemented)

### Compliance Requirements

- **GDPR (EU):** Mandatory
- **UK GDPR:** Mandatory (post-Brexit UK operations)
- **Data Protection Act 2018 (UK):** Mandatory
- **ISO 27001:** Recommended (information security standard)
- **SOC 2 Type II:** Recommended (for enterprise customers)

---

## Success Metrics

### Security Metrics
- Zero PII data breaches
- 100% of sensitive fields encrypted
- 100% of PII access events logged

### Compliance Metrics
- 100% of data export requests fulfilled within 30 days (GDPR requirement)
- 100% of deletion requests fulfilled within 30 days
- 100% consent tracking coverage
- Zero GDPR complaints or fines

### User Trust Metrics
- User confidence survey score > 4.5/5 on data security
- < 1% user drop-off during identity submission flow
- > 80% of agents report confidence in security

---

## Rollout Plan

### Phase 1: Foundation (Week 1-2)
- Set up Supabase Vault
- Create database schema
- Implement encryption/decryption functions
- Deploy to staging

### Phase 2: GDPR Features (Week 3-4)
- Build data export API
- Build account deletion workflow
- Implement consent management
- Deploy to staging

### Phase 3: UI & Testing (Week 5)
- Build identity documents submission form
- Implement data masking
- E2E testing
- Security testing

### Phase 4: Compliance & Launch (Week 6)
- Legal review of privacy policy
- Sign DPAs with third parties
- Penetration testing
- Deploy to production (Beta)

### Phase 5: Monitoring (Ongoing)
- Monitor audit logs
- Review access patterns
- Quarterly security audits

---

## Documentation

- [Technical Analysis](technical-analysis.md) - Detailed findings from codebase review
- [Implementation Plan](implementation-plan.md) - Step-by-step implementation guide
- Related: Privacy Policy (TBD)
- Related: Security Documentation (TBD)

---

## Notes

- **Legal Review Required:** Consult with GDPR compliance attorney before launch
- **Penetration Testing Required:** Engage third-party security firm
- **Insurance:** Ensure cyber liability insurance covers this use case
- **Data Retention:** Define retention periods for each data type
- **Training:** Train agents on proper handling of sensitive data

---

## Questions & Decisions

### Open Questions
- [ ] What is the data retention period for identity documents?
- [ ] Do we need to verify passport/NI numbers with government APIs?
- [ ] Should we support document upload (scanned passports) or just text entry?
- [ ] What happens to identity data when buyer account is deleted?

### Decisions Made
- **2026-01-08:** Use Supabase Vault for encryption key management (vs. custom solution)
- **2026-01-08:** Separate `buyer_identity_documents` table (vs. storing in `profiles`)
- **2026-01-08:** Implement data export as JSON (vs. CSV or PDF)

---

## Related Features

- Future: Document upload and OCR
- Future: Identity verification (e.g., Onfido, Jumio integration)
- Future: Credit check integration
- Future: Anti-money laundering (AML) checks

---

**Last Updated:** 2026-01-08
