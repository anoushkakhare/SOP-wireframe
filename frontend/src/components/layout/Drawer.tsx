import React from 'react';
import { X } from 'lucide-react';
import { Overlay } from './Overlay';
import { labels } from '../../constants/labels';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClass?: string;
}

/**
 * Drawer – slides in from the right.
 * White surface, 1px border-strong left edge, 8px radius not needed (full height).
 */
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  widthClass = 'w-full md:w-[380px] lg:w-[28%]',
}) => {
  const drawerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <Overlay isOpen={isOpen} onClick={onClose} />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed top-0 right-0 h-full ${widthClass} bg-surface z-50 shadow-drawer flex flex-col border-l border-border-strong animate-in slide-in-from-right duration-200`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
          <h2 className="text-base font-semibold text-text-primary tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="w-7 h-7 flex items-center justify-center rounded-full border border-border hover:border-primary-700 hover:bg-primary-50 text-text-secondary hover:text-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {children}
        </div>
      </aside>
    </>
  );
};
