import React, { useState, useMemo, useEffect } from 'react';
import { SheetConfig } from '../types';
import {
  X,
  Save,
  Plus,
  Trash2,
  Search,
  RotateCcw,
  Pencil,
  Check,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface DataGridEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawRows: (string | number | boolean | null)[][] | undefined;
  sheetConfig: SheetConfig;
  originalRawRows?: (string | number | boolean | null)[][];
  onSaveData: (
    updatedRawRows: (string | number | boolean | null)[][],
    renamedHeaders: Record<string, string>
  ) => void;
  onRevertOriginal?: () => void;
}

export const DataGridEditorModal: React.FC<DataGridEditorModalProps> = ({
  isOpen,
  onClose,
  rawRows = [],
  sheetConfig,
  originalRawRows,
  onSaveData,
  onRevertOriginal,
}) => {
  const headerRowIdx = Math.max(0, sheetConfig.headerRowIndex - 1);
  const dataStartRowIdx = Math.max(headerRowIdx + 1, sheetConfig.dataStartRowIndex - 1);

  // Local working copy of rawRows
  const [workingRows, setWorkingRows] = useState<(string | number | boolean | null)[][]>(() => {
    return rawRows.map((r) => [...r]);
  });

  // Track renamed headers: { [originalHeaderName]: newHeaderName }
  const [headerRenames, setHeaderRenames] = useState<Record<string, string>>({});

  // Active editing header index
  const [editingHeaderIdx, setEditingHeaderIdx] = useState<number | null>(null);
  const [headerDraftValue, setHeaderDraftValue] = useState<string>('');

  // Active editing cell: { rowIdx, colIdx }
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);
  const [cellDraftValue, setCellDraftValue] = useState<string>('');

  // Search filter inside table
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset working state when modal opens or rawRows changes
  useEffect(() => {
    setWorkingRows(rawRows.map((r) => [...r]));
    setHeaderRenames({});
    setEditingCell(null);
    setEditingHeaderIdx(null);
    setCurrentPage(1);
  }, [isOpen, rawRows]);

  // Extract column headers with smart stacked header resolution ("ซ้อนคำ")
  const headers = useMemo(() => {
    const row = workingRows[headerRowIdx] || [];
    const maxCols = Math.max(row.length, ...workingRows.slice(0, 5).map((r) => r.length));
    const list: string[] = [];
    for (let i = 0; i < maxCols; i++) {
      let val = row[i];
      let name = val !== undefined && val !== null ? String(val).trim() : '';
      name = name.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

      // Check row above for stacked headers or merged headers
      let parentName = '';
      if (headerRowIdx > 0) {
        const parentRow = workingRows[headerRowIdx - 1] || [];
        let pVal = parentRow[i] !== undefined && parentRow[i] !== null ? String(parentRow[i]).trim() : '';
        pVal = pVal.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

        if (!pVal) {
          // Check horizontal merged span in parent row
          for (let colBack = i - 1; colBack >= 0; colBack--) {
            const backVal = parentRow[colBack] !== undefined && parentRow[colBack] !== null ? String(parentRow[colBack]).trim() : '';
            if (backVal) {
              pVal = backVal;
              break;
            }
          }
        }
        if (pVal) {
          parentName = pVal;
        }
      }

      if (!name) {
        if (parentName) {
          name = parentName;
        } else {
          // Standard Excel Column Letter e.g. A, B, C...
          let temp = i + 1;
          let letter = '';
          while (temp > 0) {
            const mod = (temp - 1) % 26;
            letter = String.fromCharCode(65 + mod) + letter;
            temp = Math.floor((temp - mod) / 26);
          }
          name = `คอลัมน์ ${letter}`;
        }
      } else if (
        parentName &&
        parentName.toLowerCase() !== name.toLowerCase() &&
        !name.toLowerCase().includes(parentName.toLowerCase()) &&
        !parentName.toLowerCase().includes(name.toLowerCase())
      ) {
        name = `${parentName} ${name}`;
      }

      list.push(name);
    }
    return list;
  }, [workingRows, headerRowIdx]);

  // Extract data rows with original indices
  const dataRowsWithIdx = useMemo(() => {
    const list: { originalIdx: number; row: (string | number | boolean | null)[] }[] = [];
    for (let i = dataStartRowIdx; i < workingRows.length; i++) {
      list.push({ originalIdx: i, row: workingRows[i] || [] });
    }
    return list;
  }, [workingRows, dataStartRowIdx]);

  // Filter rows by search query
  const filteredDataRows = useMemo(() => {
    if (!searchQuery.trim()) return dataRowsWithIdx;
    const q = searchQuery.toLowerCase().trim();
    return dataRowsWithIdx.filter(({ row }) =>
      row.some((cell) => String(cell ?? '').toLowerCase().includes(q))
    );
  }, [dataRowsWithIdx, searchQuery]);

  // Paginate filtered rows
  const totalPages = Math.max(1, Math.ceil(filteredDataRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDataRows.slice(start, start + pageSize);
  }, [filteredDataRows, currentPage, pageSize]);

  // Count changes compared to initial
  const changeCount = useMemo(() => {
    let count = Object.keys(headerRenames).length;
    if (!rawRows || rawRows.length !== workingRows.length) {
      count += Math.abs((rawRows?.length || 0) - workingRows.length);
    }
    return count;
  }, [headerRenames, rawRows, workingRows]);

  // Handle header rename start
  const handleStartRenameHeader = (colIdx: number) => {
    setEditingHeaderIdx(colIdx);
    setHeaderDraftValue(headers[colIdx] || '');
  };

  // Commit header rename
  const handleCommitHeaderRename = (colIdx: number) => {
    const trimmed = headerDraftValue.trim();
    if (!trimmed) {
      setEditingHeaderIdx(null);
      return;
    }

    const oldName = headers[colIdx];
    if (oldName !== trimmed) {
      const updated = workingRows.map((r, rIdx) => {
        if (rIdx === headerRowIdx) {
          const newRow = [...r];
          while (newRow.length <= colIdx) newRow.push('');
          newRow[colIdx] = trimmed;
          return newRow;
        }
        return r;
      });

      setWorkingRows(updated);
      setHeaderRenames((prev) => ({
        ...prev,
        [oldName]: trimmed,
      }));
    }
    setEditingHeaderIdx(null);
  };

  // Handle cell edit start
  const handleStartEditCell = (rowIdx: number, colIdx: number, currentValue: any) => {
    setEditingCell({ rowIdx, colIdx });
    setCellDraftValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
  };

  // Commit cell edit
  const handleCommitCellEdit = () => {
    if (!editingCell) return;
    const { rowIdx, colIdx } = editingCell;

    const updated = workingRows.map((r, rIdx) => {
      if (rIdx === rowIdx) {
        const newRow = [...r];
        while (newRow.length <= colIdx) newRow.push('');
        // Parse number if strictly numeric string without leading zero (unless "0")
        let val: any = cellDraftValue.trim();
        if (val !== '' && !isNaN(Number(val)) && !val.startsWith('0') || val === '0') {
          val = Number(val);
        }
        newRow[colIdx] = val;
        return newRow;
      }
      return r;
    });

    setWorkingRows(updated);
    setEditingCell(null);
  };

  // Add new row
  const handleAddRow = () => {
    const emptyRow: (string | number | boolean | null)[] = new Array(headers.length).fill('');
    const updated = [...workingRows, emptyRow];
    setWorkingRows(updated);
    // Navigate to last page
    const newTotal = dataRowsWithIdx.length + 1;
    setCurrentPage(Math.ceil(newTotal / pageSize));
  };

  // Delete row
  const handleDeleteRow = (originalIdx: number) => {
    const updated = workingRows.filter((_, idx) => idx !== originalIdx);
    setWorkingRows(updated);
  };

  // Add new column
  const handleAddColumn = () => {
    const newColName = `คอลัมน์ใหม่_${headers.length + 1}`;
    const updated = workingRows.map((r, rIdx) => {
      const newRow = [...r];
      if (rIdx === headerRowIdx) {
        newRow.push(newColName);
      } else {
        newRow.push('');
      }
      return newRow;
    });
    setWorkingRows(updated);
  };

  // Save changes
  const handleSave = () => {
    onSaveData(workingRows, headerRenames);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  แก้ไขฐานข้อมูล (Data Grid & Schema Editor)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-full">
                  BI View
                </span>
                {changeCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    มีการแก้ไข {changeCount} จุด
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                แก้ไขข้อมูลในเซลล์ ปรับเปลี่ยนชื่อหัวข้อคอลัมน์ หรือเพิ่ม-ลบแถว เพื่อให้แดชบอร์ดอัปเดตกราฟทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search in table */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาข้อความหรือตัวเลขในตาราง..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>เพิ่มแถวใหม่</span>
            </button>

            <button
              type="button"
              onClick={handleAddColumn}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>เพิ่มคอลัมน์</span>
            </button>

            {onRevertOriginal && originalRawRows && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นข้อมูลต้นฉบับใช่หรือไม่?')) {
                    onRevertOriginal();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-semibold rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตค่าเดิม</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกและอัปเดตแดชบอร์ด</span>
            </button>
          </div>
        </div>

        {/* Informative Hint */}
        <div className="px-6 py-2 bg-blue-50/60 border-b border-blue-100/80 flex items-center gap-2 text-[11px] text-blue-800">
          <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            <strong>เคล็ดลับการใช้งาน:</strong> ดับเบิลคลิกหรือคลิกที่เซลล์ใดๆ เพื่อพิมพ์แก้ไขข้อมูลได้ทันที •
            คลิกที่ไอคอนดินสอบนหัวคอลัมน์เพื่อแก้ไขชื่อหัวข้อได้อย่างอิสระ
          </span>
        </div>

        {/* Interactive Data Grid Table */}
        <div className="flex-1 overflow-auto bg-slate-50/30">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header Row */}
            <thead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 shadow-2xs">
              <tr>
                <th className="w-12 px-3 py-2.5 text-center font-bold text-slate-500 bg-slate-200/70 border-r border-slate-200">
                  #
                </th>
                {headers.map((header, colIdx) => (
                  <th
                    key={colIdx}
                    className="px-3 py-2.5 font-semibold text-slate-800 border-r border-slate-200 min-w-[140px] max-w-[240px] group bg-slate-100"
                  >
                    {editingHeaderIdx === colIdx ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={headerDraftValue}
                          onChange={(e) => setHeaderDraftValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitHeaderRename(colIdx);
                            if (e.key === 'Escape') setEditingHeaderIdx(null);
                          }}
                          onBlur={() => handleCommitHeaderRename(colIdx)}
                          className="w-full px-2 py-0.5 bg-white border border-blue-500 rounded text-xs font-bold text-blue-800 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCommitHeaderRename(colIdx)}
                          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={`truncate select-none ${
                            headerRenames[header] ? 'text-blue-700 font-bold' : ''
                          }`}
                          title={header}
                          onDoubleClick={() => handleStartRenameHeader(colIdx)}
                        >
                          {header}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartRenameHeader(colIdx)}
                          title="แก้ไขชื่อหัวข้อคอลัมน์ (Rename Header)"
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-60 group-hover:opacity-100"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </th>
                ))}
                <th className="w-16 px-3 py-2.5 text-center font-bold text-slate-500">
                  ลบ
                </th>
              </tr>
            </thead>

            {/* Table Body Rows */}
            <tbody className="divide-y divide-slate-200 bg-white">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.length + 2}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    {searchQuery ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'ไม่มีข้อมูลในตาราง'}
                  </td>
                </tr>
              ) : (
                paginatedRows.map(({ originalIdx, row }, rIndex) => (
                  <tr
                    key={originalIdx}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Row Index Number */}
                    <td className="px-3 py-2 text-center font-mono text-[11px] text-slate-400 bg-slate-50/50 border-r border-slate-200 select-none">
                      {originalIdx - dataStartRowIdx + 1}
                    </td>

                    {/* Cell Values */}
                    {headers.map((_, colIdx) => {
                      const cellVal = row[colIdx];
                      const isEditing =
                        editingCell?.rowIdx === originalIdx && editingCell?.colIdx === colIdx;

                      return (
                        <td
                          key={colIdx}
                          onDoubleClick={() => handleStartEditCell(originalIdx, colIdx, cellVal)}
                          className="px-3 py-1.5 border-r border-slate-200 truncate cursor-text max-w-[240px]"
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              autoFocus
                              value={cellDraftValue}
                              onChange={(e) => setCellDraftValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCommitCellEdit();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              onBlur={handleCommitCellEdit}
                              className="w-full px-2 py-0.5 bg-blue-50 border border-blue-500 rounded text-xs text-slate-900 font-medium focus:outline-none shadow-2xs"
                            />
                          ) : (
                            <div
                              onClick={() => handleStartEditCell(originalIdx, colIdx, cellVal)}
                              className="w-full py-0.5 truncate hover:bg-slate-100/70 rounded px-1 -mx-1"
                              title={cellVal !== null && cellVal !== undefined ? String(cellVal) : ''}
                            >
                              {cellVal !== null && cellVal !== undefined && String(cellVal) !== '' ? (
                                String(cellVal)
                              ) : (
                                <span className="text-slate-300 italic">ว่าง</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Delete Row Button */}
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(originalIdx)}
                        title="ลบแถวนี้"
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            แสดงแถวที่{' '}
            <strong className="text-slate-900">
              {filteredDataRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-900">
              {Math.min(currentPage * pageSize, filteredDataRows.length)}
            </strong>{' '}
            จากทั้งหมด{' '}
            <strong className="text-slate-900 font-bold">
              {filteredDataRows.length.toLocaleString('th-TH')}
            </strong>{' '}
            แถว ({headers.length} คอลัมน์)
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">แถวต่อหน้า:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
