import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  CheckSquare,
  Square,
  Lock,
  Unlock,
} from 'lucide-react';
import { DataReviewReadinessResponse } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useDataReviewMutations } from '../../hooks/useDataReview';

interface SignoffCardProps {
  readiness: DataReviewReadinessResponse | undefined;
  isLoading?: boolean;
}

export const SignoffCard: React.FC<SignoffCardProps> = ({
  readiness,
  isLoading,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuthStore();
  const { updateReadiness, isUpdateReadinessPending, signoff, isSignoffPending, reopen, isReopenPending } =
    useDataReviewMutations();

  const isSignedOff = readiness?.signedOff ?? false;
  const checklist = readiness?.checklist ?? [];
  const blockingItems = readiness?.blockingItems ?? [];

  // All 5 checklist items must be ticked/checked
  const isAllTicked = checklist.length > 0 && checklist.every(item => item.checked);

  const handleToggleManualCheck = async (itemId: string, currentVal: boolean) => {
    if (isSignedOff) return; // Locked when signed off
    if (itemId === 'innovation_reviewed') {
      await updateReadiness({ innovationReviewed: !currentVal });
    } else if (itemId === 'combo_packs_reviewed') {
      await updateReadiness({ comboPacksReviewed: !currentVal });
    }
  };

  const handleSignoff = async () => {
    if (!isAllTicked || isSignedOff) return;
    await signoff({
      signedBy: user?.name || 'Demand Planner',
      signedAt: new Date().toISOString(),
      cycle: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    });
  };

  const handleReopen = async () => {
    await reopen();
  };

  const formatSignoffDate = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors cursor-pointer border-b border-gray-100"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm">
            7
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Sign-off</h2>
            <p className="text-xs text-gray-500">
              Data readiness verification checklist & planning cycle sign-off gate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSignedOff ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Signed off
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Sign-off pending
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
        <div className="p-6">
          {/* If Signed Off: Show Signed off banner and Reopen button */}
          {isSignedOff ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">
                      Signed off by {readiness?.signoff?.signedBy || user?.name || 'Demand Planner'} on{' '}
                      {formatSignoffDate(readiness?.signoff?.signedAt)}
                    </h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Cycle: {readiness?.signoff?.cycle || 'Current'} • All 7 readiness steps completed
                      and validated.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={isReopenPending}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isReopenPending ? 'animate-spin' : ''}`} />
                  Reopen
                </button>
              </div>
            </div>
          ) : null}

          {/* Checklist */}
          <div className="space-y-3 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Readiness Checklist
            </h3>

            {checklist.map(item => {
              const isChecked = item.checked;
              const isManual = item.isManual;

              return (
                <div
                  key={item.id}
                  onClick={() => isManual && handleToggleManualCheck(item.id, isChecked)}
                  className={`p-3.5 rounded-lg border flex items-start justify-between gap-3 transition-colors ${
                    isManual && !isSignedOff ? 'cursor-pointer hover:bg-gray-50' : ''
                  } ${
                    isChecked
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox Icon */}
                    <div className="mt-0.5 shrink-0">
                      {isManual ? (
                        isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        )
                      ) : isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isChecked ? 'text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {item.label}
                        </span>
                        {isManual ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                            Manual tick
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-medium">
                            System verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.details}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isChecked ? (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Complete
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Blocking items banner if incomplete and not signed off */}
          {!isSignedOff && blockingItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    Cannot sign off yet. Blocked by {blockingItems.length} item{blockingItems.length > 1 ? 's' : ''}:
                  </h4>
                  <ul className="list-disc list-inside text-xs text-amber-800 mt-1 space-y-0.5">
                    {blockingItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Sign off Action Button */}
          {!isSignedOff && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {isAllTicked
                  ? 'All criteria fulfilled. Ready for cycle sign-off.'
                  : 'Complete all checklist items to unlock sign-off.'}
              </div>

              <button
                type="button"
                onClick={handleSignoff}
                disabled={!isAllTicked || isSignoffPending}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
                  isAllTicked && !isSignoffPending
                    ? 'bg-primary-700 text-white hover:bg-primary-800 cursor-pointer shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isAllTicked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isSignoffPending ? 'Signing off...' : 'Sign off data readiness'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

