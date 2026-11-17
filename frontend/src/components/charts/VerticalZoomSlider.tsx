import React, { useRef, useCallback } from 'react';

interface VerticalZoomSliderProps {
  zoomRange: [number, number]; // [bottomPct, topPct], 0 to 100.
  onChange: (range: [number, number]) => void;
  className?: string;
}

export const VerticalZoomSlider: React.FC<VerticalZoomSliderProps> = ({
  zoomRange,
  onChange,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragTypeRef = useRef<'top' | 'bottom' | 'window' | null>(null);
  const dragStartRef = useRef<{ y: number; range: [number, number] }>({ y: 0, range: [0, 100] });

  const [bottom, top] = zoomRange;

  const getPercentFromY = useCallback((clientY: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(rect.height, relativeY));
    // Y=0 is top (100%), Y=height is bottom (0%)
    const pctFromBottom = ((rect.height - clampedY) / rect.height) * 100;
    return Math.round(pctFromBottom);
  }, []);

  const handlePointerDown = (type: 'top' | 'bottom' | 'window', e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragTypeRef.current = type;
    dragStartRef.current = { y: e.clientY, range: [...zoomRange] };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragTypeRef.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const deltaY = e.clientY - dragStartRef.current.y;
    // Downwards mouse movement decreases percentage from bottom
    const deltaPct = -(deltaY / rect.height) * 100;

    const [startBottom, startTop] = dragStartRef.current.range;

    if (dragTypeRef.current === 'top') {
      const newTop = Math.max(startBottom + 5, Math.min(100, Math.round(startTop + deltaPct)));
      onChange([startBottom, newTop]);
    } else if (dragTypeRef.current === 'bottom') {
      const newBottom = Math.max(0, Math.min(startTop - 5, Math.round(startBottom + deltaPct)));
      onChange([newBottom, startTop]);
    } else if (dragTypeRef.current === 'window') {
      const span = startTop - startBottom;
      let newBottom = startBottom + deltaPct;
      let newTop = startTop + deltaPct;
      if (newBottom < 0) {
        newBottom = 0;
        newTop = span;
      }
      if (newTop > 100) {
        newTop = 100;
        newBottom = 100 - span;
      }
      onChange([Math.round(newBottom), Math.round(newTop)]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragTypeRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (dragTypeRef.current) return;
    const pct = getPercentFromY(e.clientY);
    const distToBottom = Math.abs(pct - bottom);
    const distToTop = Math.abs(pct - top);
    if (distToTop <= distToBottom) {
      onChange([bottom, Math.max(bottom + 5, pct)]);
    } else {
      onChange([Math.min(top - 5, pct), top]);
    }
  };

  return (
    <div
      className={`relative h-full flex flex-col items-center justify-center select-none py-2 px-1 ${className}`}
      title="Y-axis zoom slider: drag handles to zoom"
    >
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative w-2.5 h-full bg-slate-100 border border-slate-300 rounded-full cursor-pointer flex justify-center"
      >
        {/* Selected Window */}
        <div
          onPointerDown={(e) => handlePointerDown('window', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            bottom: `${bottom}%`,
            height: `${top - bottom}%`,
          }}
          className="absolute w-full bg-primary-600/25 border-y border-primary-600 cursor-ns-resize rounded-sm"
        />

        {/* Top Handle */}
        <div
          onPointerDown={(e) => handlePointerDown('top', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ bottom: `calc(${top}% - 6px)` }}
          aria-label="Zoom top handle"
          className="absolute w-3.5 h-3 bg-white border border-primary-700 rounded shadow-xs cursor-ns-resize hover:scale-110 active:scale-110 transition-transform flex items-center justify-center z-10"
        >
          <div className="w-1.5 h-0.5 bg-primary-700 rounded-full" />
        </div>

        {/* Bottom Handle */}
        <div
          onPointerDown={(e) => handlePointerDown('bottom', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ bottom: `calc(${bottom}% - 6px)` }}
          aria-label="Zoom bottom handle"
          className="absolute w-3.5 h-3 bg-white border border-primary-700 rounded shadow-xs cursor-ns-resize hover:scale-110 active:scale-110 transition-transform flex items-center justify-center z-10"
        >
          <div className="w-1.5 h-0.5 bg-primary-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};
