# Hybrid Attendance Tracker

A single-file static web app for tracking your in-office days against a hybrid-policy target (default 60% of eligible weekdays). Two flavors:

- **Cloud** (`index.html`) — syncs to a Google Sheet you own, multi-device. ~20 minutes one-time OAuth setup, then any browser/device works.
- **Local** (`index-local.html`) — zero accounts, data lives in your browser, export/import via `.xlsx`. 30 seconds to set up.

No build tools. No frameworks. No tracking. Vanilla HTML/CSS/JS in one file.

## Setup model — one config block, edit, deploy

Both files have a clearly-marked `CONFIGURATION` block at the top. You edit those values in any text editor, save, and deploy the file. There is no in-app settings panel, no localStorage credentials, no setup link to share — the deployed file *is* the configuration. Open the URL on any browser/device and it just works.

### Cloud version — `index.html`

```js
// =============================================================
// CONFIGURATION — Edit these values, save, deploy. Done.
// =============================================================
const SHEET_ID    = '';                  // /spreadsheets/d/[THIS]/edit
const SHEET_TAB   = 'Tracker';
const HOLIDAY_TAB = 'Holidays';
const CLIENT_ID   = '';                  // OAuth Client ID — see SETUP.md
const START_DATE  = '2026-01-01';
const TARGET_PCT  = 60;
const COUNTRY     = 'US';                // initial Holidays tab seed only

const HOLIDAY_TYPES = ['Public', 'Regional', 'Observed', 'Company'];

const SEED_CUSTOM_HOLIDAYS = [
  // {date: '2026-12-31', name: 'Year-end closure', type: 'Company'},
];
```

### Local version — `index-local.html`

```js
const START_DATE = '2026-01-01';
const TARGET_PCT = 60;
const COUNTRY    = 'US';
const HOLIDAY_TYPES = ['Public', 'Regional', 'Observed', 'Company'];

const CUSTOM_HOLIDAYS = [
  // {date: '2026-12-31', name: 'Year-end closure', type: 'Company'},
];
```

That's it. See [SETUP.md](SETUP.md) for the full Google Cloud / OAuth / hosting walkthrough.

## How holidays work

### Cloud version

On first sign-in, the app creates a `Holidays` tab in your Sheet alongside `Tracker` and seeds it with:

- Federal/national holidays for the current and next calendar year, computed from the `COUNTRY` preset (no static lookup table to maintain — works for 2028, 2030, 2050).
- Anything you put in `SEED_CUSTOM_HOLIDAYS` at the top of the file.

After that, **the sheet is the source of truth**. Open `Holidays` in Google Sheets and:

| A: Date | B: Name | C: Type |
|---|---|---|
| 2026-01-01 | New Year's Day | Public |
| 2026-07-03 | Independence Day (obs.) | Observed |
| 2026-11-26 | Thanksgiving | Public |
| 2026-12-31 | Year-end closure | Company |

Add rows for company-specific days, regional days, anything. Delete rows your company doesn't observe. The app reads `Holidays!A2:C` on every sign-in and uses every row as a holiday — Type is just metadata for your own organization.

When the app moves into a new year, you add the next year's rows yourself. The country preset is for seeding, not auto-extension.

### Local version

`CUSTOM_HOLIDAYS` near the top of `index-local.html` is added on top of the country preset (computed at runtime). Edit the array, save, reload.

### Holiday Type categories

Default values: `'Public', 'Regional', 'Observed', 'Company'`. Free-form — rename/add/remove in the array if your context uses different terms.

| Category | Meaning |
|---|---|
| Public | Legally mandated holidays. Federal (US), Bank Holiday (UK/IE), Statutory (CA/NZ), National. |
| Regional | State, provincial, or city-specific (e.g., Patriots' Day in MA). |
| Observed | When a public holiday falls on a weekend, the day-off shifts to a weekday. Auto-tagged for country-preset shifts. |
| Company | Discretionary employer days — floating holidays, year-end closures, anniversary days. |

## How holidays affect compliance math

Adding a row to the Holidays tab (cloud) or to `CUSTOM_HOLIDAYS` (local) **reduces eligible weekdays by 1** and reduces "Still Needed" proportionally:

- `Eligible Days = weekdays in month, on/after start, excluding holidays and PTO/Sick/Travel/Floating`
- `Still Needed = ceil(Eligible × TARGET_PCT/100) − confirmed office − planned office`

So if April has 14 eligible days and target is 60%, you need 9 office days. Add one company holiday on a weekday → eligible drops to 13, you now only need 8.

## Why no in-app settings panel

This codebase used to have one. It introduced a long tail of bugs around localStorage credentials, OAuth account-switching, settings sync, etc. The simplest, most reliable answer turned out to be: edit one block at the top of one file, deploy, never touch it again. Holidays are the one thing that genuinely needs to be edited regularly — that's why they live in the Sheet, where they belong.

## Features

- **Click-to-cycle calendar** — click any eligible day to step through Office → Remote → Plan-Office → Plan-PTO → Plan-Travel → empty
- **Confirmed vs planned** — solid border = it happened, dashed border = upcoming intent. Past planned days that you didn't promote get an amber warning ring and a banner offering a one-click bulk confirm
- **Live compliance math** — Confirmed Rate, Projected Rate, Eligible Days, Still Needed; progress bar with target marker
- **Smart form date** — picking a future date defaults the type to Planned; picking today/past defaults to Confirmed
- **Holiday-aware** — Public/Regional/Observed/Company days exclude from eligible weekdays, show in violet on the calendar, show as `Name (Type)` in tooltips
- **Type taxonomy** — Office, Remote, PTO, Sick, Travel, Floating Holiday — with `s-`/`p-` prefix for confirmed/planned. PTO/Sick/Travel/Floating Holiday days are excluded from the eligible-days denominator
- **Pre-employment days** before your start date are greyed out, not counted
- **Mobile responsive**, accessible (WCAG AA contrast, keyboard-navigable, focus rings)

## Quick start

### Local mode (no accounts)

1. Download `index-local.html`
2. Open it in any text editor and edit `START_DATE`, `TARGET_PCT`, `COUNTRY`, and `CUSTOM_HOLIDAYS` if your defaults differ
3. Open the file in a browser (double-click)
4. Use **↓ Export .xlsx** periodically as a backup

### Cloud mode (Google Sheets sync)

1. Create a Google Sheet. The `Tracker` and `Holidays` tabs are created automatically on first sign-in
2. Set up an OAuth Client ID in Google Cloud Console — see **[SETUP.md](SETUP.md)**
3. Edit `SHEET_ID` and `CLIENT_ID` (and optionally `START_DATE`, `TARGET_PCT`, `COUNTRY`) at the top of `index.html`
4. Deploy to Cloudflare Pages, GitHub Pages, or any static host
5. Open the URL, sign in once. Edit the `Holidays` tab in Google Sheets to manage holidays going forward

## Data shape

### Tracker tab (entries)

| Col | Header | Format | Notes |
|---|---|---|---|
| A | Date | Real date or `YYYY-MM-DD` | Primary key |
| B | Day | `Mon`, `Tue`, etc. | Computed by the app on every write |
| C | Type | `s-office`, `p-office`, etc. | `s-` = confirmed, `p-` = planned. Six bases: `office`, `remote`, `pto`, `sick`, `travel`, `fhol` |
| D | Note | Free text | Optional |
| E | Updated | Local-time `YYYY-MM-DD HH:MM:SS` | Audit trail |

### Holidays tab (cloud) / CUSTOM_HOLIDAYS array (local)

| Col | Header | Format | Notes |
|---|---|---|---|
| A | Date | `YYYY-MM-DD` | The date that's a holiday |
| B | Name | Free text | Shown in tooltip and day log |
| C | Type | One of `HOLIDAY_TYPES` | Free-form; defaults to last value if empty |

## Tech notes

- Single HTML file. No build, no bundler, no transpiler
- Cloud version uses Google's GIS token client + Sheets v4 REST. Reads with `valueRenderOption=UNFORMATTED_VALUE` and converts serial dates back to `YYYY-MM-DD` so date round-trips are deterministic and timezone-safe
- Optimistic UI: every mutation updates state in memory and re-renders synchronously, *then* fires the network request. On failure, state reverts and the sync indicator turns red
- Local version uses `localStorage` for state and [SheetJS](https://cdn.jsdelivr.net/npm/xlsx@0.18.5) for `.xlsx` round-trip
- Holiday engine: Easter via Anonymous Gregorian algorithm; nth-weekday-of-month helpers; per-country observed rules (nearest weekday for US, forward-only for UK/CA/AU, no shift for DE/FR)
- Build stamp visible in the form-hint footer + console — easy to confirm what's actually deployed after redeploy
- Fonts: [Inter](https://rsms.me/inter/) (UI) + [Fraunces](https://fonts.google.com/specimen/Fraunces) (display) via Google Fonts

## Browser support

Recent Chrome, Safari, Firefox, Edge. Uses `aspect-ratio`, optional chaining. Should work in any browser from 2022 onward.

## Contributing

PRs welcome. The codebase is small (~50 KB per file, vanilla HTML/CSS/JS) and intentionally has no build step. If you fork this for your own org and want to upstream improvements, open an issue first to align on direction.

## License

[MIT](LICENSE) — do whatever you want with it.
