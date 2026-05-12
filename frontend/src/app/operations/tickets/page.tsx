'use client';

import { useState, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { formatNumber } from '@/utils/formatters';
import { getLogosForExcel } from '@/utils/logoUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, paginateItems } from '@/types/pagination';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { usePermissions, Module } from '@/lib/permissions';
// import { loadBiletler } from '../../../../src/supabaseClient';

// async function fetchData() {
//   const biletler = await loadBiletler();
//   console.log(biletler);
// }

// fetchData();

// Misafir isimlerini getiren yardımcı fonksiyon (artık kullanılmıyor, ticket içinde guestNames var)
const getGuestNames = (sejourId: string) => {
  // Bu fonksiyon artık kullanılmıyor çünkü veriler ticket içinde guestNames olarak geliyor
  return '-';
};

// Tarih formatını GG.AA.YYYY yapan yardımcı fonksiyon
const formatDateCustom = (dateString: string) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (error) {
    return dateString;
  }
};

// Saat formatını düzenleyen yardımcı fonksiyon
const formatTime = (timeString: string) => {
  if (!timeString) return '-';
  
  try {
    // ISO string formatında ise (örn: "2024-01-15T14:30:00Z")
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    // Sadece saat formatında ise (örn: "14:30")
    if (timeString.includes(':')) {
      return timeString;
    }
    
    // Unix timestamp ise
    const timestamp = parseInt(timeString);
    if (!isNaN(timestamp)) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    return timeString;
  } catch (error) {
    return timeString;
  }
};

interface DateRangeFieldProps {
  label: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onApply: (start?: string, end?: string) => void;
}

interface MultiTokenFilterInputProps {
  label: string;
  tokens: string[];
  inputValue: string;
  suggestions: string[];
  onInputChange: (value: string) => void;
  onAddToken: (value: string) => void;
  onRemoveToken: (value: string) => void;
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

/** Tabloda gösterilecek tek satır (önce acente) */
function agencyCustomerLine(t: { agencyName?: string; customerName?: string }) {
  if (t.agencyName?.trim()) return t.agencyName.trim();
  if (t.customerName?.trim()) return t.customerName.trim();
  return '-';
}

/** Tooltip: acente ve müşteri ikisi de varsa ikisini göster */
function agencyCustomerTooltip(t: { agencyName?: string; customerName?: string }) {
  const parts = [t.agencyName?.trim(), t.customerName?.trim()].filter(Boolean) as string[];
  if (parts.length === 0) return '';
  return parts.join(' — ');
}

function DateRangeField({ label, startValue, endValue, onStartChange, onEndChange, onApply }: DateRangeFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const startDate = toDate(startValue);
  const endDate = toDate(endValue);
  const [startText, setStartText] = useState(startDate ? formatDateFns(startDate, 'dd.MM.yyyy') : '');
  const [endText, setEndText] = useState(endDate ? formatDateFns(endDate, 'dd.MM.yyyy') : '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  /** Takvimde geçici aralık; yalnızca başlangıç ve bitiş ikisi de seçilince üst state güncellenir */
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
    if (isCalendarOpen) {
      setPickerRange([toDate(startValue), toDate(endValue)]);
    }
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
        left: Math.max(6, rect.left)
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

  const openCalendar = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setCalendarStyle({
        top: rect.bottom + 4,
        left: Math.max(6, rect.left)
      });
    }
    setIsCalendarOpen(true);
  };

  const handleStartTextChange = (value: string) => {
    setStartText(value);
    if (value === '') {
      onStartChange('');
      onApply('', endText.length === 10 ? parseTypedDate(endText) || '' : '');
      return;
    }
    if (value.length === 10) {
      const parsed = parseTypedDate(value);
      if (parsed !== null) {
        onStartChange(parsed);
        if (endText.length === 10) {
          const endParsed = parseTypedDate(endText);
          if (endParsed) onApply(parsed, endParsed);
        }
      }
    }
  };

  const handleEndTextChange = (value: string) => {
    setEndText(value);
    if (value === '') {
      onEndChange('');
      onApply(startText.length === 10 ? parseTypedDate(startText) || '' : '', '');
      return;
    }
    if (value.length === 10) {
      const parsed = parseTypedDate(value);
      if (parsed !== null) {
        onEndChange(parsed);
        if (startText.length === 10) {
          const startParsed = parseTypedDate(startText);
          if (startParsed) onApply(startParsed, parsed);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const s = parseTypedDate(startText) || '';
      const e_ = parseTypedDate(endText) || '';
      onApply(s, e_);
      setIsCalendarOpen(false);
    }
  };

  const calStart = isCalendarOpen ? pickerRange[0] : startDate;
  const calEnd = isCalendarOpen ? pickerRange[1] : endDate;

  return (
    <div className="min-w-0 relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-0.5 leading-snug truncate" title={label}>
        {label}
      </label>
      <div className="flex gap-0.5">
        <input
          value={startText}
          onChange={(e) => handleStartTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={openCalendar}
          placeholder="gg.aa.yyyy"
          className="w-full min-w-0 h-8 px-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <input
          value={endText}
          onChange={(e) => handleEndTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={openCalendar}
          placeholder="gg.aa.yyyy"
          className="w-full min-w-0 h-8 px-1 text-[11px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      {isCalendarOpen && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={calendarRef}
            className="transfer-range-datepicker-popover fixed z-[9999] w-max max-w-[calc(100vw-0.75rem)] shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 overflow-x-auto"
            style={{ top: `${calendarStyle.top}px`, left: `${calendarStyle.left}px` }}
          >
            <DatePicker
              inline
              locale={tr}
              monthsShown={2}
              selectsRange
              startDate={calStart || undefined}
              endDate={calEnd || undefined}
              onChange={(dates) => {
                const [start, end] = dates as [Date | null, Date | null];
                setPickerRange([start, end]);
                if (start && !end) {
                  onStartChange(toIsoDate(start));
                  onEndChange('');
                  return;
                }
                if (start && end) {
                  const s = toIsoDate(start);
                  const e = toIsoDate(end);
                  onStartChange(s);
                  onEndChange(e);
                  onApply(s, e);
                  setIsCalendarOpen(false);
                  return;
                }
                if (!start && !end) {
                  onStartChange('');
                  onEndChange('');
                  onApply('', '');
                }
              }}
              calendarClassName="!border-none !bg-transparent dark:!text-white"
            />
          </div>,
          document.body
        )
      }
    </div>
  );
}



function MultiTokenFilterInput({
  label,
  tokens,
  inputValue,
  suggestions,
  onInputChange,
  onAddToken,
  onRemoveToken
}: MultiTokenFilterInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const normalizedInput = inputValue.trim().toLowerCase();
  const filteredSuggestions = suggestions
    .filter((item) => {
      const normalizedItem = item.toLowerCase();
      const alreadyAdded = tokens.some(token => token.toLowerCase() === normalizedItem);
      return !alreadyAdded && normalizedInput.length > 0 && normalizedItem.includes(normalizedInput);
    })
    .slice(0, 6);

  const handleAdd = (raw: string) => {
    onAddToken(raw);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="relative min-w-0">
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-0.5 leading-snug truncate" title={label}>
        {label}
      </label>
      <div className="w-full h-8 px-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 flex items-center gap-0.5 overflow-x-auto">
        {tokens.length > 0 && (
          <button
            type="button"
            className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200"
            title={tokens.join(', ')}
            onClick={() => onRemoveToken(tokens[tokens.length - 1])}
          >
            <span className="text-xs font-medium">+{tokens.length}</span>
            <span className="text-[10px] leading-none">×</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd(inputValue);
            }
            if (e.key === 'Backspace' && inputValue.length === 0 && tokens.length > 0) {
              onRemoveToken(tokens[tokens.length - 1]);
            }
          }}
          className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-xs"
          placeholder="Yaz, Enter ile ekle"
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="absolute z-20 mt-0.5 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-32 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              className="w-full text-left px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => handleAdd(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Ticket {
  id: string;
  sejourId: string;
  voucherNumber: string;
  customerName: string;
  agencyName: string;
  companyName?: string;
  flightDate: string;
  ticketingDate: string;
  ticketingProvider: string;
  pnr: string;
  airline: string;
  route: string;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  costPrice: number;
  costCurrency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
  checkInDate?: string;
  checkOutDate?: string;
  guestNames?: string;
  // MICE için ek alanlar
  returnDate?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
}

interface Sejour {
  id: string;
  voucherNumber: string;
  customerName: string;
  agencyName: string;
  checkInDate: string;
  checkOutDate: string;
  flights: any[];
  status: string;
}

export default function TicketsPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'detail' | 'summary'>('detail');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [tableBusy, setTableBusy] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Ticket['status']>('all');
  const [filter, setFilter] = useState<'all' | 'mice' | 'sejour'>('all');
  const [typeCounts, setTypeCounts] = useState({ all: 0, mice: 0, sejour: 0 });
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filterKey, setFilterKey] = useState<number>(0);
  const [forceReload, setForceReload] = useState<number>(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ startDate: todayStr, endDate: '' });
  const [draftTicketingStart, setDraftTicketingStart] = useState(todayStr);
  const [draftTicketingEnd, setDraftTicketingEnd] = useState('');

  const [flightDateRange, setFlightDateRange] = useState({ startDate: '', endDate: '' });
  const [draftFlightStart, setDraftFlightStart] = useState('');
  const [draftFlightEnd, setDraftFlightEnd] = useState('');

  const [voucherTokens, setVoucherTokens] = useState<string[]>([]);
  const [voucherInput, setVoucherInput] = useState('');
  const [customerTokens, setCustomerTokens] = useState<string[]>([]);
  const [customerInput, setCustomerInput] = useState('');
  const [pnrTokens, setPnrTokens] = useState<string[]>([]);
  const [pnrInput, setPnrInput] = useState('');
  const [airlineTokens, setAirlineTokens] = useState<string[]>([]);
  const [airlineInput, setAirlineInput] = useState('');
  const [supplierTokens, setSupplierTokens] = useState<string[]>([]);
  const [supplierInput, setSupplierInput] = useState('');
  const [guestTokens, setGuestTokens] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState('');

  const voucherTerms = useMemo(
    () => [...voucherTokens, voucherInput.trim()].filter(Boolean),
    [voucherTokens, voucherInput]
  );
  const customerTerms = useMemo(
    () => [...customerTokens, customerInput.trim()].filter(Boolean),
    [customerTokens, customerInput]
  );
  const pnrTerms = useMemo(
    () => [...pnrTokens, pnrInput.trim()].filter(Boolean),
    [pnrTokens, pnrInput]
  );
  const airlineTerms = useMemo(
    () => [...airlineTokens, airlineInput.trim()].filter(Boolean),
    [airlineTokens, airlineInput]
  );
  const supplierTerms = useMemo(
    () => [...supplierTokens, supplierInput.trim()].filter(Boolean),
    [supplierTokens, supplierInput]
  );
  const guestTerms = useMemo(
    () => [...guestTokens, guestInput.trim()].filter(Boolean),
    [guestTokens, guestInput]
  );


  const scopedSearchState = useMemo(

    () =>
      JSON.stringify({
        voucherTerms,
        customerTerms,
        pnrTerms,
        airlineTerms,
        supplierTerms,
        guestTerms
      }),
    [voucherTerms, customerTerms, pnrTerms, airlineTerms, supplierTerms, guestTerms]
  );

  const addToken = (
    value: string,
    setTokens: Dispatch<SetStateAction<string[]>>,
    setInput: Dispatch<SetStateAction<string>>
  ) => {
    const parts = value
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setTokens((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.some((item) => item.toLowerCase() === p.toLowerCase())) next.push(p);
      }
      return next;
    });
    setInput('');
  };

  const removeToken = (value: string, setTokens: Dispatch<SetStateAction<string[]>>) => {
    setTokens(prev => prev.filter(item => item !== value));
  };

  // ExcelJS ile Detay Export (kurumsal header)
  const exportDetailsExcel = async (rows: any[]) => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('TEMPUS TRAVEL - Biletler (Detay)');
    sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } } as any;
    // Header band
    const top = sheet.addRow([]); top.height = 48; sheet.mergeCells('A1:R1');
    for (let c = 1; c <= 18; c++) { sheet.getRow(1).getCell(c).value=''; sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any; }
    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(isDark);
    const inchToPx = (inch: number) => Math.round(inch * 96);
    const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
    if (iconLogoBase64) { const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) }); sheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any); }
    if (wordmarkLogoBase64) { const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) }); sheet.addImage(markId, { tl: { col: 14.5, row: 0.23 }, ext: { width: inchToPx(2.4), height: inchToPx(0.55) } as any } as any); }

    // Columns matching Detay tab order (MICE alanlarıyla uyumlu)
    sheet.columns = [
      { header: 'Voucher', key: 'voucher', width: 16 },
      { header: 'BİLETLEME TARİHİ', key: 'ticketing', width: 16 },
      { header: 'Tür', key: 'type', width: 10 },
      { header: 'C-IN / C-OUT', key: 'checkInOut', width: 20 },
      { header: 'FİRMA ADI', key: 'company', width: 20 },
      { header: 'ACENTE/MÜŞTERİ', key: 'customer', width: 24 },
      { header: 'Misafir Adı', key: 'guest', width: 28 },
      { header: 'PNR', key: 'pnr', width: 16 },
      { header: 'Uçuş Tarihi', key: 'flight_date', width: 14 },
      { header: 'GİDİŞ SAATİ', key: 'dep_time', width: 12 },
      { header: 'DÖNÜŞ TARİHİ', key: 'ret_date', width: 14 },
      { header: 'DÖNÜŞ SAATİ', key: 'ret_time', width: 12 },
      { header: 'HAVAYOLU', key: 'airline', width: 12 },
      { header: 'GÜZERGAH', key: 'route', width: 16 },
      { header: 'UÇUŞ NO', key: 'flight_no', width: 12 },
      { header: 'TEDARİKÇİ', key: 'supplier', width: 20 },
      { header: 'MALİYET', key: 'cost', width: 12 },
      { header: 'MALİYET DÖVİZİ', key: 'cost_cur', width: 14 }
    ];
    const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
    sheet.getRow(headerRow.number).height = 18;
    // Sayısal sütun biçimi
    sheet.getColumn('cost').numFmt = '#,##0.00';
    sheet.getColumn('cost').alignment = { horizontal: 'right' } as any;
    headerRow.eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any; cell.alignment = { vertical: 'middle', horizontal: 'center' } as any; });
    const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');
    const fmtTime = (t?: string) => (t ? (t.includes('T') ? new Date(t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',hour12:false}) : t) : '');
    const typeFromId = (sid?: string) => (sid && typeof sid === 'string' && sid.startsWith('project:') ? 'MICE' : 'Sejour');
    rows.forEach((t: any) => {
      const guest = (typeof t.guestNames === 'string' && t.guestNames.trim()) || '';
      sheet.addRow({
        voucher: t.voucherNumber || '', ticketing: fmtDate(t.ticketingDate), type: typeFromId(t.sejourId),
        customer: t.agencyName || t.customerName || '', company: t.companyName || '', 
        checkInOut: t.checkInDate && t.checkOutDate ? `${fmtDate(t.checkInDate)} / ${fmtDate(t.checkOutDate)}` : '',
        guest: guest, pnr: t.pnr || '',
        flight_date: fmtDate(t.flightDate), dep_time: fmtTime(t.departureTime),
        ret_date: fmtDate(t.returnDate), ret_time: fmtTime(t.returnDepartureTime),
        airline: t.airline || '', route: t.route || '', flight_no: t.flightNo || '',
        supplier: t.ticketingProviderName || t.ticketingProvider || '', cost: Number(t.costPrice || 0), cost_cur: t.costCurrency || ''
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `biletler_detay_${new Date().toISOString().split('T')[0]}.xlsx`; link.click(); window.URL.revokeObjectURL(url);
  };

  // ExcelJS ile Özet Export
  const exportSummaryExcel = async (rows: any[], suppliersList: any[] = []) => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('TEMPUS TRAVEL - Biletler (Özet)');
    sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } } as any;
    const top = sheet.addRow([]); top.height = 48; sheet.mergeCells('A1:R1');
    for (let c = 1; c <= 18; c++) { sheet.getRow(1).getCell(c).value=''; sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any; }
    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(isDark);
    const inchToPx = (inch: number) => Math.round(inch * 96);
    const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
    if (iconLogoBase64) { const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) }); sheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any); }
    if (wordmarkLogoBase64) { const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) }); sheet.addImage(markId, { tl: { col: 14.5, row: 0.23 }, ext: { width: inchToPx(2.4), height: inchToPx(0.55) } as any } as any); }

    sheet.columns = [
      { header: 'Voucher', key: 'voucher', width: 16 },
      { header: 'BİLETLEME TARİHİ', key: 'ticketing', width: 16 },
      { header: 'Tür', key: 'type', width: 10 },
      { header: 'C-IN / C-OUT', key: 'checkInOut', width: 20 },
      { header: 'FİRMA ADI', key: 'company', width: 20 },
      { header: 'ACENTE/MÜŞTERİ', key: 'customer', width: 24 },
      { header: 'Misafir Adı', key: 'guest', width: 28 },
      { header: 'PNR', key: 'pnr', width: 16 },
      { header: 'Gidiş Tarihi', key: 'dep_date', width: 14 },
      { header: 'GİDİŞ SAATİ', key: 'dep_time', width: 12 },
      { header: 'Dönüş Tarihi', key: 'ret_date', width: 14 },
      { header: 'DÖNÜŞ SAATİ', key: 'ret_time', width: 12 },
      { header: 'HAVAYOLU', key: 'airline', width: 12 },
      { header: 'GÜZERGAH', key: 'route', width: 16 },
      { header: 'UÇUŞ NO', key: 'flight_no', width: 12 },
      { header: 'TEDARİKÇİ', key: 'supplier', width: 20 },
      { header: 'MALİYET', key: 'cost', width: 12 },
      { header: 'MALİYET DÖVİZİ', key: 'cost_cur', width: 14 }
    ];
    const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
    sheet.getRow(headerRow.number).height = 18;
    headerRow.eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false, indent: 0 } as any; });
    const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');
    const fmtTime = (t?: string) => (t ? (t.includes('T') ? new Date(t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',hour12:false}) : t) : '');
    // Maliyet sütunu sayı formatı (yalnızca veri hücrelerinde sağa hizalama uygulayacağız)
    sheet.getColumn('cost').numFmt = '#,##0.00';
    const typeFromId = (sid?: string) => (sid && typeof sid === 'string' && sid.startsWith('project:') ? 'MICE' : 'Sejour');
    rows.forEach((s: any) => {
      const guestNames = (typeof s.guestNames === 'string' && s.guestNames.trim()) || '';
      const supplierName = suppliersList.find((sup: any) => sup.id === s.ticketingProvider || sup.code === s.ticketingProvider)?.name || s.ticketingProvider || '';
      const dataRow = sheet.addRow({
        voucher: s.voucherNumber || '',
        ticketing: fmtDate(s.ticketingDate),
        type: typeFromId(s.sejourId),
        customer: s.agencyName || s.customerName || '',
        company: s.companyName || '',
        checkInOut: s.checkInDate && s.checkOutDate ? `${fmtDate(s.checkInDate)} / ${fmtDate(s.checkOutDate)}` : '',
        guest: guestNames,
        pnr: s.pnr || '',
        dep_date: fmtDate(s.departureDate || s.flightDate),
        dep_time: fmtTime(s.departureTime),
        ret_date: fmtDate(s.returnDate),
        ret_time: fmtTime(s.returnDepartureTime || s.arrivalTime),
        airline: s.airline || s.airlines || '',
        route: s.route || s.departureRoute || '',
        flight_no: s.flightNo || '',
        supplier: supplierName || s.ticketingProvider || '',
        cost: Number(s.totalCost || 0),
        cost_cur: s.costCurrency || ''
      });
      // Veri satırı: cost hücresi sağa hizalı
      dataRow.getCell(15).alignment = { horizontal: 'right', vertical: 'middle' } as any;
    });
    // En sonda başlık O2 ve P2 ortalaması (kolon stilleri olası override etmesin)
    headerRow.getCell(15).alignment = { vertical: 'middle', horizontal: 'center', wrapText: false, indent: 0 } as any;
    headerRow.getCell(16).alignment = { vertical: 'middle', horizontal: 'center', wrapText: false, indent: 0 } as any;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `biletler_ozet_${new Date().toISOString().split('T')[0]}.xlsx`; link.click(); window.URL.revokeObjectURL(url);
  };

  const handleApplyTicketingDates = (start?: string, end?: string) => {
    setDateRange({
      startDate: start !== undefined ? start : draftTicketingStart,
      endDate: end !== undefined ? end : draftTicketingEnd
    });
    setPage(1);
    setForceReload(prev => prev + 1);
  };

  const handleApplyFlightDates = (start?: string, end?: string) => {
    setFlightDateRange({
      startDate: start !== undefined ? start : draftFlightStart,
      endDate: end !== undefined ? end : draftFlightEnd
    });
    setPage(1);
    setForceReload(prev => prev + 1);
  };

  const loadData = async () => {
    try {
      if (!initialFetchDone) setLoading(true);
      else setTableBusy(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        searchTerm: '',
        filter,
        sortField,
        sortDirection,
        startDate: dateRange.startDate || '',
        endDate: dateRange.endDate || '',
        flightStartDate: flightDateRange.startDate || '',
        flightEndDate: flightDateRange.endDate || '',
        voucherTerms: JSON.stringify(voucherTerms),
        customerTerms: JSON.stringify(customerTerms),
        pnrTerms: JSON.stringify(pnrTerms),
        airlineTerms: JSON.stringify(airlineTerms),
        supplierTerms: JSON.stringify(supplierTerms),
        guestTerms: JSON.stringify(guestTerms)
      });
      const response = await fetch(`/api/operations/tickets?${params.toString()}`);
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Bilet verileri alınamadı');
      }

      setTickets(Array.isArray(result.data) ? result.data : []);
      setTotalCount(Number(result.total || 0));
      setTotalPages(Number(result.totalPages || 1));
      if (result.typeCounts) {
        setTypeCounts(result.typeCounts);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      setTableBusy(false);
      setInitialFetchDone(true);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, scopedSearchState, filter, sortField, sortDirection, dateRange, flightDateRange, forceReload]);

  // Filtreleri temizleme fonksiyonu
  const clearFilters = () => {
    setVoucherTokens([]);
    setVoucherInput('');
    setCustomerTokens([]);
    setCustomerInput('');
    setPnrTokens([]);
    setPnrInput('');
    setAirlineTokens([]);
    setAirlineInput('');
    setSupplierTokens([]);
    setSupplierInput('');
    setGuestTokens([]);
    setGuestInput('');
    const todayStr = new Date().toISOString().split('T')[0];
    setDraftTicketingStart(todayStr);
    setDraftTicketingEnd('');
    setDateRange({ startDate: todayStr, endDate: '' });
    setDraftFlightStart('');
    setDraftFlightEnd('');
    setFlightDateRange({ startDate: '', endDate: '' });
    setFilter('all');
    setPage(1);
    setFilterKey(prev => prev + 1);
    setForceReload(prev => prev + 1);
  };









  // Tedarikçi kodunu isme çevir
  const getSupplierName = (supplierCode: string) => {
    if (!supplierCode) return '';
    const supplier = suppliers.find(s => s.code === supplierCode || s.id === supplierCode);
    return supplier ? supplier.name : supplierCode;
  };

  // Sejour türünü belirle
  const getSejourType = (sejourId: string) => {
    if (sejourId && sejourId.startsWith('project:')) return 'MICE';
    const sejour = sejours.find(s => s.id === sejourId);
    if (!sejour) return 'Sejour';
    return 'Sejour';
  };

  // Sıralama fonksiyonu
  const handleSort = (field: keyof Ticket) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Voucher numarasına tıklandığında önizleme aç
  const handleVoucherClick = (sejourId: string) => {
    if (sejourId && sejourId.startsWith('project:')) {
      const projectId = sejourId.replace('project:', '');
      window.open(`/projects/${projectId}`, '_blank');
    } else {
      window.open(`/sejour/${sejourId}`, '_blank');
    }
  };

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets.filter(t => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const statusCardCounts = useMemo(
    () => ({
      all: tickets.length,
      pending: tickets.filter(t => t.status === 'pending').length,
      confirmed: tickets.filter(t => t.status === 'confirmed').length,
      completed: tickets.filter(t => t.status === 'completed').length,
      cancelled: tickets.filter(t => t.status === 'cancelled').length
    }),
    [tickets]
  );

  const voucherSuggestions = useMemo(
    () => Array.from(new Set(tickets.map(t => (t.voucherNumber || '').trim()).filter(Boolean))),
    [tickets]
  );
  const customerSuggestions = useMemo(() => {
    const s = new Set<string>();
    tickets.forEach(t => {
      if ((t.customerName || '').trim()) s.add(t.customerName.trim());
      if ((t.agencyName || '').trim()) s.add(t.agencyName.trim());
    });
    return Array.from(s);
  }, [tickets]);
  const pnrSuggestions = useMemo(
    () => Array.from(new Set(tickets.map(t => (t.pnr || '').trim()).filter(Boolean))),
    [tickets]
  );
  const airlineSuggestions = useMemo(
    () => Array.from(new Set(tickets.map(t => (t.airline || '').trim()).filter(Boolean))),
    [tickets]
  );
  const supplierSuggestions = useMemo(() => {
    const s = new Set<string>();
    tickets.forEach(t => {
      const code = (t.ticketingProvider || '').trim();
      if (!code) return;
      s.add(code);
      const name = suppliers.find((sup: any) => sup.id === code || sup.code === code)?.name;
      if (name?.trim()) s.add(name.trim());
    });
    return Array.from(s);
  }, [tickets, suppliers]);
  const guestSuggestions = useMemo(
    () => Array.from(new Set(tickets.map(t => (t.guestNames || '').trim()).filter(Boolean))),
    [tickets]
  );

  const clearAllFilters = () => {
    setStatusFilter('all');
    setDraftTicketingStart('');
    setDraftTicketingEnd('');
    setDateRange({ startDate: '', endDate: '' });
    setDraftFlightStart('');
    setDraftFlightEnd('');
    setFlightDateRange({ startDate: '', endDate: '' });
    setVoucherTokens([]);
    setVoucherInput('');
    setCustomerTokens([]);
    setCustomerInput('');
    setPnrTokens([]);
    setPnrInput('');
    setAirlineTokens([]);
    setAirlineInput('');
    setSupplierTokens([]);
    setSupplierInput('');
    setGuestTokens([]);
    setGuestInput('');
    setPage(1);
  };

  // Sıralama uygula
  const sortedTickets = filteredTickets;
  const paginatedTickets = {
    items: sortedTickets,
    page,
    pageSize,
    total: totalCount,
    totalPages
  };

  // Özet verileri hesapla (Voucher No ve PNR'a göre grupla)
  const summaryData = useMemo(() => {
    if (!filteredTickets.length) return [];
    
    const summaryMap = new Map();
    
    filteredTickets.forEach(ticket => {
      const key = `${ticket.voucherNumber}-${ticket.pnr}`;
      
      if (summaryMap.has(key)) {
        const existing = summaryMap.get(key);
        existing.flightCount++;
        existing.totalCost += ticket.costPrice || 0;
        existing.totalPrice += ticket.price || 0;
        existing.flightDates.push(ticket.flightDate);
        // MICE dönüş tarih/saat bilgilerini de topla
        if (ticket.returnDate) {
          (existing.returnDates ||= []).push(ticket.returnDate);
        }
        if (ticket.returnDepartureTime) {
          existing.arrivalTime = existing.arrivalTime || ticket.returnDepartureTime;
        }
        if (!existing.departureTime && ticket.departureTime) existing.departureTime = ticket.departureTime;
        existing.airlines.add(ticket.airline);
        existing.routes.add(ticket.route);
        // Ek detayları da ekle
        if (ticket.ticketingProvider) existing.ticketingProvider = ticket.ticketingProvider;
        if (ticket.flightNo) existing.flightNo = ticket.flightNo;
        if (ticket.ticketingDate) existing.ticketingDate = ticket.ticketingDate;
        if (ticket.notes) existing.notes = ticket.notes;
        if (ticket.created_at) existing.created_at = ticket.created_at;
        if (ticket.guestNames) existing.guestNames = existing.guestNames || ticket.guestNames;
        // C-IN/C-OUT ve Firma bilgilerini ekle (ilk geleni koru)
        if (!existing.checkInDate && ticket.checkInDate) existing.checkInDate = ticket.checkInDate;
        if (!existing.checkOutDate && ticket.checkOutDate) existing.checkOutDate = ticket.checkOutDate;
        if (!existing.companyName && (ticket as any).companyName) existing.companyName = (ticket as any).companyName;
      } else {
        summaryMap.set(key, {
          voucherNumber: ticket.voucherNumber,
          pnr: ticket.pnr,
          customerName: ticket.customerName,
          agencyName: ticket.agencyName,
          flightCount: 1,
          totalCost: ticket.costPrice || 0,
          totalPrice: ticket.price || 0,
          costCurrency: ticket.costCurrency,
          priceCurrency: ticket.currency,
          flightDates: [ticket.flightDate],
          airlines: new Set([ticket.airline]),
          routes: new Set([ticket.route]),
          sejourId: ticket.sejourId,
          guestNames: ticket.guestNames,
          checkInDate: ticket.checkInDate,
          checkOutDate: ticket.checkOutDate,
          companyName: (ticket as any).companyName,
          // Ek detaylar
          ticketingProvider: ticket.ticketingProvider,
          flightNo: ticket.flightNo,
          departureTime: ticket.departureTime,
          arrivalTime: ticket.returnDepartureTime || ticket.arrivalTime,
          ticketingDate: ticket.ticketingDate,
          notes: ticket.notes,
          created_at: ticket.created_at,
          returnDates: ticket.returnDate ? [ticket.returnDate] : []
        });
      }
    });
    
    return Array.from(summaryMap.values()).map(item => {
      // Filtrelere uygun uçuş tarihlerini filtrele
      let filteredFlightDates: string[] = [...new Set(item.flightDates)].filter((date): date is string => typeof date === 'string');
      
      // Uçuş tarihi filtresi uygula
      if (flightDateRange.startDate) {
        filteredFlightDates = filteredFlightDates.filter((date: string) => 
          new Date(date) >= new Date(flightDateRange.startDate)
        );
      }
      
      if (flightDateRange.endDate) {
        filteredFlightDates = filteredFlightDates.filter((date: string) => 
          new Date(date) <= new Date(flightDateRange.endDate)
        );
      }
      
      // Biletleme tarihi filtresi uygula
      if (dateRange.startDate) {
        filteredFlightDates = filteredFlightDates.filter((date: string) => 
          new Date(date) >= new Date(dateRange.startDate)
        );
      }
      
      if (dateRange.endDate) {
        filteredFlightDates = filteredFlightDates.filter((date: string) => 
          new Date(date) <= new Date(dateRange.endDate)
        );
      }
      
      // Gidiş ve dönüş tarihleri
      const departureRoutes = new Set<string>();
      const returnRoutes = new Set<string>();
      const departureDates = new Set<string>();
      const returnDates = new Set<string>(Array.isArray(item.returnDates) ? item.returnDates : []);
      // Gidiş tarihini mevcut flightDates'ten ilk değer olarak kabul et
      item.flightDates.forEach((date: unknown) => {
        if (typeof date === 'string' && departureDates.size === 0) {
          departureDates.add(date);
        }
      });

      // Eğer dönüş tarihi set edilmemişse (Sejour senaryosu), tüm uçuş tarihleri içinden en geç tarihi dönüş olarak ata
      if (returnDates.size === 0) {
        const uniqueSorted = [...new Set(item.flightDates.filter((d: any) => typeof d === 'string'))].sort();
        if (uniqueSorted.length > 1) {
          returnDates.add(uniqueSorted[uniqueSorted.length - 1]);
        }
      }
      
      // Route'ları da ayır (basit mantık)
      const routeArray = Array.from(item.routes);
      if (routeArray.length > 0 && typeof routeArray[0] === 'string') {
        departureRoutes.add(routeArray[0]);
      }
      if (routeArray.length > 1 && typeof routeArray[1] === 'string') {
        returnRoutes.add(routeArray[1]);
      }
      
      return {
        ...item,
        airlines: Array.from(item.airlines).join(', '),
        departureRoute: Array.from(departureRoutes).join(', '),
        returnRoute: Array.from(returnRoutes).join(', '),
        departureDate: Array.from(departureDates).sort().join(', '),
        returnDate: Array.from(returnDates).sort().join(', '),
        originalFlightDates: [...new Set(item.flightDates)].sort().join(', '),
        flightDates: filteredFlightDates.sort().join(', '),
        // Filtrelenmiş tarihlere göre uçuş sayısını güncelle
        filteredFlightCount: filteredFlightDates.length
      };
    });
  }, [filteredTickets, flightDateRange, dateRange]);
  const paginatedSummary = paginateItems(summaryData, page, pageSize);
  const listTotalPages = activeTab === 'detail' ? totalPages : paginatedSummary.totalPages;
  const listPage = activeTab === 'detail' ? page : paginatedSummary.page;
  const listTotalCount = activeTab === 'detail' ? totalCount : paginatedSummary.total;

  useEffect(() => {
    setPage(1);
  }, [activeTab, scopedSearchState, sortField, sortDirection, dateRange.startDate, dateRange.endDate, flightDateRange.startDate, flightDateRange.endDate, statusFilter]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.TICKETS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <a href="/operations" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Operasyonlara Dön
          </a>
        </div>
      </div>
    );
  }

  if (!initialFetchDone && loading) {
    return <LoadingSpinner message="Operasyon biletleri yükleniyor..." />;
  }

  return (
    <div className="flex flex-col h-screen p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0 overflow-hidden font-sans">
      <div className="w-full min-w-0 flex flex-col h-full gap-2">
        {/* Header */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Bilet Opsiyon Takip</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Uçak biletlerinin opsiyon tarihlerini ve detaylarını yönetin</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                const enriched = tickets.map(t => ({
                  ...t,
                  guestNames: t.guestNames || '',
                  ticketingProviderName: suppliers.find((sup: any) => sup.id === t.ticketingProvider || sup.code === t.ticketingProvider)?.name || t.ticketingProvider || ''
                }));
                await exportDetailsExcel(enriched);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 shadow-sm text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Detay Excel
            </button>
            <button
              type="button"
              onClick={async () => {
                await exportSummaryExcel(summaryData, suppliers);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 shadow-sm text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Özet Excel
            </button>
          </div>
        </div>

        {/* Tab Sistemi (Source & View) */}
        <div className="flex flex-col gap-1">
          {/* Source Tabs */}
          <div className="flex gap-1 bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl w-full font-semibold">
            <button
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              Tüm Biletler ({typeCounts.all})
            </button>
            <button
              onClick={() => { setFilter('mice'); setPage(1); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm transition-all duration-200 ${
                filter === 'mice'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              MICE ({typeCounts.mice})
            </button>
            <button
              onClick={() => { setFilter('sejour'); setPage(1); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm transition-all duration-200 ${
                filter === 'sejour'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              Sejour ({typeCounts.sejour})
            </button>
          </div>
          
          {/* View Tabs */}
          <div className="flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-100 dark:border-gray-700 w-full shadow-sm">
            <button
              onClick={() => setActiveTab('detail')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all duration-200 ${
                activeTab === 'detail'
                  ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-inner'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              📋 Detay Verileri
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all duration-200 ${
                activeTab === 'summary'
                  ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-inner'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              📊 Özet Verileri
            </button>
          </div>
        </div>

      {/* Content */}
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0">
        {/* Arama ve Filtreleme */}
        <div key={filterKey} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-2 w-full min-w-0">
          <div className="grid w-full min-w-0 items-end gap-x-1 gap-y-1" style={{ gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1.5fr 1fr 1fr 1.2fr auto' }}>
            <DateRangeField
              label="Opsiyon Tarihi"
              startValue={dateRange.startDate}
              endValue={dateRange.endDate}
              onStartChange={(v) => setDraftTicketingStart(v)}
              onEndChange={(v) => setDraftTicketingEnd(v)}
              onApply={handleApplyTicketingDates}
            />
            <DateRangeField
              label="Uçuş Tarihi"
              startValue={flightDateRange.startDate}
              endValue={flightDateRange.endDate}
              onStartChange={(v) => setDraftFlightStart(v)}
              onEndChange={(v) => setDraftFlightEnd(v)}
              onApply={handleApplyFlightDates}
            />
            <MultiTokenFilterInput
              label="Voucher"
              tokens={voucherTokens}
              inputValue={voucherInput}
              suggestions={voucherSuggestions}
              onInputChange={setVoucherInput}
              onAddToken={(v) => addToken(v, setVoucherTokens, setVoucherInput)}
              onRemoveToken={(v) => removeToken(v, setVoucherTokens)}
            />
            <MultiTokenFilterInput
              label="Acente / Firma"
              tokens={customerTokens}
              inputValue={customerInput}
              suggestions={customerSuggestions}
              onInputChange={setCustomerInput}
              onAddToken={(v) => addToken(v, setCustomerTokens, setCustomerInput)}
              onRemoveToken={(v) => removeToken(v, setCustomerTokens)}
            />
            <MultiTokenFilterInput
              label="Misafir"
              tokens={guestTokens}
              inputValue={guestInput}
              suggestions={guestSuggestions}
              onInputChange={setGuestInput}
              onAddToken={(v) => addToken(v, setGuestTokens, setGuestInput)}
              onRemoveToken={(v) => removeToken(v, setGuestTokens)}
            />
            <MultiTokenFilterInput
              label="PNR"
              tokens={pnrTokens}
              inputValue={pnrInput}
              suggestions={pnrSuggestions}
              onInputChange={setPnrInput}
              onAddToken={(v) => addToken(v, setPnrTokens, setPnrInput)}
              onRemoveToken={(v) => removeToken(v, setPnrTokens)}
            />
            <MultiTokenFilterInput
              label="Havayolu"
              tokens={airlineTokens}
              inputValue={airlineInput}
              suggestions={airlineSuggestions}
              onInputChange={setAirlineInput}
              onAddToken={(v) => addToken(v, setAirlineTokens, setAirlineInput)}
              onRemoveToken={(v) => removeToken(v, setAirlineTokens)}
            />
            <MultiTokenFilterInput
              label="Tedarikçi"
              tokens={supplierTokens}
              inputValue={supplierInput}
              suggestions={supplierSuggestions}
              onInputChange={setSupplierInput}
              onAddToken={(v) => addToken(v, setSupplierTokens, setSupplierInput)}
              onRemoveToken={(v) => removeToken(v, setSupplierTokens)}
            />
            <button
              type="button"
              onClick={clearFilters}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors duration-200 shrink-0 shadow-sm"
              title="Filtreleri Temizle"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0 relative">
          {tableBusy && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-gray-900/50 backdrop-blur-[1px]"
              aria-busy="true"
              aria-label="Yükleniyor"
            >
              <div className="relative h-8 w-8">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-600" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
              </div>
            </div>
          )}
          <div className="overflow-auto w-full flex-1">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  {activeTab === 'detail' ? (
                    <>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('voucherNumber')}
                  >
                    <div className="flex items-center">
                      Voucher
                      {sortField === 'voucherNumber' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('ticketingDate')}
                  >
                    <div className="flex items-center">
                          BİLETLEME TARİHİ
                          {sortField === 'ticketingDate' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('sejourId')}
                  >
                    <div className="flex items-center">
                      Tür
                      {sortField === 'sejourId' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[6.25rem] min-w-[6.25rem] max-w-[6.25rem] align-top"
                    onClick={() => handleSort('checkInOut')}
                  >
                    <div className="flex items-center gap-0.5">
                      <div className="flex flex-col items-start leading-tight gap-0">
                        <span className="text-xs tracking-wide">C-IN</span>
                        <span className="text-xs tracking-wide">C-OUT</span>
                      </div>
                      {sortField === 'checkInOut' && (
                        <span className="shrink-0 self-center text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('companyName')}
                  >
                    <div className="flex items-center">
                          FİRMA ADI
                      {sortField === 'companyName' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[11rem] min-w-[11rem] max-w-[11rem] align-top"
                    onClick={() => handleSort('customerName')}
                  >
                    <div className="flex items-center gap-0.5">
                      <div className="flex flex-col items-start leading-tight gap-0">
                        <span className="text-xs tracking-wide">ACENTE</span>
                        <span className="text-xs tracking-wide">MÜŞTERİ</span>
                      </div>
                      {sortField === 'customerName' && (
                        <span className="shrink-0 self-center text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[12rem] min-w-[12rem] max-w-[12rem] align-top"
                  >
                    <div className="flex flex-col items-start leading-tight gap-0">
                      <span className="text-xs tracking-wide">MİSAFİR</span>
                      <span className="text-xs tracking-wide">ADI</span>
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('pnr')}
                  >
                    <div className="flex items-center">
                      PNR
                      {sortField === 'pnr' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('flightDate')}
                  >
                    <div className="flex items-center">
                      Uçuş Tarihi
                      {sortField === 'flightDate' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="flex items-center">
                      GİDİŞ SAATİ
                    </div>
                  </th>
                  {/* MICE özel sütunları */}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dönüş Tarihi</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">DÖNÜŞ SAATİ</th>
                  
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('airline')}
                      >
                        <div className="flex items-center">
                          HAVAYOLU
                          {sortField === 'airline' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('route')}
                      >
                        <div className="flex items-center">
                          GÜZERGAH
                          {sortField === 'airline' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('flightNo')}
                      >
                        <div className="flex items-center">
                          UÇUŞ NO
                          {sortField === 'flightNo' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[9rem] min-w-[9rem] max-w-[9rem] align-top"
                        onClick={() => handleSort('ticketingProvider')}
                      >
                        <div className="flex items-center gap-0.5">
                          <span className="text-xs tracking-wide leading-tight">TEDARİKÇİ</span>
                          {sortField === 'ticketingProvider' && (
                            <span className="shrink-0 text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('costPrice')}
                      >
                        <div className="flex items-center">
                          MALİYET
                          {sortField === 'costPrice' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('costCurrency')}
                      >
                        <div className="flex items-center">
                          MALİYET DÖVİZİ
                          {sortField === 'costCurrency' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                    </>
                  ) : (
                    <>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('voucherNumber')}
                      >
                        <div className="flex items-center">
                          VOUCHER
                          {sortField === 'voucherNumber' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('ticketingDate')}
                      >
                        <div className="flex items-center">
                          BİLETLEME TARİHİ
                          {sortField === 'ticketingDate' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('sejourId')}
                      >
                        <div className="flex items-center">
                          TÜR
                          {sortField === 'sejourId' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[6.25rem] min-w-[6.25rem] max-w-[6.25rem] align-top"
                        onClick={() => handleSort('checkInOut')}
                      >
                        <div className="flex items-center gap-0.5">
                          <div className="flex flex-col items-start leading-tight gap-0">
                            <span className="text-xs tracking-wide">C-IN</span>
                            <span className="text-xs tracking-wide">C-OUT</span>
                          </div>
                          {sortField === 'checkInOut' && (
                            <span className="shrink-0 self-center text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('companyName')}
                      >
                        <div className="flex items-center">
                          FİRMA ADI
                          {sortField === 'companyName' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[11rem] min-w-[11rem] max-w-[11rem] align-top"
                        onClick={() => handleSort('customerName')}
                      >
                        <div className="flex items-center gap-0.5">
                          <div className="flex flex-col items-start leading-tight gap-0">
                            <span className="text-xs tracking-wide">ACENTE</span>
                            <span className="text-xs tracking-wide">MÜŞTERİ</span>
                          </div>
                          {sortField === 'customerName' && (
                            <span className="shrink-0 self-center text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[12rem] min-w-[12rem] max-w-[12rem] align-top"
                      >
                        <div className="flex flex-col items-start leading-tight gap-0">
                          <span className="text-xs tracking-wide">MİSAFİR</span>
                          <span className="text-xs tracking-wide">ADI</span>
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('pnr')}
                      >
                        <div className="flex items-center">
                          PNR
                          {sortField === 'pnr' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('flightDate')}
                      >
                        <div className="flex items-center">
                          GİDİŞ TARİHİ
                          {sortField === 'flightDate' && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-center">
                          GİDİŞ SAATİ
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-center">
                          DÖNÜŞ TARİHİ
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-center">
                          DÖNÜŞ SAATİ
                        </div>
                      </th>
                      
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('airline')}
                  >
                    <div className="flex items-center">
                      Havayolu
                      {sortField === 'airline' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('route')}
                  >
                    <div className="flex items-center">
                      Güzergah
                      {sortField === 'route' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('flightNo')}
                  >
                    <div className="flex items-center">
                      Uçuş No
                      {sortField === 'flightNo' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[9rem] min-w-[9rem] max-w-[9rem] align-top"
                    onClick={() => handleSort('ticketingProvider')}
                  >
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs tracking-wide leading-tight">TEDARİKÇİ</span>
                      {sortField === 'ticketingProvider' && (
                        <span className="shrink-0 text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('costPrice')}
                  >
                    <div className="flex items-center">
                      Maliyet
                      {sortField === 'costPrice' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('costCurrency')}
                  >
                    <div className="flex items-center">
                      Maliyet Dövizi
                      {sortField === 'costCurrency' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>

                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {activeTab === 'detail' ? (
                  paginatedTickets.items.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                        <button
                          onClick={() => handleVoucherClick(ticket.sejourId)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors duration-200"
                        >
                          {ticket.voucherNumber}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{formatDateCustom(ticket.ticketingDate)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          'bg-blue-100 text-blue-800 dark:bg-gray-800/30 dark:text-blue-400'
                        }`}>
                          {getSejourType(ticket.sejourId)}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-xs text-gray-900 dark:text-white w-[6.25rem] min-w-[6.25rem] max-w-[6.25rem] align-top">
                        {ticket.checkInDate && ticket.checkOutDate ? (
                          <div className="flex flex-col leading-tight gap-0">
                            <span className="block truncate" title={formatDateCustom(ticket.checkInDate)}>
                              {formatDateCustom(ticket.checkInDate)}
                            </span>
                            <span className="block truncate" title={formatDateCustom(ticket.checkOutDate)}>
                              {formatDateCustom(ticket.checkOutDate)}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {ticket.companyName || '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white w-[11rem] min-w-[11rem] max-w-[11rem]">
                        <span className="block truncate" title={agencyCustomerTooltip(ticket) || agencyCustomerLine(ticket)}>
                          {agencyCustomerLine(ticket)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white w-[12rem] min-w-[12rem] max-w-[12rem]">
                        <span
                          className="block truncate whitespace-nowrap overflow-hidden text-ellipsis"
                          title={(ticket.guestNames && ticket.guestNames.trim()) || getGuestNames(ticket.sejourId)}
                        >
                          {(ticket.guestNames && ticket.guestNames.trim()) || getGuestNames(ticket.sejourId)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{ticket.pnr}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{formatDateCustom(ticket.flightDate)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {ticket.departureTime ? formatTime(ticket.departureTime) : '-'}
                      </td>
                      {/* MICE özel hücreler: sadece project:* için değer göster, aksi halde '-' */}
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {ticket.sejourId?.startsWith('project:') ? (ticket.returnDate ? formatDateCustom(ticket.returnDate) : '-') : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {ticket.sejourId?.startsWith('project:') ? (ticket.returnDepartureTime ? formatTime(ticket.returnDepartureTime) : '-') : '-'}
                      </td>
                      
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{ticket.airline}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{ticket.route}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{ticket.flightNo}</td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white w-[9rem] min-w-[9rem] max-w-[9rem]">
                        <span
                          className="block truncate whitespace-nowrap"
                          title={getSupplierName(ticket.ticketingProvider) || ''}
                        >
                          {getSupplierName(ticket.ticketingProvider)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{formatNumber(ticket.costPrice)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{ticket.costCurrency}</td>
                    </tr>
                  ))
                ) : (
                  paginatedSummary.items.map((summary: any, idx: number) => (
                    <tr key={`${summary.voucherNumber}-${summary.pnr}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                        <button
                          onClick={() => handleVoucherClick(summary.sejourId)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors duration-200"
                        >
                          {summary.voucherNumber}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {summary.ticketingDate ? formatDateCustom(summary.ticketingDate) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          'bg-blue-100 text-blue-800 dark:bg-gray-800/30 dark:text-blue-400'
                        }`}>
                          {getSejourType(summary.sejourId)}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-xs text-gray-900 dark:text-white w-[6.25rem] min-w-[6.25rem] max-w-[6.25rem] align-top">
                        {summary.checkInDate && summary.checkOutDate ? (
                          <div className="flex flex-col leading-tight gap-0">
                            <span className="block truncate" title={formatDateCustom(summary.checkInDate)}>
                              {formatDateCustom(summary.checkInDate)}
                            </span>
                            <span className="block truncate" title={formatDateCustom(summary.checkOutDate)}>
                              {formatDateCustom(summary.checkOutDate)}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {summary.companyName || '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white w-[11rem] min-w-[11rem] max-w-[11rem]">
                        <span className="block truncate" title={agencyCustomerTooltip(summary) || agencyCustomerLine(summary)}>
                          {agencyCustomerLine(summary)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white w-[12rem] min-w-[12rem] max-w-[12rem]">
                        <span
                          className="block truncate whitespace-nowrap overflow-hidden text-ellipsis"
                          title={(summary.guestNames && summary.guestNames.trim()) || getGuestNames(summary.sejourId)}
                        >
                          {(summary.guestNames && summary.guestNames.trim()) || getGuestNames(summary.sejourId)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {summary.pnr || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {summary.departureDate ? formatDateCustom(summary.departureDate) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {summary.departureTime ? formatTime(summary.departureTime) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {summary.returnDate ? formatDateCustom(summary.returnDate) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {summary.arrivalTime ? formatTime(summary.arrivalTime) : '-'}
                      </td>
                      
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {summary.airline || summary.airlines || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {summary.route || summary.departureRoute || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {summary.flightNo || '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white w-[9rem] min-w-[9rem] max-w-[9rem]">
                        <span
                          className="block truncate whitespace-nowrap"
                          title={getSupplierName(summary.ticketingProvider) || ''}
                        >
                          {getSupplierName(summary.ticketingProvider) || '-'}
                        </span>
                      </td>
                      
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {formatNumber(summary.costPrice || summary.totalCost || 0)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                        {summary.costCurrency || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {listTotalCount > 0 && (
            <div className="flex justify-end px-2 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                <span className="text-sm">Toplam {listTotalCount} kayıt</span>
                <button
                  type="button"
                  className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                  disabled={listPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                <span className="text-sm font-medium">{listPage}</span>
                <button
                  type="button"
                  className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                  disabled={listPage >= listTotalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </button>
                <select
                  value={pageSize}
                  className="h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 text-sm"
                  onChange={(e) => {
                    const size = Number(e.target.value) || DEFAULT_PAGE_SIZE;
                    setPageSize(size);
                    setPage(1);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size} / sayfa</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>



        {/* Error and Success Messages */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg transition-colors duration-200 z-50">
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg transition-colors duration-200 z-50">
            {success}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}