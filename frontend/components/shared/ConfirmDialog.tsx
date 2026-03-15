'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const iconColors = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  const buttonVariants = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    info: 'primary' as const,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-${variant === 'danger' ? 'red' : variant === 'warning' ? 'yellow' : 'blue'}-100 mb-4`}>
          <AlertTriangle className={`h-6 w-6 ${iconColors[variant]}`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
