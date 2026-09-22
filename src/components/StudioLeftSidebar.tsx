import React, { useState } from 'react';
import {
  WidgetConfig,
  WidgetType,
  AggregationType,
  DashboardItem,
  SiteStatusConfig,
  UserRole,
  UserProfile,
  SheetConfig,
  SpreadsheetMetadata,
  RecentSheet,
} from '../types';
import { SheetConnector } from './SheetConnector';
import {
  Plus,
  Save,
  Trash2,
  Copy,
  Scissors,
  ClipboardPaste,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Star,
  Layers,
  Database,
  Users,
  Shield,
  Power,
  ChevronDown,
  FolderOpen,
  LayoutDashboard,
  Check,
  RefreshCw,
  Sliders,
  Sparkles,
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  Table as TableIcon,
  Hash,
  Type,
  Activity,
  Compass,
  CircleDot,
  FileText,
  Calendar,
  MapPin,
  HelpCircle,
  Clock,
  Gauge,
  Columns,
  Grid,
  ListFilter,
  Image as ImageIcon,
  ExternalLink,
  MessageSquare,
  BarChart3,
  Calculator,
  Share2,
  Bell,
  HardDrive,
  Globe,
  Building2,
} from 'lucide-react';

interface StudioLeftSidebarProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  // Dashboard Management
  dashboards: DashboardItem[];
  activeDashboardId: string | null;
  onSelectDashboard: (id: string) => void;
  onRequestNewDashboard: () => void;
  onSaveCurrentDashboard: () => void;
  onDeleteDashboard: (id: string) => void;
  // Visuals & Widgets
  widgets: WidgetConfig[];
  activeWidgetId: string | null;
  onSelectWidget: (id: string) => void;
  onUpdateWidget: (updated: WidgetConfig) => void;
  onAddWidgetWithType: (type: WidgetType, customProps?: Partial<WidgetConfig>) => void;
  onDeleteWidget: (id: string) => void;
  onDuplicateWidget: (id: string) => void;
  onOpenDataGrid: () => void;
  // Sheets & Data
  sheetTitle: string;
  sheetTabs: string[];
  currentSelectedTab: string;
  onSelectSheetTab: (tabName: string) => void;
  headerRow: number;
  dataStartRow: number;
  onOpenRowConfigModal: () => void;
  headers: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  totalRecordsCount: number;
  // Admin & User Role
  user: UserProfile | null;
  userRole: UserRole;
  onToggleUserRole: (role: UserRole) => void;
  siteStatus: SiteStatusConfig;
  onOpenAdminModal: () => void;
  onOpenBIPanel?: () => void;
  // Full Sheet Connector Props for Sidebar
  sheetConfig?: SheetConfig;
  metadata?: SpreadsheetMetadata | null;
  recentSheets?: RecentSheet[];
  isLoadingSheet?: boolean;
  onConnectUrl?: (url: string) => void;
  onAddCustomTab?: (tabName: string) => void;
  onOpenPreviewModal?: () => void;
  onRefreshSheetData?: () => void;
  onSelectRecentSheet?: (recent: RecentSheet) => void;
  onUploadFile?: (file: File) => void;
  onLoadSample?: (sampleId: string) => void;
  onUpdateRowConfig?: (headerRow: number, startRow: number) => void;
  onOpenLoginHelp?: () => void;
  activeStudioTab?: 'visuals' | 'data' | 'dashboards';
  onSelectStudioTab?: (tab: 'visuals' | 'data' | 'dashboards') => void;
  onOpenFormulaBuilder?: () => void;
  onOpenMarketplace?: () => void;
  onOpenShareModal?: () => void;
  onOpenNotificationCenter?: () => void;
  onOpenBackupRestore?: () => void;
  onOpenWhiteLabel?: () => void;
  whiteLabel?: import('../types').WhiteLabelConfig;
}

export const StudioLeftSidebar: React.FC<StudioLeftSidebarProps> = ({
  isOpen,
  onToggleOpen,
  dashboards,
  activeDashboardId,
  onSelectDashboard,
  onRequestNewDashboard,
  onSaveCurrentDashboard,
  onDeleteDashboard,
  widgets,
  activeWidgetId,
  onSelectWidget,
  onUpdateWidget,
  onAddWidgetWithType,
  onDeleteWidget,
  onDuplicateWidget,
  onOpenDataGrid,
  sheetTitle,
  sheetTabs,
  currentSelectedTab,
  onSelectSheetTab,
  headerRow,
  dataStartRow,
  onOpenRowConfigModal,
  headers,
  numericColumns,
  categoricalColumns,
  dateColumns,
  totalRecordsCount,
  user,
  userRole,
  onToggleUserRole,
  siteStatus,
  onOpenAdminModal,
  onOpenBIPanel,
  sheetConfig,
  metadata,
  recentSheets = [],
  isLoadingSheet = false,
  onConnectUrl,
  onAddCustomTab,
  onOpenPreviewModal,
  onRefreshSheetData,
  onSelectRecentSheet,
  onUploadFile,
  onLoadSample,
  onUpdateRowConfig,
  onOpenLoginHelp,
  activeStudioTab: propActiveTab,
  onSelectStudioTab,
  onOpenFormulaBuilder,
  onOpenMarketplace,
  onOpenShareModal,
  onOpenNotificationCenter,
  onOpenBackupRestore,
  onOpenWhiteLabel,
  whiteLabel,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'visuals' | 'data' | 'dashboards'>('visuals');
  const activeStudioTab = propActiveTab !== undefined ? propActiveTab : internalActiveTab;
  const setActiveStudioTab = (tab: 'visuals' | 'data' | 'dashboards') => {
    setInternalActiveTab(tab);
    if (onSelectStudioTab) onSelectStudioTab(tab);
  };
  const [clipboardWidget, setClipboardWidget] = useState<WidgetConfig | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<WidgetConfig[]>([]);

  const activeWidget = widgets.find((w) => w.id === activeWidgetId) || null;

  // Visual type definitions matching Image 5
  const visualTypesList: {
    type: WidgetType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    defaultWidth: 'full' | 'half' | 'third';
    defaultColSpan: number;
  }[] = [
    { type: 'kpi', label: '# ตัวเลข KPI', icon: Hash, defaultWidth: 'third', defaultColSpan: 3 },
    { type: 'bar', label: '📊 กราฟแท่ง', icon: BarChart2, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'column', label: '📊 กราฟคอลัมน์', icon: Columns, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'horizontal_bar', label: '🗂️ กราฟแท่งแนวนอน', icon: BarChart3, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'line', label: '📈 กราฟเส้น', icon: TrendingUp, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'area', label: '📉 กราฟพื้นที่', icon: Layers, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'pie', label: '🕒 กราฟวงกลม', icon: PieIcon, defaultWidth: 'third', defaultColSpan: 4 },
    { type: 'donut', label: '⭕ กราฟโดนัท', icon: CircleDot, defaultWidth: 'third', defaultColSpan: 4 },
    { type: 'combo', label: '📉 กราฟผสม', icon: Activity, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'radar', label: '❇️ กราฟเรดาร์', icon: Compass, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'gauge', label: '⏱️ มาตรวัด', icon: Gauge, defaultWidth: 'third', defaultColSpan: 4 },
    { type: 'scatter', label: '⠶ กราฟจุดกระจาย', icon: CircleDot, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'funnel', label: '🔻 กราฟกรวย Funnel', icon: ListFilter, defaultWidth: 'third', defaultColSpan: 4 },
    { type: 'waterfall', label: '📊 กราฟ Waterfall', icon: BarChart2, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'heatmap', label: '🟩 Heatmap', icon: Grid, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'treemap', label: '🧱 Treemap', icon: Grid, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'table', label: '📋 ตารางข้อมูล', icon: TableIcon, defaultWidth: 'full', defaultColSpan: 12 },
    { type: 'pivot', label: '📊 ตารางสรุป Pivot', icon: TableIcon, defaultWidth: 'full', defaultColSpan: 12 },
    { type: 'list', label: '📑 รายการข้อมูล', icon: FileText, defaultWidth: 'third', defaultColSpan: 4 },
    { type: 'timeline', label: '⏱️ Timeline', icon: Clock, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'map', label: '📍 Map เชิงข้อมูล', icon: MapPin, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'calendar', label: '📅 Calendar', icon: Calendar, defaultWidth: 'third', defaultColSpan: 4 },
    { type: 'progress', label: '🎚️ Progress Bar', icon: Activity, defaultWidth: 'third', defaultColSpan: 4 },
    { type: 'ai_summary', label: '✨ AI Summary', icon: Sparkles, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'text', label: '🔤 กล่องข้อความ', icon: Type, defaultWidth: 'full', defaultColSpan: 12 },
    { type: 'rich_text', label: '📝 Rich Text', icon: FileText, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'floating_text', label: '💬 ข้อความลอย', icon: MessageSquare, defaultWidth: 'third', defaultColSpan: 3 },
    { type: 'image', label: '🖼️ รูปภาพ', icon: ImageIcon, defaultWidth: 'third', defaultColSpan: 4 },
    { type: 'iframe', label: '↗️ Iframe', icon: ExternalLink, defaultWidth: 'half', defaultColSpan: 6 },
    { type: 'embed', label: '🌐 Embed Website', icon: ExternalLink, defaultWidth: 'half', defaultColSpan: 6 },
  ];

  const handleCopyWidget = () => {
    if (activeWidget) {
      setClipboardWidget({ ...activeWidget });
    }
  };

  const handleCutWidget = () => {
    if (activeWidget) {
      setClipboardWidget({ ...activeWidget });
      onDeleteWidget(activeWidget.id);
    }
  };

  const handlePasteWidget = () => {
    if (clipboardWidget) {
      onAddWidgetWithType(clipboardWidget.type, {
        ...clipboardWidget,
        id: `widget_${Date.now()}`,
        title: `${clipboardWidget.title} (วาง)`,
      });
    }
  };

  const handleSaveAsTemplate = () => {
    if (activeWidget) {
      setSavedTemplates((prev) => [...prev, { ...activeWidget }]);
    }
  };

  const currentDashboard = dashboards.find((d) => d.id === activeDashboardId);

  return (
    <aside
      className={`${
        isOpen ? 'w-80 sm:w-88 md:w-96' : 'w-0'
      } shrink-0 border-r border-slate-200 bg-white flex flex-col h-[calc(100vh-76px)] sticky top-[76px] z-30 transition-all duration-200 overflow-hidden shadow-xs`}
    >
      {/* Top Banner / New Dashboard Button (Image 6) */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/90 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Button: + แดชบอร์ดใหม่ (Mint green matching Image 6) */}
          <button
            type="button"
            onClick={onRequestNewDashboard}
            className="flex-1 py-2 px-3.5 bg-emerald-300 hover:bg-emerald-400 text-emerald-950 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
            title="สร้างแดชบอร์ดใหม่ โดยเลือกว่าจะบันทึกของเดิมหรือไม่"
          >
            <Plus className="w-4 h-4 text-emerald-900" />
            <span>+ แดชบอร์ดใหม่</span>
          </button>

          <button
            type="button"
            onClick={onSaveCurrentDashboard}
            className="p-2 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
            title="บันทึกแดชบอร์ดปัจจุบัน"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">บันทึก</span>
          </button>
        </div>

        {/* Dashboard Selector Dropdown */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
          <LayoutDashboard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={activeDashboardId || ''}
            onChange={(e) => onSelectDashboard(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-transparent border-none focus:outline-none truncate cursor-pointer"
          >
            {dashboards.length === 0 ? (
              <option value="">แดชบอร์ดหลัก (ยังไม่ได้บันทึก)</option>
            ) : (
              dashboards.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.isPublic ? '(สาธารณะ)' : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Pro BI Tools Action Bar: Formula Builder, Template Marketplace, Share */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          {onOpenFormulaBuilder && (
            <button
              type="button"
              onClick={onOpenFormulaBuilder}
              title="สร้างฟิลด์คำนวณ เช่น Profit = Revenue - Cost"
              className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span>สูตรคำนวณ</span>
            </button>
          )}
          {onOpenMarketplace && (
            <button
              type="button"
              onClick={onOpenMarketplace}
              title="คลังเทมเพลต 8 ธีม BI สำเร็จรูป"
              className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>เทมเพลต</span>
            </button>
          )}
          {onOpenShareModal && (
            <button
              type="button"
              onClick={onOpenShareModal}
              title="แชร์ลิงก์ให้ผู้ใช้งาน / แยกหน้าบ้าน-หลังบ้าน"
              className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>แชร์ลิงก์</span>
            </button>
          )}
        </div>

        {/* Offline Storage Status Badge */}
        <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-2.5 py-1 text-emerald-800 font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <HardDrive className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">บันทึกข้อมูลในเครื่อง (Offline)</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-200/60 rounded text-emerald-900 shrink-0">
            Local Storage
          </span>
        </div>
      </div>

      {/* Tabs Header inside Left Sidebar */}
      <div className="flex border-b border-slate-200 bg-white shrink-0 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveStudioTab('visuals')}
          className={`flex-1 py-2.5 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStudioTab === 'visuals'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>วิชวล & กราฟ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStudioTab('data')}
          className={`flex-1 py-2.5 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStudioTab === 'data'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>ชีท & ข้อมูล</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStudioTab('dashboards')}
          className={`flex-1 py-2.5 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeStudioTab === 'dashboards'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          title="จัดการแดชบอร์ดที่บันทึกไว้ในเครื่อง"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>แดชบอร์ด</span>
          {dashboards.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full font-semibold">
              {dashboards.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* =========================================
            TAB 1: VISUALS & TOOLBOX (Image 5)
           ========================================= */}
        {activeStudioTab === 'visuals' && (
          <div className="space-y-4">
            {/* Quick Open Right BI Panel */}
            {onOpenBIPanel && (
              <button
                type="button"
                onClick={onOpenBIPanel}
                className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-between gap-2 transition-all cursor-pointer group"
                title="เปิดแผงตั้งค่าและปรับแต่งเครื่องมือ BI ละเอียดทางฝั่งขวา"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sliders className="w-4 h-4 text-blue-200 group-hover:rotate-45 transition-transform" />
                  <span className="truncate">แผงเครื่องมือ BI (ฝั่งขวา)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded font-semibold shrink-0">
                  เปิดแผง
                </span>
              </button>
            )}

            {/* Widget Action Bar (Image 5) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between gap-1 text-slate-600 shadow-2xs">
              <button
                type="button"
                onClick={handleCopyWidget}
                disabled={!activeWidget}
                className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-[10px] font-semibold flex flex-col items-center gap-0.5 transition-colors disabled:opacity-40"
                title="ทำสำเนาวิชวลที่เลือก"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>ทำสำเนา</span>
              </button>

              <button
                type="button"
                onClick={handleCutWidget}
                disabled={!activeWidget}
                className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-[10px] font-semibold flex flex-col items-center gap-0.5 transition-colors disabled:opacity-40"
                title="ตัดวิชวล"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>ตัดลอก</span>
              </button>

              <button
                type="button"
                onClick={handlePasteWidget}
                disabled={!clipboardWidget}
                className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-[10px] font-semibold flex flex-col items-center gap-0.5 transition-colors disabled:opacity-40"
                title="วางวิชวล"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>วาง</span>
              </button>

              <div className="h-6 w-px bg-slate-200" />

              <button
                type="button"
                onClick={() => {
                  if (activeWidget) {
                    onUpdateWidget({ ...activeWidget, isLocked: !activeWidget.isLocked });
                  }
                }}
                disabled={!activeWidget}
                className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-[10px] font-semibold flex flex-col items-center gap-0.5 transition-colors disabled:opacity-40"
                title="ล็อกวิชวล"
              >
                {activeWidget?.isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
                <span>ล็อก</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeWidget) {
                    onDeleteWidget(activeWidget.id);
                  }
                }}
                disabled={!activeWidget}
                className="p-1.5 hover:bg-white hover:text-rose-600 rounded-lg text-[10px] font-semibold flex flex-col items-center gap-0.5 transition-colors disabled:opacity-40 text-rose-500"
                title="ลบวิชวล"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบ</span>
              </button>
            </div>

            {/* WIDGET TEMPLATE (Image 5) */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 tracking-wider">
                WIDGET TEMPLATE
              </div>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={!activeWidget}
                className="w-full py-1.5 px-3 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>☆ บันทึกวิชวลนี้เป็นเทมเพลต</span>
              </button>
              {savedTemplates.length === 0 ? (
                <div className="text-[11px] text-slate-400 text-center py-1">
                  ยังไม่มีเทมเพลตวิชวลที่บันทึกไว้
                </div>
              ) : (
                <div className="space-y-1">
                  {savedTemplates.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        onAddWidgetWithType(t.type, {
                          ...t,
                          id: `widget_${Date.now()}`,
                          title: `${t.title} (จากเทมเพลต)`,
                        })
                      }
                      className="w-full text-left px-2 py-1 bg-white border border-slate-100 rounded text-xs text-slate-700 hover:border-blue-300 truncate"
                    >
                      {t.title} ({t.type})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* เปลี่ยนชนิดวิชวล (Image 5: 30 Visual Type Buttons) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">เปลี่ยนชนิดวิชวล</span>
                <span className="text-[10px] text-slate-400">คลิกเพื่อเพิ่มหรือสลับกราฟ</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {visualTypesList.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = activeWidget?.type === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        if (activeWidget) {
                          onUpdateWidget({
                            ...activeWidget,
                            type: item.type,
                            width: item.defaultWidth,
                            colSpan: item.defaultColSpan,
                          });
                        } else {
                          onAddWidgetWithType(item.type, {
                            title: item.label.replace(/^[^\s]+\s+/, ''),
                            width: item.defaultWidth,
                            colSpan: item.defaultColSpan,
                            categoryColumn: categoricalColumns[0] || headers[0],
                            valueColumn: numericColumns[0] || headers[1],
                            aggregation: 'sum',
                          });
                        }
                      }}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs font-bold'
                          : 'bg-white border-slate-200/90 hover:border-blue-300 hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] leading-tight truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Widget Quick Customizer */}
            {activeWidget && (
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    ปรับแต่ง: {activeWidget.title}
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold uppercase">
                    {activeWidget.type}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">ชื่อหัวเรื่อง</label>
                    <input
                      type="text"
                      value={activeWidget.title}
                      onChange={(e) => onUpdateWidget({ ...activeWidget, title: e.target.value })}
                      className="w-full mt-1 px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {activeWidget.type !== 'text' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">คอลัมน์หมวดหมู่</label>
                        <select
                          value={activeWidget.categoryColumn || ''}
                          onChange={(e) =>
                            onUpdateWidget({ ...activeWidget, categoryColumn: e.target.value })
                          }
                          className="w-full mt-1 px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">คอลัมน์ตัวเลข</label>
                        <select
                          value={activeWidget.valueColumn || ''}
                          onChange={(e) =>
                            onUpdateWidget({ ...activeWidget, valueColumn: e.target.value })
                          }
                          className="w-full mt-1 px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            TAB 2: DATA & SHEETS (Embedded SheetConnector)
           ========================================= */}
        {activeStudioTab === 'data' && (
          <div className="space-y-4">
            {sheetConfig ? (
              <SheetConnector
                sheetConfig={sheetConfig}
                metadata={metadata || null}
                recentSheets={recentSheets}
                isLoading={isLoadingSheet}
                onConnectUrl={onConnectUrl || (() => {})}
                onSelectTab={onSelectSheetTab}
                onAddCustomTab={onAddCustomTab}
                onOpenPreviewModal={onOpenRowConfigModal || onOpenPreviewModal || (() => {})}
                onOpenDataGrid={onOpenDataGrid}
                onRefreshData={onRefreshSheetData || (() => {})}
                onSelectRecent={onSelectRecentSheet || (() => {})}
                onUploadFile={onUploadFile || (() => {})}
                onLoadSample={onLoadSample || (() => {})}
                onUpdateRowConfig={onUpdateRowConfig || (() => {})}
                onOpenLoginHelp={onOpenLoginHelp}
                inSidebar={true}
              />
            ) : (
              <>
                {/* Sheet Tabs List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">แท็บชีทในเอกสาร (Sheet Tabs)</span>
                    <span className="text-[10px] text-slate-500">{sheetTabs.length} แท็บ</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {sheetTabs.map((tab) => {
                      const isSelected = tab === currentSelectedTab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => onSelectSheetTab(tab)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {tab}
                          {isSelected && totalRecordsCount > 0 && (
                            <span className="ml-1 text-[10px] opacity-80">
                              ({totalRecordsCount.toLocaleString('th-TH')})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row Settings: หัวตารางแถวที่ / เริ่มข้อมูลแถวที่ */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-slate-800">
                    การอ่านข้อมูลแถว (Row Settings)
                  </div>
                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span>หัวตารางแถวที่: <strong className="text-slate-900">{headerRow}</strong></span>
                    <span>เริ่มข้อมูลแถวที่: <strong className="text-slate-900">{dataStartRow}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onOpenRowConfigModal}
                      className="flex-1 py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-500" />
                      <span>ปรับแต่งแถว</span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenDataGrid}
                      className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold text-white shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>แก้ไขฐานข้อมูล</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Data Columns Summary */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  คอลัมน์ในชีท ({headers.length} คอลัมน์)
                </span>
                {totalRecordsCount > 0 && (
                  <span className="text-[10px] text-slate-500">
                    {totalRecordsCount.toLocaleString('th-TH')} แถว
                  </span>
                )}
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-52 overflow-y-auto divide-y divide-slate-100">
                {headers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    ยังไม่มีข้อมูลคอลัมน์
                  </div>
                ) : (
                  headers.map((h, i) => (
                    <div key={i} className="px-3 py-1.5 text-xs text-slate-700 flex items-center justify-between hover:bg-slate-50">
                      <span className="truncate max-w-[200px]">{h}</span>
                      <span className="text-[10px] text-slate-400 font-mono">#{i + 1}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 3: DASHBOARDS & OFFLINE STORAGE
           ========================================= */}
        {activeStudioTab === 'dashboards' && (
          <div className="space-y-4">
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onRequestNewDashboard}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ แดชบอร์ดใหม่</span>
              </button>

              <button
                type="button"
                onClick={onSaveCurrentDashboard}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกปัจจุบัน</span>
              </button>
            </div>

            {/* Offline Local Storage Explainer Card */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <HardDrive className="w-4 h-4 text-emerald-600" />
                <span>การบันทึกในเครื่อง (Local Storage)</span>
              </div>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                ข้อมูลแดชบอร์ด วิดเจ็ต และชีทจะถูกจดจำและบันทึกลงในเบราว์เซอร์เครื่องนี้โดยอัตโนมัติ ใช้งานออฟไลน์ได้ 100% โดยไม่ต้องล็อกอิน
              </p>
            </div>

            {/* Dashboards List Management */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>แดชบอร์ดที่บันทึกไว้</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold">
                  {dashboards.length} รายการ
                </span>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                {dashboards.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                    <LayoutDashboard className="w-6 h-6 mx-auto text-slate-300" />
                    <p>ยังไม่มีแดชบอร์ดที่บันทึก</p>
                    <p className="text-[10px] text-slate-400">กดปุ่ม "+ แดชบอร์ดใหม่" เพื่อเริ่มต้น</p>
                  </div>
                ) : (
                  dashboards.map((d) => {
                    const isActive = d.id === activeDashboardId;
                    return (
                      <div
                        key={d.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isActive
                            ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectDashboard(d.id)}
                          className="flex-1 text-left min-w-0 cursor-pointer"
                        >
                          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                            {isActive && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            <span className="truncate">{d.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {d.widgets?.length || 0} วิดเจ็ต • {d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('th-TH') : 'บันทึกแล้ว'}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteDashboard(d.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="ลบแดชบอร์ดนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Offline Backup & Restore Section */}
            {onOpenBackupRestore && (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-600" />
                  <span>สำรอง / กู้คืนไฟล์แดชบอร์ด</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenBackupRestore}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <HardDrive className="w-3.5 h-3.5 text-slate-600" />
                  <span>จัดการไฟล์สำรอง (.json)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
