# Setup Guide

A single-file static web app for tracking hybrid office attendance against a configurable monthly target. Pick a flavor:

| Flavor | File | Storage | Setup time | Best for |
|---|---|---|---|---|
| **Local** | `index-local.html` | Browser (localStorage) + Excel export | 30 seconds | Single-device use, no accounts |
| **Cloud** | `index.html` | Google Sheets | ~20 minutes one-time | Multi-device sync, shareable |

There is **no in-app settings panel**. All configuration lives in a clearly-marked block at the top of each HTML file. Edit, save, deploy. The deployed file *is* the configuration — open the URL on any browser/device and it just works.

---

## Path A — Local Mode (no accounts)

Zero accounts, no servers. Data stays in your browser. You export to `.xlsx` whenever you want a backup.

### Steps

1. Download `index-local.html`.
2. Open it in any text editor (TextEdit, VS Code, Notepad — anything works). Find the `CONFIGURATION` block near the top of the `<script>` block:

   ```js
   const START_DATE = '2026-01-01';        // YYYY-MM-DD; days before are excluded
   const TARGET_PCT = 60;                  // % of eligible weekdays in office
   const COUNTRY    = 'US';                // for computed federal/national holidays

   const HOLIDAY_TYPES = ['Public', 'Regional', 'Observed', 'Company'];

   const CUSTOM_HOLIDAYS = [
     // {date: '2026-12-31', name: 'Year-end closure', type: 'Company'},
   ];
   ```

3. Replace `START_DATE` with your hire/policy start date if it's not Jan 1, 2026.
4. Adjust `TARGET_PCT` if your policy isn't 60.
5. Pick a `COUNTRY` from `US`, `UK`, `CA`, `AU`, `DE`, `FR`, or `NONE`.
6. Add company-specific or regional holidays to `CUSTOM_HOLIDAYS` if you have any. Example:
   ```js
   const CUSTOM_HOLIDAYS = [
     {date: '2026-12-31', name: 'Year-end closure', type: 'Company'},
     {date: '2026-12-30', name: 'Year-end closure', type: 'Company'},
   ];
   ```
7. Save the file.
8. Double-click `index-local.html` in your file browser. It opens in your default browser.
9. Use **↓ Export .xlsx** every week or so to back up your data.

### Things to know

- Data lives in your browser's localStorage, scoped to the file's location. If you move the file or change browsers, the data doesn't follow — export first.
- Clearing browser data wipes it. Same fix: export first.
- Browsers cap localStorage at ~5 MB; even 10 years of attendance fits comfortably.
- The XLSX library loads from a CDN (`cdn.jsdelivr.net`) on first import/export.

---

## Path B — Cloud Mode (Google Sheets sync)

Data lives in your own Google Sheet, syncs across all your devices, and you can open the sheet directly to edit. Setup is a one-time ~20 minutes.

### What you'll do

1. Create a Google Sheet (the database)
2. Create a Google Cloud OAuth Client ID (the lock & key)
3. Edit `SHEET_ID` and `CLIENT_ID` at the top of `index.html`
4. Deploy `index.html` to Cloudflare Pages or GitHub Pages
5. Open the URL, sign in once

### B.1 — Create the Google Sheet

1. Open <https://sheets.new>.
2. Rename the sheet to anything (e.g., `Attendance Tracker`).
3. You don't need to set up tabs — the app creates `Tracker` and `Holidays` automatically on first sign-in.
4. Copy the sheet ID from the URL — the long string between `/d/` and `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/THIS_LONG_STRING/edit
   ```
   Save it for step B.3.

### B.2 — Create a Google OAuth Client ID

This is what lets your hosted page read and write your sheet on your behalf.

1. Go to <https://console.cloud.google.com/>. Sign in with the same Google account that owns the sheet.
2. Top of the page, click the project dropdown → **New Project**. Name it (e.g., `attendance-tracker`). Create.
3. Make sure the new project is selected in the dropdown.
4. Left sidebar → **APIs & Services → Library**. Search for **Google Sheets API**. Click it → **Enable**.
5. Left sidebar → **APIs & Services → OAuth consent screen**.
   - User type: **External**. Create.
   - App name: anything. User support email: your address. Developer contact: your address. Save and continue.
   - Scopes: skip (Continue).
   - Test users: add your own Google email + any other Google accounts you want to sign in with. Save and continue.
   - Back to Dashboard.
6. Left sidebar → **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: anything (e.g., `tracker-web`).
   - **Authorized JavaScript origins** — add the URL where you'll host the page. **No path, no trailing slash:**
     - For Cloudflare Pages: `https://your-project.pages.dev` (and your custom domain if any)
     - For GitHub Pages: `https://yourusername.github.io`
     - For local testing only: `http://localhost:8000`
   - Click **Create**.
7. A modal pops up with the **Client ID**. **Copy the bare string only** — not a markdown link, not a URL — just the `123456-abc...apps.googleusercontent.com` text.

> If your origin doesn't match exactly, sign-in fails with `redirect_uri_mismatch` or `invalid_client`. Add every origin you'll use, including `localhost` if you test locally.

### B.3 — Wire the credentials into `index.html`

Open `index.html` in any text editor. Find the `CONFIGURATION` block near the top of the `<script>` block:

```js
const SHEET_ID    = '';
const SHEET_TAB   = 'Tracker';
const HOLIDAY_TAB = 'Holidays';
const CLIENT_ID   = '';
const START_DATE  = '2026-01-01';
const TARGET_PCT  = 60;
const COUNTRY     = 'US';

const HOLIDAY_TYPES = ['Public', 'Regional', 'Observed', 'Company'];

const SEED_CUSTOM_HOLIDAYS = [
  // {date: '2026-12-31', name: 'Year-end closure', type: 'Company'},
];
```

Edit:

- `SHEET_ID` → the long string you copied in B.1.
- `CLIENT_ID` → the OAuth client ID from B.2. **Paste only the bare ID** — make sure it ends with `.apps.googleusercontent.com` and nothing else.
- `START_DATE` → your hire/policy start date (`YYYY-MM-DD`).
- `TARGET_PCT` → your policy target (60 for 60%, 40 for 40%, etc.).
- `COUNTRY` → `US`, `UK`, `CA`, `AU`, `DE`, `FR`, or `NONE`. Used only for the initial Holidays tab seed.
- `SEED_CUSTOM_HOLIDAYS` → optional pre-populated company days. After first sign-in, manage these in the Holidays tab in Google Sheets.

Save the file. **Don't change anything below the `END OF CONFIGURATION` marker.**

### B.4 — Deploy to a static host

#### Option 1: Cloudflare Pages (recommended)

Free, fast, supports custom domains.

1. Sign in or sign up at <https://pages.cloudflare.com/>.
2. **Create application → Pages → Upload assets**.
3. Project name: anything (e.g., `attendance-tracker`). The default URL becomes `https://attendance-tracker.pages.dev`.
4. Drag `index.html` into the upload box. Deploy.
5. Wait ~30 seconds.
6. Open the URL it gives you. Verify it matches an OAuth origin you registered in B.2 — if not, re-deploy or update the OAuth origins.
7. (Optional) Add a custom domain in the Cloudflare project settings. Don't forget to add it to OAuth origins too.

To **update** the page later: edit `index.html` locally, re-zip, re-upload to Cloudflare. Or wire the deployment to a GitHub repo for auto-deploys.

#### Option 2: GitHub Pages

Free, requires a GitHub account.

1. Create a new public repo.
2. Push `index.html` to it.
3. Repo settings → **Pages** → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
4. Wait ~1 minute. URL appears at the top of the Pages settings.
5. Verify the URL matches an OAuth origin you registered.

To update: edit, commit, push. Pages redeploys automatically.

### B.5 — First sign-in

1. Open your deployed URL.
2. A Google sign-in popup appears. Pick the account that owns the sheet (or any account on the OAuth test-users list).
3. Approve the **See, edit, create, and delete your spreadsheets** permission.
4. App creates the `Tracker` tab (header row), creates the `Holidays` tab (header row + your country preset for current and next year + anything from `SEED_CUSTOM_HOLIDAYS`).
5. Calendar fills in. You're done.

### B.6 — Managing holidays going forward

Open your Google Sheet. Click the `Holidays` tab. Edit directly:

- **Add a row** for a company day, regional day, or anything you want excluded. Format:
  | A: Date | B: Name | C: Type |
  |---|---|---|
  | 2026-12-31 | Year-end closure | Company |
- **Delete a row** for a holiday your company doesn't observe.
- **Sort, filter, format** however you like — the app only reads `A2:C` so it doesn't care about visual styling.

Reload the tracker page. The new holiday set is live.

When you cross into a new calendar year (December 2027 looking ahead to 2028), add 2028's rows yourself — the app doesn't auto-extend. Easiest way: copy the current year's rows, increment the dates by 12 months, adjust for any weekday-shift differences.

### Common errors

| Error | Cause | Fix |
|---|---|---|
| `Sign in needed` banner immediately on page load | OAuth client not configured / wrong origin | Verify Authorized JavaScript origins in Google Cloud Console matches your deployed URL exactly |
| `invalid_client` on sign-in | Bad `CLIENT_ID` value (typo, markdown link, truncation) | Re-copy the bare Client ID from Google Cloud Console; ensure it ends with `.apps.googleusercontent.com` and has no extra characters |
| `Access blocked: Authorization Error` | OAuth Consent Screen in Testing mode and the account isn't on the test-users list | Add the email to **Test users** in the consent screen settings |
| `403 Forbidden` on sheet read | Sheets API not enabled | Enable it in `APIs & Services → Library` |
| `404` on sheet read | Wrong `SHEET_ID` | Re-copy the ID from the sheet URL |
| Settings field shows markdown like `[abc...](http://abc...)` | Pasted from a rendered link | Re-copy as plain text — only the bare ID belongs there |

---

## Path C — Local testing of the cloud version

If you want to develop or test `index.html` locally before deploying:

1. Add `http://localhost:8000` to your OAuth origins (B.2).
2. From the folder containing `index.html`:
   ```
   python3 -m http.server 8000
   ```
3. Open <http://localhost:8000>. Sign in. Verify everything works.

You can't open `index.html` directly via `file://` — Google's OAuth refuses `file://` origins.

---

## Migrating between flavors

**Local → Cloud:** Export `.xlsx` from local. Open the Sheet in Google Sheets. File → Import → Upload → choose the `.xlsx` → "Replace current sheet". Reload the cloud tracker.

**Cloud → Local:** Open the Google Sheet. File → Download → Microsoft Excel (`.xlsx`). Open `index-local.html` and click Import.

The schemas are identical so round-tripping is safe.

---

## Files

```
index.html         Cloud version (Google Sheets-backed)
index-local.html   Local version (browser + Excel)
README.md          What this is, how it works
SETUP.md           This file — Cloud setup walkthrough
LICENSE            MIT
```
