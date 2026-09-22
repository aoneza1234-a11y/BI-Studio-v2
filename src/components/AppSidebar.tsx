import React from 'react';
import {
  LayoutDashboard,
  Database,
  Palette,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  SlidersHorizontal,
  TableProperties,
} from 'lucide-react';

interface AppSidebarProps {
  currentSection: 'dashboard' | 'database' | 'templates' | 'sheets' | 'settings';
  onChangeSection: (section: 'dashboard' | 'database' | 'templates' | 'sheets' | 'settings') => void;
  onOpenTemplates: () => void;
  onOpenDataGrid: () => void;
  onOpenConnector: () => void;
  onOpenSettings?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  totalWidgets: number;
  totalRows: number;
  sheetTitle: string;
  isBIPanelOpen: boolean;
  onToggleBIPanel: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentSection,
  onChangeSection,
  onOpenTemplates,
  onOpenDataGrid,
  onOpenConnector,
  onOpenSettings,
  isCollapsed,
  onToggleCollapse,
  totalWidgets,
  totalRows,
  sheetTitle,
  isBIPanelOpen,
  onToggleBIPanel,
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ด',
      sublabel: 'ภาพรวมกราฟ & KPI',
      icon: LayoutDashboard,
      badge: `${totalWidgets}`,
      action: () => onChangeSection('dashboard'),
    },
    {
      id: 'database',
      label: 'แก้ไขฐานข้อมูล',
      sublabel: 'ตารางข้อมูล / กริดชีท',
      icon: Database,
      badge: `${totalRows.toLocaleString()} แถว`,
      action: () => {
        onChangeSection('database');
        onOpenDataGrid();
      },
    },
    {
      id: 'templates',
      label: 'เทมเพลตแดชบอร์ด',
      sublabel: 'เลือกแบบและเลย์เอาต์',
      icon: Palette,
      badge: 'แนะนำ',
      action: () => {
        onChangeSection('templates');
        onOpenTemplates();
      },
    },
    {
      id: 'sheets',
      label: 'เชื่อมต่อชีท',
      sublabel: 'Google Sheets & ไฟล์',
      icon: FileSpreadsheet,
      action: () => {
        onChangeSection('sheets');
        onOpenConnector();
      },
    },
    {
      id: 'bi',
      label: 'เครื่องมือ BI ขวา',
      sublabel: 'ปรับฟอนต์ สี ฟิลเตอร์',
      icon: SlidersHorizontal,
      badge: isBIPanelOpen ? 'เปิดอยู่' : 'ปิดอยู่',
      badgeColor: isBIPanelOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500',
      action: () => onToggleBIPanel(),
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-200 shrink-0 select-none z-20 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xs font-bold text-sm shrink-0">
              BI
            </div>
            <div className="truncate">
              <h2 className="text-xs font-bold text-white tracking-wide truncate">
                เมนูแดชบอร์ด
              </h2>
              <p className="text-[10px] text-slate-400 truncate">
                {sheetTitle || 'Google Sheets Studio'}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'ขยายแถบเมนู (Expand)' : 'ย่อแถบเมนู (Collapse)'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {!isCollapsed && <span>เมนูหลัก (Navigation)</span>}
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id || (item.id === 'bi' && isBIPanelOpen);

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
              title={isCollapsed ? `${item.label}: ${item.sublabel}` : undefined}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-300 group-hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-xs block truncate leading-tight">{item.label}</span>
                    <span
                      className={`text-[10px] block truncate ${
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {item.sublabel}
                    </span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-1 shrink-0 ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : item.badgeColor || 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span>ฐานข้อมูล:</span>
            <span className="font-semibold text-slate-200 truncate max-w-[120px]">
              {sheetTitle || 'ข้อมูลปัจจุบัน'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>วิดเจ็ตในหน้านี้:</span>
            <span className="font-semibold text-emerald-400">{totalWidgets} รายการ</span>
          </div>
        </div>
      )}
    </aside>
  );
};
