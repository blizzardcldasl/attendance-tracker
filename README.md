# Hybrid Attendance Tracker

A single-file static web app for tracking your in-office days against a hybrid-policy
target (default 60% of eligible weekdays). One adaptive HTML file — pick where your data
lives, set everything up in-app, done.

No build tools. No frameworks. No tracking. Vanilla HTML/CSS/JS in one file.

> **Just want to use it? → [INSTRUCTIONS.md](INSTRUCTIONS.md)** (setup, storage modes, daily use).

## What changed (unified rebuild)

This used to be two hand-maintained files (`index.html` cloud + `index-local.html` local)
configured by editing a code block at the top. They've been **merged into one app** with an
in-app Settings panel, so there's nothing to edit in source. Choose a storage mode on first
run; change anything later under **Settings (⚙)**.

## Storage modes

| Mode | Setup | Notes |
|------|-------|-------|
| **This device** | none | Data in `localStorage`, this browser only. Instant start. |
| **Google Sheet (No OAuth)** | paste one Web App URL | Syncs to a Sheet you own via a small **Apps Script** Web App. No Google Cloud project, no OAuth consent screen. **Recommended for syncing.** See [`apps-script/Code.gs`](apps-script/Code.gs) + [`apps-script/SMOKE-TEST.md`](apps-script/SMOKE-TEST.md). |
| **Sheet · OAuth** | Sheet ID + OAuth Client ID | Advanced. Direct Sheets v4 API; lower latency; needs a Google Cloud OAuth client (see [SETUP.md](SETUP.md)). |

## Features

- **In-app settings** — name, target %, start date, holiday region, work-week, custom
  holidays, storage mode. Nothing to edit in code.
- **Custom statuses** — rename/recolor the built-ins (Office, Remote, PTO, Sick, Travel,
  Floating Holiday) and add your own. Each status has a **behavior** that drives the math:
  *counts as in-office* / *eligible day (not office)* / *excluded from eligibility*. So a
  company that counts "Client Site" as in-office can model it exactly.
- **Click-to-cycle calendar** — click any eligible day to step through Office → Remote →
  Plan-Office → empty (the cycle adapts to your statuses).
- **Confirmed vs planned** — solid = it happened, dashed = upcoming intent. Past planned
  days you didn't promote get an amber ring + a one-click "Confirm all" banner.
- **Live compliance math** — Confirmed Rate, Projected Rate, Eligible Days, Still Needed,
  progress bar with target marker.
- **Flexible work-week** — pick which days count (e.g. a 4-day week).
- **Quarterly summary** — in-office compliance by quarter from your start date to now.
- **Portability** — JSON export/import (full backup), and `.ics` calendar export.
- **Holiday-aware** — region preset (US/UK/CA/AU/DE/FR/None) + your custom company days are
  excluded from eligible weekdays and shown in violet.
- **Mobile responsive**, accessible (WCAG AA contrast, keyboard-navigable, focus rings).

## How holidays work

Holidays are computed **client-side** from your selected region preset (current and
surrounding years, via a date algorithm — no lookup table to maintain) plus any **custom
holidays** you add in Settings. There is no longer a separate `Holidays` sheet tab to
manage; the Sheet (in either sync mode) only stores your attendance entries.

Adding a holiday on a weekday **reduces eligible weekdays by 1** and lowers "Still Needed"
proportionally:

- `Eligible Days = work-week days in month, on/after start, minus holidays and any 'excluded' status`
- `Still Needed  = ceil(Eligible × Target%/100) − confirmed office − planned office`

## Data shape (sync modes)

The Sheet's `Tracker` tab (created automatically):

| Col | Header | Format | Notes |
|---|---|---|---|
| A | Date | `YYYY-MM-DD` (kept as text) | Primary key — upserted by date |
| B | Day | `Mon`, `Tue`, … | Computed on write |
| C | Type | `s-office`, `p-remote`, … | `s-` = confirmed, `p-` = planned; base is the status key |
| D | Note | Free text | Optional |
| E | Updated | `YYYY-MM-DD HH:MM:SS` | Audit trail |

Settings (target, holidays, statuses, work-week, etc.) live in `localStorage` on each
device, and travel via **Export/Import JSON**.

## Tech notes

- Single HTML file. No build, no bundler, no transpiler.
- **Storage adapter**: one interface (`init / loadEntries / writeRow / clearRow / ready`),
  three implementations — `LocalStore`, `AppsScriptStore` (no-OAuth), `SheetsStore` (OAuth).
- **No-OAuth path**: the browser POSTs (`text/plain`, to avoid a CORS preflight) to a
  deployed Apps Script Web App, which writes the Sheet server-side under the owner's
  identity. The Web App URL is the only credential.
- **Status registry**: statuses + behaviors drive the compliance math; the calendar,
  legend, dropdown, log and quick-cycle all render from it (inline colors).
- Optimistic UI: every mutation updates state and re-renders, then fires the write; on
  failure it reverts and the sync dot turns red.
- Holiday engine: Easter via the Anonymous Gregorian algorithm; nth-/last-weekday helpers;
  per-country observed-day rules.
- Build stamp is in the "Log a Day" footer + console — confirm what's deployed.
- Fonts: [Inter](https://rsms.me/inter/) + [Fraunces](https://fonts.google.com/specimen/Fraunces).

## Quick start

See **[INSTRUCTIONS.md](INSTRUCTIONS.md)**. Short version: open `index.html`, complete the
Welcome screen, pick **This device** to start instantly — or **Google Sheet (No OAuth)** and
follow the Apps Script steps to sync.

## Browser support

Recent Chrome, Safari, Firefox, Edge. Uses `aspect-ratio`, optional chaining, `fetch`.

## License

[MIT](LICENSE) — do whatever you want with it.
