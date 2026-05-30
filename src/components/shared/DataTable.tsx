'use client';
import { useState } from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: string;
  onExport?: () => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({ columns, data, searchKey, onExport, loading, emptyMessage }: Props<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 25;

  const filtered = searchKey
    ? data.filter(row => String(row[searchKey] || '').toLowerCase().includes(search.toLowerCase()))
    : data;

  const total = filtered.length;
  const pages = Math.ceil(total / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-[var(--brand-gold-light)] animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        {searchKey && (
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 border-[var(--border-default)] focus:border-[var(--brand-gold-deep)]"
            />
          </div>
        )}
        {onExport && (
          <Button size="sm" variant="outline" onClick={onExport} className="border-[var(--border-default)] text-[var(--brand-brown)]">
            <Download size={14} className="mr-1" /> Export CSV
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border-default)] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--brand-cream)] border-b border-[var(--border-default)]">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--text-muted)]">
                {emptyMessage || 'No records found'}
              </td></tr>
            ) : (
              paged.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border-default)] hover:bg-[var(--brand-cream)] transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-[var(--text-primary)]">
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
          <span>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></Button>
            <Button size="sm" variant="ghost" disabled={page === pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
