import React, { useState, useEffect } from 'react';
import { formatCompactNumber } from '../../utils/formatters';

interface EditableCellProps {
  value: number;
  isEditable: boolean;
  onChange: (newVal: number) => void;
  className?: string;
  isNegative?: boolean;
}

/**
 * EditableCell – displays a number in view mode; switches to an <input>
 * in edit mode.
 *
 * Edit-mode styling: white bg + primary-300 border (per spec).
 */
export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  isEditable,
  onChange,
  className = '',
  isNegative = false,
}) => {
  const [localVal, setLocalVal] = useState(value.toString());

  useEffect(() => {
    setLocalVal(value.toString());
  }, [value]);

  if (!isEditable) {
    const formatted = formatCompactNumber(value, { isNeutral: !isNegative, withSign: isNegative });
    return <span className={`select-none tabular-nums ${className}`}>{formatted}</span>;
  }

  const handleBlur = () => {
    const parsed = parseFloat(localVal);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else {
      setLocalVal(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="number"
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-full text-center font-semibold bg-surface text-text-primary border border-primary-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-xs tabular-nums"
    />
  );
};
