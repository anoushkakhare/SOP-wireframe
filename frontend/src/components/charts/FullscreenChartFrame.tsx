import React from 'react';
import { ChartCard } from './ChartCard';

interface FullscreenChartFrameProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const FullscreenChartFrame: React.FC<FullscreenChartFrameProps> = ({
  title,
  onClose,
  children,
  headerAction,
}) => {
  return (
    <div className="w-full my-2 animate-in fade-in zoom-in-95 duration-150">
      <ChartCard
        title={title}
        onToggleFullscreen={onClose}
        isFullscreen={true}
        headerAction={headerAction}
      >
        {children}
      </ChartCard>
    </div>
  );
};

