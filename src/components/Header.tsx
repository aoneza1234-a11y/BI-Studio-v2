import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, DashboardTheme, UserRole } from '../types';
import {
  LayoutTemplate,
  Plus,
  Download,
  Database,
  Eye,
  Edit3,
  Image as ImageIcon,
  Printer,
  ChevronDown,
  Loader2,
  Table,
  Sliders,
  Zap,
  Sun,
  Moon,
  Move,
  Grid,
  Palette,
  Check,
  Share2,
  Calculator,
  ShieldCheck,
  Sparkles,
  HardDrive,
  FileCode,
  LogIn,
  LogOut,
} from 'lucide-react';
import { WhiteLabelConfig } from '../types';

const COLOR_THEMES: {
  id: DashboardTheme;
  label: string;
  gradient: string;
  borderActive: string;
}[] = [
  {
    id: 'light',
    label: 'สว่าง',
    gradient: 'from-emerald-400 to-white',
    borderActive: 'border-2 border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold shadow-2xs',
  },
  {
    id: 'midnight',
    label: 'มิดไนท์',
    gradient: 'from-slate-950 via-slate-900 to-blue-700',
    borderActive: 'border-2 border-blue-500 bg-blue-50/60 text-blue-950 font-bold shadow-2xs',
  },
  {
    id: 'ocean',
    label: 'โอเชียน',
    gradient: 'from-cyan-600 via-teal-500 to-sky-400',
    borderActive: 'border-2 border-cyan-500 bg-cyan-50/60 text-cyan-950 font-bold shadow-2xs',
  },
  {
    id: 'violet',
    label: 'ไวโอเล็ต',
    gradient: 'from-purple-700 via-violet-600 to-indigo-400',
    borderActive: 'border-2 border-purple-500 bg-purple-50/70 text-purple-950 font-bold shadow-2xs ring-2 ring-purple-400/20',
  },
  {
    id: 'forest',
    label: 'ฟอเรสต์',
    gradient: 'from-emerald-900 via-emerald-700 to-teal-500',
    borderActive: 'border-2 border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold shadow-2xs',
  },
  {
    id: 'sunset',
    label: 'ซันเซ็ต',
    gradient: 'from-amber-600 via-orange-500 to-rose-400',
    borderActive: 'border-2 border-orange-500 bg-orange-50/60 text-orange-950 font-bold shadow-2xs',
  },
];

interface HeaderProps {
  user: UserProfile | null;
  isLoggingIn: boolean;
  isPreviewMode: boolean;
  isExportingPng: boolean;
  isBIPanelOpen?: boolean;
  liveSyncInterval?: number;
  layoutMode?: 'grid' | 'freeform';
  onToggleLayoutMode?: (mode: 'grid' | 'freeform') => void;
  themeMode?: 'light' | 'dark';
  onToggleThemeMode?: () => void;
  dashboardTheme?: DashboardTheme;
  onChangeDashboardTheme?: (theme: DashboardTheme) => void;
  primaryColor?: string;
  onChangePrimaryColor?: (color: string) => void;
  fontFamily?: string;
  onChangeFontFamily?: (font: string) => void;
  cardRadius?: string;
  onChangeCardRadius?: (radius: string) => void;
  cardShadow?: string;
  onChangeCardShadow?: (shadow: string) => void;
  onOpenLoginHelp?: () => void;
  onToggleBIPanel?: () => void;
  onTogglePreviewMode: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenTemplates: () => void;
  onOpenDataGrid: () => void;
  onAddWidget: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onOpenShareModal?: () => void;
  onOpenFormulaBuilder?: () => void;
  onOpenMarketplace?: () => void;
  onOpenNotificationCenter?: () => void;
  onOpenBackupRestore?: () => void;
  onOpenWhiteLabel?: () => void;
  whiteLabel?: WhiteLabelConfig;
  userRole?: UserRole;
  isViewerMode?: boolean;
  onSwitchMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isLoggingIn,
  isPreviewMode,
  isExportingPng,
  isBIPanelOpen = false,
  liveSyncInterval = 0,
  layoutMode = 'freeform',
  onToggleLayoutMode,
  themeMode = 'light',
  onToggleThemeMode,
  dashboardTheme = 'light',
  onChangeDashboardTheme,
  primaryColor = '#7c3aed',
  onChangePrimaryColor,
  fontFamily = 'system',
  onChangeFontFamily,
  cardRadius = 'standard',
  onChangeCardRadius,
  cardShadow = 'soft',
  onChangeCardShadow,
  onOpenLoginHelp,
  onToggleBIPanel,
  onTogglePreviewMode,
  onLogin,
  onLogout,
  onOpenTemplates,
  onOpenDataGrid,
  onAddWidget,
  onExportPng,
  onExportPdf,
  onOpenShareModal,
  onOpenFormulaBuilder,
  onOpenMarketplace,
  onOpenNotificationCenter,
  onOpenBackupRestore,
  onOpenWhiteLabel,
  whiteLabel,
  userRole = 'admin',
  isViewerMode = false,
  onSwitchMode,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target as Node)
      ) {
        setIsThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8 min-h-[72px] sm:h-[76px] flex items-center justify-between gap-3 sm:gap-4 relative">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0 py-1">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden font-extrabold text-sm"
            style={{ backgroundColor: whiteLabel?.primaryColor || '#059669' }}
          >
            {whiteLabel?.companyLogoUrl ? (
              <img
                src={whiteLabel.companyLogoUrl}
                alt={whiteLabel.companyName}
                className="w-7 h-7 object-contain"
              />
            ) : whiteLabel?.companyName ? (
              <span>{whiteLabel.companyName.slice(0, 2).toUpperCase()}</span>
            ) : (
              <Database className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                {whiteLabel?.companyName || 'Sheets Dashboard Studio'}
              </h1>
              {isPreviewMode ? (
                <span className="whitespace-nowrap px-2.5 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-800 rounded-full animate-pulse border border-blue-200 shadow-2xs">
                  โหมดพรีวิว (Preview Mode)
                </span>
              ) : (
                <span className="whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/80 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{whiteLabel?.domain || 'GOOGLE SHEETS SYNC'}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 hidden md:block whitespace-nowrap mt-0.5">
              {isPreviewMode
                ? 'มุมมองพรีวิวนำเสนอ ซ่อนปุ่มแก้ไขทั้งหมดสำหรับการรายงาน'
                : 'สร้างแดชบอร์ด ปรับแต่งแถว และแสดงกราฟสดจาก Google Sheets'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Preview / Edit Mode Toggle Button */}
          <button
            type="button"
            onClick={onTogglePreviewMode}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs ${
              isPreviewMode
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            {isPreviewMode ? (
              <>
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>แก้ไข</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>พรีวิว</span>
              </>
            )}
          </button>

          {/* Live Sync Badge if active */}
          {liveSyncInterval > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>สด {liveSyncInterval}s</span>
            </div>
          )}

          {/* Layout Mode Toggle: Freeform vs Grid */}
          {!isPreviewMode && onToggleLayoutMode && (
            <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => onToggleLayoutMode('freeform')}
                title="โหมดผืนผ้าใบอิสระ"
                className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                  layoutMode === 'freeform'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>อิสระ</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleLayoutMode('grid')}
                title="โหมดตาราง 12 คอลัมน์"
                className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                  layoutMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>ตาราง</span>
              </button>
            </div>
          )}

          {/* Multi-Color Workspace Theme Selector Popover */}
          <div className="relative" ref={themeMenuRef}>
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              title="เปลี่ยนธีมแดชบอร์ด"
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>ธีม</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isThemeMenuOpen && (
              <div
                className="absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 w-72 sm:w-80 bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 z-[100] animate-fade-in text-xs"
                style={{ filter: 'drop-shadow(0 20px 25px rgba(0,0,0,0.15))' }}
              >
                {/* Header matching Image 2 */}
                <div className="mb-3">
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">ธีมของพื้นที่ทำงาน</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">เลือกโทนสี ปรับสีหลัก ฟอนต์ มุม และเงาได้</p>
                </div>

                {/* 6 Theme Grid matching Image 2 */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {COLOR_THEMES.map((theme) => {
                    const isSelected =
                      dashboardTheme === theme.id ||
                      (theme.id === 'forest' && dashboardTheme === 'emerald') ||
                      (theme.id === 'sunset' && dashboardTheme === 'amber');
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          if (onChangeDashboardTheme) {
                            onChangeDashboardTheme(theme.id);
                          }
                          if (onToggleThemeMode) {
                            if (theme.id === 'light' && themeMode !== 'light') {
                              onToggleThemeMode();
                            } else if (theme.id !== 'light' && themeMode !== 'dark') {
                              onToggleThemeMode();
                            }
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-left flex items-center gap-2 border transition-all cursor-pointer ${
                          isSelected
                            ? theme.borderActive
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border shadow-2xs shrink-0 flex overflow-hidden bg-gradient-to-tr ${theme.gradient}`}
                        />
                        <span className="font-semibold text-xs truncate">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-2.5" />

                {/* Color and Style Controls */}
                <div className="space-y-2.5">
                  {/* Primary Color Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">สีหลัก</span>
                    <label className="relative cursor-pointer flex items-center">
                      <input
                        type="color"
                        value={primaryColor || '#7c3aed'}
                        onChange={(e) => onChangePrimaryColor?.(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className="w-12 h-6 rounded-lg border-2 border-slate-300 shadow-2xs transition-transform hover:scale-105"
                        style={{ backgroundColor: primaryColor || '#7c3aed' }}
                        title="คลิกเพื่อเปลี่ยนสีหลัก"
                      />
                    </label>
                  </div>

                  {/* Font Family Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">ฟอนต์</span>
                    <select
                      value={fontFamily || 'system'}
                      onChange={(e) => onChangeFontFamily?.(e.target.value)}
                      className="w-36 text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                    >
                      <option value="system">ระบบ</option>
                      <option value="kanit">Kanit (คณิต)</option>
                      <option value="prompt">Prompt (พร้อมท์)</option>
                      <option value="sarabun">Sarabun (สารบรรณ)</option>
                      <option value="chakra">Chakra Petch</option>
                    </select>
                  </div>

                  {/* Card Corner Radius Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">มุมการ์ด</span>
                    <select
                      value={cardRadius || 'standard'}
                      onChange={(e) => onChangeCardRadius?.(e.target.value)}
                      className="w-36 text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                    >
                      <option value="standard">มาตรฐาน (16px)</option>
                      <option value="rounded">กลมมน (24px)</option>
                      <option value="square">เหลี่ยม (8px)</option>
                      <option value="extra">โค้งมนพิเศษ (28px)</option>
                    </select>
                  </div>

                  {/* Card Shadow Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">เงา</span>
                    <select
                      value={cardShadow || 'soft'}
                      onChange={(e) => onChangeCardShadow?.(e.target.value)}
                      className="w-36 text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                    >
                      <option value="soft">นุ่ม (Soft)</option>
                      <option value="medium">ชัดเจน (Medium)</option>
                      <option value="floating">ลอยเด่น (Floating)</option>
                      <option value="none">ไม่มี (None)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Edit-only actions: Templates & Add Widget */}
          {!isPreviewMode && !isViewerMode && (
            <>
              {/* Formula Builder Button (คำนวณฟิลด์สร้างในแดชบอร์ดได้เลย) */}
              {onOpenFormulaBuilder && (
                <button
                  type="button"
                  onClick={onOpenFormulaBuilder}
                  title="สร้างสูตรคำนวณ Calculated Field เช่น Profit = Revenue - Cost"
                  className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Calculator className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">สูตรคำนวณ</span>
                </button>
              )}

              {/* Template Marketplace Button */}
              {onOpenMarketplace && (
                <button
                  type="button"
                  onClick={onOpenMarketplace}
                  title="คลังเทมเพลตแดชบอร์ดสำเร็จรูป (Sales, Inventory, Finance, Logistics, Customs, HR)"
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">เทมเพลต</span>
                </button>
              )}

              {/* BI Side Panel Button */}
              {onToggleBIPanel && (
                <button
                  type="button"
                  onClick={onToggleBIPanel}
                  title="เปิด/ปิด แผงเครื่องมือ BI"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs ${
                    isBIPanelOpen
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>แผง BI</span>
                </button>
              )}

              {/* Data Grid Editor Button */}
              <button
                type="button"
                onClick={onOpenDataGrid}
                title="แก้ไขข้อมูลในเซลล์ ปรับชื่อหัวตาราง หรือเพิ่มแถว"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Table className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">แก้ไขข้อมูล</span>
              </button>

              {/* Add Widget Button */}
              <button
                type="button"
                onClick={onAddWidget}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มวิดเจ็ต</span>
              </button>

              {/* Backup & Restore Button (Offline JSON) */}
              {onOpenBackupRestore && (
                <button
                  type="button"
                  onClick={onOpenBackupRestore}
                  title="สำรองข้อมูลและกู้คืนไฟล์แดชบอร์ด (Backup & Restore .json)"
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <HardDrive className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {/* Share Dashboard Button */}
          {!isViewerMode && onOpenShareModal && (
            <button
              type="button"
              onClick={onOpenShareModal}
              title="แชร์ลิงก์แดชบอร์ดให้ผู้อื่น"
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>แชร์</span>
            </button>
          )}

          {/* Export Dropdown (Image & PDF) */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExportingPng}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 shadow-2xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isExportingPng ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>ส่งออก</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportPng();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกรูปภาพ (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportPdf();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>พิมพ์ / บันทึกเป็น PDF</span>
                </button>

                {onOpenBackupRestore && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onOpenBackupRestore();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors border-t border-slate-100 cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4 text-indigo-600" />
                    <span>ดาวน์โหลดไฟล์สำรอง (.json)</span>
                  </button>
                )}

                <a
                  href="/api/download-offline-html"
                  download="google-sheets-dashboard.html"
                  onClick={() => setIsExportMenuOpen(false)}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-2 transition-colors border-t border-slate-100 cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  <span>ดาวน์โหลดไฟล์เว็บ (.html สำเร็จรูป)</span>
                </a>
              </div>
            )}
          </div>

          {/* Quick Offline HTML Download Button */}
          <a
            href="/api/download-offline-html"
            download="google-sheets-dashboard.html"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            title="คลิกเพื่อดาวน์โหลดไฟล์เดี่ยว .html เก็บไว้ในเครื่อง ดับเบิลคลิกเปิดใช้งานได้ตลอดเวลาแม้ไม่มีอินเทอร์เน็ต"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>ไฟล์ .html เปิดในเครื่อง</span>
          </a>

          {/* Google Sign-In / User Profile Button */}
          <div className="pl-2 border-l border-slate-200 flex items-center gap-2">
            {user && user.uid !== 'offline-local-user' && user.email !== 'local@device' ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-6 h-6 rounded-full object-cover border border-slate-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-slate-800 max-w-[110px] truncate">
                    {user.displayName || 'ผู้ใช้ Google'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    เชื่อมต่อชีทแล้ว
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="ออกจากระบบ Google"
                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-rose-600 rounded-lg transition-colors ml-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-2xs transition-all hover:border-blue-400 active:scale-98 disabled:opacity-50 cursor-pointer"
                title="ลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อดึงข้อมูลสเปรดชีตส่วนตัว (Private Google Sheets)"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="whitespace-nowrap">เข้าสู่ระบบ Google</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
