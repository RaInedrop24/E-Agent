# Prompt for Future Agents: Feature 001

**Use this prompt when resuming work on Feature 001 (Sensitive PII Storage & GDPR Compliance)**

---

## Quick Start Prompt

```
I need to implement Feature 001 from the backlog: Sensitive PII Storage & GDPR Compliance.

Please review the following documents:
- backlog/features/001-sensitive-pii-storage/README.md (feature overview)
- backlog/features/001-sensitive-pii-storage/technical-analysis.md (technical findings)
- backlog/features/001-sensitive-pii-storage/implementation-plan.md (step-by-step guide)

I want to [choose one]:
- [ ] Implement Phase 1 (Encryption Foundation)
- [ ] Implement Phase 2 (GDPR Features)
- [ ] Implement Phase 3 (UI & Integration)
- [ ] Implement Phase 4 (Testing & Deployment)
- [ ] Review and update the implementation plan
- [ ] Get started from scratch (Phase 1)

Current status: [e.g., "Nothing implemented yet" or "Phase 1 complete, starting Phase 2"]

Please guide me through the implementation step-by-step.
```

---

## Phase-Specific Prompts

### Phase 1: Encryption Foundation

```
I want to implement Phase 1 (Encryption Foundation) of Feature 001.

This includes:
1. Enabling Supabase Vault extension
2. Creating encryption key
3. Building encryption/decryption SQL functions
4. Creating buyer_identity_documents table
5. Creating audit logging tables
6. Creating user_consents table

Please follow the implementation plan in:
backlog/features/001-sensitive-pii-storage/implementation-plan.md

Guide me step-by-step, and test each component before moving to the next.
```

### Phase 2: GDPR Features

```
I want to implement Phase 2 (GDPR Features) of Feature 001.

This includes:
1. Data export API (GDPR Article 20)
2. Account deletion workflow (GDPR Article 17)

Prerequisites: Phase 1 must be complete.

Please follow the implementation plan and create the necessary API routes in src/app/api/.
```

### Phase 3: UI & Integration

```
I want to implement Phase 3 (UI & Integration) of Feature 001.

This includes:
1. Identity documents submission form
2. Identity documents view with data masking
3. Agent verification interface

Prerequisites: Phases 1-2 must be complete.

Please create React components in src/app/profile/identity-documents/ and src/components/.
```

### Phase 4: Testing & Deployment

```
I want to implement Phase 4 (Testing & Deployment) of Feature 001.

This includes:
1. Unit tests for encryption functions
2. Integration tests for RLS policies
3. E2E tests with Playwright
4. Security testing checklist
5. Deployment to staging

Prerequisites: Phases 1-3 must be complete.

Please create tests in tests/ directory and prepare for deployment.
```

---

## Troubleshooting Prompts

### If Encryption Functions Fail

```
The encryption functions in Feature 001 are not working correctly. Error: [paste error message]

Please review:
- backlog/features/001-sensitive-pii-storage/implementation-plan.md (Step 1.3)
- backlog/features/001-sensitive-pii-storage/technical-analysis.md (Code Examples section)

Help me debug and fix the encryption functions.
```

### If RLS Policies Block Legitimate Access

```
RLS policies for buyer_identity_documents are blocking legitimate access.

User role: [agent/buyer/super_admin]
Attempted operation: [SELECT/INSERT/UPDATE/DELETE]
Error: [paste error message]

Please review the RLS policies in:
backlog/features/001-sensitive-pii-storage/implementation-plan.md (Step 1.4)

And help me diagnose the issue.
```

### If GDPR Compliance Questions

```
I have questions about GDPR compliance for Feature 001:
[State your specific question]

Please refer to:
- backlog/features/001-sensitive-pii-storage/technical-analysis.md (GDPR Compliance Gaps section)
- backlog/features/001-sensitive-pii-storage/README.md (Business Context)

And provide guidance on GDPR requirements.
```

---

## Review & Update Prompts

### Request Feature Review

```
Please review the current implementation of Feature 001 and assess:
1. What has been completed
2. What remains to be done
3. Any deviations from the implementation plan
4. Any security concerns or improvements needed

Check:
- Database schema (Supabase migrations)
- API routes (src/app/api/)
- UI components (src/app/profile/, src/components/)
- Tests (tests/)

Provide a status report and recommendations.
```

### Update Implementation Plan

```
Feature 001 implementation plan needs updating based on new requirements:
[Describe changes]

Please update:
- backlog/features/001-sensitive-pii-storage/implementation-plan.md

And reflect changes in:
- backlog/features/001-sensitive-pii-storage/README.md (Acceptance Criteria)
```

---

## Context for New Agents

If you're a new agent working on this feature, here's what you need to know:

**Project:** Estate Agent Portal (Next.js + Supabase)
**Location:** C:\Users\micro\Estate_Agent_Portal\estate-portal
**Feature ID:** 001
**Feature Name:** Sensitive PII Storage & GDPR Compliance
**Priority:** P0 (Critical)
**Effort:** XL (4-6 weeks)

**Why it's important:**
- EU GDPR compliance is legally required
- Users need to store National Insurance numbers, passport numbers, addresses
- Current system has no application-level encryption (PII stored in plaintext)
- No GDPR data export or account deletion features

**Tech Stack:**
- Database: Supabase (PostgreSQL)
- Encryption: Supabase Vault + pgcrypto extension
- API: Next.js 16 API routes
- Frontend: React 19 + TypeScript + shadcn/ui

**Key Files:**
- Technical Analysis: `backlog/features/001-sensitive-pii-storage/technical-analysis.md`
- Implementation Plan: `backlog/features/001-sensitive-pii-storage/implementation-plan.md`
- Feature Overview: `backlog/features/001-sensitive-pii-storage/README.md`

**Before starting:**
1. Read all three documents above
2. Ensure you have Supabase Pro plan access (Vault feature required)
3. Backup database before any schema changes
4. Work in feature branch: `feature/001-sensitive-pii-storage`

---

## Quick Commands Reference

```bash
# Navigate to project
cd C:\Users\micro\Estate_Agent_Portal\estate-portal

# Start dev server
npm run dev

# Create migration
npx supabase migration new <name>

# Push migrations to Supabase
npx supabase db push

# Run tests
npx playwright test

# Check backlog status
cat backlog/backlog_features.md | grep "001"
```

---

**Created:** 2026-01-08
**For:** Future AI agents working on Feature 001
**Maintained By:** Development team
