import React from 'react';

interface ScrollRegionProps {
  children: React.ReactNode;
  className?: string;
  hasBottomDock?: boolean;
}

export const ScrollRegion: React.FC<ScrollRegionProps> = ({
  children,
  className = '',
  hasBottomDock = false,
}) => {
  return (
    <main
      className={`w-full overflow-y-auto px-4 md:px-6 py-4 space-y-4 transition-all duration-300 ${
        hasBottomDock ? 'pb-[420px]' : 'pb-12'
      } ${className}`}
    >
      <div className="max-w-[1600px] mx-auto space-y-4">
        {children}
      </div>
    </main>
  );
};

