'use client';

import { useState, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/providers/ThemeProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber, formatDate } from '@/utils/formatters';
import { usePermissions, Module } from '@/lib/permissions';
import { SejourService } from '@/lib/supabaseService';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import DatePicker from 'react-datepicker';
import { format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
// import { loadSejourlar } from '../../../../src/supabaseClient';

// async function fetchData() {
//   const sejourlar = await loadSejourlar();
//   console.log(sejourlar);
// }

// fetchData();

import ExcelJS from 'exceljs';
import { getLogosForExcel } from '@/utils/logoUtils';

interface SejourSale {
  id: string;
  voucherNumber: string;
  reference?: string; // Backward compatibility
  customerType: string;
  customerName: string;
  agencyName?: string;
  checkInDate: string;
  checkOutDate: string;
  check_in_date?: string; // Backward compatibility
  check_out_date?: string; // Backward compatibility
  room_count?: number;
  pax_count?: number;
  room_type?: string;
  board_type?: string;
  totalAmount: number;
  total_amount?: number; // Backward compatibility
  currency: string;
  status: string;
  created_at: string;
  // Yeni alanlar
  totals?: {
    EUR: number;
    USD: number;
    TRY: number;
    GBP?: number;
  };
  costs?: {
    EUR: number;
    USD: number;
    TRY: number;
    GBP?: number;
  };
  collections?: Collection[];
  // Detaylı maliyet hesaplama için gerekli alanlar
  rooms?: Room[];
  flights?: FlightInfo[];
  transfers?: TransferInfo[];
  extraServices?: ExtraService[];
}

interface SejourData {
  id: string;
  voucherNumber: string;
  customerType: string;
  agencyId: string;
  agencyName: string;
  customerName: string;
  checkInDate: string;
  checkOutDate: string;
  rooms: Room[];
  flights: FlightInfo[];
  transfers: TransferInfo[];
  extraServices: ExtraService[];
  totals: {
    EUR: number;
    USD: number;
    TRY: number;
    GBP?: number;
  };
  costs: {
    EUR: number;
    USD: number;
    TRY: number;
    GBP?: number;
  };
  profits: {
    EUR: number;
    USD: number;
    TRY: number;
    GBP?: number;
  };
  currency: string;
  status: string;
  notes: string;
  collections: Collection[];
  salesInvoices: SalesInvoice[];
  purchaseInvoices: PurchaseInvoice[];
  created_at: string;
}

interface Room {
  id: string;
  roomNumber: string;
  hotelId: string;
  accommodationType?: string;
  roomType: string;
  guestInfo: string;
  price: number;
  currency: string;
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface FlightInfo {
  id: string;
  flightDate: string;
  airline: string;
  route: string;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  type: 'departure' | 'return';
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface TransferInfo {
  id: string;
  date: string;
  provider: string;
  type: 'private' | 'economic';
  vehicle: string;
  time: string;
  price: number;
  currency: string;
  direction: 'arrival' | 'return';
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface ExtraService {
  id: string;
  serviceType: string;
  provider: string;
  description: string;
  price: number;
  currency: string;
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface Collection {
  id: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
}

interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    serviceName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  serviceType: string;
  provider: string;
  amount: number;
  currency: string;
  description: string;
}

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100];

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

export default function SejourPage() {
  const { canView, canCreate, canEdit, canDelete, userRole, loading: permissionsLoading } = usePermissions();
  const { isDark } = useTheme();
  const [sejours, setSejours] = useState<SejourSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [voucherTokens, setVoucherTokens] = useState<string[]>([]);
  const [voucherInput, setVoucherInput] = useState('');
  const [customerTokens, setCustomerTokens] = useState<string[]>([]);
  const [customerInput, setCustomerInput] = useState('');
  const [agencyTokens, setAgencyTokens] = useState<string[]>([]);
  const [agencyInput, setAgencyInput] = useState('');
  const [guestTokens, setGuestTokens] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState('');
  const [statusTokens, setStatusTokens] = useState<string[]>([]);
  const [statusInput, setStatusInput] = useState('');

  const [sejourData, setSejourData] = useState<SejourData | null>(null);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [draftDateStart, setDraftDateStart] = useState('');
  const [draftDateEnd, setDraftDateEnd] = useState('');

  // Detaylı verilerden toplam maliyet hesaplama
  const calculateTotalCostFromDetails = (sejour: any) => {
    const costs: any = { EUR: 0, USD: 0, TRY: 0, GBP: 0 };
    
    // Odalar
    if (sejour.rooms && Array.isArray(sejour.rooms)) {
      sejour.rooms.forEach((room: any) => {
        if (room.costPrice !== undefined && room.costPrice !== null && room.costCurrency) {
          costs[room.costCurrency as keyof typeof costs] = (costs[room.costCurrency as keyof typeof costs] || 0) + (room.costPrice || 0);
        }
      });
    }
    
    // Uçuşlar
    if (sejour.flights && Array.isArray(sejour.flights)) {
      sejour.flights.forEach((flight: any) => {
        if (flight.costPrice !== undefined && flight.costPrice !== null && flight.costCurrency) {
          costs[flight.costCurrency as keyof typeof costs] = (costs[flight.costCurrency as keyof typeof costs] || 0) + (flight.costPrice || 0);
        }
      });
    }
    
    // Transferler
    if (sejour.transfers && Array.isArray(sejour.transfers)) {
      sejour.transfers.forEach((transfer: any) => {
        if (transfer.costPrice !== undefined && transfer.costPrice !== null && transfer.costCurrency) {
          costs[transfer.costCurrency as keyof typeof costs] = (costs[transfer.costCurrency as keyof typeof costs] || 0) + (transfer.costPrice || 0);
        }
      });
    }
    
    // Ek hizmetler
    if (sejour.extraServices && Array.isArray(sejour.extraServices)) {
      sejour.extraServices.forEach((service: any) => {
        if (service.costPrice !== undefined && service.costPrice !== null && service.costCurrency) {
          costs[service.costCurrency as keyof typeof costs] = (costs[service.costCurrency as keyof typeof costs] || 0) + (service.costPrice || 0);
        }
      });
    }
    
    return costs;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await SejourService.getSejoursPage({
        page,
        pageSize,
        searchTerm: '',
        statusFilter,
        startDate: dateStart,
        endDate: dateEnd,
        sortField,
        sortDirection
      });
      const sejourData = response.data;
      setTotalCount(response.total);
      setTotalPages(response.totalPages);
      
      // Verileri zenginleştir ve maliyetleri hesapla
      const enrichedData = sejourData.map((sejour: any) => {
        // Maliyetleri detaylı hesapla (rooms, flights, transfers, extraServices'ten)
        const costs = calculateTotalCostFromDetails(sejour);
        
        return {
          ...sejour,
          costs: costs, // Hesaplanan maliyetleri kullan
          totals: sejour.totals || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
          collections: sejour.collections || [],
          rooms: sejour.rooms || [],
          flights: sejour.flights || [],
          transfers: sejour.transfers || [],
          extraServices: sejour.extraServices || []
        };
      });
      
      setSejours(enrichedData);
    } catch (error) {
      console.error('Error loading sejour data:', error);
      setError('Sejour verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };


  const voucherSuggestions = useMemo(
    () => Array.from(new Set(sejours.map(s => (s.voucherNumber || '').trim()).filter(Boolean))),
    [sejours]
  );
  const customerSuggestions = useMemo(
    () => Array.from(new Set(sejours.map(s => (s.customerName || '').trim()).filter(Boolean))),
    [sejours]
  );
  const agencySuggestions = useMemo(
    () => Array.from(new Set(sejours.map(s => (s.agencyName || '').trim()).filter(Boolean))),
    [sejours]
  );
  const guestSuggestions = useMemo(
    () => Array.from(new Set(
      sejours.flatMap((s) => (s.rooms || []).map((r) => (r.guestInfo || '').trim())).filter(Boolean)
    )),
    [sejours]
  );
  const statusSuggestions = useMemo(
    () => Array.from(new Set(['Konfirme', 'Bekleyen', 'İptal', ...sejours.map(s => (s.status || '').trim()).filter(Boolean)])),
    [sejours]
  );
  
  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateStart, dateEnd, sortField, sortDirection, voucherTokens, customerTokens, agencyTokens, guestTokens, statusTokens]);

  useEffect(() => {
    const rangeCompleteOrEmpty =
      (Boolean(draftDateStart) && Boolean(draftDateEnd)) || (!draftDateStart && !draftDateEnd);
    if (!rangeCompleteOrEmpty) return;
    setDateStart(draftDateStart);
    setDateEnd(draftDateEnd);
    setPage(1);
  }, [draftDateStart, draftDateEnd]);

  useEffect(() => {
    loadData();
  }, [page, pageSize, statusFilter, dateStart, dateEnd, sortField, sortDirection]);

  // Helper fonksiyonları - Early return'lerden ÖNCE tanımlanmalı
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

  const sejoursKonfirmeCount = sejours.filter(s => 
    (s.status || '').toLowerCase().includes('konfirme') || 
    (s.status || '').toLowerCase().includes('konfir') ||
    (s.status || '').toLowerCase().includes('konfi')
  ).length;
  const sejoursBekleyenCount = sejours.filter(s => 
    (s.status || '').toLowerCase().includes('bekleyen') || 
    (s.status || '').toLowerCase().includes('beklen') ||
    (s.status || '').toLowerCase().includes('bekle')
  ).length;
  const sejoursIptalCount = sejours.filter(s => 
    (s.status || '').toLowerCase().includes('iptal') ||
    (s.status || '').toLowerCase().includes('ipta')
  ).length;

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }
  
  if (!canView(Module.SEJOUR)) {
    // Debug için console log (geliştirme ortamında)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Sejour Page] ❌ Erişim reddedildi - Role: ${userRole}, Module: ${Module.SEJOUR}`);
    }
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Sejour sayfasına erişim için yetkiniz bulunmuyor.</p>
          <Link href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const filteredSejours = sejours.filter((sejour) => {
    const guests = (sejour.rooms || []).map((room) => room.guestInfo || '').join(' ');
    if (!includesByTokens(sejour.voucherNumber || '', voucherTokens)) return false;
    if (!includesByTokens(sejour.customerName || '', customerTokens)) return false;
    if (!includesByTokens(sejour.agencyName || '', agencyTokens)) return false;
    if (!includesByTokens(guests, guestTokens)) return false;
    if (!includesByTokens(sejour.status || '', statusTokens)) return false;
    return true;
  });

  // Sıralama fonksiyonu
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'konfirme':
        return 'bg-green-100 text-green-800';
      case 'bekleyen':
        return 'bg-yellow-100 text-yellow-800';
      case 'iptal':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteSejour = async (id: string) => {
    if (confirm('Bu sejour\'u silmek istediğinizden emin misiniz?')) {
      try {
        await SejourService.deleteSejour(id);
        const updatedSejours = sejours.filter(sejour => sejour.id !== id);
        setSejours(updatedSejours);
      } catch (error) {
        console.error('Error deleting sejour:', error);
        alert('Sejour silinirken hata oluştu');
      }
    }
  };

  // Filtreleri temizleme fonksiyonu - Ana sejour sayfası için
  const clearSejourFilters = () => {
    setStatusFilter('all');
    setDateStart('');
    setDateEnd('');
    setDraftDateStart('');
    setDraftDateEnd('');
    setVoucherTokens([]);
    setVoucherInput('');
    setCustomerTokens([]);
    setCustomerInput('');
    setAgencyTokens([]);
    setAgencyInput('');
    setGuestTokens([]);
    setGuestInput('');
    setStatusTokens([]);
    setStatusInput('');
    setPage(1);
  };

  // Sıralanmış sejours
  const paginatedSejours = {
    items: filteredSejours,
    page,
    pageSize,
    total: totalCount,
    totalPages
  };


  // Toplam maliyet hesaplama
  const calculateTotalCost = (sejour: SejourSale | SejourData) => {
    const costs: any = { EUR: 0, USD: 0, TRY: 0, GBP: 0 };
    
    // Eğer sejour.costs varsa onu kullan
    if ('costs' in sejour && sejour.costs) {
      return { EUR: 0, USD: 0, TRY: 0, GBP: 0, ...sejour.costs } as any;
    }
    
    // Eğer SejourData ise detaylı hesaplama yap
    if ('rooms' in sejour && sejour.rooms) {
      // Odalar
      sejour.rooms.forEach(room => {
        if (room.costPrice && room.costCurrency) {
          costs[room.costCurrency as keyof typeof costs] = (costs[room.costCurrency as keyof typeof costs] || 0) + room.costPrice;
        }
      });
    }
    
    if ('flights' in sejour && sejour.flights) {
      // Uçuşlar
      sejour.flights.forEach(flight => {
        if (flight.costPrice && flight.costCurrency) {
          costs[flight.costCurrency as keyof typeof costs] = (costs[flight.costCurrency as keyof typeof costs] || 0) + flight.costPrice;
        }
      });
    }
    
    if ('transfers' in sejour && sejour.transfers) {
      // Transferler
      sejour.transfers.forEach(transfer => {
        if (transfer.costPrice && transfer.costCurrency) {
          costs[transfer.costCurrency as keyof typeof costs] = (costs[transfer.costCurrency as keyof typeof costs] || 0) + transfer.costPrice;
        }
      });
    }
    
    if ('extraServices' in sejour && sejour.extraServices) {
      // Ek hizmetler
      sejour.extraServices.forEach(service => {
        if (service.costPrice && service.costCurrency) {
          costs[service.costCurrency as keyof typeof costs] = (costs[service.costCurrency as keyof typeof costs] || 0) + service.costPrice;
        }
      });
    }
    
    return costs;
  };

  // Belirli para birimi için maliyet alma
  const getCostForCurrency = (sejour: SejourSale | SejourData, currency: string) => {
    const costs = calculateTotalCost(sejour);
    return costs[currency as keyof typeof costs] || 0;
  };

  // Belirli para birimi için kar/zarar hesaplama
  const getProfitForCurrency = (sejour: SejourSale | SejourData, currency: string) => {
    const totalSales = sejour.totals?.[currency as keyof typeof sejour.totals] || 0;
    const totalCost = getCostForCurrency(sejour, currency);
    return totalSales - totalCost;
  };

  // ExcelJS ile Export
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('TEMPUS TRAVEL - Sejour Listesi');
    sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } } as any;
    
    // Header band
    const top = sheet.addRow([]); top.height = 48; sheet.mergeCells('A1:V1');
    for (let c = 1; c <= 22; c++) { sheet.getRow(1).getCell(c).value=''; sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any; }
    
    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(false); // Sejour için açık tema logosu kullan
    const inchToPx = (inch: number) => Math.round(inch * 96);
    const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
    if (iconLogoBase64) { const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) }); sheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any); }
    if (wordmarkLogoBase64) { const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) }); sheet.addImage(markId, { tl: { col: 19.5, row: 0.23 }, ext: { width: inchToPx(2.0), height: inchToPx(0.50) } as any } as any); }

    // Columns
    sheet.columns = [
      { header: 'VOUCHER NO', key: 'voucherNumber', width: 16 },
      { header: 'MÜŞTERİ', key: 'customerName', width: 20 },
      { header: 'ACENTE', key: 'agencyName', width: 18 },
      { header: 'GİRİŞ TARİHİ', key: 'checkInDate', width: 14 },
      { header: 'ÇIKIŞ TARİHİ', key: 'checkOutDate', width: 14 },
      { header: 'TOPLAM TRY', key: 'totalTRY', width: 12 },
      { header: 'TOPLAM EUR', key: 'totalEUR', width: 12 },
      { header: 'TOPLAM USD', key: 'totalUSD', width: 12 },
      { header: 'TOPLAM GBP', key: 'totalGBP', width: 12 },
      { header: 'MALİYET TRY', key: 'costTRY', width: 12 },
      { header: 'MALİYET EUR', key: 'costEUR', width: 12 },
      { header: 'MALİYET USD', key: 'costUSD', width: 12 },
      { header: 'MALİYET GBP', key: 'costGBP', width: 12 },
      { header: 'TAHSİLAT TRY', key: 'collectionTRY', width: 12 },
      { header: 'TAHSİLAT EUR', key: 'collectionEUR', width: 12 },
      { header: 'TAHSİLAT USD', key: 'collectionUSD', width: 12 },
      { header: 'TAHSİLAT GBP', key: 'collectionGBP', width: 12 },
      { header: 'BAKİYE TRY', key: 'balanceTRY', width: 12 },
      { header: 'BAKİYE EUR', key: 'balanceEUR', width: 12 },
      { header: 'BAKİYE USD', key: 'balanceUSD', width: 12 },
      { header: 'BAKİYE GBP', key: 'balanceGBP', width: 12 },
      { header: 'DURUM', key: 'status', width: 12 }
    ];
    const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
    sheet.getRow(headerRow.number).height = 18;
    headerRow.eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false, indent: 0 } as any; });
    
    // Sayısal sütunlar
    sheet.getColumn('totalTRY').numFmt = '#,##0.00';
    sheet.getColumn('totalEUR').numFmt = '#,##0.00';
    sheet.getColumn('totalUSD').numFmt = '#,##0.00';
    sheet.getColumn('totalGBP').numFmt = '#,##0.00';
    sheet.getColumn('costTRY').numFmt = '#,##0.00';
    sheet.getColumn('costEUR').numFmt = '#,##0.00';
    sheet.getColumn('costUSD').numFmt = '#,##0.00';
    sheet.getColumn('costGBP').numFmt = '#,##0.00';
    sheet.getColumn('collectionTRY').numFmt = '#,##0.00';
    sheet.getColumn('collectionEUR').numFmt = '#,##0.00';
    sheet.getColumn('collectionUSD').numFmt = '#,##0.00';
    sheet.getColumn('collectionGBP').numFmt = '#,##0.00';
    sheet.getColumn('balanceTRY').numFmt = '#,##0.00';
    sheet.getColumn('balanceEUR').numFmt = '#,##0.00';
    sheet.getColumn('balanceUSD').numFmt = '#,##0.00';
    sheet.getColumn('balanceGBP').numFmt = '#,##0.00';
    
    const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');
    
    filteredSejours.forEach((sejour: any) => {
      // Tahsilat hesaplama
      const collectionTRY = sejour.collections?.reduce((sum: number, col: any) => sum + (col.currency === 'TRY' ? col.amount : 0), 0) || 0;
      const collectionEUR = sejour.collections?.reduce((sum: number, col: any) => sum + (col.currency === 'EUR' ? col.amount : 0), 0) || 0;
      const collectionUSD = sejour.collections?.reduce((sum: number, col: any) => sum + (col.currency === 'USD' ? col.amount : 0), 0) || 0;
      const collectionGBP = sejour.collections?.reduce((sum: number, col: any) => sum + (col.currency === 'GBP' ? col.amount : 0), 0) || 0;
      
      // Bakiye hesaplama
      const balanceTRY = (sejour.totals?.TRY || 0) - collectionTRY;
      const balanceEUR = (sejour.totals?.EUR || 0) - collectionEUR;
      const balanceUSD = (sejour.totals?.USD || 0) - collectionUSD;
      const balanceGBP = ((sejour as any).totals?.GBP || 0) - collectionGBP;
      
      const dataRow = sheet.addRow({
        voucherNumber: sejour.voucherNumber || '',
        customerName: sejour.customerName || '',
        agencyName: sejour.agencyName || '',
        checkInDate: fmtDate(sejour.checkInDate || sejour.check_in_date),
        checkOutDate: fmtDate(sejour.checkOutDate || sejour.check_out_date),
        totalTRY: Number(sejour.totals?.TRY || 0),
        totalEUR: Number(sejour.totals?.EUR || 0),
        totalUSD: Number(sejour.totals?.USD || 0),
        totalGBP: Number((sejour as any).totals?.GBP || 0),
        costTRY: Number(sejour.costs?.TRY || 0),
        costEUR: Number(sejour.costs?.EUR || 0),
        costUSD: Number(sejour.costs?.USD || 0),
        costGBP: Number((sejour as any).costs?.GBP || 0),
        collectionTRY: Number(collectionTRY),
        collectionEUR: Number(collectionEUR),
        collectionUSD: Number(collectionUSD),
        collectionGBP: Number(collectionGBP),
        balanceTRY: Number(balanceTRY),
        balanceEUR: Number(balanceEUR),
        balanceUSD: Number(balanceUSD),
        balanceGBP: Number(balanceGBP),
        status: sejour.status || ''
      });
      // Veri satırı: sayısal sütunlar sağa hizalı
      for (let i = 6; i <= 21; i++) { // 6-21 arası sayısal sütunlar
        dataRow.getCell(i).alignment = { horizontal: 'right', vertical: 'middle' } as any;
      }
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `sejour_listesi_${new Date().toISOString().split('T')[0]}.xlsx`; link.click(); window.URL.revokeObjectURL(url);
  };


  // Oda maliyeti güncelleme
  const updateRoomCost = (id: string, field: 'costPrice' | 'costCurrency', value: number | string) => {
    if (!sejourData) return;

    const updatedRooms = sejourData.rooms.map(room =>
      room.id === id ? { ...room, [field]: value } : room
    );

    const updatedSejourData = {
      ...sejourData,
      rooms: updatedRooms
    };

    setSejourData(updatedSejourData);

    // TODO: Supabase'e güncelleme yapılacak
    console.log('Room cost updated:', { id, field, value, updatedSejourData });
  };

  // Uçuş maliyeti güncelleme
  const updateFlightCost = (id: string, field: 'costPrice' | 'costCurrency', value: number | string) => {
    if (!sejourData) return;

    const updatedFlights = sejourData.flights.map(flight =>
      flight.id === id ? { ...flight, [field]: value } : flight
    );

    const updatedSejourData = {
      ...sejourData,
      flights: updatedFlights
    };

    setSejourData(updatedSejourData);

    // TODO: Supabase'e güncelleme yapılacak
    console.log('Flight cost updated:', { id, field, value, updatedSejourData });
  };

  // Transfer maliyeti güncelleme
  const updateTransferCost = (id: string, field: 'costPrice' | 'costCurrency', value: number | string) => {
    if (!sejourData) return;

    const updatedTransfers = sejourData.transfers.map(transfer =>
      transfer.id === id ? { ...transfer, [field]: value } : transfer
    );

    const updatedSejourData = {
      ...sejourData,
      transfers: updatedTransfers
    };

    setSejourData(updatedSejourData);

    // TODO: Supabase'e güncelleme yapılacak
    console.log('Transfer cost updated:', { id, field, value, updatedSejourData });
  };

  // Ek hizmet maliyeti güncelleme
  const updateExtraServiceCost = (id: string, field: 'costPrice' | 'costCurrency', value: number | string) => {
    if (!sejourData) return;
    
    const updatedExtraServices = sejourData.extraServices.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    );
    
    const updatedSejourData = {
      ...sejourData,
      extraServices: updatedExtraServices
    };
    
    setSejourData(updatedSejourData);
    
    // TODO: Supabase'e güncelleme yapılacak
    console.log('Extra service cost updated:', { id, field, value, updatedSejourData });
  };

  if (loading) {
    return <LoadingSpinner message="Sejour kayıtları yükleniyor..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col flex-1">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4 transition-colors duration-200">
            {error}
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 rounded-lg mb-2">
          <div className="flex justify-between items-center p-2">
                      <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">Sejour Yönetimi</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Sejour işlemlerini yönetin</p>
            </div>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="bg-green-600 dark:bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 flex items-center gap-2 text-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
          {canCreate(Module.SEJOUR) && (
            <Link
              href="/sejour/create"
              className="bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 text-xs"
            >
              Yeni Sejour
            </Link>
          )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-nowrap gap-2 mb-3">
        <button onClick={() => setStatusFilter('all')} className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
          <p className="text-xs font-medium">Tümü</p>
          <p className="text-sm font-bold">{totalCount}</p>
        </button>
        <button onClick={() => setStatusFilter('konfirme')} className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'konfirme' ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
          <p className="text-xs font-medium">Konfirme</p>
          <p className="text-sm font-bold">{sejoursKonfirmeCount}</p>
        </button>
        <button onClick={() => setStatusFilter('bekleyen')} className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'bekleyen' ? 'bg-yellow-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
          <p className="text-xs font-medium">Bekleyen</p>
          <p className="text-sm font-bold">{sejoursBekleyenCount}</p>
        </button>
        <button onClick={() => setStatusFilter('iptal')} className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'iptal' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
          <p className="text-xs font-medium">İptal</p>
          <p className="text-sm font-bold">{sejoursIptalCount}</p>
        </button>
      </div>

      {/* Filtre Barı */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 p-3 transition-colors duration-200 w-full min-w-0">
        <div className="grid w-full items-end gap-2 grid-cols-[1.7fr_1fr_1fr_1fr_1fr_1fr_auto]">
          <DateRangeField
            label="Konaklama Tarihi"
            startValue={draftDateStart}
            endValue={draftDateEnd}
            onStartChange={setDraftDateStart}
            onEndChange={setDraftDateEnd}
          />
          <MultiTokenFilterInput
            label="Voucher No"
            tokens={voucherTokens}
            inputValue={voucherInput}
            suggestions={voucherSuggestions}
            onInputChange={setVoucherInput}
            onAddToken={(value) => addToken(value, setVoucherTokens, setVoucherInput)}
            onRemoveToken={(value) => removeToken(value, setVoucherTokens)}
          />
          <MultiTokenFilterInput
            label="Müşteri"
            tokens={customerTokens}
            inputValue={customerInput}
            suggestions={customerSuggestions}
            onInputChange={setCustomerInput}
            onAddToken={(value) => addToken(value, setCustomerTokens, setCustomerInput)}
            onRemoveToken={(value) => removeToken(value, setCustomerTokens)}
          />
          <MultiTokenFilterInput
            label="Acente"
            tokens={agencyTokens}
            inputValue={agencyInput}
            suggestions={agencySuggestions}
            onInputChange={setAgencyInput}
            onAddToken={(value) => addToken(value, setAgencyTokens, setAgencyInput)}
            onRemoveToken={(value) => removeToken(value, setAgencyTokens)}
          />
          <MultiTokenFilterInput
            label="Misafir"
            tokens={guestTokens}
            inputValue={guestInput}
            suggestions={guestSuggestions}
            onInputChange={setGuestInput}
            onAddToken={(value) => addToken(value, setGuestTokens, setGuestInput)}
            onRemoveToken={(value) => removeToken(value, setGuestTokens)}
          />
          <MultiTokenFilterInput
            label="Durum"
            tokens={statusTokens}
            inputValue={statusInput}
            suggestions={statusSuggestions}
            onInputChange={setStatusInput}
            onAddToken={(value) => addToken(value, setStatusTokens, setStatusInput)}
            onRemoveToken={(value) => removeToken(value, setStatusTokens)}
          />
          <div className="w-8">
            <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1 opacity-0">Temizle</label>
            <button
              onClick={clearSejourFilters}
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

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0">
        <div className="overflow-auto w-full flex-1">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('voucherNumber')}
                  >
                    <div className="flex items-center gap-1">
                      Voucher No
                      {sortField === 'voucherNumber' && (
                        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('customerName')}
                  >
                    <div className="flex items-center gap-1">
                      Müşteri
                      {sortField === 'customerName' && (
                        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('agencyName')}
                  >
                    <div className="flex items-center gap-1">
                      Acente
                      {sortField === 'agencyName' && (
                        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Misafirler
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('checkInDate')}
                  >
                    <div className="flex items-center gap-1">
                      Giriş
                      {sortField === 'checkInDate' && (
                        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('checkOutDate')}
                  >
                    <div className="flex items-center gap-1">
                      Çıkış
                      {sortField === 'checkOutDate' && (
                        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </div>
                  </th>

                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Toplam Tutar
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Toplam Maliyet
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tahsilat
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Bakiye
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Durum
                      {sortField === 'status' && (
                        <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedSejours.items.map((sejour) => (
                  <tr key={sejour.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200">
                      {sejour.voucherNumber}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                      {sejour.customerName}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                      {sejour.agencyName || '-'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                      <div className="text-xs max-w-xs">
                        {sejour.rooms && Array.isArray(sejour.rooms) && sejour.rooms.length > 0 ? (
                          sejour.rooms.map((room: any, index: number) => {
                            const isMatchedGuest = guestTokens.length > 0 && guestTokens.some(token =>
                              (room.guestInfo || '').toLowerCase().includes(token.toLowerCase())
                            );
                            
                            return (
                              <div key={index} className={`mb-1 p-1 rounded ${
                                isMatchedGuest ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-600' : 'bg-gray-50 dark:bg-gray-700'
                              }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                                    Oda {room.roomNumber || index + 1}
                                  </div>
                                  {isMatchedGuest && (
                                    <span className="text-yellow-600 dark:text-yellow-400 text-xs font-bold bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                                      ✓ Eşleşti
                                    </span>
                                  )}
                                </div>
                                <div className={`truncate ${
                                  isMatchedGuest ? 'text-yellow-800 dark:text-yellow-200 font-semibold' : 'text-gray-600 dark:text-gray-400'
                                }`} title={room.guestInfo}>
                                  {room.guestInfo || 'Misafir bilgisi yok'}

                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Misafir bilgisi yok</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            {formatDate(sejour.checkInDate || sejour.check_in_date || '')}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            {formatDate(sejour.checkOutDate || sejour.check_out_date || '')}
                    </td>

                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            <div className="text-xs">
                              <div>TRY: {formatNumber(sejour.totals?.TRY || 0)}</div>
                              <div>EUR: {formatNumber(sejour.totals?.EUR || 0)}</div>
                              <div>USD: {formatNumber(sejour.totals?.USD || 0)}</div>
                              <div>GBP: {formatNumber((sejour as any).totals?.GBP || 0)}</div>
                            </div>
                          </td>
                                              <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                        <div className="text-xs">
                          <div>TRY: {formatNumber(sejour.costs?.TRY || 0)}</div>
                          <div>EUR: {formatNumber(sejour.costs?.EUR || 0)}</div>
                          <div>USD: {formatNumber(sejour.costs?.USD || 0)}</div>
                          <div>GBP: {formatNumber((sejour as any).costs?.GBP || 0)}</div>
                        </div>
                      </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            <div className="text-xs">
                              <div>TRY: {formatNumber(sejour.collections?.reduce((sum, col) => sum + (col.currency === 'TRY' ? col.amount : 0), 0) || 0)}</div>
                              <div>EUR: {formatNumber(sejour.collections?.reduce((sum, col) => sum + (col.currency === 'EUR' ? col.amount : 0), 0) || 0)}</div>
                              <div>USD: {formatNumber(sejour.collections?.reduce((sum, col) => sum + (col.currency === 'USD' ? col.amount : 0), 0) || 0)}</div>
                              <div>GBP: {formatNumber(sejour.collections?.reduce((sum, col) => sum + (col.currency === 'GBP' ? col.amount : 0), 0) || 0)}</div>
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                            <div className="text-xs">
                              <div>TRY: {formatNumber((sejour.totals?.TRY || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'TRY' ? col.amount : 0), 0) || 0))}</div>
                              <div>EUR: {formatNumber((sejour.totals?.EUR || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'EUR' ? col.amount : 0), 0) || 0))}</div>
                              <div>USD: {formatNumber((sejour.totals?.USD || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'USD' ? col.amount : 0), 0) || 0))}</div>
                              <div>GBP: {formatNumber(((sejour as any).totals?.GBP || 0) - (sejour.collections?.reduce((sum, col) => sum + (col.currency === 'GBP' ? col.amount : 0), 0) || 0))}</div>
                            </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sejour.status)}`}>
                        {sejour.status}
                      </span>
                    </td>
                                              <td className="px-2 py-2 whitespace-nowrap text-xs font-medium">
                              <div className="flex space-x-2">
                              <Link
                                href={`/sejour/${sejour.id}`}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200"
                                  title="Görüntüle"
                                >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                              </Link>
                              {canEdit(Module.SEJOUR) && (
                                <Link
                                  href={`/sejour/${sejour.id}/edit`}
                                  className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200"
                                    title="Düzenle"
                                  >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </Link>
                              )}
                              {canDelete(Module.SEJOUR) && (
                                <button
                                  onClick={() => handleDeleteSejour(sejour.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                                    title="Sil"
                                  >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                              )}
                              </div>
                            </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalCount > 0 && (
              <div className="flex justify-end px-2 py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                  <span className="text-sm">Toplam {totalCount} sejour</span>
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
        </div>
      </div>
    </div>
  );
}
