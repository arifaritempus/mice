"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import {
  format as formatDateFns,
  parse as parseDateFns,
  isValid as isValidDate,
  parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar, X } from "lucide-react";

interface DateRangeFieldProps {
  label: string;
  startValue: string; // ISO date string (YYYY-MM-DD) or empty
  endValue: string; // ISO date string (YYYY-MM-DD) or empty
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onApply: (start?: string, end?: string) => void;
}

const toDate = (value: string) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValidDate(parsed) ? parsed : null;
};

const toIsoDate = (date: Date | null) =>
  date ? formatDateFns(date, "yyyy-MM-dd") : "";

export default function DateRangeField({
  label,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  onApply,
}: DateRangeFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pickerRange, setPickerRange] = useState<[Date | null, Date | null]>([
    toDate(startValue),
    toDate(endValue),
  ]);
  const [calendarStyle, setCalendarStyle] = useState({ top: 0, left: 0 });

  // Handle responsive
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync internal range with props
  useEffect(() => {
    if (isCalendarOpen) {
      setPickerRange([toDate(startValue), toDate(endValue)]);
    }
  }, [isCalendarOpen, startValue, endValue]);

  // Click outside (Desktop)
  useEffect(() => {
    if (isMobile) return;
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current) return;
      if (containerRef.current.contains(target)) return;
      if (calendarRef.current?.contains(target)) return;

      // Prevent closing if clicking on a calendar navigation button inside the portal
      if ((target as Element).closest(".react-datepicker")) return;

      setIsCalendarOpen(false);
      setPickerRange([toDate(startValue), toDate(endValue)]);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [startValue, endValue, isMobile]);

  // Position portal (Desktop)
  useEffect(() => {
    if (!isCalendarOpen || isMobile) return;
    const updatePos = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCalendarStyle({
        top: rect.bottom + 8, // Little gap
        left: Math.max(6, rect.left),
      });
    };
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [isCalendarOpen, isMobile]);

  const openCalendar = () => {
    setIsCalendarOpen(true);
  };

  const closeCalendar = () => {
    setIsCalendarOpen(false);
    setPickerRange([toDate(startValue), toDate(endValue)]);
  };

  const handleApply = () => {
    const s = toIsoDate(pickerRange[0]);
    const e = toIsoDate(pickerRange[1]);
    onStartChange(s);
    onEndChange(e);
    onApply(s, e);
    setIsCalendarOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartChange("");
    onEndChange("");
    onApply("", "");
    setPickerRange([null, null]);
  };

  const calStart = isCalendarOpen ? pickerRange[0] : toDate(startValue);
  const calEnd = isCalendarOpen ? pickerRange[1] : toDate(endValue);

  // Formatted display text
  let displayText = "Tarih Seçin";
  if (startValue && endValue) {
    displayText = `${formatDateFns(toDate(startValue)!, "dd MMM yy", { locale: tr })} - ${formatDateFns(toDate(endValue)!, "dd MMM yy", { locale: tr })}`;
  } else if (startValue) {
    displayText = `${formatDateFns(toDate(startValue)!, "dd MMM yy", { locale: tr })} - Belirsiz`;
  }

  const renderCalendarContent = () => (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto w-full flex items-center justify-center p-2 sm:p-4">
        <DatePicker
          inline
          locale={tr}
          monthsShown={isMobile ? 1 : 2}
          selectsRange
          startDate={calStart || undefined}
          endDate={calEnd || undefined}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          onChange={(dates) => {
            const [start, end] = dates as [Date | null, Date | null];
            setPickerRange([start, end]);
          }}
          calendarClassName="!border-0 !bg-transparent custom-datepicker-theme w-full max-w-sm mx-auto"
        />
      </div>
      <div className="flex justify-end gap-3 p-4 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 w-full mt-auto">
        <button
          onClick={closeCalendar}
          className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          İptal
        </button>
        <button
          onClick={handleApply}
          disabled={!pickerRange[0]}
          className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-500/90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20"
        >
          Uygula
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-w-0 relative flex flex-col" ref={containerRef}>
      <label
        className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-0.5 leading-snug truncate"
        title={label}
      >
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={openCalendar}
        className="flex items-center justify-between w-full min-w-0 h-10 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar
            size={14}
            className="text-gray-400 dark:text-gray-400 shrink-0"
          />
          <span className="truncate font-medium">{displayText}</span>
        </div>
        {(startValue || endValue) && (
          <div
            onClick={handleClear}
            className="shrink-0 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={14} />
          </div>
        )}
      </button>

      {/* Calendar Portal / Modal */}
      {isCalendarOpen &&
        typeof document !== "undefined" &&
        createPortal(
          isMobile ? (
            // Mobile: Full-screen or bottom-sheet modal
            <div className="fixed inset-0 z-[9999] flex flex-col justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
              <div
                className="bg-white dark:bg-gray-900 w-full rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
                style={{ maxHeight: "85dvh" }}
                ref={calendarRef}
              >
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                    {label}
                  </h3>
                  <button
                    onClick={closeCalendar}
                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                  {renderCalendarContent()}
                </div>
              </div>
            </div>
          ) : (
            // Desktop: Popover
            <div
              ref={calendarRef}
              className="transfer-range-datepicker-popover fixed z-[9999] w-max max-w-[calc(100vw-0.75rem)] shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              style={{
                top: `${calendarStyle.top}px`,
                left: `${calendarStyle.left}px`,
              }}
            >
              {renderCalendarContent()}
            </div>
          ),
          document.body,
        )}

      {/* Inject some simple custom CSS for datepicker to make it match tailwind dark mode */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-datepicker-theme {
          font-family: inherit;
        }
        /* Make calendar fill its container on mobile */
        @media (max-width: 767px) {
          .react-datepicker__month-container {
            width: 100%;
            float: none;
          }
        }
        .react-datepicker__month {
          margin: 0.5rem;
        }
        .react-datepicker__day-names {
          display: flex;
          justify-content: space-around;
          margin-bottom: 0.5rem;
        }
        .react-datepicker__week {
          display: flex;
          justify-content: space-around;
        }
        .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
          width: 2.5rem !important;
          line-height: 2.5rem !important;
          margin: 0 !important;
          border-radius: 50% !important;
          font-weight: 500;
        }
        .react-datepicker__header {
          padding-top: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: none !important;
        }
        .react-datepicker__navigation {
          top: 1.25rem !important;
        }
        
        /* Dark Mode overrides */
        .dark .react-datepicker {
          background-color: transparent !important;
          color: #f3f4f6 !important;
        }
        .dark .react-datepicker__header {
          background-color: transparent !important;
        }
        .dark .react-datepicker__current-month, 
        .dark .react-datepicker-time__header, 
        .dark .react-datepicker-year-header {
          color: #f3f4f6 !important;
          font-size: 1.1rem;
          font-weight: 700;
        }
        .dark .react-datepicker__day-name {
          color: #9ca3af !important;
          font-weight: 600;
        }
        .dark .react-datepicker__day, 
        .dark .react-datepicker__time-name {
          color: #e5e7eb !important;
        }
        .dark .react-datepicker__day:hover {
          background-color: #374151 !important;
        }
        .dark .react-datepicker__day--selected, 
        .dark .react-datepicker__day--in-selecting-range, 
        .dark .react-datepicker__day--in-range, 
        .dark .react-datepicker__month-text--selected, 
        .dark .react-datepicker__month-text--in-selecting-range, 
        .dark .react-datepicker__month-text--in-range {
          background-color: #2563eb !important;
          color: #ffffff !important;
          font-weight: bold;
        }
        .dark .react-datepicker__day--keyboard-selected {
          background-color: #374151 !important;
        }
        
        /* Dropdown Select Styles */
        .react-datepicker__month-select, .react-datepicker__year-select {
          background-color: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 0.25rem 0.5rem;
          margin: 0 0.25rem;
          font-weight: 600;
          color: #374151;
          outline: none;
          cursor: pointer;
        }
        .dark .react-datepicker__month-select, .dark .react-datepicker__year-select {
          border-color: #4b5563;
          color: #f3f4f6;
        }
        .dark .react-datepicker__month-select option, .dark .react-datepicker__year-select option {
          background-color: #1f2937;
          color: #f3f4f6;
        }
      `,
        }}
      />
    </div>
  );
}
