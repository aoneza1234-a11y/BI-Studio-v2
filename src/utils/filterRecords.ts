import { FilterState } from '../types';

/**
 * Normalizes various date string formats into a standard Date object if possible
 */
export function parseRecordDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;

  const str = String(val).trim();
  if (!str) return null;

  // Try standard Date.parse (handles YYYY-MM-DD, ISO, etc.)
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    // If Buddhist year (e.g. 2568 -> 2025)
    if (year > 2400) year -= 543;
    else if (year < 100) year += 2000;

    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export interface DateRangeOptions {
  availableYears: string[];
  availableMonths: { value: string; label: string }[];
}

export const THAI_MONTHS = [
  { value: '01', label: 'มกราคม (Jan)' },
  { value: '02', label: 'กุมภาพันธ์ (Feb)' },
  { value: '03', label: 'มีนาคม (Mar)' },
  { value: '04', label: 'เมษายน (Apr)' },
  { value: '05', label: 'พฤษภาคม (May)' },
  { value: '06', label: 'มิถุนายน (Jun)' },
  { value: '07', label: 'กรกฎาคม (Jul)' },
  { value: '08', label: 'สิงหาคม (Aug)' },
  { value: '09', label: 'กันยายน (Sep)' },
  { value: '10', label: 'ตุลาคม (Oct)' },
  { value: '11', label: 'พฤศจิกายน (Nov)' },
  { value: '12', label: 'ธันวาคม (Dec)' },
];

/**
 * Extracts available distinct years and months from the records for a given date column
 */
export function extractDateOptions(
  records: Record<string, any>[],
  dateColumn: string
): DateRangeOptions {
  const yearsSet = new Set<string>();

  if (dateColumn) {
    records.forEach((rec) => {
      const d = parseRecordDate(rec[dateColumn]);
      if (d) {
        yearsSet.add(String(d.getFullYear()));
      }
    });
  }

  const sortedYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  return {
    availableYears: sortedYears,
    availableMonths: THAI_MONTHS,
  };
}

export interface DistinctCategoryOption {
  value: string;
  label?: string;
  count: number;
  isBlank?: boolean;
}

/**
 * Extracts distinct categorical values with counts, including blank/empty rows (like Excel)
 */
export function extractDistinctCategories(
  records: Record<string, any>[],
  column: string
): DistinctCategoryOption[] {
  if (!column) return [];

  const counts: Record<string, number> = {};
  let blankCount = 0;

  records.forEach((r) => {
    const val = r[column];
    if (val === undefined || val === null || String(val).trim() === '') {
      blankCount++;
    } else {
      const s = String(val).trim();
      counts[s] = (counts[s] || 0) + 1;
    }
  });

  const list: DistinctCategoryOption[] = Object.entries(counts)
    .map(([value, count]) => ({ value, label: value, count, isBlank: false }))
    .sort((a, b) => b.count - a.count);

  if (blankCount > 0) {
    list.push({
      value: '__blank__',
      label: '(ว่าง)',
      count: blankCount,
      isBlank: true,
    });
  }

  return list;
}

/**
 * Filters the sheet records according to the active FilterState.
 * Can optionally skip a specific column filter (essential for cascading dependent filter dropdowns!)
 */
export function filterRecordsExcept(
  records: Record<string, any>[],
  filters: FilterState,
  skipColumn?: string
): Record<string, any>[] {
  if (!records || records.length === 0) return [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  return records.filter((rec) => {
    // 1. Text Search Filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matches = Object.values(rec).some((val) =>
        String(val ?? '').toLowerCase().includes(q)
      );
      if (!matches) return false;
    }

    // 2. Date Column Filter
    if (filters.dateColumn && filters.dateColumn !== skipColumn) {
      const recDate = parseRecordDate(rec[filters.dateColumn]);

      if (filters.datePreset && filters.datePreset !== 'all') {
        if (!recDate) {
          // If filtering by date, omit rows without valid dates
          return false;
        }

        if (filters.datePreset === 'this_month') {
          if (
            recDate.getFullYear() !== currentYear ||
            recDate.getMonth() !== currentMonth
          ) {
            return false;
          }
        } else if (filters.datePreset === 'last_month') {
          const lastMonthTarget = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (
            recDate.getFullYear() !== lastMonthYear ||
            recDate.getMonth() !== lastMonthTarget
          ) {
            return false;
          }
        } else if (filters.datePreset === 'this_year') {
          if (recDate.getFullYear() !== currentYear) {
            return false;
          }
        } else if (filters.datePreset === 'specific_month') {
          if (filters.selectedYear && String(recDate.getFullYear()) !== filters.selectedYear) {
            return false;
          }
          if (filters.selectedMonth) {
            const m = String(recDate.getMonth() + 1).padStart(2, '0');
            if (m !== filters.selectedMonth) {
              return false;
            }
          }
        } else if (filters.datePreset === 'custom') {
          if (filters.startDate) {
            const start = new Date(`${filters.startDate}T00:00:00`);
            if (recDate < start) return false;
          }
          if (filters.endDate) {
            const end = new Date(`${filters.endDate}T23:59:59`);
            if (recDate > end) return false;
          }
        }
      }
    }

    // 3. Categorical Filters (skip if col === skipColumn)
    for (const [col, selectedVal] of Object.entries(filters.categoryFilters || {})) {
      if (col === skipColumn) continue;
      if (selectedVal && selectedVal !== '__all__') {
        const cellRaw = rec[col];
        const isCellBlank =
          cellRaw === undefined || cellRaw === null || String(cellRaw).trim() === '';

        // Excel-like blank filtering: '__blank__', '(ว่าง)', '(Blank)', '""'
        if (
          selectedVal === '__blank__' ||
          selectedVal === '(ว่าง)' ||
          selectedVal === '(Blank)' ||
          selectedVal === '""'
        ) {
          if (!isCellBlank) return false;
        } else {
          if (isCellBlank) return false;
          const cellVal = String(cellRaw).trim();
          if (cellVal !== selectedVal) {
            return false;
          }
        }
      }
    }

    // 4. SQL-Like Filter Expression (e.g. Revenue > 100000 AND Province = 'Chonburi')
    if (filters.sqlFilterQuery && filters.sqlFilterQuery.trim()) {
      if (!evaluateSqlCondition(rec, filters.sqlFilterQuery.trim())) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Evaluates a single SQL-like condition or compound condition with AND / OR
 */
export function evaluateSqlCondition(record: Record<string, any>, sql: string): boolean {
  if (!sql || !sql.trim()) return true;

  try {
    // Split by OR first (lower precedence)
    const orParts = sql.split(/\s+OR\s+/i);
    return orParts.some((orClause) => {
      // Split each OR block by AND (higher precedence)
      const andParts = orClause.split(/\s+AND\s+/i);
      return andParts.every((andClause) => evaluateSinglePredicate(record, andClause.trim()));
    });
  } catch (err) {
    return true; // Fallback gracefully if user is still typing incomplete SQL
  }
}

function evaluateSinglePredicate(record: Record<string, any>, predicate: string): boolean {
  if (!predicate) return true;

  // Match: column operator value
  // Operators: >=, <=, !=, <>, >, <, =, LIKE, NOT LIKE, IN
  const match = predicate.match(
    /^(\[[^\]]+\]|[a-zA-Z0-9_\u0E00-\u0E7F\s]+?)\s*(>=|<=|!=|<>|>|<|=|LIKE|NOT\s+LIKE|IN)\s*(.+)$/i
  );

  if (!match) return true;

  let [, rawCol, op, rawVal] = match;
  rawCol = rawCol.replace(/^\[|\]$/g, '').trim();
  op = op.toUpperCase().trim();
  rawVal = rawVal.trim();

  // Find matching column in record
  let actualValue = record[rawCol];
  if (actualValue === undefined) {
    const key = Object.keys(record).find(
      (k) => k.toLowerCase() === rawCol.toLowerCase()
    );
    if (key) actualValue = record[key];
  }

  // Value parsing
  const isQuoted =
    (rawVal.startsWith("'") && rawVal.endsWith("'")) ||
    (rawVal.startsWith('"') && rawVal.endsWith('"'));
  const cleanVal = isQuoted ? rawVal.slice(1, -1) : rawVal;

  const numRecordVal = Number(String(actualValue).replace(/[^0-9.-]+/g, ''));
  const numTargetVal = Number(cleanVal.replace(/[^0-9.-]+/g, ''));
  const isNumericCompare =
    !isNaN(numRecordVal) &&
    !isNaN(numTargetVal) &&
    cleanVal !== '' &&
    !isQuoted &&
    op !== 'LIKE' &&
    op !== 'NOT LIKE';

  switch (op) {
    case '=':
      if (isNumericCompare) return numRecordVal === numTargetVal;
      return String(actualValue ?? '').toLowerCase() === cleanVal.toLowerCase();
    case '!=':
    case '<>':
      if (isNumericCompare) return numRecordVal !== numTargetVal;
      return String(actualValue ?? '').toLowerCase() !== cleanVal.toLowerCase();
    case '>':
      return isNumericCompare ? numRecordVal > numTargetVal : false;
    case '>=':
      return isNumericCompare ? numRecordVal >= numTargetVal : false;
    case '<':
      return isNumericCompare ? numRecordVal < numTargetVal : false;
    case '<=':
      return isNumericCompare ? numRecordVal <= numTargetVal : false;
    case 'LIKE': {
      const pattern = cleanVal.replace(/%/g, '.*').replace(/_/g, '.');
      const reg = new RegExp(`^${pattern}$`, 'i');
      return reg.test(String(actualValue ?? ''));
    }
    case 'NOT LIKE': {
      const pattern = cleanVal.replace(/%/g, '.*').replace(/_/g, '.');
      const reg = new RegExp(`^${pattern}$`, 'i');
      return !reg.test(String(actualValue ?? ''));
    }
    case 'IN': {
      // e.g. ('Chonburi', 'Bangkok')
      const inItems = cleanVal
        .replace(/^\(|\)$/g, '')
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, '').toLowerCase());
      return inItems.includes(String(actualValue ?? '').toLowerCase());
    }
    default:
      return true;
  }
}


/**
 * Filters the sheet records according to the active FilterState
 */
export function filterRecords(
  records: Record<string, any>[],
  filters: FilterState
): Record<string, any>[] {
  return filterRecordsExcept(records, filters);
}
