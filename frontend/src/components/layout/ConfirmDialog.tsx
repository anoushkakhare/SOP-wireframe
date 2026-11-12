import React from 'react';
import { Modal } from './Modal';
import { Check, X } from 'lucide-react';
import { labels } from '../../constants/labels';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

/**
 * ConfirmDialog – reusable modal for destructive confirmations (delete,
 * discard) and non-destructive ones (commit).
 *
 * Button palette per spec:
 *   isDestructive → solid negative red  (Delete)
 *   default       → solid primary-700   (Commit, Confirm)
 *   cancel        → neutral ghost
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          {/* Cancel – neutral ghost */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-text-secondary border border-border rounded-card hover:bg-primary-50 hover:border-border-strong flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            {cancelLabel}
          </button>

          {/* Confirm – destructive red OR primary indigo */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-card flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
              isDestructive
                ? 'bg-negative hover:bg-red-700'
                : 'bg-primary-700 hover:bg-primary-900'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {isLoading ? labels.generic.loading : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
