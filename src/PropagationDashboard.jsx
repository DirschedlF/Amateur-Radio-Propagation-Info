import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Radio, AlertCircle, ChevronDown, ChevronUp, Settings } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const APP_VERSION  = '1.1.0'
const HAMQSL_URL   = 'https://www.hamqsl.com/solarxml.php'
const HAMQSL_PROXY = 'https://hamqsl-proxy.fritz-a2e.workers.dev'
const NOAA_URL     = 'https://services.swpc.noaa.gov/text/3-day-forecast.txt'
const AUTO_REFRESH = 15 * 60 * 1000 // 15 minutes

const PROP_LINKS = [
  { name: 'DR2W DX Propagation',         desc: 'Europa · 10m · Live-Karte',          url: 'https://propagation.dr2w.de/dxprop.php?area=europe&band=10M&mode=1&time=utc' },
  { name: 'VOACAP HF Prediction',        desc: 'Point-to-Point HF-Vorhersage',       url: 'https://www.voacap.com/hf/' },
  { name: 'Proppy',                      desc: 'HF-Ausbreitungsprognose (Area)',      url: 'https://soundbytes.asia/proppy/area' },
  { name: 'NOAA Space Weather Dashboard',desc: 'Echtzeit-Weltraumwetter (NOAA)',      url: 'https://www.spaceweather.gov/communities/space-weather-enthusiasts-dashboard' },
  { name: 'QSL.net Propagation',         desc: 'DX-Ausbreitung & Ressourcen',        url: 'https://dx.qsl.net/propagation/index.html' },
  { name: 'DXView HF Perspective',       desc: 'Greyline & Bänder · JN58TC',         url: 'https://hf.dxview.org/perspective/JN58TC' },
]
function resolveLinks(locator) {
  if (!locator || locator.length < 4) return PROP_LINKS
  return PROP_LINKS.map(l => ({
    ...l,
    url: l.url.replace('JN58TC', locator.toUpperCase()),
  }))
}

// Bands with their HamQSL group name.
// HamQSL provides one condition per group (day + night), shared by the bands in it.
const BANDS = [
  { name: '80 / 40m', group: '80m-40m' },
  { name: '30 / 20m', group: '30m-20m' },
  { name: '17 / 15m', group: '17m-15m' },
  { name: '12 / 10m', group: '12m-10m' },
]

// ─── Rating / colour helpers ──────────────────────────────────────────────────

function condStyle(cond) {
  const c = (cond || '').toLowerCase().trim()
  if (c === 'good') return { pill: 'bg-green-900/60 text-green-300 ring-1 ring-green-700', dot: 'bg-green-400', label: 'Good' }
  if (c === 'fair') return { pill: 'bg-amber-900/60 text-amber-300 ring-1 ring-amber-700', dot: 'bg-amber-400', label: 'Fair' }
  if (c === 'poor') return { pill: 'bg-red-900/60 text-red-300 ring-1 ring-red-700',       dot: 'bg-red-400',   label: 'Poor' }
  return               { pill: 'bg-gray-800 text-gray-500 ring-1 ring-gray-700',            dot: 'bg-gray-600', label: cond || '?' }
}

function sfiStyle(v) {
  const n = parseInt(v)
  if (isNaN(n)) return { card: 'bg-gray-900',        value: 'text-gray-400',    sub: 'text-gray-500',    label: '—' }
  if (n >= 200)  return { card: 'bg-emerald-950/50', value: 'text-emerald-300', sub: 'text-emerald-500', label: 'Exzellent' }
  if (n >= 150)  return { card: 'bg-green-950/50',   value: 'text-green-300',   sub: 'text-green-500',   label: 'Sehr gut' }
  if (n >= 120)  return { card: 'bg-teal-950/50',    value: 'text-teal-300',    sub: 'text-teal-500',    label: 'Gut' }
  if (n >= 90)   return { card: 'bg-amber-950/50',   value: 'text-amber-300',   sub: 'text-amber-500',   label: 'Mittel' }
  if (n >= 70)   return { card: 'bg-orange-950/50',  value: 'text-orange-300',  sub: 'text-orange-500',  label: 'Niedrig' }
  return               { card: 'bg-red-950/50',      value: 'text-red-300',     sub: 'text-red-500',     label: 'Sehr niedrig' }
}

function kStyle(v) {
  const n = parseInt(v)
  if (isNaN(n)) return { card: 'bg-gray-900',        value: 'text-gray-400',    sub: 'text-gray-500',    bar: 'bg-gray-600',    label: '—' }
  if (n <= 1)   return { card: 'bg-green-950/50',    value: 'text-green-300',   sub: 'text-green-500',   bar: 'bg-green-500',   label: 'Excellent' }
  if (n <= 3)   return { card: 'bg-amber-950/50',    value: 'text-amber-300',   sub: 'text-amber-500',   bar: 'bg-amber-400',   label: 'Good / Fair' }
  if (n === 4)  return { card: 'bg-orange-950/50',   value: 'text-orange-300',  sub: 'text-orange-500',  bar: 'bg-orange-500',  label: 'Poor' }
  if (n === 5)  return { card: 'bg-red-950/50',      value: 'text-red-300',     sub: 'text-red-500',     bar: 'bg-red-500',     label: 'Storm G1' }
  return              { card: 'bg-red-950/70',       value: 'text-red-200',     sub: 'text-red-400',     bar: 'bg-red-700',     label: `Storm G${n - 4}+` }
}

function aStyle(v) {
  const n = parseInt(v)
  if (isNaN(n)) return { card: 'bg-gray-900',        value: 'text-gray-400',    sub: 'text-gray-500',    label: '—' }
  if (n <= 7)   return { card: 'bg-green-950/50',    value: 'text-green-300',   sub: 'text-green-500',   label: 'Ruhig' }
  if (n <= 15)  return { card: 'bg-amber-950/50',    value: 'text-amber-300',   sub: 'text-amber-500',   label: 'Leicht unruhig' }
  if (n <= 29)  return { card: 'bg-orange-950/50',   value: 'text-orange-300',  sub: 'text-orange-500',  label: 'Unruhig' }
  if (n <= 49)  return { card: 'bg-red-950/50',      value: 'text-red-300',     sub: 'text-red-500',     label: 'Aktiv' }
  return              { card: 'bg-red-950/70',       value: 'text-red-200',     sub: 'text-red-400',     label: 'Sturm' }
}

// Interplanetary Bz: negative (southward) promotes geomagnetic storms
function bzStyle(v) {
  const n   = parseFloat(v)
  const fmt = isNaN(n) ? '?' : (n > 0 ? `+${n}` : `${n}`)
  if (isNaN(n) || n >= 0) return { label: `${fmt} nT`, cls: 'text-gray-200' }
  if (n >= -10)           return { label: `${fmt} nT`, cls: 'text-amber-300' }
  return                         { label: `${fmt} nT`, cls: 'text-red-300' }
}

// Proton flux — NOAA S-scale: S1 ≥ 10 pfu, S2 ≥ 100, S3 ≥ 1000, S4 ≥ 10000
function protonStyle(v) {
  const n = parseFloat(v)
  if (isNaN(n) || n < 10)  return { label: `${v} pfu`,      cls: 'text-gray-200' }
  if (n < 100)             return { label: `${v} pfu · S1`, cls: 'text-amber-300' }
  if (n < 1000)            return { label: `${v} pfu · S2`, cls: 'text-orange-300' }
  if (n < 10000)           return { label: `${v} pfu · S3`, cls: 'text-red-300' }
  return                          { label: `${v} pfu · S4+`, cls: 'text-red-200' }
}

// Aurora activity (0–9 scale from HamQSL)
function auroraStyle(v) {
  const n = parseInt(v)
  if (isNaN(n)) return { label: '?',              cls: 'text-gray-200' }
  if (n <= 2)   return { label: `${n} / 9`,       cls: 'text-gray-200' }
  if (n <= 4)   return { label: `${n} / 9 Aktiv`, cls: 'text-amber-300' }
  return               { label: `${n} / 9 Sturm`, cls: 'text-red-300' }
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchHamQSL() {
  let text
  try {
    const r = await fetch(HAMQSL_URL)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    text = await r.text()
  } catch {
    // HamQSL has no CORS headers — fall back to our Cloudflare Worker proxy
    const r = await fetch(HAMQSL_PROXY)
    if (!r.ok) throw new Error(`Proxy HTTP ${r.status}`)
    text = await r.text()
  }
  return parseHamQSL(text)
}

function parseHamQSL(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const sd  = doc.querySelector('solardata')
  if (!sd) throw new Error('Ungültiges HamQSL-XML')

  const get = tag => sd.querySelector(tag)?.textContent?.trim() ?? '?'
  const data = {
    updated:       get('updated'),
    solarflux:     get('solarflux'),
    aindex:        get('aindex'),
    kindex:        get('kindex'),
    xray:          get('xray'),
    sunspots:      get('sunspots'),
    solarwind:     get('solarwind'),
    magneticfield: get('magneticfield'),
    geomagfield:   get('geomagfield'),
    signalnoise:   get('signalnoise'),
    protonflux:    get('protonflux'),
    aurora:        get('aurora'),
    bands: {},
  }

  sd.querySelectorAll('calculatedconditions band').forEach(el => {
    const name = el.getAttribute('name')
    const time = el.getAttribute('time')
    const cond = el.textContent?.trim() ?? '?'
    if (!data.bands[name]) data.bands[name] = {}
    data.bands[name][time] = cond
  })

  return data
}

async function fetchNoaa() {
  try {
    const r = await fetch(NOAA_URL)
    if (!r.ok) return '(NOAA-Prognose nicht verfügbar)'
    const text  = await r.text()
    const lines = text.split('\n')
    let started = false
    const out   = []
    for (const line of lines) {
      if (line.startsWith(':Product:')) started = true
      if (!started) continue
      if (line.startsWith(':') || line.startsWith('#')) continue
      out.push(line)
    }
    return out.join('\n').trim()
  } catch {
    return '(NOAA-Prognose nicht verfügbar)'
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CondPill({ cond }) {
  const s = condStyle(cond)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function KBar({ value }) {
  const k = Math.max(0, Math.min(9, parseInt(value) || 0))
  const s = kStyle(value)
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] text-gray-600 mb-1 font-mono select-none">
        <span>0</span><span>3</span><span>5</span><span>9</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${s.bar}`}
          style={{ width: `${Math.max(3, k / 9 * 100)}%` }}
        />
      </div>
    </div>
  )
}

function MetricCard({ label, value, style: s, children }) {
  return (
    <div className={`rounded-xl p-5 border border-gray-800 ${s.card}`}>
      <div className="text-[11px] font-medium text-gray-500 mb-2 uppercase tracking-wider">{label}</div>
      <div className={`text-4xl font-bold tracking-tight ${s.value}`}>{value}</div>
      <div className={`text-xs mt-1.5 font-medium ${s.sub}`}>{s.label}</div>
      {children}
    </div>
  )
}

function InfoPill({ icon, label, value, valueClass }) {
  return (
    <div className="bg-gray-900 rounded-lg px-4 py-3 border border-gray-800 flex items-center gap-3">
      <span className="text-xl leading-none">{icon}</span>
      <div>
        <div className="text-[11px] text-gray-500 leading-none mb-1">{label}</div>
        <div className={`text-sm font-semibold ${valueClass ?? 'text-gray-200'}`}>{value}</div>
      </div>
    </div>
  )
}

function TrendArrow({ trend }) {
  if (!trend || trend === 'same') return null
  return trend === 'up'
    ? <span className="text-green-400 text-xs font-bold ml-1">↑</span>
    : <span className="text-red-400 text-xs font-bold ml-1">↓</span>
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PropagationDashboard() {
  const [solar,       setSolar]       = useState(null)
  const [noaa,        setNoaa]        = useState('')
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showNoaa,    setShowNoaa]    = useState(false)
  const [showWidget,  setShowWidget]  = useState(false)
  const [showLinks,   setShowLinks]   = useState(false)
  const [sfiTrend,    setSfiTrend]    = useState(null)
  const [kTrend,      setKTrend]      = useState(null)
  const [stormDismissed, setStormDismissed] = useState(false)
  const [showSettings,  setShowSettings]  = useState(false)
  const [callsign,      setCallsign]      = useState(() => localStorage.getItem('prop_callsign')  ?? '')
  const [locator,       setLocator]       = useState(() => localStorage.getItem('prop_locator')   ?? '')
  const [draftCallsign, setDraftCallsign] = useState('')
  const [draftLocator,  setDraftLocator]  = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStormDismissed(false)
    try {
      const [solarResult, noaaResult] = await Promise.allSettled([
        fetchHamQSL(),
        fetchNoaa(),
      ])
      if (solarResult.status === 'fulfilled') {
        setSolar(solarResult.value)
        setLastUpdated(new Date())
        // Trend-Berechnung
        const newSfi = parseInt(solarResult.value.solarflux)
        const newKi  = parseInt(solarResult.value.kindex)
        const oldSfi = parseInt(localStorage.getItem('prop_prev_sfi'))
        const oldKi  = parseInt(localStorage.getItem('prop_prev_kindex'))

        if (!isNaN(newSfi) && !isNaN(oldSfi)) {
          setSfiTrend(newSfi > oldSfi ? 'up' : newSfi < oldSfi ? 'down' : 'same')
        }
        if (!isNaN(newKi) && !isNaN(oldKi)) {
          setKTrend(newKi > oldKi ? 'up' : newKi < oldKi ? 'down' : 'same')
        }
        if (!isNaN(newSfi)) localStorage.setItem('prop_prev_sfi',    String(newSfi))
        if (!isNaN(newKi))  localStorage.setItem('prop_prev_kindex', String(newKi))
      } else {
        setError(`HamQSL: ${solarResult.reason?.message ?? 'Unbekannter Fehler'}`)
        setSfiTrend(null)
        setKTrend(null)
      }
      if (noaaResult.status === 'fulfilled') {
        setNoaa(noaaResult.value)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const openSettings = useCallback(() => {
    setDraftCallsign(callsign)
    setDraftLocator(locator)
    setShowSettings(true)
  }, [callsign, locator])

  const saveSettings = useCallback(() => {
    const cs  = draftCallsign.toUpperCase().trim()
    const loc = draftLocator.toUpperCase().trim()
    setCallsign(cs)
    setLocator(loc)
    localStorage.setItem('prop_callsign', cs)
    localStorage.setItem('prop_locator',  loc)
    setShowSettings(false)
  }, [draftCallsign, draftLocator])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, AUTO_REFRESH)
    return () => clearInterval(id)
  }, [refresh])

  const sfi    = solar?.solarflux    ?? '?'
  const ki     = solar?.kindex       ?? '?'
  const ai     = solar?.aindex       ?? '?'
  const bz     = bzStyle(solar?.magneticfield)
  const proton = protonStyle(solar?.protonflux)
  const aur    = auroraStyle(solar?.aurora)
  const kiNum     = parseInt(ki)
  const stormG    = kiNum >= 5 ? kiNum - 4 : 0
  const showStorm = !stormDismissed && stormG > 0

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm sm:text-base">HF-Ausbreitungsbedingungen</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono border border-blue-800/50 hidden sm:inline">v{APP_VERSION}</span>
              </div>
              <span className="hidden sm:block text-gray-500 text-xs">HamQSL + NOAA</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500 hidden sm:block tabular-nums">
                Stand: {lastUpdated.toLocaleTimeString('de-DE')} Uhr
              </span>
            )}
            <button
              onClick={openSettings}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
              aria-label="Einstellungen"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── Sturm-Banner ── */}
        {showStorm && (
          <div className="flex items-start gap-3 bg-red-950/70 border border-red-700 rounded-xl p-4">
            <span className="text-red-400 text-xl leading-none shrink-0">⚡</span>
            <div className="flex-1">
              <p className="text-sm text-red-200 font-semibold">
                Geomagnetsturm G{stormG} aktiv (K={ki}) — HF-Ausbreitung stark gestört
              </p>
              <p className="text-xs text-red-400 mt-0.5">
                Hohe Bänder (17–10 m) sind wahrscheinlich gestört. Tiefere Bänder prüfen.
              </p>
            </div>
            <button
              onClick={() => setStormDismissed(true)}
              className="text-red-400 hover:text-red-200 transition-colors shrink-0 text-lg leading-none"
              aria-label="Banner schließen"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Error banner ── */}
        {error && (
          <div className="flex gap-3 bg-red-950/50 border border-red-800 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 font-medium">Datenabruf fehlgeschlagen</p>
              <p className="text-xs text-red-400 mt-1 font-mono">{error}</p>
            </div>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && !solar && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl h-32 animate-pulse border border-gray-800" />
            ))}
          </div>
        )}

        {solar && (
          <>
            {/* Data timestamp from HamQSL */}
            <p className="text-right text-[11px] text-gray-600">
              Datenstand: {solar.updated}
            </p>

            {/* ── Primary solar indices ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label={<span>Solar Flux (SFI) <TrendArrow trend={sfiTrend} /></span>}
                value={sfi}
                style={sfiStyle(sfi)}
              />
              <MetricCard
                label={<span>K-Index (Geomag) <TrendArrow trend={kTrend} /></span>}
                value={ki}
                style={kStyle(ki)}
              >
                <KBar value={ki} />
              </MetricCard>
              <MetricCard label="A-Index"          value={ai}  style={aStyle(ai)} />
              <MetricCard
                label="Sonnenflecken"
                value={solar.sunspots}
                style={{ card: 'bg-indigo-950/40', value: 'text-indigo-300', sub: 'text-indigo-500', label: 'SSN' }}
              />
            </div>

            {/* ── Secondary metrics ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoPill icon="💨" label="Solarwind"         value={`${solar.solarwind} km/s`} />
              <InfoPill icon="☢️" label="X-Ray"             value={solar.xray} />
              <InfoPill icon="🧲" label="Geomagnetisch"     value={solar.geomagfield} />
              <InfoPill icon="📻" label="Signal / Rauschen" value={solar.signalnoise} />
              <InfoPill icon="↕️" label="Magnetfeld Bz"     value={bz.label}     valueClass={bz.cls} />
              <InfoPill icon="⚡" label="Protonenfluss"     value={proton.label} valueClass={proton.cls} />
              <InfoPill icon="🌌" label="Aurora"            value={aur.label}    valueClass={aur.cls} />
            </div>

            {/* ── Band conditions table ── */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-800">
                <h2 className="font-semibold text-gray-100">Bandbedingungen</h2>
                <p className="text-xs text-gray-500 mt-0.5">Berechnet von HamQSL</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Band</th>
                    <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">☀️ Tag</th>
                    <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">🌙 Nacht</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-600 uppercase tracking-wider hidden sm:table-cell">Gruppe</th>
                  </tr>
                </thead>
                <tbody>
                  {BANDS.map(({ name, group }) => (
                    <tr
                      key={name}
                      className="border-b border-gray-800/40 last:border-0 hover:bg-gray-800/20 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono font-bold text-white">{name}</td>
                      <td className="px-5 py-3 text-center">
                        <CondPill cond={solar.bands[group]?.day} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <CondPill cond={solar.bands[group]?.night} />
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600 font-mono hidden sm:table-cell">{group}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── HamQSL solar widget ── */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setShowWidget(v => !v)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-800/30 transition-colors text-left"
              >
                <div>
                  <h2 className="font-semibold text-gray-100">HamQSL Solar-Widget</h2>
                  <p className="text-xs text-gray-500 mt-0.5">hamqsl.com — visuelles Propagations-Banner</p>
                </div>
                {showWidget
                  ? <ChevronUp   className="w-4 h-4 text-gray-500 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                }
              </button>
              {showWidget && (
                <div className="px-5 py-4 border-t border-gray-800 bg-gray-950/40 flex justify-center">
                  <a href="https://www.hamqsl.com/solar.html" target="_blank" rel="noreferrer"
                     title="Click to add Solar-Terrestrial Data to your website!">
                    <img
                      src="https://www.hamqsl.com/solar101vhf.php"
                      alt="HamQSL Solar-Terrestrial Data"
                      className="max-w-full rounded"
                    />
                  </a>
                </div>
              )}
            </div>

            {/* ── Propagation links ── */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setShowLinks(v => !v)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-800/30 transition-colors text-left"
              >
                <div>
                  <h2 className="font-semibold text-gray-100">Propagations-Links</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Externe Werkzeuge & Vorhersagen</p>
                </div>
                {showLinks
                  ? <ChevronUp   className="w-4 h-4 text-gray-500 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                }
              </button>
              {showLinks && (
                <div className="px-5 py-4 border-t border-gray-800 bg-gray-950/40">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {resolveLinks(locator).map(({ name, desc, url }) => (
                      <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 transition-colors group"
                      >
                        <span className="text-base leading-none mt-0.5">🔗</span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-200 group-hover:text-white truncate">{name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── NOAA 3-day forecast ── */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setShowNoaa(v => !v)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-800/30 transition-colors text-left"
              >
                <div>
                  <h2 className="font-semibold text-gray-100">NOAA 3-Tage-Prognose</h2>
                  <p className="text-xs text-gray-500 mt-0.5">services.swpc.noaa.gov</p>
                </div>
                {showNoaa
                  ? <ChevronUp   className="w-4 h-4 text-gray-500 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                }
              </button>
              {showNoaa && (
                <pre className="px-5 py-4 border-t border-gray-800 text-[11px] text-gray-400 font-mono whitespace-pre-wrap leading-relaxed bg-gray-950/40 overflow-x-auto">
                  {noaa || '(Lade…)'}
                </pre>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-xs text-gray-600 border-t border-gray-900 mt-4">
        Daten:{' '}
        <a href="https://www.hamqsl.com/" target="_blank" rel="noreferrer" className="hover:text-gray-400 underline underline-offset-2">HamQSL.com</a>
        {' · '}
        <a href="https://www.swpc.noaa.gov/" target="_blank" rel="noreferrer" className="hover:text-gray-400 underline underline-offset-2">NOAA SWPC</a>
        {' · '}
        Automatische Aktualisierung alle 15 Min.
      </footer>


      {/* ── Einstellungen-Modal ── */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-100 mb-5">Einstellungen</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Rufzeichen
                </label>
                <input
                  type="text"
                  value={draftCallsign}
                  onChange={e => setDraftCallsign(e.target.value.toUpperCase())}
                  placeholder="z.B. DL1ABC"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Maidenhead-Locator
                </label>
                <input
                  type="text"
                  value={draftLocator}
                  onChange={e => setDraftLocator(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="z.B. JN58TC"
                  maxLength={6}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono uppercase"
                />
                <p className="text-[11px] text-gray-600 mt-1">
                  Wird für DXView-Link verwendet
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveSettings}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
              >
                Speichern
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium text-gray-300 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
