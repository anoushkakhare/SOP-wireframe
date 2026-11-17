import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { useDataReviewReadiness } from '../../hooks/useDataReview';

export const ReadinessChip: React.FC = () => {
  const navigate = useNavigate();
  const { data: readiness } = useDataReviewReadiness();

  const isSignedOff = readiness?.signedOff ?? false;
  const completedSteps = readiness?.completedSteps ?? 3;
  const totalSteps = readiness?.totalSteps ?? 7;

  const handleClick = () => {
    navigate('/data-review');
  };

  if (isSignedOff) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title="Data readiness signed off. Click to view Data review"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-400/40 hover:bg-emerald-500/30 transition-colors shadow-sm cursor-pointer"
        aria-label="Data readiness: Signed off"
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
      title="Data readiness in progress. Click to view Data review"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-100 border border-amber-300/40 hover:bg-amber-400/30 transition-colors shadow-sm cursor-pointer"
      aria-label={`Data readiness: ${completedSteps}/${totalSteps} steps`}
    >
      <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
      <span>{`Data readiness: ${completedSteps}/${totalSteps} steps`}</span>
    </button>
  );
};

