import React, { useMemo } from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { TreemapNode, ProductLevel } from '../../types';
import { formatCompactNumber } from '../../utils/formatters';
import { labels } from '../../constants/labels';
import { LEVELS } from '../../constants/hierarchy';
import { ChartEmptyState } from './ChartEmptyState';
import { useViewStore } from '../../store/viewStore';

// ── 6-step indigo/blue-slate palette (darker tint for header, lighter tint for tiles)
export const TREEMAP_PALETTE = [
  { header: '#1E1B4B', tile: '#C7D2FE' }, // Indigo: Dark Indigo header / Soft Indigo tint
  { header: '#1E3A8A', tile: '#BFDBFE' }, // Royal Blue: Deep Navy header / Soft Blue tint
  { header: '#0F172A', tile: '#CBD5E1' }, // Slate: Dark Slate header / Soft Slate tint
  { header: '#172554', tile: '#BAE6FD' }, // Cobalt Blue: Deep Cobalt header / Soft Sky tint
  { header: '#312E81', tile: '#DDD6FE' }, // Lavender Indigo: Deep Violet header / Soft Lavender tint
  { header: '#1E293B', tile: '#CFE0ED' }, // Blue Slate: Steel Navy header / Soft Blue-Slate tint
];

export const HEADER_HEIGHT = 22;

export function getLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function pickTextColor(bgHex: string): string {
  const cWhite = getContrastRatio(bgHex, '#FFFFFF');
  const cDark = getContrastRatio(bgHex, '#0F172A');
  return cWhite >= cDark ? '#FFFFFF' : '#0F172A';
}

interface CustomizedContentProps {
  depth?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  id?: string;
  children?: any[];
  root?: any;
  index?: number;
  drillOn?: boolean;
  onTileClick?: (id: string) => void;
  parentIndexMap?: Map<string, number>;
  measure?: string;
}

const CustomizedContent: React.FC<CustomizedContentProps> = (props) => {
  const {
    depth,
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    name = '',
    value = 0,
    id = '',
    children,
    root,
    index = 0,
    drillOn = false,
    onTileClick,
    parentIndexMap,
    measure,
  } = props;

  // Skip virtual root node at depth 0 completely (avoids ghost background text)
  if (!depth || depth === 0) return null;

  // 1. Parent group container (depth === 1 when children exist)
  if (depth === 1 && children && children.length > 0) {
    const parentIdx = parentIndexMap?.get(id) ?? parentIndexMap?.get(name) ?? index;
    const paletteIndex = parentIdx % TREEMAP_PALETTE.length;
    const headerColor = TREEMAP_PALETTE[paletteIndex].header;
    const formattedTotal = formatCompactNumber(value || 0, { isNeutral: true, measure });
    const headerWidth = width;

    // Available text space inside header band
    const maxChars = Math.max(3, Math.floor((headerWidth - 16) / 7.5));
    const labelText = `${name}  ${formattedTotal}`;
    const truncatedLabel =
      labelText.length > maxChars
        ? `${name.slice(0, Math.max(2, maxChars - formattedTotal.length - 4))}…  ${formattedTotal}`
        : labelText;

    return (
      <g className="select-none">
        {/* Full parent outline */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1}
          pointerEvents="none"
        />
        {/* Always-visible OPAQUE header band (22px) */}
        <rect
          x={x}
          y={y}
          width={headerWidth}
          height={HEADER_HEIGHT}
          fill={headerColor}
          fillOpacity={1}
          stroke="#FFFFFF"
          strokeWidth={1}
          pointerEvents="none"
        />
        {headerWidth >= 30 && (
          <text
            x={x + 6}
            y={y + 15}
            fill="#FFFFFF"
            stroke="none"
            strokeWidth={0}
            fontSize={11}
            fontWeight={700}
            className="pointer-events-none select-none"
            style={{ textShadow: 'none', fill: '#FFFFFF' }}
          >
            {truncatedLabel}
          </text>
        )}
      </g>
    );
  }

  // 2. Tile node: calculate exact position below parent's header band
  let tileX = x;
  let tileY = y;
  let tileWidth = width;
  let tileHeight = height;

  let parentIdx = index;
  if (root && depth === 2) {
    const parentY = root.y ?? 0;
    const parentHeight = root.height ?? 0;
    const usableHeight = Math.max(0, parentHeight - HEADER_HEIGHT);
    const scale = parentHeight > 0 ? usableHeight / parentHeight : 1;

    tileY = parentY + HEADER_HEIGHT + (y - parentY) * scale;
    tileHeight = height * scale;

    const pid = root.id || root.name || '';
    parentIdx = parentIndexMap?.get(pid) ?? index;
  }

  if (tileWidth <= 0 || tileHeight <= 0) return null;

  const paletteIndex = parentIdx % TREEMAP_PALETTE.length;
  const tileColor = TREEMAP_PALETTE[paletteIndex].tile;
  const textColor = pickTextColor(tileColor);

  // Label visibility: hide label when tile is smaller than 40x24px (tooltip only)
  const isLabelVisible = tileWidth >= 40 && tileHeight >= 24;
  const isTall = tileHeight > 48;
  const formattedVal = formatCompactNumber(value || 0, { isNeutral: true, measure });

  // Word wrap / truncate
  let line1 = name;
  let line2: string | null = null;
  const maxChars = Math.max(2, Math.floor((tileWidth - 12) / 7.2));

  if (isTall && name.length > maxChars) {
    const words = name.split(' ');
    if (words.length > 1) {
      line1 = '';
      let wIdx = 0;
      while (wIdx < words.length && (line1 + (line1 ? ' ' : '') + words[wIdx]).length <= maxChars) {
        line1 += (line1 ? ' ' : '') + words[wIdx];
        wIdx++;
      }
      if (!line1) {
        line1 = words[0].slice(0, Math.max(1, maxChars - 1)) + '…';
        line2 = words.slice(1).join(' ');
      } else {
        line2 = words.slice(wIdx).join(' ');
      }
      if (line2 && line2.length > maxChars) {
        line2 = line2.slice(0, Math.max(1, maxChars - 1)) + '…';
      }
    } else {
      line1 = name.slice(0, Math.max(1, maxChars - 1)) + '…';
    }
  } else if (name.length > maxChars) {
    line1 = name.slice(0, Math.max(1, maxChars - 1)) + '…';
  }

  // Show value if tile is high enough
  const showValue = isTall ? tileHeight >= 48 : tileHeight >= 36;
  const clipId = `tm-clip-${id || `${tileX.toFixed(0)}-${tileY.toFixed(0)}`}`;

  return (
    <g
      onClick={() => {
        if (drillOn && id) {
          onTileClick?.(id);
        }
      }}
      className={drillOn ? 'cursor-pointer' : 'cursor-default'}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={tileX} y={tileY} width={tileWidth} height={tileHeight} />
        </clipPath>
      </defs>

      {/* 1px white border gaps */}
      <rect
        x={tileX}
        y={tileY}
        width={tileWidth}
        height={tileHeight}
        fill={tileColor}
        stroke="#FFFFFF"
        strokeWidth={1}
        className={drillOn ? 'transition-opacity hover:opacity-85' : ''}
      />

      {isLabelVisible && (
        <g clipPath={`url(#${clipId})`}>
          <text
            x={tileX + 6}
            y={tileY + 16}
            fill={textColor}
            stroke="none"
            strokeWidth={0}
            fontSize={12}
            fontWeight={600}
            className="select-none pointer-events-none"
            style={{ textShadow: 'none', fill: textColor }}
          >
            <tspan x={tileX + 6} dy="0" fill={textColor} stroke="none">
              {line1}
            </tspan>
            {line2 && (
              <tspan x={tileX + 6} dy="14" fill={textColor} stroke="none">
                {line2}
              </tspan>
            )}
            {showValue && (
              <tspan
                x={tileX + 6}
                dy={line2 ? '15' : '15'}
                fill={textColor}
                stroke="none"
                fontSize={12}
                fontWeight={500}
                className="tabular-nums"
                style={{ fontVariantNumeric: 'tabular-nums', fill: textColor }}
              >
                {formattedVal}
              </tspan>
            )}
          </text>
        </g>
      )}
    </g>
  );
};

interface TreemapChartProps {
  data?: TreemapNode[];
  level: ProductLevel;
  productLevelNum?: number;
  isLoading?: boolean;
  isError?: boolean;
  statusCode?: number;
  onRetry?: () => void;
  drillOn?: boolean;
  onDrillDown?: (nodeId: string) => void;
}

export const TreemapChart: React.FC<TreemapChartProps> = ({
  data = [],
  isLoading = false,
  isError = false,
  statusCode,
  onRetry,
  drillOn = false,
  onDrillDown,
}) => {
  const { charts } = labels;
  const { measure, productLevel } = useViewStore();

  // Deterministic parent index map (assigned by parent index cycling)
  const parentIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((item, idx) => {
      if (item.id) map.set(item.id, idx);
      if (item.name) map.set(item.name, idx);
    });
    return map;
  }, [data]);

  // Grand total of all tiles in the treemap
  const totalValue = useMemo(() => {
    let sum = 0;
    for (const item of data) {
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          sum += child.value || 0;
        }
      } else {
        sum += item.value || 0;
      }
    }
    return sum;
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary-50 animate-pulse rounded-card">
        <span className="text-xs text-text-secondary">{charts.loading}</span>
      </div>
    );
  }

  if (isError) {
    return <ChartEmptyState isError statusCode={statusCode} onRetry={onRetry} />;
  }

  if (!data || data.length === 0) {
    return <ChartEmptyState />;
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#FFFFFF"
          type="flat"
          isAnimationActive={false}
          content={
            <CustomizedContent
              drillOn={drillOn}
              onTileClick={onDrillDown}
              parentIndexMap={parentIndexMap}
              measure={measure}
            />
          }
        >
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const node = payload[0].payload;
                // Never show faint hover tooltip for parent groups
                if (node.depth === 1 && node.children && node.children.length > 0) {
                  return null;
                }

                // Path using LEVELS labels
                const path = LEVELS.slice(0, productLevel).map((l) => l.label).join(' › ');
                const parentVal = node.parentTotal || node.root?.value || totalValue;
                const xPct = parentVal > 0 ? ((node.value || 0) / parentVal) * 100 : 100;
                const yPct = totalValue > 0 ? ((node.value || 0) / totalValue) * 100 : 0;
                const pctString =
                  productLevel === 1
                    ? `${yPct.toFixed(1)}% of total`
                    : `${xPct.toFixed(1)}% of parent · ${yPct.toFixed(1)}% of total`;

                return (
                  <div className="bg-surface border border-border p-2.5 text-xs shadow-md rounded-card space-y-1">
                    <div className="text-[11px] text-text-secondary font-medium">{path}</div>
                    <div className="font-semibold text-text-primary border-b border-border pb-1">
                      {node.name}
                    </div>
                    <div className="flex justify-between gap-4 font-semibold text-text-primary">
                      <span>Value:</span>
                      <span className="tabular-nums font-mono">
                        {formatCompactNumber(node.value || 0, { isNeutral: true, measure })}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-secondary tabular-nums">
                      {pctString}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};
