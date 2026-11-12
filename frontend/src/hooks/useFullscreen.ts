import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';

export function useFullscreen() {
  const { fullscreenChartId, setFullscreenChartId } = useUiStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenChartId) {
        setFullscreenChartId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenChartId, setFullscreenChartId]);

  return {
    fullscreenChartId,
    openFullscreen: (id: string) => setFullscreenChartId(id),
    closeFullscreen: () => setFullscreenChartId(null),
    isFullscreen: (id: string) => fullscreenChartId === id,
  };
}

