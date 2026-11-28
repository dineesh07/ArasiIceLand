'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { todayIST } from '@/lib/dates';

interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  showShortcuts?: boolean;
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  className = '',
  disabled = false,
  required = false,
  id,
  name,
  showShortcuts = true,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = todayIST();

  // Selected date or current viewing month
  const selectedDate = value ? parseISO(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : parseISO(today)
  );

  // Sync current month view when value changes
  useEffect(() => {
    if (value) {
      const parsed = parseISO(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentMonth(parsed);
      }
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

  // Calendar math
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDaySelect = (day: Date) => {
    const formatted = format(day, 'yyyy-MM-dd');
    onChange(formatted);
    setIsOpen(false);
  };

  const handleShortcut = (dateStr: string) => {
    onChange(dateStr);
    setCurrentMonth(parseISO(dateStr));
    setIsOpen(false);
  };

  const displayLabel = selectedDate && !isNaN(selectedDate.getTime())
    ? format(selectedDate, 'dd MMM yyyy (EEE)')
    : '';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden input for HTML form validation */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          id={id}
        />
      )}

      {/* Input Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between text-left transition-all ${
          isOpen
            ? 'border-sky-600 ring-3 ring-sky-100'
            : 'border-slate-300 hover:border-slate-400'
        } ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'bg-white cursor-pointer'
        } ${className || 'h-12 rounded-xl border-2 px-3.5 font-semibold text-slate-800'}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <CalendarIcon className={`w-4 h-4 shrink-0 ${isOpen ? 'text-sky-600' : 'text-slate-500'}`} />
          {displayLabel ? (
            <span className="truncate text-slate-900 font-semibold">{displayLabel}</span>
          ) : (
            <span className="truncate text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>

        {value && !disabled && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </div>
        )}
      </button>

      {/* Floating Calendar Popup */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Calendar picker"
          className="absolute z-50 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-1.5 w-[296px] sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 animate-in fade-in-50 zoom-in-95 duration-150 select-none"
        >
          {/* Header Month / Year & Navigation */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="text-[11px] font-bold text-slate-400 uppercase py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isCurrentToday = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  className={`h-9 w-full rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-sky-600 text-white font-bold shadow-md hover:bg-sky-700'
                      : isCurrentToday
                      ? 'border border-sky-500 text-sky-700 bg-sky-50/50 font-bold hover:bg-sky-100'
                      : isCurrentMonth
                      ? 'text-slate-800 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Shortcuts Bar */}
          {showShortcuts && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleShortcut(today)}
                className="text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline px-2 py-1 rounded-md"
              >
                Today
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShortcut(format(addDays(parseISO(today), 1), 'yyyy-MM-dd'))}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleShortcut(format(addDays(parseISO(today), 3), 'yyyy-MM-dd'))}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors"
                >
                  +3 Days
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

