'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { format as formatDateFns, parseISO, isValid as isValidDate } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, X } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

export interface ResponsiveDateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minDate?: string;
}

const toDate = (value: string) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValidDate(parsed) ? parsed : null;
};

const toIsoDate = (date: Date | null) =>
  date ? formatDateFns(date, "yyyy-MM-dd") : "";

export default function ResponsiveDateField({
  label,
  value,
  onChange,
  className = "",
  minDate
}: ResponsiveDateFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date | null>(toDate(value));
  const [calendarStyle, setCalendarStyle] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setPickerDate(toDate(value));
  }, [value]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const openCalendar = () => {
    if (containerRef.current && !isMobile) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverHeight = 350;
      let top = rect.bottom + window.scrollY + 8;
      
      if (rect.bottom + popoverHeight > window.innerHeight) {
        top = rect.top + window.scrollY - popoverHeight - 8;
      }
      
      setCalendarStyle({
        top,
        left: rect.left + window.scrollX,
      });
    }
    setIsCalendarOpen(true);
  };

  const closeCalendar = () => setIsCalendarOpen(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isCalendarOpen &&
        calendarRef.current &&
        !calendarRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeCalendar();
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const handleDateChange = (date: Date | null) => {
    setPickerDate(date);
    onChange(toIsoDate(date));
    closeCalendar();
  };

  const displayValue = pickerDate ? formatDateFns(pickerDate, "dd MMM yyyy", { locale: tr }) : "";

  const calendarContent = (
    <div
      ref={calendarRef}
      className={`${
        isMobile
          ? 'fixed inset-x-4 bottom-4 top-auto rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom-4 z-[9999]'
          : 'absolute z-[9999] rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95'
      }`}
      style={isMobile ? undefined : { top: calendarStyle.top, left: calendarStyle.left }}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {label || 'Tarih Seçin'}
        </h3>
        <button
          onClick={closeCalendar}
          className="p-2 -mr-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex justify-center">
        <DatePicker
          selected={pickerDate}
          onChange={handleDateChange}
          inline
          locale={tr}
          minDate={toDate(minDate)}
          calendarClassName="modern-calendar single-mode shadow-none border-0"
        />
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={openCalendar}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm bg-white dark:bg-gray-800/50 border border-v3-border hover:border-gray-300 dark:hover:border-gray-600 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5 truncate">
            {label}
          </div>
          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {displayValue || 'Tarih Seçin'}
          </div>
        </div>
      </button>

      {isCalendarOpen && typeof document !== 'undefined'
        ? createPortal(calendarContent, document.body)
        : null}
    </div>
  );
}
