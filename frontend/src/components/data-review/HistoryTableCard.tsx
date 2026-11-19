import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  RefreshCw,
  History,
} from 'lucide-react';
import { DataReviewHistoryItem, FeedStatus } from '../../types';

interface HistoryTableCardProps {
  history: DataReviewHistoryItem[];
  isLoading?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const HistoryTableCard: React.FC<HistoryTableCardProps> = ({
  history,
  isLoading,
  isExpanded,
  onToggleExpand,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = isExpanded !== undefined ? !isExpanded : internalCollapsed;

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const [statusFilter, setStatusFilter] = useState<'all' | FeedStatus>('all');

  const filteredHistory = history.filter(item => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: FeedStatus) => {
    switch (status) {
      case 'loaded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Loaded
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Delayed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3 h-3 text-red-600" />
            Failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
    }
  };

  const filterOptions: Array<{ label: string; value: 'all' | FeedStatus }> = [
    { label: 'All', value: 'all' },
    { label: 'Loaded', value: 'loaded' },
    { label: 'Delayed', value: 'delayed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors cursor-pointer border-b border-gray-100"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Integration status & history
            </h2>
            <p className="text-xs text-gray-500">
              Last 20 loads with execution status, source, and red delay metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            {history.length} Total records
          </span>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-5">
          {/* Status Filter Bar */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-600">Status filter:</span>
              <div className="flex items-center gap-1 ml-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                {filterOptions.map(opt => {
                  const count =
                    opt.value === 'all'
                      ? history.length
                      : history.filter(h => h.status === opt.value).length;
                  const isActive = statusFilter === opt.value;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatusFilter(opt.value)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-white text-gray-900 shadow-xs font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-primary-100 text-primary-800'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Showing {filteredHistory.length} of {history.length} records
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Loading history records...
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Feed Name</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Cycle</th>
                    <th className="px-3 py-3">Expected Date</th>
                    <th className="px-3 py-3">Loaded At</th>
                    <th className="px-3 py-3">Status</th>
                    {/* Red delay column when > 0 */}
                    <th className="px-4 py-3 text-right">Delay</th>
                    <th className="px-4 py-3 text-right">Row Count</th>
                    <th className="px-4 py-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredHistory.map(item => {
                    const isDelayed = item.delayHours > 0;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                          {item.feedName}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase font-medium">
                            {item.type}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-600 font-medium">
                          {item.cycle}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-500">
                          {formatDateTime(item.expectedDate)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-500">
                          {formatDateTime(item.loadedAt)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                        {/* Red delay column when >0 */}
                        <td className="px-4 py-3 text-right whitespace-nowrap font-mono">
                          {isDelayed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-red-700 bg-red-50 border border-red-200">
                              +{item.delayHours.toFixed(1)}h
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium text-xs">
                              0.0h
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-gray-700">
                          {item.rowCount ? item.rowCount.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                          {item.source}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

