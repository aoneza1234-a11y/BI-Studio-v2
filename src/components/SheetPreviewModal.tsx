import React from 'react';
import { SheetConfig } from '../types';
import { X, Check, ArrowDownToLine, Tag } from 'lucide-react';

interface SheetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawRows: (string | number | boolean | null)[][];
  sheetConfig: SheetConfig;
  onUpdateConfig: (updated: Partial<SheetConfig>) => void;
}

export const SheetPreviewModal: React.FC<SheetPreviewModalProps> = ({
  isOpen,
  onClose,
  rawRows,
  sheetConfig,
  onUpdateConfig,
}) => {
  if (!isOpen) return null;

  const headerRow = sheetConfig.headerRowIndex;
  const dataStartRow = sheetConfig.dataStartRowIndex;
  const dataEndRow = sheetConfig.dataEndRowIndex;

  const previewRows = rawRows.slice(0, 30); // show first 30 rows for fast rendering

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-blue-600" />
              กำหนดแถวหัวตารางและแถวเริ่มต้นข้อมูล (Configure Rows & Columns)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกที่แถวในตารางเพื่อกำหนดเป็นหัวตารางหรือจุดเริ่มต้นข้อมูล หรือระบุตัวเลขด้านล่าง
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Settings Bar */}
        <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              <span className="font-semibold text-slate-700">แถวหัวตาราง (Header):</span>
              <input
                type="number"
                min={1}
                max={Math.max(1, rawRows.length)}
                value={headerRow}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  onUpdateConfig({
                    headerRowIndex: val,
                    dataStartRowIndex: Math.max(val + 1, dataStartRow),
                  });
                }}
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-center text-blue-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="font-semibold text-slate-700">เริ่มอ่านข้อมูลที่แถว (Data Start):</span>
              <input
                type="number"
                min={headerRow + 1}
                max={Math.max(headerRow + 1, rawRows.length)}
                value={dataStartRow}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || headerRow + 1;
                  onUpdateConfig({ dataStartRowIndex: val });
                }}
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-center text-emerald-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">สิ้นสุดที่แถว (End Row, ทางเลือก):</span>
              <input
                type="number"
                min={dataStartRow}
                placeholder="ทั้งหมด"
                value={dataEndRow || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  onUpdateConfig({ dataEndRowIndex: val });
                }}
                className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-center text-slate-700 focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-400 text-[11px]">(ว่างไว้ = ทั้งชีท)</span>
            </div>
          </div>

          <div className="text-slate-500">
            พบทั้งหมด {rawRows.length.toLocaleString('th-TH')} แถวในชีท
          </div>
        </div>

        {/* Visual Raw Grid */}
        <div className="flex-1 overflow-auto p-4 bg-slate-50/40">
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-3 w-16 text-center font-mono font-bold">แถว #</th>
                  <th className="py-2 px-3 w-40 text-center font-semibold">การกำหนดบทบาท</th>
                  {previewRows[0]?.map((_, colIdx) => (
                    <th key={colIdx} className="py-2 px-3 whitespace-nowrap text-slate-500 font-mono">
                      Col {String.fromCharCode(65 + (colIdx % 26))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {previewRows.map((row, index) => {
                  const rowNum = index + 1;
                  const isHeader = rowNum === headerRow;
                  const isDataStart = rowNum === dataStartRow;
                  const isData = rowNum >= dataStartRow && (!dataEndRow || rowNum <= dataEndRow);
                  const isSkipped = rowNum < headerRow || (rowNum > headerRow && rowNum < dataStartRow);

                  let rowBg = 'hover:bg-slate-50';
                  if (isHeader) rowBg = 'bg-blue-50/80 text-blue-900 font-bold border-y-2 border-blue-400';
                  else if (isDataStart) rowBg = 'bg-emerald-50/70 text-emerald-950 font-semibold border-t-2 border-emerald-400';
                  else if (isData) rowBg = 'bg-white hover:bg-emerald-50/30';
                  else if (isSkipped) rowBg = 'bg-slate-50/60 text-slate-400 opacity-60';

                  return (
                    <tr key={index} className={`transition-colors ${rowBg}`}>
                      {/* Row number */}
                      <td className="py-2 px-3 text-center font-bold text-slate-600">
                        {rowNum}
                      </td>

                      {/* Action buttons / badges */}
                      <td className="py-1.5 px-3 text-center whitespace-nowrap font-sans">
                        {isHeader ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-2xs">
                            <Tag className="w-3 h-3" /> แถวหัวตาราง
                          </span>
                        ) : isDataStart ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-2xs">
                            <ArrowDownToLine className="w-3 h-3" /> เริ่มข้อมูล
                          </span>
                        ) : isSkipped ? (
                          <span className="text-[10px] text-slate-400">ข้าม (Skip)</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateConfig({
                                  headerRowIndex: rowNum,
                                  dataStartRowIndex: rowNum + 1,
                                });
                              }}
                              className="px-1.5 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-[10px]"
                            >
                              เป็นหัวตาราง
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateConfig({ dataStartRowIndex: rowNum });
                              }}
                              className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded text-[10px]"
                            >
                              เริ่มข้อมูล
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Cell contents */}
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-2 px-3 whitespace-nowrap max-w-xs truncate"
                          title={String(cell ?? '')}
                        >
                          {cell !== null && cell !== undefined && String(cell) !== '' ? (
                            String(cell)
                          ) : (
                            <span className="text-slate-300 italic">(null)</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <div className="text-xs text-slate-500">
            แถวที่ <span className="font-bold text-blue-600">{headerRow}</span> เป็นชื่อคอลัมน์ และเริ่มอ่านข้อมูลแถวที่{' '}
            <span className="font-bold text-emerald-600">{dataStartRow}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> ตกลงและใช้การตั้งค่านี้
          </button>
        </div>
      </div>
    </div>
  );
};
