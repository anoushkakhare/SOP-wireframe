/**
 * Formats a numeric value into a concise human-readable string (e.g. 1.82M, +42K, -96K, +2.8%)
 */
export interface FormatOptions {
  format?: 'currency' | 'percent' | 'number';
  isNeutral?: boolean;
  withSign?: boolean;
  decimals?: number;
}

export function formatCompactNumber(
  value: number,
  options: FormatOptions = {}
): string {
  const { format = 'number', isNeutral = false, withSign = !isNeutral, decimals } = options;

  if (value === 0 || isNaN(value)) {
    if (format === 'percent') return '0.0%';
    return '0';
  }

  const sign = value > 0 ? (withSign && !isNeutral ? '+' : '') : '-';
  const abs = Math.abs(value);

  if (format === 'percent') {
    const formatted = decimals !== undefined ? abs.toFixed(decimals) : abs.toFixed(1);
    return `${sign}${formatted}%`;
  }

  if (abs >= 1_000_000) {
    const num = abs / 1_000_000;
    const formatted = decimals !== undefined
      ? num.toFixed(decimals)
      : num % 1 === 0
      ? num.toFixed(0)
      : num.toFixed(2).replace(/\.?0+$/, (match, offset) => {
          // Keep up to 2 decimal places, e.g. 1.82M
          return match.length === 3 ? '' : match;
        });
    return `${sign}${num.toFixed(2)}M`;
  }

  if (abs >= 1_000) {
    const num = abs / 1_000;
    const formatted = decimals !== undefined
      ? num.toFixed(decimals)
      : Math.round(num).toString();
    return `${sign}${formatted}K`;
  }

  const formatted = decimals !== undefined ? abs.toFixed(decimals) : Math.round(abs).toString();
  return `${sign}${formatted}`;
}

export function formatCurrencyValue(value: number, isNeutral = false): string {
  return formatCompactNumber(value, { format: 'currency', isNeutral });
}

export function formatPercentValue(value: number): string {
  return formatCompactNumber(value, { format: 'percent' });
}

