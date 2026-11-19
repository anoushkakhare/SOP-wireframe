import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Table, AlertTriangle, AlertCircle } from 'lucide-react';
import { formatCompactNumber } from '../../utils/formatters';

export interface MasterDataRow {
  id: string;
  name: string;
  level: string | number;
  parent: string;
  childCount: number;
}

export interface TransactionDataRow {
  period: string;
  group: string;
  value: number;
  rowCount: number;
  isAnomaly?: 'gap' | 'spike';
}

export type DockedTableData =
  | { type: 'master'; rows: MasterDataRow[] }
  | { type: 'transaction'; rows: TransactionDataRow[]; measure?: string };

interface DockedDataTableProps {
  data: DockedTableData;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const DockedDataTable: React.FC<DockedDataTableProps> = ({
  data,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.rows;

    if (data.type === 'master') {
      return (data.rows as MasterDataRow[]).filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          String(r.level).toLowerCase().includes(q) ||
          r.parent.toLowerCase().includes(q)
      );
    } else {
      return (data.rows as TransactionDataRow[]).filter(
        (r) =>
          r.period.toLowerCase().includes(q) ||
          r.group.toLowerCase().includes(q) ||
          (r.isAnomaly && r.isAnomaly.toLowerCase().includes(q))
      );
    }
  }, [data, searchQuery]);

  // Collapsed dock bar (minimal 32px height)
  if (isCollapsed) {
    return (
      <div className="h-8 shrink-0 border-t border-border bg-gray-50 flex items-center justify-between px-3 select-none transition-all duration-150">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700">
            VIEW-ONLY
          </span>
          <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-text-disabled" />
            Data behind visual ({data.rows.length} rows)
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand table"
          aria-label="Expand data behind visual table"
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-primary-700 hover:bg-primary-50 transition-colors"
        >
          <span>Expand table</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Expanded dock table (~210px height, docked to bottom)
  return (
    <div className="h-[210px] shrink-0 border-t border-border bg-surface flex flex-col min-h-0 select-none shadow-dock animate-in slide-in-from-bottom duration-150">
      {/* Top Dock Control Bar */}
      <div className="h-9 px-3 bg-gray-50/90 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-800 border border-primary-200">
            VIEW-ONLY
          </span>
          <span className="text-xs font-bold text-text-primary tracking-tight truncate flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-primary-600" />
            Data behind visual
          </span>
          <span className="text-[11px] text-text-secondary tabular-nums">
            ({filteredRows.length} {filteredRows.length === 1 ? 'row' : 'rows'}
            {searchQuery ? ` matching "${searchQuery}"` : ''})
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick search input */}
          <div className="relative">
            <Search className="w-3 h-3 text-text-disabled absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter table..."
              aria-label="Filter data table"
              className="w-36 sm:w-44 pl-6 pr-2 py-0.5 text-xs bg-white border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Collapse button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse table (gives chart full height)"
            aria-label="Collapse table"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline text-[11px]">Collapse</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Table View */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-left text-xs text-text-primary border-collapse">
          {data.type === 'master' ? (
            <>
              <thead className="sticky top-0 z-10 bg-gray-100/95 backdrop-blur-xs text-[11px] font-semibold text-text-secondary uppercase tracking-wider border-b border-border shadow-xs">
                <tr>
                  <th className="py-1.5 px-3">Node ID</th>
                  <th className="py-1.5 px-3">Name</th>
                  <th className="py-1.5 px-3">Hierarchy Level</th>
                  <th className="py-1.5 px-3">Parent</th>
                  <th className="py-1.5 px-3 text-right">Child Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-text-disabled">
                      No matching hierarchy nodes
                    </td>
                  </tr>
                ) : (
                  (filteredRows as MasterDataRow[]).map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-primary-50/50 transition-colors odd:bg-gray-50/20"
                    >
                      <td className="py-1.5 px-3 font-mono text-xs text-text-secondary">{row.id}</td>
                      <td className="py-1.5 px-3 font-semibold text-text-primary">{row.name}</td>
                      <td className="py-1.5 px-3">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                          {row.level}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-text-secondary">{row.parent || '—'}</td>
                      <td className="py-1.5 px-3 text-right font-mono tabular-nums text-text-primary font-medium">
                        {row.childCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          ) : (
            <>
              <thead className="sticky top-0 z-10 bg-gray-100/95 backdrop-blur-xs text-[11px] font-semibold text-text-secondary uppercase tracking-wider border-b border-border shadow-xs">
                <tr>
                  <th className="py-1.5 px-3">Period</th>
                  <th className="py-1.5 px-3">Group</th>
                  <th className="py-1.5 px-3 text-right">
                    Value {data.measure ? `(${data.measure})` : ''}
                  </th>
                  <th className="py-1.5 px-3 text-right">Row Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-text-disabled">
                      No matching transactions
                    </td>
                  </tr>
                ) : (
                  (filteredRows as TransactionDataRow[]).map((row, idx) => (
                    <tr
                      key={`${row.period}-${row.group}-${idx}`}
                      className={`hover:bg-primary-50/50 transition-colors ${
                        row.isAnomaly === 'gap'
                          ? 'bg-amber-50/40'
                          : row.isAnomaly === 'spike'
                          ? 'bg-blue-50/40'
                          : 'odd:bg-gray-50/20'
                      }`}
                    >
                      <td className="py-1.5 px-3 font-medium text-text-primary">{row.period}</td>
                      <td className="py-1.5 px-3 font-medium text-gray-800 flex items-center gap-1.5">
                        <span>{row.group}</span>
                        {row.isAnomaly === 'gap' && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Feed Gap
                          </span>
                        )}
                        {row.isAnomaly === 'spike' && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Spike
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono tabular-nums text-text-primary font-semibold">
                        {row.value.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono tabular-nums text-text-secondary">
                        {row.rowCount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          )}
        </table>
      </div>
    </div>
  );
};

