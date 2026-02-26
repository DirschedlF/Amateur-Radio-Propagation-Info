# Design: Trend-Pfeile, Sturm-Banner, Einstellungen (v1.2.0)

**Datum:** 2026-02-26
**Status:** Genehmigt

## Scope

Drei unabhängige Features, alle in `src/PropagationDashboard.jsx`:

1. **Trend-Pfeile** auf SFI und K-Index
2. **Geomagnetsturm-Banner** (dismissable)
3. **Einstellungen-Modal** mit Rufzeichen + Locator

---

## Feature 1: Trend-Pfeile

### Ziel
SFI und K-Index zeigen einen Pfeil (`↑` / `↓` / `→`) der den Trend gegenüber dem letzten Abruf anzeigt.

### Datenfluss
- Nach erfolgreichem Fetch: aktuellen `solarflux` und `kindex` mit `localStorage.getItem('prop_prev_sfi')` / `prop_prev_kindex` vergleichen
- Trend bestimmen: `'up'` wenn neuer Wert > alter Wert, `'down'` wenn kleiner, `'same'` wenn gleich
- Neue Werte danach in localStorage speichern
- Beim ersten Aufruf (kein Vorwert): `null` → kein Pfeil

### Komponente `TrendArrow`
```jsx
function TrendArrow({ trend }) {
  if (!trend || trend === 'same') return null
  return trend === 'up'
    ? <span className="text-green-400 text-sm font-bold">↑</span>
    : <span className="text-red-400 text-sm font-bold">↓</span>
}
```

### Platzierung
Im Label-Bereich der `MetricCard` für SFI und K-Index, klein neben dem Titel.

---

## Feature 2: Sturm-Banner

### Ziel
Prominenter roter Banner wenn K-Index ≥ 5, vom Nutzer schließbar.

### State
- `stormDismissed` (boolean, initialer Wert `false`)
- Wird bei jedem `refresh()`-Aufruf auf `false` zurückgesetzt

### Anzeige-Logik
```
!stormDismissed && parseInt(ki) >= 5
```

### G-Skala
```
K=5 → G1, K=6 → G2, K=7 → G3, K=8 → G4, K=9 → G5
```
Formel: `G = K - 4`

### Aussehen
- Roter Banner, ähnlich dem Fehler-Banner
- Icon: `⚡` oder `AlertTriangle` (Lucide)
- Text: `"Geomagnetsturm G{n} aktiv (K={k}) — HF-Ausbreitung stark gestört"`
- `×`-Button rechts zum Schließen
- Positionierung: über dem Fehler-Banner

---

## Feature 3: Einstellungen-Modal

### State
- `showSettings` (boolean)
- `callsign` — initialisiert aus `localStorage.getItem('prop_callsign') ?? ''`
- `locator` — initialisiert aus `localStorage.getItem('prop_locator') ?? ''`
- `draftCallsign`, `draftLocator` — temporäre Werte während das Modal offen ist

### Header-Icon
`Settings`-Icon aus Lucide, links vom Refresh-Button, `onClick={() => setShowSettings(true)}`

### Modal-Struktur
- Dunkles Overlay (`fixed inset-0 bg-black/60 backdrop-blur-sm z-50`)
- Zentrierte weiße/dunkle Card
- Titel: "Einstellungen"
- Feld 1: "Rufzeichen" (text input, uppercase)
- Feld 2: "Maidenhead-Locator" (text input, uppercase, max 6 Zeichen)
- Buttons: "Speichern" (primary) + "Abbrechen"

### Speicher-Logik
Bei "Speichern": `localStorage.setItem('prop_callsign', draftCallsign.toUpperCase())` und `prop_locator` analog, dann State updaten und Modal schließen.

### Locator in Links
`PROP_LINKS` wird zur Laufzeit transformiert: DXView-URL enthält `JN58TC` (Hardcode) → wird durch `locator` ersetzt wenn `locator.length >= 4`.

```js
function resolveLinks(locator) {
  if (!locator || locator.length < 4) return PROP_LINKS
  return PROP_LINKS.map(l => ({
    ...l,
    url: l.url.replace('JN58TC', locator.toUpperCase()),
  }))
}
```

---

## Architektur-Entscheidungen

- **Keine neuen Abhängigkeiten** — alles mit React + Lucide (bereits vorhanden)
- **Kein Refactoring** — bleibt Single-Component, Muster des Projekts beibehalten
- **localStorage-Keys:** `prop_prev_sfi`, `prop_prev_kindex`, `prop_callsign`, `prop_locator`

---

## Nicht im Scope (bewusst ausgelassen)

- Trend für A-Index oder Sunspots
- Locator-Validierung (nur einfaches `length >= 4`)
- Rufzeichen-Verwendung über Speicherung hinaus (Basis für spätere Features)
