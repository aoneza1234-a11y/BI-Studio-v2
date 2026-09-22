import React, { useState, useMemo, useEffect } from 'react';
import {
  WidgetConfig,
  ProcessedSheetData,
  WhiteLabelConfig,
  DashboardTheme,
  GridGapType,
  LayoutMode,
  FilterState,
  DatePresetType,
} from '../types';
import { WidgetCard } from './WidgetCard';
import {
  BarChart3,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  Lock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ViewerPortalProps {
  dashboardTitle: string;
  processedData: ProcessedSheetData;
  widgets: WidgetConfig[];
  whiteLabel: WhiteLabelConfig;
  dashboardTheme?: DashboardTheme;
  gridGap?: GridGapType;
  layoutMode?: LayoutMode;
  isPasswordProtected?: boolean;
  viewerPassword?: string;
  onRefreshData?: () => void;
  filters: FilterState;
  onUpdateFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
  // Available other public dashboards if any
  availableDashboards?: { id: string; name: string }[];
  currentDashboardId?: string;
  onSelectDashboard?: (id: string) => void;
}

export const ViewerPortal: React.FC<ViewerPortalProps> = ({
  dashboardTitle,
  processedData,
  widgets,
  whiteLabel,
  dashboardTheme = 'light',
  gridGap = 'normal',
  layoutMode = 'grid',
  isPasswordProtected = false,
  viewerPassword = '',
  onRefreshData,
  filters,
  onUpdateFilters,
  onResetFilters,
  availableDashboards = [],
  currentDashboardId,
  onSelectDashboard,
}) => {
  // Authentication state for password protected dashboards
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (!isPasswordProtected) return true;
    const sessionKey = `viewer_auth_${dashboardTitle}`;
    return sessionStorage.getItem(sessionKey) === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Viewer UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');
  const [selectedDatePreset, setSelectedDatePreset] = useState<DatePresetType>(filters.datePreset || 'all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync title with White Label
  useEffect(() => {
    document.title = `${dashboardTitle} | ${whiteLabel.companyName}`;
  }, [dashboardTitle, whiteLabel.companyName]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewerPassword || passwordInput === viewerPassword) {
      setIsAuthenticated(true);
      setPasswordError(false);
      sessionStorage.setItem(`viewer_auth_${dashboardTitle}`, 'true');
    } else {
      setPasswordError(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshData?.();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = processedData.records || [];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(q))
      );
    }

    // Category filters
    if (filters.categoryFilters) {
      Object.entries(filters.categoryFilters).forEach(([col, filterVal]) => {
        if (filterVal) {
          result = result.filter((row) => String(row[col] ?? '') === filterVal);
        }
      });
    }

    return result;
  }, [processedData.records, searchQuery, filters.categoryFilters]);

  // If password protected and not authenticated, render dedicated White Label Login Screen
  if (isPasswordProtected && !isAuthenticated) {
    const isDark = whiteLabel.loginTheme === 'luxury_dark' || whiteLabel.loginTheme === 'enterprise_slate';
    return (
      <div
        className={`min-h-screen w-full flex items-center justify-center p-4 transition-all ${
          isDark
            ? 'bg-slate-950 text-slate-100'
            : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 text-slate-800'
        }`}
      >
        <div
          className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border text-center space-y-6 transition-all ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {/* Brand Logo & Name */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg"
              style={{ backgroundColor: whiteLabel.primaryColor || '#2563eb' }}
            >
              {whiteLabel.companyLogoUrl ? (
                <img
                  src={whiteLabel.companyLogoUrl}
                  alt={whiteLabel.companyName}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <span>{whiteLabel.companyName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                {whiteLabel.companyName}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {whiteLabel.domain || 'Enterprise Analytics Portal'}
              </p>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-1">
            <h2 className="text-base font-bold">
              {whiteLabel.loginWelcomeTitle || 'ระบบรักษาความปลอดภัยแดชบอร์ด'}
            </h2>
            <p className="text-xs text-slate-500">
              {whiteLabel.loginWelcomeSubtitle ||
                'กรุณากรอกรหัสผ่านเพื่อเข้าชมรายงานและข้อมูลสรุปผลการวิเคราะห์'}
            </p>
          </div>

          {/* Password Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="กรอกรหัสผ่าน (Viewer Password)..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                className={`w-full text-center px-4 py-3 text-sm tracking-widest rounded-xl border focus:outline-none transition-all font-mono ${
                  passwordError
                    ? 'border-rose-500 bg-rose-50/20 text-rose-600'
                    : isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white'
                }`}
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-rose-500 font-semibold mt-2">
                  รหัสผ่านไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ {whiteLabel.companyName}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{ backgroundColor: whiteLabel.primaryColor || '#2563eb' }}
            >
              <Lock className="w-4 h-4" />
              <span>เข้าชมแดชบอร์ด</span>
            </button>
          </form>

          {/* Footer Copyright */}
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            {whiteLabel.footerCredit || `© 2026 ${whiteLabel.companyName}. All rights reserved.`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50/70 flex flex-col antialiased">
      {/* Top Portal Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 h-16 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Toggle Sidebar Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title={isSidebarOpen ? 'ย่อแถบเมนูด้านซ้าย' : 'ขยายแถบเมนูด้านซ้าย'}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-2xs shrink-0"
              style={{ backgroundColor: whiteLabel.primaryColor || '#2563eb' }}
            >
              {whiteLabel.companyLogoUrl ? (
                <img
                  src={whiteLabel.companyLogoUrl}
                  alt={whiteLabel.companyName}
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <span>{whiteLabel.companyName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  {whiteLabel.companyName}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hidden sm:inline-block">
                  Live Portal
                </span>
              </div>
              <h1 className="text-sm font-extrabold text-slate-800 truncate max-w-xs sm:max-w-md">
                {dashboardTitle}
              </h1>
            </div>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Active Filter Badge */}
          {(searchQuery || Object.values(filters.categoryFilters || {}).some(Boolean)) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onResetFilters();
              }}
              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
              title="ล้างตัวกรองทั้งหมด"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Print Report */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all hidden sm:flex"
            title="พิมพ์หรือบันทึกรายงานเป็น PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Fullscreen Mode */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            title="โหมดเต็มจอ (Presentation Mode)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Workspace with Dedicated Viewer Left Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* =========================================
            DEDICATED VIEWER LEFT SIDEBAR
           ========================================= */}
        {isSidebarOpen && (
          <aside className="w-72 sm:w-80 bg-white border-r border-slate-200/80 flex flex-col shrink-0 overflow-y-auto p-4 space-y-5 transition-all">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onUpdateFilters({ ...filters, searchQuery: e.target.value });
                }}
                placeholder="ค้นหาข้อมูลในแดชบอร์ด..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    onUpdateFilters({ ...filters, searchQuery: '' });
                  }}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dashboards List (if multiple public dashboards) */}
            {availableDashboards.length > 1 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  แดชบอร์ดที่เปิดให้เข้าชม
                </div>
                <div className="space-y-1">
                  {availableDashboards.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => onSelectDashboard?.(d.id)}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-all ${
                        d.id === currentDashboardId
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate">{d.name}</span>
                      {d.id === currentDashboardId && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date Filter Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  ช่วงเวลา (Date Preset)
                </span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'this_month', label: 'เดือนนี้' },
                  { id: 'last_month', label: 'เดือนที่แล้ว' },
                  { id: 'this_year', label: 'ปีนี้' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedDatePreset(preset.id as DatePresetType);
                      onUpdateFilters({ ...filters, datePreset: preset.id as DatePresetType });
                    }}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                      selectedDatePreset === preset.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Slicers */}
            {processedData.categoricalColumns.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    ตัวกรองหมวดหมู่ (Category Slicers)
                  </span>
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="space-y-2">
                  {processedData.categoricalColumns.slice(0, 4).map((col) => {
                    const uniqueVals = Array.from(
                      new Set(
                        (processedData.records || [])
                          .map((r) => String(r[col] ?? '').trim())
                          .filter(Boolean)
                      )
                    ).slice(0, 20);

                    const currentVal = filters.categoryFilters?.[col] || '';

                    return (
                      <div key={col} className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 truncate block">
                          {col}
                        </label>
                        <select
                          value={currentVal}
                          onChange={(e) => {
                            const newCategoryFilters = {
                              ...filters.categoryFilters,
                              [col]: e.target.value,
                            };
                            if (!e.target.value) {
                              delete newCategoryFilters[col];
                            }
                            onUpdateFilters({
                              ...filters,
                              categoryFilters: newCategoryFilters,
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                        >
                          <option value="">ทั้งหมด ({col})</option>
                          {uniqueVals.map((val) => (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Data Stats Card */}
            <div className="mt-auto p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="text-[11px] font-bold text-slate-700">สถิติข้อมูลที่แสดงผล</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block">แถวที่แสดง</span>
                  <strong className="text-slate-900 font-mono">
                    {filteredRecords.length.toLocaleString('th-TH')}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">วิดเจ็ตทั้งหมด</span>
                  <strong className="text-slate-900 font-mono">{widgets.length} การ์ด</strong>
                </div>
              </div>
            </div>

            {/* White Label Footer Info */}
            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              <div>{whiteLabel.footerCredit || `© 2026 ${whiteLabel.companyName}`}</div>
              <div className="mt-0.5 text-slate-300">Enterprise Dedicated Portal</div>
            </div>
          </aside>
        )}

        {/* =========================================
            MAIN DASHBOARD DISPLAY CANVAS
           ========================================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {widgets.length === 0 ? (
            <div className="p-16 text-center max-w-md mx-auto space-y-3 bg-white rounded-3xl border border-dashed border-slate-300 shadow-2xs">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">
                ยังไม่มีการ์ดรายงานในแดชบอร์ดนี้
              </h3>
              <p className="text-xs text-slate-400">
                ผู้ดูแลระบบ {whiteLabel.companyName} กำลังจัดเตรียมข้อมูล กรุณากลับมาใหม่อีกครั้ง
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                gridGap === 'none'
                  ? 'gap-0'
                  : gridGap === 'tight'
                  ? 'gap-2 sm:gap-3'
                  : gridGap === 'relaxed'
                  ? 'gap-5 sm:gap-6'
                  : gridGap === 'loose'
                  ? 'gap-6 sm:gap-8'
                  : 'gap-4 sm:gap-5'
              }`}
            >
              {widgets.map((widget, index) => (
                <div
                  key={widget.id}
                  className={
                    widget.width === 'full'
                      ? 'col-span-full'
                      : widget.width === 'half'
                      ? 'col-span-1 md:col-span-2'
                      : widget.width === 'third'
                      ? 'col-span-1 md:col-span-1'
                      : widget.colSpan
                      ? `col-span-1 md:col-span-${Math.min(widget.colSpan, 4)}`
                      : 'col-span-1'
                  }
                >
                  <WidgetCard
                    config={widget}
                    records={filteredRecords}
                    headers={processedData.headers}
                    index={index}
                    totalWidgets={widgets.length}
                    allWidgets={widgets}
                    isPreviewMode={true}
                    isActive={false}
                    onMove={() => {}}
                    onEdit={() => {}}
                    onDuplicate={() => {}}
                    onDelete={() => {}}
                    onChangeWidth={() => {}}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
