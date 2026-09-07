import React, { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import EmptyState from './EmptyState';
import { useTranslation } from '../../i18n';

/**
 * Reusable sortable / filterable / paginated table (A4.6), used across all
 * four workspaces instead of each dashboard hand-rolling its own <table>.
 *
 * columns: [{ key, header, render?(row), sortValue?(row), align? }]
 * data: array of row objects (each should have a stable `id` or pass rowKey)
 */
export default function DataTable({
  columns,
  data = [],
  rowKey = (row) => row.id,
  onRowClick,
  pageSize = 10,
  searchable = false,
  searchPlaceholder,
  searchKeys,
  emptyMessage,
}) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return data;
    const q = query.trim().toLowerCase();
    const keys = searchKeys || columns.map((c) => c.key);
    return data.filter((row) => keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)));
  }, [data, query, searchable, searchKeys, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    const getVal = col?.sortValue || ((row) => row[sortKey]);
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    });
    if (sortDir === 'desc') copy.reverse();
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageClamped = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(pageClamped * pageSize, pageClamped * pageSize + pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  return (
    <div className="w-full">
      {searchable && (
        <div className="mb-3 relative max-w-xs">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder={searchPlaceholder || t('filters.search')}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950/15"
          />
        </div>
      )}

      <div className="overflow-x-auto w-full rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wide text-xs">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 select-none ${col.align === 'right' ? 'text-right' : ''} ${col.sortable !== false ? 'cursor-pointer hover:text-slate-900' : ''}`}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {sortKey === col.key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10">
                  <EmptyState message={emptyMessage || t('table.noResults')} />
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'hover:bg-slate-50 cursor-pointer transition-colors' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500 font-medium">
          <span>
            Page {pageClamped + 1} of {totalPages} &middot; {sorted.length} rows
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pageClamped === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={pageClamped >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
