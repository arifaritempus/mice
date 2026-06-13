'use client';
import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';

import { useState, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import { createPortal } from 'react-dom';
import { format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatNumber, formatDate } from '@/utils/formatters';
import { usePermissions, Module } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 1000] as const;
const DEFAULT_PAGE_SIZE = 20;

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
};

const setCookie = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
};

function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const safePageSize = Math.max(1, Number(pageSize || DEFAULT_PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, Number(page || 1)), totalPages);
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  return {
    items: items.slice(start, end),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages
  };
}

function PaginationControls({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  preferenceKey = 'operations_transfers_page_size',
  loadingHint = null
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  preferenceKey?: string;
  loadingHint?: string | null;
}) {
  useEffect(() => {
    const cookieSize = Number(getCookie(preferenceKey) || '');
    if (PAGE_SIZE_OPTIONS.includes(cookieSize as any) && cookieSize !== pageSize) {
      onPageSizeChange(cookieSize);
    }
  }, [pageSize, onPageSizeChange, preferenceKey]);

  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = total > 0 ? Math.min(total, page * pageSize) : 0;

  return (
    <div className="mt-2 flex flex-nowrap items-center justify-end gap-2 border-t border-gray-200 pt-2 dark:border-gray-700 sm:gap-3">
      {loadingHint ? (
        <span className="flex shrink-0 flex-nowrap items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
          <span className="relative h-3.5 w-3.5 shrink-0" aria-hidden>
            <span className="absolute inset-0 rounded-full border border-gray-200 dark:border-gray-600" />
            <span className="absolute inset-0 rounded-full border border-transparent border-t-blue-600 animate-spin dark:border-t-blue-400" />
          </span>
          <span className="max-w-[10rem] truncate whitespace-nowrap sm:max-w-none">{loadingHint}</span>
        </span>
      ) : null}
      <span className="shrink-0 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
        {total > 0 ? `${start}-${end} / ${total} kayıt` : 'Toplam 0 kayıt'}
      </span>
      <span className="shrink-0 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">Sayfa başına</span>
      <select
        value={pageSize}
        className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        onChange={(e) => {
          const size = Number(e.target.value) || DEFAULT_PAGE_SIZE;
          setCookie(preferenceKey, String(size));
          onPageSizeChange(size);
        }}
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-gray-600"
          disabled={page <= 1 || total <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          Önceki
        </button>
        <span className="px-1 text-xs text-gray-700 dark:text-gray-200">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-gray-600"
          disabled={page >= totalPages || total <= 0}
          onClick={() => onPageChange(page + 1)}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}

/** Tüm yükleme durumları: sağ alt, tek satır (sayfa başlığı görünür kalır) */
function TransferLoadingPill({ message }: { message: string }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[140] flex max-w-[min(100vw-1rem,22rem)] flex-nowrap items-center gap-2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2.5 py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative h-4 w-4 shrink-0" aria-hidden>
        <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-600" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
      </div>
      <span className="truncate text-xs font-medium leading-none text-gray-700 dark:text-gray-200">{message}</span>
    </div>
  );
}


interface MultiTokenFilterInputProps {
  label: string;
  tokens: string[];
  inputValue: string;
  suggestions: string[];
  onInputChange: (value: string) => void;
  onAddToken: (value: string) => void;
  onRemoveToken: (value: string) => void;
  /** Sabit / dar kolon: sığmayan içerik için title ile tam metin */
  rootClassName?: string;
}




function MultiTokenFilterInput({
  label,
  tokens,
  inputValue,
  suggestions,
  onInputChange,
  onAddToken,
  onRemoveToken,
  rootClassName
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

  const hoverDetail =
    tokens.length > 0 ? `${label}: ${tokens.join(', ')}` : inputValue.trim() ? `${label}: ${inputValue.trim()}` : label;

  return (
    <div
      className={`relative min-w-0 ${rootClassName || ''}`.trim()}
      title={hoverDetail}
    >
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

interface Transfer {
  id: string;
  reference: string;
  project_type: 'mice' | 'sejour';
  project_reference: string;
  customer_name?: string;
  company_name?: string;
  check_in_date?: string;
  check_out_date?: string;
  supplier_id: string;
  supplier_name: string;
  flight_info: {
    departure_airport: string;
    arrival_airport: string;
    flight_number: string;
    departure_time: string;
    arrival_time: string;
    airline: string;
  };
  transfer_date: string;
  transfer_time: string;
  transfer_type: 'airport_hotel' | 'hotel_airport' | 'hotel_hotel' | 'airport_airport';
  service_type?: 'private' | 'economic' | '';
  departure_point: string;
  arrival_point: string;
  vehicle_type: string;
  capacity: number;
  passenger_count: number;
  unit_price: number;
  currency: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  hotel_name?: string;
  created_at: string;
  updated_at: string;
}

export default function TransfersPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [tableBusy, setTableBusy] = useState(false);
  const [expandedGuests, setExpandedGuests] = useState<Set<string>>(new Set());

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ startDate: todayStr, endDate: '' });
  const [draftTransferStart, setDraftTransferStart] = useState(todayStr);
  const [draftTransferEnd, setDraftTransferEnd] = useState('');

  const [stayRange, setStayRange] = useState({ startDate: '', endDate: '' });
  const [draftStayStart, setDraftStayStart] = useState('');
  const [draftStayEnd, setDraftStayEnd] = useState('');

  const [referenceTokens, setReferenceTokens] = useState<string[]>([]);
  const [referenceInput, setReferenceInput] = useState('');
  const [companyTokens, setCompanyTokens] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [customerTokens, setCustomerTokens] = useState<string[]>([]);
  const [customerInput, setCustomerInput] = useState('');
  const [supplierTokens, setSupplierTokens] = useState<string[]>([]);
  const [supplierInput, setSupplierInput] = useState('');
  const [hotelTokens, setHotelTokens] = useState<string[]>([]);
  const [hotelInput, setHotelInput] = useState('');
  const [flightTokens, setFlightTokens] = useState<string[]>([]);
  const [flightInput, setFlightInput] = useState('');
  const [guestTokens, setGuestTokens] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState('');

  const referenceTerms = useMemo(
    () => [...referenceTokens, referenceInput.trim()].filter(Boolean),
    [referenceTokens, referenceInput]
  );
  const companyTerms = useMemo(
    () => [...companyTokens, companyInput.trim()].filter(Boolean),
    [companyTokens, companyInput]
  );
  const customerTerms = useMemo(
    () => [...customerTokens, customerInput.trim()].filter(Boolean),
    [customerTokens, customerInput]
  );
  const supplierTerms = useMemo(
    () => [...supplierTokens, supplierInput.trim()].filter(Boolean),
    [supplierTokens, supplierInput]
  );
  const hotelTerms = useMemo(
    () => [...hotelTokens, hotelInput.trim()].filter(Boolean),
    [hotelTokens, hotelInput]
  );
  const guestTerms = useMemo(
    () => [...guestTokens, guestInput.trim()].filter(Boolean),
    [guestTokens, guestInput]
  );
  const flightTerms = useMemo(
    () => [...flightTokens, flightInput.trim()].filter(Boolean),
    [flightTokens, flightInput]
  );

  const scopedSearchState = useMemo(
    () =>
      JSON.stringify({
        reference: referenceTerms,
        company: companyTerms,
        customer: customerTerms,
        supplier: supplierTerms,
        hotel: hotelTerms,
        guest: guestTerms,
        flight: flightTerms
      }),
    [referenceTerms, companyTerms, customerTerms, supplierTerms, hotelTerms, guestTerms, flightTerms]
  );

  const referenceSuggestions = useMemo(() => {
    const u = new Set<string>();
    transfers.forEach((t) => {
      if (t.reference?.trim()) u.add(t.reference.trim());
      if (String(t.project_reference || '').trim()) u.add(String(t.project_reference).trim());
    });
    return Array.from(u).sort();
  }, [transfers]);

  const companySuggestions = useMemo(() => {
    const u = new Set<string>();
    transfers.forEach((t) => {
      if (t.company_name?.trim()) u.add(t.company_name.trim());
    });
    return Array.from(u).sort();
  }, [transfers]);

  const customerSuggestions = useMemo(() => {
    const u = new Set<string>();
    transfers.forEach((t) => {
      if (t.customer_name?.trim()) u.add(t.customer_name.trim());
    });
    return Array.from(u).sort();
  }, [transfers]);

  const supplierSuggestions = useMemo(() => {
    const u = new Set<string>();
    transfers.forEach((t) => {
      if (t.supplier_name?.trim()) u.add(t.supplier_name.trim());
    });
    return Array.from(u).sort();
  }, [transfers]);

  const hotelSuggestions = useMemo(() => {
    const u = new Set<string>();
    transfers.forEach((t) => {
      if (t.hotel_name?.trim()) u.add(t.hotel_name.trim());
    });
    return Array.from(u).sort();
  }, [transfers]);

  const flightSuggestions = useMemo(() => {
    const u = new Set<string>();
    transfers.forEach((t) => {
      const fn = t.flight_info?.flight_number?.trim();
      const al = t.flight_info?.airline?.trim();
      if (fn) u.add(fn);
      if (al) u.add(al);
    });
    return Array.from(u).sort();
  }, [transfers]);

  const guestSuggestions = useMemo(() => {
    const u = new Set<string>();
    transfers.forEach((t) => {
      const raw = (t.notes || '').replace(/^Misafirler:\s*/i, '').trim();
      if (!raw) return;
      raw.split(/[,;]+/).forEach((p) => {
        const x = p.trim();
        if (x.length > 0) u.add(x);
      });
    });
    return Array.from(u).sort();
  }, [transfers]);

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

  const [filterKey, setFilterKey] = useState<number>(0); // Component'i zorla yeniden render etmek için
  const [forceReload, setForceReload] = useState<number>(0); // Veriyi zorla yeniden yüklemek için
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [typeCounts, setTypeCounts] = useState({ all: 0, mice: 0, sejour: 0 });



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
        stayStart: stayRange.startDate || '',
        stayEnd: stayRange.endDate || '',
        referenceTerms: JSON.stringify(referenceTerms),
        companyTerms: JSON.stringify(companyTerms),
        customerTerms: JSON.stringify(customerTerms),
        supplierTerms: JSON.stringify(supplierTerms),
        hotelTerms: JSON.stringify(hotelTerms),
        guestTerms: JSON.stringify(guestTerms),
        flightTerms: JSON.stringify(flightTerms)
      });
      const response = await fetch(`/api/operations/transfers?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Transfer verileri alınamadı');
      }

      setTransfers(Array.isArray(result.data) ? result.data : []);
      setTotalCount(Number(result.total || 0));
      setTotalPages(Number(result.totalPages || 1));
      const tc = result.typeCounts;
      if (tc && typeof tc === 'object') {
        setTypeCounts({
          all: Number(tc.all ?? result.total ?? 0),
          mice: Number(tc.mice ?? 0),
          sejour: Number(tc.sejour ?? 0)
        });
      } else {
        setTypeCounts({ all: Number(result.total || 0), mice: 0, sejour: 0 });
      }
    } catch (error: any) {
      const msg =
        typeof error?.message === 'string' && error.message.trim()
          ? error.message.trim()
          : 'Veriler yüklenirken hata oluştu';
      setError(msg);
    } finally {
      setLoading(false);
      setTableBusy(false);
      setInitialFetchDone(true);
    }
  };

  useEffect(() => {
    // Sejour ve proje verisi değiştiğinde veya sayfa odağı geri geldiğinde canlı yenile
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sejourData' || e.key?.startsWith('project_transfers_') || e.key === 'projects') {
        setForceReload((prev) => prev + 1);
      }
    };
    const handleFocus = () => setForceReload((prev) => prev + 1);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleApplyTransferDates = (start?: string, end?: string) => {
    setDateRange({
      startDate: start !== undefined ? start : draftTransferStart,
      endDate: end !== undefined ? end : draftTransferEnd
    });
    setPage(1);
    setForceReload(prev => prev + 1);
  };

  const handleApplyStayDates = (start?: string, end?: string) => {
    setStayRange({
      startDate: start !== undefined ? start : draftStayStart,
      endDate: end !== undefined ? end : draftStayEnd
    });
    setPage(1);
    setForceReload(prev => prev + 1);
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, scopedSearchState, filter, sortField, sortDirection, dateRange, stayRange, forceReload]);

  const mapSejourStatusToOperation = (status: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' => {
    const s = (status || '').toLowerCase();
    if (s.includes('konf')) return 'confirmed';
    if (s.includes('ipt')) return 'cancelled';
    if (s.includes('tamam')) return 'completed';
    return 'pending';
  };

  // Güvenli tarih formatlama fonksiyonu
  const safeFormatDate = (date: string | Date | undefined | null): string => {
    if (!date) return '-';
    
    // Eğer zaten DD.MM.YYYY formatındaysa direkt döndür
    if (typeof date === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(date)) {
      return date;
    }
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (error) {
      console.error('Tarih formatlama hatası:', error, 'Tarih:', date);
      return '-';
    }
  };

  // Araç tipi kodlarını isimlere çeviren fonksiyon
  const getVehicleTypeName = (vehicleTypeCode: string) => {
    const vehicleTypeMap: { [key: string]: string } = {
      'vito': 'Vito',
      'sprinter': 'Sprinter',
      'otobus': 'Otobüs',
      'binek': 'Binek',
      's-class': 'S Class',
      'Vito': 'Vito',
      'Sprinter': 'Sprinter',
      'Otobüs': 'Otobüs',
      'Binek': 'Binek',
      'S Class': 'S Class'
    };
    return vehicleTypeMap[vehicleTypeCode] || vehicleTypeCode || '-';
  };

  // Referans numarasına tıklandığında önizleme aç
  const handleReferenceClick = (projectReference: string, projectType: string) => {
    console.log('Transfer referans tıklama:', { projectReference, projectType });
    
    if (projectType === 'sejour') {
      // Sejour için sejour ID'sini kullan
      console.log('Sejour sayfasına yönlendiriliyor:', `/sejour/${projectReference}`);
      window.open(`/sejour/${projectReference}`, '_blank');
    } else if (projectType === 'mice') {
      // MICE için proje referansını kullan
      console.log('MICE projesi sayfasına yönlendiriliyor:', `/projects/${projectReference}`);
      window.open(`/projects/${projectReference}`, '_blank');
    }
  };

  // Misafir listesi dropdown açma/kapama
  const toggleGuestDropdown = (transferId: string) => {
    setExpandedGuests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transferId)) {
        newSet.delete(transferId);
      } else {
        newSet.add(transferId);
      }
      return newSet;
    });
  };

  const buildTransfersFromSejour = async (): Promise<Transfer[]> => {
    try {
      const { SejourService, suppliersService, hotelsService } = await import('@/lib/supabaseService');
      
      // Supabase'den tüm sejour'ları transferleriyle birlikte çek
      const sejoursAll = await SejourService.getSejours();
      console.log('Supabase\'den sejour verileri yüklendi:', sejoursAll.length, 'adet');
      
      // Sadece KONFİRME olan sejour'ları filtrele
      const sejours = sejoursAll.filter((s: any) => {
        const st = (s.status || '').toString().toLowerCase();
        return st.includes('konf') || st.includes('confirm');
      });
      
      console.log('Filtered sejour verileri (sadece konfirme):', sejours.length, 'adet');
      
      const suppliers = await suppliersService.getAll();
      const hotels = await hotelsService.getAll();
      console.log('Tedarikçi verileri:', suppliers.length, 'adet');
      console.log('Otel verileri:', hotels.length, 'adet');

      const result: Transfer[] = [];

      sejours.forEach((sejour) => {
        console.log('Sejour işleniyor:', sejour);
        const voucher = sejour.voucher_number || sejour.voucherNumber || sejour.id;
        console.log('Voucher/ID:', { voucher, sejourId: sejour.id, voucherNumber: sejour.voucher_number || sejour.voucherNumber });
        // Supabase'den gelen transfers array'ini kullan (getSejours camelCase'e dönüştürüyor)
        const sejourTransfers = sejour.transfers || sejour.sejour_transfers || [];
        const sejourRooms = sejour.rooms || sejour.sejour_rooms || [];
        const sejourFlights = sejour.flights || sejour.sejour_flights || [];
        
        const passengerNames: string[] = Array.isArray(sejourRooms)
          ? sejourRooms
              .map((r: any) => (typeof r.guest_name === 'string' ? r.guest_name.trim() : '') || (typeof r.guestInfo === 'string' ? r.guestInfo.trim() : ''))
              .filter((name: string) => !!name)
          : [];

        const arrivalFlight = Array.isArray(sejourFlights)
          ? sejourFlights.find((f: any) => f.type === 'departure' || f.flight_direction === 'departure' || f.flight_type === 'departure' || f.departure_date)
          : undefined;
        const returnFlight = Array.isArray(sejourFlights)
          ? sejourFlights.find((f: any) => f.type === 'return' || f.flight_direction === 'return' || f.flight_type === 'return' || f.return_date)
          : undefined;

        const arrivalTransfer = Array.isArray(sejourTransfers)
          ? sejourTransfers.find((t: any) => t.direction === 'arrival')
          : undefined;
        const returnTransfer = Array.isArray(sejourTransfers)
          ? sejourTransfers.find((t: any) => t.direction === 'return')
          : undefined;
        const intermediateTransfers: any[] = Array.isArray(sejourTransfers)
          ? sejourTransfers.filter((t: any) => t.direction === 'intermediate')
          : [];

        const build = (direction: 'arrival' | 'return' | 'intermediate', trArg?: any) => {
          const tr = direction === 'intermediate' ? trArg : (direction === 'arrival' ? arrivalTransfer : returnTransfer);
          // Transfer hizmeti yoksa kayıt oluşturma
          if (!tr) {
            console.log('Transfer hizmeti bulunamadı, kayıt oluşturulmayacak:', { sejourId: sejour.id, direction });
            return null;
          }
          const fl = direction === 'arrival' ? arrivalFlight : direction === 'return' ? returnFlight : undefined;
          const supplierId = tr?.supplierId || tr?.supplier_id || tr?.provider || '';
          const supplierName = tr?.supplierName || tr?.suppliers?.name || (supplierId
            ? (suppliers.find((s: any) => s.id === supplierId)?.name || 'Tedarikçi')
            : 'Tedarikçi');

          // Transfer varsa tarih/saat gibi alanları sadece transfer bilgisinden al
          // Supabase'de date alanı yok, sejour'dan alınabilir veya transfer'den
          const date = tr?.date || sejour.check_in_date || sejour.checkInDate || '';
          const time = tr?.time || '';
          const unitPrice = Number(tr?.price ?? tr?.costPrice ?? 0);
          const currency = tr?.currency || tr?.costCurrency || sejour.currency || 'EUR';
          const vehicle = tr?.vehicle || tr?.vehicle_type || '';
          const passengerCount = passengerNames.length || 0;

          // Sejour otel bilgisini konfirme rezervasyondaki odalardan (rooms) türet
          const roomHotelId = Array.isArray(sejourRooms) && sejourRooms.length > 0 ? ((sejourRooms[0] as any).hotelId || (sejourRooms[0] as any).hotel_id) : undefined;
          const hotelNameFromRooms = roomHotelId ? (hotels.find((h: any) => h.id === roomHotelId)?.name || roomHotelId) : '';
          const hotelNameResolved = sejour.hotels?.name 
            || (sejour as any).hotelName 
            || (sejour as any).hotel_name 
            || hotelNameFromRooms 
            || (sejour.hotelId ? (hotels.find((h: any) => h.id === sejour.hotelId)?.name || sejour.hotelId) : '')
            || (sejour.hotel_id ? (hotels.find((h: any) => h.id === sejour.hotel_id)?.name || sejour.hotel_id) : '');

          const transfer: Transfer = {
            id: `${sejour.id}-${direction}${direction==='intermediate' ? '-' + (tr?.id || Date.now()) : ''}`,
            reference: String(voucher || ''),
            project_type: 'sejour',
            project_reference: sejour.id, // Sejour ID'sini kullan
            customer_name: sejour.agencies?.name || sejour.agencyName || sejour.customerName || '',
            company_name: sejour.companyName || sejour.company_name || '',
            check_in_date: sejour.check_in_date || sejour.checkInDate || '',
            check_out_date: sejour.check_out_date || sejour.checkOutDate || '',
            supplier_id: supplierId,
            supplier_name: supplierName,
            hotel_name: hotelNameResolved,
            flight_info: {
              departure_airport: direction === 'intermediate' ? '' : (fl?.departureAirport || fl?.departure_airport || (fl?.route ? fl.route.split(' ')[0] : '') || ''),
              arrival_airport: direction === 'intermediate' ? '' : (fl?.arrivalAirport || fl?.arrival_airport || (fl?.route ? fl.route.split(' ').slice(-1)[0] : '') || ''),
              flight_number: direction === 'intermediate' ? '' : (fl?.flightNo || fl?.flight_number || fl?.departureFlightNumber || fl?.departure_flight_number || fl?.returnFlightNumber || fl?.return_flight_number || ''),
              departure_time: direction === 'intermediate' ? '' : (fl?.departureTime || fl?.departure_time || ''),
              arrival_time: direction === 'intermediate' ? '' : (fl?.arrivalTime || fl?.arrival_time || ''),
              airline: direction === 'intermediate' ? '' : (fl?.airline || fl?.departureAirline || fl?.departure_airline || fl?.returnAirline || fl?.return_airline || '')
            },
            transfer_date: date,
            transfer_time: time,
            transfer_type: direction === 'arrival' ? 'airport_hotel' : direction === 'return' ? 'hotel_airport' : 'hotel_hotel',
            service_type: (tr?.transfer_type as 'private' | 'economic') || (tr?.type as 'private' | 'economic') || '',
            departure_point: direction === 'arrival' ? 'Havalimanı' : direction === 'return' ? 'Otel' : 'Otel',
            arrival_point: direction === 'arrival' ? 'Otel' : direction === 'return' ? 'Havalimanı' : 'Otel',
            vehicle_type: getVehicleTypeName(vehicle),
            capacity: 0,
            passenger_count: passengerCount,
            unit_price: unitPrice,
            currency,
            total_amount: unitPrice,
            status: mapSejourStatusToOperation(sejour.status || ''),
            notes: passengerNames.length ? `Misafirler: ${passengerNames.join(', ')}` : '',
            created_at: sejour.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          console.log('Oluşturulan transfer:', transfer);
          return transfer;
        };

        // Her sejour için yalnızca transfer hizmeti varsa geliş/dönüş kayıtlarını ekle
        const arrivalBuilt = build('arrival');
        if (arrivalBuilt) result.push(arrivalBuilt);
        const returnBuilt = build('return');
        if (returnBuilt) result.push(returnBuilt);
        // Ara transferleri ekle
        intermediateTransfers.forEach((t) => {
          const midBuilt = build('intermediate', t);
          if (midBuilt) result.push(midBuilt);
        });
      });

      return result;
    } catch (e) {
      console.error('Sejour verileri işlenirken hata:', e);
      return [];
    }
  };

  const buildTransfersFromProjects = async (): Promise<Transfer[]> => {
    try {
      const { projectsService, projectTransfersService, agenciesService, hotelsService, suppliersService } = await import('@/lib/supabaseService');
      
      const projects = await projectsService.getAll();
      const result: Transfer[] = [];
      const suppliers = await suppliersService.getAll();
      const agencies = await agenciesService.getAll();
      const hotels = await hotelsService.getAll();

      for (const project of projects as any[]) {
        try {
          // Her proje için transfer verilerini Supabase'den yükle
          const projectTransfers = await projectTransfersService.getByProjectId(project.id);
          
          projectTransfers.forEach((transfer: any) => {
            // Tedarikçi bilgisini daha kapsamlı kontrol et
            const supplierId = transfer.supplier_id || transfer.supplierId || transfer.provider || (transfer.supplier?.id ? transfer.supplier.id : null) || '';
            let supplierName = '';
            
            // Önce supplier ilişkisinden kontrol et
            if (transfer.supplier?.name) {
              supplierName = transfer.supplier.name;
            } 
            // Sonra supplier_name alanından kontrol et
            else if (transfer.supplier_name) {
              supplierName = transfer.supplier_name;
            }
            // Son olarak supplier_id varsa suppliers listesinden bul
            else if (supplierId) {
              const foundSupplier = suppliers.find((s: any) => s.id === supplierId);
              supplierName = foundSupplier?.name || 'Tedarikçi';
            }
            // Hiçbiri yoksa varsayılan
            else {
              supplierName = 'Tedarikçi';
            }

            // Agency bilgisini çek
            const agencyId = project.agency_id;
            const agencyName = agencyId 
              ? (agencies.find((a: any) => a.id === agencyId)?.name || 'Acente')
              : 'Acente';

            // Transfer tarih ve saat bilgilerini daha kapsamlı kontrol et
            const transferDate = transfer.date || transfer.transfer_date || transfer.dateTime || '';
            const transferTime = transfer.time || transfer.transfer_time || transfer.timeSlot || '';

            const mappedTransfer: Transfer = {
              id: `project:${project.id}:${transfer.id}`,
              reference: project.reference || project.referenceNumber || project.id,
              project_type: 'mice',
              project_reference: project.id,
              customer_name: agencyName,
              company_name: project.company_name || project.companyName,
              check_in_date: project.start_date || project.startDate || '',
              check_out_date: project.end_date || project.endDate || '',
              supplier_id: supplierId,
              supplier_name: supplierName,
              hotel_name: project.hotel_name || project.hotelName || (project.hotel_id ? hotels.find((h: any) => h.id === project.hotel_id)?.name || project.hotel_id : ''),
              flight_info: {
                departure_airport: '',
                arrival_airport: '',
                flight_number: transfer.flight_code || transfer.flightCode || '',
                departure_time: '',
                arrival_time: '',
                airline: ''
              },
              transfer_date: transferDate,
              transfer_time: transferTime,
              transfer_type: transfer.direction === 'arrival' ? 'airport_hotel' : 
                            transfer.direction === 'departure' ? 'hotel_airport' : 'hotel_hotel',
              service_type: transfer.transfer_type === 'private' ? 'private' : 
                           transfer.transfer_type === 'economic' ? 'economic' : '',
              departure_point: transfer.route?.split(' → ')[0] || transfer.departure_point || '',
              arrival_point: transfer.route?.split(' → ')[1] || transfer.arrival_point || '',
              vehicle_type: getVehicleTypeName(transfer.vehicle_type || transfer.vehicleType || transfer.vehicle || ''),
              capacity: transfer.capacity || 0,
              passenger_count: transfer.passenger_count || transfer.passengerCount || 0,
              unit_price: Number(transfer.cost_amount || transfer.costAmount || 0),
              currency: transfer.currency || 'TRY',
              total_amount: Number(transfer.cost_amount || transfer.costAmount || 0),
              status: 'confirmed',
              notes: transfer.passengers?.join(', ') || transfer.notes || '',
              created_at: transfer.created_at || new Date().toISOString(),
              updated_at: transfer.updated_at || new Date().toISOString()
            };
            
            result.push(mappedTransfer);
          });
        } catch (error) {
          console.warn(`Proje ${project.id} transfer verileri yüklenemedi:`, error);
        }
      }

      return result;
    } catch (e) {
      console.error('Proje transfer verileri işlenirken hata:', e);
      return [];
    }
  };


  // Excel export fonksiyonu - Bilet sayfası formatında header ile
  const exportTransfersToExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('TEMPUS TRAVEL - Transferler');
      sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } } as any;
      
      // Header band
      const top = sheet.addRow([]); 
      top.height = 48; 
      sheet.mergeCells('A1:Q1');
      for (let c = 1; c <= 17; c++) { 
        sheet.getRow(1).getCell(c).value=''; 
        sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any; 
      }
      
      // Logos
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
        sheet.addImage(markId, { tl: { col: 14.2, row: 0.23 }, ext: { width: inchToPx(2.4), height: inchToPx(0.55) } as any } as any); 
      }

      // Sütun tanımları
      sheet.columns = [
        { header: 'Referans', key: 'reference', width: 16 },
        { header: 'Tarih', key: 'transfer_date', width: 14 },
        { header: 'Transfer Saati', key: 'transfer_time', width: 12 },
        { header: 'Tür', key: 'project_type', width: 12 },
        { header: 'C-IN / C-OUT', key: 'check_in_out', width: 20 },
        { header: 'Firma Adı', key: 'company_name', width: 20 },
        { header: 'Acente/Müşteri', key: 'customer_name', width: 20 },
        { header: 'Otel', key: 'hotel_name', width: 18 },
        { header: 'Tedarikçi', key: 'supplier_name', width: 18 },
        { header: 'Transfer Güzergahı', key: 'transfer_type', width: 16 },
        { header: 'Transfer Tipi', key: 'service_type', width: 12 },
        { header: 'Araç Tipi', key: 'vehicle_type', width: 14 },
        { header: 'Yolcu', key: 'passenger_count', width: 12 },
        { header: 'Misafir Adı', key: 'notes', width: 24 },
        { header: 'Uçuş Kodu', key: 'flight_number', width: 12 },
        { header: 'Maliyet', key: 'total_amount', width: 12 },
        { header: 'Döviz', key: 'currency', width: 8 }
      ];
      
      const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
      sheet.getRow(headerRow.number).height = 18;
      
      // Sayısal sütun biçimi
      sheet.getColumn('total_amount').numFmt = '#,##0.00';
      sheet.getColumn('total_amount').alignment = { horizontal: 'right' } as any;
      
      headerRow.eachCell((cell) => { 
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any; 
        cell.alignment = { vertical: 'middle', horizontal: 'center' } as any; 
      });
      
      const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');
      const fmtTime = (t?: string) => (t ? (t.includes('T') ? new Date(t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',hour12:false}) : t) : '');
      
      // Veri satırları
      filteredTransfers.forEach((transfer: any) => {
        sheet.addRow({
          reference: transfer.reference,
          transfer_date: fmtDate(transfer.transfer_date),
          transfer_time: transfer.transfer_time || '',
          project_type: transfer.project_type === 'mice' ? 'MICE' : 'Sejour',
          check_in_out: transfer.check_in_date && transfer.check_out_date 
            ? `${fmtDate(transfer.check_in_date)} / ${fmtDate(transfer.check_out_date)}`
            : transfer.check_in_date 
            ? fmtDate(transfer.check_in_date)
            : transfer.check_out_date
            ? fmtDate(transfer.check_out_date)
            : '',
          company_name: transfer.company_name || '',
          customer_name: transfer.customer_name || '',
          hotel_name: transfer.hotel_name || '',
          supplier_name: transfer.supplier_name,
          transfer_type: transfer.transfer_type === 'airport_hotel' ? 'Havalimanı-Otel' :
                        transfer.transfer_type === 'hotel_airport' ? 'Otel-Havalimanı' :
                        transfer.transfer_type === 'hotel_hotel' ? 'Otel-Otel' :
                        transfer.transfer_type === 'airport_airport' ? 'Havalimanı-Havalimanı' : '',
          service_type: transfer.service_type === 'private' ? 'Özel' : transfer.service_type === 'economic' ? 'Ekonomik' : '',
          vehicle_type: transfer.vehicle_type || '',
          passenger_count: transfer.passenger_count || '',
          notes: transfer.notes ? transfer.notes.replace('Misafirler: ', '') : '',
          flight_number: transfer.flight_info?.flight_number || '',
          total_amount: Number(transfer.total_amount || 0),
          currency: transfer.currency || ''
        });
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob); 
      const link = document.createElement('a');
      link.href = url; 
      link.download = `transferler_${new Date().toISOString().split('T')[0]}.xlsx`; 
      link.click(); 
      window.URL.revokeObjectURL(url);

      setSuccess('Transferler Excel dosyası olarak indirildi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Excel export hatası:', error);
      setError('Excel dosyası oluşturulurken bir hata oluştu!');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filtreleri temizleme fonksiyonu - Transfers sayfası için
  const clearTransfersFilters = () => {
    setFilter('all');
    setDraftTransferStart('');
    setDraftTransferEnd('');
    setDateRange({ startDate: '', endDate: '' });
    setDraftStayStart('');
    setDraftStayEnd('');
    setStayRange({ startDate: '', endDate: '' });
    setReferenceTokens([]);
    setReferenceInput('');
    setCompanyTokens([]);
    setCompanyInput('');
    setCustomerTokens([]);
    setCustomerInput('');
    setSupplierTokens([]);
    setSupplierInput('');
    setHotelTokens([]);
    setHotelInput('');
    setFlightTokens([]);
    setFlightInput('');
    setGuestTokens([]);
    setGuestInput('');
    setSortField('');
    setSortDirection('asc');
    setPage(1);
    setFilterKey((prev) => prev + 1);
    setForceReload((prev) => prev + 1);
  };





  const getTransferTypeDisplayName = (type: string) => {
    switch (type) {
      case 'airport_hotel': return 'Havaalanı → Otel';
      case 'hotel_airport': return 'Otel → Havaalanı';
      case 'hotel_hotel': return 'Otel → Otel';
      case 'airport_airport': return 'Havaalanı → Havaalanı';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'completed': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'confirmed': return 'Onaylandı';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const sortTransfers = (transfers: Transfer[], field: string, direction: 'asc' | 'desc') => {
    if (!field) return transfers;
    
    return [...transfers].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (field) {
        case 'reference':
          aValue = a.reference;
          bValue = b.reference;
          break;
        case 'project_reference':
          aValue = a.project_reference;
          bValue = b.project_reference;
          break;
        case 'customer_name':
          aValue = a.customer_name || '';
          bValue = b.customer_name || '';
          break;
        case 'company_name':
          aValue = a.company_name || '';
          bValue = b.company_name || '';
          break;
        case 'check_in_out':
          aValue = a.check_in_date || '';
          bValue = b.check_in_date || '';
          break;
        case 'supplier_name':
          aValue = a.supplier_name;
          bValue = b.supplier_name;
          break;
        case 'transfer_type':
          aValue = a.transfer_type;
          bValue = b.transfer_type;
          break;
        case 'flight_info.airline':
          aValue = a.flight_info.airline || '';
          bValue = b.flight_info.airline || '';
          break;
        case 'flight_info.flight_number':
          aValue = a.flight_info.flight_number || '';
          bValue = b.flight_info.flight_number || '';
          break;
        case 'service_type':
          aValue = a.service_type || '';
          bValue = b.service_type || '';
          break;
        case 'vehicle_type':
          aValue = a.vehicle_type || '';
          bValue = b.vehicle_type || '';
          break;
        case 'transfer_date':
          aValue = new Date(a.transfer_date);
          bValue = new Date(b.transfer_date);
          break;
        case 'transfer_time':
          aValue = a.transfer_time || '';
          bValue = b.transfer_time || '';
          break;
        case 'passenger_count':
          aValue = a.passenger_count;
          bValue = b.passenger_count;
          break;
        case 'notes':
          aValue = a.notes || '';
          bValue = b.notes || '';
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[field as keyof Transfer];
          bValue = b[field as keyof Transfer];
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredTransfers = transfers;
  const paginatedTransfers = {
    items: transfers,
    page,
    pageSize,
    total: totalCount,
    totalPages
  };

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.OPERATIONS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Transfer sayfasına erişim için yetkiniz bulunmuyor.</p>
          <Link href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const footLoadingMessage =
    !initialFetchDone && loading ? 'Sayfa yükleniyor…' : tableBusy ? 'Liste güncelleniyor…' : null;

  return (
    <div className="flex flex-col min-h-screen p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0 font-sans">
      <div className="w-full min-w-0 flex flex-col gap-2">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Transfer Yönetimi</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">MICE ve Sejour Transfer Operasyonlarını Yönetin</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportTransfersToExcel}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 shadow-sm text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel İndir
            </button>
          </div>
        </div>

        {/* Row 2: Tabs (MICE / Sejour Filter) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-3 border border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1 p-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              📋 Tüm Transferler ({typeCounts.all})
            </button>
            <button
              onClick={() => setFilter('mice')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                filter === 'mice'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              🏢 MICE ({typeCounts.mice})
            </button>
            <button
              onClick={() => setFilter('sejour')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                filter === 'sejour'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              🏖️ Sejour ({typeCounts.sejour})
            </button>
          </div>
        </div>

        {/* Row 4: Arama ve Filtreleme */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            .transfer-filters-grid {
              display: grid !important;
              grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto !important;
            }
          }
        `}} />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 w-full min-w-0">
          <div className="flex flex-col transfer-filters-grid items-end gap-2 w-full min-w-0">
            <div className="w-full min-w-0">
              <ResponsiveDateRangeField
                label="Transfer Tarihi"
                startValue={draftTransferStart}
                endValue={draftTransferEnd}
                onStartChange={setDraftTransferStart}
                onEndChange={setDraftTransferEnd}
                onApply={handleApplyTransferDates}
              />
            </div>
            <div className="w-full min-w-0">
              <ResponsiveDateRangeField
                label="Konaklama Tarihi"
                startValue={draftStayStart}
                endValue={draftStayEnd}
                onStartChange={setDraftStayStart}
                onEndChange={setDraftStayEnd}
                onApply={handleApplyStayDates}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Referans"
                tokens={referenceTokens}
                inputValue={referenceInput}
                suggestions={referenceSuggestions}
                onInputChange={setReferenceInput}
                onAddToken={(t) => addToken(t, setReferenceTokens, setReferenceInput)}
                onRemoveToken={(t) => removeToken(t, setReferenceTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Firma"
                tokens={companyTokens}
                inputValue={companyInput}
                suggestions={companySuggestions}
                onInputChange={setCompanyInput}
                onAddToken={(t) => addToken(t, setCompanyTokens, setCompanyInput)}
                onRemoveToken={(t) => removeToken(t, setCompanyTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Acente/Müşteri"
                tokens={customerTokens}
                inputValue={customerInput}
                suggestions={customerSuggestions}
                onInputChange={setCustomerInput}
                onAddToken={(t) => addToken(t, setCustomerTokens, setCustomerInput)}
                onRemoveToken={(t) => removeToken(t, setCustomerTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Tedarikçi"
                tokens={supplierTokens}
                inputValue={supplierInput}
                suggestions={supplierSuggestions}
                onInputChange={setSupplierInput}
                onAddToken={(t) => addToken(t, setSupplierTokens, setSupplierInput)}
                onRemoveToken={(t) => removeToken(t, setSupplierTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Otel"
                tokens={hotelTokens}
                inputValue={hotelInput}
                suggestions={hotelSuggestions}
                onInputChange={setHotelInput}
                onAddToken={(t) => addToken(t, setHotelTokens, setHotelInput)}
                onRemoveToken={(t) => removeToken(t, setHotelTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Uçuş/Havayolu"
                tokens={flightTokens}
                inputValue={flightInput}
                suggestions={flightSuggestions}
                onInputChange={setFlightInput}
                onAddToken={(t) => addToken(t, setFlightTokens, setFlightInput)}
                onRemoveToken={(t) => removeToken(t, setFlightTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Misafir"
                tokens={guestTokens}
                inputValue={guestInput}
                suggestions={guestSuggestions}
                onInputChange={setGuestInput}
                onAddToken={(t) => addToken(t, setGuestTokens, setGuestInput)}
                onRemoveToken={(t) => removeToken(t, setGuestTokens)}
              />
            </div>
            <div className="w-8 shrink-0 flex items-end">
              <div className="w-full">
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1 opacity-0 hidden md:block">Temizle</label>
                <button
                  type="button"
                  onClick={() => {
                    setDraftTransferStart(todayStr);
                    setDraftTransferEnd('');
                    setDateRange({ startDate: todayStr, endDate: '' });
                    setDraftStayStart('');
                    setDraftStayEnd('');
                    setStayRange({ startDate: '', endDate: '' });
                    setReferenceTokens([]);
                    setReferenceInput('');
                    setCompanyTokens([]);
                    setCompanyInput('');
                    setCustomerTokens([]);
                    setCustomerInput('');
                    setSupplierTokens([]);
                    setSupplierInput('');
                    setHotelTokens([]);
                    setHotelInput('');
                    setFlightTokens([]);
                    setFlightInput('');
                    setGuestTokens([]);
                    setGuestInput('');
                    setFilter('all');
                    setPage(1);
                    setFilterKey(prev => prev + 1);
                    setForceReload(prev => prev + 1);
                  }}
                  className="w-8 h-8 inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200 shadow-sm"
                  title="Filtreleri Temizle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transferler Tablosu */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0 relative ${tableBusy ? 'opacity-80' : ''}`}
          aria-busy={tableBusy || undefined}
        >
          <div className="overflow-auto w-full flex-1">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('reference')}
                  >
                    <div className="flex items-center">
                      Referans
                      {sortField === 'reference' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('transfer_date')}
                  >
                    <div className="flex items-center">
                      Tarih
                      {sortField === 'transfer_date' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('transfer_time')}
                  >
                    <div className="flex items-center">
                      Transfer Saati
                      {sortField === 'transfer_time' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('project_reference')}
                  >
                    <div className="flex items-center">
                      TÜR
                      {sortField === 'project_reference' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[6.25rem] min-w-[6.25rem] max-w-[6.25rem] align-top"
                    onClick={() => handleSort('check_in_out')}
                  >
                    <div className="flex items-center gap-0.5">
                      <div className="flex flex-col items-start leading-tight gap-0">
                        <span className="text-xs tracking-wide">C-IN</span>
                        <span className="text-xs tracking-wide">C-OUT</span>
                      </div>
                      {sortField === 'check_in_out' && (
                        <svg className={`ml-0.5 h-3 w-3 shrink-0 self-center ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('company_name')}
                  >
                    <div className="flex items-center">
                      FİRMA ADI
                      {sortField === 'company_name' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[9.5rem] min-w-[9.5rem] max-w-[9.5rem] align-top"
                    onClick={() => handleSort('customer_name')}
                  >
                    <div className="flex items-center gap-0.5">
                      <div className="flex flex-col items-start leading-tight gap-0">
                        <span className="text-xs tracking-wide">ACENTE</span>
                        <span className="text-xs tracking-wide">MÜŞTERİ</span>
                      </div>
                      {sortField === 'customer_name' && (
                        <svg className={`ml-0.5 h-3 w-3 shrink-0 self-center ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem] align-top"
                    onClick={() => handleSort('hotel_name')}
                  >
                    <div className="flex items-center">
                      Otel
                      {sortField === 'hotel_name' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[9rem] min-w-[9rem] max-w-[9rem] align-top"
                    onClick={() => handleSort('supplier_name')}
                  >
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs tracking-wide leading-tight">TEDARİKÇİ</span>
                      {sortField === 'supplier_name' && (
                        <svg className={`ml-0.5 h-3 w-3 shrink-0 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('transfer_type')}
                  >
                    <div className="flex items-center">
                      Transfer Güzergahı
                      {sortField === 'transfer_type' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('service_type')}
                  >
                    <div className="flex items-center">
                      Transfer Tipi
                      {sortField === 'service_type' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('vehicle_type')}
                  >
                    <div className="flex items-center">
                      Araç Tipi
                      {sortField === 'vehicle_type' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('passenger_count')}
                  >
                    <div className="flex items-center">
                      Yolcu
                      {sortField === 'passenger_count' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 w-[12rem] min-w-[12rem] max-w-[12rem] align-top"
                    onClick={() => handleSort('notes')}
                  >
                    <div className="flex items-center gap-0.5">
                      <div className="flex flex-col items-start leading-tight gap-0">
                        <span className="text-xs tracking-wide">MİSAFİR</span>
                        <span className="text-xs tracking-wide">ADI</span>
                      </div>
                      {sortField === 'notes' && (
                        <svg className={`ml-0.5 h-3 w-3 shrink-0 self-center ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('flight_info.flight_number')}
                  >
                    <div className="flex items-center">
                      Uçuş Kodu
                      {sortField === 'flight_info.flight_number' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('total_amount')}
                  >
                    <div className="flex items-center">
                      Maliyet
                      {sortField === 'total_amount' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('currency')}
                  >
                    <div className="flex items-center">
                      Döviz
                      {sortField === 'currency' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTransfers.items.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                      <button
                        onClick={() => handleReferenceClick(transfer.project_reference, transfer.project_type)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors duration-200"
                      >
                        {transfer.reference}
                      </button>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {safeFormatDate(transfer.transfer_date)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {transfer.transfer_time || '-'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transfer.project_type === 'mice' 
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' 
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}>
                        {transfer.project_type === 'mice' ? 'MICE' : 'Sejour'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-xs text-gray-900 dark:text-white w-[6.25rem] min-w-[6.25rem] max-w-[6.25rem] align-top">
                      {transfer.check_in_date && transfer.check_out_date ? (
                        <div className="flex flex-col leading-tight gap-0">
                          <span className="block truncate" title={safeFormatDate(transfer.check_in_date)}>
                            {safeFormatDate(transfer.check_in_date)}
                          </span>
                          <span className="block truncate" title={safeFormatDate(transfer.check_out_date)}>
                            {safeFormatDate(transfer.check_out_date)}
                          </span>
                        </div>
                      ) : transfer.check_in_date ? (
                        safeFormatDate(transfer.check_in_date)
                      ) : transfer.check_out_date ? (
                        safeFormatDate(transfer.check_out_date)
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {transfer.company_name || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white w-[9.5rem] min-w-[9.5rem] max-w-[9.5rem]">
                      <span className="block truncate" title={transfer.customer_name || ''}>
                        {transfer.customer_name || '-'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem]">
                      <span className="block truncate" title={transfer.hotel_name || ''}>
                        {transfer.hotel_name || '-'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white w-[9rem] min-w-[9rem] max-w-[9rem]">
                      <span className="block truncate whitespace-nowrap" title={transfer.supplier_name || ''}>
                        {transfer.supplier_name || '-'}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{getTransferTypeDisplayName(transfer.transfer_type)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{transfer.service_type === 'private' ? 'Özel' : transfer.service_type === 'economic' ? 'Ekonomik' : '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{transfer.vehicle_type || '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {transfer.passenger_count}/{transfer.capacity}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white w-[12rem] min-w-[12rem] max-w-[12rem] relative">
                      <div className="flex items-center justify-between gap-1">
                        <div
                          className="truncate flex-1 min-w-0"
                          title={(transfer.notes || '').replace('Misafirler: ', '') || ''}
                        >
                          {(transfer.notes || '').replace('Misafirler: ', '') || '-'}
                        </div>
                        {transfer.notes && (transfer.notes || '').replace('Misafirler: ', '').length > 20 && (
                          <button
                            onClick={() => toggleGuestDropdown(transfer.id)}
                            className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                            title="Misafir listesini göster"
                          >
                            <svg 
                              className={`w-3 h-3 transition-transform duration-200 ${expandedGuests.has(transfer.id) ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Dropdown */}
                      {expandedGuests.has(transfer.id) && transfer.notes && (
                        <div className="absolute z-10 mt-1 w-full max-w-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Misafirler:</div>
                            <div className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap">
                              {transfer.notes.replace('Misafirler: ', '')}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{transfer.flight_info.flight_number || '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                      {formatNumber(transfer.total_amount)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {transfer.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={paginatedTransfers.page}
            pageSize={paginatedTransfers.pageSize}
            total={paginatedTransfers.total}
            totalPages={paginatedTransfers.totalPages}
            preferenceKey="operations_transfers_page_size"
            loadingHint={footLoadingMessage}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>

        {/* Yeni Transfer Modal */}


        {/* Hata ve Başarı Mesajları */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-2 py-2 rounded z-50 text-xs">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError('')}
              className="absolute top-0 bottom-0 right-0 px-2 py-2"
            >
              <span className="sr-only">Kapat</span>
              <svg className="fill-current h-4 w-4" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Kapat</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-2 py-2 rounded z-50 text-xs">
            <span className="block sm:inline">{success}</span>
            <button
              onClick={() => setSuccess('')}
              className="absolute top-0 bottom-0 right-0 px-2 py-2"
            >
              <span className="sr-only">Kapat</span>
              <svg className="fill-current h-4 w-4" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Kapat</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
} 