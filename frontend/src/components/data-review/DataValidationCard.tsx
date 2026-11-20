import React, { useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  RefreshCw,
  HelpCircle,
  X,
} from 'lucide-react';
import {
  useDataReviewValidation,
  useDataReviewMutations,
} from '../../hooks/useDataReview';
import { useUiStore } from '../../store/uiStore';
import { MappingGapRow, NullValueRow } from '../../types';

interface DataValidationCardProps {
  orderNumber?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DataValidationCard: React.FC<DataValidationCardProps> = ({
  orderNumber = 4,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleCardToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };
  const [activeTab, setActiveTab] = useState<'mapping' | 'nulls' | 'missing'>('mapping');

  // Fix mapping gap modal state
  const [fixingMappingRow, setFixingMappingRow] = useState<MappingGapRow | null>(null);
  const [mappingFixType, setMappingFixType] = useState<'master' | 'transaction'>('master');
  const [mappingMenuOpenId, setMappingMenuOpenId] = useState<string | null>(null);

  // Replace null value modal state
  const [replacingNullRow, setReplacingNullRow] = useState<NullValueRow | null>(null);
  const [replaceMethod, setReplaceMethod] = useState<'zero' | 'mean' | 'median'>('mean');
  const [nullMenuOpenId, setNullMenuOpenId] = useState<string | null>(null);

  const { data: validation, isLoading } = useDataReviewValidation();
  const {
    fixMappingGap,
    isFixMappingGapPending,
    replaceNullValue,
    isReplaceNullValuePending,
    rerunMissingIntegration,
    isRerunPending,
  } = useDataReviewMutations();
  const { addToast } = useUiStore();

  const mappingGaps = validation?.mappingGaps || { count: 0, rows: [] };
  const nullValues = validation?.nullValues || { count: 0, rows: [] };
  const missingItems = validation?.missingItems || { count: 0, rows: [] };

  const totalIssues = mappingGaps.count + nullValues.count + missingItems.count;

  // Confirm Fix Mapping Gap
  const handleConfirmFixMapping = async () => {
    if (!fixingMappingRow) return;
    try {
      await fixMappingGap({ id: fixingMappingRow.id, fixType: mappingFixType });
      addToast(
        `Mapping gap for ${fixingMappingRow.transactionCode} marked as fixed (${mappingFixType === 'master' ? 'Master Data' : 'Transaction Code'})`,
        'success'
      );
      setFixingMappingRow(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to fix mapping gap', 'error');
    }
  };

  // Confirm Replace Null Value
  const handleConfirmReplaceNull = async () => {
    if (!replacingNullRow) return;
    try {
      await replaceNullValue({ id: replacingNullRow.id, method: replaceMethod });
      addToast(
        `Replaced null value in ${replacingNullRow.column} with ${replaceMethod}`,
        'success'
      );
      setReplacingNullRow(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to replace null value', 'error');
    }
  };

  // Re-run integration
  const handleRerunIntegration = async () => {
    try {
      await rerunMissingIntegration();
      addToast(
        'Integration pipeline re-run initiated. Affected feeds set to pending.',
        'info'
      );
    } catch (err: any) {
      addToast(err.message || 'Failed to trigger integration re-run', 'error');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <button
        type="button"
        onClick={handleCardToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors cursor-pointer border-b border-gray-100"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm">
            {orderNumber}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Data validation</h2>
            <p className="text-xs text-gray-500">
              Automated integrity verification, transaction-to-master mapping gaps & null resolution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {totalIssues === 0 ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Checks Passed (100%)
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              {totalIssues} issue{totalIssues > 1 ? 's' : ''} detected
            </span>
          )}
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
          {/* Tab buttons */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('mapping')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'mapping'
                  ? 'bg-primary-50 text-primary-800 border border-primary-200 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>1. Mapping gaps</span>
              {mappingGaps.count > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                  {mappingGaps.count}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  0
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nulls')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'nulls'
                  ? 'bg-primary-50 text-primary-800 border border-primary-200 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>2. Blank / null values</span>
              {nullValues.count > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {nullValues.count}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  0
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('missing')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'missing'
                  ? 'bg-primary-50 text-primary-800 border border-primary-200 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>3. Missing columns / rows</span>
              {missingItems.count > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                  {missingItems.count}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  0
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: Transaction-to-master mapping gaps */}
          {activeTab === 'mapping' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    Transaction-to-master mapping gaps
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Unmapped transactional product codes causing hierarchy reconciliation breaks
                  </p>
                </div>
                <div>
                  {mappingGaps.count > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                      {mappingGaps.count} missing product mappings
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      0 missing product mappings
                    </span>
                  )}
                </div>
              </div>

              {/* Table (5 rows, scrollable) */}
              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Transaction Code</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3 text-right">Value</th>
                      <th className="py-2.5 px-3">Suggested Master</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mappingGaps.rows.map(row => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          row.fixed ? 'bg-emerald-50/40' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-medium text-gray-900">
                          {row.transactionCode}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 max-w-[200px] truncate" title={row.description}>
                          {row.description}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                          {row.period}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-gray-900 whitespace-nowrap">
                          £{row.value.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 max-w-[220px] truncate" title={row.suggestedMaster}>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px]">
                            {row.suggestedMaster}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center relative">
                          {row.fixed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Fixed
                            </span>
                          ) : (
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() =>
                                  setMappingMenuOpenId(
                                    mappingMenuOpenId === row.id ? null : row.id
                                  )
                                }
                                className="px-3 py-1 text-xs font-semibold rounded-md bg-primary-700 text-white hover:bg-primary-800 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <Wrench className="w-3 h-3" />
                                Fix
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {/* Menu: Fix master data / Fix transaction code */}
                              {mappingMenuOpenId === row.id && (
                                <div className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-30 animate-in fade-in zoom-in-95">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFixingMappingRow(row);
                                      setMappingFixType('master');
                                      setMappingMenuOpenId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                                  >
                                    Fix master data
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFixingMappingRow(row);
                                      setMappingFixType('transaction');
                                      setMappingMenuOpenId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer border-t border-gray-100"
                                  >
                                    Fix transaction code
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Blank / null values */}
          {activeTab === 'nulls' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    Blank / null values
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Critical attributes requiring statistical or zero replacement imputation
                  </p>
                </div>
                <div>
                  {nullValues.count > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                      {nullValues.count} null critical values
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      0 null values
                    </span>
                  )}
                </div>
              </div>

              {/* Table: column, row, expected */}
              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Column</th>
                      <th className="py-2.5 px-3">Row / Feed Location</th>
                      <th className="py-2.5 px-3">Expected Format</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {nullValues.rows.map(row => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          row.fixed ? 'bg-emerald-50/40' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {row.column}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 font-mono text-[11px]">
                          {row.row}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px]">
                            {row.expected}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center relative">
                          {row.fixed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Replaced ({row.replacedWith || 'mean'})
                            </span>
                          ) : (
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() =>
                                  setNullMenuOpenId(
                                    nullMenuOpenId === row.id ? null : row.id
                                  )
                                }
                                className="px-3 py-1 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                Replace
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {/* Menu: zero, mean, mode */}
                              {nullMenuOpenId === row.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-30 animate-in fade-in zoom-in-95">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplacingNullRow(row);
                                      setReplaceMethod('zero');
                                      setNullMenuOpenId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                                  >
                                    Zero (0)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplacingNullRow(row);
                                      setReplaceMethod('mean');
                                      setNullMenuOpenId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer border-t border-gray-100"
                                  >
                                    Mean (Average)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplacingNullRow(row);
                                      setReplaceMethod('median');
                                      setNullMenuOpenId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer border-t border-gray-100"
                                  >
                                    Median (Middle)
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Missing columns / rows */}
          {activeTab === 'missing' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    Missing columns & rows
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pipeline schema exceptions & incomplete feed extractions
                  </p>
                </div>
                <div>
                  {missingItems.count > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                      {missingItems.count} feed exceptions
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      0 exceptions
                    </span>
                  )}
                </div>
              </div>

              {/* Small list */}
              <div className="space-y-2">
                {missingItems.rows.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-100 text-primary-800 border border-primary-200">
                            Feed: {item.feedName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 mt-1">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Re-run integration button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleRerunIntegration}
                  disabled={isRerunPending}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800 transition-colors cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRerunPending ? 'animate-spin' : ''}`} />
                  Re-run integration
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Placeholder dialog "Handled in the final release" */}
      {fixingMappingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-200 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-primary-700">
                <HelpCircle className="w-5 h-5 text-primary-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Handled in the final release
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFixingMappingRow(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p>
                Fix method:{' '}
                <span className="font-semibold text-gray-900">
                  {mappingFixType === 'master'
                    ? 'Fix master data mapping'
                    : 'Fix transaction code'}
                </span>
              </p>
              <p>
                Transaction:{' '}
                <span className="font-mono font-medium text-gray-900">
                  {fixingMappingRow.transactionCode}
                </span>{' '}
                ({fixingMappingRow.description})
              </p>
              <p>
                Suggested master:{' '}
                <span className="font-medium text-primary-800">
                  {fixingMappingRow.suggestedMaster}
                </span>
              </p>
              <p className="text-[11px] text-gray-500 pt-1 italic">
                In this preview release, confirming will flag the row as resolved and decrement the validation count. Production automated mapping rules will execute in the final release.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFixingMappingRow(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFixMapping}
                disabled={isFixMappingGapPending}
                className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary-700 text-white hover:bg-primary-800 cursor-pointer disabled:opacity-50"
              >
                {isFixMappingGapPending ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm replace null value modal */}
      {replacingNullRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-200 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-700">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Confirm Value Replacement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReplacingNullRow(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p>
                Column:{' '}
                <span className="font-semibold text-gray-900">
                  {replacingNullRow.column}
                </span>{' '}
                ({replacingNullRow.row})
              </p>
              <p>
                Replacement rule:{' '}
                <span className="font-bold text-amber-800 uppercase">
                  {replaceMethod}
                </span>
              </p>
              <p className="text-[11px] text-gray-500 pt-1">
                Confirming replaces the missing value across all affected pipeline records with the selected imputation strategy.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReplacingNullRow(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReplaceNull}
                disabled={isReplaceNullValuePending}
                className="px-4 py-1.5 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700 cursor-pointer disabled:opacity-50"
              >
                {isReplaceNullValuePending ? 'Replacing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

