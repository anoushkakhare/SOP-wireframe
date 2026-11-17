import React, { useState, useEffect } from 'react';
import { formatCompactNumber } from '../../utils/formatters';

interface EditableCellProps {
  value: number;
  originalValue?: number;
  isEditable: boolean;
  rowType?: 'forecast' | 'opportunity' | 'risk';
  onChange: (newVal: number) => void;
  onRevert?: () => void;
  hasEdit?: boolean;
  className?: string;
  isNegative?: boolean;
  measure?: string;
}

/**
 * EditableCell – displays a number in view mode; switches to an <input>
 * in edit mode.
 *
 * Edit-mode styling: white bg + primary-300 border (per spec).
 */
export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  originalValue,
  isEditable,
  rowType = 'forecast',
  onChange,
  onRevert,
  hasEdit = false,
  className = '',
  isNegative = false,
  measure,
}) => {
  const [localVal, setLocalVal] = useState(value.toString());
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    setLocalVal(value.toString());
  }, [value]);

  useEffect(() => {
    if (inlineError) {
      const timer = setTimeout(() => setInlineError(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [inlineError]);

  if (!isEditable) {
    const formatted = formatCompactNumber(value, {
      isNeutral: !isNegative,
      withSign: isNegative || rowType === 'opportunity',
      measure,
    });
    return (
      <span className={`relative inline-block select-none tabular-nums ${className}`}>
        {formatted}
        {hasEdit && (
          <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-primary-600" />
        )}
      </span>
    );
  }

  const commitValue = () => {
    const trimmed = localVal.trim();
    if (trimmed === '' || isNaN(Number(trimmed))) {
      setInlineError('Required');
      const reverted = originalValue !== undefined ? originalValue : value;
      setLocalVal(reverted.toString());
      onRevert?.();
      return;
    }

    let parsed = parseFloat(trimmed);
    if (isNaN(parsed)) {
      setInlineError('Invalid');
      const reverted = originalValue !== undefined ? originalValue : value;
      setLocalVal(reverted.toString());
      onRevert?.();
      return;
    }

    if (rowType === 'opportunity') {
      if (parsed < 0) {
        setInlineError('Must be ≥ 0');
        const reverted = originalValue !== undefined ? originalValue : value;
        setLocalVal(reverted.toString());
        onRevert?.();
        return;
      }
    } else if (rowType === 'risk') {
      if (parsed > 0) {
        parsed = -parsed;
      }
    }

    setInlineError(null);
    setLocalVal(parsed.toString());
    onChange(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInlineError(null);
      const reverted = originalValue !== undefined ? originalValue : value;
      setLocalVal(reverted.toString());
      onRevert?.();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="relative w-full flex items-center justify-center">
      <input
        type="number"
        value={localVal}
        onChange={(e) => {
          setLocalVal(e.target.value);
          if (inlineError) setInlineError(null);
        }}
        onBlur={commitValue}
        onKeyDown={handleKeyDown}
        className={`w-full text-center font-semibold bg-surface text-text-primary border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-xs tabular-nums ${
          inlineError
            ? 'border-negative ring-1 ring-negative'
            : hasEdit
            ? 'border-primary-500 font-bold'
            : 'border-primary-300'
        }`}
      />
      {hasEdit && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary-600 pointer-events-none" />
      )}
      {inlineError && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 z-30 px-1.5 py-0.5 bg-negative text-white text-[10px] font-medium rounded shadow whitespace-nowrap pointer-events-none">
          {inlineError}
        </div>
      )}
    </div>
  );
};
