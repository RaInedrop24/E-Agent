# Code Review Implementation Plan & Progress

**Created:** 2026-07-08
**Source:** `docs/Code Review Polsia 2026-07-08.md` (validated + reformatted version, includes Appendix A with validation notes)
**Baseline commit:** `386249a` (main) — all work below is **uncommitted** in the working tree, pending owner review
**Status:** Batches 1–3 complete and build-verified. Batch 4 not started. Nothing committed.

---

## 1. Context

An external code review of The Property Gateway (this repo, `estate-portal/`) was validated against the codebase on 2026-07-08. The review was largely accurate; three claims were corrected and two missed findings were added (see Appendix A of the review doc). The fixes were planned in four batches and the first three have been implemented.

**Key correction to the review:** `src/proxy.ts` is the correct Next.js 16 middleware convention (renamed from `middleware.ts`) — not a naming mistake.

**Most urgent finding (missed by the review):** `/api/translate` had **no authentication at all** — any anonymous user could burn the DeepL quota. Fixed in Batch 1.

---

## 2. Progress

### ✅ Batch 1 — Security quick wins (DONE)

| Change | Files |
|---|---|
| `/api/translate` now requires auth (session cookie or Bearer token), validates languages against canonical list (fixes broken Dutch), unauthenticated GET doc endpoint removed | `src/app/api/translate/route.ts` |
| In-memory fixed-window rate limiter: 60 req/min/IP for `/api/*`, 20 req/min/IP for quota-spending routes (`/api/translate`, `/api/buyers`, `/api/test-sms`); returns 429 + `Retry-After` | `src/lib/rate-limit.ts` (new), `src/proxy.ts` |
| `Secure` flag on session cookie when served over HTTPS | `src/contexts/AuthContext.tsx` |
| Single source of truth for language codes: `LanguageCode` type + `isSupportedLanguage()` + `toSupportedLanguage()` helpers; all duplicate declarations now derive from it and include `nl` | `src/lib/constants.ts`, `src/lib/translation.ts`, `src/types/index.ts`, `src/lib/email-service.ts`, `src/lib/email-templates.ts` |

### ✅ Batch 2 — Session refresh + observability (DONE)

| Change | Files |
|---|---|
| `autoRefreshToken: true` (was `false`); removed manual `startAutoRefresh()`/`stopAutoRefresh()` calls; `onAuthStateChange` fires on `TOKEN_REFRESHED` so the middleware cookie re-syncs on every refresh; added unmount guard to initial session check | `src/lib/supabase.ts`, `src/contexts/AuthContext.tsx` |
| Sentry installed (`@sentry/nextjs@10.64.0`, installed with `--legacy-peer-deps` due to react-joyride/React 19 peer conflict). No-op until `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are set. Source-map upload wrapper deliberately skipped (needs a Sentry auth token) | `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/app/global-error.tsx` (all new), `.env.local.example`, `package.json` |
| Hardcoded cookie name `sb-skvfgvlwccxetglmfhpm-auth-token` replaced with `AUTH_COOKIE_NAME` derived from `NEXT_PUBLIC_SUPABASE_URL` (derived value is identical, so existing sessions unaffected) | `src/lib/constants.ts`, `src/lib/supabase.ts`, `src/proxy.ts`, `src/contexts/AuthContext.tsx`, `src/app/actions/transaction.ts`, `src/app/api/super-admin/{templates,metrics,buyers}/route.ts`, `src/app/api/debug-super-admin/route.ts` |

### ✅ Batch 3 — Notifications reliability (DONE)

`src/lib/notifications.ts` was rewritten:

- `NotificationPayload` is now a **discriminated union** (`MILESTONE_UPDATE | NEW_MESSAGE | FILE_UPLOAD | TRANSACTION_FINALIZED`) — no more `data: any`. The four call sites in `src/app/actions/transaction.ts` already matched the shapes; no caller changes were needed.
- **N+1 fixed:** milestone row fetched once per notification (was up to 2× per participant); recipient emails batch-fetched in parallel up front; participants dispatched concurrently with `Promise.allSettled`; SMS + email per recipient run concurrently.
- `preferred_language` validated at runtime via `toSupportedLanguage()` (falls back to `en`).
- All `console.*` migrated to `logger` (`src/lib/logger.ts`) in `notifications.ts` and `proxy.ts`; noisy Twilio init logs demoted to warn/debug.
- Also removed remaining `any` types in `src/lib/translation.ts` request/response handling.

### Verification status

- ✅ `npm run build` passes cleanly (Next.js 16 + TypeScript strict pass, 49 routes).
- ✅ Zero IDE linter errors in all created/modified files.
- ⚠️ `npm run lint` exits non-zero — **all failures are pre-existing** (~50 files: `any` in admin pages, `require()` in scripts, `<img>` warnings, setState-in-effect in `useRequireAuth`/`useRequireRole`). Deliberately left out of this diff; they are Batch 4 material.
- ❌ **Manual testing not yet done** — see checklist below.

### Manual test checklist (before committing)

1. Login → dashboard loads, profile fetched.
2. Leave tab idle 90+ minutes (or shorten JWT expiry in Supabase settings) → navigate → session should still be alive (token auto-refresh + cookie re-sync).
3. Logout → cookie cleared, protected routes redirect to `/login`.
4. Send a message in a transaction with a buyer whose language differs → translation works (exercises the new auth check on `/api/translate` via the cookie path).
5. Milestone toggle in a transaction with 2+ participants → email/SMS notifications still arrive.
6. Hammer any `/api/*` route 61+ times in a minute → expect 429.
7. Register/login as a Dutch (`nl`) user → UI and message translation work end-to-end.

### Commit guidance (owner has NOT yet approved commits)

Suggested: three commits matching the batches, or one combined. All work is uncommitted in the working tree; `docs/Code Review Polsia 2026-07-08.md` (reformatted review), this plan, and the 7 new source files are untracked.

---

## 3. Remaining work (not started)

### Batch 4 — Deferred items, in suggested priority order

| # | Item | Effort | Notes |
|---|---|---|---|
| 4.1 | GDPR self-service **data export** (Art. 20): API route exporting profile + transactions + messages + files metadata as JSON, button in `/settings` | ~2d | Legally required before scaling past pilot |
| 4.2 | GDPR self-service **account deletion** (Art. 17): soft-delete + async PII cleanup; consider a `deletion_requests` table + super-admin confirmation for pilot | ~2d | Pair with 4.1 |
| 4.3 | Consolidate hardcoded `https://thepropertygateway.com` fallbacks into one constant (e.g. `SITE_URL` in `constants.ts`) — appears in `notifications.ts`, `email-service.ts`, and elsewhere | 0.5d | Trivial, good first task |
| 4.4 | Gate/remove debug routes in production: `/api/debug-super-admin`, `/api/test-sms`, `/api/check-user-alerts`, `/debug/*` pages (some already behind super-admin proxy checks — verify each) | 0.5d | Attack surface |
| 4.5 | Dashboard transaction list pagination | 1d | Perf at 50+ transactions |
| 4.6 | Pre-existing lint debt: `any` types in admin pages, `require()` in scripts, `<img>` → `<Image>`, setState-in-effect in `useRequireAuth`/`useRequireRole` | 1–2d | Makes `npm run lint` green |
| 4.7 | Code-split `ui-translations.ts` per language; add duplicate-key/missing-key validation script | 1d | Bundle size + safety |
| 4.8 | Debounce message-send translation calls in `MessagingPanel.tsx` | 0.5d | DeepL cost control |
| 4.9 | CSP hardening: remove `'unsafe-inline'` from `script-src` in `proxy.ts` (added in commit `36abd99` to unblock inline scripts — investigate nonce-based CSP) | 1d | XSS surface; important because session cookie is not HttpOnly |
| 4.10 | ISR/static rendering for `/privacy`, `/terms`, `/cookies` | 0.5d | Minor perf |

### Explicitly deferred (do NOT do without owner decision)

- **Migration squashing** — risky against the live production DB, little benefit while Supabase tracks applied migrations. Only worthwhile when provisioning a second environment.
- **Feature 001 (encrypted PII / Supabase Vault)** — 4–6 week feature, blocks full launch but not the pilot. Fully specced in `backlog/features/001-sensitive-pii-storage/`.
- **DPA signing (DeepL, Twilio, Resend, Supabase)** — owner/legal task, not code.

---

## 4. Handoff prompt for a fresh agent

Copy-paste the following into a new agent session if this one is lost:

```
You are picking up mid-task work on The Property Gateway, a Next.js 16 + Supabase
multilingual property transaction portal for estate agents and international buyers.

REPO LAYOUT: The workspace root is c:\Users\micro\Estate_Agent_Portal but the git
repo and app live in the estate-portal\ subfolder (remote: RaInedrop24/E-Agent,
branch main). Run all git/npm commands from estate-portal\. Shell is PowerShell —
use ';' not '&&' to chain commands.

CONTEXT: An external code review was validated and its fixes partially implemented.
Read these two documents FIRST — they contain the full state:
1. estate-portal\docs\Code Review Polsia 2026-07-08.md  (validated review; Appendix A
   lists which claims were confirmed/corrected)
2. estate-portal\docs\Code Review Implementation Plan 2026-07-08.md  (this plan:
   what is done, what remains, test checklist)

CURRENT STATE: Batches 1-3 are implemented as UNCOMMITTED changes in the working
tree (17 modified + 7 new files on top of commit 386249a). npm run build passes.
npm run lint fails only on PRE-EXISTING issues unrelated to this work. The owner
has NOT yet reviewed or approved a commit — DO NOT COMMIT OR PUSH until the owner
explicitly approves. Verify the working tree state with git status before assuming
anything.

WHAT WAS DONE (summary — details in the plan doc):
- /api/translate: added auth requirement, Dutch (nl) support, removed public GET
- New src/lib/rate-limit.ts wired into src/proxy.ts (60/min per IP on /api/*,
  20/min on expensive routes)
- Session cookie: Secure flag on HTTPS; name now derived via AUTH_COOKIE_NAME in
  src/lib/constants.ts (replaces hardcoded sb-skvfgvlwccxetglmfhpm-auth-token in 8 files)
- Language codes: single source of truth (LanguageCode + helpers in constants.ts)
- supabase.ts: autoRefreshToken now true; AuthContext manual refresh calls removed;
  onAuthStateChange re-syncs the middleware cookie on TOKEN_REFRESHED
- Sentry installed (@sentry/nextjs, --legacy-peer-deps required); no-op until
  SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN env vars are set
- src/lib/notifications.ts rewritten: discriminated-union payload types, N+1 fixed,
  parallel dispatch via Promise.allSettled, language validation, logger migration

YOUR LIKELY NEXT STEPS (confirm with the owner):
1. If the owner has reviewed: commit in 3 commits matching Batches 1-3 (see plan
   doc section 2), then run the manual test checklist in the plan doc.
2. If continuing work: start Batch 4 items in the priority order listed in the
   plan doc section 3 (GDPR export/deletion first, then URL consolidation, debug
   route gating, pagination, lint debt).
3. NEVER do migration squashing or Feature 001 without an explicit owner decision.

CONVENTIONS: Conventional Commits (feat:/fix:/docs:). Every UI change must add
translation keys for all 7 languages (en,it,pl,es,fr,de,nl) in
src/lib/ui-translations.ts. Use logger from src/lib/logger.ts, not console.
Use specialized file tools, not cat/sed. The app builds with npm run build and
tests run with npm run test:e2e (Playwright, needs a running dev server).
```

---

## 5. Quick reference

| Thing | Where |
|---|---|
| Validated code review | `docs/Code Review Polsia 2026-07-08.md` |
| This plan | `docs/Code Review Implementation Plan 2026-07-08.md` |
| Rate limiter | `src/lib/rate-limit.ts` |
| Language + cookie constants | `src/lib/constants.ts` |
| Sentry configs | `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation*.ts` |
| Notification types | `NotificationPayload` union in `src/lib/notifications.ts` |
| Feature 001 spec | `backlog/features/001-sensitive-pii-storage/` |
| Pilot launch docs | `PILOT_LAUNCH_SUMMARY.md`, `docs/PILOT_LAUNCH_CHECKLIST.md` |
