'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
}

const maxWidthClassMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  maxWidth = 'md',
  children,
  showCloseButton = true,
  className = '',
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{
        margin: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      {/* Deep Apple-style backdrop scrim that covers the entire viewport */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
        style={{
          margin: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
        }}
      />

      {/* Modal Card */}
      <div
        className={`relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 w-full ${maxWidthClassMap[maxWidth]} my-auto max-h-[90vh] overflow-y-auto transition-all duration-200 ease-out ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 mb-4 gap-3">
            <div>
              {typeof title === 'string' ? (
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
              ) : (
                title
              )}
              {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -mr-1.5 -mt-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors touch-target"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>,
    document.body
  );
}

