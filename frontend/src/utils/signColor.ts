/**
 * signColor.ts
 *
 * Returns Tailwind class-sets for positive / negative / neutral values.
 * All class names map to CSS-variable tokens in tailwind.config.js,
 * so changing a token there recolours every signed value automatically.
 *
 * S&OP sign convention:
 *   value > 0  → positive (green)
 *   value < 0  → negative (red)
 *   value === 0 or isNeutral → neutral (text-primary)
 */

export interface SignStyle {
  text:   string;   // Tailwind text-colour class
  bg:     string;   // Tailwind bg-colour class
  border: string;   // Tailwind border-colour class
  hex:    string;   // Literal hex for Recharts / SVG use
}

export function getSignColor(value: number, isNeutral = false): SignStyle {
  if (isNeutral || value === 0 || isNaN(value)) {
    return {
      text:   'text-text-primary',
      bg:     'bg-surface',
      border: 'border-border',
      hex:    '#1A1C2E',  // --color-text-primary
    };
  }

  if (value > 0) {
    return {
      text:   'text-positive',
      bg:     'bg-positive-bg',
      border: 'border-positive',
      hex:    '#1B7F55',  // --color-positive
    };
  }

  return {
    text:   'text-negative',
    bg:     'bg-negative-bg',
    border: 'border-negative',
    hex:    '#C0392B',  // --color-negative
  };
}
