# Security Audit — Amateur Radio Propagation Info

**Version:** 1.2.0
**Date:** 2026-02-26
**Auditor:** Fritz (DK9RC) / Claude Sonnet 4.6
**Scope:** Full client-side codebase, GitHub Actions pipelines, dependency tree

---

## Executive Summary

The application is a **client-side-only dashboard** with no authentication, no backend, and no server-side data collection. As of v1.2.0 it accepts user input (callsign / Maidenhead locator via a settings modal) and uses `localStorage` to persist user settings and trend-comparison values. The attack surface remains very small. No critical vulnerabilities were found. Three low-severity findings and two informational items are documented below.

---

## Findings Overview

| ID | Severity | Title |
|----|----------|-------|
| SEC-01 | ✅ RESOLVED | Third-party CORS proxy as data channel |
| SEC-02 | 🟡 LOW | No Content Security Policy (CSP) |
| SEC-03 | 🟡 LOW | GitHub Actions pinned to major-version tags, not commit SHAs |
| SEC-04 | 🟡 LOW | Dynamic third-party script injection (dxnews.com calendar widget) |
| INFO-01 | ℹ️ INFO | npm audit: 0 known vulnerabilities |
| INFO-02 | ℹ️ INFO | All dependency licenses permissive (MIT / Apache-2.0 / BSD) |

---

## Detailed Findings

### SEC-01 — ~~Third-party CORS proxy as data channel~~ — RESOLVED

**Severity:** ~~Low~~ → ✅ Resolved in v1.0.2
**File:** `src/PropagationDashboard.jsx:9`

**Resolution:**
A self-hosted Cloudflare Worker (`https://hamqsl-proxy.fritz-a2e.workers.dev`) now serves as the CORS proxy. The Worker fetches HamQSL directly, adds `Access-Control-Allow-Origin: *` and `Cache-Control: no-store` headers, and returns the response. The third-party `corsproxy.io` dependency has been eliminated.

```js
const HAMQSL_PROXY = 'https://hamqsl-proxy.fritz-a2e.workers.dev'
// ...
const r = await fetch(HAMQSL_PROXY)
```

The Cloudflare Worker source is included in the repository under `cloudflare-worker/`.

---

### SEC-02 — No Content Security Policy (CSP)

**Severity:** Low
**File:** `index.html`

**Description:**
The HTML entry point does not define a Content Security Policy via a `<meta http-equiv="Content-Security-Policy">` tag. GitHub Pages does not support custom HTTP response headers.

Without a CSP, a future code change introducing `dangerouslySetInnerHTML` or an accidental inline script would not be caught at the browser level.

**Mitigating factors:**
- No `dangerouslySetInnerHTML` is used anywhere in the current codebase.
- All external data is inserted via React's standard JSX `{value}` interpolation, which HTML-escapes output automatically.
- No third-party scripts are loaded at runtime; all assets are bundled at build time by Vite.
- The standalone build is fully self-contained with no external network calls for assets.

**Recommendation:**
Add a CSP meta tag to `index.html` that restricts `connect-src` to the two known data endpoints and the CORS proxy:

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self' 'unsafe-inline';
           style-src 'self' 'unsafe-inline';
           connect-src https://www.hamqsl.com
                       https://hamqsl-proxy.fritz-a2e.workers.dev
                       https://services.swpc.noaa.gov;
           img-src 'self' data:;
           object-src 'none';">
```

> Note: `unsafe-inline` is required for Vite's production builds which inline CSS and JS into the HTML document for the standalone build.

---

### SEC-03 — GitHub Actions pinned to major-version tags, not commit SHAs

**Severity:** Low
**Files:** `.github/workflows/deploy.yml`, `.github/workflows/release.yml`

**Description:**
The workflows use floating major-version tags (`@v4`) for third-party actions:

```yaml
uses: actions/checkout@v4
uses: actions/setup-node@v4
uses: actions/upload-pages-artifact@v3
uses: actions/deploy-pages@v4
```

A compromised maintainer of these actions could push a malicious commit to the `v4` tag, which would execute in the CI pipeline on the next run.

**Mitigating factors:**
- All four actions are owned by `actions/`, which is the official GitHub Actions organization — a high-value, well-audited target.
- The `deploy.yml` workflow has minimal permissions (`pages: write`, `id-token: write`) and no access to secrets beyond `GITHUB_TOKEN`.
- The `release.yml` workflow only reads the repository and publishes a release artifact — no credentials or secrets are accessed beyond `GITHUB_TOKEN`.
- The build produces a static HTML file with no server-side components.

**Recommendation:**
For a higher security posture, pin each action to its commit SHA, for example:

```yaml
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
```

Tools like [Dependabot](https://docs.github.com/en/code-security/dependabot) or [pin-github-action](https://github.com/mheap/pin-github-action) can automate this.

---

### SEC-04 — Dynamic third-party script injection (dxnews.com calendar widget)

**Severity:** Low
**File:** `src/PropagationDashboard.jsx` — `useEffect` for DX News Calendar

**Description:**
The DX News Calendar section injects an external `<script>` tag from `https://dxnews.com/calendar.php` into `document.head` at runtime when the user opens the section for the first time. Unlike the HamQSL widget (which loads only an image), this script executes arbitrary JavaScript in the page context.

If `dxnews.com` were compromised, the injected script would have full access to the page including `localStorage` keys (`prop_callsign`, `prop_locator`, trend values).

Subresource Integrity (SRI) is not applicable here because `calendar.php` is a dynamic endpoint — the content changes with contest schedule updates, making a stable hash impossible.

**Mitigating factors:**

- The script is only loaded on explicit user interaction (opening the section).
- No sensitive user credentials or authentication tokens are stored in `localStorage` — only callsign, Maidenhead locator, and previous SFI/K-index values.
- An `onerror` handler provides user feedback if the script fails to load.
- The injection uses a `useRef` guard to prevent duplicate script tags.

**Recommendation:**
Accept as a known risk. Consider adding a CSP `script-src` allowlist entry for `dxnews.com` if SEC-02 is ever addressed.

---

## Informational

### INFO-01 — Dependency vulnerability scan

```
$ npm audit
found 0 vulnerabilities
```

All 329 packages in the dependency tree are free of known CVEs as of the audit date.

### INFO-02 — Dependency license review

| License | Count |
|---------|------:|
| MIT | 286 |
| ISC | 22 |
| Apache-2.0 | 8 |
| BSD-2-Clause | 6 |
| BSD-3-Clause | 3 |
| (MIT OR CC0-1.0) | 1 |
| CC-BY-4.0 | 1 |
| Python-2.0 | 1 |

All direct runtime dependencies (`react`, `react-dom`, `lucide-react`) are MIT-licensed. All dev dependencies are also MIT/ISC/Apache-2.0. No GPL or AGPL dependencies are present. The project's own MIT license is compatible with all transitive dependencies.

---

## Areas Confirmed Safe

| Area | Result |
|------|--------|
| XSS — React JSX interpolation | ✅ All external data HTML-escaped by React |
| XSS — XML parsing | ✅ `DOMParser` with `'text/xml'`; values extracted via `.textContent` only |
| XSS — NOAA text | ✅ Rendered inside `<pre>` via React interpolation, never `innerHTML` |
| Sensitive data in code | ✅ No API keys, tokens, or credentials anywhere |
| User data — localStorage | ✅ `localStorage` used for callsign, locator, and trend values; all stored locally only, never transmitted |
| User data — cookies / network | ✅ No cookies; no user data ever sent over the network |
| Mixed content (HTTP/HTTPS) | ✅ All external URLs use HTTPS |
| Inline scripts | ✅ None in `index.html` |
| `dangerouslySetInnerHTML` | ✅ Not used anywhere |
| Timer cleanup | ✅ `setInterval` correctly cleaned up via `useEffect` return |
| Error message injection | ✅ Error state renders `Error.message` via React — no raw HTML |
| External script loading | ✅ None; all assets are Vite-bundled at build time |
| `npm audit` | ✅ 0 vulnerabilities |

---

## Conclusion

The application's client-only, read-only architecture significantly limits the attack surface. The three low-severity findings are accepted risks for the current scope of the project. No immediate action is required; the recommended mitigations can be addressed in a future maintenance release.
