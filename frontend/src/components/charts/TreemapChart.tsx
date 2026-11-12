import React from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { TreemapNode, ProductLevel } from '../../types';
import { formatCompactNumber } from '../../utils/formatters';
import { labels } from '../../constants/labels';

// ── Treemap brand colours – one indigo tint per parent brand (darkest → lightest)
const TREEMAP_BRAND_COLORS = [
  '#0F0E9A',  // primary-700
  '#2B2AB0',  // primary-600
  '#4F4EC6',  // primary-500
  '#7A79D6',
  '#A3A2E2',  // primary-300
  '#C9C8EC',
];

// Map brand name → index for deterministic colour
const brandColorIndex: Record<string, number> = {};
let brandColorCounter = 0;

function getBrandColor(brand: string): string {
  if (brandColorIndex[brand] === undefined) {
    brandColorIndex[brand] = brandColorCounter % TREEMAP_BRAND_COLORS.length;
    brandColorCounter++;
  }
  return TREEMAP_BRAND_COLORS[brandColorIndex[brand]];
}

/** Determine whether text should be white or dark based on tile colour lightness */
function textColorForBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.42 ? '#FFFFFF' : '#000000';
}

// Custom treemap node renderer
const CustomizedContent: React.FC<any> = (props) => {
  const { depth, x, y, width, height, name, value, brand, color } = props;

  // Brand group border – no fill
  if (depth === 1 && props.children && props.children.length > 0) {
    return (
      <g>
        <rect
          x={x} y={y} width={width} height={height}
          fill="none"
          stroke="#2B2AB0"
          strokeWidth={1.5}
        />
        {height > 26 && width > 50 && (
          <text
            x={x + 7} y={y + 15}
            fill="#1A1C2E"
            fontSize={11}
            fontWeight={700}
            className="select-none"
          >
            {name}
          </text>
        )}
      </g>
    );
  }

  const tileColor = color || getBrandColor(brand || name);
  const textColor = textColorForBg(tileColor);

  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        fill={tileColor}
        stroke="#FFFFFF"
        strokeWidth={1}
        className="transition-opacity hover:opacity-85 cursor-pointer"
      />
      {width > 42 && height > 28 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (height > 44 ? 6 : 0)}
          textAnchor="middle"
          fill={textColor}
          fontSize={10}
          fontWeight={600}
          className="select-none pointer-events-none"
        >
          {name}
        </text>
      )}
      {width > 42 && height > 44 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill={textColor}
          fontSize={9}
          className="select-none pointer-events-none"
        >
          {formatCompactNumber(value || 0, { isNeutral: true })}
        </text>
      )}
    </g>
  );
};

interface TreemapChartProps {
  data?: TreemapNode[];
  level: ProductLevel;
  isLoading?: boolean;
}

export const TreemapChart: React.FC<TreemapChartProps> = ({
  data = [],
  level,
  isLoading = false,
}) => {
  const { charts } = labels;

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary-50 animate-pulse rounded-card">
        <span className="text-xs text-text-secondary">{charts.loading}</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-text-secondary">
        {charts.noData}
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#FFFFFF"
          content={<CustomizedContent />}
        >
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const node = payload[0].payload;
                return (
                  <div className="bg-surface border border-border p-2.5 text-xs shadow-md rounded-card space-y-1">
                    <div className="font-semibold text-text-primary border-b border-border pb-1">{node.name}</div>
                    {node.brand && (
                      <div className="text-[11px] text-text-secondary">
                        {charts.tooltip.brand}: {node.brand}
                      </div>
                    )}
                    <div className="flex justify-between gap-4 font-semibold text-text-primary">
                      <span>{charts.tooltip.value}:</span>
                      <span className="tabular-nums">{formatCompactNumber(node.value || 0, { isNeutral: true })}</span>
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
