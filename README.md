# Hybrid Attendance Tracker

A single-file static web app for tracking your in-office days against a hybrid-policy target (default 60% of eligible weekdays). Two flavors — pick one:

- **Local** (`index-local.html`) — zero accounts, data lives in your browser, export/import via `.xlsx`. 30 seconds to set up.
- **Cloud** (`index.html`) — syncs to a Google Sheet you own, multi-device. ~20 minutes one-time setup for the OAuth bits.

No build tools. No frameworks. No tracking. Vanilla HTML/CSS/JS in one file.

---

## Why

Hybrid policies usually demand a percentage of office days per month, and most people end up keeping a spreadsheet to argue with HR if it ever comes up. This is that spreadsheet, but with a calendar, math that runs continuously, and a friendly nudge when you're falling behind. It distinguishes **confirmed** days (it happened) from **planned** days (intent), so the percentage HR cares about isn't inflated by future plans you might miss.

## Features

- **Click-to-cycle calendar** — click any eligible day to step through Office → Remote → Plan-Office → Plan-PTO → Plan-Travel → empty.
- **Confirmed vs planned** — solid border = it happened, dashed border = upcoming intent. Past planned days that you didn't promote get an amber warning ring and a banner offering a one-click bulk confirm.
- **Live compliance math** — Confirmed Rate, Projected Rate, Eligible Days, Still Needed; progress bar with a target marker.
- **Smart form date** — picking a future date defaults the type to Planned; picking today/past defaults to Confirmed.
- **Configurable from the UI** — gear icon opens a Settings panel for sheet ID, OAuth client ID, start date, target %. No source-editing required.
- **Holiday-aware** — fixed company holidays are auto-excluded from compliance and shown in violet on the calendar. Default list ships with US federal holidays for 2026/2027.
- **Type taxonomy** — Office, Remote, PTO, Sick, Travel, Floating Holiday — with `s-`/`p-` prefix for confirmed/planned. PTO/Sick/Travel/Floating Holiday days are excluded from the eligible-days denominator.
- **Pre-employment days** — anything before your start date is greyed out and not counted.
- **Mobile responsive**, accessible (WCAG AA contrast, keyboard-navigable, focus rings), no external dependencies except Google Fonts and (cloud only) Google's auth library.

## Quick start — Local

1. Download [`index-local.html`](index-local.html).
2. Open it in a browser (double-click).
3. Click the ⚙ gear icon, set your start date and target %, save.
4. Click days on the calendar, or use the form on the right.
5. Use **↓ Export .xlsx** periodically as a backup.

That's it. Your data lives in browser localStorage. The XLSX import/export uses [SheetJS](https://github.com/SheetJS/sheetjs) loaded from a CDN.

## Quick start — Cloud

If you want multi-device sync:

1. Create a Google Sheet with a tab named `Tracker` (the app creates the header row on first sign-in).
2. Set up an OAuth Client ID in Google Cloud Console — see **[SETUP.md](SETUP.md)** for the full walkthrough.
3. Deploy `index.html` to Cloudflare Pages, GitHub Pages, or any static host.
4. Open the deployed page, click ⚙, paste in your Sheet ID and Client ID, save.

The full setup guide ([SETUP.md](SETUP.md)) covers Cloudflare Pages, GitHub Pages, OAuth setup, custom domains, and common errors.

## Configuration

Everything user-facing is in the Settings panel (gear icon, top right):

| Setting | Cloud | Local | Default |
|---|---|---|---|
| Sheet ID | ✓ | — | — |
| Tab name | ✓ | — | `Tracker` |
| OAuth Client ID | ✓ | — | — |
| Start date | ✓ | ✓ | 2026-01-01 |
| Target percentage | ✓ | ✓ | 60% |

Settings persist to `localStorage` per device.

If you'd rather bake your defaults into the file (so a fresh browser already has them filled in), edit the `DEFAULT_CONFIG` object near the top of the `<script>` block. Holiday list is in the same area — `HOLIDAYS` (the Set) and `HOL_NAMES` (display labels). Replace freely with your company's calendar.

## Data shape

Cloud version writes to a 5-column sheet:

| Col | Header | Format | Notes |
|---|---|---|---|
| A | Date | Real date or `YYYY-MM-DD` | Primary key. The reader handles either. |
| B | Day | `Mon`, `Tue`, etc. | Computed by the app on every write. Cosmetic only. |
| C | Type | `s-office`, `p-office`, etc. | `s-` = confirmed, `p-` = planned. Six bases: `office`, `remote`, `pto`, `sick`, `travel`, `fhol`. |
| D | Note | Free text | Optional. |
| E | Updated | `YYYY-MM-DD HH:MM:SS` | Audit trail. |

Local version stores the same shape as JSON in `localStorage`, with XLSX export matching the columns above.

## Compliance math

- `Eligible weekday` = a weekday on/after your start date, NOT a fixed company holiday, NOT logged as PTO/Sick/Travel/Floating Holiday.
- `Confirmed Rate` = confirmed office days ÷ past eligible days.
- `Projected Rate` = (confirmed + planned) office days ÷ all eligible days this month.
- `Still Needed` = `ceil(eligible × target%) − confirmed − planned`.

Past planned days that you didn't promote count as **nothing** in Confirmed Rate — the app surfaces them in an amber banner so a forgotten plan doesn't quietly inflate compliance.

## Tech notes

- Single HTML file. No build, no bundler, no transpiler. Open it in any modern browser.
- Cloud version uses Google's GIS token client + Sheets v4 REST. Reads with `valueRenderOption=UNFORMATTED_VALUE` and converts serial dates back to `YYYY-MM-DD` so date round-trips are deterministic.
- Optimistic UI: every mutation updates state in memory and re-renders synchronously, *then* fires the network request. On failure, state reverts and the sync indicator turns red.
- Local version uses `localStorage` for state and [SheetJS](https://cdn.jsdelivr.net/npm/xlsx@0.18.5) for `.xlsx` round-trip.
- Fonts: [Inter](https://rsms.me/inter/) (UI) + [Fraunces](https://fonts.google.com/specimen/Fraunces) (display) via Google Fonts.

## Browser support

Tested on recent Chrome, Safari, Firefox, Edge. Uses `aspect-ratio`, `:has()` is *not* used, optional chaining is. Should work in any browser from 2022 onward.

## Contributing

PRs welcome. The codebase is small (~1100 lines of HTML+CSS+JS per file) and intentionally has no build step. If you fork this for your own org and want to upstream improvements (better holiday handling, more day types, etc.), open an issue first to align on direction.

## License

[MIT](LICENSE) — do whatever you want with it.
