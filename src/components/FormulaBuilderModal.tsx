import React, { useState, useMemo } from 'react';
import { CalculatedField, ProcessedSheetData } from '../types';
import {
  POPULAR_FORMULA_TEMPLATES,
  validateFormula,
  evaluateFormulaOnRecord,
} from '../utils/formulaEvaluator';
import {
  Calculator,
  Plus,
  Trash2,
  X,
  Check,
  Sparkles,
  HelpCircle,
  Hash,
  Coins,
  Percent,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface FormulaBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedData?: ProcessedSheetData;
  calculatedFields?: CalculatedField[];
  onSaveCalculatedFields?: (fields: CalculatedField[]) => void;
}

export const FormulaBuilderModal: React.FC<FormulaBuilderModalProps> = ({
  isOpen,
  onClose,
  processedData,
  calculatedFields = [],
  onSaveCalculatedFields,
}) => {
  const [fields, setFields] = useState<CalculatedField[]>(calculatedFields);
  const [editingId, setEditingId] = useState<string | null>(null);

  const headers = processedData?.headers || [];
  const numericColumns = processedData?.numericColumns || [];
  const records = processedData?.records || [];

  // Form state
  const [fieldName, setFieldName] = useState('');
  const [formula, setFormula] = useState('');
  const [format, setFormat] = useState<'number' | 'currency' | 'percent'>('number');
  const [decimals, setDecimals] = useState(2);
  const [description, setDescription] = useState('');

  // Synchronize when opened
  React.useEffect(() => {
    if (isOpen) {
      setFields(calculatedFields);
      setEditingId(null);
      setFieldName('');
      setFormula('');
      setDescription('');
    }
  }, [isOpen, calculatedFields]);

  const sampleRecord = useMemo(() => {
    return records[0] || {};
  }, [records]);

  // Live validation
  const validation = useMemo(() => {
    return validateFormula(formula, sampleRecord, headers);
  }, [formula, sampleRecord, headers]);

  if (!isOpen) return null;

  const handleInsertToken = (token: string) => {
    setFormula((prev) => prev + token);
  };

  const handleSelectTemplate = (tmpl: (typeof POPULAR_FORMULA_TEMPLATES)[0]) => {
    setFieldName(tmpl.name);
    setFormat(tmpl.format);
    setDecimals(tmpl.decimals);
    setDescription(tmpl.description);

    // Smartly map template columns to existing headers if possible
    let smartFormula = tmpl.formula;
    const numCols = numericColumns;

    if (tmpl.name.includes('Profit') && numCols.length >= 2) {
      smartFormula = `[${numCols[0]}] - [${numCols[1]}]`;
    } else if (tmpl.name.includes('Margin') && numCols.length >= 2) {
      smartFormula = `(([${numCols[0]}] - [${numCols[1]}]) / [${numCols[0]}]) * 100`;
    } else if (tmpl.name.includes('VAT') && numCols.length >= 1) {
      smartFormula = `[${numCols[0]}] * 0.07`;
    } else if (tmpl.name.includes('Net') && numCols.length >= 1) {
      smartFormula = `[${numCols[0]}] * 1.07`;
    }

    setFormula(smartFormula);
  };

  const handleSaveField = () => {
    if (!fieldName.trim()) {
      alert('กรุณาระบุชื่อฟิลด์คำนวณ');
      return;
    }
    if (!validation.isValid) {
      alert(validation.error || 'สูตรคำนวณไม่ถูกต้อง');
      return;
    }

    let updated: CalculatedField[];
    if (editingId) {
      updated = fields.map((f) =>
        f.id === editingId
          ? {
              ...f,
              name: fieldName.trim(),
              formula: formula.trim(),
              format,
              decimals,
              description,
            }
          : f
      );
    } else {
      const newField: CalculatedField = {
        id: `calc-${Date.now()}`,
        name: fieldName.trim(),
        formula: formula.trim(),
        format,
        decimals,
        description,
        createdAt: new Date().toISOString(),
      };
      updated = [...fields, newField];
    }

    setFields(updated);
    onSaveCalculatedFields(updated);
    setEditingId(null);
    setFieldName('');
    setFormula('');
    setDescription('');
  };

  const handleEditField = (field: CalculatedField) => {
    setEditingId(field.id);
    setFieldName(field.name);
    setFormula(field.formula);
    setFormat(field.format || 'number');
    setDecimals(field.decimals ?? 2);
    setDescription(field.description || '');
  };

  const handleDeleteField = (id: string) => {
    const updated = fields.filter((f) => f.id !== id);
    setFields(updated);
    onSaveCalculatedFields(updated);
    if (editingId === id) {
      setEditingId(null);
      setFieldName('');
      setFormula('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                ตัวสร้างสูตรคำนวณ (Formula Builder / Calculated Field)
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                  Power BI & Looker Studio Style
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                สร้างคอลัมน์คำนวณใหม่ได้ทันทีในแดชบอร์ด โดยไม่ต้องแก้ข้อมูลใน Google Sheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Quick Preset Templates */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              สูตรคำนวณยอดนิยม (คลิกเพื่อเลือกแม่แบบ)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_FORMULA_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-800 group-hover:text-purple-700">
                    {tmpl.name}
                  </div>
                  <div className="text-[11px] font-mono text-purple-600 truncate mt-0.5">
                    {tmpl.formula}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Builder Form */}
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-purple-600" />
                {editingId ? 'แก้ไขฟิลด์คำนวณ' : 'สร้างฟิลด์คำนวณใหม่'}
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFieldName('');
                    setFormula('');
                  }}
                  className="text-xs text-purple-600 hover:underline"
                >
                  ยกเลิกการแก้ไข / สร้างใหม่
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อคอลัมน์ใหม่ (Field Name) *
                </label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="เช่น กำไรสุทธิ (Net Profit)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รูปแบบการแสดงผล (Format)
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setFormat('number')}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1 ${
                      format === 'number'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5" /> ตัวเลข
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('currency')}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1 ${
                      format === 'currency'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" /> ฿ เงิน
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('percent')}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1 ${
                      format === 'percent'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" /> %
                  </button>
                </div>
              </div>
            </div>

            {/* Column Chips to Click and Insert */}
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                <span>คลิกคอลัมน์เพื่อแทรกลงในสูตรคำนวณ:</span>
                <span className="text-[11px] text-slate-400">
                  {headers.length} คอลัมน์พร้อมใช้งาน
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200">
                {headers.map((header) => {
                  const isNum = numericColumns.includes(header);
                  return (
                    <button
                      key={header}
                      type="button"
                      onClick={() => handleInsertToken(`[${header}]`)}
                      className={`text-xs px-2 py-1 rounded-md font-mono transition-all flex items-center gap-1 ${
                        isNum
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Plus className="w-3 h-3 opacity-60" />
                      [{header}]
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Math Operator Toolbar */}
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1.5">
                เครื่องหมายคำนวณ (Math Operators):
              </div>
              <div className="flex flex-wrap gap-1">
                {[' + ', ' - ', ' * ', ' / ', '(', ')', ' * 0.07', ' * 100', 'ROUND(', 'ABS(', 'MAX(', 'MIN('].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => handleInsertToken(op)}
                    className="px-2.5 py-1 text-xs font-mono font-bold bg-white hover:bg-purple-100 hover:text-purple-700 border border-slate-200 rounded-md transition-colors"
                  >
                    {op.trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Formula Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สูตรคำนวณ (Formula Expression) *
              </label>
              <textarea
                rows={2}
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="เช่น [ยอดขาย] - [ต้นทุน] หรือ (([ยอดขาย] - [ต้นทุน]) / [ยอดขาย]) * 100"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
              {/* Validation Message */}
              {formula.trim() && (
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  {validation.isValid ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      สูตรถูกต้อง! ผลลัพธ์ตัวอย่างแถวแรก:{' '}
                      <span className="font-bold">
                        {format === 'currency' ? '฿' : ''}
                        {validation.sampleResult?.toLocaleString('th-TH', {
                          minimumFractionDigits: decimals,
                          maximumFractionDigits: decimals,
                        })}
                        {format === 'percent' ? '%' : ''}
                      </span>
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      {validation.error}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveField}
                disabled={!fieldName.trim() || !validation.isValid}
                className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มฟิลด์คำนวณ'}
              </button>
            </div>
          </div>

          {/* Active Calculated Fields List */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>ฟิลด์คำนวณที่สร้างแล้ว ({fields.length})</span>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                ยังไม่มีฟิลด์คำนวณ เลือกแม่แบบด้านบนหรือพิมพ์สูตรเพื่อสร้างฟิลด์แรก
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 truncate">
                          {f.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 font-semibold rounded-full">
                          {f.format === 'currency' ? 'สกุลเงิน (฿)' : f.format === 'percent' ? 'เปอร์เซ็นต์ (%)' : 'ตัวเลข'}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-600 truncate mt-0.5">
                        {f.formula}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditField(f)}
                        className="px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteField(f.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="ลบฟิลด์คำนวณ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-xs text-slate-500">
            * ฟิลด์คำนวณจะถูกนำไปใช้ในทุกกราฟ, KPI, ตาราง, และตัวกรองทันที
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
