/**
 * Party Juice Hub - Google Apps Script Webhook Backend
 * 
 * Setup Instructions:
 * 1. In your Google Sheet, open Extensions > Apps Script.
 * 2. Paste this entire code into Code.gs (replacing existing code).
 * 3. In the Google Sheet, make sure you have a sheet tab named: party_orders
 *    (The script will automatically populate the header row if it is empty!)
 * 4. Click Deploy > New deployment:
 *    - Type: Web app
 *    - Description: Party Juice Hub Sync
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL and paste it into Party Juice Hub via the "📊 Sheet" button!
 */

const DEFAULT_COLUMNS = [
  "id",
  "user_name",
  "item_title",
  "variant_id",
  "variant_title",
  "price",
  "sugar_level",
  "ice_level",
  "note",
  "session_id",
  "created_at"
];

function doGet(e) {
  return handleRequest(e ? e.parameter : {}, null);
}

function doPost(e) {
  let params = e && e.parameter ? e.parameter : {};
  let body = {};
  if (e && e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      body = {};
    }
  }
  const merged = Object.assign({}, params, body);
  return handleRequest(merged, body.data || body.values || merged.data);
}

function handleRequest(params, dataPayload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (params.action || params.operation || "list").toLowerCase();
    const tableName = params.table || params.sheet;

    // 1. If no table name specified, list available sheets (default GET behavior)
    if (!tableName) {
      const sheets = ss.getSheets().map(function(s) { return s.getName(); });
      return jsonResponse({ ok: true, data: sheets });
    }

    // 2. Get or create sheet tab
    let sheet = ss.getSheetByName(tableName);
    if (!sheet) {
      sheet = ss.insertSheet(tableName);
    }

    // 3. Ensure header row exists
    ensureHeaders(sheet);

    // 4. Handle Actions
    if (action === "select" || action === "read" || action === "list") {
      const rows = readAllRows(sheet);
      return jsonResponse({ ok: true, data: rows });
    }

    if (action === "insert" || action === "add") {
      const items = Array.isArray(dataPayload) ? dataPayload : [dataPayload || params];
      const inserted = insertRows(sheet, items);
      return jsonResponse({ ok: true, data: inserted });
    }

    if (action === "update") {
      const where = params.where || {};
      const patch = params.data || params.values || dataPayload || {};
      const updated = updateRows(sheet, where, patch);
      return jsonResponse({ ok: true, data: updated });
    }

    if (action === "delete" || action === "remove") {
      const where = params.where || {};
      if (params.id) where.id = params.id;
      if (params.session_id) where.session_id = params.session_id;
      const count = deleteRows(sheet, where);
      return jsonResponse({ ok: true, data: { deleted: count } });
    }

    return jsonResponse({ ok: false, error: "Unsupported action: " + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, DEFAULT_COLUMNS.length).setValues([DEFAULT_COLUMNS]);
    sheet.getRange(1, 1, 1, DEFAULT_COLUMNS.length).setFontWeight("bold");
    return DEFAULT_COLUMNS;
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return String(h).trim();
  });
  if (headers.filter(Boolean).length === 0) {
    sheet.getRange(1, 1, 1, DEFAULT_COLUMNS.length).setValues([DEFAULT_COLUMNS]);
    sheet.getRange(1, 1, 1, DEFAULT_COLUMNS.length).setFontWeight("bold");
    return DEFAULT_COLUMNS;
  }
  return headers;
}

function readAllRows(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).trim();
  });
  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return data.map(function(rowVals) {
    const obj = {};
    headers.forEach(function(h, idx) {
      if (h) obj[h] = rowVals[idx];
    });
    return obj;
  });
}

function insertRows(sheet, items) {
  const headers = ensureHeaders(sheet);
  const rowsToAppend = [];
  const insertedItems = [];

  items.forEach(function(item) {
    if (!item || typeof item !== "object") return;
    const rowObj = Object.assign({}, item);
    if (!rowObj.id) rowObj.id = Date.now() + Math.floor(Math.random() * 1000);
    if (!rowObj.created_at) rowObj.created_at = new Date().toISOString();

    const rowArray = headers.map(function(h) {
      return (rowObj[h] !== undefined && rowObj[h] !== null) ? rowObj[h] : "";
    });
    rowsToAppend.push(rowArray);
    insertedItems.push(rowObj);
  });

  if (rowsToAppend.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
  }
  return insertedItems;
}

function updateRows(sheet, where, patch) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).trim();
  });
  const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  const data = dataRange.getValues();
  let updatedCount = 0;

  for (let i = 0; i < data.length; i++) {
    const rowObj = {};
    headers.forEach(function(h, idx) { rowObj[h] = data[i][idx]; });

    const matches = Object.keys(where).every(function(k) {
      return String(rowObj[k] || "").trim().toLowerCase() === String(where[k] || "").trim().toLowerCase();
    });
    if (matches) {
      headers.forEach(function(h, idx) {
        if (patch[h] !== undefined) {
          data[i][idx] = patch[h];
        }
      });
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    dataRange.setValues(data);
  }
  return { updated: updatedCount };
}

function deleteRows(sheet, where) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return 0;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).trim();
  });
  const data = sheet.getRange(2, 1, lastRow - 1, lastCol);
  const values = data.getValues();
  let deletedCount = 0;

  for (let i = values.length - 1; i >= 0; i--) {
    const rowObj = {};
    headers.forEach(function(h, idx) { rowObj[h] = values[i][idx]; });

    const matches = Object.keys(where).length === 0 || Object.keys(where).every(function(k) {
      return String(rowObj[k] || "").trim().toLowerCase() === String(where[k] || "").trim().toLowerCase();
    });
    if (matches) {
      sheet.deleteRow(i + 2);
      deletedCount++;
    }
  }
  return deletedCount;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
