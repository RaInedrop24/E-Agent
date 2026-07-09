# Known Issues / Deferred Work

A log of issues we know about but have deliberately parked. Review before any
SEO or marketing push.

---

## 1. SEO metadata points at the mail subdomain (deferred — not ready for SEO yet)

**Logged:** 2026-07-08

**Symptom:** The public site's canonical URL, OpenGraph tags, Twitter card
images, and sitemap all reference `https://mail.thepropertygateway.com`
instead of `https://www.thepropertygateway.com`.

**Where the hardcoded values live:**

- `src/app/layout.tsx` — `canonical`, `og:url`, `og:image`, `twitter:image`
  (approx. lines 46–64)
- `src/app/sitemap.ts` — `baseUrl` (line 4)

**Root cause:** These URLs are hardcoded in source, most likely copied from
the Resend email domain during setup. They are **not** driven by
`NEXT_PUBLIC_SITE_URL`, so no server config change will fix them.

**Important — do NOT change the email side:** Resend correctly sends from
`*@mail.thepropertygateway.com` (e.g. `Updates@`, `Welcome@`,
`notifications@`, `noreply@`, `system@`). Using a dedicated `mail.` subdomain
for sending is best practice (isolates DKIM/SPF reputation from the main
domain). The fix is only to the website metadata, not the email addresses.

**Impact:** Search engines are told the "real" home of every page is the mail
subdomain, which likely serves nothing useful over HTTPS for web pages. This
splits/harms search ranking and makes social-share previews fetch og-image
from the wrong host. No functional impact on the app itself.

**Fix when ready:**

1. In `src/app/layout.tsx`, replace all `https://mail.thepropertygateway.com`
   references with `https://www.thepropertygateway.com` (or better, derive
   from `NEXT_PUBLIC_SITE_URL` via `metadataBase`).
2. Same replacement in `src/app/sitemap.ts`.
3. Rebuild and redeploy (these are baked in at build time).
4. Optionally verify `mail.thepropertygateway.com` doesn't serve the site over
   HTTPS, or add a redirect to `www`.

---

## 2. Duplicate `NEXT_PUBLIC_SITE_URL` in server `.env.production`

**Logged:** 2026-07-08

The server's `/var/www/thepropertygateway.com/E-Agent/.env.production` defines
`NEXT_PUBLIC_SITE_URL` twice:

```bash
NEXT_PUBLIC_SITE_URL=https://thepropertygateway.com       # no www
NEXT_PUBLIC_SITE_URL=https://www.thepropertygateway.com   # with www
```

Which value wins depends on the env loader's duplicate-handling, so behaviour
is ambiguous. When touching the env file next, delete the non-`www` line and
keep `https://www.thepropertygateway.com`. This var is used in email login
links, buyer invite redirects, and registration — worth making deterministic.
