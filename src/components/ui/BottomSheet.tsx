import React, { useEffect } from 'react';
import { clsx } from 'clsx';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** If true, tapping backdrop does not close */
  persistent?: boolean;
}

export function BottomSheet({ open, onClose, title, children, className, persistent }: BottomSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 430, margin: '0 auto' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fadeIn"
        onClick={persistent ? undefined : onClose}
      />
      {/* Sheet */}
      <div className={clsx(
        'relative bg-surface rounded-t-[28px] shadow-modal animate-slideInUp max-h-[90vh] flex flex-col',
        className,
      )}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-outline-variant rounded-full" />
        </div>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3">
            <h3 className="text-headline-sm font-semibold text-on-surface">{title}</h3>
            <button onClick={onClose} className="text-on-surface-variant">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmSheet({
  open, onClose, onConfirm, title, body,
  confirmLabel = 'নিশ্চিত করুন', cancelLabel = 'বাতিল',
  danger, loading,
}: ConfirmSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} persistent={loading}>
      <div className="px-5 py-4 pb-8 flex flex-col gap-4">
        <div>
          <h3 className="text-headline-sm font-semibold text-on-surface">{title}</h3>
          <p className="text-body-md text-on-surface-variant mt-1">{body}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl border-2 border-outline-variant text-on-surface text-label-lg font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              'flex-1 py-3 rounded-2xl text-white text-label-lg font-medium flex items-center justify-center gap-2',
              danger ? 'bg-error' : 'bg-primary',
            )}
          >
            {loading && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
