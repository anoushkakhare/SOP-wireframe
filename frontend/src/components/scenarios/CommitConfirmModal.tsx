import React, { useState } from 'react';
import { Modal } from '../layout/Modal';
import { Check, X, CloudUpload } from 'lucide-react';
import { labels } from '../../constants/labels';

interface CommitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  scenarioName?: string;
}

export const CommitConfirmModal: React.FC<CommitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  scenarioName,
}) => {
  const [isCommitting, setIsCommitting] = useState(false);
  const { commit: l } = labels.dialogs;

  const handleConfirm = async () => {
    try {
      setIsCommitting(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={l.title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-50 border border-primary-300 rounded-card shrink-0">
            <CloudUpload className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary leading-relaxed">
              {l.body}
            </p>
            {scenarioName && (
              <p className="text-xs text-text-secondary mt-1">
                {l.target}: <span className="font-semibold text-text-primary">{scenarioName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
          {/* Cancel – neutral ghost */}
          <button
            type="button"
            onClick={onClose}
            disabled={isCommitting}
            className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary border border-border hover:bg-primary-50 hover:border-border-strong rounded-card flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {l.cancel}
          </button>

          {/* Commit – primary solid */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isCommitting}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-primary-700 hover:bg-primary-900 rounded-card flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            {isCommitting ? l.loading : l.confirm}
          </button>
        </div>
      </div>
    </Modal>
  );
};
