# Hybrid Attendance Tracker — User Guide

A single-page app for tracking hybrid in-office compliance. No install, no build step —
it's one HTML file. Open it in a browser and you're running.

---

## 1. Getting started

Open `index.html` in any modern browser (Chrome, Edge, Safari, Firefox). Two ways:
- **Double-click the file**, or
- Serve it (better for the Google Sheet mode):
  ```bash
  python3 -m http.server 5599 --directory /path/to/enhancements
  ```
  then visit `http://localhost:5599`.

On first run you'll see a **Welcome** screen. Fill in:
- **Your name** (optional)
- **Holiday region** — picks the public-holiday set (US/UK/CA/AU/DE/FR, or None)
- **Tracking start date** — days before this are ignored
- **Office target %** — your required in-office percentage (e.g. 60)

Then choose where your data lives (you can change this later) and click **Start tracking →**.

---

## 2. Choosing where your data lives

| Mode | Setup | Use it when |
|------|-------|-------------|
| **This device** | none | Quickest start. Data is saved privately in this browser only. |
| **Google Sheet (No OAuth)** | paste one Web App URL | You want your data in your own Sheet, synced across devices, without Google Cloud setup. **Recommended for syncing.** |
| **Sheet · OAuth** | Sheet ID + OAuth Client ID | Advanced. Direct Sheets API, lower latency, but needs a Google Cloud OAuth client. |

### Setting up "Google Sheet (No OAuth)"
This uses a small Google Apps Script so the browser never needs to sign in.

1. Open (or create) a Google Sheet.
2. **Extensions → Apps Script**, delete the sample, paste the contents of
   [`apps-script/Code.gs`](apps-script/Code.gs), and Save.
3. **Deploy → New deployment → Web app**:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone** ← must be "Anyone", not "Anyone with Google account"
4. Authorize, then copy the **Web app URL** (ends in `/exec`).
5. In the tracker: **Settings (⚙) → "Google Sheet" → paste the URL → Save**.
   (Optional: set a shared secret in the script's `TOKEN` and the matching field.)

Full deploy + troubleshooting walkthrough: [`apps-script/SMOKE-TEST.md`](apps-script/SMOKE-TEST.md).

---

## 3. Logging your days

- **Log a Day form** (right side): pick a date + status, optional note, **Log Day**.
  Future dates auto-switch to the "Planned" version of a status.
- **Click any calendar day** to quick-cycle: empty → Office → Remote → Planned Office → empty.
- **Confirmed** = it happened. **Planned** = upcoming intent (doesn't count yet).
- Past **planned** days that you never confirmed show an amber banner — **Confirm all**
  promotes them, or **Review** jumps to them.

### The numbers
- **Confirmed Rate** — office % of your *past* eligible days (the one that counts).
- **Projected Rate** — includes your planned office days.
- **Eligible Days** — work-week days in the month, minus holidays/PTO/etc.
- **Still Needed** — office days left to hit your target.

---

## 4. Settings (⚙)

- **Profile & target** — name, target %, start date, holiday region.
- **Work week** — pick which days count (e.g. switch to a 4-day week).
- **Statuses** — rename and recolor the built-ins, or **+ Add status**. Each status has a
  behavior that controls the math:
  - *Counts as in-office* — adds to your office % (e.g. a custom "Client Site")
  - *Eligible day (not office)* — like Remote
  - *Excluded from eligibility* — like PTO/Sick
  Built-ins can be edited but not removed; your own can be removed. Changes re-score
  history immediately.
- **Company / custom holidays** — add dates that should be excluded (your region's public
  holidays are already included automatically).
- **Where your data lives** — switch storage modes (see §2).
- **Backup & portability** — Export/Import JSON, or Export **Calendar (.ics)**.

---

## 5. Other features

- **Quarterly summary (☰)** — in-office compliance by quarter, from your start date to now.
- **Export JSON** — a full backup (settings + entries). **Import JSON** restores it on any
  device (replaces what's there).
- **Calendar (.ics)** — one all-day event per logged day; import into Google/Outlook/Apple
  Calendar.

---

## 6. Troubleshooting

- **Stuck or want to redo onboarding?** Open DevTools console, run `localStorage.clear()`,
  refresh.
- **Google Sheet not saving / CORS error?** The deployment's access must be **Anyone**, and
  after editing the script you must redeploy a **new version**. See
  [`apps-script/SMOKE-TEST.md`](apps-script/SMOKE-TEST.md).
- **"Not connected yet" when logging a day** — you're in a Sheet mode but haven't finished
  connecting; open Settings and re-check the URL/credentials, or switch to "This device".
- **Which version am I on?** The build stamp is at the bottom of the "Log a Day" card.
