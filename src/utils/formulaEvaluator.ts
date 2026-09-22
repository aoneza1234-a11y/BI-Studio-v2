import { CalculatedField, ProcessedSheetData } from '../types';
import { parseCleanNumber } from '../services/sheetsApi';

export interface FormulaValidationResult {
  isValid: boolean;
  error?: string;
  sampleResult?: number;
}

/**
 * Built-in Quick Formula Templates
 */
export const POPULAR_FORMULA_TEMPLATES = [
  {
    name: 'กำไร (Profit)',
    formula: '[Revenue] - [Cost]',
    description: 'ผลต่างระหว่างยอดขายและต้นทุน (Profit = Revenue - Cost)',
    format: 'currency' as const,
    decimals: 2,
  },
  {
    name: 'อัตรากำไร (Margin %)',
    formula: '([Profit] / [Revenue]) * 100',
    description: 'คิดเป็นร้อยละของยอดขาย ((Profit / Revenue) * 100)',
    format: 'percent' as const,
    decimals: 1,
  },
  {
    name: 'การเติบโต (Growth %)',
    formula: '(([Current] - [Previous]) / [Previous]) * 100',
    description: 'อัตราการเติบโตเทียบงวดก่อนหน้า ((Current - Previous) / Previous * 100)',
    format: 'percent' as const,
    decimals: 1,
  },
  {
    name: 'ภาษีมูลค่าเพิ่ม (VAT 7%)',
    formula: '[Revenue] * 0.07',
    description: 'คำนวณภาษีมูลค่าเพิ่ม 7% จากยอดรวม',
    format: 'currency' as const,
    decimals: 2,
  },
  {
    name: 'ยอดรวมสุทธิ (Net Total)',
    formula: '[Revenue] * 1.07',
    description: 'ยอดรวมภาษีมูลค่าเพิ่ม 7% (Revenue * 1.07)',
    format: 'currency' as const,
    decimals: 2,
  },
  {
    name: 'ราคาเฉลี่ยต่อหน่วย (Unit Price)',
    formula: '[Total Amount] / [Quantity]',
    description: 'หารยอดรวมด้วยจำนวนชิ้นสินค้า',
    format: 'currency' as const,
    decimals: 2,
  },
];

/**
 * Extracts column tokens from formula e.g. "[Revenue] - [Cost]" => ["Revenue", "Cost"]
 */
export function extractFormulaColumns(formula: string): string[] {
  const matches = formula.match(/\[([^\]]+)\]/g) || [];
  return matches.map((m) => m.replace(/^\[|\]$/g, '').trim());
}

/**
 * Evaluates a formula against a single record row safely
 */
export function evaluateFormulaOnRecord(
  formula: string,
  record: Record<string, any>,
  headers: string[]
): number {
  if (!formula || typeof formula !== 'string') return 0;

  try {
    // Replace [ColumnName] tokens with their numeric values
    let expr = formula.replace(/\[([^\]]+)\]/g, (_, colName) => {
      const trimmedCol = colName.trim();
      let rawVal = record[trimmedCol];

      // If not exact match, try case-insensitive or partial match
      if (rawVal === undefined) {
        const foundKey = headers.find(
          (h) => h.toLowerCase() === trimmedCol.toLowerCase()
        );
        if (foundKey) rawVal = record[foundKey];
      }

      const num = parseCleanNumber(rawVal);
      return isNaN(num) ? '0' : String(num);
    });

    // Also support custom helper keywords
    expr = expr.replace(/\bROUND\(/gi, 'Math.round(');
    expr = expr.replace(/\bABS\(/gi, 'Math.abs(');
    expr = expr.replace(/\bMAX\(/gi, 'Math.max(');
    expr = expr.replace(/\bMIN\(/gi, 'Math.min(');
    expr = expr.replace(/\bSQRT\(/gi, 'Math.sqrt(');
    expr = expr.replace(/\bFLOOR\(/gi, 'Math.floor(');
    expr = expr.replace(/\bCEIL\(/gi, 'Math.ceil(');

    // Sanitize string to allow only mathematical expressions, digits, operators, parens, Math methods
    const sanitized = expr.replace(/[^0-9+\-*/().,Math abs round max min sqrt floor ceil\s><=?:!]/g, '');

    // Safely evaluate math expression
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized});`)();
    const finalNum = Number(result);
    return isNaN(finalNum) || !isFinite(finalNum) ? 0 : finalNum;
  } catch (err) {
    return 0;
  }
}

/**
 * Validates a formula syntax and returns a preview test result
 */
export function validateFormula(
  formula: string,
  sampleRecord: Record<string, any>,
  headers: string[]
): FormulaValidationResult {
  if (!formula || !formula.trim()) {
    return { isValid: false, error: 'กรุณากรอกสูตรคำนวณ' };
  }

  const cols = extractFormulaColumns(formula);
  if (cols.length === 0) {
    return {
      isValid: false,
      error: 'สูตรคำนวณต้องอ้างอิงคอลัมน์ในเครื่องหมายก้ามปู เช่น [ยอดขาย] - [ต้นทุน]',
    };
  }

  // Check if referenced columns exist in headers
  for (const col of cols) {
    const exists = headers.some(
      (h) => h.toLowerCase() === col.toLowerCase()
    );
    if (!exists) {
      return {
        isValid: false,
        error: `ไม่พบคอลัมน์ "${col}" ในชีทข้อมูลปัจจุบัน`,
      };
    }
  }

  try {
    const sample = evaluateFormulaOnRecord(formula, sampleRecord, headers);
    return { isValid: true, sampleResult: sample };
  } catch (err: any) {
    return { isValid: false, error: err?.message || 'รูปแบบสูตรคำนวณไม่ถูกต้อง' };
  }
}

/**
 * Injects all active calculated fields into ProcessedSheetData
 */
export function applyCalculatedFields(
  baseData: ProcessedSheetData,
  calculatedFields: CalculatedField[] = []
): ProcessedSheetData {
  if (!baseData || !baseData.records) {
    return (
      baseData || {
        headers: [] as string[],
        rawRows: [],
        records: [],
        numericColumns: [] as string[],
        categoricalColumns: [] as string[],
        dateColumns: [] as string[],
        totalRows: 0,
      }
    );
  }

  if (!calculatedFields || calculatedFields.length === 0) {
    return baseData;
  }

  const updatedHeaders = [...(baseData.headers || [])];
  const updatedNumericColumns = [...(baseData.numericColumns || [])];

  // Ensure header names are distinct and added
  calculatedFields.forEach((field) => {
    if (!updatedHeaders.includes(field.name)) {
      updatedHeaders.push(field.name);
    }
    if (!updatedNumericColumns.includes(field.name)) {
      updatedNumericColumns.push(field.name);
    }
  });

  // Calculate and append values to each record
  const updatedRecords = baseData.records.map((record) => {
    const enriched = { ...record };
    calculatedFields.forEach((field) => {
      const computed = evaluateFormulaOnRecord(
        field.formula,
        enriched,
        baseData.headers
      );
      const decimals = field.decimals !== undefined ? field.decimals : 2;
      enriched[field.name] = Number(computed.toFixed(decimals));
    });
    return enriched;
  });

  return {
    ...baseData,
    headers: updatedHeaders,
    numericColumns: updatedNumericColumns,
    records: updatedRecords,
    totalRows: updatedRecords.length,
  };
}
