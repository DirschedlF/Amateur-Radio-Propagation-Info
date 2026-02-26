# Amateur Radio Propagation Info

**Version 1.0.2**

A lightweight, browser-based dashboard for real-time HF propagation conditions — solar indices, band conditions, and NOAA space weather forecast. All data is fetched directly in the browser; no server, no registration, no data collection.

**Developed by Fritz (DK9RC)**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f?logo=github)](https://dirschedlf.github.io/Amateur-Radio-Propagation-Info/)
[![Latest Release](https://img.shields.io/github/v/release/DirschedlF/Amateur-Radio-Propagation-Info?label=Download&color=blue)](https://github.com/DirschedlF/Amateur-Radio-Propagation-Info/releases/latest)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)

---

## Live Demo

**[→ dirschedlf.github.io/Amateur-Radio-Propagation-Info](https://dirschedlf.github.io/Amateur-Radio-Propagation-Info/)**

Or download the standalone HTML file from the [Releases](https://github.com/DirschedlF/Amateur-Radio-Propagation-Info/releases/latest) page and open it locally — no installation needed.

---

![Screenshot](doc/screenshot.png)

---

## Features

### Solar Indices
- **Solar Flux Index (SFI)** — with colour-coded quality rating (Sehr niedrig → Exzellent)
- **K-Index** — geomagnetic activity with visual 0–9 gauge bar (Excellent → Storm G2+)
- **A-Index** — daily geomagnetic index (Ruhig → Sturm)
- **Sunspot Number (SSN)**
- **Solar Wind** speed (km/s), **X-Ray** flux, **Geomagnetic field**, **Signal/Noise** level

### Band Conditions
Colour-coded **Good / Fair / Poor** table for 80m through 10m, split into **Day** and **Night** conditions — exactly as provided by HamQSL's calculated conditions engine.

| Band | Day | Night |
|------|-----|-------|
| 80m · 40m | 🟢 / 🟡 / 🔴 | 🟢 / 🟡 / 🔴 |
| 30m · 20m | … | … |
| 17m · 15m | … | … |
| 12m · 10m | … | … |

### NOAA 3-Day Space Weather Forecast
Full text forecast from NOAA SWPC, collapsible in the UI.

### Auto-Refresh
Data refreshes automatically every **15 minutes**. Manual refresh always available.

### Standalone Distribution
Build a fully self-contained single HTML file — no dependencies, no internet connection required after opening (except to fetch live data).

---

## Data Sources

| Source | URL | Content |
|--------|-----|---------|
| **HamQSL.com** | `hamqsl.com/solarxml.php` | Solar indices + band conditions (XML) |
| **NOAA SWPC** | `services.swpc.noaa.gov` | 3-day space weather forecast (plain text) |

> **Note on CORS:** HamQSL does not send CORS headers. The app tries a direct fetch first; if blocked by the browser, it falls back automatically to [corsproxy.io](https://corsproxy.io/).

---

## Getting Started

### Try the live demo

Open **[dirschedlf.github.io/Amateur-Radio-Propagation-Info](https://dirschedlf.github.io/Amateur-Radio-Propagation-Info/)** — deployed automatically from the `master` branch via GitHub Actions.

### Download the standalone file

Download `propagation-info-vX.X.X-standalone.html` from the [Releases](https://github.com/DirschedlF/Amateur-Radio-Propagation-Info/releases/latest) page and open it directly in any modern browser — no installation, no server needed. A new release file is created automatically when a version tag is pushed.

### Run locally (development)

```bash
git clone https://github.com/DirschedlF/Amateur-Radio-Propagation-Info.git
cd Amateur-Radio-Propagation-Info
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build for production

```bash
npm run build            # → dist/
npm run build:standalone # → dist-standalone/index.html  (single self-contained file)
```

---

## Tech Stack

- [React 18](https://react.dev/) — UI framework
- [Vite](https://vitejs.dev/) — build tool
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Lucide React](https://lucide.dev/) — icons
- [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) — standalone HTML build

---

## Related Projects

- [Amateur Radio DXCC Analyzer Pro](https://github.com/DirschedlF/Amateur-Radio-DXCC-Analyzer-Pro) — ADIF logbook analyzer for DXCC tracking

---

## License

MIT — see [LICENSE](LICENSE)
