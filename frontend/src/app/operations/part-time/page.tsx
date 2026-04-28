'use client';

import { useState, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatNumber, formatDate } from '@/utils/formatters';
import PaginationControls from '@/components/PaginationControls';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { usePermissions, Module } from '@/lib/permissions';

interface PartTimeService {
  id: string;
  sejour_id: string;
  voucher_number: string;
  customer_type: 'sejour' | 'mice';
  project_type?: 'project';
  project_id?: string;
  check_in_date: string;
  check_out_date: string;
  employee_name: string;
  service_type: string;
  customer_name?: string;
  company_name?: string;
  hotel_name?: string;
  supplier: string;
  description: string;
  price: number;
  currency: string;
  cost_price: number;
  cost_currency: string;
  fx?: number;
  totalTRY?: number;
  hours?: string;
  status: 'active' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
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

interface DateRangeFieldProps {
  label: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
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

function DateRangeField({ label, startValue, endValue, onStartChange, onEndChange }: DateRangeFieldProps) {
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

  const openCalendar = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setCalendarStyle({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 680))
      });
    }
    setIsCalendarOpen(true);
  };

  const handleStartTextChange = (value: string) => {
    setStartText(value);
    const parsed = parseTypedDate(value);
    if (parsed !== null) onStartChange(parsed);
  };

  const handleEndTextChange = (value: string) => {
    setEndText(value);
    const parsed = parseTypedDate(value);
    if (parsed !== null) onEndChange(parsed);
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
          onFocus={openCalendar}
          placeholder="gg.aa.yyyy"
          className="w-full min-w-0 h-8 px-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <input
          value={endText}
          onChange={(e) => handleEndTextChange(e.target.value)}
          onFocus={openCalendar}
          placeholder="gg.aa.yyyy"
          className="w-full min-w-0 h-8 px-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      {isCalendarOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={calendarRef}
            className="transfer-range-datepicker-popover fixed z-[300] w-max max-w-[calc(100vw-1rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl p-1.5 overflow-x-auto"
            style={{ top: `${calendarStyle.top}px`, left: `${calendarStyle.left}px` }}
          >
            <DatePicker
              inline
              locale={tr}
              monthsShown={2}
              selectsRange
              startDate={calStart}
              endDate={calEnd}
              onChange={(dates) => {
                const [start, end] = dates as [Date | null, Date | null];
                setPickerRange([start, end]);
                if (start && end) {
                  onStartChange(toIsoDate(start));
                  onEndChange(toIsoDate(end));
                  setIsCalendarOpen(false);
                }
              }}
              openToDate={calStart || calEnd || new Date()}
              calendarClassName="!text-xs"
            />
          </div>,
          document.body
        )}
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
      const alreadyAdded = tokens.some((token) => token.toLowerCase() === normalizedItem);
      return !alreadyAdded && normalizedInput.length > 0 && normalizedItem.includes(normalizedInput);
    })
    .slice(0, 6);

  const handleAdd = (raw: string) => {
    onAddToken(raw);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="relative min-w-0">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5 leading-snug truncate" title={label}>
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

export default function PartTimePage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [partTimeServices, setPartTimeServices] = useState<PartTimeService[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [tableBusy, setTableBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Voucher numarasına tıklandığında önizleme aç
  const handleVoucherClick = (sejourId: string, projectType?: string, projectId?: string) => {
    if (projectType === 'project' && projectId) {
      window.open(`/projects/${projectId}`, '_blank');
    } else {
      window.open(`/sejour/${sejourId}`, '_blank');
    }
  };

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
    setTokens((prev) => prev.filter((item) => item !== value));
  };

  const [voucherTokens, setVoucherTokens] = useState<string[]>([]);
  const [voucherInput, setVoucherInput] = useState('');
  const [customerTokens, setCustomerTokens] = useState<string[]>([]);
  const [customerInput, setCustomerInput] = useState('');
  const [hotelTokens, setHotelTokens] = useState<string[]>([]);
  const [hotelInput, setHotelInput] = useState('');
  const [supplierTokens, setSupplierTokens] = useState<string[]>([]);
  const [supplierInput, setSupplierInput] = useState('');
  const [employeeTokens, setEmployeeTokens] = useState<string[]>([]);
  const [employeeInput, setEmployeeInput] = useState('');

  const voucherTerms = useMemo(() => [...voucherTokens], [voucherTokens]);
  const customerTerms = useMemo(() => [...customerTokens], [customerTokens]);
  const hotelTerms = useMemo(() => [...hotelTokens], [hotelTokens]);
  const supplierTerms = useMemo(() => [...supplierTokens], [supplierTokens]);
  const employeeTerms = useMemo(() => [...employeeTokens], [employeeTokens]);

  const scopedSearchState = useMemo(
    () => JSON.stringify({ voucherTerms, customerTerms, hotelTerms, supplierTerms, employeeTerms }),
    [voucherTerms, customerTerms, hotelTerms, supplierTerms, employeeTerms]
  );
  const [sortField, setSortField] = useState<keyof PartTimeService>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const [filterKey, setFilterKey] = useState<number>(0);
  const [forceReload, setForceReload] = useState<number>(0);



  useEffect(() => {
    const handleProjectChange = () => setForceReload((prev) => prev + 1);
    const handleStorage = () => setForceReload((prev) => prev + 1);
    window.addEventListener('projectUpdated', handleProjectChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('projectUpdated', handleProjectChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);


  const loadPartTimeServices = async () => {
    try {
      if (!initialFetchDone) setLoading(true);
      else setTableBusy(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        searchTerm: '',
        sortField: String(sortField),
        sortDirection,
        startDate: dateRange.startDate || '',
        endDate: dateRange.endDate || '',
        voucherTerms: JSON.stringify(voucherTerms),
        customerTerms: JSON.stringify(customerTerms),
        hotelTerms: JSON.stringify(hotelTerms),
        supplierTerms: JSON.stringify(supplierTerms),
        employeeTerms: JSON.stringify(employeeTerms)
      });
      const response = await fetch(`/api/operations/part-time?${params.toString()}`);
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Part-time verileri alinamadi');
      }
      setPartTimeServices(Array.isArray(result.data) ? result.data : []);
      setTotalCount(Number(result.total || 0));
      setTotalPages(Number(result.totalPages || 1));
    } catch (error) {
      console.error('Part-Time hizmet verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
      setTableBusy(false);
      setInitialFetchDone(true);
    }
  };

  useEffect(() => {
    loadPartTimeServices();
  }, [page, pageSize, scopedSearchState, sortField, sortDirection, dateRange.startDate, dateRange.endDate, forceReload]);

  // Filtreleri temizleme fonksiyonu - Part-Time sayfası için
  const clearPartTimeFilters = () => {
    setVoucherTokens([]);
    setVoucherInput('');
    setCustomerTokens([]);
    setCustomerInput('');
    setHotelTokens([]);
    setHotelInput('');
    setSupplierTokens([]);
    setSupplierInput('');
    setEmployeeTokens([]);
    setEmployeeInput('');
    setDateRange({ startDate: '', endDate: '' });
    setFilterKey((prev) => prev + 1);
    setForceReload((prev) => prev + 1);
  };

  // Excel export fonksiyonu - Bilet sayfası formatında header ile
  const exportPartTimeToExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('TEMPUS TRAVEL - Part-Time Hizmetler');
      sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } } as any;
      
      // Header band
      const top = sheet.addRow([]); 
      top.height = 48; 
      sheet.mergeCells('A1:N1');
      for (let c = 1; c <= 14; c++) { 
        sheet.getRow(1).getCell(c).value=''; 
        sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any; 
      }
      
      // Logos (Supabase settings)
      let iconLogoBase64: string | undefined; 
      let wordmarkLogoBase64: string | undefined;
      try {
        const { SettingsService } = await import('@/lib/supabaseService');
        const settings = await SettingsService.getSettings();
        const general = settings?.general_settings || {};
        iconLogoBase64 = general?.icon_logo;
        wordmarkLogoBase64 = general?.wordmark_logo;
      } catch {}
      
      const inchToPx = (inch: number) => Math.round(inch * 96);
      const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
      
      if (iconLogoBase64) { 
        const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) }); 
        sheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any); 
      }
      if (wordmarkLogoBase64) { 
        const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) }); 
        sheet.addImage(markId, { tl: { col: 11.5, row: 0.23 }, ext: { width: inchToPx(2.0), height: inchToPx(0.50) } as any } as any); 
      }

      // Sütun tanımları
      sheet.columns = [
        { header: 'Voucher', key: 'voucher_number', width: 16 },
        { header: 'Tarih', key: 'check_in_date', width: 14 },
        { header: 'Tür', key: 'customer_type', width: 12 },
        { header: 'C-IN / C-OUT', key: 'check_in_out', width: 20 },
        { header: 'Firma Adı', key: 'company_name', width: 20 },
        { header: 'Acente/Müşteri', key: 'customer_name', width: 20 },
        { header: 'Otel', key: 'hotel_name', width: 18 },
        { header: 'Hizmet Türü', key: 'service_type', width: 18 },
        { header: 'Tedarikçi', key: 'supplier', width: 18 },
        { header: 'Çalışan Adı', key: 'employee_name', width: 18 },
        { header: 'Maliyet', key: 'cost_price', width: 12 },
        { header: 'Döviz', key: 'currency', width: 8 },
        { header: 'Kur', key: 'fx', width: 10 },
        { header: 'Toplam TL', key: 'totalTRY', width: 12 }
      ];
      
      const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
      sheet.getRow(headerRow.number).height = 18;
      
      // Sayısal sütun biçimi
      sheet.getColumn('cost_price').numFmt = '#,##0.00';
      sheet.getColumn('cost_price').alignment = { horizontal: 'right' } as any;
      sheet.getColumn('fx').numFmt = '#,##0.00';
      sheet.getColumn('fx').alignment = { horizontal: 'right' } as any;
      sheet.getColumn('totalTRY').numFmt = '#,##0.00';
      sheet.getColumn('totalTRY').alignment = { horizontal: 'right' } as any;
      
      headerRow.eachCell((cell) => { 
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any; 
        cell.alignment = { vertical: 'middle', horizontal: 'center' } as any; 
      });
      
      const fmtDate = (d?: string) => {
        if (!d) return '';
        try {
          return new Date(d).toLocaleDateString('tr-TR');
        } catch {
          return d;
        }
      };

      const toNum = (num: number | string | undefined): number => {
        if (num == null) return 0;
        const parsed = typeof num === 'string' ? parseFloat(num) : num;
        return Number.isFinite(parsed) ? parsed : 0;
      };

      filteredAndSortedServices.forEach((service: any) => {
        const costPrice = toNum(service.cost_price);
        const fx = toNum(service.fx) || 1;
        const totalTRY = costPrice * fx;
        sheet.addRow({
          voucher_number: service.voucher_number,
          check_in_date: fmtDate(service.check_in_date),
          customer_type: service.customer_type === 'mice' ? 'MICE' : 'Sejour',
          check_in_out: service.check_in_date && service.check_out_date 
            ? `${fmtDate(service.check_in_date)} / ${fmtDate(service.check_out_date)}`
            : service.check_in_date 
            ? fmtDate(service.check_in_date)
            : service.check_out_date
            ? fmtDate(service.check_out_date)
            : '',
          company_name: service.company_name || '',
          customer_name: service.customer_name || '',
          hotel_name: service.hotel_name || '',
          service_type: service.service_type || '',
          supplier: service.supplier || '',
          employee_name: service.employee_name || '',
          cost_price: costPrice,
          currency: service.cost_currency || service.currency || 'TRY',
          fx,
          totalTRY
        });
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob); 
      const link = document.createElement('a');
      link.href = url; 
      link.download = `part_time_hizmetler_${new Date().toISOString().split('T')[0]}.xlsx`; 
      link.click(); 
      window.URL.revokeObjectURL(url);

      setSuccess('Part-Time hizmetler Excel dosyası olarak indirildi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Excel export hatası:', error);
      setError('Excel dosyası oluşturulurken bir hata oluştu!');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSort = (field: keyof PartTimeService) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const voucherSuggestions = useMemo(
    () => Array.from(new Set(partTimeServices.map((s) => (s.voucher_number || '').trim()).filter(Boolean))),
    [partTimeServices]
  );
  const customerSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          partTimeServices
            .flatMap((s) => [s.customer_name, s.company_name].map((x) => (x || '').trim()))
            .filter(Boolean)
        )
      ),
    [partTimeServices]
  );
  const hotelSuggestions = useMemo(
    () => Array.from(new Set(partTimeServices.map((s) => (s.hotel_name || '').trim()).filter(Boolean))),
    [partTimeServices]
  );
  const supplierSuggestions = useMemo(
    () => Array.from(new Set(partTimeServices.map((s) => (s.supplier || '').trim()).filter(Boolean))),
    [partTimeServices]
  );
  const employeeSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const s of partTimeServices) {
      const e = (s.employee_name || '').trim();
      if (e) set.add(e);
      const t = (s.service_type || '').trim();
      if (t) set.add(t);
    }
    return Array.from(set);
  }, [partTimeServices]);

  const filteredAndSortedServices = partTimeServices;

  const paginatedPartTime = {
    items: partTimeServices,
    page,
    pageSize,
    total: totalCount,
    totalPages
  };

  useEffect(() => {
    setPage(1);
  }, [scopedSearchState, dateRange.startDate, dateRange.endDate, sortField, sortDirection]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.PART_TIME)) {
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
    return <LoadingSpinner message="Part-time kayıtları yükleniyor..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col flex-1">
        <div className="mb-4 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Yarı Zamanlı Çalışan Yönetimi</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">MICE ve Sejour part-time operasyonlarını yönetin</p>
          </div>
        </div>

        <div key={filterKey} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 mb-2 w-full min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Arama ve Filtreleme</h3>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={exportPartTimeToExcel}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
              >
                📥 Excel Export
              </button>
              <button
                type="button"
                onClick={clearPartTimeFilters}
                className="w-8 h-8 inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200 shrink-0"
                title="Filtreleri temizle"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <div className="grid w-full min-w-0 items-end gap-x-1 gap-y-1 md:grid-cols-[minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(14rem,1fr)]">
            <MultiTokenFilterInput
              label="Voucher"
              tokens={voucherTokens}
              inputValue={voucherInput}
              suggestions={voucherSuggestions}
              onInputChange={setVoucherInput}
              onAddToken={(value) => addToken(value, setVoucherTokens, setVoucherInput)}
              onRemoveToken={(value) => removeToken(value, setVoucherTokens)}
            />
            <DateRangeField
              label="Hizmet Tarihi"
              startValue={dateRange.startDate}
              endValue={dateRange.endDate}
              onStartChange={(value) => setDateRange((prev) => ({ ...prev, startDate: value }))}
              onEndChange={(value) => setDateRange((prev) => ({ ...prev, endDate: value }))}
            />
            <MultiTokenFilterInput
              label="Acente / Müşteri"
              tokens={customerTokens}
              inputValue={customerInput}
              suggestions={customerSuggestions}
              onInputChange={setCustomerInput}
              onAddToken={(value) => addToken(value, setCustomerTokens, setCustomerInput)}
              onRemoveToken={(value) => removeToken(value, setCustomerTokens)}
            />
            <MultiTokenFilterInput
              label="Otel"
              tokens={hotelTokens}
              inputValue={hotelInput}
              suggestions={hotelSuggestions}
              onInputChange={setHotelInput}
              onAddToken={(value) => addToken(value, setHotelTokens, setHotelInput)}
              onRemoveToken={(value) => removeToken(value, setHotelTokens)}
            />
            <MultiTokenFilterInput
              label="Tedarikçi"
              tokens={supplierTokens}
              inputValue={supplierInput}
              suggestions={supplierSuggestions}
              onInputChange={setSupplierInput}
              onAddToken={(value) => addToken(value, setSupplierTokens, setSupplierInput)}
              onRemoveToken={(value) => removeToken(value, setSupplierTokens)}
            />
            <MultiTokenFilterInput
              label="Çalışan / Hizmet"
              tokens={employeeTokens}
              inputValue={employeeInput}
              suggestions={employeeSuggestions}
              onInputChange={setEmployeeInput}
              onAddToken={(value) => addToken(value, setEmployeeTokens, setEmployeeInput)}
              onRemoveToken={(value) => removeToken(value, setEmployeeTokens)}
            />
          </div>
        </div>

        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0 relative ${tableBusy ? 'opacity-80' : ''}`}>
          <div className="overflow-auto w-full flex-1">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('voucher_number')}
                  >
                    Voucher No
                    {sortField === 'voucher_number' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('check_in_date')}
                  >
                    Tarih
                    {sortField === 'check_in_date' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('customer_type')}
                  >
                    Tür
                    {sortField === 'customer_type' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('check_in_date')}
                  >
                    C-IN / C-OUT
                    {sortField === 'check_in_date' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('company_name')}
                  >
                    FİRMA ADI
                    {sortField === 'company_name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('customer_name')}
                  >
                    ACENTE/MÜŞTERİ
                    {sortField === 'customer_name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('hotel_name')}
                  >
                    Otel
                    {sortField === 'hotel_name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('service_type')}
                  >
                    Hizmet Türü
                    {sortField === 'service_type' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('supplier')}
                  >
                    Tedarikçi
                    {sortField === 'supplier' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('employee_name')}
                  >
                    Çalışan Adı
                    {sortField === 'employee_name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('cost_price')}
                  >
                    Maliyet
                    {sortField === 'cost_price' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('cost_currency')}
                  >
                    Döviz
                    {sortField === 'cost_currency' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('fx')}
                  >
                    Kur
                    {sortField === 'fx' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('totalTRY')}
                  >
                    Toplam TL
                    {sortField === 'totalTRY' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedPartTime.items.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                      <button
                        onClick={() => handleVoucherClick(service.sejour_id, service.project_type, service.project_id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors duration-200"
                      >
                        {service.voucher_number}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {formatDate(service.check_in_date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        service.customer_type === 'mice' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {service.customer_type === 'mice' ? 'MICE' : 'SEJOUR'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {service.check_in_date && service.check_out_date 
                        ? `${formatDate(service.check_in_date)} / ${formatDate(service.check_out_date)}`
                        : '-'
                      }
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {service.company_name || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {service.customer_name || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {service.hotel_name || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {service.service_type}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {service.supplier || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {service.employee_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {formatNumber(service.cost_price)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {service.cost_currency}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {formatNumber(service.fx || 1)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {formatNumber((service.cost_price || 0) * (service.fx || 1))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAndSortedServices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(voucherTerms.length ||
                  customerTerms.length ||
                  hotelTerms.length ||
                  supplierTerms.length ||
                  employeeTerms.length ||
                  dateRange.startDate ||
                  dateRange.endDate)
                  ? 'Arama kriterlerine uygun part-time hizmet bulunamadı.'
                  : 'Henüz part-time hizmet bulunmuyor.'}
              </p>
            </div>
          )}
          <PaginationControls
            page={paginatedPartTime.page}
            pageSize={paginatedPartTime.pageSize}
            total={paginatedPartTime.total}
            totalPages={paginatedPartTime.totalPages}
            preferenceKey="operations_parttime_page_size"
            compactRight
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>

        {/* Success ve Error Mesajları */}
        {success && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {success}
          </div>
        )}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {error}
          </div>
        )}
        
      </div>
    </div>
  );
} 