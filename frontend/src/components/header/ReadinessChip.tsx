import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { useDataReviewReadiness } from '../../hooks/useDataReview';
import { DATA_REVIEW_TOTAL_STEPS } from '../../constants/dataReviewSections';

export const ReadinessChip: React.FC = () => {
  const navigate = useNavigate();
  const { data: readiness } = useDataReviewReadiness();

  const isSignedOff = readiness?.signedOff ?? false;
  const rawCompleted = readiness?.completedSteps ?? 3;
  const rawTotal = readiness?.totalSteps ?? 7;

  // Scale or derive completed steps against DATA_REVIEW_TOTAL_STEPS (6) so it cannot drift
  const totalSteps = DATA_REVIEW_TOTAL_STEPS;
  const progressRatio = rawTotal > 0 ? Math.min(1, Math.max(0, rawCompleted / rawTotal)) : 0;
  const completedSteps = isSignedOff
    ? totalSteps
    : Math.min(totalSteps, Math.max(0, Math.round(progressRatio * totalSteps)));
  const percentage = Math.round((completedSteps / totalSteps) * 100);

  const handleClick = () => {
    navigate('/data-review');
  };

  if (isSignedOff) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={`Data readiness signed off (100%). Click to view Data review`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-400/40 hover:bg-emerald-500/30 transition-colors shadow-sm cursor-pointer"
        aria-label="Data readiness: Signed off (100%)"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
        <span>Signed off</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Data readiness in progress (${completedSteps}/${totalSteps} steps, ${percentage}%). Click to view Data review`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-100 border border-amber-300/40 hover:bg-amber-400/30 transition-colors shadow-sm cursor-pointer"
      aria-label={`Data readiness: ${completedSteps}/${totalSteps} steps (${percentage}%)`}
    >
      <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
      <span>{`Data readiness: ${completedSteps}/${totalSteps} steps`}</span>
    </button>
  );
};

