# Feature Backlog — Amateur Radio Propagation Info

Brainstorming-Ergebnis vom 2026-02-26, sortiert nach Aufwand/Nutzen.

---

## Leicht umzusetzen, hoher Nutzen

- [x] **#1 — Trend-Pfeile auf den Hauptwerten** *(v1.2.0)*
  SFI und K-Index mit `↑ / ↓` annotieren — letzten Wert in `localStorage` speichern, beim nächsten Abruf vergleichen.

- [x] **#2 — Geomagnetsturm-Warnbanner** *(v1.2.0)*
  Wenn K-Index ≥ 5: prominenter roter Banner mit `"Geomagnetsturm G{n} — Kurzwelle gestört"`. Dismissable, kommt beim nächsten Refresh zurück.

- [ ] **#3 — UTC-Uhr im Header**
  Einfache Echtzeit-UTC-Anzeige neben dem Refresh-Button. OMs arbeiten immer in UTC — das spart den Griff zur Uhr.

- [ ] **#4 — VHF/EME-Bedingungen**
  Das HamQSL-XML enthält bereits `vhf-aurora`, `aurora-vhf`, `muf-low`, `muf-high` etc. — einfach parsen und als aufklappbaren Block anzeigen.

---

## Mittlerer Aufwand, gezielter Mehrwert

- [ ] **#5 — Browser-Benachrichtigungen bei Schwellwerten**
  Push Notification wenn K-Index einen konfigurierbaren Wert über- oder unterschreitet. Opt-in per Button, läuft im Hintergrund weiter wenn Tab offen ist.

- [x] **#6 — Eigenes Rufzeichen / Locator konfigurieren** *(v1.2.0)*
  Rufzeichen und Maidenhead-Locator in `localStorage` speichern. Propagations-Links zeigen automatisch auf den eigenen QTH (DXView mit eigenem Locator).

- [ ] **#7 — SFI-Verlauf als Sparkline**
  Die letzten ~10 SFI-Werte in `localStorage` akkumulieren und als kleine Sparkline-Kurve unter dem SFI-Wert anzeigen. Gibt schnell ein Bild vom Trend der letzten Stunden.

- [ ] **#8 — Solar-Zyklus-Position**
  Kleines Widget das zeigt wo wir im aktuellen Zyklus 25 sind (Maximum erwartet ~2025). Manuell gepflegt oder von einer NASA/SIDC-Quelle gezogen.

---

## Größerer Aufwand, aber interessant

- [ ] **#9 — Greyline-Indikator für eigenen QTH**
  Zeigt an ob der eigene Standort gerade auf der Greyline liegt (Dämmerungszone). Greyline-Propagation ist für DX-Operatoren besonders wertvoll. Berechnung rein client-seitig möglich (SunCalc-Library).

- [ ] **#10 — PWA / Installierbarkeit**
  Service Worker + `manifest.json` → App lässt sich auf dem Handy installieren, läuft offline mit gecachten Daten. Besonders nützlich für portablen Betrieb (SOTA, POTA).
