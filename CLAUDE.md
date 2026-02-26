# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Amateur Radio Propagation Info** — a browser-based, client-side HF propagation dashboard that fetches live solar and band condition data from HamQSL.com and NOAA SWPC. No server required; all data is fetched directly in the browser.

## Technology Stack

- **Framework**: React 18+ (JSX, no TypeScript)
- **Build Tool**: Vite
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
The entire app lives in `src/PropagationDashboard.jsx` (~300 lines), consistent with the sibling DXCC Analyzer Pro pattern. No routing, no additional component files.

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
Auto-refresh every 15 minutes via setInterval
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

`sfiStyle()`, `kStyle()`, `aStyle()` each return `{ card, value, sub, bar?, label }` with complete Tailwind class strings. `condStyle()` handles `Good` / `Fair` / `Poor` band condition values. `bzStyle()`, `protonStyle()`, `auroraStyle()` each return `{ label, cls }` for the `InfoPill` `valueClass` prop. **All class strings must be complete** (no dynamic construction like `bg-${color}-500`) for Tailwind JIT purging to work.

### Standalone build

`npm run build:standalone` uses `vite-plugin-singlefile` to produce `dist-standalone/index.html` — a fully self-contained file for GitHub Releases distribution.

## Sibling project reference

`D:\!GitHub\Amateur Radio DXCC Analyzer Pro\` — same stack, more complex. Its `CLAUDE.md` documents patterns for builds, component structure, and export features.
