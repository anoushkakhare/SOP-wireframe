import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Database,
  ArrowRight,
  RefreshCw,
  History,
} from 'lucide-react';
import { DataReviewFeed } from '../../types';
import { useDataReviewMutations } from '../../hooks/useDataReview';

export interface ReviewTargetState {
  mainTab: 'master' | 'transactional';
  masterSubTab?: 'product' | 'customer';
  txChartType?: 'bar' | 'line' | 'pie';
}

interface PipelineStepperCardProps {
  feeds: DataReviewFeed[];
  isLoading?: boolean;
  orderNumber?: number;
  isHistoryOpen?: boolean;
  onToggleHistory?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigateToReview?: (target: ReviewTargetState) => void;
}

export const PipelineStepperCard: React.FC<PipelineStepperCardProps> = ({
  feeds,
  isLoading,
  orderNumber = 1,
  isHistoryOpen = false,
  onToggleHistory,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  onNavigateToReview,
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
  const { loadFeed, isLoadFeedPending } = useDataReviewMutations();
  const [loadingFeedId, setLoadingFeedId] = useState<string | null>(null);

  const loadedCount = feeds.filter(f => f.status === 'loaded').length;

  const handleSimulateLoad = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoadingFeedId(id);
      await loadFeed(id);
    } finally {
      setLoadingFeedId(null);
    }
  };

  const getTargetForFeed = (feed: DataReviewFeed): ReviewTargetState => {
    switch (feed.id) {
      case 'product-master':
        return { mainTab: 'master', masterSubTab: 'product' };
      case 'customer-master':
        return { mainTab: 'master', masterSubTab: 'customer' };
      case 'price-master':
        return { mainTab: 'master', masterSubTab: 'product' };
      case 'actuals':
        return { mainTab: 'transactional', txChartType: 'bar' };
      case 'statistical-forecast':
        return { mainTab: 'transactional', txChartType: 'line' };
      default: {
        const lowerName = (feed.name || '').toLowerCase();
        if (lowerName.includes('product')) return { mainTab: 'master', masterSubTab: 'product' };
        if (lowerName.includes('customer')) return { mainTab: 'master', masterSubTab: 'customer' };
        if (lowerName.includes('price')) return { mainTab: 'master', masterSubTab: 'product' };
        if (lowerName.includes('stat') || lowerName.includes('forecast')) return { mainTab: 'transactional', txChartType: 'line' };
        if (feed.type === 'master') return { mainTab: 'master', masterSubTab: 'product' };
        return { mainTab: 'transactional', txChartType: 'bar' };
      }
    }
  };

  const handleCheckpointClick = (feed: DataReviewFeed) => {
    if (onNavigateToReview) {
      onNavigateToReview(getTargetForFeed(feed));
    }
  };

  const handleCheckpointKeyDown = (e: React.KeyboardEvent, feed: DataReviewFeed) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCheckpointClick(feed);
    }
  };

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusChip = (status: string, delayHours?: number) => {
    switch (status) {
      case 'loaded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Loaded
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 border border-red-300">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Delayed {delayHours ? `(+${delayHours}h)` : ''}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3 h-3 text-red-600" />
            Failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
    }
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'loaded':
        return 'bg-emerald-500 text-white ring-4 ring-emerald-100';
      case 'delayed':
      case 'failed':
        return 'bg-red-500 text-white ring-4 ring-red-100';
      case 'pending':
      default:
        return 'bg-amber-500 text-white ring-4 ring-amber-100';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
      {/* Card Header (clickable to collapse) */}
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
            <h2 className="text-base font-bold text-gray-900">
              Integration pipeline & schedule
            </h2>
            <p className="text-xs text-gray-500">
              Horizontal stepper showing feed ingestion status and expected vs loaded time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onToggleHistory && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHistory();
              }}
              aria-expanded={isHistoryOpen}
              className="text-xs font-semibold text-primary-700 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded px-2.5 py-1 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <History className="w-3.5 h-3.5" />
              {isHistoryOpen ? 'Hide History' : 'View History'}
            </button>
          )}

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              loadedCount === feeds.length
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            {loadedCount}/{feeds.length} Feeds loaded
          </span>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Card Body */}
      {!isCollapsed && (
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Loading pipeline feeds...
            </div>
          ) : (
            <div className="w-full overflow-x-auto pb-3">
              {/* Horizontal Stepper Container */}
              <div className="min-w-[820px] flex items-start justify-between relative px-2 pt-2">
                {feeds.map((feed, idx) => {
                  const isLast = idx === feeds.length - 1;
                  const isLoaded = feed.status === 'loaded';
                  const expectedFormatted = formatDateTime(feed.expectedDate);
                  const loadedFormatted = formatDateTime(feed.loadedAt);
                  const isCurrentlyLoading = loadingFeedId === feed.id || isLoadFeedPending;

                  return (
                    <div
                      key={feed.id}
                      className="flex-1 flex flex-col items-center relative text-center px-2"
                    >
                      {/* Connecting Line to Next Step */}
                      {!isLast && (
                        <div
                          className={`absolute top-4 left-[50%] right-[-50%] h-0.5 z-0 ${
                            isLoaded && feeds[idx + 1]?.status === 'loaded'
                              ? 'bg-emerald-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      )}

                      {/* Step Clickable Checkpoint (Circle + Label) */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleCheckpointClick(feed)}
                        onKeyDown={(e) => handleCheckpointKeyDown(e, feed)}
                        aria-label={`Navigate to ${feed.name} view in Data review`}
                        className="group flex flex-col items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-1.5 transition-all hover:bg-gray-50/80 active:scale-95"
                      >
                        {/* Step Circle Node */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 shadow-sm transition-transform group-hover:scale-110 ${getNodeColor(
                            feed.status
                          )}`}
                        >
                          {isLoaded ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : feed.status === 'delayed' || feed.status === 'failed' ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>

                        {/* Step Label */}
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight underline-offset-2 group-hover:underline">
                            {feed.name}
                          </span>
                        </div>
                      </div>

                      {/* Step Sub-Content (Details & Actions) */}
                      <div className="mt-1 flex flex-col items-center w-full">
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 uppercase font-medium tracking-wide">
                            {feed.type}
                          </span>
                          {getStatusChip(feed.status, feed.delayHours)}
                        </div>

                        {/* Expected vs Loaded Time */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 w-full text-[11px] text-gray-600 space-y-1">
                          <div className="flex justify-between items-center text-left">
                            <span className="text-gray-400 font-medium">Expected:</span>
                            <span className="font-semibold text-gray-800">
                              {expectedFormatted || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-left">
                            <span className="text-gray-400 font-medium">Loaded:</span>
                            <span
                              className={`font-semibold ${
                                isLoaded
                                  ? 'text-emerald-700'
                                  : feed.status === 'delayed'
                                  ? 'text-red-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {loadedFormatted || (feed.status === 'delayed' ? `Delayed (+${feed.delayHours || 14}h)` : 'Pending')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-left pt-1 border-t border-gray-200/60 text-[10px] text-gray-500">
                            <span>{feed.source}</span>
                            <span className="font-medium text-gray-700">
                              {feed.rowCount ? `${feed.rowCount.toLocaleString()} rows` : '0 rows'}
                            </span>
                          </div>
                        </div>

                        {/* Simulate / Retry Load Action for testing */}
                        {!isLoaded && (
                          <button
                            type="button"
                            onClick={(e) => handleSimulateLoad(feed.id, e)}
                            disabled={isCurrentlyLoading}
                            className="mt-2 text-[10px] font-semibold text-primary-700 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded px-2 py-0.5 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${isCurrentlyLoading ? 'animate-spin' : ''}`}
                            />
                            Simulate Load
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

