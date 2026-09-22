import React, { useState } from 'react';
import {
  WidgetConfig,
  WidgetType,
  AggregationType,
  NumberFormatType,
  HeightPreset,
  WidgetFilterRule,
  FilterOperatorType,
} from '../types';
import {
  X,
  Sliders,
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  Table as TableIcon,
  Hash,
  Type,
  Palette,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Database,
  ArrowRightLeft,
  ChevronRight,
  Zap,
  EyeOff,
  Filter,
  RotateCcw,
  BarChart3,
  Activity,
  Compass,
  CircleDot,
  FileText,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  CornerDownRight,
  SlidersHorizontal,
  Scale,
} from 'lucide-react';
import {
  THEME_PALETTES,
  CATEGORICAL_PALETTES,
  getWidgetColorForCategory,
  evaluateFilterRule,
} from '../utils/aggregateData';

interface BISidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  activeWidgetId: string | null;
  onSelectWidget: (id: string) => void;
  onUpdateWidget: (updated: WidgetConfig) => void;
  onAddWidgetWithType: (type: WidgetType, customProps?: Partial<WidgetConfig>) => void;
  headers: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  totalRecordsCount: number;
  liveSyncInterval: number; // 0 = off, seconds
  onSetLiveSyncInterval: (seconds: number) => void;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  onManualSync: () => void;
  records?: Record<string, any>[];
  docked?: boolean;
  onOpenDataGrid?: () => void;
}

type TabKey = 'visuals' | 'format' | 'fields' | 'realtime';

export const BISidePanel: React.FC<BISidePanelProps> = ({
  isOpen,
  onClose,
  widgets,
  activeWidgetId,
  onSelectWidget,
  onUpdateWidget,
  onAddWidgetWithType,
  headers,
  numericColumns,
  categoricalColumns,
  dateColumns,
  totalRecordsCount,
  liveSyncInterval,
  onSetLiveSyncInterval,
  lastSyncedAt,
  isSyncing,
  onManualSync,
  records = [],
  docked = false,
  onOpenDataGrid,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('format');
  const [fieldsSubSection, setFieldsSubSection] = useState<'config' | 'filter' | 'columns'>('config');
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [fieldTypeFilter, setFieldTypeFilter] = useState<'all' | 'numeric' | 'categorical' | 'date'>('all');

  // Find active widget or fallback to first widget
  const activeWidget = widgets.find((w) => w.id === activeWidgetId) || widgets[0] || null;

  // Filter evaluation stats for live preview
  const filterStats = React.useMemo(() => {
    if (!records || records.length === 0 || !activeWidget) return null;
    const rules = activeWidget.filterRules || [];
    if (rules.length === 0) return { matched: records.length, total: records.length, pct: 100 };
    const isOr = activeWidget.filterLogic === 'or';
    let matched = 0;
    for (const r of records) {
      const pass = isOr
        ? rules.some((rule) => evaluateFilterRule(r, rule))
        : rules.every((rule) => evaluateFilterRule(r, rule));
      if (pass) matched++;
    }
    return {
      matched,
      total: records.length,
      pct: Math.round((matched / records.length) * 1000) / 10,
    };
  }, [records, activeWidget?.filterRules, activeWidget?.filterLogic]);

  // Add a new filter rule
  const handleAddFilterRule = (initialCol?: string) => {
    if (!activeWidget) return;
    const newRule: WidgetFilterRule = {
      id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      column: initialCol || headers[0] || '',
      operator: 'equals',
      compareMode: 'value',
      value: '',
    };
    const currentRules = activeWidget.filterRules || [];
    onUpdateWidget({
      ...activeWidget,
      filterRules: [...currentRules, newRule],
    });
  };

  // Update a specific filter rule
  const handleUpdateFilterRule = (ruleId: string, updates: Partial<WidgetFilterRule>) => {
    if (!activeWidget) return;
    const currentRules = activeWidget.filterRules || [];
    const newRules = currentRules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
    onUpdateWidget({
      ...activeWidget,
      filterRules: newRules,
    });
  };

  // Delete a specific filter rule
  const handleDeleteFilterRule = (ruleId: string) => {
    if (!activeWidget) return;
    const currentRules = activeWidget.filterRules || [];
    onUpdateWidget({
      ...activeWidget,
      filterRules: currentRules.filter((r) => r.id !== ruleId),
    });
  };

  // Clear all filter rules
  const handleClearAllFilterRules = () => {
    if (!activeWidget) return;
    onUpdateWidget({
      ...activeWidget,
      filterRules: [],
    });
  };

  // Categories for activeWidget for per-category coloring
  const activeCategories = React.useMemo(() => {
    if (!activeWidget?.categoryColumn || !records || records.length === 0) return [];
    const catCol = activeWidget.categoryColumn;
    const set = new Set<string>();
    for (const r of records) {
      const val = r[catCol];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        set.add(String(val).trim());
      } else if (!activeWidget.excludeBlank) {
        set.add('(ว่าง)');
      }
      if (set.size >= 25) break;
    }
    return Array.from(set);
  }, [activeWidget?.categoryColumn, activeWidget?.excludeBlank, records]);

  if (!isOpen) return null;

  const fontOptions = [
    { label: 'Inter (สากล มาตรฐาน)', value: 'Inter, sans-serif' },
    { label: 'Sarabun (สารบัญ ราชการ/เอกสาร)', value: 'Sarabun, sans-serif' },
    { label: 'Prompt (พร้อมท์ โมเดิร์น)', value: 'Prompt, sans-serif' },
    { label: 'Kanit (คณิต ตัวหนาคมชัด)', value: 'Kanit, sans-serif' },
    { label: 'JetBrains Mono (โมโนสเปซ/ตัวเลข)', value: 'JetBrains Mono, monospace' },
  ];

  const colorPresets = [
    '#0f172a', // Slate 900
    '#1e293b', // Slate 800
    '#2563eb', // Blue 600
    '#059669', // Emerald 600
    '#7c3aed', // Violet 600
    '#d97706', // Amber 600
    '#e11d48', // Rose 600
    '#0d9488', // Teal 600
    '#475569', // Slate 600
  ];

  const bgPresets = [
    { label: 'ขาวบริสุทธิ์', value: '#ffffff' },
    { label: 'เทาอ่อนสลีค', value: '#f8fafc' },
    { label: 'ครีมกระดาษ', value: '#fefce8' },
    { label: 'เขียวอ่อนนวล', value: '#f0fdf4' },
    { label: 'ฟ้าละมุน', value: '#eff6ff' },
    { label: 'ม่วงพาสเทล', value: '#faf5ff' },
    { label: 'ธีมมืดดาร์ก', value: '#0f172a' },
  ];

  return (
    <aside
      className={`${
        docked
          ? 'w-88 sm:w-96 shrink-0 border-l border-slate-200 bg-white flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 z-30 shadow-xs'
          : 'fixed inset-y-0 right-0 z-50 w-88 sm:w-96 shadow-2xl bg-white border-l border-slate-200 flex flex-col'
      } transition-all duration-200`}
    >
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900">เครื่องมือ BI Studio</h2>
            <p className="text-[10px] text-slate-500">ปรับฟอนต์ สี ฟิลเตอร์ ลิงก์สด</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onOpenDataGrid && (
            <button
              type="button"
              onClick={onOpenDataGrid}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 text-[11px] font-semibold border border-slate-200/80 bg-white"
              title="เปิดหน้าแก้ไขฐานข้อมูล (Data Grid Editor)"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">แก้ไขฐานข้อมูล</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="ปิดแถบเครื่องมือ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BI Navigation Tabs */}
      <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-100/60 p-1 gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('visuals')}
          className={`py-1.5 px-1 rounded-md font-medium flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'visuals'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">เพิ่มวิชวล</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('format')}
          className={`py-1.5 px-1 rounded-md font-medium flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'format'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="text-[10px]">ฟอนต์/สไตล์</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fields')}
          className={`py-1.5 px-1 rounded-md font-medium flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'fields'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span className="text-[10px]">ฟิลด์ข้อมูล</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('realtime')}
          className={`py-1.5 px-1 rounded-md font-medium flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'realtime'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px]">เรียลไทม์</span>
        </button>
      </div>

      {/* Tab Body Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ======================= TAB 1: VISUALIZATIONS PALETTE ======================= */}
        {activeTab === 'visuals' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                สร้างกราฟและวิชวลใหม่
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                คลิกเลือกประเภทกราฟเพื่อเพิ่มลงในแดชบอร์ดทันที
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('kpi', {
                      title: 'ยอดสรุปเด่น (KPI Metric)',
                      width: 'third',
                      colSpan: 4,
                      valueColumn: numericColumns[0] || headers[0],
                      aggregation: 'sum',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">การ์ด KPI สรุป</div>
                  <div className="text-[10px] text-slate-500">ผลรวม, ค่าเฉลี่ย, จำนวน</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('bar', {
                      title: 'กราฟแท่งแนวตั้ง (Bar Chart)',
                      width: 'half',
                      colSpan: 6,
                      categoryColumn: categoricalColumns[0] || headers[0],
                      valueColumn: numericColumns[0] || headers[1],
                      aggregation: 'sum',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">กราฟแท่ง (Bar)</div>
                  <div className="text-[10px] text-slate-500">เปรียบเทียบตามหมวดหมู่</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('line', {
                      title: 'กราฟเส้นแนวโน้ม (Line Chart)',
                      width: 'half',
                      colSpan: 6,
                      categoryColumn: dateColumns[0] || categoricalColumns[0] || headers[0],
                      valueColumn: numericColumns[0] || headers[1],
                      aggregation: 'sum',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-teal-100 text-teal-700 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">กราฟเส้น (Line)</div>
                  <div className="text-[10px] text-slate-500">แนวโน้มตามวัน/เวลา</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('pie', {
                      title: 'สัดส่วนโดนัท (Donut / Pie)',
                      width: 'third',
                      colSpan: 4,
                      categoryColumn: categoricalColumns[0] || headers[0],
                      valueColumn: numericColumns[0] || headers[1],
                      aggregation: 'sum',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-violet-50/60 border border-slate-200 hover:border-violet-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-violet-100 text-violet-700 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <PieIcon className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">วงกลมโดนัท (Pie)</div>
                  <div className="text-[10px] text-slate-500">แสดงสัดส่วนเปอร์เซ็นต์</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('area', {
                      title: 'กราฟพื้นที่ (Area Trend)',
                      width: 'half',
                      colSpan: 6,
                      categoryColumn: dateColumns[0] || categoricalColumns[0] || headers[0],
                      valueColumn: numericColumns[0] || headers[1],
                      aggregation: 'sum',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">กราฟพื้นที่ (Area)</div>
                  <div className="text-[10px] text-slate-500">แนวโน้มปริมาณสะสม</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('horizontal_bar', {
                      title: 'กราฟแท่งแนวนอน (Horizontal Bar)',
                      width: 'half',
                      colSpan: 6,
                      categoryColumn: categoricalColumns[0] || headers[0],
                      valueColumn: numericColumns[0] || headers[1],
                      aggregation: 'sum',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-cyan-50/60 border border-slate-200 hover:border-cyan-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-cyan-100 text-cyan-700 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">แท่งแนวนอน</div>
                  <div className="text-[10px] text-slate-500">จัดอันดับชื่อยาว</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('combo', {
                      title: 'กราฟผสม (Combo Bar & Line)',
                      width: 'half',
                      colSpan: 6,
                      categoryColumn: categoricalColumns[0] || headers[0],
                      valueColumn: numericColumns[0] || headers[1],
                      secondaryValueColumn: numericColumns[1] || undefined,
                      aggregation: 'sum',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">กราฟผสม (Combo)</div>
                  <div className="text-[10px] text-slate-500">แท่ง + เส้นควบคู่</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('radar', {
                      title: 'กราฟเรดาร์ (Radar Chart)',
                      width: 'half',
                      colSpan: 6,
                      categoryColumn: categoricalColumns[0] || headers[0],
                      valueColumn: numericColumns[0] || headers[1],
                      aggregation: 'sum',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">เรดาร์ (Radar)</div>
                  <div className="text-[10px] text-slate-500">มิติคุณลักษณะ</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('radial_bar', {
                      title: 'มาตรวัดวงกลม (Gauge)',
                      width: 'third',
                      colSpan: 4,
                      categoryColumn: categoricalColumns[0] || headers[0],
                      valueColumn: numericColumns[0] || headers[1],
                      aggregation: 'sum',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-pink-50/60 border border-slate-200 hover:border-pink-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-pink-100 text-pink-700 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <CircleDot className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">มาตรวัดวงแหวน</div>
                  <div className="text-[10px] text-slate-500">เปรียบเทียบสัดส่วน</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('scatter', {
                      title: 'กราฟจุดกระจาย (Scatter Plot)',
                      width: 'half',
                      colSpan: 6,
                      categoryColumn: categoricalColumns[0] || headers[0],
                      valueColumn: numericColumns[0] || headers[1],
                      secondaryValueColumn: numericColumns[1] || headers[2] || undefined,
                      aggregation: 'sum',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <CircleDot className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">กราฟจุด (Scatter)</div>
                  <div className="text-[10px] text-slate-500">ความสัมพันธ์ 2 แกน</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('text', {
                      title: 'กล่องข้อความ / แบนเนอร์',
                      width: 'third',
                      colSpan: 4,
                      textSubtitle: 'สรุปข้อมูลภาพรวม',
                      badgeText: 'สรุป',
                      badgeColor: '#2563eb',
                      textContent: 'เขียนบันทึก หมายเหตุ หรือข้อความแนะนำสำหรับแดชบอร์ดนี้...',
                      calloutStyle: 'card',
                      iconName: 'sparkles',
                      textAlign: 'left',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">กล่องข้อความ</div>
                  <div className="text-[10px] text-slate-500">ใส่โน้ตและแบนเนอร์</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddWidgetWithType('table', {
                      title: 'ตารางสรุปข้อมูล (Data Table)',
                      width: 'full',
                      colSpan: 12,
                      aggregation: 'none',
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition-all group"
                >
                  <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg w-fit mb-2 group-hover:scale-105 transition-transform">
                    <TableIcon className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">ตารางข้อมูล (Table)</div>
                  <div className="text-[10px] text-slate-500">ค้นหาและดูทุกรายการ</div>
                </button>
              </div>
            </div>

            {/* Quick Metrics Assistant */}
            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>ตัวช่วยสร้างสถิติด่วน (Quick Metrics)</span>
              </h4>
              <div className="space-y-1.5">
                {numericColumns.slice(0, 3).map((numCol) => (
                  <button
                    key={numCol}
                    type="button"
                    onClick={() =>
                      onAddWidgetWithType('kpi', {
                        title: `ยอดรวม: ${numCol}`,
                        width: 'third',
                        colSpan: 4,
                        valueColumn: numCol,
                        aggregation: 'sum',
                        numberFormat: 'currency',
                        decimalPlaces: 2,
                      })
                    }
                    className="w-full text-xs px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 flex items-center justify-between text-left"
                  >
                    <span className="truncate">ผลรวม {numCol} (SUM ฿)</span>
                    <span className="text-[10px] text-blue-600 font-semibold">+ เพิ่ม</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: FORMAT & EXCEL STYLING ======================= */}
        {activeTab === 'format' && (
          <div className="space-y-4">
            {/* Active Widget Selector Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วิดเจ็ตที่กำลังปรับแต่ง (Active Widget)
              </label>
              {widgets.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  ยังไม่มีวิดเจ็ตในแดชบอร์ด ให้คลิกแท็บ "เพิ่มวิชวล" ด้านบน
                </div>
              ) : (
                <select
                  value={activeWidget?.id || ''}
                  onChange={(e) => onSelectWidget(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                >
                  {widgets.map((w, idx) => (
                    <option key={w.id} value={w.id}>
                      #{idx + 1} {w.title} ({w.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {activeWidget && (
              <div className="space-y-4">
                {/* 1. Title Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อหัวข้อการ์ด (Title)
                  </label>
                  <input
                    type="text"
                    value={activeWidget.title}
                    onChange={(e) =>
                      onUpdateWidget({ ...activeWidget, title: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* 2. Excel Typography Toolbar */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-blue-600" />
                      <span>ฟอนต์และตัวหนังสือ (Excel Typography)</span>
                    </span>
                  </div>

                  {/* Font Family Selector */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      แบบอักษร (Font Family)
                    </label>
                    <select
                      value={activeWidget.fontFamily || 'Inter, sans-serif'}
                      onChange={(e) =>
                        onUpdateWidget({ ...activeWidget, fontFamily: e.target.value })
                      }
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-blue-500"
                    >
                      {fontOptions.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick B / I / U / Alignment Ribbon like Excel */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateWidget({
                            ...activeWidget,
                            isBold: !activeWidget.isBold,
                          })
                        }
                        title="ตัวหนา (Bold)"
                        className={`p-1.5 text-xs font-bold transition-colors ${
                          activeWidget.isBold
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateWidget({
                            ...activeWidget,
                            isItalic: !activeWidget.isItalic,
                          })
                        }
                        title="ตัวเอียง (Italic)"
                        className={`p-1.5 text-xs transition-colors border-l border-slate-200 ${
                          activeWidget.isItalic
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateWidget({
                            ...activeWidget,
                            isUnderline: !activeWidget.isUnderline,
                          })
                        }
                        title="ขีดเส้นใต้ (Underline)"
                        className={`p-1.5 text-xs transition-colors border-l border-slate-200 ${
                          activeWidget.isUnderline
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateWidget({ ...activeWidget, textAlign: 'left' })
                        }
                        title="จัดชิดซ้าย (Align Left)"
                        className={`p-1.5 text-xs transition-colors ${
                          (activeWidget.textAlign || 'left') === 'left'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateWidget({ ...activeWidget, textAlign: 'center' })
                        }
                        title="จัดกึ่งกลาง (Align Center)"
                        className={`p-1.5 text-xs transition-colors border-l border-slate-200 ${
                          activeWidget.textAlign === 'center'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateWidget({ ...activeWidget, textAlign: 'right' })
                        }
                        title="จัดชิดขวา (Align Right)"
                        className={`p-1.5 text-xs transition-colors border-l border-slate-200 ${
                          activeWidget.textAlign === 'right'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Text Size Controls */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        ขนาดหัวข้อ (Title Size)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="range"
                          min={11}
                          max={22}
                          value={activeWidget.titleFontSize || 14}
                          onChange={(e) =>
                            onUpdateWidget({
                              ...activeWidget,
                              titleFontSize: Number(e.target.value),
                            })
                          }
                          className="w-full accent-blue-600"
                        />
                        <span className="text-[11px] font-mono text-slate-600 w-7 text-right">
                          {activeWidget.titleFontSize || 14}px
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        ขนาดตัวเลข (Value Size)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="range"
                          min={18}
                          max={48}
                          value={activeWidget.valueFontSize || 32}
                          onChange={(e) =>
                            onUpdateWidget({
                              ...activeWidget,
                              valueFontSize: Number(e.target.value),
                            })
                          }
                          className="w-full accent-blue-600"
                        />
                        <span className="text-[11px] font-mono text-slate-600 w-7 text-right">
                          {activeWidget.valueFontSize || 32}px
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Text Color Presets */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      สีตัวอักษร (Text Color)
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {colorPresets.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() =>
                            onUpdateWidget({ ...activeWidget, textColor: hex })
                          }
                          className={`w-5 h-5 rounded-md border border-slate-300 transition-transform ${
                            (activeWidget.textColor || '#0f172a') === hex
                              ? 'ring-2 ring-blue-500 ring-offset-1 scale-110'
                              : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Flexible Layout & Dimensions (ไม่ต้องแบ่ง 1/2 1/3 ปรับอิสระ 1..12 คอลัมน์) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ขนาดและความกว้าง (12-Column Grid Layout)</span>
                    </span>
                    <span className="text-blue-600 font-mono text-[10px]">
                      {activeWidget.colSpan ||
                        (activeWidget.width === 'full'
                          ? 12
                          : activeWidget.width === 'half'
                          ? 6
                          : 4)}
                      /12
                    </span>
                  </div>

                  {/* Free Slider for Column Span (1 to 12) */}
                  <div>
                    <input
                      type="range"
                      min={2}
                      max={12}
                      step={1}
                      value={
                        activeWidget.colSpan ||
                        (activeWidget.width === 'full'
                          ? 12
                          : activeWidget.width === 'half'
                          ? 6
                          : 4)
                      }
                      onChange={(e) => {
                        const span = Number(e.target.value);
                        onUpdateWidget({
                          ...activeWidget,
                          colSpan: span,
                          width: span >= 10 ? 'full' : span >= 6 ? 'half' : 'third',
                        });
                      }}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>2 (แคบ)</span>
                      <span>4 (1/3)</span>
                      <span>6 (ครึ่งจอ)</span>
                      <span>8 (2/3)</span>
                      <span>12 (เต็มจอ)</span>
                    </div>
                  </div>

                  {/* Quick Width Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { span: 3, label: '25%' },
                      { span: 4, label: '33%' },
                      { span: 6, label: '50%' },
                      { span: 12, label: '100%' },
                    ].map((btn) => (
                      <button
                        key={btn.span}
                        type="button"
                        onClick={() =>
                          onUpdateWidget({
                            ...activeWidget,
                            colSpan: btn.span,
                            width: btn.span >= 10 ? 'full' : btn.span >= 6 ? 'half' : 'third',
                          })
                        }
                        className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                          (activeWidget.colSpan ||
                            (activeWidget.width === 'full'
                              ? 12
                              : activeWidget.width === 'half'
                              ? 6
                              : 4)) === btn.span
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Card Height Preset */}
                  <div className="pt-1">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      ความสูงของการ์ด (Card Height)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { preset: 'compact' as HeightPreset, label: 'กะทัดรัด (240px)' },
                        { preset: 'normal' as HeightPreset, label: 'มาตรฐาน (340px)' },
                        { preset: 'tall' as HeightPreset, label: 'สูงพิเศษ (460px)' },
                      ].map((h) => (
                        <button
                          key={h.preset}
                          type="button"
                          onClick={() =>
                            onUpdateWidget({ ...activeWidget, heightPreset: h.preset })
                          }
                          className={`py-1 px-1 text-[11px] font-medium rounded-lg border text-center transition-all ${
                            (activeWidget.heightPreset || 'normal') === h.preset
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Card Background & Border Style */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <label className="block text-[10px] font-semibold text-slate-500">
                    สีพื้นหลังการ์ด (Card Background Fill)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {bgPresets.map((bg) => (
                      <button
                        key={bg.value}
                        type="button"
                        onClick={() =>
                          onUpdateWidget({ ...activeWidget, backgroundColor: bg.value })
                        }
                        className={`p-1 text-[10px] rounded-lg border text-center font-medium truncate transition-all ${
                          (activeWidget.backgroundColor || '#ffffff') === bg.value
                            ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-500 font-bold'
                            : 'border-slate-300'
                        }`}
                        style={{
                          backgroundColor: bg.value,
                          color: bg.value === '#0f172a' ? '#fff' : '#000',
                        }}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>

                  {/* Color Theme & Categorical Palettes for Charts */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-slate-700">
                        ชุดสีหลักของกราฟ (Palette)
                      </label>
                      {activeWidget.customCategoryColors &&
                        Object.keys(activeWidget.customCategoryColors).length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateWidget({ ...activeWidget, customCategoryColors: {} })
                            }
                            className="text-[10px] text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>รีเซ็ตสี</span>
                          </button>
                        )}
                    </div>

                    <select
                      value={activeWidget.paletteName || 'vibrant'}
                      onChange={(e) =>
                        onUpdateWidget({ ...activeWidget, paletteName: e.target.value })
                      }
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      {Object.entries(CATEGORICAL_PALETTES).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      {(
                        CATEGORICAL_PALETTES[activeWidget.paletteName || 'vibrant']?.colors ||
                        []
                      )
                        .slice(0, 8)
                        .map((c, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateWidget({ ...activeWidget, colorMode: 'palette' })
                        }
                        className={`py-1 px-1 text-[10px] font-semibold rounded-md border text-center transition-all ${
                          activeWidget.colorMode !== 'single'
                            ? 'bg-blue-50 border-blue-400 text-blue-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        แยกสีแต่ละกลุ่ม
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateWidget({ ...activeWidget, colorMode: 'single' })
                        }
                        className={`py-1 px-1 text-[10px] font-semibold rounded-md border text-center transition-all ${
                          activeWidget.colorMode === 'single'
                            ? 'bg-blue-50 border-blue-400 text-blue-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        สีเดี่ยวทั้งกราฟ
                      </button>
                    </div>

                    {/* Per-Category Color Customization */}
                    {activeCategories.length > 0 && activeWidget.colorMode !== 'single' && (
                      <div className="pt-2 space-y-1.5">
                        <label className="block text-[10px] font-semibold text-slate-600">
                          ปรับสีตามกลุ่มข้อมูล ({activeCategories.length} กลุ่ม)
                        </label>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1 bg-white p-1.5 rounded-lg border border-slate-200">
                          {activeCategories.map((cat, idx) => {
                            const currentColor = getWidgetColorForCategory(
                              cat,
                              idx,
                              activeWidget
                            );
                            const isCustomized =
                              activeWidget.customCategoryColors &&
                              activeWidget.customCategoryColors[cat] !== undefined;

                            return (
                              <div
                                key={cat}
                                className="flex items-center justify-between gap-1.5 text-xs py-0.5"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <input
                                    type="color"
                                    value={currentColor}
                                    onChange={(e) => {
                                      const next = {
                                        ...(activeWidget.customCategoryColors || {}),
                                        [cat]: e.target.value,
                                      };
                                      onUpdateWidget({
                                        ...activeWidget,
                                        customCategoryColors: next,
                                      });
                                    }}
                                    className="w-4 h-4 rounded cursor-pointer border-0 p-0 shrink-0"
                                    title={`เลือกสี "${cat}"`}
                                  />
                                  <span
                                    className="text-[11px] text-slate-700 truncate font-medium"
                                    title={cat}
                                  >
                                    {cat}
                                  </span>
                                </div>
                                {isCustomized && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const copy = {
                                        ...(activeWidget.customCategoryColors || {}),
                                      };
                                      delete copy[cat];
                                      onUpdateWidget({
                                        ...activeWidget,
                                        customCategoryColors: copy,
                                      });
                                    }}
                                    className="text-[10px] text-slate-400 hover:text-rose-600"
                                    title="คืนค่าสี"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exclude Blank & Chart Filter */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      id="sidePanelExcludeBlank"
                      type="checkbox"
                      checked={!!activeWidget.excludeBlank}
                      onChange={(e) =>
                        onUpdateWidget({
                          ...activeWidget,
                          excludeBlank: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <label
                      htmlFor="sidePanelExcludeBlank"
                      className="text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      ไม่แสดงข้อมูลว่างในกราฟ (ไม่นับ blank)
                    </label>
                  </div>

                  {/* Dedicated Chart-Specific Filter */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Filter className="w-3 h-3 text-indigo-600" />
                        <span>ฟิลเตอร์เฉพาะกราฟนี้</span>
                      </span>
                      {(activeWidget.widgetFilterColumn || activeWidget.widgetFilterValue) && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateWidget({
                              ...activeWidget,
                              widgetFilterColumn: undefined,
                              widgetFilterOperator: undefined,
                              widgetFilterValue: undefined,
                            })
                          }
                          className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold"
                        >
                          ล้าง
                        </button>
                      )}
                    </div>

                    <div>
                      <select
                        value={activeWidget.widgetFilterColumn || ''}
                        onChange={(e) =>
                          onUpdateWidget({
                            ...activeWidget,
                            widgetFilterColumn: e.target.value || undefined,
                          })
                        }
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      >
                        <option value="">-- ไม่กรอง (แสดงทั้งหมด) --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {activeWidget.widgetFilterColumn && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={activeWidget.widgetFilterOperator || 'equals'}
                          onChange={(e) =>
                            onUpdateWidget({
                              ...activeWidget,
                              widgetFilterOperator: e.target.value as any,
                            })
                          }
                          className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                        >
                          <option value="equals">ตรงกับ</option>
                          <option value="not_equals">ไม่ตรงกับ</option>
                          <option value="contains">มีคำว่า</option>
                          <option value="not_empty">ไม่ว่าง</option>
                        </select>

                        <input
                          type="text"
                          disabled={activeWidget.widgetFilterOperator === 'not_empty'}
                          placeholder="ค่า..."
                          value={activeWidget.widgetFilterValue || ''}
                          onChange={(e) =>
                            onUpdateWidget({
                              ...activeWidget,
                              widgetFilterValue: e.target.value,
                            })
                          }
                          className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Excel-like Chart Elements & Labels */}
                {activeWidget.type !== 'table' && activeWidget.type !== 'text' && (
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        <span>องค์ประกอบกราฟสไตล์ Excel</span>
                      </label>
                      <span className="text-[10px] text-blue-600 font-medium">ปรับแต่งได้</span>
                    </div>

                    {/* Custom Series Label replacing 'มูลค่า' */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        ข้อความแทนคำว่า "มูลค่า" (Custom Label)
                      </label>
                      <input
                        type="text"
                        placeholder={activeWidget.valueColumn || 'พิมพ์ชื่อที่ต้องการ เช่น ยอดขายสุทธิ'}
                        value={activeWidget.customValueLabel || ''}
                        onChange={(e) =>
                          onUpdateWidget({ ...activeWidget, customValueLabel: e.target.value })
                        }
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Axis Titles & Data Label Position */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          ชื่อแกน X (X-Axis)
                        </label>
                        <input
                          type="text"
                          placeholder="ชื่อแกน X..."
                          value={activeWidget.xAxisLabel || ''}
                          onChange={(e) =>
                            onUpdateWidget({ ...activeWidget, xAxisLabel: e.target.value })
                          }
                          className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          ชื่อแกน Y (Y-Axis)
                        </label>
                        <input
                          type="text"
                          placeholder="ชื่อแกน Y..."
                          value={activeWidget.yAxisLabel || ''}
                          onChange={(e) =>
                            onUpdateWidget({ ...activeWidget, yAxisLabel: e.target.value })
                          }
                          className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          ตำแหน่งตัวเลข (Label Pos)
                        </label>
                        <select
                          value={activeWidget.dataLabelPosition || 'top'}
                          onChange={(e) =>
                            onUpdateWidget({ ...activeWidget, dataLabelPosition: e.target.value as any })
                          }
                          className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                        >
                          <option value="top">ด้านบน (Top)</option>
                          <option value="inside">ด้านใน (Inside)</option>
                          <option value="bottom">ด้านล่าง (Bottom)</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <label className="w-full p-1.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer">
                          <span className="text-[10px] font-medium text-slate-700">ดาต้าเลเบล</span>
                          <input
                            type="checkbox"
                            checked={!!activeWidget.showDataLabels}
                            onChange={(e) =>
                              onUpdateWidget({ ...activeWidget, showDataLabels: e.target.checked })
                            }
                            className="w-3.5 h-3.5 text-blue-600 rounded"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Visibility toggles */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <label className="p-1.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer">
                        <span className="text-[10px] font-medium text-slate-700">แสดงแกน X</span>
                        <input
                          type="checkbox"
                          checked={activeWidget.showXAxis !== false}
                          onChange={(e) =>
                            onUpdateWidget({ ...activeWidget, showXAxis: e.target.checked })
                          }
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                      </label>

                      <label className="p-1.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer">
                        <span className="text-[10px] font-medium text-slate-700">แสดงแกน Y</span>
                        <input
                          type="checkbox"
                          checked={activeWidget.showYAxis !== false}
                          onChange={(e) =>
                            onUpdateWidget({ ...activeWidget, showYAxis: e.target.checked })
                          }
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                      </label>

                      <label className="p-1.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer">
                        <span className="text-[10px] font-medium text-slate-700">กล่อง Tooltip</span>
                        <input
                          type="checkbox"
                          checked={activeWidget.showTooltip !== false}
                          onChange={(e) =>
                            onUpdateWidget({ ...activeWidget, showTooltip: e.target.checked })
                          }
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                      </label>

                      <label className="p-1.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer">
                        <span className="text-[10px] font-medium text-slate-700">เลเจนด์สี</span>
                        <input
                          type="checkbox"
                          checked={activeWidget.showLegend !== false}
                          onChange={(e) =>
                            onUpdateWidget({ ...activeWidget, showLegend: e.target.checked })
                          }
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                      </label>
                    </div>

                    {/* ปิดเปิดข้อความคำนวณจาก ... แถว (เริ่มต้นปิดไว้) */}
                    <label className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-700">
                          แสดง "คำนวณจาก ... แถว"
                        </span>
                        <span className="text-[9px] text-slate-400">
                          (ปิดไว้เป็นค่าเริ่มต้น)
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!activeWidget.showRowCount}
                        onChange={(e) =>
                          onUpdateWidget({ ...activeWidget, showRowCount: e.target.checked })
                        }
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                    </label>

                    {/* แสดง/ซ่อน คำอธิบายตัวเล็กใต้หัวข้อการ์ด (เริ่มต้นปิดไว้เพื่อไม่ให้รก) */}
                    <label className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-700">
                          แสดงคำอธิบายใต้หัวข้อการ์ด
                        </span>
                        <span className="text-[9px] text-slate-400">
                          (ปิดไว้เป็นค่าเริ่มต้น เพื่อความกระชับสะอาดตา)
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!activeWidget.showDescription}
                        onChange={(e) =>
                          onUpdateWidget({ ...activeWidget, showDescription: e.target.checked })
                        }
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                    </label>

                    {/* แสดง/ซ่อน ป้ายนับจำนวน (COUNT) หรือ ผลรวม (SUM) พร้อมกล่องสี */}
                    <label className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-700">
                          แสดงป้ายนับจำนวน / ผลรวม / ไอคอน
                        </span>
                        <span className="text-[9px] text-slate-400">
                          (ติ๊กออกเพื่อซ่อนทั้งข้อความและกล่องสี กรอบจะเล็กลง)
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={activeWidget.showAggregationBadge !== false && activeWidget.showCountBadge !== false}
                        onChange={(e) =>
                          onUpdateWidget({
                            ...activeWidget,
                            showAggregationBadge: e.target.checked,
                            showCountBadge: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                    </label>

                    {/* เปรียบเทียบข้อมูล (Data Comparison & Trend %) */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] font-bold text-slate-800">
                            เปรียบเทียบข้อมูล (Trend %)
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={!!activeWidget.enableComparison}
                          onChange={(e) =>
                            onUpdateWidget({
                              ...activeWidget,
                              enableComparison: e.target.checked,
                              comparisonColumn:
                                activeWidget.comparisonColumn ||
                                categoricalColumns[0] ||
                                headers[0] ||
                                '',
                            })
                          }
                          className="w-3.5 h-3.5 text-emerald-600 rounded"
                        />
                      </div>

                      {activeWidget.enableComparison && (
                        <div className="space-y-2 pt-1 border-t border-slate-100 text-[10px]">
                          <div>
                            <span className="font-semibold text-slate-600 block mb-0.5">
                              คอลัมน์ช่วงเวลา/เทียบ (เช่น เดือน, วันที่)
                            </span>
                            <select
                              value={activeWidget.comparisonColumn || ''}
                              onChange={(e) =>
                                onUpdateWidget({
                                  ...activeWidget,
                                  comparisonColumn: e.target.value,
                                })
                              }
                              className="w-full text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded"
                            >
                              <option value="">-- เลือกคอลัมน์ --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="font-semibold text-slate-600 block mb-0.5">
                                แบบการเทียบ
                              </span>
                              <select
                                value={activeWidget.comparisonMode || 'previous_period'}
                                onChange={(e) =>
                                  onUpdateWidget({
                                    ...activeWidget,
                                    comparisonMode: e.target.value as any,
                                  })
                                }
                                className="w-full text-[10px] px-1.5 py-1 bg-slate-50 border border-slate-200 rounded"
                              >
                                <option value="previous_period">เทียบงวดก่อนหน้า</option>
                                <option value="baseline">เทียบเป้าหมาย</option>
                                <option value="all_total">เทียบยอดรวม %</option>
                              </select>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-600 block mb-0.5">
                                {activeWidget.comparisonMode === 'baseline' ? 'เป้าหมาย' : 'ป้ายกำกับ'}
                              </span>
                              {activeWidget.comparisonMode === 'baseline' ? (
                                <input
                                  type="number"
                                  value={activeWidget.comparisonBaselineValue ?? ''}
                                  onChange={(e) =>
                                    onUpdateWidget({
                                      ...activeWidget,
                                      comparisonBaselineValue: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="50000"
                                  className="w-full text-[10px] px-1.5 py-1 bg-slate-50 border border-slate-200 rounded"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={activeWidget.comparisonLabel || ''}
                                  onChange={(e) =>
                                    onUpdateWidget({
                                      ...activeWidget,
                                      comparisonLabel: e.target.value,
                                    })
                                  }
                                  placeholder="เทียบเดือนก่อน"
                                  className="w-full text-[10px] px-1.5 py-1 bg-slate-50 border border-slate-200 rounded"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* KPI Two-Column Condition Comparison in BISidePanel */}
                    <div className="p-2.5 bg-indigo-50/50 border border-indigo-200/80 rounded-lg space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-[10px] font-bold text-slate-800">
                            เทียบ 2 คอลัมน์ตามเงื่อนไข (A vs B)
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={!!activeWidget.enableTwoColCompare}
                          onChange={(e) =>
                            onUpdateWidget({
                              ...activeWidget,
                              enableTwoColCompare: e.target.checked,
                              compareColA: activeWidget.compareColA || headers[0] || '',
                              compareColB: activeWidget.compareColB || headers[1] || headers[0] || '',
                              compareOperator: activeWidget.compareOperator || 'equals',
                              compareDisplayMode: activeWidget.compareDisplayMode || 'count',
                            })
                          }
                          className="w-3.5 h-3.5 text-indigo-600 rounded"
                        />
                      </div>

                      {activeWidget.enableTwoColCompare && (
                        <div className="space-y-2 pt-1 border-t border-indigo-100 text-[10px]">
                          <div>
                            <span className="font-semibold text-slate-600 block mb-0.5">
                              คอลัมน์ A (ฝั่งซ้าย)
                            </span>
                            <select
                              value={activeWidget.compareColA || ''}
                              onChange={(e) =>
                                onUpdateWidget({
                                  ...activeWidget,
                                  compareColA: e.target.value,
                                })
                              }
                              className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded"
                            >
                              <option value="">-- เลือกคอลัมน์ A --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-600 block mb-0.5">
                              เงื่อนไขเปรียบเทียบ
                            </span>
                            <select
                              value={activeWidget.compareOperator || 'equals'}
                              onChange={(e) =>
                                onUpdateWidget({
                                  ...activeWidget,
                                  compareOperator: e.target.value as any,
                                })
                              }
                              className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded"
                            >
                              <option value="equals">= เท่ากับ (A = B)</option>
                              <option value="not_equals">≠ ไม่เท่ากับ (A ≠ B)</option>
                              <option value="greater_than">&gt; มากกว่า (A &gt; B)</option>
                              <option value="less_than">&lt; น้อยกว่า (A &lt; B)</option>
                              <option value="greater_than_or_equal">≥ มากกว่าหรือเท่ากับ (A ≥ B)</option>
                              <option value="less_than_or_equal">≤ น้อยกว่าหรือเท่ากับ (A ≤ B)</option>
                              <option value="contains">มีคำว่า (A มี B)</option>
                            </select>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-600 block mb-0.5">
                              คอลัมน์ B (ฝั่งขวา)
                            </span>
                            <select
                              value={activeWidget.compareColB || ''}
                              onChange={(e) =>
                                onUpdateWidget({
                                  ...activeWidget,
                                  compareColB: e.target.value,
                                })
                              }
                              className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded"
                            >
                              <option value="">-- เลือกคอลัมน์ B --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-600 block mb-0.5">
                              การแสดงผล
                            </span>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { key: 'count', label: 'จำนวน' },
                                { key: 'percent', label: '%' },
                                { key: 'both', label: 'ทั้งคู่' },
                              ].map((m) => (
                                <button
                                  key={m.key}
                                  type="button"
                                  onClick={() =>
                                    onUpdateWidget({
                                      ...activeWidget,
                                      compareDisplayMode: m.key as any,
                                    })
                                  }
                                  className={`py-1 px-1 text-[10px] font-semibold rounded border text-center transition-all ${
                                    (activeWidget.compareDisplayMode || 'count') === m.key
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Number Formatting like Excel (รูปแบบตัวเลข) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <label className="block text-[11px] font-bold text-slate-700">
                    รูปแบบตัวเลขเหมือน Excel (Number Formatting)
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        ประเภทตัวเลข
                      </label>
                      <select
                        value={activeWidget.numberFormat || 'general'}
                        onChange={(e) =>
                          onUpdateWidget({
                            ...activeWidget,
                            numberFormat: e.target.value as NumberFormatType,
                          })
                        }
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="general">ทั่วไป (General)</option>
                        <option value="currency">สกุลเงิน ฿ (Currency)</option>
                        <option value="percent">เปอร์เซ็นต์ % (Percentage)</option>
                        <option value="compact">ย่อตัวเลข K/M (Compact)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        ทศนิยม (Decimals)
                      </label>
                      <select
                        value={activeWidget.decimalPlaces ?? 0}
                        onChange={(e) =>
                          onUpdateWidget({
                            ...activeWidget,
                            decimalPlaces: Number(e.target.value),
                          })
                        }
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value={0}>0 ตำแหน่ง (เช่น 1,500)</option>
                        <option value={1}>1 ตำแหน่ง (เช่น 1,500.5)</option>
                        <option value={2}>2 ตำแหน่ง (เช่น 1,500.50)</option>
                        <option value={3}>3 ตำแหน่ง (เช่น 1,500.500)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        คำนำหน้า (Prefix)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ฿, $"
                        value={activeWidget.prefix || ''}
                        onChange={(e) =>
                          onUpdateWidget({ ...activeWidget, prefix: e.target.value })
                        }
                        className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        คำต่อท้าย (Suffix)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น รายการ, บาท"
                        value={activeWidget.suffix || ''}
                        onChange={(e) =>
                          onUpdateWidget({ ...activeWidget, suffix: e.target.value })
                        }
                        className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 3: DATA FIELDS & METRICS ======================= */}
        {activeTab === 'fields' && (
          <div className="space-y-4">
            {/* Active Widget Selector Banner */}
            <div className="p-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>เลือกวิดเจ็ตที่ต้องการปรับแต่งข้อมูล</span>
                </label>
                {activeWidget && (
                  <span className="text-[10px] px-2 py-0.5 bg-blue-200/80 text-blue-800 rounded-full font-bold uppercase tracking-wider">
                    {activeWidget.type}
                  </span>
                )}
              </div>
              <select
                value={activeWidget?.id || ''}
                onChange={(e) => {
                  if (onSelectWidget) onSelectWidget(e.target.value);
                }}
                className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-blue-300 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                {widgets.map((w, idx) => (
                  <option key={w.id} value={w.id}>
                    {idx + 1}. {w.title} ({w.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-section Navigation Bar */}
            <div className="grid grid-cols-3 bg-slate-200/70 p-1 rounded-xl gap-1 text-xs">
              <button
                type="button"
                onClick={() => setFieldsSubSection('config')}
                className={`py-1.5 px-1 rounded-lg font-semibold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  fieldsSubSection === 'config'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>ฟิลด์ & ค่า</span>
              </button>

              <button
                type="button"
                onClick={() => setFieldsSubSection('filter')}
                className={`py-1.5 px-1 rounded-lg font-semibold text-[11px] transition-all flex items-center justify-center gap-1 relative ${
                  fieldsSubSection === 'filter'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>ตัวกรองกราฟ</span>
                {(activeWidget?.filterRules?.length || 0) > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">
                    {activeWidget?.filterRules?.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFieldsSubSection('columns')}
                className={`py-1.5 px-1 rounded-lg font-semibold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  fieldsSubSection === 'columns'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3 h-3" />
                <span>คลังคอลัมน์ ({headers.length})</span>
              </button>
            </div>

            {/* Sub-Section 1: Configuration for Active Widget */}
            {fieldsSubSection === 'config' && activeWidget && (
              <div className="space-y-3.5">
                {/* Widget Title Input */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    ชื่อวิดเจ็ต (Widget Title)
                  </label>
                  <input
                    type="text"
                    value={activeWidget.title}
                    onChange={(e) => onUpdateWidget({ ...activeWidget, title: e.target.value })}
                    placeholder="พิมพ์ชื่อวิดเจ็ต..."
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                {/* Chart Type Selector */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    ประเภทวิชวล / กราฟ (Visual Type)
                  </label>
                  <select
                    value={activeWidget.type}
                    onChange={(e) => onUpdateWidget({ ...activeWidget, type: e.target.value as WidgetType })}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="kpi">KPI การ์ดสรุปตัวเลขเดี่ยว (Single Metric)</option>
                    <option value="bar">กราฟแท่งแนวตั้ง (Vertical Column Bar)</option>
                    <option value="horizontal_bar">กราฟแท่งแนวนอน (Horizontal Bar)</option>
                    <option value="line">กราฟเส้นแนวโน้ม (Trend Line Chart)</option>
                    <option value="area">กราฟพื้นที่สะสม (Area Chart)</option>
                    <option value="pie">กราฟวงกลม (Pie Chart)</option>
                    <option value="doughnut">กราฟโดนัท (Donut Chart)</option>
                    <option value="combo">กราฟผสมแท่งและเส้น (Combo Bar + Line)</option>
                    <option value="radar">กราฟใยแมงมุม (Radar / Spider Chart)</option>
                    <option value="radial_bar">กราฟวงกลมหลากชั้น (Radial Gauge)</option>
                    <option value="scatter">กราฟกระจายจุด (Scatter Plot)</option>
                    <option value="table">ตารางข้อมูล (Data Table Grid)</option>
                    <option value="text">กล่องข้อความ / หัวเรื่อง (Text Card)</option>
                  </select>
                </div>

                {/* Category Column (X-Axis) */}
                {activeWidget.type !== 'table' && activeWidget.type !== 'text' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-semibold text-slate-600">
                        แกนจัดกลุ่ม / หมวดหมู่ (Category / X-Axis)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFieldsSubSection('columns')}
                        className="text-[10px] text-blue-600 hover:underline font-semibold"
                      >
                        + ดูจากคลังคอลัมน์
                      </button>
                    </div>
                    <select
                      value={activeWidget.categoryColumn || ''}
                      onChange={(e) => onUpdateWidget({ ...activeWidget, categoryColumn: e.target.value })}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="">(ไม่เลือก / รวมเป็นตัวเลขยอดเดียว)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {numericColumns.includes(h) ? '(123)' : dateColumns.includes(h) ? '(📅)' : '(ABC)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Value Column (Y-Axis) */}
                {activeWidget.type !== 'table' && activeWidget.type !== 'text' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-semibold text-slate-600">
                        แกนตัวเลข / ตัวชี้วัด (Value / Metric)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFieldsSubSection('columns')}
                        className="text-[10px] text-emerald-600 hover:underline font-semibold"
                      >
                        + ดูจากคลังคอลัมน์
                      </button>
                    </div>
                    <select
                      value={activeWidget.valueColumn || ''}
                      onChange={(e) => onUpdateWidget({ ...activeWidget, valueColumn: e.target.value })}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="">(นับจำนวนแถวอัตโนมัติ - COUNT)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {numericColumns.includes(h) ? '(123 แนะนำ)' : '(ABC)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Secondary Value Column (for Combo/Dual Chart) */}
                {(activeWidget.type === 'combo' || activeWidget.type === 'line') && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      คอลัมน์ค่ารอง / เส้นกราฟเสริม (Secondary Metric)
                    </label>
                    <select
                      value={activeWidget.secondaryValueColumn || ''}
                      onChange={(e) => onUpdateWidget({ ...activeWidget, secondaryValueColumn: e.target.value })}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="">(ไม่มีค่ารอง)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h} {numericColumns.includes(h) ? '(123)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Aggregation Function Buttons */}
                {activeWidget.type !== 'table' && activeWidget.type !== 'text' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      ฟังก์ชันการคำนวณ (Aggregation Method)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {[
                        { key: 'sum' as AggregationType, label: 'ผลรวม (SUM)' },
                        { key: 'avg' as AggregationType, label: 'เฉลี่ย (AVG)' },
                        { key: 'count' as AggregationType, label: 'นับทั้งหมด (COUNT)' },
                        { key: 'distinct_count' as AggregationType, label: 'นับไม่ซ้ำ (UNIQUE)' },
                        { key: 'max' as AggregationType, label: 'สูงสุด (MAX)' },
                        { key: 'min' as AggregationType, label: 'ต่ำสุด (MIN)' },
                        { key: 'none' as AggregationType, label: 'ตามชีท (NONE)' },
                      ].map((fn) => (
                        <button
                          key={fn.key}
                          type="button"
                          onClick={() => onUpdateWidget({ ...activeWidget, aggregation: fn.key })}
                          className={`py-1 px-1.5 text-[10px] font-semibold rounded-lg border text-center transition-all ${
                            activeWidget.aggregation === fn.key
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {fn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sorting Options */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    การจัดเรียงลำดับในกราฟ (Sorting Order)
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { key: 'desc', label: 'มาก ➔ น้อย' },
                      { key: 'asc', label: 'น้อย ➔ มาก' },
                      { key: 'none', label: 'ตามชีทเดิม' },
                    ].map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => onUpdateWidget({ ...activeWidget, sortBy: s.key as any })}
                        className={`py-1 px-1.5 text-[10px] font-semibold rounded-lg border text-center transition-all ${
                          (activeWidget.sortBy || 'desc') === s.key
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prefix and Suffix */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      คำนำหน้า (Prefix)
                    </label>
                    <input
                      type="text"
                      value={activeWidget.prefix || ''}
                      onChange={(e) => onUpdateWidget({ ...activeWidget, prefix: e.target.value })}
                      placeholder="เช่น ฿, $, #"
                      className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      คำต่อท้าย (Suffix)
                    </label>
                    <input
                      type="text"
                      value={activeWidget.suffix || ''}
                      onChange={(e) => onUpdateWidget({ ...activeWidget, suffix: e.target.value })}
                      placeholder="เช่น รายการ, บาท, %"
                      className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                {/* Exclude Blank Values */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      ละเว้นค่าว่าง (Exclude Blanks)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ไม่นำแถวที่ข้อมูลหมวดหมู่ว่างมาพล็อตในกราฟ
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!activeWidget.excludeBlank}
                    onChange={(e) => onUpdateWidget({ ...activeWidget, excludeBlank: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {/* Quick Link to Filters */}
                <button
                  type="button"
                  onClick={() => setFieldsSubSection('filter')}
                  className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-blue-600" />
                    <span>ตัวกรองเฉพาะกราฟนี้ ({activeWidget.filterRules?.length || 0} เงื่อนไข)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                </button>
              </div>
            )}

            {/* Sub-Section 2: Multi-Condition Widget Filters */}
            {fieldsSubSection === 'filter' && activeWidget && (
              <div className="space-y-3.5">
                {/* Header & Description */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-blue-600" />
                    <span>ระบบตัวกรองหลายเงื่อนไขเฉพาะกราฟนี้</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    กำหนดให้กราฟนี้แสดงเฉพาะข้อมูลที่ผ่านเงื่อนไข สามารถเพิ่มหลายข้อ และเทียบค่าคงที่หรือคอลัมน์อื่นได้
                  </p>
                </div>

                {/* Filter Match Live Statistics */}
                {filterStats && (
                  <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>ตรงตามเงื่อนไข: {filterStats.matched.toLocaleString()} จาก {filterStats.total.toLocaleString()} รายการ</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                        {filterStats.pct}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-blue-200/70 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, filterStats.pct))}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Filter Logic: AND vs OR */}
                {(activeWidget.filterRules?.length || 0) > 1 && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        วิธีรวมเงื่อนไข (Filter Logic)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {activeWidget.filterLogic === 'or'
                          ? 'ผ่านข้อใดข้อหนึ่ง ก็นำมาคำนวณในกราฟ'
                          : 'ต้องผ่านครบทุกข้อ จึงจะนำมาคำนวณในกราฟ'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => onUpdateWidget({ ...activeWidget, filterLogic: 'and' })}
                        className={`px-2 py-1 rounded-md text-[10px] transition-all ${
                          activeWidget.filterLogic !== 'or'
                            ? 'bg-blue-600 text-white shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        AND (และ)
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateWidget({ ...activeWidget, filterLogic: 'or' })}
                        className={`px-2 py-1 rounded-md text-[10px] transition-all ${
                          activeWidget.filterLogic === 'or'
                            ? 'bg-blue-600 text-white shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        OR (หรือ)
                      </button>
                    </div>
                  </div>
                )}

                {/* Rules List */}
                <div className="space-y-2.5">
                  {(!activeWidget.filterRules || activeWidget.filterRules.length === 0) ? (
                    <div className="text-center py-6 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                      <Filter className="w-6 h-6 text-slate-400 mx-auto mb-2 opacity-60" />
                      <p className="text-xs font-semibold text-slate-700 mb-1">
                        ยังไม่มีเงื่อนไขตัวกรองสำหรับกราฟนี้
                      </p>
                      <p className="text-[11px] text-slate-500 mb-3">
                        กราฟกำลังแสดงข้อมูลทั้งหมดจากชีท คลิกปุ่มด้านล่างเพื่อเพิ่มเงื่อนไข
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddFilterRule()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มเงื่อนไขแรก</span>
                      </button>
                    </div>
                  ) : (
                    activeWidget.filterRules.map((rule, rIdx) => (
                      <div
                        key={rule.id}
                        className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs relative hover:border-blue-300 transition-all"
                      >
                        {/* Top: Index and Delete Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                              เงื่อนไขที่ {rIdx + 1}
                            </span>
                            {rIdx > 0 && (
                              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                                {activeWidget.filterLogic === 'or' ? 'หรือ (OR)' : 'และ (AND)'}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteFilterRule(rule.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors"
                            title="ลบเงื่อนไขนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Column to filter */}
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                            คอลัมน์ที่ต้องการตรวจสอบ
                          </label>
                          <select
                            value={rule.column}
                            onChange={(e) => handleUpdateFilterRule(rule.id, { column: e.target.value })}
                            className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                          >
                            {headers.map((h) => (
                              <option key={h} value={h}>
                                {h} {numericColumns.includes(h) ? '(123)' : dateColumns.includes(h) ? '(📅)' : '(ABC)'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Operator */}
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                            เงื่อนไขการเปรียบเทียบ (Operator)
                          </label>
                          <select
                            value={rule.operator}
                            onChange={(e) =>
                              handleUpdateFilterRule(rule.id, { operator: e.target.value as FilterOperatorType })
                            }
                            className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                          >
                            <option value="equals">เท่ากับ (= Exactly)</option>
                            <option value="not_equals">ไม่เท่ากับ (!= Not equal)</option>
                            <option value="contains">มีข้อความ (Contains)</option>
                            <option value="not_contains">ไม่มีข้อความ (Not contains)</option>
                            <option value="greater_than">มากกว่า (&gt; Greater than)</option>
                            <option value="less_than">น้อยกว่า (&lt; Less than)</option>
                            <option value="greater_than_or_equal">มากกว่าหรือเท่ากับ (&gt;=)</option>
                            <option value="less_than_or_equal">น้อยกว่าหรือเท่ากับ (&lt;=)</option>
                            <option value="is_empty">เป็นค่าว่าง (Is Empty/Blank)</option>
                            <option value="not_empty">ไม่เป็นค่าว่าง (Not Blank)</option>
                          </select>
                        </div>

                        {/* Target Value or Comparison Column */}
                        {rule.operator !== 'is_empty' && rule.operator !== 'not_empty' && (
                          <div className="space-y-1.5 pt-1.5 border-t border-slate-200/80">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-medium text-slate-500">
                                รูปแบบการเปรียบเทียบ
                              </label>
                              <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[9px] font-semibold">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateFilterRule(rule.id, { compareMode: 'value' })}
                                  className={`px-1.5 py-0.5 rounded-md transition-all ${
                                    rule.compareMode !== 'column'
                                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  ค่าคงที่
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateFilterRule(rule.id, { compareMode: 'column' })}
                                  className={`px-1.5 py-0.5 rounded-md transition-all ${
                                    rule.compareMode === 'column'
                                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  เทียบกับคอลัมน์อื่น
                                </button>
                              </div>
                            </div>

                            {rule.compareMode === 'column' ? (
                              <select
                                value={rule.compareColumn || ''}
                                onChange={(e) => handleUpdateFilterRule(rule.id, { compareColumn: e.target.value })}
                                className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                              >
                                <option value="">-- เลือกคอลัมน์ที่ต้องการนำมาเทียบ --</option>
                                {headers.map((h) => (
                                  <option key={h} value={h}>
                                    {h}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={rule.value ?? ''}
                                onChange={(e) => handleUpdateFilterRule(rule.id, { value: e.target.value })}
                                placeholder="พิมพ์ค่าที่ต้องการเปรียบเทียบ..."
                                className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:font-normal"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add Rule & Clear Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddFilterRule()}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มเงื่อนไขตัวกรองใหม่</span>
                  </button>

                  {(activeWidget.filterRules?.length || 0) > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllFilterRules}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-semibold transition-colors"
                      title="ล้างเงื่อนไขทั้งหมด"
                    >
                      ล้างทั้งหมด
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Sub-Section 3: Interactive All Sheet Columns Explorer */}
            {fieldsSubSection === 'columns' && (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fieldSearchQuery}
                    onChange={(e) => setFieldSearchQuery(e.target.value)}
                    placeholder="ค้นหาคอลัมน์ (เช่น MONTH, SHIPPER, SHIFT)..."
                    className="w-full text-xs font-medium pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                  />
                  {fieldSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFieldSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Column Type Filter Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                  {[
                    { key: 'all', label: `ทั้งหมด (${headers.length})` },
                    { key: 'numeric', label: `123 ตัวเลข (${numericColumns.length})` },
                    { key: 'categorical', label: `ABC ข้อความ (${categoricalColumns.length})` },
                    { key: 'date', label: `📅 วันที่ (${dateColumns.length})` },
                  ].map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setFieldTypeFilter(chip.key as any)}
                      className={`px-2 py-0.5 rounded-lg font-semibold border whitespace-nowrap transition-all ${
                        fieldTypeFilter === chip.key
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Column Items List */}
                <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                  {headers
                    .filter((col) => {
                      // Filter by search query
                      if (fieldSearchQuery.trim()) {
                        const q = fieldSearchQuery.toLowerCase();
                        if (!col.toLowerCase().includes(q)) return false;
                      }
                      // Filter by column type
                      if (fieldTypeFilter === 'numeric') return numericColumns.includes(col);
                      if (fieldTypeFilter === 'categorical') return categoricalColumns.includes(col);
                      if (fieldTypeFilter === 'date') return dateColumns.includes(col);
                      return true;
                    })
                    .map((col) => {
                      const isNum = numericColumns.includes(col);
                      const isDate = dateColumns.includes(col);
                      const isSelectedCategory = activeWidget?.categoryColumn === col;
                      const isSelectedValue = activeWidget?.valueColumn === col;
                      const hasFilterOnCol = activeWidget?.filterRules?.some((r) => r.column === col);

                      return (
                        <div
                          key={col}
                          className={`p-2 rounded-xl border transition-all ${
                            isSelectedCategory || isSelectedValue
                              ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`w-5 h-5 rounded-md text-[9px] font-mono flex items-center justify-center font-bold shrink-0 ${
                                  isNum
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isDate
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isNum ? '123' : isDate ? '📅' : 'ABC'}
                              </span>
                              <span className="text-xs font-semibold text-slate-800 truncate" title={col}>
                                {col}
                              </span>
                              {hasFilterOnCol && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" title="มีเงื่อนไขตัวกรองในคอลัมน์นี้" />
                              )}
                            </div>

                            {activeWidget && (
                              <div className="flex items-center gap-1 shrink-0">
                                {/* Set as Category (X) */}
                                {activeWidget.type !== 'kpi' && activeWidget.type !== 'table' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateWidget({ ...activeWidget, categoryColumn: col })}
                                    title="ตั้งเป็นแกนจัดกลุ่ม (Category / X-Axis)"
                                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md border transition-all ${
                                      isSelectedCategory
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {isSelectedCategory ? '✓ แกน X' : 'กลุ่ม (X)'}
                                  </button>
                                )}

                                {/* Set as Value (Y) */}
                                {activeWidget.type !== 'table' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateWidget({ ...activeWidget, valueColumn: col })}
                                    title="ตั้งเป็นค่าตัวเลขตัวชี้วัด (Value / Metric)"
                                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md border transition-all ${
                                      isSelectedValue
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {isSelectedValue ? '✓ ค่า Y' : 'ค่า (Y)'}
                                  </button>
                                )}

                                {/* Quick Add Filter button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAddFilterRule(col);
                                    setFieldsSubSection('filter');
                                  }}
                                  title="เพิ่มเงื่อนไขตัวกรองสำหรับคอลัมน์นี้"
                                  className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md border bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                                >
                                  + กรอง
                                </button>
                              </div>
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

        {/* ======================= TAB 4: REAL-TIME & BIG DATA ======================= */}
        {activeTab === 'realtime' && (
          <div className="space-y-4">
            {/* Real-time Google Sheets Live Polling Sync */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-2xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      ลิงก์สด Google Sheets (Live Sync)
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      ดึงข้อมูลอัปเดตอัตโนมัติตามช่วงเวลา
                    </p>
                  </div>
                </div>

                {liveSyncInterval > 0 ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    สด {liveSyncInterval}s
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600">
                    ปิดอยู่
                  </span>
                )}
              </div>

              {/* Interval Selection */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1.5">
                  ความถี่ในการดึงข้อมูลอัตโนมัติ (Refresh Interval)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { seconds: 0, label: 'ปิด (Manual)' },
                    { seconds: 15, label: 'ทุก 15 วินาที' },
                    { seconds: 30, label: 'ทุก 30 วินาที' },
                    { seconds: 60, label: 'ทุก 1 นาที' },
                    { seconds: 300, label: 'ทุก 5 นาที' },
                  ].map((opt) => (
                    <button
                      key={opt.seconds}
                      type="button"
                      onClick={() => onSetLiveSyncInterval(opt.seconds)}
                      className={`py-1.5 px-1 text-[11px] font-semibold rounded-xl border text-center transition-all ${
                        liveSyncInterval === opt.seconds
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sync Status & Trigger Button */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>
                    {lastSyncedAt
                      ? `อัปเดตล่าสุด: ${lastSyncedAt.toLocaleTimeString('th-TH')}`
                      : 'ยังไม่มีการซิงค์ล่าสุด'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ทันที'}</span>
                </button>
              </div>
            </div>

            {/* Big Data & High-Row Processing Engine Support */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    รองรับข้อมูลขนาดใหญ่ (High Row Engine)
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    ประมวลผลในหน่วยความจำความเร็วสูง
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>จำนวนแถวในชีทขณะนี้:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {totalRecordsCount.toLocaleString('th-TH')} แถว
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>จำนวนคอลัมน์:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {headers.length} คอลัมน์
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ความเร็วประมวลผลเฉลี่ย:</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    ~5-15 มิลลิวินาที
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl text-amber-900">
                💡 <strong>ประสิทธิภาพสูง:</strong> ระบบใช้ Single-Pass Streaming
                Aggregation ในเบราว์เซอร์ รองรับข้อมูลตั้งแต่หลักร้อยจนถึงหลักหมื่นแถว
                โดยไม่ทำให้หน้าเว็บกระตุก
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Status */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <span>วิดเจ็ตทั้งหมด: {widgets.length} รายการ</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <span>เสร็จสิ้น</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
