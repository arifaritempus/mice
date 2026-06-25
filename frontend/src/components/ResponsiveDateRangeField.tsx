'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO, getYear, getMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, X } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

export interface ResponsiveDateRangeFieldProps {
  label: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onApply: (start?: string, end?: string) => void;
  className?: string;
}

const toDate = (value: string) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValidDate(parsed) ? parsed : null;
};

const toIsoDate = (date: Date | null) => (date ? formatDateFns(date, 'yyyy-MM-dd') : '');

export default function ResponsiveDateRangeField({ 
  label, startValue, endValue, onStartChange, onEndChange, onApply, className = "" 
}: ResponsiveDateRangeFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pickerRange, setPickerRange] = useState<[Date | null, Date | null]>([toDate(startValue), toDate(endValue)]);
  const [calendarStyle, setCalendarStyle] = useState({ top: 0, left: 0, origin: 'top left' });

  // Handle responsive
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
      if ((target as Element).closest('.react-datepicker')) return;
      
      setIsCalendarOpen(false);
      setPickerRange([toDate(startValue), toDate(endValue)]);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [startValue, endValue, isMobile]);

  // Position portal (Desktop)
  useEffect(() => {
    if (!isCalendarOpen || isMobile) return;
    const updatePos = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const isRightAligned = window.innerWidth - rect.left < 650; // Popover width is roughly 620px for 2 months
      
      setCalendarStyle({
        top: rect.bottom + 8,
        left: isRightAligned ? Math.max(8, rect.right - 620) : Math.max(8, rect.left),
        origin: isRightAligned ? 'top right' : 'top left'
      });
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [isCalendarOpen, isMobile]);

  // Handle ESC key
  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCalendarOpen]);

  const openCalendar = () => setIsCalendarOpen(true);

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
    onStartChange('');
    onEndChange('');
    onApply('', '');
    setPickerRange([null, null]);
  };

  const calStart = isCalendarOpen ? pickerRange[0] : toDate(startValue);
  const calEnd = isCalendarOpen ? pickerRange[1] : toDate(endValue);

  // Formatted display text
  let displayText = "Tarih Seçin";
  if (startValue && endValue) {
    displayText = `${formatDateFns(toDate(startValue)!, 'dd MMM yyyy', {locale: tr})} - ${formatDateFns(toDate(endValue)!, 'dd MMM yyyy', {locale: tr})}`;
  } else if (startValue) {
    displayText = `${formatDateFns(toDate(startValue)!, 'dd MMM yyyy', {locale: tr})} - Belirsiz`;
  }

  const renderCalendarContent = () => (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto w-full flex items-center justify-center p-2 sm:p-5 custom-datepicker-wrapper">
                <DatePicker
          inline
          locale={tr}
          monthsShown={isMobile ? 1 : 2}
          selectsRange
          startDate={calStart || undefined}
          endDate={calEnd || undefined}
          calendarClassName="!border-0 !bg-transparent w-full mx-auto"
          onChange={(dates) => {
            const [start, end] = dates as [Date | null, Date | null];
            setPickerRange([start, end]);
            if (start && end) {
              const s = toIsoDate(start);
              const e = toIsoDate(end);
              onStartChange(s);
              onEndChange(e);
              if (onApply) onApply(s, e);
              setIsCalendarOpen(false);
            } else if (!start && !end) {
              onStartChange('');
              onEndChange('');
              if (onApply) onApply('', '');
            } else if (start && !end) {
              onStartChange(toIsoDate(start));
              onEndChange('');
            }
          }}
          renderCustomHeader={({
            monthDate,
            customHeaderCount,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
            changeYear,
            changeMonth,
          }) => {
            const months = [
              "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
              "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
            ];
            const years = [];
            const currentYear = new Date().getFullYear();
            for (let i = currentYear - 10; i <= currentYear + 10; i++) {
              years.push(i);
            }

            return (
              <div className="flex items-center justify-between px-2 py-2">
                <button
                  aria-label="Previous Month"
                  className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    prevMonthButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                  style={{ visibility: customHeaderCount === 1 ? "hidden" : "visible" }}
                >
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                
                <div className="flex items-center gap-2">
                  <select
                    value={months[getMonth(monthDate)]}
                    onChange={({ target: { value } }) => {
                      const newMonth = months.indexOf(value);
                      if (customHeaderCount === 1) {
                        const targetDate = new Date(getYear(monthDate), newMonth, 1);
                        const leftDate = new Date(targetDate);
                        leftDate.setMonth(targetDate.getMonth() - 1);
                        changeYear(leftDate.getFullYear());
                        changeMonth(leftDate.getMonth());
                      } else {
                        changeMonth(newMonth);
                      }
                    }}
                    className="appearance-none bg-transparent font-bold text-slate-800 dark:text-slate-100 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                  >
                    {months.map((option) => (
                      <option key={option} value={option} className="text-slate-900 dark:text-slate-900">
                        {option}
                      </option>
                    ))}
                  </select>

                  <select
                    value={getYear(monthDate)}
                    onChange={({ target: { value } }) => {
                      const newYear = Number(value);
                      if (customHeaderCount === 1) {
                        const targetDate = new Date(newYear, getMonth(monthDate), 1);
                        const leftDate = new Date(targetDate);
                        leftDate.setMonth(targetDate.getMonth() - 1);
                        changeYear(leftDate.getFullYear());
                        changeMonth(leftDate.getMonth());
                      } else {
                        changeYear(newYear);
                      }
                    }}
                    className="appearance-none bg-transparent font-bold text-slate-800 dark:text-slate-100 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                  >
                    {years.map((option) => (
                      <option key={option} value={option} className="text-slate-900 dark:text-slate-900">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  aria-label="Next Month"
                  className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    nextMonthButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                  style={{ visibility: customHeaderCount === 0 && !isMobile ? "hidden" : "visible" }}
                >
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
            );
          }}
        />
      </div>
            </div>
  );

  return (
    <div className={`min-w-0 relative flex flex-col w-full ${className}`} ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 truncate" title={label}>
        {label}
      </label>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={openCalendar}
        className="flex items-center justify-between w-full min-w-0 h-10 px-3.5 text-sm font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
      >
        <div className="flex items-center gap-2.5 truncate">
          <Calendar size={16} className="text-slate-400 dark:text-slate-400 shrink-0" />
          <span className="truncate">{displayText}</span>
        </div>
        {(startValue || endValue) && (
          <div 
            onClick={handleClear}
            className="shrink-0 p-1 ml-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={14} />
          </div>
        )}
      </button>

      {/* Calendar Portal / Modal */}
      {isCalendarOpen && typeof document !== 'undefined' && createPortal(
        isMobile ? (
          // Mobile: Bottom-sheet modal
          <div className="fixed inset-0 z-[9999] flex flex-col justify-end bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
              className="bg-white dark:bg-slate-900 w-full rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 ease-out"
              style={{ maxHeight: '90dvh' }}
              ref={calendarRef}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{label || "Tarih Seçin"}</h3>
                <button onClick={closeCalendar} className="p-2 -mr-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <X size={18} />
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
            className="fixed z-[9999] shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ 
              top: `${calendarStyle.top}px`, 
              left: `${calendarStyle.left}px`,
              transformOrigin: calendarStyle.origin
            }}
          >
            {renderCalendarContent()}
          </div>
        ),
        document.body
      )}

      <style dangerouslySetInnerHTML={{__html: `
        /* Hide scrollbar for smooth bottom sheet */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Container layout */
        .custom-datepicker-wrapper .react-datepicker {
          display: flex !important;
          border: none !important;
          background: transparent !important;
          font-family: inherit !important;
        }
        
        .custom-datepicker-wrapper .react-datepicker__month-container {
          background: transparent !important;
          padding: 0 0.5rem;
        }
        
        /* Header styling */
        .custom-datepicker-wrapper .react-datepicker__header {
          background: transparent !important;
          border-bottom: none !important;
          padding-top: 0.5rem;
          padding-bottom: 0;
        }

        /* Mobile specific full width */
        @media (max-width: 767px) {
          .custom-datepicker-wrapper .react-datepicker {
            flex-direction: column;
            width: 100%;
          }
          .custom-datepicker-wrapper .react-datepicker__month-container {
            width: 100%;
            float: none;
            padding: 0;
          }
        }

        /* Desktop layout for 2 months */
        @media (min-width: 768px) {
          .custom-datepicker-wrapper .react-datepicker {
            flex-direction: row;
          }
          .custom-datepicker-wrapper .react-datepicker__month-container {
            width: 290px; /* Precise width for neat side-by-side */
            float: none;
          }
          /* Add divider between months */
          .custom-datepicker-wrapper .react-datepicker__month-container:first-child {
            border-right: 1px solid #f1f5f9;
            padding-right: 1rem;
            margin-right: 0.5rem;
          }
          .dark .custom-datepicker-wrapper .react-datepicker__month-container:first-child {
            border-right-color: #1e293b;
          }
        }



        /* Navigation Arrows */
        .custom-datepicker-wrapper .react-datepicker__navigation {
          top: 1rem !important;
          height: 2rem !important;
          width: 2rem !important;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .custom-datepicker-wrapper .react-datepicker__navigation-icon::before {
          border-color: #64748b !important;
          border-width: 2px 2px 0 0 !important;
          width: 8px !important;
          height: 8px !important;
        }
        .custom-datepicker-wrapper .react-datepicker__navigation:hover {
          background: #f1f5f9;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__navigation:hover {
          background: #1e293b;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__navigation-icon::before {
          border-color: #94a3b8 !important;
        }
        
        /* Day names row */
        .custom-datepicker-wrapper .react-datepicker__day-names {
          display: flex;
          justify-content: space-around;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          padding: 0 0.5rem;
        }
        .custom-datepicker-wrapper .react-datepicker__day-name {
          color: #94a3b8 !important;
          width: 2.25rem !important;
          line-height: 2.25rem !important;
          margin: 0 !important;
          font-weight: 600 !important;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        /* Days grid */
        .custom-datepicker-wrapper .react-datepicker__month {
          margin: 0 !important;
          padding: 0 0.5rem;
        }
        .custom-datepicker-wrapper .react-datepicker__week {
          display: flex;
          justify-content: space-around;
          margin-bottom: 0.25rem;
        }
        
        .custom-datepicker-wrapper .react-datepicker__day {
          width: 2.25rem !important;
          line-height: 2.25rem !important;
          margin: 0 !important;
          border-radius: 50% !important;
          font-weight: 500;
          font-size: 0.875rem;
          color: #334155 !important;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .custom-datepicker-wrapper .react-datepicker__day:hover:not(.react-datepicker__day--selected):not(.react-datepicker__day--in-selecting-range):not(.react-datepicker__day--in-range) {
          background-color: #f1f5f9 !important;
        }
        
        /* Range Selection Styling */
        .custom-datepicker-wrapper .react-datepicker__day--in-range,
        .custom-datepicker-wrapper .react-datepicker__day--in-selecting-range {
          background-color: #eff6ff !important;
          color: #2563eb !important;
          border-radius: 0 !important;
        }
        .custom-datepicker-wrapper .react-datepicker__day--range-start,
        .custom-datepicker-wrapper .react-datepicker__day--selecting-range-start {
          background-color: #2563eb !important;
          color: white !important;
          border-top-left-radius: 50% !important;
          border-bottom-left-radius: 50% !important;
        }
        .custom-datepicker-wrapper .react-datepicker__day--range-end,
        .custom-datepicker-wrapper .react-datepicker__day--selecting-range-end {
          background-color: #2563eb !important;
          color: white !important;
          border-top-right-radius: 50% !important;
          border-bottom-right-radius: 50% !important;
        }
        .custom-datepicker-wrapper .react-datepicker__day--selected {
          background-color: #2563eb !important;
          color: white !important;
          border-radius: 50% !important;
        }

        /* Current day */
        .custom-datepicker-wrapper .react-datepicker__day--keyboard-selected {
          background-color: transparent !important;
          color: #334155 !important;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__day--keyboard-selected {
          color: #e2e8f0 !important;
        }

        /* Outside month days */
        .custom-datepicker-wrapper .react-datepicker__day--outside-month {
          color: #cbd5e1 !important;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__day--outside-month {
          color: #334155 !important;
        }

        /* Dropdowns */
        .custom-datepicker-wrapper .react-datepicker__header__dropdown {
          margin-top: 0.25rem;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }
        .custom-datepicker-wrapper .react-datepicker__month-select, 
        .custom-datepicker-wrapper .react-datepicker__year-select {
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 0.25rem 1.5rem 0.25rem 0.5rem;
          font-weight: 600;
          font-size: 0.875rem;
          color: #334155;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 1rem;
          transition: border-color 0.2s;
        }
        .custom-datepicker-wrapper .react-datepicker__month-select:hover, 
        .custom-datepicker-wrapper .react-datepicker__year-select:hover {
          border-color: #cbd5e1;
        }

        /* Dark Mode Overrides */
        .dark .custom-datepicker-wrapper .react-datepicker__day { color: #e2e8f0 !important; }
        .dark .custom-datepicker-wrapper .react-datepicker__day:hover:not(.react-datepicker__day--selected):not(.react-datepicker__day--in-selecting-range):not(.react-datepicker__day--in-range) { 
          background-color: #1e293b !important; 
        }
        
        .dark .custom-datepicker-wrapper .react-datepicker__day--in-range,
        .dark .custom-datepicker-wrapper .react-datepicker__day--in-selecting-range {
          background-color: rgba(37, 99, 235, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__day--range-start,
        .dark .custom-datepicker-wrapper .react-datepicker__day--range-end,
        .dark .custom-datepicker-wrapper .react-datepicker__day--selecting-range-start,
        .dark .custom-datepicker-wrapper .react-datepicker__day--selecting-range-end,
        .dark .custom-datepicker-wrapper .react-datepicker__day--selected {
          background-color: #3b82f6 !important;
          color: white !important;
        }
        
        .dark .custom-datepicker-wrapper .react-datepicker__month-select, 
        .dark .custom-datepicker-wrapper .react-datepicker__year-select {
          background-color: #1e293b;
          border-color: #334155;
          color: #f1f5f9;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        }
        .dark .custom-datepicker-wrapper .react-datepicker__month-select:hover, 
        .dark .custom-datepicker-wrapper .react-datepicker__year-select:hover {
          border-color: #475569;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__current-month {
          color: #f8fafc !important;
          font-size: 1rem;
          font-weight: 600;
        }
      `}} />
    </div>
  );
}
