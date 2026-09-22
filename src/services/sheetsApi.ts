import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  ProcessedSheetData,
  SpreadsheetMetadata,
  SheetTabInfo,
} from '../types';
import { SAMPLE_DATASETS } from './sampleData';

/**
 * Extracts a Google Spreadsheet ID from a URL or raw ID string.
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pattern: https://docs.google.com/spreadsheets/d/(?:e/)?([a-zA-Z0-9-_]+)
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/(?:e\/)?([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // If already an ID: alphanumeric with hyphens/underscores, usually ~44 chars
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Extracts the sheet tab 'gid' if present in the URL (e.g. #gid=12345678)
 */
export function extractGidFromUrl(url: string): number | null {
  if (!url) return null;
  const match = url.match(/[#&]gid=([0-9]+)/);
  return match && match[1] ? parseInt(match[1], 10) : null;
}

/**
 * Fetches spreadsheet metadata (title and sheet tabs) via Google Sheets API v4
 */
export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetMetadata> {
  // Check if it's a sample dataset
  const sample = SAMPLE_DATASETS.find((s) => s.id === spreadsheetId);
  if (sample) {
    return {
      id: sample.id,
      title: sample.title,
      sheets: [
        {
          sheetId: 0,
          title: sample.sheetName,
          index: 0,
          rowCount: sample.rows.length,
          columnCount: sample.rows[0]?.length || 0,
        },
      ],
      lastFetchedAt: new Date().toISOString(),
    };
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title,index,gridProperties)`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData?.error?.message ||
      `Google Sheets API Error (${res.status}: ${res.statusText})`;
    throw new Error(message);
  }

  const data = await res.json();
  const sheets: SheetTabInfo[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId ?? 0,
    title: s.properties?.title || 'Sheet1',
    index: s.properties?.index ?? 0,
    rowCount: s.properties?.gridProperties?.rowCount,
    columnCount: s.properties?.gridProperties?.columnCount,
  }));

  return {
    id: spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets,
    lastFetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetches raw cell values from a specific sheet/tab via Google Sheets API
 */
export async function fetchSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string
): Promise<(string | number | boolean | null)[][]> {
  // Check sample dataset
  const sample = SAMPLE_DATASETS.find((s) => s.id === spreadsheetId);
  if (sample) {
    return sample.rows;
  }

  const range = `'${sheetTitle.replace(/'/g, "''")}'!A1:ZZ50000`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}?valueRenderOption=FORMATTED_VALUE`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `Failed to fetch values from sheet "${sheetTitle}"`
    );
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Fetches spreadsheet metadata (title and sheet tabs) for public sheets without OAuth tokens
 */
export async function fetchPublicSpreadsheetMetadata(
  spreadsheetId: string,
  customUrl?: string
): Promise<SpreadsheetMetadata> {
  // Check if sample dataset
  const sample = SAMPLE_DATASETS.find((s) => s.id === spreadsheetId);
  if (sample) {
    return {
      id: sample.id,
      title: sample.title,
      sheets: [
        {
          sheetId: 0,
          title: sample.sheetName,
          index: 0,
          rowCount: sample.rows.length,
          columnCount: sample.rows[0]?.length || 0,
        },
      ],
      lastFetchedAt: new Date().toISOString(),
    };
  }

  // 1. Try our server proxy endpoint
  try {
    const res = await fetch(`/api/sheets-info?id=${encodeURIComponent(spreadsheetId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.sheets && data.sheets.length > 0) {
        return {
          id: spreadsheetId,
          title: data.title || 'Google Spreadsheet (สาธารณะ)',
          sheets: data.sheets,
          url: customUrl,
          lastFetchedAt: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('Failed to fetch public sheet info via proxy:', err);
  }

  // Fallback: extract GID from URL if present
  const extractedGid = customUrl ? extractGidFromUrl(customUrl) : null;
  return {
    id: spreadsheetId,
    title: 'Google Spreadsheet',
    sheets: [
      {
        sheetId: extractedGid ?? 0,
        title: extractedGid !== null ? `Sheet (gid:${extractedGid})` : 'Sheet1',
        index: 0,
      },
    ],
    url: customUrl,
    lastFetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetches public Google Sheet data directly in browser using Google Visualization JSONP.
 * This bypasses all browser CORS restrictions and works completely offline/standalone
 * without requiring any backend server or Google login!
 */
export function fetchPublicSheetGvizJsonp(
  spreadsheetId: string,
  sheetTitleOrGid?: string,
  gid?: number | null
): Promise<(string | number | boolean | null)[][] | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }

  let resolvedGid: number | null = gid ?? null;
  let resolvedTitle: string | undefined = sheetTitleOrGid;

  if (sheetTitleOrGid) {
    const gidMatch = sheetTitleOrGid.match(/gid[:=]([0-9]+)/i);
    if (gidMatch && gidMatch[1]) {
      resolvedGid = parseInt(gidMatch[1], 10);
    } else if (/^[0-9]+$/.test(sheetTitleOrGid.trim())) {
      resolvedGid = parseInt(sheetTitleOrGid.trim(), 10);
    }
  }

  return new Promise((resolve) => {
    const callbackName = `_gviz_cb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    let isResolved = false;

    // Timeout after 8 seconds
    const timer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(null);
      }
    }, 8000);

    const cleanup = () => {
      clearTimeout(timer);
      try {
        delete (window as any)[callbackName];
      } catch {}
      const existingScript = document.getElementById(callbackName);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };

    (window as any)[callbackName] = (data: any) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();

      try {
        if (!data || data.status === 'error' || !data.table) {
          resolve(null);
          return;
        }

        const table = data.table;
        const cols = table.cols || [];
        const rawRows = table.rows || [];
        const rows: (string | number | boolean | null)[][] = [];

        // Check if header row is inside cols
        const hasColLabels = cols.some((col: any) => col && col.label && col.label.trim() !== '');
        if (data.parsedNumHeaders > 0 || (hasColLabels && rawRows.length > 0)) {
          const firstRowValues = rawRows[0]?.c?.map((cell: any) => (cell ? (cell.v ?? cell.f) : '')) || [];
          const colLabels = cols.map((col: any) => col?.label || '');
          const isSameAsFirstRow = colLabels.every(
            (lbl: string, i: number) => !lbl || String(lbl).trim() === String(firstRowValues[i] || '').trim()
          );
          if (!isSameAsFirstRow && hasColLabels) {
            rows.push(colLabels);
          }
        }

        for (const r of rawRows) {
          if (!r || !r.c) continue;
          const rowValues = r.c.map((cell: any) => {
            if (!cell) return null;
            if (cell.v !== undefined && cell.v !== null) {
              if (typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
                return cell.f || cell.v;
              }
              return cell.v;
            }
            return cell.f !== undefined ? cell.f : null;
          });

          const hasValue = rowValues.some((v: any) => v !== null && v !== undefined && v !== '');
          if (hasValue) {
            rows.push(rowValues);
          }
        }

        // Trim trailing empty columns
        let maxCol = 0;
        for (const row of rows) {
          for (let i = row.length - 1; i >= 0; i--) {
            if (row[i] !== null && row[i] !== undefined && row[i] !== '') {
              if (i + 1 > maxCol) maxCol = i + 1;
              break;
            }
          }
        }

        if (maxCol > 0) {
          resolve(rows.map((r) => r.slice(0, maxCol)));
        } else {
          resolve(rows.length > 0 ? rows : null);
        }
      } catch (parseErr) {
        console.warn('Error parsing gviz response:', parseErr);
        resolve(null);
      }
    };

    let queryParams = `?tqx=responseHandler:${callbackName}`;
    if (resolvedGid !== null && !isNaN(resolvedGid)) {
      queryParams += `&gid=${resolvedGid}`;
    }
    if (resolvedTitle && !resolvedTitle.startsWith('Sheet (gid:')) {
      queryParams += `&sheet=${encodeURIComponent(resolvedTitle)}`;
    }

    const script = document.createElement('script');
    script.id = callbackName;
    script.src = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq${queryParams}`;
    script.onerror = () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(null);
      }
    };
    document.body.appendChild(script);
  });
}

/**
 * Attempts to fetch a public Google Sheet without requiring OAuth tokens.
 * Works if the sheet sharing is set to "Anyone with the link can view".
 */
export async function fetchPublicSheetCsv(
  spreadsheetId: string,
  sheetTitleOrGid?: string,
  gid?: number | null
): Promise<(string | number | boolean | null)[][] | null> {
  let resolvedGid: number | null = gid ?? null;
  let resolvedTitle: string | undefined = sheetTitleOrGid;

  if (sheetTitleOrGid) {
    const gidMatch = sheetTitleOrGid.match(/gid[:=]([0-9]+)/i);
    if (gidMatch && gidMatch[1]) {
      resolvedGid = parseInt(gidMatch[1], 10);
    } else if (/^[0-9]+$/.test(sheetTitleOrGid.trim())) {
      resolvedGid = parseInt(sheetTitleOrGid.trim(), 10);
    }
  }

  // 1. First priority: Direct JSONP in browser (zero CORS, zero backend server, zero Google sign-in required!)
  try {
    const jsonpResult = await fetchPublicSheetGvizJsonp(
      spreadsheetId,
      resolvedTitle,
      resolvedGid
    );
    if (jsonpResult && jsonpResult.length > 0) {
      return jsonpResult;
    }
  } catch (jsonpErr) {
    console.warn('Direct JSONP fetch notice:', jsonpErr);
  }

  // 2. If it's a published Google Sheet link (/d/e/2PACX-...), fetch the published CSV directly
  if (spreadsheetId.startsWith('2PACX-')) {
    try {
      let pubUrl = `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub?output=csv`;
      if (resolvedGid !== null && !isNaN(resolvedGid)) {
        pubUrl += `&gid=${resolvedGid}`;
      }
      const pubRes = await fetch(pubUrl);
      if (pubRes.ok) {
        const text = await pubRes.text();
        if (text && !text.includes('<!DOCTYPE html>') && !text.includes('accounts.google.com')) {
          const parsed = await parseUploadedFileText(text);
          if (parsed && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (pubErr) {
      console.warn('Published sheet CSV fetch notice:', pubErr);
    }
  }

  // 3. Try our server-side proxy endpoint (when running full-stack / in dev server)
  try {
    const params = new URLSearchParams({ id: spreadsheetId });
    if (resolvedGid !== null && !isNaN(resolvedGid)) {
      params.set('gid', resolvedGid.toString());
    }
    if (resolvedTitle && !resolvedTitle.startsWith('Sheet (gid:')) {
      params.set('sheet', resolvedTitle);
    }
    const proxyRes = await fetch(`/api/sheets-csv?${params.toString()}`);
    if (proxyRes.ok) {
      const text = await proxyRes.text();
      if (text && !text.includes('<!DOCTYPE html>') && !text.includes('accounts.google.com')) {
        const parsed = await parseUploadedFileText(text);
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (proxyErr) {
    // Normal in offline mode
  }

  // 4. Direct browser fetch attempts
  const urlsToTry: string[] = [];
  if (resolvedGid !== null && !isNaN(resolvedGid)) {
    urlsToTry.push(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${resolvedGid}`
    );
    urlsToTry.push(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${resolvedGid}`
    );
  }

  if (resolvedTitle && !resolvedTitle.startsWith('Sheet (gid:')) {
    urlsToTry.push(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
        resolvedTitle
      )}`
    );
  }

  urlsToTry.push(
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`
  );

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      if (
        !text ||
        text.includes('<!DOCTYPE html>') ||
        text.includes('<html') ||
        text.includes('google-site-verification') ||
        text.includes('accounts.google.com')
      ) {
        continue;
      }
      const parsed = await parseUploadedFileText(text);
      if (parsed && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Continue to next attempt
    }
  }

  return null;
}

/**
 * Parses uploaded CSV / TSV text or file
 */
export function parseUploadedFileText(
  csvText: string
): Promise<(string | number | boolean | null)[][]> {
  // Strip UTF-8 BOM if present
  const cleanCsv = csvText.replace(/^\uFEFF/, '');
  return new Promise((resolve, reject) => {
    Papa.parse(cleanCsv, {
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn('Papa parse warnings:', results.errors);
        }
        resolve(results.data as (string | number | boolean | null)[][]);
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Automatically inspects the first rows to locate the most probable header row.
 * Scans for the row that has the highest count of non-empty text headers.
 */
export function detectHeaderRow(
  rawRows: (string | number | boolean | null)[][]
): { headerRow: number; dataStartRow: number } {
  if (!rawRows || rawRows.length === 0) {
    return { headerRow: 1, dataStartRow: 2 };
  }

  let bestRowIndex = 0;
  let maxScore = -1;

  const maxScan = Math.min(12, rawRows.length);
  for (let r = 0; r < maxScan; r++) {
    const row = rawRows[r] || [];
    const nonBlankCells = row
      .map((c) => String(c ?? '').trim())
      .filter((s) => s.length > 0);
    if (nonBlankCells.length === 0) continue;

    // Header cells are almost always text (not pure numbers)
    let textScore = 0;
    for (const cell of nonBlankCells) {
      const cleanNum = cell.replace(/[$,฿€£%,\s]/g, '');
      const isNum = cleanNum !== '' && !isNaN(Number(cleanNum));
      if (!isNum) {
        textScore += 2;
      } else {
        textScore += 0.5;
      }
    }

    if (textScore > maxScore) {
      maxScore = textScore;
      bestRowIndex = r;
    }
  }

  return {
    headerRow: bestRowIndex + 1,
    dataStartRow: bestRowIndex + 2,
  };
}

function getExcelColumnLetter(colNum: number): string {
  let temp = colNum;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

export interface ParsedFileResult {
  rows: (string | number | boolean | null)[][];
  fileName: string;
  sheetNames: string[];
  workbookSheets?: Record<string, (string | number | boolean | null)[][]>;
}

/**
 * Parses uploaded file (supports .xlsx, .xls, .csv, .tsv, .txt)
 */
export async function parseUploadedFileObject(
  file: File
): Promise<ParsedFileResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetNames = workbook.SheetNames || ['Sheet1'];
    const workbookSheets: Record<string, (string | number | boolean | null)[][]> = {};

    for (const sName of sheetNames) {
      const ws = workbook.Sheets[sName];
      if (ws) {
        workbookSheets[sName] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: '',
        }) as (string | number | boolean | null)[][];
      } else {
        workbookSheets[sName] = [];
      }
    }

    const firstSheet = sheetNames[0] || 'Sheet1';
    return {
      rows: workbookSheets[firstSheet] || [],
      fileName: file.name,
      sheetNames,
      workbookSheets,
    };
  } else {
    // CSV / TSV / text
    const text = await file.text();
    const rows = await parseUploadedFileText(text);
    return {
      rows,
      fileName: file.name,
      sheetNames: ['Sheet1'],
      workbookSheets: { Sheet1: rows },
    };
  }
}

/**
 * Transforms raw 2D grid into structured data, with customizable header and data row offsets
 */
export function processSheetGrid(
  rawRows: (string | number | boolean | null)[][],
  headerRowIndex: number = 1, // 1-based (Row 1 = index 0)
  dataStartRowIndex: number = 2, // 1-based (Row 2 = index 1)
  dataEndRowIndex?: number,
  selectedColumns?: string[]
): ProcessedSheetData {
  if (!rawRows || rawRows.length === 0) {
    return {
      headers: [],
      rawRows: [],
      records: [],
      numericColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      totalRows: 0,
    };
  }

  let actualHeaderIndex = Math.max(0, headerRowIndex - 1);
  let actualDataStartIndex = Math.max(actualHeaderIndex + 1, dataStartRowIndex - 1);

  // If user used default (headerRowIndex = 1) but row 0 is completely empty or single-cell note,
  // auto-check if detectHeaderRow finds a better row with actual column titles
  if (headerRowIndex === 1 && rawRows.length > 1) {
    const row0NonBlank = (rawRows[0] || []).filter((c) => String(c ?? '').trim() !== '');
    if (row0NonBlank.length <= 1) {
      const detected = detectHeaderRow(rawRows);
      if (detected.headerRow > 1) {
        actualHeaderIndex = detected.headerRow - 1;
        actualDataStartIndex = Math.max(actualHeaderIndex + 1, dataStartRowIndex - 1);
      }
    }
  }

  const headerRaw = rawRows[actualHeaderIndex] || [];

  // Determine end slice
  let dataRows = rawRows.slice(actualDataStartIndex);
  if (dataEndRowIndex && dataEndRowIndex >= dataStartRowIndex) {
    const sliceCount = dataEndRowIndex - dataStartRowIndex + 1;
    dataRows = dataRows.slice(0, sliceCount);
  }

  // Filter out purely empty rows
  dataRows = dataRows.filter((r) =>
    r.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
  );

  // Find maximum column index that actually contains non-empty cell in header or data
  const maxPossibleCols = Math.max(headerRaw.length, ...dataRows.slice(0, 100).map((r) => r.length));
  let lastNonEmptyColIndex = -1;

  for (let c = 0; c < maxPossibleCols; c++) {
    const headerVal = headerRaw[c];
    const hasHeader = headerVal !== undefined && headerVal !== null && String(headerVal).trim() !== '';
    let hasData = false;
    for (let r = 0; r < Math.min(100, dataRows.length); r++) {
      const cell = dataRows[r]?.[c];
      if (cell !== undefined && cell !== null && String(cell).trim() !== '') {
        hasData = true;
        break;
      }
    }
    if (hasHeader || hasData) {
      lastNonEmptyColIndex = c;
    }
  }

  const headerCount = lastNonEmptyColIndex >= 0 ? lastNonEmptyColIndex + 1 : headerRaw.length;

  // Preserve original headers from source sheet strictly, with smart stacked header resolution ("ซ้อนคำ")
  const headers: string[] = [];
  const seenHeaderCounts: Record<string, number> = {};

  for (let i = 0; i < headerCount; i++) {
    let name = String(headerRaw[i] ?? '').trim();
    // Normalize newlines and whitespace within a cell
    name = name.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    name = name.replace(/^[\uFEFF\u200B]+/, '').trim();

    // Check parent rows if multi-row headers exist (e.g. Row 1 or Row 2 before actualHeaderIndex)
    let parentHeader = '';
    if (actualHeaderIndex > 0) {
      const parentRow = rawRows[actualHeaderIndex - 1] || [];
      let pVal = String(parentRow[i] ?? '').trim();
      pVal = pVal.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
      pVal = pVal.replace(/^[\uFEFF\u200B]+/, '').trim();

      // If pVal is empty, check if parentRow has a merged cell extending horizontally from the left
      if (!pVal) {
        for (let colBack = i - 1; colBack >= 0; colBack--) {
          const backVal = String(parentRow[colBack] ?? '').trim();
          if (backVal) {
            pVal = backVal;
            break;
          }
        }
      }
      if (pVal) {
        parentHeader = pVal;
      }
    }

    // Stack / resolve words ("ซ้อนคำตามนั้นได้ด้วย"):
    if (!name) {
      // If current row cell is blank, inherit from parent header
      if (parentHeader) {
        name = parentHeader;
      } else if (actualHeaderIndex > 1) {
        const topRow = rawRows[0] || [];
        const topVal = String(topRow[i] ?? '').trim();
        if (topVal) name = topVal;
      }
    } else if (
      parentHeader &&
      parentHeader.toLowerCase() !== name.toLowerCase() &&
      !name.toLowerCase().includes(parentHeader.toLowerCase()) &&
      !parentHeader.toLowerCase().includes(name.toLowerCase())
    ) {
      // Stack words from parent and child: "Parent Child" e.g. "VESSEL SCHEDULE"
      name = `${parentHeader} ${name}`.trim();
    }

    if (!name) {
      // If column had no header in source sheet, use standard spreadsheet letter (e.g. "คอลัมน์ A")
      name = `คอลัมน์ ${getExcelColumnLetter(i + 1)}`;
    }

    if (seenHeaderCounts[name]) {
      seenHeaderCounts[name] += 1;
      name = `${name} (${seenHeaderCounts[name]})`;
    } else {
      seenHeaderCounts[name] = 1;
    }
    headers.push(name);
  }

  // Build records
  const records: Record<string, any>[] = [];
  dataRows.forEach((row, rowIndex) => {
    const record: Record<string, any> = { _rowIndex: actualDataStartIndex + rowIndex + 1 };
    headers.forEach((header, colIndex) => {
      let val = row[colIndex];
      if (val === undefined || val === null) {
        val = '';
      }
      record[header] = val;
    });
    records.push(record);
  });

  // Analyze column data types
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];
  const dateColumns: string[] = [];

  headers.forEach((header) => {
    let numCount = 0;
    let dateCount = 0;
    let populatedCount = 0;

    records.forEach((rec) => {
      const v = rec[header];
      if (v !== '' && v !== null && v !== undefined) {
        populatedCount++;
        // Check if numeric (handles currencies, commas, % signs)
        const cleanStr = String(v).replace(/[$,฿€£%,\s]/g, '');
        if (cleanStr !== '' && !isNaN(Number(cleanStr))) {
          numCount++;
        }
        // Check if date-like
        if (
          typeof v === 'string' &&
          (v.includes('-') || v.includes('/') || v.includes('.')) &&
          !isNaN(Date.parse(v))
        ) {
          dateCount++;
        }
      }
    });

    if (populatedCount > 0 && numCount / populatedCount > 0.6) {
      numericColumns.push(header);
    } else if (populatedCount > 0 && dateCount / populatedCount > 0.6) {
      dateColumns.push(header);
      categoricalColumns.push(header);
    } else {
      categoricalColumns.push(header);
    }
  });

  return {
    headers,
    rawRows,
    records,
    numericColumns,
    categoricalColumns,
    dateColumns,
    totalRows: records.length,
  };
}

/**
 * Safely parses a number from any currency/formatted string
 */
export function parseCleanNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const clean = String(val).replace(/[$,฿€£%,\s]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
