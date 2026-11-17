/**
 * Formats a numeric value into a concise human-readable string (e.g. 1.82M, +42K, -96K, +2.8%)
 */
export interface FormatOptions {
  format?: 'currency' | 'percent' | 'number';
  isNeutral?: boolean;
  withSign?: boolean;
  decimals?: number;
  measure?: string;
}

export function formatCompactNumber(
  value: number,
  options: FormatOptions = {}
): string {
  const { format = 'number', isNeutral = false, withSign = !isNeutral, decimals, measure } = options;
  const isCurrency = format === 'currency' || measure === 'value';

  if (value === 0 || isNaN(value)) {
    if (format === 'percent') return '0.0%';
    if (isCurrency) return '₹0';
    return '0';
  }

  const sign = value > 0 ? (withSign && !isNeutral ? '+' : '') : '-';
  const sym = isCurrency ? '₹' : '';
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
      : num.toFixed(2).replace(/0$/, '').replace(/\.0$/, '');
    return `${sign}${sym}${formatted}M`;
  }

  if (abs >= 1_000) {
    const num = abs / 1_000;
    const formatted = decimals !== undefined
      ? num.toFixed(decimals)
      : num % 1 === 0
      ? Math.round(num).toString()
      : num.toFixed(1).replace(/\.0$/, '');
    return `${sign}${sym}${formatted}K`;
  }

  const formatted = decimals !== undefined ? abs.toFixed(decimals) : Math.round(abs).toString();
  return `${sign}${sym}${formatted}`;
}

export function formatCurrencyValue(value: number, isNeutral = false): string {
  return formatCompactNumber(value, { format: 'currency', isNeutral });
}

export function formatPercentValue(value: number): string {
  return formatCompactNumber(value, { format: 'percent' });
}

