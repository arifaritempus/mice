'use client';

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import ExcelJS from 'exceljs';
import { getLogosForExcel } from '@/utils/logoUtils';
import { SejourService } from '@/lib/supabaseService';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import DatePicker from 'react-datepicker';
import { format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePermissions, Module } from '@/lib/permissions';

type Currency = 'TRY' | 'USD' | 'EUR' | 'GBP' | string;

interface SejourServiceRow {
  voucherNumber: string;
  customerType: 'agency' | 'customer';
  customerName: string;
  checkInDate: string; // ISO
  checkOutDate: string; // ISO
  hotelName: string;
  guestName: string;
  boardType: string;
  roomType: string;
  accommodationAmount: number;
  accommodationCurrency: Currency;
  flightAmount: number;
  flightCurrency: Currency;
  transferAmount: number;
  transferCurrency: Currency;
  extraAmount: number;
  extraCurrency: Currency;
  totalAmount: number;
  totalCurrency: Currency;
}

interface SejourCostRow {
  voucherNumber: string;
  customerType: 'agency' | 'customer';
  customerName: string;
  checkInDate: string; // ISO
  checkOutDate: string; // ISO
  hotelName: string;
  guestName: string;
  boardType: string;
  roomType: string;
  accommodationCost: number;
  accommodationCurrency: Currency;
  flightCost: number;
  flightCurrency: Currency;
  transferCost: number;
  transferCurrency: Currency;
  extraCost: number;
  extraCurrency: Currency;
  totalCost: number;
  totalCurrency: Currency;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
  total?: number;
}

interface ApiError {
  success: false;
  message?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const PAGE_SIZE_OPTIONS = [20, 30, 50, 100];

function formatCurrency(amount?: number, currency?: string) {
  if (amount == null || Number.isNaN(amount)) return '-';
  const c = currency || 'TRY';
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: c }).format(amount);
  } catch {
    return `${amount.toLocaleString('tr-TR')} ${c}`;
  }
}

function formatDate(date?: string) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('tr-TR');
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
  const startDate = toDate(startValue);
  const endDate = toDate(endValue);
  const [startText, setStartText] = useState(startDate ? formatDateFns(startDate, 'dd.MM.yyyy') : '');
  const [endText, setEndText] = useState(endDate ? formatDateFns(endDate, 'dd.MM.yyyy') : '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    setStartText(startDate ? formatDateFns(startDate, 'dd.MM.yyyy') : '');
  }, [startValue]);

  useEffect(() => {
    setEndText(endDate ? formatDateFns(endDate, 'dd.MM.yyyy') : '');
  }, [endValue]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

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

  return (
    <div className="min-w-0 relative" ref={containerRef}>
      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
      <div className="flex gap-1">
        <input
          value={startText}
          onChange={(e) => handleStartTextChange(e.target.value)}
          onFocus={() => setIsCalendarOpen(true)}
          placeholder="gg.aa.yyyy"
          className="w-full min-w-0 h-8 px-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <input
          value={endText}
          onChange={(e) => handleEndTextChange(e.target.value)}
          onFocus={() => setIsCalendarOpen(true)}
          placeholder="gg.aa.yyyy"
          className="w-full min-w-0 h-8 px-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      {isCalendarOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[560px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl p-2 overflow-x-auto">
          <DatePicker
            inline
            locale={tr}
            monthsShown={2}
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(dates) => {
              const [start, end] = dates as [Date | null, Date | null];
              onStartChange(toIsoDate(start));
              onEndChange(toIsoDate(end));
              if (start && end) setIsCalendarOpen(false);
            }}
            openToDate={startDate || endDate || new Date()}
          />
        </div>
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
  const normalizedInput = inputValue.trim().toLowerCase();
  const filteredSuggestions = suggestions
    .filter((item) => {
      const normalizedItem = item.toLowerCase();
      const alreadyAdded = tokens.some(token => token.toLowerCase() === normalizedItem);
      return !alreadyAdded && normalizedInput.length > 0 && normalizedItem.includes(normalizedInput);
    })
    .slice(0, 6);

  return (
    <div className="relative min-w-0">
      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
      <div className="w-full h-8 px-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto">
        {tokens.map((token, index) => (
          <span key={`${token}-${index}`} className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200">
            +{index + 1}
            <button type="button" className="text-blue-700 dark:text-blue-200 hover:text-red-500" onClick={() => onRemoveToken(token)} title="Kaldır">×</button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddToken(inputValue);
            }
            if (e.key === 'Backspace' && inputValue.length === 0 && tokens.length > 0) {
              onRemoveToken(tokens[tokens.length - 1]);
            }
          }}
          className="flex-1 min-w-[80px] h-full bg-transparent outline-none text-gray-900 dark:text-white"
          placeholder="Yaz, Enter ile ekle"
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-36 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              className="w-full text-left px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onAddToken(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SejourServicesPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState<'sales' | 'costs'>('sales');
  const [rows, setRows] = useState<SejourServiceRow[]>([]);
  const [costRows, setCostRows] = useState<SejourCostRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Satış tabı için filtreler
  const [salesFromDate, setSalesFromDate] = useState<string>('');
  const [salesToDate, setSalesToDate] = useState<string>('');
  const [salesDraftFromDate, setSalesDraftFromDate] = useState<string>('');
  const [salesDraftToDate, setSalesDraftToDate] = useState<string>('');
  const [salesVoucherTokens, setSalesVoucherTokens] = useState<string[]>([]);
  const [salesVoucherInput, setSalesVoucherInput] = useState<string>('');
  const [salesCustomerTokens, setSalesCustomerTokens] = useState<string[]>([]);
  const [salesCustomerInput, setSalesCustomerInput] = useState<string>('');
  const [salesHotelTokens, setSalesHotelTokens] = useState<string[]>([]);
  const [salesHotelInput, setSalesHotelInput] = useState<string>('');
  const [salesGuestTokens, setSalesGuestTokens] = useState<string[]>([]);
  const [salesGuestInput, setSalesGuestInput] = useState<string>('');

  // Alış tabı için filtreler
  const [costFromDate, setCostFromDate] = useState<string>('');
  const [costToDate, setCostToDate] = useState<string>('');
  const [costDraftFromDate, setCostDraftFromDate] = useState<string>('');
  const [costDraftToDate, setCostDraftToDate] = useState<string>('');
  const [costVoucherTokens, setCostVoucherTokens] = useState<string[]>([]);
  const [costVoucherInput, setCostVoucherInput] = useState<string>('');
  const [costCustomerTokens, setCostCustomerTokens] = useState<string[]>([]);
  const [costCustomerInput, setCostCustomerInput] = useState<string>('');
  const [costHotelTokens, setCostHotelTokens] = useState<string[]>([]);
  const [costHotelInput, setCostHotelInput] = useState<string>('');
  const [costGuestTokens, setCostGuestTokens] = useState<string[]>([]);
  const [costGuestInput, setCostGuestInput] = useState<string>('');

  const [forceReload, setForceReload] = useState<number>(0); // Veriyi zorla yeniden yüklemek için

  // Sıralama için state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    const currentVoucherQuery = activeTab === 'sales' ? salesVoucherTokens.join(' ') : costVoucherTokens.join(' ');
    const currentFromDate = activeTab === 'sales' ? salesFromDate : costFromDate;
    const currentToDate = activeTab === 'sales' ? salesToDate : costToDate;

    if (currentVoucherQuery) q.set('voucher', currentVoucherQuery);
    if (currentFromDate) q.set('from', currentFromDate);
    if (currentToDate) q.set('to', currentToDate);
    q.set('_t', String(Date.now())); // cache-bust
    return q.toString();
  }, [salesVoucherTokens, salesFromDate, salesToDate, costVoucherTokens, costFromDate, costToDate, activeTab]);

  // Sıralama fonksiyonu
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sıralanmış veriler
  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows;

    return [...rows].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortConfig]);

  const sortedCostRows = useMemo(() => {


    if (!sortConfig) return costRows;

    return [...costRows].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [costRows, sortConfig]);
  useEffect(() => {
    setPage(1);
  }, [activeTab, salesFromDate, salesToDate, costFromDate, costToDate, sortConfig, salesVoucherTokens, costVoucherTokens, salesCustomerTokens, costCustomerTokens, salesHotelTokens, costHotelTokens, salesGuestTokens, costGuestTokens]);

  useEffect(() => {
    const rangeCompleteOrEmpty =
      (Boolean(salesDraftFromDate) && Boolean(salesDraftToDate)) || (!salesDraftFromDate && !salesDraftToDate);
    if (!rangeCompleteOrEmpty) return;
    setSalesFromDate(salesDraftFromDate);
    setSalesToDate(salesDraftToDate);
    setPage(1);
  }, [salesDraftFromDate, salesDraftToDate]);

  useEffect(() => {
    const rangeCompleteOrEmpty =
      (Boolean(costDraftFromDate) && Boolean(costDraftToDate)) || (!costDraftFromDate && !costDraftToDate);
    if (!rangeCompleteOrEmpty) return;
    setCostFromDate(costDraftFromDate);
    setCostToDate(costDraftToDate);
    setPage(1);
  }, [costDraftFromDate, costDraftToDate]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentVoucherQuery = activeTab === 'sales' ? salesVoucherTokens.join(' ') : costVoucherTokens.join(' ');
      const currentFromDate = activeTab === 'sales' ? salesFromDate : costFromDate;
      const currentToDate = activeTab === 'sales' ? salesToDate : costToDate;
      const response = await SejourService.getSejoursPage({
        page,
        pageSize,
        searchTerm: currentVoucherQuery,
        startDate: currentFromDate,
        endDate: currentToDate,
        sortField: 'check_in_date',
        sortDirection: 'asc',
        statusFilter: 'konfirme'
      });
      const sejourData = response.data;
      setTotalCount(response.total);
      setTotalPages(response.totalPages);

      // Sadece konfirme durumundaki sejour'ları filtrele
      const confirmedSejours = sejourData.filter((sejour: any) => {
        const status = (sejour.status || '').toString().toLowerCase();
        return status.includes('konf') || status.includes('confirm');
      });

      // Sejour verilerini hizmet formatına çevir
      const services: SejourServiceRow[] = confirmedSejours.map((sejour: any) => {
        // Otel bilgisini al (ilk odadan)
        let hotelName = '';
        let roomType = '';
        let boardType = '';
        let guestNames: string[] = [];

        if (sejour.rooms && sejour.rooms.length > 0) {
          const firstRoom = sejour.rooms[0];
          // Otel adını bul: önce odaya bağlanan otel adı, sonra sejour üzerindeki otel, en son id fallback
          hotelName = firstRoom.hotelName || (sejour as any).hotels?.name || firstRoom.hotelId || '';
          roomType = firstRoom.roomType || '';
          boardType = firstRoom.accommodationType || '';

          // Misafir bilgilerini topla
          sejour.rooms.forEach((room: any) => {
            if (room.guestInfo) {
              guestNames.push(room.guestInfo);
            }
          });
        }

        // Toplam tutarları hesapla
        const totals = sejour.totals || { TRY: 0, USD: 0, EUR: 0 };
        const mainCurrency = Object.keys(totals).reduce((a, b) =>
          totals[a as keyof typeof totals] > totals[b as keyof typeof totals] ? a : b
        ) as Currency;

        const totalAmount = totals[mainCurrency] || 0;

        return {
          voucherNumber: sejour.voucherNumber || '',
          customerType: sejour.customerType || 'customer',
          customerName: sejour.customerType === 'agency' ? (sejour.agencyName || '') : (sejour.customerName || ''),
          checkInDate: sejour.checkInDate || '',
          checkOutDate: sejour.checkOutDate || '',
          hotelName: hotelName || '-',
          guestName: guestNames.length > 0 ? guestNames.join(', ') : '-',
          boardType: boardType || '-',
          roomType: roomType || '-',
          accommodationAmount: Math.floor(totalAmount * 0.6), // %60 konaklama
          accommodationCurrency: mainCurrency,
          flightAmount: Math.floor(totalAmount * 0.3), // %30 uçuş
          flightCurrency: mainCurrency,
          transferAmount: Math.floor(totalAmount * 0.07), // %7 transfer
          transferCurrency: mainCurrency,
          extraAmount: Math.floor(totalAmount * 0.03), // %3 ekstra
          extraCurrency: mainCurrency,
          totalAmount: totalAmount,
          totalCurrency: mainCurrency
        };
      });

      // Filtreleme uygula - ek güvenlik filtresi
      let filteredServices = services;

      // Voucher filtresi - tüm alanlarda arama yap
      if (currentVoucherQuery) {
        filteredServices = filteredServices.filter(service => {
          const query = currentVoucherQuery.toLowerCase();
          return (
            // Voucher numarası
            service.voucherNumber.toLowerCase().includes(query) ||
            // Müşteri/Acente adı
            service.customerName.toLowerCase().includes(query) ||
            // Misafir isimleri
            service.guestName.toLowerCase().includes(query) ||
            // Otel adı
            service.hotelName.toLowerCase().includes(query) ||
            // Konaklama tipi
            service.boardType.toLowerCase().includes(query) ||
            // Oda tipi
            service.roomType.toLowerCase().includes(query) ||
            // Tarih bilgileri
            service.checkInDate.toLowerCase().includes(query) ||
            service.checkOutDate.toLowerCase().includes(query) ||
            // Tutar bilgileri
            service.totalAmount.toString().includes(query) ||
            service.accommodationAmount.toString().includes(query) ||
            service.flightAmount.toString().includes(query) ||
            service.transferAmount.toString().includes(query) ||
            service.extraAmount.toString().includes(query)
          );
        });
      }

      // Tarih filtresi
      if (currentFromDate) {
        filteredServices = filteredServices.filter(service =>
          new Date(service.checkInDate) >= new Date(currentFromDate)
        );
      }

      if (currentToDate) {
        filteredServices = filteredServices.filter(service =>
          new Date(service.checkOutDate) <= new Date(currentToDate)
        );
      }

      setRows(filteredServices);

      // Maliyet verilerini de yükle (satış fiyatlarının %70'i olarak hesapla)
      const costServices: SejourCostRow[] = confirmedSejours.map((sejour: any) => {
        // Otel bilgisini al (ilk odadan)
        let hotelName = '';
        let roomType = '';
        let boardType = '';
        let guestNames: string[] = [];

        if (sejour.rooms && sejour.rooms.length > 0) {
          const firstRoom = sejour.rooms[0];
          // Otel adını bul: önce oda üzerinden gelen otel adı, sonra sejour üzerindeki otel, en son id
          hotelName = firstRoom.hotelName || (sejour as any).hotels?.name || firstRoom.hotelId || '';
          roomType = firstRoom.roomType || '';
          boardType = firstRoom.accommodationType || '';

          // Misafir bilgilerini topla
          sejour.rooms.forEach((room: any) => {
            if (room.guestInfo) {
              guestNames.push(room.guestInfo);
            }
          });
        }

        // Toplam tutarları hesapla
        const totals = sejour.totals || { TRY: 0, USD: 0, EUR: 0 };
        const mainCurrency = Object.keys(totals).reduce((a, b) =>
          totals[a as keyof typeof totals] > totals[b as keyof typeof totals] ? a : b
        ) as Currency;

        const totalAmount = totals[mainCurrency] || 0;
        const costMultiplier = 0.7; // Maliyet satış fiyatının %70'i

        return {
          voucherNumber: sejour.voucherNumber || '',
          customerType: sejour.customerType || 'customer',
          customerName: sejour.customerType === 'agency' ? (sejour.agencyName || '') : (sejour.customerName || ''),
          checkInDate: sejour.checkInDate || '',
          checkOutDate: sejour.checkOutDate || '',
          hotelName: hotelName || '-',
          guestName: guestNames.length > 0 ? guestNames.join(', ') : '-',
          boardType: boardType || '-',
          roomType: roomType || '-',
          accommodationCost: Math.floor(totalAmount * 0.6 * costMultiplier), // %60 konaklama maliyeti
          accommodationCurrency: mainCurrency,
          flightCost: Math.floor(totalAmount * 0.3 * costMultiplier), // %30 uçuş maliyeti
          flightCurrency: mainCurrency,
          transferCost: Math.floor(totalAmount * 0.07 * costMultiplier), // %7 transfer maliyeti
          transferCurrency: mainCurrency,
          extraCost: Math.floor(totalAmount * 0.03 * costMultiplier), // %3 ekstra maliyet
          extraCurrency: mainCurrency,
          totalCost: Math.floor(totalAmount * costMultiplier), // Toplam maliyet
          totalCurrency: mainCurrency
        };
      });

      // Maliyet verilerini de filtrele - aktif tab'a göre doğru filtreleri kullan
      let filteredCostServices = costServices;

      if (currentVoucherQuery) {
        filteredCostServices = filteredCostServices.filter(service => {
          const query = currentVoucherQuery.toLowerCase();
          return (
            service.voucherNumber.toLowerCase().includes(query) ||
            service.customerName.toLowerCase().includes(query) ||
            service.guestName.toLowerCase().includes(query) ||
            service.hotelName.toLowerCase().includes(query) ||
            service.boardType.toLowerCase().includes(query) ||
            service.roomType.toLowerCase().includes(query) ||
            service.checkInDate.toLowerCase().includes(query) ||
            service.checkOutDate.toLowerCase().includes(query) ||
            service.totalCost.toString().includes(query) ||
            service.accommodationCost.toString().includes(query) ||
            service.flightCost.toString().includes(query) ||
            service.transferCost.toString().includes(query) ||
            service.extraCost.toString().includes(query)
          );
        });
      }

      if (currentFromDate) {
        filteredCostServices = filteredCostServices.filter(service =>
          new Date(service.checkInDate) >= new Date(currentFromDate)
        );
      }

      if (currentToDate) {
        filteredCostServices = filteredCostServices.filter(service =>
          new Date(service.checkOutDate) <= new Date(currentToDate)
        );
      }

      setCostRows(filteredCostServices);
      // Burada return etmiyoruz; Supabase verisi üzerinden çalıştığımız için
      // fonksiyonun geri kalanında ekstra işlem yok.
    } catch (e) {
      const message = (e as any)?.message || 'Veri yüklenemedi';
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sayfa ilk açıldığında otomatik olarak yükle
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece bir kez çalışsın


  // Filtre değişikliklerinde veriyi yeniden yükle
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesVoucherTokens, salesFromDate, salesToDate, costVoucherTokens, costFromDate, costToDate, activeTab, forceReload]);

  // ExcelJS ile Export - Satış Tabı
  const exportSalesExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('TEMPUS TRAVEL - Sejour Satış Hizmetleri');
    sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } } as any;

    // Header band
    const top = sheet.addRow([]); top.height = 48; sheet.mergeCells('A1:N1');
    for (let c = 1; c <= 14; c++) { sheet.getRow(1).getCell(c).value = ''; sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any; }

    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(false); // Açık tema logosu kullan
    const inchToPx = (inch: number) => Math.round(inch * 96);
    const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
    if (iconLogoBase64) { const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) }); sheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any); }
    if (wordmarkLogoBase64) { const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) }); sheet.addImage(markId, { tl: { col: 11.5, row: 0.23 }, ext: { width: inchToPx(2.0), height: inchToPx(0.50) } as any } as any); }

    // Columns
    sheet.columns = [
      { header: 'VOUCHER NO', key: 'voucherNumber', width: 16 },
      { header: 'ACENTE/MÜŞTERİ', key: 'customerName', width: 20 },
      { header: 'GİRİŞ TARİHİ', key: 'checkInDate', width: 14 },
      { header: 'ÇIKIŞ TARİHİ', key: 'checkOutDate', width: 14 },
      { header: 'OTEL', key: 'hotelName', width: 20 },
      { header: 'MİSAFİR', key: 'guestName', width: 25 },
      { header: 'KONAKLAMA TİPİ', key: 'boardType', width: 16 },
      { header: 'ODA TİPİ', key: 'roomType', width: 16 },
      { header: 'KONAKLAMA SATIŞI', key: 'accommodationAmount', width: 16 },
      { header: 'UÇUŞ SATIŞI', key: 'flightAmount', width: 14 },
      { header: 'TRANSFER SATIŞI', key: 'transferAmount', width: 16 },
      { header: 'EKSTRA SATIŞI', key: 'extraAmount', width: 14 },
      { header: 'TOPLAM SATIŞI', key: 'totalAmount', width: 16 },
      { header: 'DÖVİZ', key: 'currency', width: 8 }
    ];
    const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
    sheet.getRow(headerRow.number).height = 18;
    headerRow.eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false, indent: 0 } as any; });

    // Sayısal sütunlar
    sheet.getColumn('accommodationAmount').numFmt = '#,##0.00';
    sheet.getColumn('flightAmount').numFmt = '#,##0.00';
    sheet.getColumn('transferAmount').numFmt = '#,##0.00';
    sheet.getColumn('extraAmount').numFmt = '#,##0.00';
    sheet.getColumn('totalAmount').numFmt = '#,##0.00';

    const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');

    sortedRows.forEach((row: any) => {
      const dataRow = sheet.addRow({
        voucherNumber: row.voucherNumber || '',
        customerName: row.customerName || '',
        checkInDate: fmtDate(row.checkInDate),
        checkOutDate: fmtDate(row.checkOutDate),
        hotelName: row.hotelName || '',
        guestName: row.guestName || '',
        boardType: row.boardType || '',
        roomType: row.roomType || '',
        accommodationAmount: Number(row.accommodationAmount || 0),
        flightAmount: Number(row.flightAmount || 0),
        transferAmount: Number(row.transferAmount || 0),
        extraAmount: Number(row.extraAmount || 0),
        totalAmount: Number(row.totalAmount || 0),
        currency: row.currency || 'TRY'
      });
      // Veri satırı: sayısal sütunlar sağa hizalı
      for (let i = 9; i <= 13; i++) { // 9-13 arası sayısal sütunlar
        dataRow.getCell(i).alignment = { horizontal: 'right', vertical: 'middle' } as any;
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `sejour_satis_hizmetleri_${new Date().toISOString().split('T')[0]}.xlsx`; link.click(); window.URL.revokeObjectURL(url);
  };

  // ExcelJS ile Export - Alış Tabı
  const exportCostsExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('TEMPUS TRAVEL - Sejour Alış Hizmetleri');
    sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } } as any;

    // Header band
    const top = sheet.addRow([]); top.height = 48; sheet.mergeCells('A1:N1');
    for (let c = 1; c <= 14; c++) { sheet.getRow(1).getCell(c).value = ''; sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any; }

    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(false); // Açık tema logosu kullan
    const inchToPx = (inch: number) => Math.round(inch * 96);
    const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
    if (iconLogoBase64) { const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) }); sheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any); }
    if (wordmarkLogoBase64) { const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) }); sheet.addImage(markId, { tl: { col: 11.5, row: 0.23 }, ext: { width: inchToPx(2.0), height: inchToPx(0.50) } as any } as any); }

    // Columns
    sheet.columns = [
      { header: 'VOUCHER NO', key: 'voucherNumber', width: 16 },
      { header: 'ACENTE/MÜŞTERİ', key: 'customerName', width: 20 },
      { header: 'GİRİŞ TARİHİ', key: 'checkInDate', width: 14 },
      { header: 'ÇIKIŞ TARİHİ', key: 'checkOutDate', width: 14 },
      { header: 'OTEL', key: 'hotelName', width: 20 },
      { header: 'MİSAFİR', key: 'guestName', width: 25 },
      { header: 'KONAKLAMA TİPİ', key: 'boardType', width: 16 },
      { header: 'ODA TİPİ', key: 'roomType', width: 16 },
      { header: 'KONAKLAMA MALİYETİ', key: 'accommodationCost', width: 18 },
      { header: 'UÇUŞ MALİYETİ', key: 'flightCost', width: 16 },
      { header: 'TRANSFER MALİYETİ', key: 'transferCost', width: 18 },
      { header: 'EKSTRA MALİYETİ', key: 'extraCost', width: 16 },
      { header: 'TOPLAM MALİYETİ', key: 'totalCost', width: 18 },
      { header: 'DÖVİZ', key: 'currency', width: 8 }
    ];
    const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
    sheet.getRow(headerRow.number).height = 18;
    headerRow.eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false, indent: 0 } as any; });

    // Sayısal sütunlar
    sheet.getColumn('accommodationCost').numFmt = '#,##0.00';
    sheet.getColumn('flightCost').numFmt = '#,##0.00';
    sheet.getColumn('transferCost').numFmt = '#,##0.00';
    sheet.getColumn('extraCost').numFmt = '#,##0.00';
    sheet.getColumn('totalCost').numFmt = '#,##0.00';

    const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');

    sortedCostRows.forEach((row: any) => {
      const dataRow = sheet.addRow({
        voucherNumber: row.voucherNumber || '',
        customerName: row.customerName || '',
        checkInDate: fmtDate(row.checkInDate),
        checkOutDate: fmtDate(row.checkOutDate),
        hotelName: row.hotelName || '',
        guestName: row.guestName || '',
        boardType: row.boardType || '',
        roomType: row.roomType || '',
        accommodationCost: Number(row.accommodationCost || 0),
        flightCost: Number(row.flightCost || 0),
        transferCost: Number(row.transferCost || 0),
        extraCost: Number(row.extraCost || 0),
        totalCost: Number(row.totalCost || 0),
        currency: row.currency || 'TRY'
      });
      // Veri satırı: sayısal sütunlar sağa hizalı
      for (let i = 9; i <= 13; i++) { // 9-13 arası sayısal sütunlar
        dataRow.getCell(i).alignment = { horizontal: 'right', vertical: 'middle' } as any;
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `sejour_alis_hizmetleri_${new Date().toISOString().split('T')[0]}.xlsx`; link.click(); window.URL.revokeObjectURL(url);
  };

  // Filtreleri temizleme fonksiyonu - Services sayfası için
  const clearServicesFilters = () => {
    if (activeTab === 'sales') {
      setSalesVoucherTokens([]);
      setSalesVoucherInput('');
      setSalesCustomerTokens([]);
      setSalesCustomerInput('');
      setSalesHotelTokens([]);
      setSalesHotelInput('');
      setSalesGuestTokens([]);
      setSalesGuestInput('');
      setSalesDraftFromDate('');
      setSalesDraftToDate('');
      setSalesFromDate('');
      setSalesToDate('');
    } else {
      setCostVoucherTokens([]);
      setCostVoucherInput('');
      setCostCustomerTokens([]);
      setCostCustomerInput('');
      setCostHotelTokens([]);
      setCostHotelInput('');
      setCostGuestTokens([]);
      setCostGuestInput('');
      setCostDraftFromDate('');
      setCostDraftToDate('');
      setCostFromDate('');
      setCostToDate('');
    }
    setPage(1);
    setForceReload(prev => prev + 1);
  };

  const includesByTokens = (value: string, tokens: string[]) => {
    if (tokens.length === 0) return true;
    const normalized = (value || '').toLowerCase();
    return tokens.some(token => normalized.includes(token.toLowerCase()));
  };
  const addToken = (
    value: string,
    setTokens: Dispatch<SetStateAction<string[]>>,
    setInput: Dispatch<SetStateAction<string>>
  ) => {
    const normalized = value.trim();
    if (!normalized) return;
    setTokens(prev => {
      if (prev.some(item => item.toLowerCase() === normalized.toLowerCase())) return prev;
      return [...prev, normalized];
    });
    setInput('');
  };
  const removeToken = (value: string, setTokens: Dispatch<SetStateAction<string[]>>) => {
    setTokens(prev => prev.filter(item => item !== value));
  };
  const activeRows = activeTab === 'sales' ? sortedRows : sortedCostRows;
  const activeVoucherTokens = activeTab === 'sales' ? salesVoucherTokens : costVoucherTokens;
  const activeCustomerTokens = activeTab === 'sales' ? salesCustomerTokens : costCustomerTokens;
  const activeHotelTokens = activeTab === 'sales' ? salesHotelTokens : costHotelTokens;
  const activeGuestTokens = activeTab === 'sales' ? salesGuestTokens : costGuestTokens;
  const visibleRows = activeRows.filter((r) => {
    if (!includesByTokens(r.voucherNumber || '', activeVoucherTokens)) return false;
    if (!includesByTokens(r.customerName || '', activeCustomerTokens)) return false;
    if (!includesByTokens(r.hotelName || '', activeHotelTokens)) return false;
    if (!includesByTokens(r.guestName || '', activeGuestTokens)) return false;
    return true;
  });

  const voucherSuggestions = useMemo(
    () => Array.from(new Set(activeRows.map(r => (r.voucherNumber || '').trim()).filter(Boolean))),
    [activeRows]
  );
  const customerSuggestions = useMemo(
    () => Array.from(new Set(activeRows.map(r => (r.customerName || '').trim()).filter(Boolean))),
    [activeRows]
  );
  const hotelSuggestions = useMemo(
    () => Array.from(new Set(activeRows.map(r => (r.hotelName || '').trim()).filter(Boolean))),
    [activeRows]
  );
  const guestSuggestions = useMemo(
    () => Array.from(new Set(activeRows.map(r => (r.guestName || '').trim()).filter(Boolean))),
    [activeRows]
  );

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.SEJOUR)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <a href="/sejour" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Sejour Listesine Dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Sejour Hizmet Listesi</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Konfirme olan sejour rezervasyonları ve hizmet detayları.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportSalesExcel}
              className="bg-green-600 dark:bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 flex items-center gap-2 text-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Satış Excel
            </button>
            <button
              onClick={exportCostsExcel}
              className="bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 text-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Alış Excel
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-3 border border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1 p-1">
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'sales'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              📈 Satış Verileri
            </button>
            <button
              onClick={() => setActiveTab('costs')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'costs'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              💰 Alış Verileri
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-nowrap gap-2 mb-4">
          <button onClick={() => setActiveTab('sales')} className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${activeTab === 'sales' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Satış Hizmeti</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{activeTab === 'sales' ? totalCount : rows.length}</p>
              </div>
            </div>
          </button>
          <button onClick={() => setActiveTab('costs')} className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${activeTab === 'costs' ? 'bg-green-600 dark:bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
            <div className="flex items-center">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Alış Hizmeti</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{activeTab === 'costs' ? totalCount : costRows.length}</p>
              </div>
            </div>
          </button>
          <div className="rounded-lg shadow p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Filtrelenmiş Kayıt</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{visibleRows.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Date Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 transition-colors duration-200 p-3">
          <div className="grid w-full items-end gap-2 grid-cols-[1.8fr_1fr_1fr_1fr_1fr_auto]">
            <DateRangeField
              label="C-IN C-OUT Tarihi"
              startValue={activeTab === 'sales' ? salesDraftFromDate : costDraftFromDate}
              endValue={activeTab === 'sales' ? salesDraftToDate : costDraftToDate}
              onStartChange={activeTab === 'sales' ? setSalesDraftFromDate : setCostDraftFromDate}
              onEndChange={activeTab === 'sales' ? setSalesDraftToDate : setCostDraftToDate}
            />
            <MultiTokenFilterInput
              label="Voucher No"
              tokens={activeTab === 'sales' ? salesVoucherTokens : costVoucherTokens}
              inputValue={activeTab === 'sales' ? salesVoucherInput : costVoucherInput}
              suggestions={voucherSuggestions}
              onInputChange={activeTab === 'sales' ? setSalesVoucherInput : setCostVoucherInput}
              onAddToken={(value) => activeTab === 'sales'
                ? addToken(value, setSalesVoucherTokens, setSalesVoucherInput)
                : addToken(value, setCostVoucherTokens, setCostVoucherInput)}
              onRemoveToken={(value) => activeTab === 'sales'
                ? removeToken(value, setSalesVoucherTokens)
                : removeToken(value, setCostVoucherTokens)}
            />
            <MultiTokenFilterInput
              label="Acente/Müşteri"
              tokens={activeTab === 'sales' ? salesCustomerTokens : costCustomerTokens}
              inputValue={activeTab === 'sales' ? salesCustomerInput : costCustomerInput}
              suggestions={customerSuggestions}
              onInputChange={activeTab === 'sales' ? setSalesCustomerInput : setCostCustomerInput}
              onAddToken={(value) => activeTab === 'sales'
                ? addToken(value, setSalesCustomerTokens, setSalesCustomerInput)
                : addToken(value, setCostCustomerTokens, setCostCustomerInput)}
              onRemoveToken={(value) => activeTab === 'sales'
                ? removeToken(value, setSalesCustomerTokens)
                : removeToken(value, setCostCustomerTokens)}
            />
            <MultiTokenFilterInput
              label="Otel"
              tokens={activeTab === 'sales' ? salesHotelTokens : costHotelTokens}
              inputValue={activeTab === 'sales' ? salesHotelInput : costHotelInput}
              suggestions={hotelSuggestions}
              onInputChange={activeTab === 'sales' ? setSalesHotelInput : setCostHotelInput}
              onAddToken={(value) => activeTab === 'sales'
                ? addToken(value, setSalesHotelTokens, setSalesHotelInput)
                : addToken(value, setCostHotelTokens, setCostHotelInput)}
              onRemoveToken={(value) => activeTab === 'sales'
                ? removeToken(value, setSalesHotelTokens)
                : removeToken(value, setCostHotelTokens)}
            />
            <MultiTokenFilterInput
              label="Misafir"
              tokens={activeTab === 'sales' ? salesGuestTokens : costGuestTokens}
              inputValue={activeTab === 'sales' ? salesGuestInput : costGuestInput}
              suggestions={guestSuggestions}
              onInputChange={activeTab === 'sales' ? setSalesGuestInput : setCostGuestInput}
              onAddToken={(value) => activeTab === 'sales'
                ? addToken(value, setSalesGuestTokens, setSalesGuestInput)
                : addToken(value, setCostGuestTokens, setCostGuestInput)}
              onRemoveToken={(value) => activeTab === 'sales'
                ? removeToken(value, setSalesGuestTokens)
                : removeToken(value, setCostGuestTokens)}
            />
            <div className="w-8">
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1 opacity-0">Temizle</label>
              <button
                onClick={clearServicesFilters}
                className="w-8 h-8 inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200"
                title="Filtreleri Temizle"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Hatalar/Loading */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 mb-2 transition-colors duration-200">
            <LoadingSpinner message="Servis listesi yükleniyor..." compact />
          </div>
        )}
        {error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 mb-2 transition-colors duration-200">
            <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          </div>
        )}

          {/* Tablo */}
          {!loading && !error && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0">
              <div className="overflow-auto w-full flex-1">
                <table className="min-w-[1200px] w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                    <tr>
                      <th
                        className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort('voucherNumber')}
                      >
                        <div className="flex items-center gap-1">
                          Voucher No
                          {sortConfig?.key === 'voucherNumber' && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort('customerName')}
                      >
                        <div className="flex items-center gap-1">
                          Acente/Müşteri
                          {sortConfig?.key === 'customerName' && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort('checkInDate')}
                      >
                        <div className="flex items-center gap-1">
                          C-In
                          {sortConfig?.key === 'checkInDate' && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort('checkOutDate')}
                      >
                        <div className="flex items-center gap-1">
                          C-Out
                          {sortConfig?.key === 'checkOutDate' && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort('hotelName')}
                      >
                        <div className="flex items-center gap-1">
                          Otel
                          {sortConfig?.key === 'hotelName' && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort('guestName')}
                      >
                        <div className="flex items-center gap-1">
                          Misafir
                          {sortConfig?.key === 'guestName' && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort('boardType')}
                      >
                        <div className="flex items-center gap-1">
                          Konaklama Tipi
                          {sortConfig?.key === 'boardType' && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort('roomType')}
                      >
                        <div className="flex items-center gap-1">
                          Oda Tipi
                          {sortConfig?.key === 'roomType' && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort(activeTab === 'costs' ? 'accommodationCost' : 'accommodationAmount')}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          {activeTab === 'costs' ? 'Konaklama Maliyeti' : 'Konaklama Satışı'}
                          {sortConfig?.key === (activeTab === 'costs' ? 'accommodationCost' : 'accommodationAmount') && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort(activeTab === 'costs' ? 'flightCost' : 'flightAmount')}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          {activeTab === 'costs' ? 'Uçuş Maliyeti' : 'Uçuş Satışı'}
                          {sortConfig?.key === (activeTab === 'costs' ? 'flightCost' : 'flightAmount') && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort(activeTab === 'costs' ? 'transferCost' : 'transferAmount')}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          {activeTab === 'costs' ? 'Transfer Maliyeti' : 'Transfer Satışı'}
                          {sortConfig?.key === (activeTab === 'costs' ? 'transferCost' : 'transferAmount') && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                        onClick={() => handleSort(activeTab === 'costs' ? 'extraCost' : 'extraAmount')}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          {activeTab === 'costs' ? 'Ekstra Maliyet' : 'Ekstra Satışı'}
                          {sortConfig?.key === (activeTab === 'costs' ? 'extraCost' : 'extraAmount') && (
                            <svg className={`w-3 h-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th
                        className="text-right px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSort(activeTab === 'costs' ? 'totalCost' : 'totalAmount')}
                      >
                        {activeTab === 'costs' ? 'Toplam Maliyet' : 'Toplam Satışı'} {sortConfig?.key === (activeTab === 'costs' ? 'totalCost' : 'totalAmount') && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {(visibleRows.length === 0) && (
                      <tr>
                        <td colSpan={13} className="px-2 py-4 text-center text-gray-500 dark:text-gray-400 text-xs">Kayıt bulunamadı</td>
                      </tr>
                    )}
                    {visibleRows.map((r, idx) => (
                      <tr key={`${r.voucherNumber}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200">
                          <button
                            onClick={() => {
                              // TODO: Supabase'den sejour ID'sini bul
                              console.log('Sejour detayı açılacak:', r.voucherNumber);
                              // Şimdilik voucher number ile arama yapılacak
                              // window.open(`/sejour/search?q=${r.voucherNumber}`, '_blank');
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer font-medium"
                            title="Sejour detayını görüntüle"
                          >
                            {r.voucherNumber}
                          </button>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{r.customerName}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{formatDate(r.checkInDate)}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{formatDate(r.checkOutDate)}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{r.hotelName || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{r.guestName || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{r.boardType || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{r.roomType || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200 text-right">
                          {formatCurrency(
                            activeTab === 'costs' ? (r as SejourCostRow).accommodationCost : (r as SejourServiceRow).accommodationAmount,
                            activeTab === 'costs' ? (r as SejourCostRow).accommodationCurrency : (r as SejourServiceRow).accommodationCurrency
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200 text-right">
                          {formatCurrency(
                            activeTab === 'costs' ? (r as SejourCostRow).flightCost : (r as SejourServiceRow).flightAmount,
                            activeTab === 'costs' ? (r as SejourCostRow).flightCurrency : (r as SejourServiceRow).flightCurrency
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200 text-right">
                          {formatCurrency(
                            activeTab === 'costs' ? (r as SejourCostRow).transferCost : (r as SejourServiceRow).transferAmount,
                            activeTab === 'costs' ? (r as SejourCostRow).transferCurrency : (r as SejourServiceRow).transferCurrency
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200 text-right">
                          {formatCurrency(
                            activeTab === 'costs' ? (r as SejourCostRow).extraCost : (r as SejourServiceRow).extraAmount,
                            activeTab === 'costs' ? (r as SejourCostRow).extraCurrency : (r as SejourServiceRow).extraCurrency
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200 text-right">
                          {formatCurrency(
                            activeTab === 'costs' ? (r as SejourCostRow).totalCost : (r as SejourServiceRow).totalAmount,
                            activeTab === 'costs' ? (r as SejourCostRow).totalCurrency : (r as SejourServiceRow).totalCurrency
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalCount > 0 && (
                <div className="flex justify-end px-2 py-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                    <span className="text-sm">Toplam {totalCount} kayıt</span>
                    <button className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
                    <span className="text-sm font-medium">{page}</span>
                    <button className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
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
          )}
      </div>
    </div>
  );
}


