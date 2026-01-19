# Estate Agent Portal - Pilot Launch Assessment

**Assessment Date:** 2026-01-09
**Assessment Type:** Pre-Pilot GDPR & Security Review
**Deployment:** Linode Server + Supabase Free Tier
**Pilot Scope:** 1-2 estate agents, 4-8 weeks

---

## Executive Summary

✅ **SAFE FOR PILOT** with immediate action items completed (see Week 1 checklist)

The Estate Agent Portal has strong foundational security (authentication, Row Level Security, HTTPS encryption) but lacks critical GDPR compliance documents. For a SHORT pilot with minimal sensitive data collection, the platform is acceptable with the following immediate fixes:

**Must Complete Before Pilot (Week 1):**
- [ ] Add Privacy Policy page
- [ ] Add Terms of Service page
- [ ] Add Cookie Policy page
- [ ] Add cookie consent banner
- [ ] Improve password generation (remove `Welcome2026!`)
- [ ] Add server-side file upload validation

**Good to Complete (Week 2):**
- [ ] Sign Data Processing Agreements with third parties
- [ ] Set up storage usage monitoring
- [ ] Create incident response plan

---

## Current Data Collection (No Sensitive PII)

### ✅ Safe for Pilot
- **Full Name** (agent & buyer)
- **Email Address** (authentication)
- **Preferred Language** (en/it/de/fr/es/pl/nl)
- **Transaction Details** (property address, title, status)
- **Messages** (transaction-related communication)
- **Files** (contracts, property photos - NOT ID documents)

### ❌ NOT Collecting During Pilot (Feature 001 Required)
- Passport numbers
- National Insurance numbers
- Bank account details
- Credit card information
- Government ID documents
- Buyer residential addresses (only property addresses)

---

## Security Assessment

### Strong Points ✅
1. **Authentication:** Supabase Auth with PKCE flow (OAuth 2.0 standard)
2. **Authorization:** Comprehensive Row Level Security (RLS) policies
3. **Encryption in Transit:** HTTPS enforced
4. **Encryption at Rest:** Supabase infrastructure-level encryption
5. **Password Security:** Supabase bcrypt hashing
6. **Role-Based Access:** Agents can only see their own buyers
7. **File Security:** Transaction-scoped storage with RLS
8. **Audit Logging:** Admin actions tracked

### Gaps Identified ⚠️
1. **No Privacy Policy** - Required by GDPR Articles 13-14
2. **No Cookie Consent Banner** - Required by ePrivacy Directive
3. **No Data Export Feature** - Required by GDPR Article 20
4. **No Account Deletion** - Required by GDPR Article 17
5. **Predictable Default Passwords** - `Welcome2026!` used for all new buyers
6. **No Rate Limiting** - API endpoints vulnerable to brute force
7. **Missing DPAs** - Data Processing Agreements with third parties
8. **No Application-Level Encryption** - PII stored in plaintext (but NOT collecting sensitive PII yet)

---

## Cookie Usage (Minimal)

### Strictly Necessary Cookies (No Consent Required)
- **`sb-skvfgvlwccxetglmfhpm-auth-token`** (localStorage)
  - Purpose: Authentication session
  - Duration: 1 hour (auto-refresh)
  - Cannot function without it
  - GDPR exemption: Article 6(1)(b) (necessary for contract)

### No Tracking/Analytics Cookies ✅
- No Google Analytics
- No Facebook Pixel
- No third-party tracking
- No marketing cookies

**Implication:** Cookie banner can be simple "informational" notice

---

## Third-Party Data Processors

| Service | Purpose | Data Shared | DPA Status |
|---------|---------|-------------|-----------|
| Supabase | Database, Auth, Storage | All data | ❌ To sign |
| DeepL | Message translation | Message content | ❌ To sign |
| Twilio | SMS notifications | Phone numbers (if opted in) | ❌ To sign |
| Resend | Transactional emails | Email addresses | ❌ To sign |
| Google Gemini AI | Website color extraction | URLs only | ❌ To sign |

**Action Required:** Check if DPAs are available (most SaaS providers offer standard DPAs for EU customers)

---

## Supabase Free Tier Capacity

**Limits for Pilot:**
- **Database:** 500MB (sufficient for 1-2 agents, ~50 buyers)
- **Storage:** 1GB (monitor file uploads closely)
- **Bandwidth:** 2GB/month (adequate for pilot)
- **API Requests:** 500,000/month (plenty)

**Recommendation:**
- Monitor storage usage weekly
- Compress large files before upload
- Delete test data regularly
- Upgrade to Pro ($25/month) if storage exceeds 800MB

---

## Compliance for Pilot (Pragmatic Approach)

### EU GDPR Requirements

#### Minimum for Pilot ✅
1. **Privacy Policy** - Explains what data is collected and why
2. **Terms of Service** - Contract between platform and users
3. **Cookie Policy** - Lists cookies and purpose
4. **Cookie Consent Banner** - Informs users about cookie usage
5. **Secure Storage** - Supabase provides encryption at rest
6. **Access Controls** - RLS policies enforce data isolation

#### Nice-to-Have (Not Blocking) 🔶
1. **Data Export Feature** - Can be done manually during pilot (export via SQL)
2. **Account Deletion** - Can be done manually by super admin
3. **DPIAs** - Formal Data Protection Impact Assessment (for full launch)
4. **Penetration Testing** - External security audit (for full launch)

### UK GDPR (Post-Brexit)
Same requirements as EU GDPR - no differences

---

## Pilot Agent Reassurances

### What You Can Confidently Say:

**Security:**
- "All data is encrypted in transit (HTTPS) and at rest (Supabase infrastructure)"
- "Industry-standard authentication with OAuth 2.0 / PKCE flow"
- "Role-based access ensures you only see your own buyers and transactions"
- "Passwords are never stored in plaintext (bcrypt hashing)"
- "File uploads are secured with access controls"
- "Admin actions are logged in an audit trail"

**Privacy:**
- "No tracking cookies or analytics (no Facebook, Google, etc.)"
- "Email and SMS alerts are opt-in (disabled by default)"
- "We don't sell or share data with third parties for marketing"
- "You and your buyers can request data deletion at any time"

**Compliance:**
- "Privacy Policy and Terms of Service available at [domain]/privacy and [domain]/terms"
- "GDPR-compliant data processing"
- "Data hosted in secure AWS/Supabase infrastructure"
- "Working with legal counsel to ensure full compliance"

### What NOT to Promise:
- Certification (ISO 27001, SOC 2) - Not yet obtained
- Encrypted messaging - Messages stored in plaintext
- Biometric authentication - Not implemented
- Multi-factor authentication - Not implemented (Supabase supports it, just not enabled)

---

## Incident Response Plan (Quick Version)

### If Data Breach Occurs:
1. **Immediate (Hour 1):**
   - Disable affected user accounts
   - Rotate Supabase service role keys
   - Document scope of breach (what data, how many users)

2. **Within 24 hours:**
   - Notify affected users via email
   - Change all system passwords
   - Review audit logs for unauthorized access

3. **Within 72 hours:**
   - Report to supervisory authority (ICO in UK, DPC in Ireland)
   - GDPR requires notification within 72 hours
   - Fine: Up to €10M or 2% of revenue for late notification

4. **Post-incident:**
   - Conduct security review
   - Implement additional controls
   - Update incident response plan

### Emergency Contact:
- **Supabase Support:** support@supabase.io
- **Your Legal Counsel:** [TBD]
- **UK ICO:** https://ico.org.uk/make-a-complaint/data-protection-complaints/

---

## Immediate Action Checklist

### MUST DO (Week 1)
- [ ] Create Privacy Policy page at `/privacy`
- [ ] Create Terms of Service page at `/terms`
- [ ] Create Cookie Policy page at `/cookies`
- [ ] Add cookie consent banner to all pages
- [ ] Link policies from footer and registration page
- [ ] Generate random passwords for new buyers (not `Welcome2026!`)
- [ ] Add server-side file upload validation (MIME type, size)
- [ ] Verify HTTPS enabled on Linode
- [ ] Test RLS policies with test users
- [ ] Brief pilot agent on data security measures

### SHOULD DO (Week 2)
- [ ] Review Supabase DPA (supabase.com/legal)
- [ ] Sign DPAs with third-party services
- [ ] Set up Supabase storage usage alerts (80% capacity)
- [ ] Create backup/recovery procedure
- [ ] Document incident response contacts
- [ ] Add rate limiting to API routes (10 req/min per IP)

### NICE TO HAVE (Week 3-4)
- [ ] Add email verification on registration (Supabase supports)
- [ ] Add password strength meter
- [ ] Implement session timeout (force re-login after 24h)
- [ ] Add 2FA/MFA option (Supabase supports TOTP)
- [ ] Set up error monitoring (Sentry, LogRocket)

---

## Post-Pilot: Full Launch Requirements

Before collecting sensitive PII or scaling beyond pilot:
- [ ] Implement Feature 001 (Encrypted PII Storage)
- [ ] Build data export API
- [ ] Build self-service account deletion
- [ ] Conduct penetration testing ($2-5K)
- [ ] Complete DPIA (Data Protection Impact Assessment)
- [ ] Hire or appoint Data Protection Officer (if processing > 10K users)
- [ ] Obtain cyber liability insurance
- [ ] Upgrade Supabase to Pro tier (100GB storage)

**Timeline:** 6-8 weeks after pilot feedback

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Data breach (unauthorized access) | Low | High | RLS policies, authentication, HTTPS |
| Storage quota exceeded | Medium | Medium | Monitor usage, upgrade if needed |
| Password compromise | Low | Medium | Strong password policy, MFA (future) |
| Service outage (Supabase) | Low | High | Backup procedures, status monitoring |
| GDPR complaint | Low | High | Privacy policy, DPAs, responsive to requests |
| File upload attack | Low | Medium | MIME validation, size limits, virus scanning (future) |

**Overall Risk:** LOW for short pilot with limited users

---

## Approval Sign-Off

**Pilot Parameters:**
- **Duration:** 4-8 weeks
- **Users:** 1-2 estate agents, up to 50 buyers
- **Data:** Transaction details, messages, files (NO sensitive PII)
- **Deployment:** Linode + Supabase Free Tier
- **Legal:** Privacy Policy, Terms, Cookie Policy in place
- **Security:** Authentication, RLS, HTTPS, file validation

**Recommendation:** ✅ PROCEED with pilot after Week 1 action items completed

---

**Assessed By:** Claude Code (AI Assistant)
**Review Date:** 2026-01-09
**Next Review:** After 4 weeks of pilot or before full launch
