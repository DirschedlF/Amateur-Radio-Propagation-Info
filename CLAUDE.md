# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Amateur Radio Propagation Info** — a browser-based, client-side HF propagation dashboard that fetches live solar and band condition data from HamQSL.com and NOAA SWPC. No server required; all data is fetched directly in the browser.

Current version: see `src/PropagationDashboard.jsx` → `APP_VERSION` constant.

## Technology Stack

- **Framework**: React 18+ (JSX, no TypeScript)
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v3
- **Icons**: Lucide-React

## Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Development server (http://localhost:5173)
npm run build            # Production build → dist/
npm run build:standalone # Single-file HTML build → dist-standalone/index.html
npm run preview          # Preview production build
npm run lint             # ESLint
```

## Architecture

### Single component design

The entire app lives in `src/PropagationDashboard.jsx` (~765 lines), consistent with the sibling DXCC Analyzer Pro pattern. No routing, no additional component files.

Sub-components (defined in the same file, not exported):

| Component | Purpose |
|---|---|
| `MetricCard` | Large metric display (SFI, K, A, SSN) with label, value, sub-label, optional children (KBar) and hover tooltip |
| `InfoPill` | Compact inline metric (Solar Wind, X-Ray, Bz, Proton, Aurora, Geomag, Signal/Noise) with icon, label, value, colour class, and hover tooltip |
| `KBar` | Visual 0–9 gauge bar for K-Index inside MetricCard |
| `CondPill` | Coloured Good/Fair/Poor pill for band conditions table |
| `TrendArrow` | ↑ / ↓ indicator for SFI and K-Index trend (comparing current vs. previous localStorage value) |
| Settings modal | Inline modal for callsign + Maidenhead locator (stored in localStorage) |

### Data sources and CORS handling

**HamQSL** (`https://www.hamqsl.com/solarxml.php`) — XML endpoint, no CORS headers. Strategy:
1. Try direct fetch first (works if user's browser/network allows it)
2. On failure, fall back to the self-hosted Cloudflare Worker at `https://hamqsl-proxy.fritz-a2e.workers.dev`

Worker source: `cloudflare-worker/index.js` (deployed via `wrangler deploy` from `cloudflare-worker/`). The worker adds `Access-Control-Allow-Origin: *` and `Cache-Control: no-store` to ensure fresh data on every request. See `docs/security-audit.md` (SEC-01) for rationale.

**NOAA SWPC** (`https://services.swpc.noaa.gov/text/3-day-forecast.txt`) — plain text, supports CORS; fetched directly.

### Data flow

```
refresh() calls Promise.allSettled([fetchHamQSL(), fetchNoaa()])
  fetchHamQSL() → direct fetch, then proxy fallback → parseHamQSL(xml) → solar state
  fetchNoaa()   → direct fetch → noaa string state
Auto-refresh every 15 minutes (AUTO_REFRESH = 15 * 60 * 1000) via setInterval

On each refresh:
  - SFI/K-Index trend computed by comparing new values against localStorage keys
    (prop_prev_sfi, prop_prev_kindex)
  - Storm banner auto-resets (stormDismissed = false) so it reappears if conditions persist
```

### HamQSL band groups

HamQSL provides one condition per group (day + night). The `BANDS` array has 4 entries, each representing a merged pair:

| Display name | HamQSL group |
|---|---|
| 80 / 40m | `80m-40m` |
| 30 / 20m | `30m-20m` |
| 17 / 15m | `17m-15m` |
| 12 / 10m | `12m-10m` |

### Colour-coding helpers

`sfiStyle()`, `kStyle()`, `aStyle()` each return `{ card, value, sub, bar?, label }` with complete Tailwind class strings for `MetricCard`. `condStyle()` handles `Good` / `Fair` / `Poor` band condition values and returns `{ pill, dot, label }` for `CondPill`. `bzStyle()`, `protonStyle()`, `auroraStyle()` each return `{ label, cls }` for the `InfoPill` `valueClass` prop.

**All class strings must be complete** (no dynamic construction like `bg-${color}-500`) for Tailwind JIT purging to work.

### Constants

| Constant | Value / Purpose |
|---|---|
| `APP_VERSION` | Current version string (displayed in header) |
| `HAMQSL_URL` | `https://www.hamqsl.com/solarxml.php` |
| `HAMQSL_PROXY` | `https://hamqsl-proxy.fritz-a2e.workers.dev` |
| `NOAA_URL` | `https://services.swpc.noaa.gov/text/3-day-forecast.txt` |
| `AUTO_REFRESH` | `15 * 60 * 1000` (15 minutes) |
| `PROP_LINKS` | Array of 6 external propagation tools (DR2W, VOACAP, Proppy, NOAA, QSL.net, DXView) |
| `DX_LINKS` | Array of 14 external DX resources (DX World, NG3K, 425 DX News, DXHeat, DXMAPS, Club Log, Holy Cluster, DXWatch, HA8TKS, 73 QRZ, OpenHamClock, DX Contest Monitor, DXCC Analyzer Pro, Propagation-Reports) |

### localStorage keys

| Key | Purpose |
|---|---|
| `prop_callsign` | User callsign (settings modal) |
| `prop_locator` | Maidenhead locator (settings modal, used to personalise DXView link) |
| `prop_prev_sfi` | Previous SFI value (for trend arrow calculation) |
| `prop_prev_kindex` | Previous K-Index value (for trend arrow calculation) |

## Features

### Solar Indices (MetricCards)
- SFI with colour-coded rating and trend arrow
- K-Index with 0–9 gauge bar and trend arrow
- A-Index, Sunspot Number (SSN)

### Secondary Metrics (InfoPills)
- Solar Wind (km/s), X-Ray flux, Geomagnetic field, Signal/Noise level
- Magnetfeld Bz (colour-coded by storm risk)
- Proton flux (with NOAA S-scale S1–S4+)
- Aurora activity (0–9 with Aktiv/Sturm indicator)

All MetricCards and InfoPills have hover tooltips with amateur-radio-relevant explanations.

### Geomagnetic Storm Banner
Dismissable red banner when K ≥ 5, showing NOAA G-scale (G1–G5). Resets on each auto-refresh.

### Band Conditions Table
Good/Fair/Poor for 80/40m, 30/20m, 17/15m, 12/10m (day + night).

### Collapsible Sections
Each section toggles via header click:
- HamQSL Solar Widget (hamqsl.com banner image)
- Propagation Links (6 external tools, DXView link personalised via locator)
- DX Information Links (14 external resources)
- DX News Calendar (dxnews.com, loaded on-demand via script injection)
- NOAA 3-Day Forecast (plain text from SWPC)

### Settings Modal
Gear icon → modal with callsign + Maidenhead locator fields. Saved to localStorage, used to personalise the DXView HF Perspective link via `resolveLinks()`.

### Auto-Refresh
Every 15 minutes via `setInterval`. Manual refresh button always available. Loading skeleton shown during fetch.

### Standalone build
`npm run build:standalone` uses `vite-plugin-singlefile` to produce `dist-standalone/index.html` — a fully self-contained file for GitHub Releases distribution.

## CI/CD

### GitHub Pages deploy (`.github/workflows/deploy.yml`)
- Trigger: push to `master`
- Build: `npm run build` → `dist/`
- Deploy: GitHub Pages via `actions/deploy-pages@v4`
- Live URL: `https://dirschedlf.github.io/Amateur-Radio-Propagation-Info/`

### Release workflow (`.github/workflows/release.yml`)
- Trigger: tag `v*.*.*`
- Build: `npm run build:standalone` → single HTML file
- Publish: `gh release create` with standalone HTML as asset

### Version bump checklist
When bumping version, update these files:
1. `src/PropagationDashboard.jsx` → `APP_VERSION` constant
2. `package.json` → `version` field
3. `package-lock.json` → `version` (both root and packages."")
4. `README.md` → version badge line

## Sibling project reference

`D:\!GitHub\Amateur Radio DXCC Analyzer Pro\` — same stack, more complex. Its `CLAUDE.md` documents patterns for builds, component structure, and export features.
