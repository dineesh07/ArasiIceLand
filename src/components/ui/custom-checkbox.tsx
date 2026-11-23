'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomCheckbox({
  checked,
  onChange,
  label,
  description,
  id,
  disabled = false,
  className = '',
}: CustomCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-start gap-3 select-none cursor-pointer ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="relative flex items-center mt-0.5">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
            checked
              ? 'bg-sky-600 border-sky-600 shadow-xs'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          {checked && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-semibold text-slate-800 leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-slate-500 font-normal mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}

