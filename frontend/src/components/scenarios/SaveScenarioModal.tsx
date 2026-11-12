import React, { useState, useEffect } from 'react';
import { Modal } from '../layout/Modal';
import { Check, X } from 'lucide-react';
import { useScenarioStore } from '../../store/scenarioStore';
import { labels } from '../../constants/labels';

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export const SaveScenarioModal: React.FC<SaveScenarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { scenarios } = useScenarioStore();
  const { save: l } = labels.dialogs;

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(l.required);
      return;
    }

    const duplicate = scenarios.some(
      (s) => s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError(l.duplicate);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(trimmed);
      onClose();
    } catch (err: any) {
      setError(err.message || labels.toasts.saveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={l.title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="scenario-name-input"
            className="block text-xs font-semibold text-text-primary mb-1"
          >
            {l.fieldLabel} <span className="text-negative" aria-hidden="true">*</span>
          </label>
          <input
            id="scenario-name-input"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder={l.fieldPlaceholder}
            className={`w-full px-3 py-2 text-sm bg-surface border rounded-card focus:outline-none transition-colors tabular-nums ${
              error
                ? 'border-negative focus:ring-2 focus:ring-negative/30'
                : 'border-border focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
            }`}
            autoFocus
          />
          {error && (
            <p className="mt-1.5 text-xs text-negative font-medium animate-in fade-in" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
          {/* Cancel – neutral ghost */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary border border-border hover:bg-primary-50 hover:border-border-strong rounded-card flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {l.cancel}
          </button>

          {/* Save – primary solid */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-primary-700 hover:bg-primary-900 rounded-card flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            {isSubmitting ? l.saving : l.submit}
          </button>
        </div>
      </form>
    </Modal>
  );
};
