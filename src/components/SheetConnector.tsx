import React, { useState, useRef } from 'react';
import {
  SpreadsheetMetadata,
  SheetConfig,
  RecentSheet,
} from '../types';
import {
  FileSpreadsheet,
  Link,
  Upload,
  RefreshCw,
  Sliders,
  Clock,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Check,
  Table,
  HelpCircle,
  Plus,
  X,
  Layers,
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../services/sampleData';

interface SheetConnectorProps {
  sheetConfig: SheetConfig;
  metadata: SpreadsheetMetadata | null;
  recentSheets: RecentSheet[];
  isLoading: boolean;
  onConnectUrl: (urlOrId: string) => void;
  onSelectTab: (tabTitle: string) => void;
  onAddCustomTab?: (tabTitle: string) => void;
  onOpenPreviewModal: () => void;
  onOpenDataGrid?: () => void;
  onRefreshData: () => void;
  onSelectRecent: (recent: RecentSheet) => void;
  onUploadFile: (file: File) => void;
  onLoadSample: (sampleId: string) => void;
  onUpdateRowConfig: (headerRow: number, startRow: number) => void;
  onOpenLoginHelp?: () => void;
  inSidebar?: boolean;
}

export const SheetConnector: React.FC<SheetConnectorProps> = ({
  sheetConfig,
  metadata,
  recentSheets,
  isLoading,
  onConnectUrl,
  onSelectTab,
  onAddCustomTab,
  onOpenPreviewModal,
  onOpenDataGrid,
  onRefreshData,
  onSelectRecent,
  onUploadFile,
  onLoadSample,
  onUpdateRowConfig,
  onOpenLoginHelp,
  inSidebar = false,
}) => {
  const [inputUrl, setInputUrl] = useState(sheetConfig.sheetUrl || '');
  const [isRecentDropdownOpen, setIsRecentDropdownOpen] = useState(false);
  const [isSampleDropdownOpen, setIsSampleDropdownOpen] = useState(false);
  const [isAddingCustomTab, setIsAddingCustomTab] = useState(false);
  const [customTabInput, setCustomTabInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onConnectUrl(inputUrl.trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  const handleCustomTabSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = customTabInput.trim();
    if (!val) return;
    if (onAddCustomTab) {
      onAddCustomTab(val);
    } else {
      onSelectTab(val);
    }
    setCustomTabInput('');
    setIsAddingCustomTab(false);
  };

  return (
    <div
      className={
        inSidebar
          ? 'bg-transparent space-y-3 p-1'
          : 'bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4'
      }
    >
      {/* Top Connection Input Row */}
      <div
        className={
          inSidebar
            ? 'flex flex-col gap-2.5'
            : 'flex flex-col lg:flex-row items-stretch lg:items-center gap-3'
        }
      >
        {/* URL Input Form */}
        <form
          onSubmit={handleConnectSubmit}
          className={inSidebar ? 'flex flex-col gap-2' : 'flex-1 flex items-center gap-2'}
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Link className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="วางลิงก์ Google Sheets..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputUrl.trim()}
            className={`py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              inSidebar ? 'w-full' : ''
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            <span>เชื่อมต่อชีท</span>
          </button>
        </form>

        {/* Upload File & Sample Actions */}
        <div
          className={
            inSidebar
              ? 'grid grid-cols-2 gap-1.5'
              : 'flex items-center gap-2 flex-wrap'
          }
        >
          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`py-1.5 px-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shadow-2xs cursor-pointer ${
              inSidebar ? 'w-full' : ''
            }`}
            title="อัปโหลดไฟล์ Excel (.xlsx) หรือ CSV เพื่อสร้างแดชบอร์ดทันที"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">อัปโหลดไฟล์</span>
          </button>

          {/* Sample Sheets Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSampleDropdownOpen(!isSampleDropdownOpen)}
              className={`py-1.5 px-2.5 border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/60 text-indigo-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
                inSidebar ? 'w-full' : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">ชีทตัวอย่าง</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>
            {isSampleDropdownOpen && (
              <div className="absolute left-0 sm:right-0 mt-1 w-64 sm:w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1.5 max-h-64 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  เลือกชุดข้อมูลตัวอย่าง
                </div>
                {SAMPLE_DATASETS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onLoadSample(s.id);
                      setIsSampleDropdownOpen(false);
                      setInputUrl(s.title);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800">{s.title}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{s.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sheets History Dropdown */}
          {recentSheets.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRecentDropdownOpen(!isRecentDropdownOpen)}
                className={`py-1.5 px-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1 whitespace-nowrap shadow-2xs cursor-pointer ${
                  inSidebar ? 'w-full' : ''
                }`}
                title="ลิงก์ข้อมูลล่าสุดที่เคยเปิด"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">ล่าสุด ({recentSheets.length})</span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </button>
              {isRecentDropdownOpen && (
                <div className="absolute left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1.5 max-h-64 overflow-y-auto">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ประวัติชีทล่าสุด
                  </div>
                  {recentSheets.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onSelectRecent(r);
                        setIsRecentDropdownOpen(false);
                        setInputUrl(r.url);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50/60 flex items-center justify-between gap-2 border-b border-slate-50 last:border-0 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">
                          {r.title || 'Untitled Sheet'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          แท็บ: {r.selectedSheet}
                        </div>
                      </div>
                      {sheetConfig.spreadsheetId === r.id && (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Connected Sheet Status & Multi-Sheet Selector Bar */}
      {metadata && (
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          {/* File Title & Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold text-slate-900 truncate">
                {metadata.title}
              </span>
              {sheetConfig.sheetUrl.startsWith('http') && (
                <a
                  href={sheetConfig.sheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-blue-600 p-0.5 inline-flex items-center gap-0.5 shrink-0"
                  title="เปิดดูใน Google Sheets"
                >
                  <ExternalLink className="w-3 h-3 text-blue-600" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
              <span>ชีท:</span>
              <strong className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 truncate">
                {sheetConfig.selectedSheetTitle}
              </strong>
            </div>
          </div>

          {/* Sheet Tabs Bar - Multi-Sheet Selector */}
          <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                <Layers className="w-3 h-3 text-blue-600" />
                <span>แผ่นงาน ({metadata.sheets.length})</span>
              </div>

              {!isAddingCustomTab && (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomTab(true)}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 hover:underline cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>ระบุชื่ออื่น</span>
                </button>
              )}
            </div>

            {/* Tabs List */}
            <div className="flex flex-wrap items-center gap-1">
              {metadata.sheets.map((s) => {
                const isSelected = s.title === sheetConfig.selectedSheetTitle;
                return (
                  <button
                    key={s.sheetId || s.title}
                    type="button"
                    onClick={() => onSelectTab(s.title)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs ring-1 ring-blue-500'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <FileSpreadsheet
                      className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-500'}`}
                    />
                    <span className="truncate max-w-[140px]">{s.title}</span>
                    {s.rowCount !== undefined && s.rowCount > 0 && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded-full ${
                          isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {s.rowCount.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Inline Custom Sheet Input Form */}
              {isAddingCustomTab && (
                <form
                  onSubmit={handleCustomTabSubmit}
                  className="flex items-center gap-1 bg-white p-1 rounded-lg border border-blue-400 shadow-xs w-full"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="พิมพ์ชื่อชีท เช่น Sheet2"
                    value={customTabInput}
                    onChange={(e) => setCustomTabInput(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:bg-white text-slate-800"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded cursor-pointer"
                  >
                    เลือก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomTab(false);
                      setCustomTabInput('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Row Start Customization & Action Tools */}
          <div className="space-y-2 pt-1">
            {/* Quick Row Adjusters */}
            <div className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">หัวตาราง:</span>
                <input
                  type="number"
                  min={1}
                  value={sheetConfig.headerRowIndex}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    onUpdateRowConfig(val, Math.max(val + 1, sheetConfig.dataStartRowIndex));
                  }}
                  className="w-10 px-1 py-0.5 bg-white border border-slate-300 rounded font-bold text-center text-blue-700 text-xs"
                />
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">เริ่มข้อมูล:</span>
                <input
                  type="number"
                  min={sheetConfig.headerRowIndex + 1}
                  value={sheetConfig.dataStartRowIndex}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || sheetConfig.headerRowIndex + 1;
                    onUpdateRowConfig(sheetConfig.headerRowIndex, val);
                  }}
                  className="w-10 px-1 py-0.5 bg-white border border-slate-300 rounded font-bold text-center text-emerald-700 text-xs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={onOpenPreviewModal}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1 border border-blue-200 text-xs shadow-2xs cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>ปรับแต่ง</span>
              </button>

              {onOpenDataGrid && (
                <button
                  type="button"
                  onClick={onOpenDataGrid}
                  title="เปิดตารางแก้ไขเซลล์ ปรับชื่อหัวคอลัมน์ หรือเพิ่ม-ลบแถว (BI Data Grid)"
                  className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1 border border-indigo-200 text-xs shadow-2xs cursor-pointer"
                >
                  <Table className="w-3 h-3" />
                  <span>ฐานข้อมูล</span>
                </button>
              )}

              <button
                type="button"
                onClick={onRefreshData}
                disabled={isLoading}
                title="รีเฟรชดึงข้อมูลล่าสุดจาก Google Sheets"
                className="py-1.5 px-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-1 text-xs cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
