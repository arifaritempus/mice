'use client';

import { useState, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import { format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatNumber, formatDate } from '@/utils/formatters';
import { ExcelUtils } from '@/utils/excelUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { projectsService, quotesService, agenciesService, hotelsService, quoteItemsService, projectSalesItemsService, projectPurchaseItemsService } from '@/lib/supabaseService';
import { usePermissions, Module } from '@/lib/permissions';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
// import { loadTeklifler } from '../../../../src/supabaseClient';

// async function fetchData() {
//   const teklifler = await loadTeklifler();
//   console.log(teklifler);
// }

// fetchData();

interface Agency {
  id: string;
  name: string;
  company_name: string;
}

interface Hotel {
  id: string;
  name: string;
  concept: string;
}

interface QuoteItem {
  id: string;
  quote_id: string;
  main_category?: string;
  sub_category?: string;
  unit_quantity: number;
  sefer: number;
  unit_price: number;
  currency: string;
  total: number;
  description?: string;
  created_at: string;
  // Backward compatibility fields
  category_id?: string;
  sub_category_id?: string;
  repeat_frequency?: number;
  total_price?: number;
  detail_description?: string;
}

type Quote = import('@/lib/supabase').Quote & {
  id: string;
  reference: string;
  agency_id: string;
  company_name: string;
  check_in_date: string;
  check_out_date: string;
  hotel_id: string;
  hotel_concept?: string;
  quote_type: string;
  room_count?: number;
  pax_count?: number;
  option: string;
  option_date?: string; // OPSİYON TARİHİ field'ı eklendi
  status: string;
  notes?: string;
  note?: string; // For backward compatibility
  room_pax?: string; // For backward compatibility
  items?: QuoteItem[];
};

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

function DateRangeField({
  label,
  startValue,
  endValue,
  onStartChange,
  onEndChange
}: DateRangeFieldProps) {
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
      if (!containerRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
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
  const tooltipText = tokens.length > 0
    ? tokens.map((token, index) => `+${index + 1}: ${token}`).join('\n')
    : '';
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
      <div
        className="w-full h-8 px-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto"
        title={tooltipText}
      >
        {tokens.map((token, index) => (
          <span
            key={`${token}-${index}`}
            className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200"
            title={`+${index + 1}: ${token}`}
          >
            +{index + 1}
            <button
              type="button"
              className="text-blue-700 dark:text-blue-200 hover:text-red-500"
              onClick={() => onRemoveToken(token)}
              title="Kaldır"
            >
              ×
            </button>
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

export default function QuotesPage() {
  const { canView, canCreate, canEdit, canDelete, userRole, loading: permissionsLoading } = usePermissions();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [referenceTokens, setReferenceTokens] = useState<string[]>([]);
  const [referenceInput, setReferenceInput] = useState('');
  const [companyTokens, setCompanyTokens] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [agencyTokens, setAgencyTokens] = useState<string[]>([]);
  const [agencyInput, setAgencyInput] = useState('');
  const [statusTokens, setStatusTokens] = useState<string[]>([]);
  const [statusInput, setStatusInput] = useState('');
  const [appliedReferenceTokens, setAppliedReferenceTokens] = useState<string[]>([]);
  const [appliedCompanyTokens, setAppliedCompanyTokens] = useState<string[]>([]);
  const [appliedAgencyTokens, setAppliedAgencyTokens] = useState<string[]>([]);
  const [appliedStatusTokens, setAppliedStatusTokens] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Yeni tarih filtreleri
  const [quoteDateStart, setQuoteDateStart] = useState('');
  const [quoteDateEnd, setQuoteDateEnd] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [optionStart, setOptionStart] = useState('');
  const [optionEnd, setOptionEnd] = useState('');
  const [appliedQuoteDateStart, setAppliedQuoteDateStart] = useState('');
  const [appliedQuoteDateEnd, setAppliedQuoteDateEnd] = useState('');
  const [appliedCheckInDate, setAppliedCheckInDate] = useState('');
  const [appliedCheckOutDate, setAppliedCheckOutDate] = useState('');
  const [appliedOptionStart, setAppliedOptionStart] = useState('');
  const [appliedOptionEnd, setAppliedOptionEnd] = useState('');

  // Opsiyon türü filtresi
  const [optionFilter, setOptionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [lockUpdatingId, setLockUpdatingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [quoteToConfirm, setQuoteToConfirm] = useState<Quote | null>(null);
  const [selectedHotels, setSelectedHotels] = useState<Record<string, boolean>>({});

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await quotesService.getPage({
        page,
        pageSize,
        filter,
        searchTerm,
        quoteDateStart: appliedQuoteDateStart,
        quoteDateEnd: appliedQuoteDateEnd,
        checkInDate: appliedCheckInDate,
        checkOutDate: appliedCheckOutDate,
        optionStart: appliedOptionStart,
        optionEnd: appliedOptionEnd,
        optionFilter,
        sortField,
        sortDirection
      });
      // Geçmiş kayıtlarda locked=false kalsa bile KONFİRME durumunu kilitli kabul et
      setQuotes(
        (response.data || []).map((q: any) => ({
          ...q,
          locked: Boolean(q.locked) || q.status === 'KONFİRME',
        })),
      );
      setTotalCount(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading quotes from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgencies = async () => {
    try {
      const list = await agenciesService.getAll();
      setAgencies(list as any);
    } catch (error) {
      console.error('Error loading agencies from Supabase:', error);
    }
  };

  const loadHotels = async () => {
    try {
      const list = await hotelsService.getAll();
      setHotels(list as any);
    } catch (error) {
      console.error('Error loading hotels from Supabase:', error);
    }
  };

  const isQuoteLocked = (quote: Quote) => {
    // İş kuralı: KONFİRME olan teklifler her zaman kilitli kabul edilir
    return Boolean((quote as any).locked) || quote.status === 'KONFİRME';
  };

  const toggleLock = async (quote: Quote) => {
    if (userRole !== 'super_admin') return;
    if (lockUpdatingId) return;
    try {
      setLockUpdatingId(quote.id);
      const updated = await quotesService.update(quote.id, { locked: !quote.locked } as any);
      setQuotes(prev =>
        prev.map(q => (q.id === quote.id ? { ...q, locked: (updated as any).locked } : q)),
      );
    } catch (error) {
      console.error('Teklif kilitleme/kilidi açma hatası:', error);
      alert('Teklif kilidi güncellenirken bir hata oluştu.');
    } finally {
      setLockUpdatingId(null);
    }
  };

  const addNewQuote = (newQuote: Quote) => {
    const updatedQuotes = [...quotes, newQuote];
    setQuotes(updatedQuotes);
    // Supabase'e kaydedildi
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'KONFİRME':
        return 'bg-green-100 text-green-800';
      case 'İPTAL':
        return 'bg-red-100 text-red-800';
      case 'TEKLİF':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrencyDisplay = (currency: string) => {
    switch (currency) {
      case 'EUR':
        return 'EUR';
      case 'USD':
        return 'USD';
      case 'GBP':
        return 'GBP';
      case 'TL':
        return 'TL';
      default:
        return currency;
    }
  };

  const getAgencyName = (agencyId: string) => {
    return agencies.find(agency => agency.id === agencyId)?.name || '';
  };

  const getHotelName = (hotelId: string) => {
    return hotels.find(hotel => hotel.id === hotelId)?.name || '';
  };

  const searchQuotes = (quotes: Quote[], searchTerm: string) => {
    if (!searchTerm.trim()) return quotes;

    const searchLower = searchTerm.toLowerCase();

    return quotes.filter(quote => {
      // Referans numarası
      if (quote.reference?.toLowerCase().includes(searchLower)) return true;

      // Acente adı
      const agencyName = getAgencyName(quote.agency_id)?.toLowerCase() || '';
      if (agencyName.includes(searchLower)) return true;

      // Otel adı
      const hotelName = getHotelName(quote.hotel_id)?.toLowerCase() || '';
      if (hotelName.includes(searchLower)) return true;

      // Proje adı
      if (quote.project_name?.toLowerCase().includes(searchLower)) return true;

      return false;
    });
  };

  const isRangeCompleteOrEmpty = (start: string, end: string) => {
    return (Boolean(start) && Boolean(end)) || (!start && !end);
  };

  useEffect(() => {
    loadAgencies();
    loadHotels();
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [page, pageSize, filter, optionFilter, sortField, sortDirection, appliedQuoteDateStart, appliedQuoteDateEnd, appliedCheckInDate, appliedCheckOutDate, appliedOptionStart, appliedOptionEnd]);


  // Debug için: Opsiyon filtreleme kontrolü
  useEffect(() => {
    if (quotes.length > 0 && optionFilter !== 'all') {
      console.log('=== OPSİYON FİLTRELEME DEBUG ===');
      console.log('Seçilen optionFilter:', optionFilter);
      console.log('Mevcut tekliflerin option değerleri:', quotes.map(q => ({
        id: q.id,
        reference: q.reference,
        option: q.option,
        optionLength: q.option?.length || 0
      })));

      // Filtrelenmiş sonuçları da kontrol et
      const filtered = quotes.filter(q => q.option === optionFilter);
      console.log('Filtrelenmiş teklif sayısı:', filtered.length);
      console.log('Filtrelenmiş teklifler:', filtered.map(q => q.reference));
    }
  }, [optionFilter, quotes]);

  // Global fonksiyon olarak ekle
  useEffect(() => {
    (window as any).addNewQuote = addNewQuote;
    return () => {
      delete (window as any).addNewQuote;
    };
  }, []);

  // Metin tabanlı filtreler anında uygulanır
  useEffect(() => {
    setAppliedReferenceTokens(referenceTokens);
    setAppliedCompanyTokens(companyTokens);
    setAppliedAgencyTokens(agencyTokens);
    setAppliedStatusTokens(statusTokens);
    setPage(1);
  }, [referenceTokens, companyTokens, agencyTokens, statusTokens]);

  // Teklif tarihi aralığı: sadece başlangıç+bitiş birlikte seçilince uygula
  useEffect(() => {
    if (!isRangeCompleteOrEmpty(quoteDateStart, quoteDateEnd)) return;
    setAppliedQuoteDateStart(quoteDateStart);
    setAppliedQuoteDateEnd(quoteDateEnd);
    setPage(1);
  }, [quoteDateStart, quoteDateEnd]);

  // Organizasyon tarihi aralığı: sadece başlangıç+bitiş birlikte seçilince uygula
  useEffect(() => {
    if (!isRangeCompleteOrEmpty(checkInDate, checkOutDate)) return;
    setAppliedCheckInDate(checkInDate);
    setAppliedCheckOutDate(checkOutDate);
    setPage(1);
  }, [checkInDate, checkOutDate]);

  // Opsiyon tarihi aralığı: birlikte seçilince uygula
  useEffect(() => {
    if (!isRangeCompleteOrEmpty(optionStart, optionEnd)) return;
    setAppliedOptionStart(optionStart);
    setAppliedOptionEnd(optionEnd);
    setPage(1);
  }, [
    optionStart,
    optionEnd,
  ]);




  // Filtreleri temizleme fonksiyonu
  const clearAllFilters = () => {
    console.log('=== FİLTRELERİ TEMİZLE BUTONU TIKLANDI ===');

    console.log('Temizlenmeden önce state değerleri:');
    console.log('- quoteDateStart:', quoteDateStart);
    console.log('- quoteDateEnd:', quoteDateEnd);
    console.log('- checkInDate:', checkInDate);
    console.log('- checkOutDate:', checkOutDate);
    console.log('- optionStart:', optionStart);
    console.log('- optionEnd:', optionEnd);
    console.log('- optionFilter:', optionFilter);
    console.log('- searchTerm:', searchTerm);
    console.log('- filter (Durum):', filter);

    // Tüm filtreleri temizle
    setQuoteDateStart(''); // Boş string yap
    setQuoteDateEnd('');
    setCheckInDate('');
    setCheckOutDate('');
    setOptionStart('');
    setOptionEnd('');
    setOptionFilter('all'); // Opsiyon türü filtresi
    setFilter('all'); // Durum filtresi (Teklif, Konfirme, İptal)
    setSearchTerm('');
    setReferenceTokens([]);
    setReferenceInput('');
    setCompanyTokens([]);
    setCompanyInput('');
    setAgencyTokens([]);
    setAgencyInput('');
    setStatusTokens([]);
    setStatusInput('');
    setAppliedQuoteDateStart('');
    setAppliedQuoteDateEnd('');
    setAppliedCheckInDate('');
    setAppliedCheckOutDate('');
    setAppliedOptionStart('');
    setAppliedOptionEnd('');
    setAppliedReferenceTokens([]);
    setAppliedCompanyTokens([]);
    setAppliedAgencyTokens([]);
    setAppliedStatusTokens([]);
    setPageSize(DEFAULT_PAGE_SIZE);
    setPage(1);

    console.log('Tüm filtreler temizlendi:');
    console.log('- Tarih filtreleri temizlendi');
    console.log('- Opsiyon türü filtresi: "Tüm Opsiyonlar"');
    console.log('- Durum filtresi: "Tümü"');
    console.log('- Arama temizlendi');
  };




  // Yeni tarih ve opsiyon filtreleme fonksiyonu
  const filterQuotesByDatesAndOptions = (quotes: Quote[]) => {
    return quotes.filter(quote => {
      // Teklif tarihi filtreleri (oluşturulma tarihi)
      if (quoteDateStart && quote.created_at < quoteDateStart) return false;
      if (quoteDateEnd && quote.created_at > quoteDateEnd) return false;

      // Check-in tarihi filtresi
      if (checkInDate && quote.check_in_date !== checkInDate) return false;

      // Check-out tarihi filtresi
      if (checkOutDate && quote.check_out_date !== checkOutDate) return false;

      // Opsiyon tarihi filtreleri
      if (optionStart && quote.option_date && quote.option_date < optionStart) return false;
      if (optionEnd && quote.option_date && quote.option_date > optionEnd) return false;

      // Opsiyon türü filtresi
      if (optionFilter !== 'all' && quote.option !== optionFilter) return false;

      return true;
    });
  };

  const sortQuotes = (quotes: Quote[], field: string, direction: 'asc' | 'desc') => {
    if (!field) return quotes;

    return [...quotes].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (field) {
        case 'created_at':
          aValue = new Date(a.created_at || '').getTime();
          bValue = new Date(b.created_at || '').getTime();
          break;
        case 'reference':
          aValue = a.reference || '';
          bValue = b.reference || '';
          break;
        case 'agency':
          aValue = getAgencyName(a.agency_id) || '';
          bValue = getAgencyName(b.agency_id) || '';
          break;
        case 'company_name':
          aValue = a.company_name || '';
          bValue = b.company_name || '';
          break;
        case 'hotel':
          aValue = getHotelName(a.hotel_id) || '';
          bValue = getHotelName(b.hotel_id) || '';
          break;
        case 'quote_type':
          aValue = a.quote_type || '';
          bValue = b.quote_type || '';
          break;
        case 'option':
          aValue = a.option || '';
          bValue = b.option || '';
          break;
        case 'option_date':
          aValue = a.option_date ? new Date(a.option_date).getTime() : 0;
          bValue = b.option_date ? new Date(b.option_date).getTime() : 0;
          break;
        case 'date':
          aValue = new Date(a.check_in_date || '').getTime();
          bValue = new Date(b.check_in_date || '').getTime();
          break;
        case 'room_pax':
          aValue = a.room_pax || '';
          bValue = b.room_pax || '';
          break;
        case 'total_amount':
          aValue = a.total_amount || 0;
          bValue = b.total_amount || 0;
          break;
        case 'currency':
          aValue = a.items?.[0]?.currency || 'EUR';
          bValue = b.items?.[0]?.currency || 'EUR';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          return 0;
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
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



  const handleDeleteQuote = async (quoteId: string) => {
    if (confirm('Bu teklifi silmek istediğinizden emin misiniz?')) {
      try {
        await quotesService.delete(quoteId);
        const updatedQuotes = quotes.filter(q => q.id !== quoteId);
        setQuotes(updatedQuotes);
        alert('Teklif başarıyla silindi!');
      } catch (error) {
        console.error('Error deleting quote:', error);
        alert('Teklif silinirken hata oluştu');
      }
    }
  };

  const handleCopyQuote = async (quote: Quote) => {
    try {
      // Yeni quote oluştur
      const created = await quotesService.create({
        reference: `${quote.reference}-COPY`,
        agency_id: quote.agency_id,
        company_name: quote.company_name,
        check_in_date: quote.check_in_date,
        check_out_date: quote.check_out_date,
        hotel_id: quote.hotel_id,
        hotel_concept: quote.hotel_concept || '',
        room_count: quote.room_count || 0,
        pax_count: quote.pax_count || 0,
        option: quote.option,
        option_date: (quote as any).option_date || null,
        status: 'TEKLİF',
        quote_type: quote.quote_type,
        operation_managers: (quote as any).operation_managers || [],
        notes: quote.notes || '',
        total_amount: quote.total_amount || 0
      } as any);

      // Eğer kaynak quote'da kalemler varsa, yeni quote_id ile kopyala
      try {
        const items = (quote as any).items || [];
        for (const item of items) {
          await quoteItemsService.create({
            quote_id: (created as any).id,
            main_category: item.main_category || item.category_id || '',
            sub_category: item.sub_category || item.sub_category_id || '',
            unit_quantity: Number(item.unit_quantity || 0),
            sefer: Number(item.sefer || item.repeat_frequency || 0),
            unit_price: Number(item.unit_price || 0),
            currency: item.currency || 'EUR',
            total: Number(item.total || item.total_price || 0),
            description: item.description || item.detail_description || ''
          } as any);
        }
      } catch (err) {
        console.error('Kalem kopyalama hatası:', err);
      }

      // UI'yı güncelle
      setQuotes(prev => [created as any, ...prev]);
      alert('Teklif başarıyla kopyalandı!');
    } catch (e) {
      console.error('Teklif kopyalama hatası:', e);
      alert('Kopyalama sırasında hata oluştu.');
    }
  };

  // KONFİRME teklifleri projeye aktar (quotes sayfasından)
  const transferConfirmedToProjects = async () => {
    try {
      setTransferring(true);
      const existingProjects = await projectsService.getAll();
      const existingByQuote = new Set(existingProjects.map(p => p.quote_id).filter(Boolean) as string[]);

      // Sadece henüz aktarılmamış olanları filtrele
      const pendingQuotes = quotes.filter(q => q.status === 'KONFİRME' && !existingByQuote.has(q.id));

      if (pendingQuotes.length === 0) {
        alert('Aktarılacak yeni konfirme teklif bulunamadı.');
        return;
      }

      const proceed = confirm(
        `Henüz aktarılmamış ${pendingQuotes.length} teklif kontrol ediliyor.\n\nDevam edilsin mi?`
      );
      if (!proceed) return;

      let createdCount = 0;
      for (const q of pendingQuotes) {
        try {
          // Loop içinde tekrar kontrole gerek kalmadı ama güvenlik için bırakılabilir 
          // (sequential olduğu için sorun olmaz)
          const hotelsData = (q as any).hotels_data || [];
          const confirmedHotels = Array.isArray(hotelsData)
            ? hotelsData.filter(h => h.is_confirmed === true)
            : [];

          // Eğer is_confirmed işaretli otel yoksa ama hotels_data boşsa veya 
          // is_confirmed alanı hiç yoksa (eski veriler), ana hotel_id'yi baz al
          if (confirmedHotels.length === 0) {
            // Sadece ana hotel_id varsa onu konfirme say
            if (q.hotel_id) {
              await createProjectFromQuote(q, []);
              createdCount++;
            }
            continue;
          }

          // Çoklu otelli sistem: Tüm konfirme otelleri tek projede birleştir
          await createProjectFromQuote(q, confirmedHotels);
          createdCount++;
        } catch (e) {
          console.error(`${q.reference} aktarılırken hata:`, e);
        }
      }

      loadQuotes();
      alert(`${createdCount} yeni proje oluşturuldu.`);
    } finally {
      setTransferring(false);
    }
  };

  const createProjectFromQuote = async (quote: Quote, confirmedHotels: any[]) => {
    const q = quote as any;

    // Her otel sekmesinin kararlı bir UUID .id'si olduğundan emin ol.
    // Eğer .id yoksa veya geçersizse yeni UUID üret.
    // Bu sayede project_sales_items.hotel_id ile hotels_data[n].id her zaman eşleşir.
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const normalizedHotels = confirmedHotels.map(h => ({
      ...h,
      id: h.id && isUUID(h.id) ? h.id : crypto.randomUUID()
    }));

    // Değerleri belirle
    const firstH = normalizedHotels.length > 0 ? normalizedHotels[0] : null;
    const hotelId = firstH?.hotel_id || q.hotel_id;
    const hotelObj = hotels.find(ht => ht.id === hotelId);
    const hotelName = hotelObj ? hotelObj.name : (hotelId || 'Otel');

    const title = normalizedHotels.length > 1
      ? `${q.reference} - Çoklu Konaklama (${normalizedHotels.length} Otel)`
      : `${q.reference} - ${hotelName}`;

    const description = `Konfirme edilen teklif: ${q.reference}`;
    const start_date = firstH?.check_in_date || q.check_in_date || q.created_at || new Date().toISOString().slice(0, 10);
    const end_date = firstH?.check_out_date || q.check_out_date || start_date;

    const quoteItems = await quoteItemsService.getByQuoteId(q.id);

    // Konfirme otellere ait kalemleri filtrele
    const confirmedHotelIds = normalizedHotels.map(h => h.hotel_id);
    const confirmedTabIds = normalizedHotels.map(h => h.id);

    const relevantItemsRaw = normalizedHotels.length > 0
      ? quoteItems.filter(item =>
        confirmedTabIds.includes(item.hotel_id || '') ||
        confirmedHotelIds.includes(item.hotel_id || '') ||
        !item.hotel_id || item.hotel_id === 'general'
      )
      : quoteItems;

    // Mükerrer kalemleri (tamamen aynı olanlar) temizle
    const seen = new Set<string>();
    const relevantItems = relevantItemsRaw.filter(it => {
      const key = `${it.main_category}|${it.sub_category}|${it.description}|${it.hotel_id}|${it.unit_price}|${it.unit_quantity}|${it.sefer}|${it.vat}|${it.fx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const budget = relevantItems.reduce((sum, it) => sum + (Number(it.total) || 0), 0);

    const created = await projectsService.create({
      title,
      description,
      status: 'active',
      priority: 'medium',
      start_date,
      end_date,
      budget,
      progress: 0,
      team_members: q.operation_managers?.length || 0,
      quote_id: q.id,
      reference: q.reference,
      company_name: q.company_name,
      agency_id: q.agency_id || null,
      hotel_id: hotelId || null,
      quote_type: q.quote_type,
      room_count: firstH?.room_count || q.room_count || 0,
      pax_count: firstH?.pax_count || q.pax_count || 0,
      room_pax: `${firstH?.room_count || 0} | ${firstH?.pax_count || 0}`,
      confirmed_at: q.confirmed_at || q.updated_at || q.created_at || start_date,
      // normalizedHotels kullan: her sekmenin kararlı UUID .id'si var
      hotels_data: normalizedHotels.length > 0 ? normalizedHotels : (q.hotel_id ? [{
        id: crypto.randomUUID(),
        hotel_id: q.hotel_id,
        room_count: q.room_count,
        pax_count: q.pax_count,
        check_in_date: q.check_in_date,
        check_out_date: q.check_out_date,
        is_confirmed: true
      }] : [])
    } as any);

    const withTabTag = (desc: string, tabId: string | null) => {
      const cleanDesc = String(desc || '').replace(/\s*\[T:[^\]]+\]\s*/g, ' ').trim();
      if (!tabId) return cleanDesc;
      return `${cleanDesc}${cleanDesc ? ' ' : ''}[T:${tabId}]`;
    };

    // Satış kalemlerini oluştur (hotel_id için gerçek otel UUID, tab için [T:...] etiketi)
    for (const item of relevantItems) {
      const originalIndex = confirmedHotels.findIndex(h => h.id === item.hotel_id || h.hotel_id === item.hotel_id);
      const realHotelId = originalIndex !== -1 ? (confirmedHotels[originalIndex].hotel_id || null) : null;
      const tabUUID = originalIndex !== -1 ? normalizedHotels[originalIndex].id : null;

      await projectSalesItemsService.create({
        project_id: created.id,
        category: item.main_category || '',
        sub_category: item.sub_category || '',
        description: withTabTag(item.description || '', tabUUID),
        unit_quantity: item.unit_quantity || 1,
        sefer: item.sefer || 1,
        unit_price: item.unit_price || 0,
        total_price: item.total || 0,
        currency: item.currency || 'EUR',
        vat: item.vat || 0,
        fx: item.fx || 1,
        hotel_id: realHotelId
      });
    }

    // Alış kalemleri (satış kalemlerinden fiyatsız kopya)
    for (const item of relevantItems) {
      const originalIndex = confirmedHotels.findIndex(h => h.id === item.hotel_id || h.hotel_id === item.hotel_id);
      const realHotelId = originalIndex !== -1 ? (confirmedHotels[originalIndex].hotel_id || null) : null;
      const tabUUID = originalIndex !== -1 ? normalizedHotels[originalIndex].id : null;

      await projectPurchaseItemsService.create({
        project_id: created.id,
        category: item.main_category || '',
        sub_category: item.sub_category || '',
        description: withTabTag(item.description || '', tabUUID),
        unit_quantity: item.unit_quantity || 1,
        sefer: item.sefer || 1,
        unit_price: 0,
        total_price: 0,
        currency: item.currency || 'EUR',
        vat: item.vat || 0,
        fx: item.fx || 1,
        hotel_id: realHotelId
      });
    }
  };

  // Excel Export Fonksiyonu - Tüm filtreleri uygular
  const exportToExcel = async () => {
    setExporting(true);

    try {
      // Tüm filtreleri uygula (arama, tarih, durum, opsiyon)
      const fullyFilteredQuotes = sortQuotes(
        filterQuotesByDatesAndOptions(
          searchQuotes(
            filter === 'all'
              ? quotes
              : quotes.filter(q => q.status === filter),
            searchTerm
          )
        ),
        sortField,
        sortDirection
      );

      console.log('Export edilecek teklif sayısı:', fullyFilteredQuotes.length);
      console.log('Uygulanan filtreler:', {
        statusFilter: filter,
        searchTerm,
        quoteDateStart,
        quoteDateEnd,
        checkInDate,
        checkOutDate,
        optionStart,
        optionEnd,
        optionFilter
      });

      await ExcelUtils.exportQuotes(fullyFilteredQuotes, agencies, hotels);
      alert(`Excel dosyası başarıyla indirildi! (${fullyFilteredQuotes.length} teklif)`);
    } catch (error) {
      console.error('Excel export hatası:', error);
      alert('Excel dosyası oluşturulurken bir hata oluştu.');
    } finally {
      setExporting(false);
    }
  };


  useEffect(() => {
    setPage(1);
  }, [filter, optionFilter, sortField, sortDirection]);

  // Calculate counts based on current filtered data
  // İstatistik kartları - Filtrelenmiş verilere göre hesapla
  const beklemedeCount = quotes.filter(q => q.status === 'BEKLEMEDE' || q.status === 'TEKLİF').length;
  const konfirmeCount = quotes.filter(q => q.status === 'KONFİRME').length;
  const iptalCount = quotes.filter(q => q.status === 'İPTAL').length;
  const option1Count = quotes.filter(q => q.option === '1. OPSİYON').length;
  const option2Count = quotes.filter(q => q.option === '2. OPSİYON').length;
  const sorSatCount = quotes.filter(q => q.option === 'SOR-SAT').length;

  const includesByTokens = (value: string, tokens: string[]) => {
    if (tokens.length === 0) return true;
    const normalized = (value || '').toLowerCase();
    // Aynı input içinde birden fazla token varsa OR mantığı kullan:
    // kayıt, token'lardan en az birini içeriyorsa eşleşmiş sayılır.
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
      if (prev.some(item => item.toLowerCase() === normalized.toLowerCase())) {
        return prev;
      }
      return [...prev, normalized];
    });
    setInput('');
  };

  const removeToken = (
    value: string,
    setTokens: Dispatch<SetStateAction<string[]>>
  ) => {
    setTokens(prev => prev.filter(item => item !== value));
  };

  const referenceSuggestions = useMemo(
    () => Array.from(new Set(quotes.map(q => (q.reference || '').trim()).filter(Boolean))),
    [quotes]
  );
  const companySuggestions = useMemo(
    () => Array.from(new Set(quotes.map(q => (q.company_name || '').trim()).filter(Boolean))),
    [quotes]
  );
  const agencySuggestions = useMemo(
    () => Array.from(new Set(quotes.map(q => (getAgencyName(q.agency_id) || '').trim()).filter(Boolean))),
    [quotes, agencies]
  );
  const statusSuggestions = useMemo(
    () => Array.from(new Set(['TEKLİF', 'BEKLEMEDE', 'KONFİRME', 'İPTAL', ...quotes.map(q => (q.status || '').trim()).filter(Boolean)])),
    [quotes]
  );

  const totalOffersLabel = totalCount;

  const visibleQuotes = quotes.filter((quote) => {
    const agencyName = getAgencyName(quote.agency_id);

    if (!includesByTokens(quote.reference || '', appliedReferenceTokens)) return false;
    if (!includesByTokens(quote.company_name || '', appliedCompanyTokens)) return false;
    if (!includesByTokens(agencyName || '', appliedAgencyTokens)) return false;
    if (!includesByTokens(quote.status || '', appliedStatusTokens)) return false;

    return true;
  });

  // Toplam teklif sayısı (filtrelenmiş)
  const totalFilteredCount = totalCount;
  const tableColumnCount = userRole === 'super_admin' ? 16 : 15;

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Quotes görüntüleme yetkisi kontrolü
  if (!canView(Module.QUOTES)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Teklifler sayfasına erişim için yetkiniz bulunmuyor.</p>
          <Link href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Teklifler yükleniyor..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Teklifler</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Müşteri tekliflerini yönetin</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={transferConfirmedToProjects}
            disabled={transferring}
            className="bg-indigo-600 dark:bg-indigo-500 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50 flex items-center text-xs"
          >
            {transferring ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Aktarılıyor
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m5 8H6a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0116 10v8a2 2 0 01-2 2z" />
                </svg>
                Konfirme → Proje
              </>
            )}
          </button>
          <button
            onClick={exportToExcel}
            disabled={exporting}
            className="bg-green-600 dark:bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 flex items-center text-xs"
          >
            {exporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                İşleniyor...
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </>
            )}
          </button>
          {canCreate(Module.QUOTES) && (
            <Link
              href="/quotes/create"
              className="bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 text-xs"
            >
              Yeni Teklif
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards - Durum */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg shadow px-3 py-2 transition-colors duration-200 text-left ${filter === 'all'
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
        >
          <p className="text-[11px] font-medium opacity-90">Tümü</p>
          <p className="text-base font-bold">{totalFilteredCount}</p>
        </button>
        <button
          onClick={() => setFilter('BEKLEMEDE')}
          className={`rounded-lg shadow px-3 py-2 transition-colors duration-200 text-left ${filter === 'BEKLEMEDE'
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
        >
          <p className="text-[11px] font-medium opacity-90">Beklemede</p>
          <p className="text-base font-bold">{beklemedeCount}</p>
        </button>
        <button
          onClick={() => setFilter('KONFİRME')}
          className={`rounded-lg shadow px-3 py-2 transition-colors duration-200 text-left ${filter === 'KONFİRME'
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
        >
          <p className="text-[11px] font-medium opacity-90">Konfirme</p>
          <p className="text-base font-bold">{konfirmeCount}</p>
        </button>
        <button
          onClick={() => setFilter('İPTAL')}
          className={`rounded-lg shadow px-3 py-2 transition-colors duration-200 text-left ${filter === 'İPTAL'
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
        >
          <p className="text-[11px] font-medium opacity-90">İptal</p>
          <p className="text-base font-bold">{iptalCount}</p>
        </button>
      </div>

      {/* Stats Cards - Opsiyon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
        <button
          onClick={() => setOptionFilter('all')}
          className={`rounded-lg shadow px-3 py-2 transition-colors duration-200 text-left ${optionFilter === 'all'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
        >
          <p className="text-[11px] font-medium opacity-90">Tüm Opsiyonlar</p>
          <p className="text-base font-bold">{quotes.length}</p>
        </button>
        <button
          onClick={() => setOptionFilter('1. OPSİYON')}
          className={`rounded-lg shadow px-3 py-2 transition-colors duration-200 text-left ${optionFilter === '1. OPSİYON'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
        >
          <p className="text-[11px] font-medium opacity-90">1. Opsiyon</p>
          <p className="text-base font-bold">{option1Count}</p>
        </button>
        <button
          onClick={() => setOptionFilter('2. OPSİYON')}
          className={`rounded-lg shadow px-3 py-2 transition-colors duration-200 text-left ${optionFilter === '2. OPSİYON'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
        >
          <p className="text-[11px] font-medium opacity-90">2. Opsiyon</p>
          <p className="text-base font-bold">{option2Count}</p>
        </button>
        <button
          onClick={() => setOptionFilter('SOR-SAT')}
          className={`rounded-lg shadow px-3 py-2 transition-colors duration-200 text-left ${optionFilter === 'SOR-SAT'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
        >
          <p className="text-[11px] font-medium opacity-90">Sor-Sat</p>
          <p className="text-base font-bold">{sorSatCount}</p>
        </button>
      </div>

      {/* Bağımsız Arama Alanı */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 p-3 transition-colors duration-200 w-full min-w-0">
        <div className="w-full min-w-0">
          <div className="grid w-full items-end gap-2 grid-cols-[1.8fr_1fr_1.8fr_1fr_1fr_1fr_auto]">
            <div className="min-w-0">
              <DateRangeField
                label="Teklif Tarihi"
                startValue={quoteDateStart}
                endValue={quoteDateEnd}
                onStartChange={setQuoteDateStart}
                onEndChange={setQuoteDateEnd}
              />
            </div>
            <div className="min-w-0">
              <MultiTokenFilterInput
                label="Referans"
                tokens={referenceTokens}
                inputValue={referenceInput}
                suggestions={referenceSuggestions}
                onInputChange={setReferenceInput}
                onAddToken={(value) => addToken(value, setReferenceTokens, setReferenceInput)}
                onRemoveToken={(value) => removeToken(value, setReferenceTokens)}
              />
            </div>
            <div className="min-w-0">
              <DateRangeField
                label="C-IN C-OUT Tarihi"
                startValue={checkInDate}
                endValue={checkOutDate}
                onStartChange={setCheckInDate}
                onEndChange={setCheckOutDate}
              />
            </div>
            <div className="min-w-0">
              <MultiTokenFilterInput
                label="Firma Adı"
                tokens={companyTokens}
                inputValue={companyInput}
                suggestions={companySuggestions}
                onInputChange={setCompanyInput}
                onAddToken={(value) => addToken(value, setCompanyTokens, setCompanyInput)}
                onRemoveToken={(value) => removeToken(value, setCompanyTokens)}
              />
            </div>
            <div className="min-w-0">
              <MultiTokenFilterInput
                label="Acente"
                tokens={agencyTokens}
                inputValue={agencyInput}
                suggestions={agencySuggestions}
                onInputChange={setAgencyInput}
                onAddToken={(value) => addToken(value, setAgencyTokens, setAgencyInput)}
                onRemoveToken={(value) => removeToken(value, setAgencyTokens)}
              />
            </div>
            <div className="min-w-0">
              <MultiTokenFilterInput
                label="Durum"
                tokens={statusTokens}
                inputValue={statusInput}
                suggestions={statusSuggestions}
                onInputChange={setStatusInput}
                onAddToken={(value) => addToken(value, setStatusTokens, setStatusInput)}
                onRemoveToken={(value) => removeToken(value, setStatusTokens)}
              />
            </div>
            <div className="w-8">
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1 opacity-0">Temizle</label>
              <button
                onClick={clearAllFilters}
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
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0">
        <div className="overflow-auto w-full flex-1">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center leading-tight">
                    <span>Teklif<br />Tarihi</span>
                    {sortField === 'created_at' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('reference')}
                >
                  <div className="flex items-center">
                    Referans
                    {sortField === 'reference' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center leading-tight">
                    <span>C-IN C-OUT<br />Tarihi</span>
                    {sortField === 'date' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('company_name')}
                >
                  <div className="flex items-center">
                    Firma Adı
                    {sortField === 'company_name' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('agency')}
                >
                  <div className="flex items-center">
                    Acente
                    {sortField === 'agency' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('hotel')}
                >
                  <div className="flex items-center">
                    Otel
                    {sortField === 'hotel' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>

                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('quote_type')}
                >
                  <div className="flex items-center leading-tight">
                    <span>Teklif<br />Türü</span>
                    {sortField === 'quote_type' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>

                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('option')}
                >
                  <div className="flex items-center">
                    OPSİYON
                    {sortField === 'option' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>

                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('option_date')}
                >
                  <div className="flex items-center leading-tight">
                    <span>Opsiyon<br />Tarihi</span>
                    {sortField === 'option_date' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>

                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('room_pax')}
                >
                  <div className="flex items-center leading-tight">
                    <span>ODA |<br />PAX</span>
                    {sortField === 'room_pax' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('total_amount')}
                >
                  <div className="flex items-center leading-tight">
                    <span>Toplam<br />Tutar</span>
                    {sortField === 'total_amount' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('currency')}
                >
                  <div className="flex items-center">
                    Döviz
                    {sortField === 'currency' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Durum
                    {sortField === 'status' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
                {/* Kilit durumu (sadece süper admin için) */}
                {userRole === 'super_admin' && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kilit
                  </th>
                )}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {visibleQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200">
                    {formatDate(quote.created_at)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200">
                    {quote.reference}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                    <div className="leading-tight">
                      <div>{formatDate(quote.check_in_date)}</div>
                      <div>{formatDate(quote.check_out_date)}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200 max-w-[180px]">
                    <span className="block truncate" title={quote.company_name || '-'}>
                      {quote.company_name}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200 max-w-[160px]">
                    <span className="block truncate" title={getAgencyName(quote.agency_id) || '-'}>
                      {getAgencyName(quote.agency_id)}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200 max-w-[160px]">
                    <span className="block truncate" title={getHotelName(quote.hotel_id) || '-'}>
                      {getHotelName(quote.hotel_id)}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                    {quote.quote_type}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                    {quote.option}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                    {quote.option_date ? formatDate(quote.option_date) : '-'}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                    {quote.room_count && quote.pax_count ? `${quote.room_count} | ${quote.pax_count}` : (quote.room_pax || 'N/A')}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200">
                    {formatNumber(quote.total_amount || 0)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200">
                    {getCurrencyDisplay(quote.items?.[0]?.currency || 'EUR')}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  {/* Kilit sütunu */}
                  {userRole === 'super_admin' && (
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <button
                        onClick={() => toggleLock(quote)}
                        disabled={!!lockUpdatingId}
                        className={`p-1 rounded border text-xs inline-flex items-center justify-center ${isQuoteLocked(quote)
                            ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200'
                            : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200'
                          } ${lockUpdatingId ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                        title={isQuoteLocked(quote) ? 'Kilidi Aç' : 'Kilitle'}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {isQuoteLocked(quote) ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 11V9a7 7 0 1114 0v2m-2 0V9a5 5 0 10-10 0v2m-1 0h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2z"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 11V7a4 4 0 10-8 0v4m2 0V7a2 2 0 114 0v4m3 0h7a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h7z"
                            />
                          )}
                        </svg>
                      </button>
                    </td>
                  )}
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.location.href = `/quotes/${quote.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200"
                        title="Görüntüle"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {canEdit(Module.QUOTES) && !isQuoteLocked(quote) && (
                        <button
                          onClick={() => window.location.href = `/quotes/${quote.id}/edit`}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200"
                          title="Düzenle"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleCopyQuote(quote)}
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors duration-200"
                        title="Kopyala"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>

                      {canDelete(Module.QUOTES) && !isQuoteLocked(quote) && (
                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                          title="Sil"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      {quote.status === 'TEKLİF' && (
                        <button
                          onClick={() => {
                            setQuoteToConfirm(quote);
                            const hotelsData = (quote as any).hotels_data || [];
                            const initialSelected: Record<string, boolean> = {};
                            hotelsData.forEach((h: any) => {
                              initialSelected[h.id] = h.is_confirmed || false;
                            });
                            setSelectedHotels(initialSelected);
                            setShowConfirmModal(true);
                          }}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200"
                          title="Konfirme Et"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visibleQuotes.length === 0 && (
                <tr>
                  <td colSpan={tableColumnCount} className="px-3 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    Filtrelere uygun kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalCount > 0 && (
          <div className="flex justify-end px-2 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
              <span className="text-sm">Toplam {totalOffersLabel} teklif</span>
              <button
                className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                title="Önceki"
              >
                ‹
              </button>
              <span className="text-sm font-medium">{page}</span>
              <button
                className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                title="Sonraki"
              >
                ›
              </button>
              <span className="h-8 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 text-sm">
                20 / sayfa
              </span>
            </div>
          </div>
        )}
      </div>
      {/* Selective Confirmation Modal */}
      {showConfirmModal && quoteToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Otel Konfirme Seçimi
              </h2>
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-gray-200">{quoteToConfirm.reference}</span> referanslı teklif için konfirme edilecek otelleri seçin:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {((quoteToConfirm as any).hotels_data || []).map((h: any, idx: number) => {
                  const hotelObj = hotels.find(ht => ht.id === h.hotel_id);
                  return (
                    <label
                      key={h.id}
                      className={`flex items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${selectedHotels[h.id]
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedHotels[h.id] || false}
                        onChange={(e) => setSelectedHotels(prev => ({ ...prev, [h.id]: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {idx + 1}. {hotelObj?.name || 'Otel Bilgisi Yok'}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {h.option}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatDate(h.check_in_date)} - {formatDate(h.check_out_date)} | {h.room_count} Oda, {h.pax_count} Pax
                        </div>
                      </div>
                    </label>
                  );
                })}

                {(!(quoteToConfirm as any).hotels_data || (quoteToConfirm as any).hotels_data.length === 0) && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Otel verisi bulunamadı.
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Seçilen tüm oteller TEK BİR PROJE içerisinde birleştirilerek aktarılacaktır.
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={transferring}
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (!quoteToConfirm) return;

                  try {
                    setTransferring(true);

                    // 1. hotels_data içindeki is_confirmed alanlarını güncelle
                    const updatedHotelsData = ((quoteToConfirm as any).hotels_data || []).map((h: any) => ({
                      ...h,
                      is_confirmed: selectedHotels[h.id] || false
                    }));

                    // 2. Quote statüsünü KONFİRME yap ve hotels_data'yı kaydet
                    await quotesService.update(quoteToConfirm.id, {
                      status: 'KONFİRME',
                      locked: true,
                      hotels_data: updatedHotelsData,
                      confirmed_at: new Date().toISOString()
                    } as any);

                    // 3. Projeye aktarma işlemini tetikle (Sadece bu quote için)
                    // transferConfirmedToProjects tüm konfirme teklifleri taradığı için 
                    // yeni eklediğimiz is_confirmed mantığı bu quote için de çalışacaktır.

                    setShowConfirmModal(false);
                    await transferConfirmedToProjects(); // Bu işlem bittiğinde alert verir

                  } catch (err) {
                    console.error('Konfirme hatası:', err);
                    alert('Konfirme işlemi sırasında bir hata oluştu.');
                  } finally {
                    setTransferring(false);
                  }
                }}
                disabled={transferring || !Object.values(selectedHotels).some(v => v)}
                className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all flex items-center"
              >
                {transferring ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    İşleniyor...
                  </>
                ) : (
                  'Konfirme Et ve Aktar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}