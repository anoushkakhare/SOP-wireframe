// Shared hierarchy constants (mirrors frontend/src/constants/hierarchy.ts)
export interface HierarchyLevel {
  id: number;
  label: string;
  color: string;
}

export const LEVELS: HierarchyLevel[] = [
  { id: 1, label: 'Category',       color: '#0F0E9A' },
  { id: 2, label: 'S&OP group',     color: '#3F6FD8' },
  { id: 3, label: 'Brand',          color: '#1B8A7A' },
  { id: 4, label: 'Forecast group', color: '#B7791F' },
  { id: 5, label: 'Forecast unit',  color: '#8B5CB8' },
];

export const LEVEL_MAP: Record<number, HierarchyLevel> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l])
);

export const APG_OPTIONS = [
  'Modern Trade',
  'General Trade',
  'E-commerce',
  'Quick Commerce',
] as const;

export type Apg = typeof APG_OPTIONS[number];

