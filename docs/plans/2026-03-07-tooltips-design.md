# Design: Hover-Tooltips für MetricCards und InfoPills

**Date:** 2026-03-07
**Status:** Approved

## Summary

Add amateur-radio-relevant hover tooltips to all `MetricCard` and `InfoPill` components using Tailwind CSS `group`/`group-hover` — no JS, no new state.

## Approach

Each component receives an optional `tooltip` string prop. When set, the wrapper gets `group relative` and a hidden tooltip div is appended inside, shown via `group-hover:visible group-hover:opacity-100`.

## Component Changes

### `MetricCard`

```jsx
function MetricCard({ label, value, style: s, tooltip, children }) {
  return (
    <div className={`group relative rounded-xl p-5 border border-gray-800 ${s.card}`}>
      {tooltip && (
        <div className="pointer-events-none invisible opacity-0 group-hover:visible
                        group-hover:opacity-100 transition-opacity duration-150
                        absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30
                        w-60 px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700
                        text-xs text-gray-300 leading-relaxed shadow-xl">
          {tooltip}
        </div>
      )}
      <div className="text-[11px] font-medium text-gray-500 mb-2 uppercase tracking-wider">{label}</div>
      <div className={`text-4xl font-bold tracking-tight ${s.value}`}>{value}</div>
      <div className={`text-xs mt-1.5 font-medium ${s.sub}`}>{s.label}</div>
      {children}
    </div>
  )
}
```

### `InfoPill`

```jsx
function InfoPill({ icon, label, value, valueClass, tooltip }) {
  return (
    <div className="group relative bg-gray-900 rounded-lg px-4 py-3 border border-gray-800 flex items-center gap-3">
      {tooltip && (
        <div className="pointer-events-none invisible opacity-0 group-hover:visible
                        group-hover:opacity-100 transition-opacity duration-150
                        absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30
                        w-60 px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700
                        text-xs text-gray-300 leading-relaxed shadow-xl">
          {tooltip}
        </div>
      )}
      <span className="text-xl leading-none">{icon}</span>
      <div>
        <div className="text-[11px] text-gray-500 leading-none mb-1">{label}</div>
        <div className={`text-sm font-semibold ${valueClass ?? 'text-gray-200'}`}>{value}</div>
      </div>
    </div>
  )
}
```

## Tooltip Texts (11 entries)

| Prop call site | Text |
|---|---|
| SFI MetricCard | `Solar Flux Index — Maß für solare UV/EUV-Strahlung. >150: sehr gute DX-Bedingungen auf 17–10m. <80: hohe Bänder kaum nutzbar.` |
| K-Index MetricCard | `Geomagnetischer Störungsindex (0–9), 3h-Mittel. ≤2: ideal. ≥5: Sturm G1+ — HF gestört, Polrouten besonders betroffen.` |
| A-Index MetricCard | `Täglicher Aktivitätsindex (Tagesmittel des K). 0–7: ruhig. >29: gestört. Guter Langzeitindikator für die Ausbreitungslage.` |
| SSN MetricCard | `Sonnenfleckenzahl. Mehr Flecken = mehr UV = bessere Ionosphäre. Im Zyklus-Maximum sind 17–10m auch nachts offen.` |
| Solarwind InfoPill | `Sonnenwindgeschwindigkeit. >500 km/s kann K-Index anheben und geomagnetische Störungen auslösen.` |
| X-Ray InfoPill | `Röntgenfluss. B/C: normal. M-Klasse: Funkaustausch möglich. X-Klasse: Kurzwellenausfall (SWF) auf der Tagseite möglich.` |
| Geomagnetisch InfoPill | `Zustand des Erdmagnetfeldes. Quiet/Unsettled: DX-freundlich. Active/Storm: Ausbreitung gestört, bes. auf Polrouten.` |
| Signal/Rauschen InfoPill | `KW-Rauschen S1–S9+. S1 = sehr ruhig (DX-freundlich). S9 = starkes Rauschen. Wichtig für Schwachlicht-DX (CW/FT8).` |
| Magnetfeld Bz InfoPill | `Interplanetare Bz-Komponente. Negativ = südwärts = Energie in die Magnetosphäre. <−10 nT: Sturmgefahr steigt stark.` |
| Protonenfluss InfoPill | `Hochenergetische Protonen. ≥10 pfu = S1-Ereignis — Polrouten auf KW gedämpft. X-Klasse-Eruptionen als Auslöser.` |
| Aurora InfoPill | `Polarlicht-Intensität (0–9). Stört HF-Polrouten. Auf 2m/70cm: Aurora-Scatter-DX möglich bei Werten ≥4.` |

## File

Single file: `src/PropagationDashboard.jsx`
