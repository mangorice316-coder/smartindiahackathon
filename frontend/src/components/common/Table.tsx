import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  pageSize?: number;
  initialSortKey?: string;
  initialSortDirection?: 'asc' | 'desc';
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No records found',
  pageSize,
  initialSortKey,
  initialSortDirection = 'desc'
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [data, sortKey, sortDirection]);

  // Pagination
  const totalPages = pageSize ? Math.max(1, Math.ceil(sortedData.length / pageSize)) : 1;
  const paginatedData = useMemo(() => {
    if (!pageSize) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pageSize, currentPage]);

  const handleHeaderClick = (col: Column<T>) => {
    if (col.sortable === false) return;
    if (sortKey === col.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col.key);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 font-mono text-xs">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#090d16]/70 backdrop-blur-md shadow-lg">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-mono text-slate-400 uppercase tracking-[0.14em]">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const canSort = col.sortable !== false;
                return (
                  <th
                    key={col.key}
                    onClick={() => canSort && handleHeaderClick(col)}
                    className={`py-3 px-3.5 font-bold select-none transition-colors ${
                      canSort ? 'cursor-pointer hover:text-cyan-300 hover:bg-white/[0.03]' : ''
                    } ${col.className || ''}`}
                    aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {canSort && (
                        <span className="text-slate-500">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp size={12} className="text-cyan-400 animate-bounce" />
                            ) : (
                              <ChevronDown size={12} className="text-cyan-400 animate-bounce" />
                            )
                          ) : (
                            <ChevronsUpDown size={11} className="opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {paginatedData.map((item, idx) => (
              <tr
                key={item.id ? String(item.id) : idx}
                onClick={() => onRowClick && onRowClick(item)}
                className={`transition-all duration-200 ease-spring ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-cyan-950/20 hover:text-cyan-100 hover:shadow-inner'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`py-2.5 px-3.5 text-slate-200 ${col.className || ''}`}>
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pageSize && totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-1 text-xs font-mono text-slate-400">
          <div className="text-[11px]">
            Showing <span className="text-slate-200 font-bold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="text-slate-200 font-bold">{Math.min(currentPage * pageSize, sortedData.length)}</span> of{' '}
            <span className="text-slate-200 font-bold">{sortedData.length}</span> entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Previous Page"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-white/10 text-[11px] text-cyan-300 font-bold shadow-inner">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Next Page"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

