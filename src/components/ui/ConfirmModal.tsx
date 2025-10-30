'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';

type ConfirmVariant = 'default' | 'danger';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  variant?: ConfirmVariant;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  showCancel = true,
  variant = 'default',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = useCallback(() => {
    if (isProcessing) return;
    onClose();
  }, [isProcessing, onClose]);

  const handleConfirm = useCallback(async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onConfirm]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const confirmClasses =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-md px-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-6 top-6 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          disabled={isProcessing}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {description && (
            <div className="text-sm text-gray-600 leading-relaxed">{description}</div>
          )}
        </div>

        <div className={`mt-8 flex ${showCancel ? 'justify-between' : 'justify-end'} gap-3`}>
          {showCancel && (
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
              disabled={isProcessing}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${confirmClasses}`}
            disabled={isProcessing}
          >
            {isProcessing ? 'Подождите...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

