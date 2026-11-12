import React from 'react';
import { useUiStore, ToastItem } from '../../store/uiStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
    >
      {toasts.map((toast: ToastItem) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        const style = isSuccess
          ? 'bg-positive-bg text-positive border-positive/30'
          : isError
          ? 'bg-negative-bg text-negative border-negative/30'
          : 'bg-primary-50 text-primary-700 border-primary-300';

        const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-card border shadow-md text-xs font-medium animate-in slide-in-from-bottom-2 duration-150 ${style}`}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 shrink-0" />
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-0.5 rounded hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

