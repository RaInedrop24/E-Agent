# Pilot Launch Checklist - Estate Agent Portal

**Target Launch Date:** [YOUR DATE]
**Estimated Completion Time:** 1-2 weeks

---

## Week 1: Essential Compliance & Security

### Day 1-2: Legal Documents ⚠️ CRITICAL

- [ ] **Customize Privacy Policy**
  - Open: `docs/PRIVACY_POLICY_TEMPLATE.md`
  - Replace all `[YOUR COMPANY NAME]`, `[YOUR EMAIL]`, `[YOUR ADDRESS]`, etc.
  - Add effective date
  - Review with legal counsel (if available)
  - Estimated time: 2-3 hours

- [ ] **Create Terms of Service**
  - Use template generator: https://www.termsfeed.com/terms-service-generator/
  - Include:
    - Service description
    - User obligations
    - Limitation of liability
    - Termination rights
    - Governing law (UK/Ireland)
  - Estimated time: 1-2 hours

- [ ] **Create Cookie Policy**
  - Document authentication token usage
  - State "No tracking cookies"
  - Link to Privacy Policy
  - Estimated time: 30 minutes

### Day 3: Implement Legal Pages

- [ ] **Create `/privacy` page**
  ```bash
  # Create file: src/app/privacy/page.tsx
  # Copy content from docs/PRIVACY_POLICY_TEMPLATE.md
  # Convert markdown to React/HTML
  ```

- [ ] **Create `/terms` page**
  ```bash
  # Create file: src/app/terms/page.tsx
  ```

- [ ] **Create `/cookies` page**
  ```bash
  # Create file: src/app/cookies/page.tsx
  ```

- [ ] **Update footer to link to legal pages**
  ```tsx
  // In src/components/layout/Footer.tsx (or equivalent)
  <footer>
    <a href="/privacy">Privacy Policy</a>
    <a href="/terms">Terms of Service</a>
    <a href="/cookies">Cookie Policy</a>
  </footer>
  ```

- [ ] **Add legal links to registration page**
  ```tsx
  // In src/app/(auth)/register/page.tsx
  <p>
    By registering, you agree to our{' '}
    <a href="/terms">Terms of Service</a> and{' '}
    <a href="/privacy">Privacy Policy</a>
  </p>
  ```

**Estimated time:** 3-4 hours

### Day 4: Cookie Consent Banner

- [ ] **Install react-cookie-consent**
  ```bash
  npm install react-cookie-consent
  ```

- [ ] **Add consent banner to layout**
  ```tsx
  // In src/app/layout.tsx
  import CookieConsent from "react-cookie-consent";

  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          {children}
          <CookieConsent
            location="bottom"
            buttonText="I Understand"
            cookieName="estate-portal-cookie-consent"
            style={{ background: "#2B373B" }}
            buttonStyle={{ background: "#4CAF50", color: "#fff", fontSize: "13px" }}
            expires={150}
          >
            This website uses essential cookies for authentication.{" "}
            <a href="/cookies" style={{ color: "#fff" }}>Learn more</a>
          </CookieConsent>
        </body>
      </html>
    );
  }
  ```

**Estimated time:** 1 hour

### Day 5: Security Improvements

- [ ] **Fix default password generation**
  ```tsx
  // In src/app/api/buyers/create/route.ts
  // REPLACE:
  const defaultPassword = 'Welcome2026!';

  // WITH:
  import crypto from 'crypto';
  const defaultPassword = crypto.randomBytes(18).toString('base64').replace(/[+/=]/g, '').slice(0, 16);
  ```

- [ ] **Add server-side file upload validation**
  ```tsx
  // In file upload API route
  // Add MIME type validation
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'File type not allowed' });
  }

  // Validate file size server-side
  if (file.size > 20 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large (max 20MB)' });
  }
  ```

- [ ] **Verify HTTPS on Linode**
  - Check SSL certificate is valid
  - Test: https://[your-domain]
  - Ensure HTTP redirects to HTTPS

**Estimated time:** 2-3 hours

### Day 6-7: Testing

- [ ] **Test RLS policies**
  - Create 2 test agents
  - Create buyers for each agent
  - Verify Agent A cannot see Agent B's buyers
  - Verify buyers can only see their own transactions

- [ ] **Test file upload security**
  - Try uploading 25MB file (should fail)
  - Try uploading .exe file (should fail if MIME validation added)
  - Download file and verify time-limited URL expires

- [ ] **Test authentication**
  - Verify password reset works
  - Verify logout works
  - Verify session expires after inactivity

- [ ] **Test legal pages**
  - All links work
  - Cookie banner appears on first visit
  - Cookie banner doesn't reappear after acceptance

**Estimated time:** 3-4 hours

---

## Week 2: DPAs and Documentation

### Day 8-9: Data Processing Agreements

- [ ] **Supabase DPA**
  - Go to: https://supabase.com/legal/dpa
  - Review and save copy
  - No signature required (incorporated by Terms of Service)

- [ ] **DeepL DPA**
  - Contact: support@deepl.com
  - Request DPA for GDPR compliance
  - Save signed copy

- [ ] **Twilio DPA**
  - Go to: https://www.twilio.com/legal/data-protection-addendum
  - Download and save
  - Sign if required

- [ ] **Resend DPA**
  - Check: https://resend.com/legal
  - Contact support if needed

- [ ] **Google Gemini AI DPA**
  - Go to: https://cloud.google.com/terms/data-processing-addendum
  - Review Google Cloud DPA
  - Save copy

**Estimated time:** 2-3 hours (mostly waiting for responses)

### Day 10: Pilot Agent Documentation

- [ ] **Send Security Reassurance Document**
  - File: `SECURITY_REASSURANCE_FOR_PILOT_AGENT.md`
  - Customize with your contact details
  - Send to pilot agent before demo

- [ ] **Create Pilot Agreement (optional but recommended)**
  - State pilot duration (e.g., 4-8 weeks)
  - Clarify what data will be collected
  - Confirm data deletion after pilot (if requested)
  - Get agent's signature

**Estimated time:** 1-2 hours

### Day 11: Monitoring Setup

- [ ] **Set up Supabase usage alerts**
  - Go to Supabase Dashboard → Settings → Usage
  - Enable email alerts at 80% capacity (storage, bandwidth)

- [ ] **Set up error monitoring (optional)**
  - Consider: Sentry (free tier: 5K errors/month)
  - Install: `npm install @sentry/nextjs`
  - Add to `next.config.js`

- [ ] **Document incident response contacts**
  - Your emergency contact
  - Supabase support: support@supabase.io
  - Legal counsel (if applicable)

**Estimated time:** 1-2 hours

### Day 12-13: Pre-Launch Testing

- [ ] **Full user journey test**
  - Agent registers
  - Agent creates buyer
  - Buyer receives email and logs in
  - Buyer changes password
  - Agent creates transaction
  - Agent adds buyer to transaction
  - Both see transaction dashboard
  - Upload file
  - Send message
  - Translate message (if using DeepL)
  - Complete milestone

- [ ] **Load test (optional)**
  - Simulate 10-20 concurrent users
  - Check response times (<500ms)
  - Monitor Supabase database performance

- [ ] **Security checklist**
  - ✅ HTTPS enabled
  - ✅ RLS policies tested
  - ✅ File upload validation
  - ✅ Password security (no `Welcome2026!`)
  - ✅ Session management working
  - ✅ Legal pages accessible

**Estimated time:** 4-6 hours

### Day 14: Launch Preparation

- [ ] **Final review with pilot agent**
  - Demo the platform
  - Walk through security measures
  - Answer questions
  - Provide login credentials
  - Send Security Reassurance document

- [ ] **Set up backup procedure**
  - Supabase: Enable Point-in-Time Recovery (PITR) if on Pro plan
  - Free tier: Manual SQL dumps weekly
  - Test restore procedure

- [ ] **Create support SLA**
  - Response time: 24 hours for pilot
  - Emergency contact: [YOUR PHONE]
  - Email: [YOUR EMAIL]

**Estimated time:** 2-3 hours

---

## Launch Day Checklist

- [ ] **Verify production deployment**
  - All environment variables set
  - HTTPS working
  - Legal pages accessible
  - Cookie banner appearing

- [ ] **Send welcome email to pilot agent**
  - Login URL
  - Username
  - Temporary password (they'll change on first login)
  - Link to Security Reassurance document
  - Your contact details
  - Support hours

- [ ] **Monitor for first 24 hours**
  - Check error logs
  - Monitor Supabase usage
  - Be available for support questions

---

## Post-Launch (Week 3-4)

### Weekly Monitoring

- [ ] **Review Supabase metrics**
  - Storage usage (stay under 800MB)
  - Bandwidth usage
  - Database queries (slow queries)
  - Error rates

- [ ] **Check in with pilot agent**
  - Weekly call or email
  - Gather feedback
  - Address issues
  - Document feature requests

- [ ] **Security review**
  - Review audit logs
  - Check for unusual activity
  - Verify no unauthorized access

### End of Pilot

- [ ] **Collect feedback**
  - What worked well?
  - What needs improvement?
  - Would they recommend it?
  - What features are missing?

- [ ] **Decide on next steps**
  - Continue with pilot agent?
  - Onboard more agents?
  - Implement Feature 001 (encrypted PII)?
  - Build additional features?

- [ ] **Data handling**
  - Offer data export to pilot agent
  - If discontinuing: Delete/anonymize data as requested
  - If continuing: Plan for production launch

---

## Quick Reference: Priority Order

### MUST DO BEFORE LAUNCH (P0)
1. Privacy Policy page
2. Terms of Service page
3. Cookie consent banner
4. Fix default password generation
5. Test RLS policies

### SHOULD DO BEFORE LAUNCH (P1)
6. Cookie Policy page
7. Server-side file validation
8. Supabase usage alerts
9. Security Reassurance document
10. DPA review

### NICE TO HAVE (P2)
11. Error monitoring (Sentry)
12. Rate limiting
13. Formal pilot agreement
14. Load testing

---

## Time Estimate Summary

| Task Category | Estimated Time |
|--------------|----------------|
| Legal documents | 4-6 hours |
| Implementation (pages, banner, security) | 6-8 hours |
| Testing | 4-6 hours |
| DPAs and documentation | 3-4 hours |
| Pre-launch preparation | 4-6 hours |
| **TOTAL** | **21-30 hours** |

**Realistic Timeline:** 1-2 weeks (part-time work)

---

## Resources

**Legal Templates:**
- Privacy Policy: https://www.termsfeed.com/privacy-policy-generator/
- Terms of Service: https://www.termsfeed.com/terms-service-generator/
- Cookie Policy: https://www.termsfeed.com/cookies-policy-generator/

**GDPR Compliance:**
- ICO Guide: https://ico.org.uk/for-organisations/guide-to-data-protection/
- GDPR Checklist: https://gdpr.eu/checklist/

**Security:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Next.js Security: https://nextjs.org/docs/pages/building-your-application/configuring/security-headers

**DPAs:**
- Supabase: https://supabase.com/legal/dpa
- Twilio: https://www.twilio.com/legal/data-protection-addendum
- Google: https://cloud.google.com/terms/data-processing-addendum

---

## Support

**Questions?** Contact [YOUR EMAIL]

**Issues?** Create a GitHub issue or document in `backlog/features/`

---

**Good luck with your pilot launch! 🚀**
