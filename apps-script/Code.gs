/**
 * Hybrid Attendance Tracker — Google Sheets backend WITHOUT OAuth.
 *
 * One-time setup (≈2 minutes, no Google Cloud project needed):
 *   1. Open your Google Sheet.
 *   2. Extensions ▸ Apps Script.  Delete any sample code, paste THIS file.
 *   3. (Optional) set TOKEN below to a secret string.
 *   4. Deploy ▸ New deployment ▸ gear ▸ "Web app".
 *        Execute as:      Me
 *        Who has access:  Anyone
 *      ▸ Deploy ▸ Authorize once ▸ copy the Web app URL (ends in /exec).
 *   5. In the tracker: Settings ▸ "Google Sheet" mode ▸ paste the URL
 *      (and the same TOKEN, if you set one) ▸ Save.
 *
 * The browser only ever calls this one URL; the script does the writing
 * server-side under your identity. No Client ID, no consent screen.
 *
 * SECURITY: anyone who has the URL (and TOKEN, if set) can read/write this
 * sheet. Keep the URL private; set a TOKEN for a little extra safety.
 */

const SHEET_NAME = 'Tracker';
const TOKEN = '';   // optional shared secret; leave '' to disable the check.

function doGet(e)  { return handle_(e); }
function doPost(e) { return handle_(e); }

function handle_(e) {
  const out = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  try {
    var req = {};
    if (e && e.postData && e.postData.contents)      req = JSON.parse(e.postData.contents);
    else if (e && e.parameter && e.parameter.payload) req = JSON.parse(e.parameter.payload);
    else if (e && e.parameter)                        req = e.parameter;

    if (TOKEN && String(req.token || '') !== TOKEN) throw new Error('Unauthorized');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow(['Date', 'Day', 'Type', 'Note', 'Updated']);
      sh.getRange('A:A').setNumberFormat('@');   // keep dates as plain text
    }

    var action = req.action || 'load';

    if (action === 'load') {
      return out.setContent(JSON.stringify({ ok: true, values: sh.getDataRange().getValues() }));
    }

    if (action === 'upsert') {
      var row = req.row;                          // [date, day, type, note, updated]
      if (!row || !row[0]) throw new Error('Missing row');
      var rn = findDateRow_(sh, row[0]);
      var target;
      if (rn > 0) { sh.getRange(rn, 1, 1, 5).setValues([row]); target = rn; }
      else        { sh.appendRow(row);            target = sh.getLastRow(); }
      // Force the date cell to stay text ('YYYY-MM-DD') — avoids timezone roll.
      sh.getRange(target, 1).setNumberFormat('@').setValue(String(row[0]));
      return out.setContent(JSON.stringify({ ok: true }));
    }

    if (action === 'delete') {
      var d = findDateRow_(sh, req.date);
      if (d > 0) sh.deleteRow(d);
      return out.setContent(JSON.stringify({ ok: true }));
    }

    throw new Error('Unknown action: ' + action);
  } catch (err) {
    return out.setContent(JSON.stringify({ ok: false, error: String((err && err.message) || err) }));
  }
}

function findDateRow_(sh, dateKey) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var col = sh.getRange(2, 1, last - 1, 1).getValues();   // skip header
  var target = normKey_(dateKey);
  for (var i = 0; i < col.length; i++) {
    if (normKey_(col[i][0]) === target) return i + 2;
  }
  return -1;
}

function normKey_(v) {
  if (v instanceof Date) {
    return v.getFullYear() + '-' + pad_(v.getMonth() + 1) + '-' + pad_(v.getDate());
  }
  return String(v).trim().slice(0, 10);
}

function pad_(n) { return (n < 10 ? '0' : '') + n; }
