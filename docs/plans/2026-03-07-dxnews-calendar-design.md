# Design: DX News Calendar Segment

**Date:** 2026-03-07
**Status:** Approved

## Summary

Add a collapsible "DX News Kalender" section to `PropagationDashboard.jsx`, embedded via the dxnews.com external widget script. Follows the same pattern as the existing HamQSL Solar Widget and NOAA sections.

## Position

After "Propagations-Links", before "NOAA 3-Tage-Prognose".

## Approach

Lazy script injection (Approach A): the external script is injected into `<head>` only on first open. A `useRef` guard prevents double-loading.

## Changes to `src/PropagationDashboard.jsx`

1. Add `showDxNews` state (initial `false`)
2. Add `dxNewsInjected` ref (`useRef(false)`)
3. Add `useEffect` that injects the script on first open
4. Add collapsible section JSX before the NOAA block

## Script

```
https://dxnews.com/calendar.php?width=21&lang=en
```

Expects `<div id="DXNewsCalendar">` in the DOM when it runs. React renders synchronously before effects, so the div is available.
