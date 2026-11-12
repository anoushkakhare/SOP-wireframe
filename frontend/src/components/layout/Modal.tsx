import React from 'react';
import { X } from 'lucide-react';
import { Overlay } from './Overlay';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

/**
 * Modal – centred dialog overlay.
 * Uses design-system tokens: white surface, indigo border on header close btn.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  showCloseButton = true,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`w-full ${maxWidth} bg-surface rounded-card border border-border-strong shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
            <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="w-7 h-7 flex items-center justify-center rounded-full border border-border hover:border-primary-700 hover:bg-primary-50 text-text-secondary hover:text-primary-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </>
  );
};
