import React, { useState, useEffect, useMemo } from 'react';
import {
  AggregationType,
  WidgetConfig,
  WidgetType,
  WidgetWidth,
  WidgetFilterRule,
} from '../types';
import {
  X,
  Check,
  Filter,
  Palette,
  RotateCcw,
  EyeOff,
  Sliders,
  Type,
  HelpCircle,
  BarChart2,
  TrendingUp,
  PieChart as PieIcon,
  Table as TableIcon,
  Hash,
  Layers,
  Activity,
  Compass,
  CircleDot,
  FileText,
  BarChart3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  ArrowRightLeft,
  Sparkles,
  Scale,
} from 'lucide-react';
import {
  THEME_PALETTES,
  CATEGORICAL_PALETTES,
  getWidgetColorForCategory,
  evaluateTwoColumnComparison,
} from '../utils/aggregateData';

interface WidgetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WidgetConfig | null;
  onSave: (updated: WidgetConfig) => void;
  headers: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  records?: Record<string, any>[];
}

const QUICK_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7',
  '#0284c7', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2',
];

export const WidgetEditorModal: React.FC<WidgetEditorModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  headers,
  numericColumns,
  categoricalColumns,
  records = [],
}) => {
  const [formData, setFormData] = useState<WidgetConfig | null>(null);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      let initialRules: WidgetFilterRule[] = config.filterRules ? [...config.filterRules] : [];
      if (initialRules.length === 0 && config.widgetFilterColumn) {
        initialRules.push({
          id: `rule-${Date.now()}`,
          column: config.widgetFilterColumn,
          operator: config.widgetFilterOperator || 'equals',
          value: config.widgetFilterValue || '',
          compareMode: 'value',
        });
      }

      setFormData({
        ...config,
        filterRules: initialRules,
        filterLogic: config.filterLogic || 'and',
        colorMode: config.colorMode || 'palette',
        paletteName: config.paletteName || 'vibrant',
        customCategoryColors: config.customCategoryColors || {},
        categoryColorMeanings: config.categoryColorMeanings || {},
        showGrid: config.showGrid !== false,
        showLegend: config.showLegend !== false,
        legendPosition: config.legendPosition || 'top',
        showDataLabels: !!config.showDataLabels,
        dataLabelPosition: config.dataLabelPosition || 'top',
        showRowCount: !!config.showRowCount, // เริ่มต้นปิดไว้เลย (default: false)
        showValueLabel: config.showValueLabel !== false,
        customValueLabel: config.customValueLabel || '',
        showAggregationBadge: config.showAggregationBadge !== false && config.showCountBadge !== false,
        showCountBadge: config.showAggregationBadge !== false && config.showCountBadge !== false,
        enableComparison: !!config.enableComparison,
        comparisonColumn: config.comparisonColumn || '',
        comparisonMode: config.comparisonMode || 'previous_period',
        comparisonBaselineValue: config.comparisonBaselineValue ?? 0,
        comparisonLabel: config.comparisonLabel || '',
        showXAxis: config.showXAxis !== false,
        showYAxis: config.showYAxis !== false,
        showTooltip: config.showTooltip !== false,
        heightPreset: config.heightPreset || 'normal',
      });
    }
  }, [config]);

  const handleAddRule = () => {
    const newRule: WidgetFilterRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      column: headers[0] || '',
      operator: 'equals',
      compareMode: 'value',
      value: '',
    };
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            filterRules: [...(prev.filterRules || []), newRule],
          }
        : null
    );
  };

  const handleUpdateRule = (ruleId: string, patch: Partial<WidgetFilterRule>) => {
    setFormData((prev) => {
      if (!prev) return null;
      const updated = (prev.filterRules || []).map((r) =>
        r.id === ruleId ? { ...r, ...patch } : r
      );
      return { ...prev, filterRules: updated };
    });
  };

  const handleRemoveRule = (ruleId: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      const filtered = (prev.filterRules || []).filter((r) => r.id !== ruleId);
      return { ...prev, filterRules: filtered };
    });
  };

  // Extract distinct category values currently available for this widget
  const detectedCategories = useMemo(() => {
    if (!formData?.categoryColumn || !records || records.length === 0) return [];
    const catCol = formData.categoryColumn;
    const set = new Set<string>();

    for (const r of records) {
      const val = r[catCol];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        set.add(String(val).trim());
      } else if (!formData.excludeBlank) {
        set.add('(ว่าง)');
      }
      if (set.size >= 30) break; // cap at 30 for UI performance
    }
    return Array.from(set);
  }, [formData?.categoryColumn, formData?.excludeBlank, records]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  const widgetTypes: { type: WidgetType; label: string; desc: string; icon: React.ReactNode }[] = [
    { type: 'kpi', label: 'การ์ดตัวเลข (KPI)', desc: 'ยอดรวม หรือตัวเลขเด่น', icon: <Hash className="w-4 h-4 text-blue-500" /> },
    { type: 'bar', label: 'กราฟแท่งแนวตั้ง (Bar)', desc: 'เปรียบเทียบข้อมูลตามกลุ่ม', icon: <BarChart2 className="w-4 h-4 text-emerald-500" /> },
    { type: 'horizontal_bar', label: 'กราฟแท่งแนวนอน', desc: 'เหมาะกับชื่อกลุ่มยาวหรือจัดอันดับ', icon: <BarChart3 className="w-4 h-4 text-cyan-500" /> },
    { type: 'line', label: 'กราฟเส้น (Line)', desc: 'แสดงแนวโน้มตามลำดับเวลา', icon: <TrendingUp className="w-4 h-4 text-teal-500" /> },
    { type: 'area', label: 'กราฟพื้นที่ (Area)', desc: 'แนวโน้มพร้อมเน้นปริมาณสะสม', icon: <Layers className="w-4 h-4 text-indigo-500" /> },
    { type: 'pie', label: 'แผนภูมิโดนัท/วงกลม', desc: 'สัดส่วนและเปอร์เซ็นต์', icon: <PieIcon className="w-4 h-4 text-violet-500" /> },
    { type: 'combo', label: 'กราฟผสม (Bar+Line)', desc: 'แท่งและเส้นในกราฟเดียวกัน', icon: <Activity className="w-4 h-4 text-amber-500" /> },
    { type: 'radar', label: 'กราฟเรดาร์ (Radar)', desc: 'เปรียบเทียบคุณลักษณะหลายมิติ', icon: <Compass className="w-4 h-4 text-purple-500" /> },
    { type: 'radial_bar', label: 'มาตรวัดวงแหวน (Gauge)', desc: 'แสดงความก้าวหน้าหรือสัดส่วน', icon: <CircleDot className="w-4 h-4 text-pink-500" /> },
    { type: 'scatter', label: 'กราฟจุดกระจาย (Scatter)', desc: 'ความสัมพันธ์ระหว่าง 2 ตัวแปร', icon: <CircleDot className="w-4 h-4 text-sky-500" /> },
    { type: 'table', label: 'ตารางข้อมูล (Table)', desc: 'ตารางค้นหาและแบ่งหน้า', icon: <TableIcon className="w-4 h-4 text-slate-500" /> },
    { type: 'text', label: 'กล่องข้อความ / แบนเนอร์', desc: 'ใส่โน้ต แบนเนอร์ และคำอธิบาย', icon: <FileText className="w-4 h-4 text-amber-600" /> },
  ];

  const handleSetCategoryColor = (cat: string, color: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customCategoryColors: {
          ...(prev.customCategoryColors || {}),
          [cat]: color,
        },
      };
    });
  };

  const handleSetCategoryMeaning = (cat: string, meaning: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categoryColorMeanings: {
          ...(prev.categoryColorMeanings || {}),
          [cat]: meaning,
        },
      };
    });
  };

  const handleResetCategoryColors = () => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customCategoryColors: {},
      };
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              ปรับแต่งวิดเจ็ต (Edit Widget)
            </h3>
            <p className="text-xs text-slate-500">
              กำหนดรูปแบบกราฟ สีสัน ความหมายของแต่ละสี และฟิลเตอร์อย่างอิสระ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="ปิดหน้าต่าง (กากบาท)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Notification Banner */}
        {previewNotice && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top duration-150">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{previewNotice}</span>
            </span>
            <button
              type="button"
              onClick={() => setPreviewNotice(null)}
              className="text-emerald-100 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Widget Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อวิดเจ็ต (Widget Title)
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Widget Type Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              รูปแบบการแสดงผล (Chart & Widget Type)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {widgetTypes.map((item) => {
                const isSelected = formData.type === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      const newColSpan = item.type === 'table' ? 12 : item.type === 'text' ? (formData.colSpan || 4) : formData.colSpan;
                      setFormData({
                        ...formData,
                        type: item.type,
                        colSpan: newColSpan,
                        width: newColSpan >= 10 ? 'full' : newColSpan >= 6 ? 'half' : 'third',
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-400'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {item.icon}
                      <span
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-blue-700' : 'text-slate-800'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Section for Text / Banner Widget */}
          {formData.type === 'text' && (
            <div className="pt-3 border-t border-slate-100 space-y-4 bg-amber-50/40 p-4 rounded-xl border border-amber-200/60">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>เนื้อหาและสไตล์กล่องข้อความ / แบนเนอร์ (Text Content & Banner Styling)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    คำโปรย / หัวข้อย่อย (Subtitle)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น สรุปผลประกอบการประจำไตรมาส"
                    value={formData.textSubtitle || ''}
                    onChange={(e) => setFormData({ ...formData, textSubtitle: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ป้ายสถานะ / Badge (ถ้ามี)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เช่น ข้อมูลสำคัญ, แนะนำ, Q3"
                      value={formData.badgeText || ''}
                      onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                      className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="color"
                      value={formData.badgeColor || '#2563eb'}
                      onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 shrink-0"
                      title="เลือกสี Badge"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ข้อความรายละเอียด / คำอธิบายแดชบอร์ด (Text Content)
                </label>
                <textarea
                  rows={4}
                  placeholder="พิมพ์ข้อความ คำแนะนำ บันทึก หรือข้อสรุปสำหรับแดชบอร์ดนี้..."
                  value={formData.textContent || ''}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รูปแบบกล่อง (Callout Style)
                  </label>
                  <select
                    value={formData.calloutStyle || 'card'}
                    onChange={(e) => setFormData({ ...formData, calloutStyle: e.target.value as any })}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="card">การ์ดสะอาด (Card)</option>
                    <option value="banner">แบนเนอร์เน้นสี (Banner)</option>
                    <option value="gradient">เกรเดียนท์ไล่สี (Gradient)</option>
                    <option value="minimal">มินิมอลโปร่งใส (Minimal)</option>
                    <option value="quote">กรอบคำพูด (Quote)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ไอคอนประกอบ
                  </label>
                  <select
                    value={formData.iconName || 'sparkles'}
                    onChange={(e) => setFormData({ ...formData, iconName: e.target.value as any })}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="sparkles">✨ ประกาย (Sparkles)</option>
                    <option value="trophy">🏆 ถ้วยรางวัล (Trophy)</option>
                    <option value="star">⭐ ดาว (Star)</option>
                    <option value="lightbulb">💡 หลอดไฟ/ไอเดีย (Lightbulb)</option>
                    <option value="target">🎯 เป้าหมาย (Target)</option>
                    <option value="bell">🔔 กระดิ่งแจ้งเตือน (Bell)</option>
                    <option value="info">ℹ️ ข้อมูล (Info)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จัดวางข้อความ
                  </label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => setFormData({ ...formData, textAlign: align })}
                        className={`flex-1 py-1 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center ${
                          formData.textAlign === align
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {align === 'left' ? <AlignLeft className="w-3.5 h-3.5" /> : align === 'center' ? <AlignCenter className="w-3.5 h-3.5" /> : <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Columns Selection (For charts) */}
          {formData.type !== 'table' && formData.type !== 'text' && (
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>การจับคู่คอลัมน์ข้อมูลและฟังก์ชันคำนวณ (Data Mapping)</span>
              </h4>

              {formData.type !== 'kpi' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หัวข้อกลุ่มข้อมูล / แกน X (Category)
                  </label>
                  <select
                    value={formData.categoryColumn || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryColumn: e.target.value })
                    }
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- เลือกหัวข้อข้อมูล --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h} {categoricalColumns.includes(h) ? '(ข้อความ/กลุ่ม)' : '(ตัวเลข)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หัวข้อค่าตัวเลข (Value / Metric)
                  </label>
                  <select
                    value={formData.valueColumn || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, valueColumn: e.target.value })
                    }
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- นับจำนวนแถว (Row Count) --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h} {numericColumns.includes(h) ? '★ (ตัวเลข)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ฟังก์ชันคำนวณ (Aggregation)
                  </label>
                  <select
                    value={formData.aggregation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aggregation: e.target.value as AggregationType,
                      })
                    }
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="sum">ผลรวม (SUM)</option>
                    <option value="avg">ค่าเฉลี่ย (AVERAGE)</option>
                    <option value="count">นับจำนวนทั้งหมด (COUNT)</option>
                    <option value="distinct_count">★ นับเฉพาะค่าไม่ซ้ำ / ตัวเดียว (DISTINCT COUNT)</option>
                    <option value="max">ค่าสูงสุด (MAX)</option>
                    <option value="min">ค่าต่ำสุด (MIN)</option>
                  </select>
                </div>
              </div>

              {/* Show/Hide Aggregation Badge (Count/Sum) */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={formData.showAggregationBadge !== false && formData.showCountBadge !== false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        showAggregationBadge: e.target.checked,
                        showCountBadge: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span>
                    แสดงป้ายระบุประเภทการคำนวณด้านบนการ์ด (เช่น {formData.aggregation === 'count' ? 'นับจำนวน (COUNT)' : formData.aggregation === 'avg' ? 'ค่าเฉลี่ย (AVG)' : 'ผลรวม (SUM)'})
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 ml-6 mt-0.5">
                  สามารถติ๊กออกเพื่อซ่อนคำว่านับจำนวน (Count) หรือผลรวม (Sum) ด้านบนของการ์ดได้
                </p>
              </div>

              {/* Data Comparison & Trend % Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      เปรียบเทียบข้อมูล (Data Comparison & Trend %)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.enableComparison}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enableComparison: e.target.checked,
                          comparisonColumn:
                            formData.comparisonColumn ||
                            headers.find((h) => categoricalColumns.includes(h)) ||
                            headers[0] ||
                            '',
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {formData.enableComparison && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-3 mt-2 animate-in fade-in duration-200">
                    <p className="text-[11px] text-slate-600">
                      คำนวณส่วนต่างเป็นเปอร์เซ็นต์ (%) เมื่อมีการฟิลเตอร์หรือแบ่งตามช่วงเวลา (เช่น คอลัมน์ B เป็นเดือน เพื่อแยกดูว่าเพิ่มขึ้น/ลดลงจากเดือนก่อนกี่ %) พร้อมสัญลักษณ์ ⬆️ / ⬇️
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          คอลัมน์ช่วงเวลาหรือตัวเทียบ (เช่น เดือน, วันที่, คอลัมน์ B)
                        </label>
                        <select
                          value={formData.comparisonColumn || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, comparisonColumn: e.target.value })
                          }
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">-- เลือกคอลัมน์เปรียบเทียบ --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          รูปแบบการเปรียบเทียบ
                        </label>
                        <select
                          value={formData.comparisonMode || 'previous_period'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              comparisonMode: e.target.value as any,
                            })
                          }
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                        >
                          <option value="previous_period">เทียบกับงวดก่อนหน้า (เช่น เดือนก่อน)</option>
                          <option value="baseline">เทียบกับค่าเป้าหมายคงที่ (Target Baseline)</option>
                          <option value="all_total">คิดเป็น % ของยอดรวมทั้งหมด (vs Overall)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {formData.comparisonMode === 'baseline' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            ค่าเป้าหมายคงที่ (Baseline Target)
                          </label>
                          <input
                            type="number"
                            value={formData.comparisonBaselineValue ?? ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                comparisonBaselineValue: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="เช่น 50000"
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          ข้อความกำกับ (Custom Comparison Label)
                        </label>
                        <input
                          type="text"
                          value={formData.comparisonLabel || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, comparisonLabel: e.target.value })
                          }
                          placeholder="เช่น เทียบเดือนก่อน, เทียบเป้าหมาย"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Two-Column Condition Comparison Section ("เทียบ 2 คอลัมน์ตามเงื่อนไข เช่น คอลัมน์ A = คอลัมน์ B มีกี่อัน หรือกี่ % หรือ A > B") */}
              {formData.type === 'kpi' && (
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-indigo-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          เทียบ 2 คอลัมน์ตามเงื่อนไข (Two-Column Condition Comparison)
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          เช่น คอลัมน์ A = คอลัมน์ B มีกี่อัน / กี่ % หรือ A &gt; B
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.enableTwoColCompare}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enableTwoColCompare: e.target.checked,
                            compareColA: formData.compareColA || headers[0] || '',
                            compareColB: formData.compareColB || headers[1] || headers[0] || '',
                            compareOperator: formData.compareOperator || 'equals',
                            compareDisplayMode: formData.compareDisplayMode || 'count',
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {formData.enableTwoColCompare && (
                    <div className="p-3 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-3 mt-2 animate-in fade-in duration-200">
                      <p className="text-[11px] text-slate-600">
                        นับจำนวนแถวหรือเปอร์เซ็นต์ที่ข้อมูล 2 คอลัมน์ตรงตามเงื่อนไขที่กำหนด เช่น คอลัมน์ยอดขายจริง &gt; คอลัมน์เป้าหมาย หรือ สถานะ A = สถานะ B
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            คอลัมน์แรก (คอลัมน์ A)
                          </label>
                          <select
                            value={formData.compareColA || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, compareColA: e.target.value })
                            }
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="">-- เลือกคอลัมน์ A --</option>
                            {headers.map((h) => (
                              <option key={h} value={h}>
                                {h} {numericColumns.includes(h) ? '(ตัวเลข)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            เงื่อนไขเปรียบเทียบ
                          </label>
                          <select
                            value={formData.compareOperator || 'equals'}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                compareOperator: e.target.value as any,
                              })
                            }
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="equals">= เท่ากับ (A = B)</option>
                            <option value="not_equals">≠ ไม่เท่ากับ (A ≠ B)</option>
                            <option value="greater_than">&gt; มากกว่า (A &gt; B)</option>
                            <option value="less_than">&lt; น้อยกว่า (A &lt; B)</option>
                            <option value="greater_than_or_equal">≥ มากกว่าหรือเท่ากับ (A ≥ B)</option>
                            <option value="less_than_or_equal">≤ น้อยกว่าหรือเท่ากับ (A ≤ B)</option>
                            <option value="contains">มีคำว่า (A มีข้อความของ B)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            คอลัมน์สอง (คอลัมน์ B)
                          </label>
                          <select
                            value={formData.compareColB || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, compareColB: e.target.value })
                            }
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="">-- เลือกคอลัมน์ B --</option>
                            {headers.map((h) => (
                              <option key={h} value={h}>
                                {h} {numericColumns.includes(h) ? '(ตัวเลข)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                          รูปแบบการแสดงผลค่าหลัก (Display Format)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'count', label: '🔢 แสดงเป็นจำนวน', desc: 'เช่น 15 รายการ' },
                            { key: 'percent', label: '📊 แสดงเป็นเปอร์เซ็นต์', desc: 'เช่น 62.5%' },
                            { key: 'both', label: '🔀 แสดงทั้งสองอย่าง', desc: 'เช่น 15 (62.5%)' },
                          ].map((m) => (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  compareDisplayMode: m.key as any,
                                })
                              }
                              className={`p-2 rounded-lg border text-left transition-all ${
                                (formData.compareDisplayMode || 'count') === m.key
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className="block text-xs font-bold">{m.label}</span>
                              <span
                                className={`block text-[10px] mt-0.5 ${
                                  (formData.compareDisplayMode || 'count') === m.key
                                    ? 'text-indigo-100'
                                    : 'text-slate-400'
                                }`}
                              >
                                {m.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live Calculation Preview */}
                      {formData.compareColA && formData.compareColB && records && records.length > 0 && (
                        <div className="p-2.5 bg-white border border-indigo-100 rounded-lg flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">
                            ตัวอย่างผลลัพธ์จากข้อมูลปัจจุบัน ({records.length} รายการ):
                          </span>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                            {(() => {
                              const colA = formData.compareColA;
                              const colB = formData.compareColB;
                              const op = formData.compareOperator || 'equals';
                              const matches = records.filter((r) =>
                                evaluateTwoColumnComparison(r[colA], r[colB], op)
                              ).length;
                              const pct = ((matches / records.length) * 100).toFixed(1);
                              return `ตรงเงื่อนไข ${matches.toLocaleString('th-TH')} อัน (${pct}%)`;
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(formData.type === 'line' ||
                formData.type === 'area' ||
                formData.type === 'bar' ||
                formData.type === 'combo' ||
                formData.type === 'scatter') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หัวข้อเปรียบเทียบชุดที่ 2 (Secondary Value Column, ตัวเลือกเพิ่มเติม)
                  </label>
                  <select
                    value={formData.secondaryValueColumn || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        secondaryValueColumn: e.target.value || undefined,
                      })
                    }
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- ไม่มี --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h} {numericColumns.includes(h) ? '★ (ตัวเลข)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Blank Handling & Dedicated Chart Filters */}
          {formData.type !== 'text' && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-blue-600" />
                <span>การกรองข้อมูลและการจัดการค่าว่าง (Filters & Blank Handling)</span>
              </h4>

              {/* Exclude Blank Checkbox */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <input
                  id="excludeBlank"
                  type="checkbox"
                  checked={!!formData.excludeBlank}
                  onChange={(e) =>
                    setFormData({ ...formData, excludeBlank: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="excludeBlank" className="cursor-pointer">
                  <span className="block text-xs font-bold text-slate-800">
                    ไม่แสดงข้อมูลว่างในกราฟ (Exclude Blank/Empty Data)
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    กรองเซลล์ว่าง เว้นวรรค หรือค่าที่ไม่มีข้อมูลออกจากการคำนวณและแสดงผลในกราฟนี้โดยอัตโนมัติ
                  </span>
                </label>
              </div>

              {/* Dedicated Multi-Condition Filter & Column Comparison System */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      ตัวกรองข้อมูลเฉพาะกราฟนี้ (หลายเงื่อนไข & เทียบกับคอลัมน์อื่น)
                    </span>
                    {formData.filterRules && formData.filterRules.length > 0 && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full">
                        {formData.filterRules.length} เงื่อนไข
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* AND / OR toggle */}
                    {formData.filterRules && formData.filterRules.length > 1 && (
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[10px] font-semibold shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, filterLogic: 'and' })}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            formData.filterLogic !== 'or'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ตรงทุกข้อ (AND)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, filterLogic: 'or' })}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            formData.filterLogic === 'or'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ตรงข้อใดข้อหนึ่ง (OR)
                        </button>
                      </div>
                    )}

                    {formData.filterRules && formData.filterRules.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            filterRules: [],
                            widgetFilterColumn: undefined,
                            widgetFilterOperator: undefined,
                            widgetFilterValue: undefined,
                          })
                        }
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        ล้างเงื่อนไขทั้งหมด
                      </button>
                    )}
                  </div>
                </div>

                {/* Rules List */}
                <div className="space-y-2.5">
                  {(!formData.filterRules || formData.filterRules.length === 0) ? (
                    <div className="p-3 bg-white border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500">
                      ยังไม่มีการกำหนดเงื่อนไขเฉพาะกราฟนี้ (กราฟจะแสดงข้อมูลทั้งหมดตามฟิลเตอร์รวม)
                    </div>
                  ) : (
                    formData.filterRules.map((rule, rIdx) => (
                      <div
                        key={rule.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-600">
                              {rIdx + 1}
                            </span>
                            <span>เงื่อนไขที่ {rIdx + 1}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Value Mode vs Column Comparison Mode */}
                            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleUpdateRule(rule.id, { compareMode: 'value' })}
                                className={`px-2 py-0.5 rounded font-medium transition-all ${
                                  rule.compareMode !== 'column'
                                    ? 'bg-white text-blue-700 font-bold shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                กรอกค่าเอง
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateRule(rule.id, {
                                    compareMode: 'column',
                                    compareColumn: rule.compareColumn || headers[0] || '',
                                  })
                                }
                                className={`px-2 py-0.5 rounded font-medium transition-all flex items-center gap-1 ${
                                  rule.compareMode === 'column'
                                    ? 'bg-white text-blue-700 font-bold shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>เทียบกับคอลัมน์อื่น</span>
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveRule(rule.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="ลบเงื่อนไขนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* Column A */}
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                              คอลัมน์หลัก
                            </label>
                            <select
                              value={rule.column}
                              onChange={(e) => handleUpdateRule(rule.id, { column: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                            >
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Operator */}
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                              เงื่อนไข
                            </label>
                            <select
                              value={rule.operator}
                              onChange={(e) =>
                                handleUpdateRule(rule.id, { operator: e.target.value as any })
                              }
                              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                            >
                              <option value="equals">ตรงกับ (=)</option>
                              <option value="not_equals">ไม่ตรงกับ (≠)</option>
                              <option value="contains">มีคำว่า (Contains)</option>
                              <option value="not_contains">ไม่มีคำว่า (Not Contains)</option>
                              <option value="greater_than">มากกว่า (&gt;)</option>
                              <option value="less_than">น้อยกว่า (&lt;)</option>
                              <option value="greater_than_or_equal">มากกว่าหรือเท่ากับ (&ge;)</option>
                              <option value="less_than_or_equal">น้อยกว่าหรือเท่ากับ (&le;)</option>
                              <option value="is_empty">เป็นค่าว่าง / ช่องว่าง ("" หรือ Blank)</option>
                              <option value="not_empty">ไม่ใช่ค่าว่าง (Not Blank)</option>
                            </select>
                          </div>

                          {/* Value or Column Target */}
                          <div>
                            {rule.compareMode === 'column' ? (
                              <>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                  เทียบกับคอลัมน์
                                </label>
                                <select
                                  value={rule.compareColumn || ''}
                                  onChange={(e) =>
                                    handleUpdateRule(rule.id, { compareColumn: e.target.value })
                                  }
                                  className="w-full text-xs px-2.5 py-1.5 bg-blue-50/60 border border-blue-200 rounded-lg focus:outline-none font-semibold text-blue-800"
                                >
                                  <option value="">-- เลือกคอลัมน์ที่ต้องการเทียบ --</option>
                                  {headers.map((h) => (
                                    <option key={h} value={h}>
                                      {h}
                                    </option>
                                  ))}
                                </select>
                              </>
                            ) : (
                              <>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                  ค่าที่ต้องการกรอง
                                </label>
                                <input
                                  type="text"
                                  disabled={rule.operator === 'is_empty' || rule.operator === 'not_empty'}
                                  placeholder={
                                    rule.operator === 'is_empty'
                                      ? '(กรองเฉพาะช่องว่าง)'
                                      : 'พิมพ์คำหรือตัวเลข...'
                                  }
                                  value={rule.value || ''}
                                  onChange={(e) =>
                                    handleUpdateRule(rule.id, { value: e.target.value })
                                  }
                                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:opacity-50"
                                />
                                {rule.operator !== 'is_empty' && rule.operator !== 'not_empty' && (
                                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                                    <span className="text-[9px] text-slate-400">ค่าด่วน:</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRule(rule.id, { value: '(ว่าง)' })}
                                      className="text-[9px] px-1 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                                    >
                                      (ว่าง)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRule(rule.id, { value: '""' })}
                                      className="text-[9px] px-1 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                                    >
                                      ""
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRule(rule.id, { value: ' ' })}
                                      className="text-[9px] px-1 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                                    >
                                      " "
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add Rule Button */}
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="w-full py-2 bg-white hover:bg-blue-50/50 text-blue-600 text-xs font-semibold rounded-xl border border-dashed border-blue-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ เพิ่มเงื่อนไขการกรอง (Add Filter Rule)</span>
                  </button>
                </div>
              </div>

              {/* Blank Display Name Customization (เช่น ให้แสดงผลเป็น " " หรือ "(ว่าง)" เหมือน Excel) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      ชื่อแสดงผลสำหรับแถวที่ไม่มีข้อมูล / ช่องว่าง (Blank Display Label)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      กำหนดคำที่ต้องการให้แสดงบนกราฟเมื่อเจอเซลล์ว่าง เช่น ใช้ <code className="bg-slate-200 px-1 rounded text-slate-800">" "</code> (เว้นวรรค) หรือ <code className="bg-slate-200 px-1 rounded text-slate-800">(ว่าง)</code> เหมือนใน Excel
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder='ค่าเริ่มต้นคือ "(ว่าง)" หรือพิมพ์ " "'
                    value={formData.blankLabel !== undefined ? formData.blankLabel : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        blankLabel: e.target.value,
                      })
                    }
                    className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none w-48 font-mono"
                  />
                  <div className="flex items-center gap-1">
                    {[
                      { label: '(ว่าง)', val: '(ว่าง)' },
                      { label: '" " (เว้นวรรคแบบ Excel)', val: ' ' },
                      { label: '"" (สตริงว่าง)', val: '' },
                      { label: '(Blank)', val: '(Blank)' },
                      { label: 'ไม่มีข้อมูล', val: 'ไม่มีข้อมูล' },
                    ].map((preset) => {
                      const isSelected =
                        formData.blankLabel === preset.val ||
                        (formData.blankLabel === undefined && preset.val === '(ว่าง)');
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              blankLabel: preset.val,
                            })
                          }
                          className={`text-[10px] px-2 py-1 rounded-md transition-all font-medium ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-2xs'
                              : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Color Meanings, Labels & Legends ("และการคำต่างในกราฟหได้พวกสีนี้หมายถึงอะไรข้อมูลทุ่กอย่างในกราฟปรับได้") */}
          {formData.type !== 'table' && formData.type !== 'text' && (
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>คำอธิบายความหมายของสี & เลเจนด์ (Color Meanings & Labels)</span>
              </h4>

              {/* Excel-style Chart Controls & Visibility */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    องค์ประกอบกราฟสไตล์ Excel (Chart Elements & Labels)
                  </span>
                  <span className="text-[10px] text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full font-medium">
                    ปรับแต่ง/ซ่อนได้ตามต้องการ
                  </span>
                </div>

                {/* Custom Label replacing 'มูลค่า' or column name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ชื่อชุดข้อมูล/ข้อความแทนคำว่า "มูลค่า" (Custom Series Label)
                    </label>
                    <input
                      type="text"
                      placeholder={formData.valueColumn || 'พิมพ์ชื่อที่ต้องการ เช่น ยอดขายสุทธิ'}
                      value={formData.customValueLabel || ''}
                      onChange={(e) => setFormData({ ...formData, customValueLabel: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ตำแหน่งดาต้าเลเบล (Data Label Position)
                    </label>
                    <select
                      value={formData.dataLabelPosition || 'top'}
                      onChange={(e) => setFormData({ ...formData, dataLabelPosition: e.target.value as any })}
                      disabled={!formData.showDataLabels}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="top">ด้านบน (Top)</option>
                      <option value="inside">ด้านใน (Inside / Center)</option>
                      <option value="bottom">ด้านล่าง (Bottom)</option>
                    </select>
                  </div>
                </div>

                {/* Toggle switches grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <label className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                    <span className="text-[11px] font-medium text-slate-700">แสดงแกน X (X-Axis)</span>
                    <input
                      type="checkbox"
                      checked={formData.showXAxis !== false}
                      onChange={(e) => setFormData({ ...formData, showXAxis: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                  </label>

                  <label className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                    <span className="text-[11px] font-medium text-slate-700">แสดงแกน Y (Y-Axis)</span>
                    <input
                      type="checkbox"
                      checked={formData.showYAxis !== false}
                      onChange={(e) => setFormData({ ...formData, showYAxis: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                  </label>

                  <label className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                    <span className="text-[11px] font-medium text-slate-700">กล่องข้อมูลชี้ (Tooltip)</span>
                    <input
                      type="checkbox"
                      checked={formData.showTooltip !== false}
                      onChange={(e) => setFormData({ ...formData, showTooltip: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                  </label>

                  <label className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                    <span className="text-[11px] font-medium text-slate-700">แสดงป้ายชื่อชุดข้อมูล</span>
                    <input
                      type="checkbox"
                      checked={formData.showValueLabel !== false}
                      onChange={(e) => setFormData({ ...formData, showValueLabel: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                  </label>

                  {/* สวิตช์ปิด/เปิดคำว่า คำนวณจาก ... แถว (ค่าเริ่มต้นปิดไว้ตามคำสั่งผู้ใช้) */}
                  <label className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors sm:col-span-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-slate-700">
                        แสดงข้อความ "คำนวณจาก ... แถว"
                      </span>
                      <span className="text-[10px] text-slate-500">
                        (ปิดไว้เป็นค่าเริ่มต้นเพื่อความสะอาดตา)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!formData.showRowCount}
                      onChange={(e) => setFormData({ ...formData, showRowCount: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">แสดงเลเจนด์คำอธิบายสี</span>
                  <input
                    type="checkbox"
                    checked={formData.showLegend !== false}
                    onChange={(e) => setFormData({ ...formData, showLegend: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">แสดงตัวเลขดาต้าเลเบลบนกราฟ</span>
                  <input
                    type="checkbox"
                    checked={!!formData.showDataLabels}
                    onChange={(e) => setFormData({ ...formData, showDataLabels: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">แสดงเส้นตารางพื้นหลัง</span>
                  <input
                    type="checkbox"
                    checked={formData.showGrid !== false}
                    onChange={(e) => setFormData({ ...formData, showGrid: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                </div>
              </div>

              {/* Axis Titles & Chart Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อกำกับแกน X (X-Axis Title)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น เดือน, หมวดหมู่สินค้า"
                    value={formData.xAxisLabel || ''}
                    onChange={(e) => setFormData({ ...formData, xAxisLabel: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อกำกับแกน Y (Y-Axis Title)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ยอดขาย (บาท), จำนวนชิ้น"
                    value={formData.yAxisLabel || ''}
                    onChange={(e) => setFormData({ ...formData, yAxisLabel: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุหรือคำอธิบายเพิ่มเติมใต้กราฟ (Chart Note)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ข้อมูลอัปเดต ณ วันที่ 1, ไม่รวมสาขาต่างจังหวัด"
                  value={formData.chartNote || ''}
                  onChange={(e) => setFormData({ ...formData, chartNote: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Per-Category Color Meanings: "พวกสีนี้หมายถึงอะไร" */}
              {detectedCategories.length > 0 && (
                <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-blue-900 block">
                        ระบุความหมายของแต่ละสีในกราฟ ("สีนี้หมายถึงอะไร")
                      </span>
                      <span className="text-[11px] text-blue-700">
                        พิมพ์ความหมายเพื่อให้ผู้ชมเข้าใจว่าแต่ละสีในกราฟแท่ง/วงกลมแทนสิ่งใด
                      </span>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {detectedCategories.map((cat, idx) => {
                      const currentColor = getWidgetColorForCategory(cat, idx, formData);
                      const currentMeaning = formData.categoryColorMeanings?.[cat] || '';

                      return (
                        <div
                          key={cat}
                          className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200"
                        >
                          <span
                            className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: currentColor }}
                          />
                          <span className="text-xs font-bold text-slate-800 min-w-[120px] truncate" title={cat}>
                            {cat}
                          </span>
                          <input
                            type="text"
                            placeholder="ระบุความหมายของสีนี้ (เช่น ปลอดภัย, เป้าหมายสูง)..."
                            value={currentMeaning}
                            onChange={(e) => handleSetCategoryMeaning(cat, e.target.value)}
                            className="flex-1 text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Color Customization & Per-Category Colors */}
          {formData.type !== 'text' && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  <span>ชุดสีและการปรับแต่งสีแต่ละหมวดหมู่ (Category Colors)</span>
                </h4>
                {formData.customCategoryColors &&
                  Object.keys(formData.customCategoryColors).length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetCategoryColors}
                      className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>รีเซ็ตสีทั้งหมด</span>
                    </button>
                  )}
              </div>

              {/* Categorical Palette Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชุดโทนสีหลัก (Palette)
                  </label>
                  <select
                    value={formData.paletteName || 'vibrant'}
                    onChange={(e) =>
                      setFormData({ ...formData, paletteName: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(CATEGORICAL_PALETTES).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 mt-1.5">
                    {(
                      CATEGORICAL_PALETTES[formData.paletteName || 'vibrant']?.colors || []
                    )
                      .slice(0, 10)
                      .map((c, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    โหมดการแสดงสี (Color Mode)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, colorMode: 'palette' })}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        formData.colorMode !== 'single'
                          ? 'bg-blue-50 border-blue-400 text-blue-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      แยกสีแต่ละกลุ่ม
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, colorMode: 'single' })}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        formData.colorMode === 'single'
                          ? 'bg-blue-50 border-blue-400 text-blue-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      สีเดี่ยวทั้งกราฟ
                    </button>
                  </div>
                </div>
              </div>

              {/* Individual Category Color Customization */}
              {detectedCategories.length > 0 && formData.colorMode !== 'single' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700">
                      ปรับสีเฉพาะของแต่ละหมวดหมู่ ({detectedCategories.length} หมวดหมู่)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      คลิกที่ตลับสีเพื่อเลือกสีที่ต้องการ
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {detectedCategories.map((cat, idx) => {
                      const currentColor = getWidgetColorForCategory(cat, idx, formData);
                      const isCustomized =
                        formData.customCategoryColors &&
                        formData.customCategoryColors[cat] !== undefined;

                      return (
                        <div
                          key={cat}
                          className="flex items-center justify-between gap-2 p-1.5 bg-white rounded-lg border border-slate-200/80"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="color"
                              value={currentColor}
                              onChange={(e) => handleSetCategoryColor(cat, e.target.value)}
                              className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 shrink-0"
                              title={`คลิกเลือกสีสำหรับ "${cat}"`}
                            />
                            <span className="text-xs font-medium text-slate-800 truncate" title={cat}>
                              {cat}
                            </span>
                            {isCustomized && (
                              <span className="text-[9px] px-1 bg-amber-100 text-amber-800 rounded font-semibold shrink-0">
                                กำหนดเอง
                              </span>
                            )}
                          </div>

                          {/* Quick Preset Pills */}
                          <div className="flex items-center gap-1 shrink-0">
                            {QUICK_COLORS.slice(0, 6).map((qColor) => (
                              <button
                                key={qColor}
                                type="button"
                                onClick={() => handleSetCategoryColor(cat, qColor)}
                                className="w-3.5 h-3.5 rounded-full border border-black/10 hover:scale-125 transition-transform"
                                style={{ backgroundColor: qColor }}
                              />
                            ))}
                            {isCustomized && (
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = { ...(formData.customCategoryColors || {}) };
                                  delete copy[cat];
                                  setFormData({ ...formData, customCategoryColors: copy });
                                }}
                                className="text-[10px] text-slate-400 hover:text-rose-600 px-1"
                                title="คืนค่าสีเริ่มต้น"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sizing, Height & Number Formatting */}
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>การปรับขนาดและความสูง (Size & Height)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ความกว้าง (Width Span)
                </label>
                <select
                  value={formData.colSpan || (formData.width === 'full' ? 12 : formData.width === 'half' ? 6 : 4)}
                  onChange={(e) => {
                    const span = parseInt(e.target.value, 10);
                    setFormData({
                      ...formData,
                      colSpan: span,
                      width: span >= 10 ? 'full' : span >= 6 ? 'half' : 'third',
                    });
                  }}
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value={3}>1/4 หน้าจอ (3/12 คอลัมน์)</option>
                  <option value={4}>1/3 หน้าจอ (4/12 คอลัมน์)</option>
                  <option value={6}>1/2 หน้าจอ (6/12 คอลัมน์)</option>
                  <option value={8}>2/3 หน้าจอ (8/12 คอลัมน์)</option>
                  <option value={12}>เต็มหน้าจอ (12/12 คอลัมน์)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ความสูง (Height Preset)
                </label>
                <select
                  value={formData.heightPreset || 'normal'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      heightPreset: e.target.value as any,
                      customHeight: undefined,
                    })
                  }
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="compact">กะทัดรัด (Compact, ~220px)</option>
                  <option value="normal">ปกติ (Normal, ~330px)</option>
                  <option value="tall">สูง (Tall, ~460px)</option>
                  <option value="extra-tall">สูงพิเศษ (Extra Tall, ~580px)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำนำหน้า (Prefix)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ฿, $"
                  value={formData.prefix || ''}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำต่อท้าย (Suffix)
                </label>
                <input
                  type="text"
                  placeholder="เช่น รายการ, %"
                  value={formData.suffix || ''}
                  onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (formData) {
                  onSave(formData);
                  setPreviewNotice('อัปเดตและแสดงผลลัพธ์บนแดชบอร์ดให้ทดลองดูแล้ว!');
                  setTimeout(() => setPreviewNotice(null), 3500);
                }
              }}
              className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
              title="กดทดลองเพื่อดูผลลัพธ์บนหน้าจอทันทีโดยยังไม่ต้องปิดหน้าต่างนี้"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ทดลองดูผลลัพธ์ (Test / Preview)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกการตั้งค่า</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
