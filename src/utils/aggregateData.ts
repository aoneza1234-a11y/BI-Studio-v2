import { AggregationType, WidgetConfig, WidgetFilterRule } from '../types';
import { parseCleanNumber } from '../services/sheetsApi';

export interface ChartDataPoint {
  name: string;
  value: number;
  secondaryValue?: number;
  count?: number;
  formattedValue?: string;
  [key: string]: any;
}

export function evaluateFilterRule(
  record: Record<string, any>,
  rule: WidgetFilterRule
): boolean {
  if (!rule || !rule.column) return true;

  const rawCell = record[rule.column];
  const cellVal = String(rawCell ?? '').trim();
  const cellLower = cellVal.toLowerCase();
  const isCellEmpty = cellVal === '';

  // Determine comparison target
  let targetVal = '';
  if (rule.compareMode === 'column' || rule.operator.startsWith('col_')) {
    const colToCompare = rule.compareColumn || rule.value || '';
    targetVal = String(record[colToCompare] ?? '').trim();
  } else {
    targetVal = String(rule.value ?? '').trim();
  }
  const targetLower = targetVal.toLowerCase();

  const isTargetEmpty =
    targetVal === '' ||
    targetVal === '""' ||
    targetVal === "''" ||
    targetLower === '(ว่าง)' ||
    targetLower === '(blank)' ||
    targetLower === '__blank__';

  switch (rule.operator) {
    case 'is_empty':
      return isCellEmpty;
    case 'not_empty':
      return !isCellEmpty;
    case 'equals':
    case 'col_equals':
      if (isTargetEmpty && rule.compareMode !== 'column') {
        return isCellEmpty;
      }
      return cellLower === targetLower;
    case 'not_equals':
    case 'col_not_equals':
      if (isTargetEmpty && rule.compareMode !== 'column') {
        return !isCellEmpty;
      }
      return cellLower !== targetLower;
    case 'contains':
      return cellLower.includes(targetLower);
    case 'not_contains':
      return !cellLower.includes(targetLower);
    case 'greater_than':
    case 'col_greater': {
      const numA = parseCleanNumber(cellVal);
      const numB = parseCleanNumber(targetVal);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA > numB;
      }
      return cellLower > targetLower;
    }
    case 'less_than':
    case 'col_less': {
      const numA = parseCleanNumber(cellVal);
      const numB = parseCleanNumber(targetVal);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA < numB;
      }
      return cellLower < targetLower;
    }
    case 'greater_than_or_equal': {
      const numA = parseCleanNumber(cellVal);
      const numB = parseCleanNumber(targetVal);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA >= numB;
      }
      return cellLower >= targetLower;
    }
    case 'less_than_or_equal': {
      const numA = parseCleanNumber(cellVal);
      const numB = parseCleanNumber(targetVal);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA <= numB;
      }
      return cellLower <= targetLower;
    }
    default:
      return true;
  }
}

/**
 * ฟังก์ชันเปรียบเทียบค่า 2 คอลัมน์ตามเงื่อนไข (Two-Column Comparison Evaluation)
 * เช่น Col A = Col B, Col A > Col B, Col A < Col B
 */
export function evaluateTwoColumnComparison(
  rawA: any,
  rawB: any,
  operator: string = 'equals'
): boolean {
  const strA = String(rawA ?? '').trim();
  const strB = String(rawB ?? '').trim();
  const numA = parseCleanNumber(strA);
  const numB = parseCleanNumber(strB);
  const isBothNumeric = !isNaN(numA) && !isNaN(numB) && strA !== '' && strB !== '';

  switch (operator) {
    case 'equals':
      if (isBothNumeric) return numA === numB;
      return strA.toLowerCase() === strB.toLowerCase();
    case 'not_equals':
      if (isBothNumeric) return numA !== numB;
      return strA.toLowerCase() !== strB.toLowerCase();
    case 'greater_than':
      if (isBothNumeric) return numA > numB;
      return strA.localeCompare(strB, 'th', { numeric: true }) > 0;
    case 'less_than':
      if (isBothNumeric) return numA < numB;
      return strA.localeCompare(strB, 'th', { numeric: true }) < 0;
    case 'greater_than_or_equal':
      if (isBothNumeric) return numA >= numB;
      return strA.localeCompare(strB, 'th', { numeric: true }) >= 0;
    case 'less_than_or_equal':
      if (isBothNumeric) return numA <= numB;
      return strA.localeCompare(strB, 'th', { numeric: true }) <= 0;
    case 'contains':
      return strA.toLowerCase().includes(strB.toLowerCase());
    default:
      return false;
  }
}

export function aggregateWidgetData(
  records: Record<string, any>[],
  config: WidgetConfig
): {
  chartData: ChartDataPoint[];
  singleValue?: number;
  formattedSingleValue?: string;
} {
  if (!records || records.length === 0) {
    return { chartData: [], singleValue: 0, formattedSingleValue: '0' };
  }

  const {
    type,
    categoryColumn,
    valueColumn,
    secondaryValueColumn,
    aggregation,
    prefix = '',
    suffix = '',
    sortBy,
    limit,
  } = config;

  // 1. Chart-level dedicated filter (ฟิลเตอร์เฉพาะกราฟนี้ - รองรับทั้งหลายเงื่อนไข และเงื่อนไขเดี่ยว)
  let workingRecords = records;

  // 1.1 Multi-rule filter system (รองรับหลายเงื่อนไข และเทียบกับคอลัมน์อื่น)
  if (config.filterRules && config.filterRules.length > 0) {
    const isOr = config.filterLogic === 'or';
    workingRecords = workingRecords.filter((r) => {
      if (isOr) {
        return config.filterRules!.some((rule) => evaluateFilterRule(r, rule));
      }
      return config.filterRules!.every((rule) => evaluateFilterRule(r, rule));
    });
  }

  // 1.2 Legacy single filter (ถ้ามีกำหนดไว้เดี่ยวๆ)
  if (config.widgetFilterColumn) {
    const col = config.widgetFilterColumn;
    const op = config.widgetFilterOperator || 'equals';
    const rawFilterVal = config.widgetFilterValue ?? '';
    const trimmedVal = rawFilterVal.trim();
    const filterLower = trimmedVal.toLowerCase();

    // Check if the user intends to filter for blank/empty cells (like Excel: "" or "(ว่าง)" or "(blank)" or " " or empty)
    const isFilterBlank =
      op === 'is_empty' ||
      trimmedVal === '' ||
      trimmedVal === '""' ||
      trimmedVal === "''" ||
      filterLower === '(ว่าง)' ||
      filterLower === '(blank)' ||
      filterLower === 'ว่าง' ||
      trimmedVal === '__blank__';

    workingRecords = workingRecords.filter((r) => {
      const cellVal = String(r[col] ?? '').trim();
      const cellLower = cellVal.toLowerCase();
      const isCellEmpty = cellVal === '';

      if (op === 'is_empty') return isCellEmpty;
      if (op === 'not_empty') return !isCellEmpty;

      if (isFilterBlank) {
        if (op === 'equals') return isCellEmpty;
        if (op === 'not_equals') return !isCellEmpty;
      }

      if (op === 'equals') return cellLower === filterLower;
      if (op === 'not_equals') return cellLower !== filterLower;
      if (op === 'contains') return cellLower.includes(filterLower);
      return true;
    });
  }

  // 2. Exclude blanks if enabled (ไม่แสดงข้อมูลว่างในกราฟ / ไม่นับ blank)
  if (config.excludeBlank) {
    workingRecords = workingRecords.filter((r) => {
      if (categoryColumn) {
        const cat = r[categoryColumn];
        if (cat === null || cat === undefined || String(cat).trim() === '') return false;
      }
      if (valueColumn) {
        const val = r[valueColumn];
        if (val === null || val === undefined || String(val).trim() === '') return false;
        if (isNaN(parseCleanNumber(val))) return false;
      }
      return true;
    });
  }

  // For KPI single-value aggregation
  if (type === 'kpi' || !categoryColumn) {
    // 2.1 KPI เปรียบเทียบ 2 คอลัมน์ตามเงื่อนไข (Two-Column Comparison Condition: เช่น Col A = Col B หรือ Col A > Col B)
    if (type === 'kpi' && config.enableTwoColCompare && config.compareColA && config.compareColB) {
      const colA = config.compareColA;
      const colB = config.compareColB;
      const op = config.compareOperator || 'equals';
      const mode = config.compareDisplayMode || 'count';
      const total = workingRecords.length;

      const matchingRecords = workingRecords.filter((r) =>
        evaluateTwoColumnComparison(r[colA], r[colB], op)
      );
      const matchCount = matchingRecords.length;
      const percentage = total > 0 ? (matchCount / total) * 100 : 0;
      const decimals =
        config.decimalPlaces !== undefined
          ? config.decimalPlaces
          : mode === 'percent'
          ? 1
          : 0;

      let result = matchCount;
      let formatted = '';

      if (mode === 'percent') {
        result = percentage;
        formatted = `${formatNumber(percentage, decimals, 'percent')}`;
      } else if (mode === 'both') {
        result = matchCount;
        formatted = `${formatNumber(matchCount, 0, config.numberFormat)} (${percentage.toFixed(1)}%)`;
      } else {
        result = matchCount;
        formatted = `${formatNumber(matchCount, 0, config.numberFormat)}`;
      }

      return {
        chartData: [],
        singleValue: result,
        formattedSingleValue: `${prefix}${formatted}${suffix}`,
      };
    }

    // 2.2 Standard KPI / Single-value Aggregation
    let result = 0;
    if (aggregation === 'count') {
      result = workingRecords.length;
    } else if (aggregation === 'distinct_count') {
      // นับแบบพิเศษ: นับเฉพาะค่าที่ไม่ซ้ำ (ตัวซ้ำจะไม่นับ / Unique Values)
      const targetCol = valueColumn || categoryColumn;
      if (targetCol) {
        const uniqueSet = new Set<string>();
        workingRecords.forEach((r) => {
          const raw = r[targetCol];
          if (raw !== undefined && raw !== null) {
            const strVal = String(raw).trim();
            if (strVal !== '') {
              uniqueSet.add(strVal.toLowerCase());
            }
          }
        });
        result = uniqueSet.size;
      } else {
        const uniqueRows = new Set(
          workingRecords.map((r) => {
            const keys = Object.keys(r).filter((k) => !k.startsWith('_'));
            return keys.map((k) => String(r[k] ?? '').trim()).join('|');
          })
        );
        result = uniqueRows.size;
      }
    } else if (valueColumn) {
      const numbers = workingRecords
        .map((r) => parseCleanNumber(r[valueColumn]))
        .filter((n) => !isNaN(n));

      if (numbers.length > 0) {
        if (aggregation === 'sum') {
          result = numbers.reduce((acc, curr) => acc + curr, 0);
        } else if (aggregation === 'avg') {
          result = numbers.reduce((acc, curr) => acc + curr, 0) / numbers.length;
        } else if (aggregation === 'max') {
          result = Math.max(...numbers);
        } else if (aggregation === 'min') {
          result = Math.min(...numbers);
        }
      }
    }

    const decimals =
      config.decimalPlaces !== undefined
        ? config.decimalPlaces
        : aggregation === 'avg'
        ? 2
        : 0;
    const formatted = formatNumber(result, decimals, config.numberFormat);
    return {
      chartData: [],
      singleValue: result,
      formattedSingleValue: `${prefix}${formatted}${suffix}`,
    };
  }

  // Grouped aggregation by categoryColumn
  const groups: Record<
    string,
    {
      sum: number;
      count: number;
      min: number;
      max: number;
      secondarySum: number;
      distinctValues: Set<string>;
    }
  > = {};

  workingRecords.forEach((record) => {
    const rawCategory = record[categoryColumn];
    const categoryKey =
      rawCategory !== undefined && rawCategory !== null && String(rawCategory).trim() !== ''
        ? String(rawCategory)
        : (config.blankLabel !== undefined ? config.blankLabel : '(ว่าง)');

    const val = valueColumn ? parseCleanNumber(record[valueColumn]) : 1;
    const secVal = secondaryValueColumn ? parseCleanNumber(record[secondaryValueColumn]) : 0;
    const rawVal = valueColumn ? record[valueColumn] : null;
    const strVal = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';

    if (!groups[categoryKey]) {
      groups[categoryKey] = {
        sum: val,
        count: 1,
        min: val,
        max: val,
        secondarySum: secVal,
        distinctValues: new Set(strVal !== '' ? [strVal.toLowerCase()] : []),
      };
    } else {
      groups[categoryKey].sum += val;
      groups[categoryKey].count += 1;
      groups[categoryKey].min = Math.min(groups[categoryKey].min, val);
      groups[categoryKey].max = Math.max(groups[categoryKey].max, val);
      groups[categoryKey].secondarySum += secVal;
      if (strVal !== '') {
        groups[categoryKey].distinctValues.add(strVal.toLowerCase());
      }
    }
  });

  let chartData: ChartDataPoint[] = Object.keys(groups).map((name) => {
    const g = groups[name];
    let finalVal = g.sum;

    if (aggregation === 'avg') {
      finalVal = g.count > 0 ? g.sum / g.count : 0;
    } else if (aggregation === 'count') {
      finalVal = g.count;
    } else if (aggregation === 'distinct_count') {
      finalVal = g.distinctValues.size;
    } else if (aggregation === 'min') {
      finalVal = g.min;
    } else if (aggregation === 'max') {
      finalVal = g.max;
    }

    const secondaryVal =
      aggregation === 'avg' && g.count > 0
        ? g.secondarySum / g.count
        : g.secondarySum;

    const itemDecimals =
      config.decimalPlaces !== undefined
        ? config.decimalPlaces
        : aggregation === 'avg'
        ? 1
        : 0;

    return {
      name,
      value: Math.round(finalVal * 100) / 100,
      secondaryValue: Math.round(secondaryVal * 100) / 100,
      count: g.count,
      formattedValue: `${prefix}${formatNumber(finalVal, itemDecimals, config.numberFormat)}${suffix}`,
    };
  });

  // Sorting
  if (sortBy === 'desc') {
    chartData.sort((a, b) => b.value - a.value);
  } else if (sortBy === 'asc') {
    chartData.sort((a, b) => a.value - b.value);
  }

  // Limit
  if (limit && limit > 0 && chartData.length > limit) {
    const top = chartData.slice(0, limit);
    const others = chartData.slice(limit);
    const otherSum = others.reduce((acc, c) => acc + c.value, 0);
    top.push({
      name: 'อื่นๆ (Others)',
      value: Math.round(otherSum * 100) / 100,
      formattedValue: `${prefix}${formatNumber(otherSum, 0)}${suffix}`,
    });
    chartData = top;
  }

  return { chartData };
}

export function formatNumber(
  num: number,
  decimals: number = 0,
  numberFormat: 'general' | 'currency' | 'percent' | 'compact' = 'general'
): string {
  if (isNaN(num) || num === null || num === undefined) return '0';

  if (numberFormat === 'compact') {
    if (Math.abs(num) >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (Math.abs(num) >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (Math.abs(num) >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString('th-TH', { maximumFractionDigits: decimals });
  }

  const formatted = num.toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (numberFormat === 'currency') {
    return `฿${formatted}`;
  }
  if (numberFormat === 'percent') {
    return `${formatted}%`;
  }

  return formatted;
}

export const THEME_PALETTES: Record<string, { primary: string; secondary: string; fill: string; colors: string[] }> = {
  blue: {
    primary: '#2563eb',
    secondary: '#60a5fa',
    fill: '#3b82f6',
    colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#1e40af'],
  },
  emerald: {
    primary: '#059669',
    secondary: '#34d399',
    fill: '#10b981',
    colors: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#047857', '#065f46'],
  },
  violet: {
    primary: '#7c3aed',
    secondary: '#a78bfa',
    fill: '#8b5cf6',
    colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#6d28d9', '#5b21b6'],
  },
  amber: {
    primary: '#d97706',
    secondary: '#fbbf24',
    fill: '#f59e0b',
    colors: ['#d97706', '#f59e0b', '#fbbf24', '#fde68a', '#b45309', '#92400e'],
  },
  teal: {
    primary: '#0d9488',
    secondary: '#2dd4bf',
    fill: '#14b8a6',
    colors: ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#0f766e', '#115e59'],
  },
  indigo: {
    primary: '#4f46e5',
    secondary: '#818cf8',
    fill: '#6366f1',
    colors: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#4338ca', '#3730a3'],
  },
};

export const CATEGORICAL_PALETTES: Record<string, { name: string; colors: string[] }> = {
  vibrant: {
    name: 'สดใสชัดเจน (Vibrant BI)',
    colors: [
      '#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4',
      '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7',
      '#0284c7', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2',
      '#db2777', '#0d9488', '#ea580c', '#4f46e5', '#65a30d', '#7e22ce',
    ],
  },
  pastel: {
    name: 'พาสเทลนุ่มนวล (Soft Pastel)',
    colors: [
      '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#38bdf8',
      '#f472b6', '#2dd4bf', '#fb923c', '#818cf8', '#a3e635', '#c084fc',
      '#38bdf8', '#4ade80', '#fcd34d', '#e879f9', '#fb7185', '#22d3ee',
    ],
  },
  neon: {
    name: 'นีออนโดดเด่น (High Contrast)',
    colors: [
      '#2563eb', '#059669', '#d97706', '#7c3aed', '#e11d48', '#0891b2',
      '#ea580c', '#4338ca', '#15803d', '#b91c1c', '#6d28d9', '#0284c7',
    ],
  },
  corporate: {
    name: 'คอร์ปอเรตสุภาพ (Professional)',
    colors: [
      '#1e40af', '#0f766e', '#b45309', '#6b21a8', '#991b1b', '#155e75',
      '#831843', '#065f46', '#9a3412', '#3730a3', '#3f6212', '#581c87',
    ],
  },
  warm: {
    name: 'โทนอุ่น (Warm Sunset)',
    colors: [
      '#ef4444', '#f97316', '#f59e0b', '#ec4899', '#e11d48', '#d97706',
      '#dc2626', '#ea580c', '#fb923c', '#f43f5e', '#be123c', '#b45309',
    ],
  },
  cool: {
    name: 'โทนเย็น (Cool Breeze)',
    colors: [
      '#0284c7', '#0d9488', '#2563eb', '#6366f1', '#06b6d4', '#10b981',
      '#3b82f6', '#14b8a6', '#4f46e5', '#0891b2', '#059669', '#1d4ed8',
    ],
  },
};

/**
 * Returns color for a category slice or bar, honoring:
 * 1. User's custom per-category override (config.customCategoryColors[categoryName])
 * 2. Color Mode (single vs palette)
 * 3. Categorical Palette or Theme
 */
export function getWidgetColorForCategory(
  categoryName: string,
  index: number,
  config: WidgetConfig
): string {
  // 1. Check customCategoryColors explicitly defined for this category
  if (config.customCategoryColors && config.customCategoryColors[categoryName]) {
    return config.customCategoryColors[categoryName];
  }

  // 2. If user explicitly chose single color mode
  if (config.colorMode === 'single') {
    const theme = THEME_PALETTES[config.colorTheme || 'blue'] || THEME_PALETTES.blue;
    return theme.primary;
  }

  // 3. Categorical Palette (default to vibrant)
  const paletteKey = config.paletteName || 'vibrant';
  const palette = CATEGORICAL_PALETTES[paletteKey] || CATEGORICAL_PALETTES.vibrant;
  return palette.colors[index % palette.colors.length];
}

