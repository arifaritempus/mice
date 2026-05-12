'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export interface DateRangeFieldAccountingProps {
  label: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  hideLabel?: boolean;
}

const toDate = (value: string) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValidDate(parsed) ? parsed : null;
};

const toIsoDate = (date: Date | null) => (date ? formatDateFns(date, 'yyyy-MM-dd') : '');

const parseTypedDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const parsed = parseDateFns(trimmed, 'dd.MM.yyyy', new Date());
  if (!isValidDate(parsed)) return null;
  return formatDateFns(parsed, 'yyyy-MM-dd');
};

export function DateRangeFieldAccounting({
  label,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  hideLabel = false
}: DateRangeFieldAccountingProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const startDate = toDate(startValue);
  const endDate = toDate(endValue);
  const [startText, setStartText] = useState(startDate ? formatDateFns(startDate, 'dd.MM.yyyy') : '');
  const [endText, setEndText] = useState(endDate ? formatDateFns(endDate, 'dd.MM.yyyy') : '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pickerRange, setPickerRange] = useState<[Date | null, Date | null]>([startDate, endDate]);
  const [calendarStyle, setCalendarStyle] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const s = toDate(startValue);
    setStartText(s ? formatDateFns(s, 'dd.MM.yyyy') : '');
  }, [startValue]);

  useEffect(() => {
    const e = toDate(endValue);
    setEndText(e ? formatDateFns(e, 'dd.MM.yyyy') : '');
  }, [endValue]);

  useEffect(() => {
    if (isCalendarOpen) setPickerRange([toDate(startValue), toDate(endValue)]);
  }, [isCalendarOpen, startValue, endValue]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current) return;
      if (containerRef.current.contains(target)) return;
      if (calendarRef.current?.contains(target)) return;
      setIsCalendarOpen(false);
      setPickerRange([toDate(startValue), toDate(endValue)]);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [startValue, endValue]);

  useEffect(() => {
    if (!isCalendarOpen) return;
    const updatePos = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCalendarStyle({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 680))
      });
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [isCalendarOpen]);

  return (
    <div className="min-w-0 relative" ref={containerRef}>
      {!hideLabel ? (
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 truncate" title={label}>
          {label}
        </label>
      ) : null}
      <div className="flex gap-1">
        <input
          value={startText}
          onFocus={() => setIsCalendarOpen(true)}
          onChange={(e) => {
            const v = e.target.value;
            setStartText(v);
            if (v === '') {
              onStartChange('');
              return;
            }
            if (v.length === 10) {
              const parsed = parseTypedDate(v);
              if (parsed !== null) onStartChange(parsed);
            }
          }}
          placeholder="gg.aa.yyyy"
          className="w-full h-8 px-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
        />
        <input
          value={endText}
          onFocus={() => setIsCalendarOpen(true)}
          onChange={(e) => {
            const v = e.target.value;
            setEndText(v);
            if (v === '') {
              onEndChange('');
              return;
            }
            if (v.length === 10) {
              const parsed = parseTypedDate(v);
              if (parsed !== null) onEndChange(parsed);
            }
          }}
          placeholder="gg.aa.yyyy"
          className="w-full h-8 px-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
        />
      </div>
      {isCalendarOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={calendarRef}
            className="transfer-range-datepicker-popover fixed z-[300] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl p-1.5"
            style={{ top: `${calendarStyle.top}px`, left: `${calendarStyle.left}px` }}
          >
            <DatePicker
              inline
              locale={tr}
              monthsShown={2}
              selectsRange
              startDate={pickerRange[0]}
              endDate={pickerRange[1]}
              onChange={(dates) => {
                const [start, end] = dates as [Date | null, Date | null];
                setPickerRange([start, end]);
                if (start && end) {
                  onStartChange(toIsoDate(start));
                  onEndChange(toIsoDate(end));
                  setIsCalendarOpen(false);
                }
              }}
              openToDate={pickerRange[0] || pickerRange[1] || new Date()}
              calendarClassName="!text-xs"
            />
          </div>,
          document.body
        )}
    </div>
  );
}
