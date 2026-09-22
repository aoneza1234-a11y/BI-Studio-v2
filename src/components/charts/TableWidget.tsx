import React, { useState, useMemo } from 'react';
import { WidgetConfig } from '../../types';
import { Search, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

interface TableWidgetProps {
  config: WidgetConfig;
  records: Record<string, any>[];
  headers: string[];
}

export const TableWidget: React.FC<TableWidgetProps> = ({
  config,
  records,
  headers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const lower = searchTerm.toLowerCase();
    return records.filter((rec) =>
      headers.some((h) => String(rec[h] ?? '').toLowerCase().includes(lower))
    );
  }, [records, headers, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, pageIndex, pageSize]);

  if (!headers || headers.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50" />
        ไม่มีข้อมูลตาราง
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: config.fontFamily || undefined }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาข้อมูลในตาราง..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>
            แสดง {filteredRecords.length.toLocaleString('th-TH')} แถว
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-[11px] px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600"
            title="จำนวนแถวต่อหน้า"
          >
            <option value={8}>8 แถว/หน้า</option>
            <option value={15}>15 แถว/หน้า</option>
            <option value={25}>25 แถว/หน้า</option>
            <option value={50}>50 แถว/หน้า</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-lg max-h-80">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
              <th className="py-2.5 px-3 whitespace-nowrap w-12 text-center text-slate-400">
                #
              </th>
              {headers.map((h, i) => (
                <th key={i} className="py-2.5 px-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-blue-50/40 transition-colors text-slate-700"
                >
                  <td className="py-2 px-3 whitespace-nowrap text-center font-mono text-slate-400">
                    {row._rowIndex || (pageIndex - 1) * pageSize + rowIdx + 1}
                  </td>
                  {headers.map((h, colIdx) => (
                    <td key={colIdx} className="py-2 px-3 whitespace-nowrap">
                      {row[h] !== undefined && row[h] !== null
                        ? String(row[h])
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="py-8 text-center text-slate-400"
                >
                  ไม่พบข้อมูลที่ตรงกับการค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            หน้า {pageIndex} จาก {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={pageIndex <= 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageIndex >= totalPages}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
