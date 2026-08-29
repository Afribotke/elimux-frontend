'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown, Inbox, X } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface DataTableBulkAction<T> {
  label: string;
  action: (selected: T[]) => void;
  variant?: 'primary' | 'danger';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKeys?: string[];
  filterable?: boolean;
  filters?: DataTableFilter[];
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  bulkActions?: DataTableBulkAction<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

// Generic admin table: search, per-column sort, filter dropdowns, pagination,
// row selection + bulk actions. Sort/search/filter all read plain `row[key]`
// values - callers that need a derived value (e.g. an "effective role" that
// accounts for an admin_users override) should compute that onto the row
// object before passing it in, rather than this component special-casing
// domain logic it has no business knowing about.
export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchable = true,
  searchKeys,
  filterable = true,
  filters = [],
  sortable = true,
  pagination = true,
  pageSize = 25,
  bulkActions = [],
  onRowClick,
  emptyMessage = 'No data found',
  loading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const effectiveSearchKeys = useMemo(
    () => searchKeys ?? columns.map((c) => c.key),
    [searchKeys, columns]
  );

  const filtered = useMemo(() => {
    let rows = data;

    for (const [key, value] of Object.entries(filterValues)) {
      if (!value || value === 'all') continue;
      rows = rows.filter((row) => String((row as Record<string, unknown>)[key] ?? '') === value);
    }

    if (searchable && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter((row) =>
        effectiveSearchKeys.some((key) => {
          const value = (row as Record<string, unknown>)[key];
          return typeof value === 'string' || typeof value === 'number'
            ? String(value).toLowerCase().includes(q)
            : false;
        })
      );
    }

    if (sortable && sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey];
        const bv = (b as Record<string, unknown>)[sortKey];
        let cmp = 0;
        if (av == null) cmp = bv == null ? 0 : -1;
        else if (bv == null) cmp = 1;
        else if (typeof av === 'boolean') cmp = av === bv ? 0 : av ? 1 : -1;
        else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
        else cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return rows;
  }, [data, filterValues, searchable, searchQuery, effectiveSearchKeys, sortable, sortKey, sortDir]);

  const totalPages = pagination ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const pageRows = pagination ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  function setFilter(key: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    const ids = pageRows.map((r) => r.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  const selectedRows = data.filter((r) => selectedIds.has(r.id));
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));

  if (loading) {
    return (
      <div className="bg-elimux-card border border-border rounded-xl p-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-elimux-dark animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {(searchable || (filterable && filters.length > 0)) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {searchable && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search..."
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-elimux-card border border-border text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-primary-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {filterable &&
            filters.map((f) => (
              <select
                key={f.key}
                value={filterValues[f.key] ?? 'all'}
                onChange={(e) => setFilter(f.key, e.target.value)}
                className="px-3 py-2 rounded-lg bg-elimux-card border border-border text-foreground text-sm"
              >
                <option value="all">All {f.label}</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ))}
        </div>
      )}

      {bulkActions.length > 0 && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-lg bg-primary-500/10 border border-primary-500/30">
          <span className="text-sm text-foreground font-medium">{selectedIds.size} selected</span>
          {bulkActions.map((action) => (
            <button
              key={action.label}
              onClick={() => action.action(selectedRows)}
              className={`text-xs font-medium hover:underline ${
                action.variant === 'danger' ? 'text-elimux-danger' : 'text-primary-400'
              }`}
            >
              {action.label}
            </button>
          ))}
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-muted hover:text-foreground">
            Clear
          </button>
        </div>
      )}

      <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-elimux-dark text-muted text-left">
            <tr>
              {bulkActions.length > 0 && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  {sortable && col.sortable !== false ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="w-3 h-3 text-primary-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-primary-400" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 text-muted" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`border-t border-border ${onRowClick ? 'cursor-pointer hover:bg-elimux-dark/50' : ''}`}
              >
                {bulkActions.length > 0 && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label="Select row"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-foreground">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                  className="px-4 py-12 text-center text-muted"
                >
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg bg-elimux-card border border-border text-muted disabled:opacity-50"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg bg-elimux-card border border-border text-muted disabled:opacity-50"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
