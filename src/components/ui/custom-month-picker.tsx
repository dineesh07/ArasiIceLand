'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { todayIST } from '@/lib/dates';

interface CustomMonthPickerProps {
  value: string; // 'YYYY-MM'
  onChange: (monthStr: string) => void;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function CustomMonthPicker({
  value,
  onChange,
  className = '',
  disabled = false,
}: CustomMonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = todayIST(); // YYYY-MM-DD
  const currentYear = parseInt(value ? value.substring(0, 4) : today.substring(0, 4), 10);
  const selectedMonthNum = parseInt(value ? value.substring(5, 7) : today.substring(5, 7), 10); // 1-12

  const [viewYear, setViewYear] = useState<number>(currentYear);

  useEffect(() => {
    if (value) {
      setViewYear(parseInt(value.substring(0, 4), 10));
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape listener
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectMonth = (monthIndex: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    onChange(`${viewYear}-${monthStr}`);
    setIsOpen(false);
  };

  const handleThisMonth = () => {
    const thisMonth = today.substring(0, 7);
    onChange(thisMonth);
    setViewYear(parseInt(thisMonth.substring(0, 4), 10));
    setIsOpen(false);
  };

  // Formatted label e.g. "Nov 2026"
  const displayLabel = value
    ? format(parseISO(`${value}-01`), 'MMM yyyy')
    : 'Select month';

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2.5 text-left transition-all ${
          isOpen
            ? 'border-sky-600 ring-3 ring-sky-100'
            : 'border-slate-300 hover:border-slate-400'
        } ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'bg-slate-50 hover:bg-white cursor-pointer'
        } ${className || 'h-11 rounded-xl border-2 px-3 font-bold text-slate-800'}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="text-slate-900 font-bold text-sm whitespace-nowrap">{displayLabel}</span>
        </div>
      </button>

      {/* Floating Month Grid Popup */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Month picker"
          className="absolute z-50 left-0 mt-1.5 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 animate-in fade-in-50 zoom-in-95 duration-150 select-none"
        >
          {/* Header Year & Navigation */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-900">{viewYear}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewYear((y) => y - 1)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Previous year"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewYear((y) => y + 1)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Next year"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3x4 Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTH_NAMES.map((name, idx) => {
              const monthNum = idx + 1;
              const isSelected = value === `${viewYear}-${String(monthNum).padStart(2, '0')}`;
              const isThisMonthNow = today.substring(0, 7) === `${viewYear}-${String(monthNum).padStart(2, '0')}`;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-md hover:bg-sky-700'
                      : isThisMonthNow
                      ? 'border border-sky-500 text-sky-700 bg-sky-50 font-bold hover:bg-sky-100'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* This Month Shortcut */}
          <div className="pt-3 mt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleThisMonth}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline"
            >
              Jump to Current Month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

