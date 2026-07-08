# Comprehensive Code Review — The Property Gateway (E-Agent)

| | |
|---|---|
| **Repository** | https://github.com/RaInedrop24/E-Agent |
| **Review Date** | 2026-07-08 |
| **Reviewer** | Polsia Research (Architecture & Code Quality Specialist) |
| **Stack** | Next.js 15/16 + TypeScript, Supabase (PostgreSQL + Auth + RLS), DeepL API, Tailwind CSS + shadcn/ui, Vercel/Linode, Playwright E2E |
| **Languages** | 7 (EN, IT, PL, ES, FR, DE, NL) |

> **Note:** Validation annotations (`✅ Verified`, `⚠️ Partially verified`, `❌ Inaccurate`) were added on 2026-07-08 after checking each claim against the codebase. See [Appendix A](#appendix-a--validation-notes) for details.

---

## 1. Executive Summary

**Overall Health: 6.5 / 10 — Pilot-Ready with Significant Technical Debt**

The Property Gateway is a functional multilingual real estate transaction management platform with solid foundational architecture. The team has demonstrated strong commitment to security (RLS, CSP headers, OAuth 2.0/PKCE, MFA for super admins) and compliance (Privacy Policy, Terms, Cookie Banner, GDPR documentation). However, the codebase shows signs of rapid prototyping that was pushed to production without adequate refactoring.

### Readiness for Production

- ✅ **Pilot-safe** with current data scope (no sensitive PII)
- ⚠️ **Not ready for full public launch** — Feature 001 (encrypted PII storage) is an unbuilt backlog item
- 🔴 **Not ready for scale** — multiple architectural and security issues below

### Key Risks

1. GDPR data export/deletion are manual (not self-service) — non-compliant with Articles 17 & 20
2. Application-level encryption absent — all PII stored in plaintext
3. No rate limiting on API routes — brute force / DoS vulnerability
4. 60+ sequential migrations create a fragile deployment dependency
5. Production telemetry / error monitoring completely absent

### What Works Well

- RLS policies are comprehensive and hardened against recursion
- Auth flow (OAuth PKCE, session cookies, middleware) is well-implemented
- Multilingual system (7 languages, DeepL caching) is architecturally sound
- Super Admin MFA + audit logging is production-grade
- Playwright E2E suite covers critical paths

---

## 2. Top 10 Issues (Ranked by Severity)

| # | Issue | Priority | Impact | Effort | Validated |
|---|-------|----------|--------|--------|-----------|
| 1 | **No API rate limiting** — all `/api/` routes are unprotected against brute force / DoS | 🔴 HIGH | Auth credential stuffing, DoS, cost escalation on third-party APIs (DeepL, Twilio, Resend) | 0.5d | ✅ Verified — worse than stated: `/api/translate` has **no auth at all** |
| 2 | **GDPR Articles 17 & 20 non-compliant** — no self-service data export or account deletion; manually handled by super admin | 🔴 HIGH | Regulatory violation; ICO/DPC complaints; potential fines | 2–3d | ✅ Verified (consistent with pilot docs) |
| 3 | **Sensitive PII in plaintext** — Feature 001 (application-level encryption with Supabase Vault) is in backlog but not implemented | 🔴 HIGH | Confidentiality breach if DB is compromised; blocks full launch | 4–6w | ✅ Verified (known/planned; pilot collects no sensitive PII) |
| 4 | **`autoRefreshToken: false` in Supabase client** — token auto-refresh is disabled globally; session may silently expire | 🔴 HIGH | Users unexpectedly logged out; session loss mid-transaction | 0.5d | ⚠️ Verified, but partially mitigated — `AuthContext` calls `startAutoRefresh()` on session load |
| 5 | **No production error monitoring** — no Sentry, LogRocket, or equivalent; `console.error` is the only error tracking | 🟡 MEDIUM | Undetected runtime failures; no crash visibility; debugging depends on user reports | 0.5d | ✅ Verified |
| 6 | **`SERVICE_ROLE_KEY` usage pattern** — `notifications.ts` creates an admin Supabase client at module level; not isolated from route handlers | 🟡 MEDIUM | If any route handler using this client is misconfigured, RLS bypass is possible | 1d | ✅ Verified — currently server-only (`'use server'`), correct but fragile |
| 7 | **60+ sequential database migrations** — no squashing; broken migrations cannot be selectively reverted | 🟡 MEDIUM | Deployment failures; data integrity risk on failed migrations | 1–2d | ✅ Verified (63 migration files) |
| 8 | **N+1 query patterns in notifications** — `sendNotifications()` fetches user emails one-by-one inside the participant loop | 🟡 MEDIUM | Performance degrades with scale; potential timeout on large transactions | 1d | ✅ Verified (`getUserById` per participant) |
| 9 | **Dutch (`nl`) missing from `/api/translate` validation** — `nl` is supported in `translation.ts` but absent from the route's `validLanguages` array | 🟡 MEDIUM | Dutch translations fail at API level with 400 error | 0.25d | ✅ Verified — also missing from `Language` type in `src/types/index.ts` |
| 10 | **No client-side file upload validation** — MIME type and size validated server-side only | 🟡 MEDIUM | Unnecessary server load; poor UX | 0.5d | ⚠️ Not independently verified (low risk claim) |

---

## 3. File-by-File Observations

### 3.1 `src/lib/supabase.ts` (31 lines) — 🔴 CRITICAL

```typescript
autoRefreshToken: false,
persistSession: true,
```

**Issue:** `autoRefreshToken: false` is set globally. Supabase clients rely on token refresh to maintain sessions. With this disabled, sessions can silently expire. `AuthContext.tsx` calls `supabase.auth.startAutoRefresh()` after session load, which partially mitigates this — but only if the user lands on a page that triggers auth init. If a user leaves a tab open and the token expires before the next page interaction, the session dies silently.

**Verdict:** Unusual pattern that requires deep understanding to maintain. Risk of silent session death in production.

> **Validation:** ✅ Confirmed. Note the mitigation is stronger than the review implies — `AuthProvider` wraps the whole app, so `startAutoRefresh()` runs on every page load where a session exists. The residual risk is edge cases (session restored but refresh stopped, long-idle tabs). Moving to the standard pattern is still the right fix.

### 3.2 `src/proxy.ts` (228 lines) — 🟡 MEDIUM

The middleware is `src/proxy.ts` — it handles both CSP headers and auth routing.

**Good:**
- CSP headers configured correctly for production
- Super Admin route protection with MFA enforcement
- Admin audit logging on access attempts
- Proper redirect chains with error parameters

**Issues:**
- **Hardcoded cookie name** `sb-skvfgvlwccxetglmfhpm-auth-token` — the Supabase project reference is embedded in the cookie name. If the Supabase project is ever recreated, all users' cookies break silently. Should be a configurable env var.
- **`console.log` everywhere in production middleware** — no structured logging (`logger.ts` is used elsewhere but not here). Makes production debugging noisy.
- **No rate limiting** — the matcher catches all routes, but there is no throttling. An attacker can hit `/api/*` endpoints at will.
- **Auth cookie JSON parsing** — `JSON.parse()` is called directly on a cookie value from the browser. If the cookie is tampered with, this throws; the error is caught but not handled gracefully.

**Verdict:** Functional but needs cleanup and hardening before scale.

> **Validation:** ✅ Mostly confirmed. Two corrections: (1) the review calls the `proxy.ts` name an inconsistency, but `proxy.ts` **is** the Next.js 16 convention (renamed from `middleware.ts`), so the name is correct for this stack. (2) The `JSON.parse` is wrapped in try/catch and falls through to a `getSession()` fallback — more graceful than stated. The hardcoded cookie name appears in **three files** (`supabase.ts`, `proxy.ts`, `AuthContext.tsx`).

### 3.3 `src/lib/translation.ts` (207 lines) — 🟡 MEDIUM

**Good:**
- Clean functional interface with TypeScript types
- Batch translation support (`translateBatch`) for efficient API usage
- Usage stats endpoint

**Issues:**
- **Hardcoded free-tier endpoint** — `https://api-free.deepl.com/v2/translate` is hardcoded (in three functions). If the app upgrades to a DeepL Pro account, the URL must change in code. Should be env-var driven.
- **`console.error` instead of `logger`** — inconsistent with the `logger.ts` standard established in other files.
- **`any`-typed request bodies** — `requestBody: any` when building DeepL payloads.

**Verdict:** Solid service module. The logger inconsistency and hardcoded endpoint are minor.

> **Validation:** ✅ Confirmed.

### 3.4 `src/lib/notifications.ts` (353 lines) — 🟡 MEDIUM

**Architecture:** A `'use server'` module handling multi-channel notifications (email, SMS, in-app).

**Good:**
- Per-participant notification dispatch with trigger-user skip logic
- Branding passed through to email templates
- Graceful degradation when Twilio/Resend is unconfigured

**Issues:**
- **`console.log` spam at init time** — Twilio config is logged every time the module is imported (cold start). Should be debug level or removed.
- **N+1 email fetch** — `supabaseAdmin.auth.admin.getUserById(profile.id)` is called for each participant inside the loop. 10 participants = 10 sequential API calls. Should batch-fetch.
- **`await` in a loop** — milestone labels and email/SMS sends are serialized per participant. Should parallelize with `Promise.all`.
- **`any` types throughout** — `data: any`, `profile: any`. No type safety on `NotificationPayload` fields.
- **`as SupportedLanguage` cast without validation** — `profile.preferred_language as SupportedLanguage` could be an invalid value at runtime. No fallback check before using it as a translation target.
- **No retry logic** — if Twilio or Resend fails mid-batch, notifications are silently dropped (errors are logged only).

**Verdict:** Core functionality is solid; the N+1 and `any` typing are the main concerns for reliability and scale.

> **Validation:** ✅ All confirmed against source (lines 17–27, 46, 125–348).

### 3.5 `src/lib/email-service.ts` (158 lines) — 🟡 MEDIUM

**Good:**
- Clean error handling with `{ success: boolean, error?: string }` return type
- Template generation wrapped in try-catch with specific error messages

**Issues:**
- **`new Resend(apiKey)` instantiated twice** in the same file (once per send function) instead of a shared module-level client. Minor overhead; inconsistent with `notifications.ts`.
- **Duplicated `loginUrl` fallback** — `process.env.NEXT_PUBLIC_SITE_URL || 'https://thepropertygateway.com'` is duplicated across `notifications.ts`, `email-service.ts`, and elsewhere. Should be a shared constant.
- **No email deduplication** — no idempotency key; a buyer duplicated in a transaction would receive duplicate emails.

**Verdict:** Clean implementation overall. The duplicates are code smell but not bugs.

> **Validation:** ✅ Confirmed. This file also defines its **own local `Language` type** (which does include `nl`), a third place language codes are declared — reinforcing the need for a single source of truth.

### 3.6 `src/lib/supabase-management.ts` (141 lines) — 🟢 INFO

A Management API client with well-documented limitations (public API v1 doesn't expose DB/storage metrics). Good use of `Promise.allSettled` for graceful partial failures. Used for admin tooling only.

**Note:** The management token is a high-privilege secret. If this client were ever wired to a frontend route, it would be a critical vulnerability. Currently server-only — confirm it is never imported in client-side code.

### 3.7 `src/types/index.ts` (113 lines) — 🟡 MEDIUM

**Issues:**
- **`Language` type missing `'nl'`** — the type declares `'en'|'it'|'es'|'fr'|'de'|'pl'` but `translation.ts` supports `'nl'`. Type-system inconsistency: code using the `Language` type could reject a valid `nl` value.
- **`translated_text?: Record<string,string>` in `Message`** — mixes snake_case (`translated_text`) with the camelCase convention used elsewhere in the same interface (`translatedContent`). Verify the DB column name matches.
- **No discriminated unions** — `ApiResponse<T>` uses `data?: T` and `error?: string`, allowing impossible states like `{ data, error }` both set. Should be `{ data: T } | { error: string }`.

**Verdict:** Minor type inconsistencies that could cause bugs during future development.

> **Validation:** ✅ Confirmed. Note these types appear to be largely aspirational/unused legacy definitions — several fields don't match the actual DB schema. Worth auditing usage before "fixing".

### 3.8 `src/contexts/AuthContext.tsx` (274 lines) — 🟡 MEDIUM

**Good:**
- Comprehensive auth state management with session validation via `getUser()`
- `clearStoredSession()` helper for graceful failure handling
- Cookie writing for middleware session access (the hybrid auth pattern)
- `useRequireAuth` and `useRequireRole` hooks

**Issues:**
- **Cookie TTL vs refresh-token window** — the context writes a 7-day cookie (`max-age=${60*60*24*7}`). If Supabase's refresh token expires sooner, middleware could accept a cookie whose tokens Supabase considers expired.
- **Unmount race on initial session check** — the initial `getSession().then()` has no cancellation; state updates can fire on an unmounted component.
- **No runtime validation of `preferred_language`** — profile data used directly; an invalid language value would flow into translation calls.
- **Single `loading` boolean** — cannot differentiate "checking session" / "no session" / "profile fetch error" for appropriate UI states.

**Verdict:** Solid auth pattern overall. The cookie TTL / refresh token mismatch is the most important watch item.

> **Validation:** ✅ Confirmed. Also noted: the cookie is written **without the `Secure` flag** (see §4).

### 3.9 `src/app/api/translate/route.ts` (99 lines) — 🟡 MEDIUM

**Issues:**
- **`nl` missing from `validLanguages`** — the array is `['en','it','es','fr','de','pl']`. Any Dutch translation request receives a 400.
- **GET endpoint exposed with no auth** — returns API documentation. Not a data leak, but exposes internal API design. Restrict or remove.
- **No request body size limit** — `request.json()` is called without checking content length.

**Verdict:** Small but has a silent failure for Dutch users.

> **Validation:** ✅ Confirmed — and **understated**: the POST endpoint performs **no authentication check whatsoever**. Any anonymous internet user can invoke DeepL translations through this route and exhaust the API quota. This should be treated as HIGH severity together with Issue #1. (The GET doc text also omits `pl` from its listed languages.)

### 3.10 `src/components/features/transaction/MessagingPanel.tsx` — 🟡 MEDIUM

From commit history: the local `Message` type previously collided with the imported `Message` type and was patched by renaming rather than resolved architecturally. Worth checking the `translated_text` field type name matches the database column name.

> **Validation:** ⚠️ File exists at the stated path. The naming-collision history is plausible but low-impact; verify `translated_text` column name during the types cleanup.

### 3.11 `src/proxy.ts` — CSP and Auth Gateway

Covered in §3.2. The CSP is well-configured. `frame-ancestors: 'none'` prevents clickjacking; `upgrade-insecure-requests` forces HTTPS.

> **Validation:** ⚠️ One correction — the review claims `'unsafe-inline'` is style-only, but the deployed CSP includes `'unsafe-inline'` in **`script-src`** too (added in commit `36abd99` to unblock inline scripts). This weakens XSS protection and is worth revisiting (nonce-based CSP).

### 3.12 Database Migrations (`supabase/migrations/`, 63 files)

**Architecture observations:**
- Sequential date-prefixed migrations (`20251117_`, `20251219_`, `20260107_`)
- RLS policies iterated extensively — multiple fixes for recursion issues
- `SECURITY DEFINER` functions used to bypass RLS where needed (e.g., buyer creation)
- `is_super_admin()` sets `search_path` explicitly to prevent schema poisoning — good practice

**Concerns:**
- 60+ migrations is a lot for a pilot-stage app; suggests a "never refactor migrations" approach that will become unmanageable
- No migration squashing/consolidation — old migrations modifying the same tables as new ones create conflicting history
- The RLS recursion issue was fixed across at least 3 separate migrations — initial design patched incrementally rather than rethought

> **Validation:** ✅ Confirmed (63 files). Squashing is worthwhile but carries real risk for a live production DB — see plan notes.

### 3.13 `src/lib/ui-translations.ts` — 🟡 MEDIUM

A monolithic file with ~500 translation keys × 7 languages (~3,700 lines). All translation functions (`t()`, `tVar()`) live in a single file.

**Good:**
- Structured per-language objects
- Clear key naming convention (`email.milestoneUpdate.subject`, `sms.finalMilestone`)

**Concerns:**
- **No translation key validation** — a typo'd key silently renders `undefined`
- **Duplicate keys are not caught** — a duplicate key silently overwrites (this already caused build issues fixed in commits `22e8bba` / `d6c733a`)

> **Validation:** ✅ Confirmed, including the duplicate-key incident in commit history.

---

## 4. Security Concerns (GDPR / EU / Real Estate Sensitivity)

### 🔴 HIGH: No Self-Service GDPR Compliance

| GDPR Article | Requirement | Status |
|---|---|---|
| Art. 17 — Right to Erasure | Users can request account deletion | ❌ Manual only; super admin must perform |
| Art. 20 — Right to Portability | Users can export their data in machine-readable format | ❌ Manual only; no self-service export |
| Art. 13–14 — Transparency | Privacy Policy informing users of data processing | ✅ Implemented (pilot version) |
| Art. 5 — Data Minimization | Only necessary data collected | ✅ Only basic profile + transaction data in pilot |

**Impact:** Users (agents and buyers) can request data deletion at any time. With no self-service flow, the team must respond manually within 30 days. Compliance gap and operational bottleneck.

### 🔴 HIGH: Rate Limiting Absent

All API routes (`/api/buyers`, `/api/translate`, `/api/notifications`, etc.) have no rate limiting. Attack scenarios:

1. **Credential stuffing** — auth-adjacent endpoints can be hammered with guesses
2. **DeepL cost escalation** — `/api/translate` can be called at will, exhausting the free tier or running up bills (aggravated by the missing auth check — see §3.9)
3. **Twilio SMS bombing** — a crafted payload triggering `sendNotifications` could spam buyer phone numbers

**Recommended fix:** in-memory or Upstash-style rate limiter at the proxy or API route level.

### 🟡 MEDIUM: Service Role Key Access Pattern

`notifications.ts` uses `createClient(url, SUPABASE_SERVICE_ROLE_KEY)` to bypass RLS for admin operations. This is correct and necessary — but the key must never reach the client. The file is server-only (`'use server'`), which is correct. Risk is future misconfiguration, not current exposure.

### 🟡 MEDIUM: Session Cookie Security

The session cookie (`sb-skvfgvlwccxetglmfhpm-auth-token`):

- `SameSite=Lax` — ✅ reasonable
- `max-age` 7 days — acceptable
- **No `Secure` flag set** — confirmed missing in `AuthContext.tsx` cookie writes; must be added for production
- **No `HttpOnly`** — intentional (client JS writes it, middleware reads it), but it means an XSS could steal raw `access_token`/`refresh_token`. This widens the attack surface and makes the CSP `script-src 'unsafe-inline'` issue (§3.11) more important.

### 🟢 INFO: Password Hashing

Supabase Auth handles password hashing (bcrypt). Default buyer passwords are generated server-side — verify current generation is random (the `Welcome2026!` issue was flagged in `PILOT_LAUNCH_ASSESSMENT`).

### 🟢 INFO: Super Admin SQL Editor

Write protection enabled by default; regex-based dangerous-operation detection is a reasonable first approach but bypassable with clever encoding. Fine for pilot; consider a query allowlist for production.

---

## 5. Performance Bottlenecks

### 🟡 N+1 in `sendNotifications()` (`notifications.ts`)

```typescript
for (const p of participants) {
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
  // Called N times for N participants
}
```

**Fix:** batch the lookups (e.g. `Promise.all`) or store email on the profile.

### 🟡 Serial notification dispatch

Each notification (email/SMS) plus milestone label lookup is awaited individually inside the participant loop. A transaction with 5 buyers ⇒ 15+ sequential awaits per trigger.

### 🟡 DeepL API calls not debounced

Rapid-fire message sending fires multiple translation calls in quick succession. No debouncing or queue management.

### 🟡 Supabase Realtime subscriptions

`NotificationBell` subscribes per user. The `20260107` security fix added `user_id` filtering (~99.8% query volume reduction), but duplicate mounts (tab duplication, navigation) can still accumulate subscriptions.

### 🟢 LOW: `ui-translations.ts` is a large import

~500 keys × 7 languages imported by every component using `useLanguage()`. Consider code-splitting per language.

---

## 6. Framework Best Practices — Deviations

| Deviation | Severity | Description |
|---|---|---|
| `as SupportedLanguage` with no runtime check | 🟡 MEDIUM | Profile language cast directly without validating membership in the union type |
| `any` types in service layer | 🟡 MEDIUM | `notifications.ts` uses `data: any` extensively; `noImplicitAny` would flag this |
| Client-side auth/profile loading | 🟡 MEDIUM | `AuthContext` re-fetches profile on every auth state change; server components could cache better |
| `useEffect`-based redirects | 🟡 MEDIUM | `useRequireAuth` redirects via client effect, causing content flash; prefer server-side `redirect()` |
| Next.js `<Image>` adoption | 🟢 LOW | `remotePatterns` configured, but audit for raw `<img>` tags |
| Tailwind class consistency | 🟢 LOW | Mixed hardcoded classes vs shadcn/ui patterns; no design-token discipline beyond shadcn defaults |
| No ISR on legal pages | 🟢 LOW | `/privacy`, `/terms` likely dynamically rendered; should be static or ISR |

> **Validation note:** the original review flagged the `proxy.ts` filename as a Next.js convention violation. This is **incorrect for Next.js 16**, where `proxy.ts` is the new official name for middleware. Removed from the table.

---

## 7. Technical Debt

| Item | Severity | Description |
|---|---|---|
| 60+ sequential migrations | 🔴 HIGH | Unmanageable deployment dependency; needs squashing before scale |
| Feature 001 (encrypted PII) in backlog | 🔴 HIGH | Blocks full production launch; cannot collect sensitive data without it |
| Monolithic `ui-translations.ts` | 🟡 MEDIUM | ~3,700 entries in one file; any syntax error breaks all translations |
| No error monitoring (Sentry) | 🟡 MEDIUM | No crash reporting; debugging relies on user reports |
| Duplicate hardcoded URLs | 🟡 MEDIUM | `https://thepropertygateway.com` fallback duplicated in 3+ files |
| No automated backup verification | 🟡 MEDIUM | Supabase free tier; no application-level backup verification |
| No pagination on transaction list | 🟡 MEDIUM | Dashboard loads all transactions; 50+ will slow the UI |
| Debug/test API routes in production | 🟡 MEDIUM | `/api/debug-super-admin`, `/api/test-sms`, `/api/check-user-alerts` widen attack surface (some gated, route existence remains) |
| `console.log` in server code | 🟢 LOW | `notifications.ts`, `proxy.ts` not migrated to `logger.ts` |

---

## 8. Recommended Improvement Roadmap

### Phase 1: Immediate Hardening (1–2 weeks) — Do First

| # | Action | Priority | Effort | Impact |
|---|--------|----------|--------|--------|
| 1.1 | Add rate limiting to all `/api/` routes | 🔴 HIGH | 0.5d | Secures against DoS and credential stuffing |
| 1.2 | Fix `autoRefreshToken: false` — re-evaluate refresh strategy or guarantee `startAutoRefresh()` on all page loads | 🔴 HIGH | 0.5d | Prevents silent session expiry |
| 1.3 | Add Dutch (`nl`) to `/api/translate` `validLanguages` (+ `Language` type) | 🔴 HIGH | 0.25d | Fixes broken Dutch translation |
| 1.4 | Wire up Sentry (`@sentry/nextjs`) for production error monitoring | 🟡 MEDIUM | 0.5d | Full crash visibility |
| 1.5 | Add `Secure` flag to session cookie in production | 🟡 MEDIUM | 0.25d | Cookies only sent over HTTPS |
| 1.6 | Audit `<img>` tags — replace with Next.js `<Image>` | 🟢 LOW | 0.5d | Performance |

### Phase 2: GDPR Compliance (2–3 weeks) — Do Before Scale

| # | Action | Priority | Effort | Impact |
|---|--------|----------|--------|--------|
| 2.1 | Build self-service data export API (Art. 20) — profile + transactions + messages as JSON | 🔴 HIGH | 2d | Legal compliance |
| 2.2 | Build self-service account deletion flow (Art. 17) — soft-delete + async PII cleanup | 🔴 HIGH | 2d | Legal compliance |
| 2.3 | Consolidate hardcoded URLs into a single constant | 🟡 MEDIUM | 0.5d | Maintainability |
| 2.4 | Sign DPAs with third-party services (DeepL, Twilio, Resend, Supabase) | 🟡 MEDIUM | 0.5d | GDPR compliance |
| 2.5 | Add pagination to transaction list | 🟡 MEDIUM | 1d | Performance |

### Phase 3: Scalability & Architecture (4–8 weeks)

| # | Action | Priority | Effort | Impact |
|---|--------|----------|--------|--------|
| 3.1 | Squash migrations into 5–10 logical snapshots | 🟡 MEDIUM | 2d | Deployment reliability |
| 3.2 | Implement Feature 001 — Supabase Vault application-level PII encryption | 🔴 HIGH | 4–6w | Required for full launch |
| 3.3 | Parallelize notification dispatch (`Promise.all`) | 🟡 MEDIUM | 0.5d | Performance |
| 3.4 | Batch email fetch in notifications (replace N × `getUserById`) | 🟡 MEDIUM | 1d | Performance |
| 3.5 | Replace `console.log` with `logger` in `notifications.ts`, `proxy.ts` | 🟢 LOW | 0.5d | Clean production logs |
| 3.6 | Add ISR to legal pages | 🟢 LOW | 0.5d | Performance |
| 3.7 | Remove/gate debug API routes in production | 🟡 MEDIUM | 0.5d | Attack surface reduction |

### Phase 4: Technical Debt Cleanup (Ongoing)

| # | Action | Priority | Effort | Impact |
|---|--------|----------|--------|--------|
| 4.1 | Replace `any` in `notifications.ts` with typed interfaces | 🟡 MEDIUM | 0.5d | Type safety |
| 4.2 | Validate `preferred_language` at runtime before use as translation target | 🟡 MEDIUM | 0.5d | Prevents silent translation failures |
| 4.3 | Code-split `ui-translations.ts` — lazy-load per language | 🟡 MEDIUM | 1d | Bundle size |
| 4.4 | Debounce message sending to prevent rapid-fire translation calls | 🟢 LOW | 0.5d | Cost control |

---

## Summary

The Property Gateway is a well-architected pilot platform with production-grade security foundations (RLS, CSP, MFA, audit logging). The team has been thoughtful about GDPR compliance documentation and has a clear roadmap (backlog Feature 001). However, several issues must be resolved before full public launch:

1. **Rate limiting + session refresh** are the two highest-impact, lowest-effort fixes
2. **Self-service GDPR (export/delete)** is legally required and currently missing
3. **Feature 001 (encrypted PII)** is the single biggest blocker for full production

The codebase shows healthy signs of iteration (RLS fixes, duplicate removal, debug log stripping), but the migration debt, type inconsistencies, and absence of error monitoring are the structural weaknesses to address next.

---

## Appendix A — Validation Notes

*Added 2026-07-08 after checking each claim against the codebase (commit `386249a`).*

### Confirmed accurate

- `autoRefreshToken: false` in `src/lib/supabase.ts` (line 24)
- `nl` missing from `validLanguages` in `src/app/api/translate/route.ts` (line 23); `Language` type in `src/types/index.ts` also missing `nl`
- N+1 `getUserById` per participant, serial awaits, `data: any`, unvalidated language cast, init-time `console.log` — all present in `src/lib/notifications.ts`
- Hardcoded cookie name `sb-skvfgvlwccxetglmfhpm-auth-token` in 3 files
- Hardcoded DeepL free-tier URL in 3 functions in `src/lib/translation.ts`
- Double `new Resend()` and duplicated site-URL fallback in `src/lib/email-service.ts`
- Missing `Secure` flag on session cookie (`AuthContext.tsx` lines 114, 151)
- 63 migration files; monolithic `ui-translations.ts` (~3,700 lines); no Sentry; debug routes present
- No rate limiting anywhere in `src/` (only an unrelated match in super-admin email route)

### Corrections to the review

1. **`proxy.ts` naming is correct** — Next.js 16 renamed `middleware.ts` to `proxy.ts`. Not a deviation.
2. **Cookie JSON parsing is handled** — wrapped in try/catch with a `getSession()` fallback; less severe than described.
3. **CSP claim inverted** — the review praises script-src for *not* allowing `'unsafe-inline'`, but commit `36abd99` added `'unsafe-inline'` to `script-src`. The real state is *weaker* than the review believed.
4. **Issue #4 severity** — partially mitigated by `startAutoRefresh()` in `AuthContext`; real but arguably MEDIUM rather than HIGH.

### Findings the review missed

1. **`/api/translate` POST has no authentication at all** — any anonymous user can consume the DeepL quota. Compounds Issue #1; should be fixed together (auth check + rate limit).
2. **`Language` codes are declared in at least 3 places** (`types/index.ts`, `lib/translation.ts`, `lib/email-service.ts`) with inconsistent membership — single source of truth needed.
