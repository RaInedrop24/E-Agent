# Code Review Implementation Plan & Progress

**Created:** 2026-07-08
**Source:** `docs/Code Review Polsia 2026-07-08.md` (validated + reformatted version, includes Appendix A with validation notes)
**Status:** Batches 1–3 complete and committed (`e244eea`, `250a5b1`, `488d043`). Batch 4 complete as **uncommitted changes** in the working tree, awaiting owner review — see §2 (Batch 4) and §3.

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

### ✅ Batch 4 — Deferred items (DONE, uncommitted)

| # | Item | Outcome |
|---|---|---|
| 4.1 | GDPR data export (Art. 20) | New `GET /api/gdpr/export` returns all personal data as downloadable JSON; "Download my data" button in `/settings`. Shared API auth helpers extracted to `src/lib/api-auth.ts` (new). |
| 4.2 | GDPR account deletion (Art. 17) | New `deletion_requests` table (migration `20260708_add_deletion_requests.sql`, applied to Supabase) with RLS; user routes `GET/POST/DELETE /api/gdpr/delete-request`; super-admin queue at `/admin/deletion-requests` + `/api/super-admin/deletion-requests` (complete = permanent `auth.admin.deleteUser`, blocked if the user still owns transactions; audit-logged; best-effort storage cleanup). Manual admin confirmation is deliberate for the pilot. |
| 4.3 | Site URL consolidation | `SITE_URL` constant in `constants.ts`; all inline `process.env.NEXT_PUBLIC_SITE_URL \|\| '...'` fallbacks replaced (notifications, email-service, register page, 3 API routes). |
| 4.4 | Debug route gating | `/api/test-sms`, `/api/check-user-alerts`, `/api/debug-super-admin` now require an authenticated super admin; `proxy.ts` also redirects unauthenticated visitors on super-admin routes to `/login`. |
| 4.5 | Dashboard pagination | Client-side pagination (20/page) with "Show more" button; resets on search/filter/sort change. New `dashboard.showMore` key in all 7 languages. |
| 4.6 | Lint debt cleared | `npm run lint` now exits 0: `any` types removed/typed across admin pages and components, `require()` → ESM imports, setState-in-effect fixed (`AuthContext` hooks return derived `shouldRedirect`, `CookieBanner` uses `useSyncExternalStore`, `useTransactionBranding` keys state by id), scripts/ ignored by ESLint, test-file rules relaxed. 20 warnings remain (`exhaustive-deps`, `<img>`) — acknowledged, not errors. |
| 4.7 | Translation code-split | `ui-translations.ts` split into per-language modules under `src/lib/translations/`; client bundle ships English only, other languages lazy-load via `translations/client.ts` (LanguageContext). New `npm run validate:translations` script checks key parity + `{{variable}}` consistency (fixed 56 mistranslated placeholders it found). |
| 4.8 | Translation debounce | `MessagingPanel` guards against duplicate DeepL calls (`attemptedTranslations` ref) and double message sends (`sending` guard). |
| 4.9 | CSP hardening | Nonce-based CSP rejected (would force every page dynamic, killing static optimization — documented in `proxy.ts`). Instead: Supabase domains removed from `script-src` (only needed in `connect-src`). |
| 4.10 | Static legal pages | Verified `/privacy`, `/terms`, `/cookies` already prerender as static (`○` in build output) — no change needed. |

### Verification status

- ✅ `npm run build` passes cleanly (Next.js 16 + TypeScript strict, 53 routes).
- ✅ `npm run lint` exits 0 — **0 errors**, 20 acknowledged warnings (`react-hooks/exhaustive-deps`, `@next/next/no-img-element`).
- ✅ `npx tsc --noEmit` clean.
- ✅ `npm run validate:translations` passes (508 keys × 7 languages).
- ✅ `deletion_requests` migration applied to the live Supabase project.
- ❌ **Manual testing of Batch 4 flows not yet done** — GDPR export download, deletion request → admin complete/cancel, dashboard "Show more".

### Manual test checklist (before committing)

1. Login → dashboard loads, profile fetched.
2. Leave tab idle 90+ minutes (or shorten JWT expiry in Supabase settings) → navigate → session should still be alive (token auto-refresh + cookie re-sync).
3. Logout → cookie cleared, protected routes redirect to `/login`.
4. Send a message in a transaction with a buyer whose language differs → translation works (exercises the new auth check on `/api/translate` via the cookie path).
5. Milestone toggle in a transaction with 2+ participants → email/SMS notifications still arrive.
6. Hammer any `/api/*` route 61+ times in a minute → expect 429.
7. Register/login as a Dutch (`nl`) user → UI and message translation work end-to-end.

**Batch 4 additions:**

8. Settings → "Download my data" → JSON file downloads and contains profile/transactions/messages.
9. Settings → request account deletion → pending banner appears; cancel works; as super admin, `/admin/deletion-requests` lists it and complete/cancel both work (complete blocked if the user owns transactions).
10. Dashboard with 21+ transactions → "Show more" button paginates; search resets to first page.
11. Switch UI language → non-English dictionary lazy-loads and all strings render (no raw keys).
12. `/api/test-sms`, `/api/check-user-alerts`, `/api/debug-super-admin` → 401/403 unless super admin.

### Commit guidance

Batches 1–3 are committed (`e244eea`, `250a5b1`, `488d043`). Batch 4 is uncommitted in the working tree awaiting owner review.

---

## 3. Remaining work

### Immediate (Batch 4 wrap-up)

1. **Manual testing** of the new Batch 4 flows (see checklist additions in §2).
2. **Owner review → commit** the Batch 4 working-tree changes (suggested: one commit per theme — GDPR, security gating, perf/pagination, translations split, lint cleanup — or a single `feat:` commit).
3. **Deploy to Linode** after commit (see `docs/DEPLOYMENT_LINODE.md`); the `deletion_requests` migration is already applied to the live Supabase project.

### Follow-ups logged elsewhere

- SEO metadata points at `mail.thepropertygateway.com` + duplicate env var on the server — see `docs/KNOWN_ISSUES.md`.
- 20 acknowledged lint warnings (`exhaustive-deps`, `<img>` → `<Image>`) — safe to revisit opportunistically.

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

CURRENT STATE: Batches 1-3 are COMMITTED (e244eea, 250a5b1, 488d043) and pushed.
Batch 4 is implemented as UNCOMMITTED changes in the working tree. npm run build,
npm run lint (0 errors), npx tsc --noEmit, and npm run validate:translations all
pass. The deletion_requests migration is applied to the live Supabase project.
The owner has NOT yet reviewed or approved a Batch 4 commit — DO NOT COMMIT OR
PUSH until the owner explicitly approves. Verify the working tree state with
git status before assuming anything.

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
