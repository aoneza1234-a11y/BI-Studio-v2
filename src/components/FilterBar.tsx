import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FilterState } from '../types';
import {
  extractDistinctCategories,
  filterRecordsExcept,
} from '../utils/filterRecords';
import {
  Filter,
  X,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  PanelRight,
  PanelTop,
  SlidersHorizontal,
  Calendar,
  Tag,
  Hash,
  Sparkles,
} from 'lucide-react';

export interface FilterBarProps {
  filters: FilterState;
  onUpdateFilters: (updated: Partial<FilterState>) => void;
  onResetFilters: () => void;
  dateColumns: string[];
  categoricalColumns: string[];
  allHeaders: string[];
  rawRecords: Record<string, any>[];
  filteredCount: number;
  totalCount: number;
  isVerticalSidebar?: boolean;
  filterPosition?: 'right' | 'top';
  onTogglePosition?: (pos: 'right' | 'top') => void;
  onCloseSidebar?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  dateColumns,
  categoricalColumns,
  allHeaders,
  rawRecords,
  filteredCount,
  totalCount,
  isVerticalSidebar = false,
  filterPosition = 'right',
  onTogglePosition,
  onCloseSidebar,
}) => {
  const [isAddFilterOpen, setIsAddFilterOpen] = useState(false);
  const [activeDropdownCol, setActiveDropdownCol] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(filters.searchQuery));
  const [isSqlFilterOpen, setIsSqlFilterOpen] = useState(Boolean(filters.sqlFilterQuery));
  const [columnSearchQueries, setColumnSearchQueries] = useState<Record<string, string>>({});
  
  const addFilterRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click (for floating dropdowns)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addFilterRef.current && !addFilterRef.current.contains(e.target as Node)) {
        setIsAddFilterOpen(false);
      }
      if (!isVerticalSidebar && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownCol(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVerticalSidebar]);

  // Active filter columns (explicitly added or from chart cross-filtering)
  const activeColumns = useMemo(() => {
    const list = new Set<string>();
    (filters.activeFilterColumns || []).forEach((c) => {
      if (allHeaders.includes(c)) list.add(c);
    });
    // Also include any column that has a selected value in categoryFilters
    Object.entries(filters.categoryFilters || {}).forEach(([col, val]) => {
      if (val && val !== '__all__' && allHeaders.includes(col)) {
        list.add(col);
      }
    });
    // Auto-populate default popular categories (e.g. Month, Province/Region, Customer, Product) if empty
    if (list.size === 0 && categoricalColumns.length > 0) {
      categoricalColumns.slice(0, 4).forEach((c) => list.add(c));
    }
    return Array.from(list);
  }, [filters.activeFilterColumns, filters.categoryFilters, allHeaders, categoricalColumns]);

  // Available headers not yet added
  const availableToAdd = useMemo(() => {
    return allHeaders.filter((h) => !activeColumns.includes(h));
  }, [allHeaders, activeColumns]);

  // CASCADING AUTO-PRUNING:
  // If an active column filter value is no longer present in the cascading subset,
  // automatically prune it so the dashboard never gets locked into 0 matching rows!
  useEffect(() => {
    let hasInvalid = false;
    const nextCategoryFilters = { ...filters.categoryFilters };

    for (const [col, selectedVal] of Object.entries(filters.categoryFilters || {})) {
      if (selectedVal && selectedVal !== '__all__') {
        const contextual = filterRecordsExcept(rawRecords, filters, col);
        const distinct = extractDistinctCategories(contextual, col);
        const exists = distinct.some((d) => d.value === selectedVal);
        if (!exists) {
          delete nextCategoryFilters[col];
          hasInvalid = true;
        }
      }
    }

    if (hasInvalid) {
      onUpdateFilters({ categoryFilters: nextCategoryFilters });
    }
  }, [rawRecords, filters.categoryFilters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery && filters.searchQuery.trim() !== '') count++;
    Object.values(filters.categoryFilters || {}).forEach((v) => {
      if (v && v !== '__all__') count++;
    });
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  const handleAddColumn = (column: string) => {
    const updatedCols = Array.from(new Set([...activeColumns, column]));
    onUpdateFilters({ activeFilterColumns: updatedCols });
    setIsAddFilterOpen(false);
    setActiveDropdownCol(column);
  };

  const handleRemoveColumn = (column: string) => {
    const updatedCols = activeColumns.filter((c) => c !== column);
    const updatedCategory = { ...filters.categoryFilters };
    delete updatedCategory[column];
    onUpdateFilters({
      activeFilterColumns: updatedCols,
      categoryFilters: updatedCategory,
    });
    if (activeDropdownCol === column) {
      setActiveDropdownCol(null);
    }
  };

  const handleSelectValue = (column: string, value: string) => {
    const updatedCategory = { ...filters.categoryFilters };
    if (value === '__all__') {
      delete updatedCategory[column];
    } else {
      updatedCategory[column] = value;
    }
    onUpdateFilters({ categoryFilters: updatedCategory });
    // In horizontal mode, close dropdown on select; in vertical sidebar, keep card open for easy switching
    if (!isVerticalSidebar) {
      setActiveDropdownCol(null);
    }
  };

  const getColumnIcon = (col: string) => {
    if (dateColumns.includes(col)) return <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    if (categoricalColumns.includes(col)) return <Tag className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    return <Hash className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  };

  // ==========================================
  // 1. VERTICAL SIDEBAR MODE (แถบตัวกรองแนวตั้งด้านข้าง)
  // ==========================================
  if (isVerticalSidebar) {
    return (
      <div className="flex flex-col h-full bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden select-none">
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-none">
                ตัวกรองข้อมูล
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                แถบฟิกซ์ด้านข้าง (Fixed Right)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle position to top bar if user wants */}
            {onTogglePosition && (
              <button
                type="button"
                onClick={() => onTogglePosition('top')}
                title="ย้ายไปแนวนอนด้านบน (Dock to Top)"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                <PanelTop className="w-4 h-4" />
              </button>
            )}
            {onCloseSidebar && (
              <button
                type="button"
                onClick={onCloseSidebar}
                title="ปิดแถบตัวกรอง"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Bar & Global Search */}
        <div className="p-3 border-b border-slate-100 bg-white space-y-2.5 shrink-0">
          {/* Row count pill & Reset button */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 font-semibold text-[11px]">
              <span>{filteredCount.toLocaleString('th-TH')}</span>
              <span className="text-blue-400">/</span>
              <span className="text-blue-600 font-normal">{totalCount.toLocaleString('th-TH')} แถว</span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-2 py-1 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1 font-semibold transition-colors border border-rose-200 shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างตัวกรอง ({activeFilterCount})</span>
              </button>
            )}
          </div>

          {/* Global Search across all columns */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาข้อความในทุกคอลัมน์..."
              value={filters.searchQuery || ''}
              onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
              className="w-full text-xs pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => onUpdateFilters({ searchQuery: '' })}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* SQL-Like Filter (Vertical Sidebar) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsSqlFilterOpen(!isSqlFilterOpen)}
              className={`w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                filters.sqlFilterQuery
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>⚡ SQL Filter (สาย Data)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {isSqlFilterOpen ? 'ย่อ' : 'เปิด'}
              </span>
            </button>
            {isSqlFilterOpen && (
              <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="เช่น Revenue > 100000 AND Province = 'Chonburi'"
                  value={filters.sqlFilterQuery || ''}
                  onChange={(e) => onUpdateFilters({ sqlFilterQuery: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>รองรับ &gt;, &lt;, =, &gt;=, &lt;=, AND, OR, LIKE, IN</span>
                  {filters.sqlFilterQuery && (
                    <button
                      type="button"
                      onClick={() => onUpdateFilters({ sqlFilterQuery: '' })}
                      className="text-rose-600 hover:underline"
                    >
                      ล้าง SQL
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable List of Active Filters */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-0.5">
            <span>คอลัมน์ตัวกรอง ({activeColumns.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">คลิกเพื่อเลือกเงื่อนไข</span>
          </div>

          {activeColumns.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
              <Sparkles className="w-5 h-5 text-blue-500 mx-auto mb-1.5 opacity-60" />
              <p className="text-xs font-semibold text-slate-700">กำลังแสดงข้อมูลทั้งหมด</p>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-2.5">
                ยังไม่มีตัวกรองคอลัมน์ที่เปิดใช้งาน
              </p>
              {availableToAdd.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddFilterOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs inline-flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มตัวกรองแรก</span>
                </button>
              )}
            </div>
          ) : (
            activeColumns.map((col) => {
              const currentVal = filters.categoryFilters?.[col];
              const isSelected = Boolean(currentVal && currentVal !== '__all__');
              const isExpanded = activeDropdownCol === col;

              // Cascading options for this column:
              const contextualRecords = filterRecordsExcept(rawRecords, filters, col);
              const distinct = extractDistinctCategories(contextualRecords, col);
              const colSearch = (columnSearchQueries[col] || '').toLowerCase().trim();
              const filteredDistinct = colSearch
                ? distinct.filter((d) => (d.label || d.value).toLowerCase().includes(colSearch))
                : distinct;

              return (
                <div
                  key={col}
                  className={`rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50/40 shadow-2xs'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Card Header: Column Name + Remove */}
                  <div className="p-2.5 flex items-center justify-between gap-2 border-b border-slate-100/80">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {getColumnIcon(col)}
                      <span className="text-xs font-bold text-slate-800 truncate" title={col}>
                        {col}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Clear value button if selected */}
                      {isSelected && (
                        <button
                          type="button"
                          onClick={() => handleSelectValue(col, '__all__')}
                          title="ล้างค่าที่เลือก"
                          className="px-1.5 py-0.5 text-[10px] text-blue-700 bg-blue-100 hover:bg-blue-200 rounded font-semibold transition-colors"
                        >
                          รีเซ็ต
                        </button>
                      )}
                      {/* Remove column button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(col)}
                        title={`ลบตัวกรอง ${col}`}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Trigger Button (Shows selected value) */}
                  <button
                    type="button"
                    onClick={() => setActiveDropdownCol(isExpanded ? null : col)}
                    className="w-full px-2.5 py-2 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        ค่าที่เลือก ({distinct.length} รายการที่มี):
                      </span>
                      <span
                        className={`text-xs font-bold truncate block ${
                          isSelected ? 'text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        {isSelected
                          ? (currentVal === '__blank__' ? '(ว่าง)' : currentVal)
                          : 'ทั้งหมด (All)'}
                      </span>
                    </div>

                    <div className="p-1 rounded bg-slate-100 text-slate-500 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {/* Accordion Options List (Contained safely INSIDE the sidebar card!) */}
                  {isExpanded && (
                    <div className="p-2 border-t border-slate-100 bg-slate-50/90 rounded-b-xl space-y-1.5 animate-in fade-in duration-150">
                      {/* Sub-search inside options if many */}
                      {distinct.length > 5 && (
                        <div className="relative">
                          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder={`ค้นหาใน ${col}...`}
                            value={columnSearchQueries[col] || ''}
                            onChange={(e) =>
                              setColumnSearchQueries({
                                ...columnSearchQueries,
                                [col]: e.target.value,
                              })
                            }
                            className="w-full text-[11px] pl-6 pr-5 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                          />
                          {columnSearchQueries[col] && (
                            <button
                              type="button"
                              onClick={() =>
                                setColumnSearchQueries({
                                  ...columnSearchQueries,
                                  [col]: '',
                                })
                              }
                              className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Options Container with safe internal scroll */}
                      <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
                        {/* Option: All */}
                        <button
                          type="button"
                          onClick={() => handleSelectValue(col, '__all__')}
                          className={`w-full px-2.5 py-1.5 text-left text-xs rounded-lg flex items-center justify-between transition-colors ${
                            !isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-2xs'
                              : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
                          }`}
                        >
                          <span>ทั้งหมด (All)</span>
                          {!isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>

                        {/* Distinct Options */}
                        {filteredDistinct.map(({ value, label, count, isBlank }) => {
                          const isThisSelected = currentVal === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleSelectValue(col, value)}
                              className={`w-full px-2.5 py-1.5 text-left text-xs rounded-lg flex items-center justify-between gap-1.5 transition-colors ${
                                isThisSelected
                                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                  : 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-900 border border-slate-200/60'
                              }`}
                            >
                              <span className="truncate" title={label || value}>
                                {isBlank ? '🏷️ (ว่าง)' : label || value}
                              </span>
                              <span
                                className={`text-[10px] shrink-0 font-mono px-1.5 py-0.2 rounded ${
                                  isThisSelected
                                    ? 'bg-blue-700 text-blue-100'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {count.toLocaleString('th-TH')}
                              </span>
                            </button>
                          );
                        })}

                        {filteredDistinct.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-100">
                            ไม่พบข้อมูลที่ตรงกับการค้นหา
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Add Filter Column Button inside Sidebar */}
          <div className="relative pt-1" ref={addFilterRef}>
            <button
              type="button"
              onClick={() => setIsAddFilterOpen(!isAddFilterOpen)}
              disabled={availableToAdd.length === 0}
              className="w-full py-2 px-3 bg-white hover:bg-blue-50/70 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-semibold rounded-xl border border-dashed border-slate-300 transition-all flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ เพิ่มหัวข้อตัวกรอง</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isAddFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAddFilterOpen && (
              <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  เลือกคอลัมน์เพื่อเพิ่มตัวกรอง
                </div>
                {availableToAdd.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400 text-center">
                    เพิ่มครบทุกคอลัมน์แล้ว
                  </div>
                ) : (
                  availableToAdd.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => handleAddColumn(col)}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between gap-2 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <span className="truncate">{col}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {dateColumns.includes(col)
                          ? '📅 วันที่'
                          : categoricalColumns.includes(col)
                          ? '🏷️ ข้อความ'
                          : '🔢 ตัวเลข'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 text-center shrink-0">
          💡 คัดกรองแบบต่อเนื่อง (Cascading Filter) แสดงเฉพาะข้อมูลจริง
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. HORIZONTAL TOP BAR MODE (แนวนอนด้านบน)
  // ==========================================
  return (
    <div
      className="relative z-40 bg-white/95 backdrop-blur-xs rounded-2xl border border-slate-200/90 shadow-2xs px-3.5 py-2 transition-all"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap min-h-[38px]">
        {/* Left Side: Filter icon and Pills */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {/* Filter Badge / Header */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>ตัวกรอง</span>
          </div>

          {/* Active Filter Pills */}
          {activeColumns.length === 0 ? (
            <span className="text-xs text-slate-500 font-medium px-1.5">
              แสดงข้อมูลทั้งหมด
            </span>
          ) : (
            activeColumns.map((col) => {
              const currentVal = filters.categoryFilters?.[col];
              const isSelected = Boolean(currentVal && currentVal !== '__all__');
              const isMenuOpen = activeDropdownCol === col;

              // Cascading options
              const contextualRecords = filterRecordsExcept(rawRecords, filters, col);
              const distinct = extractDistinctCategories(contextualRecords, col);

              return (
                <div key={col} className="relative" ref={isMenuOpen ? dropdownRef : undefined}>
                  <div
                    className={`inline-flex items-center rounded-lg border text-xs transition-all shadow-2xs ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {/* Clickable pill label to open dropdown */}
                    <button
                      type="button"
                      onClick={() => setActiveDropdownCol(isMenuOpen ? null : col)}
                      className="px-2.5 py-1 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    >
                      <span className="font-medium text-slate-600 truncate max-w-[120px]">{col}:</span>
                      <span className="font-bold text-blue-700 truncate max-w-[130px]">
                        {isSelected
                          ? (currentVal === '__blank__' ? '(ว่าง)' : currentVal)
                          : 'ทั้งหมด'}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Quick remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(col)}
                      title={`ยกเลิกตัวกรอง ${col}`}
                      className="pr-2 pl-0.5 py-1 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dropdown Menu: High z-index (z-[100]) so it can NEVER be covered by dashboard widgets! */}
                  {isMenuOpen && (
                    <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-[100] animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                        <span>เลือก {col}</span>
                        <span className="text-slate-400 font-normal">
                          ({distinct.length} ตัวเลือก)
                        </span>
                      </div>

                      {/* Option: All */}
                      <button
                        type="button"
                        onClick={() => handleSelectValue(col, '__all__')}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors ${
                          !isSelected
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>ทั้งหมด</span>
                        {!isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>

                      {/* Cascading Options */}
                      {distinct.map(({ value, label, count, isBlank }) => {
                        const isThisSelected = currentVal === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleSelectValue(col, value)}
                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                              isThisSelected
                                ? 'bg-blue-50 text-blue-700 font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">
                              {isBlank ? '🏷️ (ว่าง)' : label || value}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {count.toLocaleString('th-TH')}
                            </span>
                          </button>
                        );
                      })}

                      {distinct.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-400 text-center">
                          ไม่มีข้อมูลในเงื่อนไขปัจจุบัน
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Add Filter Column Button */}
          <div className="relative" ref={addFilterRef}>
            <button
              type="button"
              onClick={() => setIsAddFilterOpen(!isAddFilterOpen)}
              disabled={availableToAdd.length === 0}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200/90 shadow-2xs transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ เพิ่มตัวกรอง</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isAddFilterOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  เลือกคอลัมน์เพื่อกรอง
                </div>
                {availableToAdd.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400">
                    เพิ่มครบทุกคอลัมน์แล้ว
                  </div>
                ) : (
                  availableToAdd.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => handleAddColumn(col)}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between gap-2 transition-colors"
                    >
                      <span className="truncate">{col}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {dateColumns.includes(col)
                          ? '📅 วันที่'
                          : categoricalColumns.includes(col)
                          ? '🏷️ ข้อความ'
                          : '🔢 ตัวเลข'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1 font-semibold transition-colors border border-rose-200 shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        {/* Right Side: Search, Row counter & Position Switcher */}
        <div className="flex items-center gap-2 shrink-0 text-xs">
          {/* Search Toggle / Box */}
          {isSearchOpen ? (
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหา..."
                value={filters.searchQuery || ''}
                onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
                className="text-xs pl-7 pr-7 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white w-32 sm:w-44"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  onUpdateFilters({ searchQuery: '' });
                  setIsSearchOpen(false);
                }}
                className="absolute right-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="ค้นหาข้อความ"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          {/* SQL Filter Button */}
          <button
            type="button"
            onClick={() => setIsSqlFilterOpen(!isSqlFilterOpen)}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 font-semibold text-[11px] ${
              filters.sqlFilterQuery
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200'
            }`}
            title="กรองข้อมูลด้วยคำสั่ง SQL (SQL-Like Expression)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">SQL</span>
          </button>

          {/* Row count pill */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] text-slate-600 font-medium">
            <span className="font-bold text-slate-800">{filteredCount.toLocaleString('th-TH')}</span>
            <span className="text-slate-400">/</span>
            <span>{totalCount.toLocaleString('th-TH')} แถว</span>
          </div>

          {/* Button to dock back to Right Sidebar */}
          {onTogglePosition && (
            <button
              type="button"
              onClick={() => onTogglePosition('right')}
              className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-600 text-[11px] font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
              title="ย้ายไปไว้แถบแนวตั้งด้านข้างขวา (Dock to Right)"
            >
              <PanelRight className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">ย้ายไปแถบขวา</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable SQL Input Bar in Horizontal Mode */}
      {isSqlFilterOpen && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-amber-700 font-bold shrink-0">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>SQL Expression:</span>
          </div>
          <input
            type="text"
            placeholder="เช่น Revenue > 100000 AND Province = 'Chonburi' หรือ [ยอดขาย] >= 50000"
            value={filters.sqlFilterQuery || ''}
            onChange={(e) => onUpdateFilters({ sqlFilterQuery: e.target.value })}
            className="flex-1 min-w-[240px] px-3 py-1.5 text-xs font-mono bg-amber-50/50 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 placeholder:text-slate-400"
          />
          {filters.sqlFilterQuery && (
            <button
              type="button"
              onClick={() => onUpdateFilters({ sqlFilterQuery: '' })}
              className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100"
            >
              ล้างเงื่อนไข
            </button>
          )}
          <span className="text-[10px] text-slate-400">
            (รองรับ &gt;, &lt;, =, &gt;=, &lt;=, AND, OR, LIKE, IN)
          </span>
        </div>
      )}
    </div>
  );
};
