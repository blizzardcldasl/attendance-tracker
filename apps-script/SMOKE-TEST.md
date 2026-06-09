# Apps Script (no-OAuth) — deploy & CORS smoke test

Goal: prove the browser can read/write the Google Sheet through the Apps Script
Web App, and confirm the cross-origin POST isn't blocked by CORS. This is the one
thing the offline tests can't cover.

**Test sheet (already created for you):**
https://docs.google.com/spreadsheets/d/19Wj4RWZBVCfnseCoQxYv8mTn1zwSEq79eBHo6QJS-Eo/edit

---

## 1. Paste the script
1. Open the test sheet (link above).
2. **Extensions ▸ Apps Script**. Delete any sample `function myFunction(){}`.
3. Paste the entire contents of [`Code.gs`](Code.gs). Leave `TOKEN = ''` for now.
4. Save (⌘S).

## 2. Deploy as a Web App
1. **Deploy ▸ New deployment**.
2. Click the gear ⚙ ▸ **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** **Anyone**  ← must be "Anyone", *not* "Anyone with Google account"
4. **Deploy** ▸ authorize (pick your account ▸ Advanced ▸ "Go to … (unsafe)" ▸ Allow —
   this is Google's normal warning for your own unverified script).
5. Copy the **Web app URL** — it ends in `/exec`.

## 3. Isolated CORS check (do this BEFORE touching the app)
This proves the endpoint works independent of the tracker, so we know any later
failure is the app, not the deploy.

1. Open any browser tab ▸ DevTools (⌥⌘I) ▸ **Console**.
2. Paste this, replacing the URL with your `/exec` URL:

```js
fetch('PASTE_YOUR_EXEC_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ action: 'load', token: '' })
}).then(r => r.json()).then(d => console.log('RESULT', d)).catch(e => console.error('FAILED', e));
```

3. Then test a write:

```js
fetch('PASTE_YOUR_EXEC_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ action: 'upsert', token: '',
    row: ['2026-06-09','Tue','s-office','console test','2026-06-09 12:00:00'] })
}).then(r => r.json()).then(d => console.log('WRITE', d)).catch(e => console.error('FAILED', e));
```

**Pass:** `RESULT {ok: true, values: [...]}` and `WRITE {ok: true}`, and a `Tracker`
tab appears in the sheet with the test row. ✅ CORS works.

## 4. End-to-end in the app
1. Serve the app (clean origin is better than `file://` for fetch):
   `python3 -m http.server 5599 --directory /Users/actiller/Documents/AZ/time/enhancements`
   then open `http://localhost:5599`.
   (To re-run onboarding, clear it first: DevTools ▸ Console ▸
   `localStorage.clear()` ▸ refresh.)
2. Onboarding ▸ **Sync to a Google Sheet (No OAuth)** ▸ on the connect screen paste
   the `/exec` URL ▸ **Save**.
3. Log a day. The sync chip should read **Synced ✓**. Confirm the row lands in the
   sheet's `Tracker` tab.
4. Refresh the page ▸ the day should reload from the sheet.

---

## If the CORS check fails — what each symptom means
- **`No 'Access-Control-Allow-Origin' header` / blocked by CORS** → almost always the
  access setting. Re-deploy with **Who has access: Anyone** (not "…with Google account").
- **Redirects to `accounts.google.com` / login page** → same cause: access is
  restricted to signed-in Google users. Set it to "Anyone".
- **`{ok:false, error:"Unauthorized"}`** → the script has a `TOKEN` set but the request
  sent a different/empty one. Match them (Settings ▸ Shared secret).
- **Edited the script but changes don't take effect** → Apps Script serves the last
  *deployed* version. **Deploy ▸ Manage deployments ▸ edit ✏️ ▸ Version: New version ▸
  Deploy** (the `/exec` URL stays the same).
- **`401`/`403` in the Network tab** → deployment/authorization didn't complete; redo
  step 2 and make sure you clicked Allow.

Report back what the console prints and I'll take it from there.
