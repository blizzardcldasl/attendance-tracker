# Attendance Tracker — Setup Guide

This is a single-file web app for tracking hybrid office attendance against a configurable monthly target (defaults to 60%). It comes in two flavors:

| Flavor | File | Storage | Setup time | Best for |
|---|---|---|---|---|
| **Local** | `index-local.html` | Browser (localStorage) + Excel export | 30 seconds | Single-device use, no accounts |
| **Cloud** | `index.html` | Google Sheets | ~20 minutes (one-time) | Multi-device sync, shareable |

Pick a flavor, follow the matching section, ignore the rest.

**Both versions** have a Settings panel (⚙ gear icon, top right) that lets you change the **start date** and **target %** without editing code. The cloud version also exposes the Google Sheet ID, Tab name, and OAuth Client ID there — so you can deploy the file unmodified and configure it in the browser.

---

## Path A — Local Mode (the easy one)

No accounts, no servers, no setup. Data stays in your browser. You export to `.xlsx` whenever you want a backup.

### Steps

1. Download `index-local.html`.
2. Double-click it. It opens in your default browser.
3. Click the **gear icon** (⚙) and set your **start date** and **target %** if they differ from the defaults (Apr 13, 2026 / 60%). Save.
4. Click days on the calendar, or use the form, to log attendance.
5. Use the **↓ Export .xlsx** button (top right) every week or so to back up your data.

### Importing existing data

If you already have an Excel sheet of past attendance:

1. Format columns as `Date | Day | Type | Note | Updated` (header row required).
2. `Date` can be a real Excel date or a `YYYY-MM-DD` string.
3. `Type` must be one of: `s-office`, `s-remote`, `s-pto`, `s-sick`, `s-travel`, `s-fhol`, `p-office`, `p-remote`, `p-pto`, `p-travel`, `p-fhol` (`s-` = confirmed, `p-` = planned).
4. Click **↑ Import .xlsx** in the app and pick the file.

### Things to know

- Data lives in your browser's localStorage, scoped to the file's location. If you move the file or change browsers, the data doesn't follow — export first.
- Clearing browser data wipes it. Same fix: export first.
- Browsers cap localStorage at ~5 MB; even 10 years of attendance fits comfortably.
- The XLSX library loads from a CDN (`cdn.jsdelivr.net`) on first import/export. After that it's cached. If you're fully offline, import/export needs a one-time online load.

---

## Path B — Cloud Mode (Google Sheets sync)

Data lives in your own Google Sheet, syncs across all your devices, and you can open the sheet directly to edit, filter, or build pivot tables. Setup is a one-time ~20 minutes.

There are **three things to set up** in this order:

1. The Google Sheet (the database)
2. The Google Cloud OAuth Client ID (the lock & key)
3. The hosting (Cloudflare Pages or GitHub Pages)

### B.1 — Create the Google Sheet

1. Open <https://sheets.new> (or `Drive → New → Google Sheets`).
2. Rename the sheet to anything you like (e.g. `Attendance Tracker`).
3. Rename the first tab from `Sheet1` to `Tracker` (double-click the tab name at the bottom). The app expects this name exactly.
4. Add headers in row 1: `Date | Day | Type | Note | Updated`. The app will create them automatically the first time you sign in if missing, but doing it yourself is cleaner.
5. `View → Freeze → 1 row` so the header stays visible.
6. Copy the sheet ID from the URL — the long string between `/d/` and `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/THIS_LONG_STRING/edit
   ```
   Save it. You'll paste it into `index.html`.

### B.2 — Create a Google OAuth Client ID

This is what lets your hosted page read and write your sheet on your behalf. Sounds intimidating, isn't.

1. Go to <https://console.cloud.google.com/>. Sign in with the same Google account that owns the sheet.
2. Top of the page, click the project dropdown → **New Project**. Name it (e.g. `attendance-tracker`). Create.
3. Make sure the new project is selected in the dropdown.
4. Left sidebar → **APIs & Services → Library**. Search for **Google Sheets API**. Click it → **Enable**.
5. Left sidebar → **APIs & Services → OAuth consent screen**.
   - User type: **External**. Create.
   - App name: anything. User support email: your address. Developer contact: your address. Save and continue.
   - Scopes: skip (Continue).
   - Test users: add your own Google email. Save and continue.
   - Back to Dashboard.
6. Left sidebar → **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: anything (e.g. `tracker-web`).
   - **Authorized JavaScript origins** — this is the most-skipped step. Add the URL where you'll host the page. **No path, no trailing slash:**
     - For Cloudflare Pages: `https://your-project.pages.dev` (and your custom domain if any, e.g. `https://time.example.com`)
     - For GitHub Pages: `https://yourusername.github.io`
     - For local testing only: `http://localhost:8000`
   - Click **Create**.
7. A modal pops up with the **Client ID** (looks like `123456-abc...apps.googleusercontent.com`). Copy it.

> **If the origin doesn't match exactly, sign-in fails silently.** Add every origin you'll use, including `localhost` if you test locally.

### B.3 — Wire the credentials in (no code editing)

Deploy the file unmodified to your host (next step), then open it in a browser. On the deployed page:

1. Click the **gear icon** (⚙) in the header. The Settings panel opens.
2. Paste your **Sheet ID** from step B.1.
3. Leave **Tab name** as `Tracker` unless you renamed it.
4. Paste your **OAuth Client ID** from step B.2.
5. Set **Start date** to your hybrid-policy start date (the day before this is excluded from compliance).
6. Set **Target %** — common policies are 40, 50, 60. Pick the one your employer enforces.
7. Click **Save & reload**.

The page reloads, attempts sign-in against your client ID, and starts syncing to your sheet. Settings persist in browser localStorage on this device.

> **No source edits required.** This is the recommended setup path — share the file with anyone, they configure their own deployment via the gear icon. The defaults baked into the file act as fallbacks but are overridden once Settings are saved.

If you'd rather edit the source baked-in defaults (e.g. for permanent multi-device deployment): open `index.html`, find `const DEFAULT_CONFIG = {…}` near the top of the `<script>` block, replace the values, save. Anyone using a fresh browser will get those defaults.

### B.4 — Holidays are configured in the Settings panel

The Settings panel includes a **Country preset** dropdown (US, UK, Canada, Australia, Germany, France, or None) and a **Custom holidays** textarea for company-specific days. Federal/national holidays are computed for any year — no need to update yearly.

Custom holidays format, one per line:
```
2026-12-31  Year-end closure
2026-07-02  Day before Independence Day
# lines starting with # are comments
```

The optional name after each date appears in tooltips and the Day Log. To customize the country presets themselves (e.g. different observance rules), edit `COUNTRY_RULES` in the script.

### B.5 — Pick your host

#### Option 1: Cloudflare Pages (recommended)

Free, fast, supports custom domains.

1. Sign in or sign up at <https://pages.cloudflare.com/>.
2. **Create application → Pages → Upload assets**.
3. Project name: anything (e.g. `attendance-tracker`). The default URL becomes `https://attendance-tracker.pages.dev`.
4. Drag `index.html` into the upload box. Deploy.
5. Wait ~30 seconds for the build.
6. Open the URL it gives you. **Verify it matches the origin you registered in step B.2** — if not, re-deploy or update the OAuth origins.
7. (Optional) **Custom domain**: Custom domains tab → add domain → follow the DNS instructions. Don't forget to add the custom domain to OAuth origins too.

To **update** the page later: re-zip `index.html` and re-upload, or wire it to a GitHub repo for automatic deploys (Cloudflare's UI walks you through it).

#### Option 2: GitHub Pages

Free, requires a GitHub account, the URL is `https://username.github.io/repo-name/` (or a `*.github.io` subdomain if you name the repo `username.github.io`).

1. Create a new public repo (e.g. `attendance-tracker`). You can leave it empty.
2. On your computer, in a folder containing `index.html`:
   ```
   git init
   git add index.html
   git commit -m "Initial deploy"
   git branch -M main
   git remote add origin https://github.com/USERNAME/attendance-tracker.git
   git push -u origin main
   ```
3. On GitHub, repo → **Settings → Pages**.
4. Under **Source**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
5. Wait ~1 minute. The URL appears at the top of the Pages settings page (`https://USERNAME.github.io/attendance-tracker/`).
6. Verify the URL matches the OAuth origin you registered.

To update: edit `index.html`, commit, push. Pages redeploys automatically.

### B.6 — First sign-in

1. Open the hosted URL.
2. A Google sign-in popup appears. Pick the account that owns the sheet (or any account on the OAuth test-users list).
3. Approve the **See, edit, create, and delete your spreadsheets** permission. (The app only touches the one sheet you configured.)
4. The calendar fills in and the sync pill turns green.

If sign-in fails, check the browser console:

| Error | Cause | Fix |
|---|---|---|
| `idpiframe_initialization_failed` or `redirect_uri_mismatch` | OAuth origin doesn't match the URL exactly | Add the exact `https://...` origin (no path) to OAuth credentials |
| `access_denied` | Account isn't on the test-users list | Add it under OAuth consent screen → Test users |
| `403 Forbidden` on sheet read | Sheets API not enabled | Enable it in `APIs & Services → Library` |
| `404` on sheet read | Wrong `SHEET_ID` or `SHEET_TAB` | Re-copy the ID from the sheet URL; verify the tab is named `Tracker` |

---

## Path C — Local testing of the cloud version

If you want to develop or test `index.html` locally before deploying:

1. Add `http://localhost:8000` to your OAuth origins (step B.2).
2. From the folder containing `index.html`:
   ```
   python3 -m http.server 8000
   ```
3. Open <http://localhost:8000>. Sign in. Verify everything works. Stop the server (Ctrl-C).

You can't open `index.html` directly via `file://` — Google's OAuth refuses `file://` origins.

---

## Sheet schema reference

The Tracker tab uses 5 columns:

| Col | Header | Format | Notes |
|---|---|---|---|
| A | Date | Real date or `YYYY-MM-DD` | Primary key. The app handles either format on read. |
| B | Day | `Mon`, `Tue`, etc. | Computed by the app on every write. Human-readable, not used by the app on read. |
| C | Type | `s-office`, `p-office`, etc. | `s-` = confirmed, `p-` = planned. Six bases: `office`, `remote`, `pto`, `sick`, `travel`, `fhol`. |
| D | Note | Free text | Optional, e.g. "badge + WiFi confirmed". |
| E | Updated | `YYYY-MM-DD HH:MM:SS` | Set by the app on every write. Audit trail. |

Edit cells directly in the sheet if you want — the app re-reads on every sign-in. Just keep the date and type columns in the formats above.

---

## How the 60% calculation works

| Term | Meaning |
|---|---|
| **Eligible weekday** | A weekday on/after start date, NOT a fixed company holiday, NOT logged as PTO/Sick/Travel/Floating Holiday. |
| **Confirmed Rate** | `confirmed office days ÷ past eligible days` (today and earlier). What HR sees. |
| **Projected Rate** | `(confirmed + planned) office days ÷ all eligible days this month`. What you're tracking toward. |
| **Still Needed** | `ceil(eligible × 0.6) − confirmed − planned`. Days left to commit to office. |

Past planned days that you didn't promote to confirmed count as **nothing** in the Confirmed Rate — that's by design, so a missed plan doesn't quietly inflate compliance. The app shows an amber banner when you have stale planned days; one click promotes them all (or you can review individually in the Day Log).

---

## Migrating between flavors

**Local → Cloud:** Export `.xlsx` from local. Open the sheet in Google Sheets. File → Import → Upload → choose the `.xlsx` → "Replace current sheet". The cloud `index.html` re-reads on next sign-in.

**Cloud → Local:** Open the Google Sheet. File → Download → Microsoft Excel (`.xlsx`). Open `index-local.html` and click Import.

The schemas are identical, so round-tripping is safe.

---

## Files in this bundle

```
index.html        Cloud version (Google Sheets-backed)
index-local.html  Local version (browser + Excel)
SETUP.md          This file
index.zip         Just index.html, ready for Cloudflare Pages drag-and-drop
```
