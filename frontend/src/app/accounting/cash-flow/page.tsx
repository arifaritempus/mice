'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { projectCollectionPlansService, projectPaymentPlansService, projectsService, ticketPaymentPlansService, ticketOptionsService } from '@/lib/supabaseService';
import { 
  DollarSign, 
  Calendar as CalendarIcon, 
  Search, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  ArrowUpRight,
  TrendingUp,
  Filter,
  Download,
  LayoutGrid,
  List,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePermissions, Module } from '@/lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';

interface CollectionPlan {
  id: string;
  project_id: string;
  date: string;
  collection_type: string;
  description?: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  total_try: number;
  totalTRY?: number;
  created_at: string;
  updated_at: string;
  projects?: {
    id: string;
    title: string;
    company_name?: string;
    agency_id?: string;
    hotel_id?: string;
    start_date?: string;
    end_date?: string;
    reference?: string;
    agencies?: {
      id: string;
      name: string;
    };
    hotels?: {
      id: string;
      name: string;
    };
  };
}

interface PaymentPlan {
  id: string;
  project_id: string;
  date: string;
  payment_type: string;
  description?: string;
  hotel?: string;
  supplier_id?: string;
  hotel_id?: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  total_try: number;
  totalTRY?: number;
  created_at: string;
  updated_at: string;
  projects?: {
    id: string;
    title: string;
    company_name?: string;
    agency_id?: string;
    hotel_id?: string;
    start_date?: string;
    end_date?: string;
    reference?: string;
    agencies?: {
      id: string;
      name: string;
    };
    hotels?: {
      id: string;
      name: string;
    };
  };
}

interface CashFlowItem {
  id: string;
  project_id: string;
  project_title?: string;
  project_company?: string;
  project_reference?: string;
  project_start_date?: string;
  project_end_date?: string;
  agency_name?: string;
  hotel_name?: string;
  date: string;
  amount: number;
  currency: string;
  total_try: number;
  description?: string;
  type: 'collection' | 'payment'; // Tahsilat veya Ödeme
  collection_type?: string;
  payment_type?: string;
  hotel?: string;
}

interface CalendarPeriod {
  startDate: Date;
  endDate: Date;
  items: CashFlowItem[];
  totals: {
    TRY: { collection: number; payment: number };
    USD: { collection: number; payment: number };
    EUR: { collection: number; payment: number };
    GBP: { collection: number; payment: number };
  };
}

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface TicketPaymentPlan {
  id: string;
  ticket_id: string;
  installments: Array<{
    id: string;
    date: string;
    percentage: number;
    amount: number;
    currency: string;
  }>;
  total_amount: number;
  total_percentage: number;
  currency: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Ticket {
  id: string;
  voucher_no: string;
  agent: string;
  company_name?: string;
  supplier?: string;
  total_cost: number;
  currency: string;
  status: string;
  departure_date?: string;
  return_date?: string;
}

export default function CashFlowPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [collectionPlans, setCollectionPlans] = useState<CollectionPlan[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [ticketPaymentPlans, setTicketPaymentPlans] = useState<TicketPaymentPlan[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  // Arama ve Filtreleme State'leri
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // Modal state'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CashFlowItem | null>(null);
  
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<CalendarPeriod | null>(null);

  // Takvim State'leri
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  
  const { isDark } = useTheme();



  const dayKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const toCalendarYmd = (value: string | Date | null | undefined): string => {
    if (value == null) return '';
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : dayKey(value);
    const trimmed = String(value).trim();
    if (!trimmed) return '';
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? '' : dayKey(parsed);
  };

  const parseCalendarDate = (value?: string | null): Date | null => {
    const ymd = toCalendarYmd(value ?? '');
    if (!ymd) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  // ESC tuşu ile modal kapatma
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  // ViewMode değiştiğinde tarih aralığını hesaplama
  useEffect(() => {
    if (viewMode === 'custom') {
      // Özel modda dateStart ve dateEnd kullanıcı tarafından belirlenir
      return;
    }

    // Günlük görünümde currentDate'i kullan, diğerlerinde bugünü kullan
    const referenceDate = viewMode === 'daily' ? currentDate : new Date();
    let start: Date;
    let end: Date = new Date(referenceDate);

    switch (viewMode) {
      case 'daily': {
        start = new Date(referenceDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'weekly': {
        const dayOfWeek = referenceDate.getDay();
        const diff = referenceDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const tempDate = new Date(referenceDate);
        tempDate.setDate(diff);
        start = new Date(tempDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'monthly': {
        start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'yearly': {
        start = new Date(referenceDate.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(referenceDate.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      }
      default: {
        return;
      }
    }

    const toInputValue = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setDateStart(toInputValue(start));
    setDateEnd(toInputValue(end));
  }, [viewMode, currentDate]);

  // Veri yükleme - Supabase'den
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 1. Supabase'den tahsilat planlarını çek
        try {
          const collections = await projectCollectionPlansService.getAll();
          setCollectionPlans(Array.isArray(collections) ? collections : []);
        } catch (colError) {
          console.error('❌ Tahsilat planları yükleme hatası:', colError);
          setCollectionPlans([]);
        }

        // 2. Supabase'den ödeme planlarını çek
        try {
          const payments = await projectPaymentPlansService.getAll();
          setPaymentPlans(Array.isArray(payments) ? payments : []);
        } catch (payError) {
          console.error('❌ Ödeme planları yükleme hatası:', payError);
          setPaymentPlans([]);
        }

        // 3. Supabase'den ticket ödeme planlarını çek
        try {
          const ticketPlans = await ticketPaymentPlansService.getAll();
          const formattedTicketPlans = (Array.isArray(ticketPlans) ? ticketPlans : []).map((plan: any) => ({
            ...plan,
            installments: Array.isArray(plan.installments) ? plan.installments : []
          }));
          setTicketPaymentPlans(formattedTicketPlans);
        } catch (ticketPayError) {
          console.error('❌ Ticket ödeme planları yükleme hatası:', ticketPayError);
          setTicketPaymentPlans([]);
        }

        // 4. Supabase'den ticket'ları çek (bilet bilgileri için)
        try {
          const allTickets = await ticketOptionsService.getAll();
          const confirmedTickets = (Array.isArray(allTickets) ? allTickets : [])
            .filter((ticket: any) => ticket.status === 'confirmed')
            .map((ticket: any) => ({
              id: ticket.id,
              voucher_no: ticket.voucher_no || '',
              agent: ticket.agent || '',
              company_name: ticket.company_name || '',
              supplier: ticket.supplier || '',
              total_cost: Number(ticket.total_cost || 0),
              currency: ticket.currency || 'TRY',
              status: ticket.status || '',
              departure_date: toCalendarYmd(ticket.departure_date),
              return_date: toCalendarYmd(ticket.return_date)
            }));
          setTickets(confirmedTickets);
        } catch (ticketError) {
          console.error('❌ Ticket yükleme hatası:', ticketError);
          setTickets([]);
        }
        
      } catch (error) {
        console.error('❌ Genel veri yükleme hatası:', error);
        setCollectionPlans([]);
        setPaymentPlans([]);
        setTicketPaymentPlans([]);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // CashFlowItem listesi oluştur
  const cashFlowItems = useMemo(() => {
    const items: CashFlowItem[] = [];
    
    try {
      // Tahsilat planları
      if (Array.isArray(collectionPlans)) {
        collectionPlans.forEach(plan => {
          if (!plan || !plan.id) return;
          
          const project = plan.projects || null;
          items.push({
            id: plan.id,
            project_id: plan.project_id || '',
            project_title: project?.title || '',
            project_company: project?.company_name || '',
            project_reference: project?.reference || '',
            project_start_date: project?.start_date || '',
            project_end_date: project?.end_date || '',
            agency_name: project?.agencies?.name || '',
            hotel_name: project?.hotels?.name || '',
            date: toCalendarYmd(plan.date),
            amount: Number(plan.amount || 0),
            currency: plan.currency || 'TRY',
            total_try: Number(plan.total_try || plan.totalTRY || 0),
            description: plan.description || '',
            type: 'collection',
            collection_type: plan.collection_type || ''
          });
        });
      }
      
      // Ödeme planları
      if (Array.isArray(paymentPlans)) {
        paymentPlans.forEach(plan => {
          if (!plan || !plan.id) return;
          
          const project = plan.projects || null;
          // Otel/tedarikçi bilgisini önce plan.hotel'den, sonra project.hotels.name'den al
          const hotelValue = plan.hotel || project?.hotels?.name || '';
          
          items.push({
            id: plan.id,
            project_id: plan.project_id || '',
            project_title: project?.title || '',
            project_company: project?.company_name || '',
            project_reference: project?.reference || '',
            project_start_date: project?.start_date || '',
            project_end_date: project?.end_date || '',
            agency_name: project?.agencies?.name || '',
            hotel_name: project?.hotels?.name || '',
            date: toCalendarYmd(plan.date),
            amount: Number(plan.amount || 0),
            currency: plan.currency || 'TRY',
            total_try: Number(plan.total_try || plan.totalTRY || 0),
            description: plan.description || '',
            type: 'payment',
            payment_type: plan.payment_type || '',
            hotel: hotelValue // plan.hotel veya project.hotels.name
          });
        });
      }
      
      // Ticket ödeme planları (her installment ayrı bir ödeme olarak)
      if (Array.isArray(ticketPaymentPlans) && Array.isArray(tickets)) {
        ticketPaymentPlans.forEach(plan => {
          if (!plan || !plan.id || !plan.installments || plan.installments.length === 0) return;
          
          const ticket = tickets.find(t => t.id === plan.ticket_id);
          
          plan.installments.forEach((installment: any) => {
            if (!installment || !installment.date) return;
            
            // Ticket'tan supplier bilgisini al (otel/tedarikçi)
            const supplier = ticket?.supplier || '';
            
            items.push({
              id: `ticket-${plan.id}-${installment.id}`,
              project_id: plan.ticket_id || '',
              project_title: ticket?.voucher_no || '',
              project_company: ticket?.company_name || '',
              project_reference: ticket?.voucher_no || '',
              project_start_date: toCalendarYmd(ticket?.departure_date),
              project_end_date: toCalendarYmd(ticket?.return_date),
              agency_name: ticket?.agent || '',
              hotel_name: '',
              date: toCalendarYmd(installment.date),
              amount: Number(installment.amount || 0),
              currency: installment.currency || plan.currency || 'TRY',
              total_try: 0, // Ticket ödemelerinde total_try yok, hesaplanabilir ama şimdilik 0
              description: `Bilet Ödeme Planı - ${ticket?.voucher_no || ''}`,
              type: 'payment',
              payment_type: 'bilet',
              hotel: supplier // Ticket ödemelerinde supplier bilgisini hotel alanına koy
            });
          });
        });
      }
    } catch (error) {
      console.error('❌ CashFlowItem oluşturma hatası:', error);
    }
    
    return items;
  }, [collectionPlans, paymentPlans, ticketPaymentPlans, tickets]);

  // Filtrelenmiş items
  const filteredItems = useMemo(() => {
    let filtered = cashFlowItems;
    
    // Arama filtresi
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.project_title?.toLowerCase().includes(search) ||
        item.project_company?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.hotel?.toLowerCase().includes(search)
      );
    }
    
    // Tarih filtresi
    if (dateStart) {
      filtered = filtered.filter(item => {
        const itemDate = toCalendarYmd(item.date);
        return itemDate >= dateStart;
      });
    }
    
    if (dateEnd) {
      filtered = filtered.filter(item => {
        const itemDate = toCalendarYmd(item.date);
        return itemDate <= dateEnd;
      });
    }
    
    return filtered;
  }, [cashFlowItems, searchTerm, dateStart, dateEnd]);

  // Takvim görünümleri
  const generateDailyView = (date: Date): CalendarPeriod[] => {
    // Günlük görünümde tüm filteredItems'ı kullan (tarih filtresi zaten uygulanmış)
    // Sadece seçilen günün verilerini göster
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayItems = filteredItems.filter(item => {
      if (!item.date) return false;
      const itemDate = toCalendarYmd(item.date);
      return itemDate >= dayKey(dayStart) && itemDate <= dayKey(dayEnd);
    });
    
    const totals = calculateTotalsByCurrency(dayItems);
    
    return [{
      startDate: date,
      endDate: date,
      items: dayItems,
      totals
    }];
  };

  const generateWeeklyView = (date: Date): CalendarPeriod[] => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    
    const periods: CalendarPeriod[] = [];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      
      const dayItems = filteredItems.filter(item => {
        const itemDate = toCalendarYmd(item.date);
        return itemDate === dayKey(dayDate);
      });
      
      const totals = calculateTotalsByCurrency(dayItems);
      
      periods.push({
        startDate: dayDate,
        endDate: dayDate,
        items: dayItems,
        totals
      });
    }
    
    return periods;
  };

  const generateMonthlyView = (year: number, month: number): CalendarPeriod[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const periods: CalendarPeriod[] = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayItems = filteredItems.filter(item => {
        const itemDate = toCalendarYmd(item.date);
        return itemDate === dayKey(date);
      });
      
      const totals = calculateTotalsByCurrency(dayItems);
      
      periods.push({
        startDate: date,
        endDate: date,
        items: dayItems,
        totals
      });
    }
    
    return periods;
  };

  const generateYearlyView = (year: number): CalendarPeriod[] => {
    const periods: CalendarPeriod[] = [];
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      
      const monthItems = filteredItems.filter(item => {
        const itemDate = toCalendarYmd(item.date);
        return itemDate >= dayKey(monthStart) && itemDate <= dayKey(monthEnd);
      });
      
      const totals = calculateTotalsByCurrency(monthItems);
      
      periods.push({
        startDate: monthStart,
        endDate: monthEnd,
        items: monthItems,
        totals
      });
    }
    
    return periods;
  };

  // Döviz cinslerine göre toplam hesaplama
  const calculateTotalsByCurrency = (items: CashFlowItem[]) => {
    return items.reduce((acc, item) => {
      const currency = item.currency || 'TRY';
      const key = currency as keyof typeof acc;
      
      if (!acc[key]) {
        acc[key] = { collection: 0, payment: 0 };
      }
      
      if (item.type === 'collection') {
        acc[key].collection += item.amount || 0;
      } else {
        acc[key].payment += item.amount || 0;
      }
      
      return acc;
    }, { 
      TRY: { collection: 0, payment: 0 }, 
      USD: { collection: 0, payment: 0 }, 
      EUR: { collection: 0, payment: 0 },
      GBP: { collection: 0, payment: 0 }
    } as { TRY: { collection: number; payment: number }; USD: { collection: number; payment: number }; EUR: { collection: number; payment: number }; GBP: { collection: number; payment: number } });
  };

  // Takvim verisi
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    switch (viewMode) {
      case 'daily':
        return generateDailyView(currentDate);
      case 'weekly':
        return generateWeeklyView(currentDate);
      case 'monthly':
        return generateMonthlyView(year, month);
      case 'yearly':
        return generateYearlyView(year);
      case 'custom': {
        // Özel tarih görünümü
        if (!dateStart || !dateEnd) {
          return [];
        }
        
        const start = parseCalendarDate(dateStart);
        const end = parseCalendarDate(dateEnd);
        if (!start || !end) return [];
        
        // Tarih aralığını kontrol et (sonsuz döngüyü önlemek için maksimum 2 yıl)
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 730) {
          // Çok uzun aralık, sadece ilk 2 yılı göster
          end.setTime(start.getTime() + (730 * 24 * 60 * 60 * 1000));
        }
        
        // filteredItems'ı tarih bazında grupla (performans optimizasyonu)
        // Bu sayede her gün için filter işlemi yapmak yerine direkt Map'ten alıyoruz
        const itemsByDate = new Map<string, CashFlowItem[]>();
        filteredItems.forEach(item => {
          try {
            const itemDate = parseCalendarDate(item.date);
            if (itemDate) {
              const dateKey = dayKey(itemDate);
              if (!itemsByDate.has(dateKey)) {
                itemsByDate.set(dateKey, []);
              }
              itemsByDate.get(dateKey)!.push(item);
            }
          } catch (e) {
            // Geçersiz tarih, atla
            console.warn('Geçersiz tarih:', item.date);
          }
        });
        
        const periods: CalendarPeriod[] = [];
        const currentDateForLoop = new Date(start);
        let dayCount = 0;
        const maxDays = 730; // 2 yıl = 730 gün (sonsuz döngü koruması)
        
        while (currentDateForLoop <= end && dayCount < maxDays) {
          const dateKey = dayKey(currentDateForLoop);
          const dayItems = itemsByDate.get(dateKey) || [];
          
          const totals = calculateTotalsByCurrency(dayItems);
          
          periods.push({
            startDate: new Date(currentDateForLoop),
            endDate: new Date(currentDateForLoop),
            items: dayItems,
            totals
          });
          
          currentDateForLoop.setDate(currentDateForLoop.getDate() + 1);
          dayCount++;
        }
        
        return periods;
      }
      default:
        return generateMonthlyView(year, month);
    }
  }, [currentDate, viewMode, filteredItems, dateStart, dateEnd]);

  // Tüm dönem toplamları
  const allPeriodTotals = useMemo(() => {
    return calculateTotalsByCurrency(filteredItems);
  }, [filteredItems]);

  // Para formatı
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY'
    }).format(amount || 0);
  };

  // Tarih formatı
  const formatDate = (dateString: string) => {
    const parsed = parseCalendarDate(dateString);
    return parsed ? parsed.toLocaleDateString('tr-TR') : '-';
  };

  // Takvim navigasyonu
  const goToPreviousPeriod = () => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'daily':
          return new Date(prev.getTime() - 24 * 60 * 60 * 1000);
        case 'weekly':
          return new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'monthly':
          return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
        case 'yearly':
          return new Date(prev.getFullYear() - 1, 0, 1);
        default:
          return prev;
      }
    });
  };

  const goToNextPeriod = () => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'daily':
          return new Date(prev.getTime() + 24 * 60 * 60 * 1000);
        case 'weekly':
          return new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000);
        case 'monthly':
          return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
        case 'yearly':
          return new Date(prev.getFullYear() + 1, 0, 1);
        default:
          return prev;
      }
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Görünüm başlığı
  const getViewTitle = () => {
    switch (viewMode) {
      case 'daily':
        return currentDate.toLocaleDateString('tr-TR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
      case 'weekly':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'monthly':
        return currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      case 'yearly':
        return currentDate.getFullYear().toString();
      case 'custom':
        if (dateStart && dateEnd) {
          const start = parseCalendarDate(dateStart);
          const end = parseCalendarDate(dateEnd);
          if (!start || !end) return 'Özel Tarih Aralığı';
          return `${start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        return 'Özel Tarih Aralığı';
      default:
        return '';
    }
  };
  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.CASH_FLOW)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <a href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Nakit akışı verileri hazırlanıyor..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 w-full">
      {/* Premium Sticky Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 px-4 py-4 lg:px-8">
        <div className="max-w-[1600px] mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Nakit Akışı
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateStart('');
                  setDateEnd('');
                  setViewMode('monthly');
                }}
                className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent shadow-sm"
                title="Temizle"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 px-5 text-[10px] font-black"
              >
                <Download className="w-4 h-4" />
                DIŞA AKTAR
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Navigation Controls */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700">
              <button
                onClick={goToPreviousPeriod}
                className="p-2 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 min-w-[120px] text-center">
                <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight whitespace-nowrap">
                  {getViewTitle()}
                </span>
              </div>
              <button
                onClick={goToNextPeriod}
                className="p-2 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700">
              {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase ${viewMode === mode ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {mode === 'daily' ? 'GÜN' : mode === 'weekly' ? 'HAFTA' : mode === 'monthly' ? 'AY' : mode === 'yearly' ? 'YIL' : 'ÖZEL'}
                </button>
              ))}
            </div>

            {/* Special Date Filter - Dual Calendar */}
            {viewMode === 'custom' && (
              <div className="flex-1 max-w-xs">
                <DateRangeFieldAccounting
                  label="Tarih Aralığı"
                  startValue={dateStart}
                  endValue={dateEnd}
                  onStartChange={setDateStart}
                  onEndChange={setDateEnd}
                  hideLabel
                />
              </div>
            )}

            {/* Search Bar - Same Row */}
            <div className="relative group flex-1 min-w-[240px] max-w-sm">
              <input
                type="text"
                placeholder="Arama (Proje, Firma, Açıklama...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-6 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500/50 rounded-2xl text-[10px] focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all font-bold text-gray-900 dark:text-white"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5 group-focus-within:text-blue-500 transition-colors" />
            </div>

            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-[10px] font-black text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-all uppercase tracking-widest border border-blue-100 dark:border-blue-800/50 ml-auto"
            >
              BUGÜN
            </button>
          </div>
        </div>
      </header>


      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full px-4 lg:px-8 pt-6 pb-6 gap-6">
        
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TAHSİLATLAR</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{filteredItems.filter(i => i.type === 'collection').length}</p>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ÖDEMELER</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{filteredItems.filter(i => i.type === 'payment').length}</p>
              <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600">
                <TrendingUp className="w-5 h-5 rotate-180" />
              </div>
            </div>
          </div>
          <div className="md:col-span-2 hidden md:block" />
        </div>

        {/* Currency Perspective Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'TRY', key: 'TRY', color: 'blue' },
            { label: 'EUR', key: 'EUR', color: 'emerald' },
            { label: 'USD', key: 'USD', color: 'indigo' },
            { label: 'GBP', key: 'GBP', color: 'amber' }
          ].map((curr) => (
            <motion.div 
              key={curr.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg bg-${curr.color}-50 dark:bg-${curr.color}-900/30 text-${curr.color}-600 dark:text-${curr.color}-400 border border-${curr.color}-100 dark:border-${curr.color}-800`}>
                    {curr.label} TOPLAM
                  </span>
                  <div className={`p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-400 group-hover:text-${curr.color}-500 transition-colors`}>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400">TAHSİLAT</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(allPeriodTotals[curr.key as keyof typeof allPeriodTotals].collection, curr.key)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400">ÖDEME</span>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">{formatCurrency(allPeriodTotals[curr.key as keyof typeof allPeriodTotals].payment, curr.key)}</span>
                  </div>
                </div>
              </div>
              <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-${curr.color}-500/5 rounded-full blur-2xl group-hover:bg-${curr.color}-500/10 transition-all`} />
            </motion.div>
          ))}
        </div>

        {/* Dynamic Calendar Grid Area */}
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden flex flex-col relative mb-8">
          
          {/* Calendar Header/Days of Week */}
          <AnimatePresence mode="wait">
            {(viewMode === 'monthly' || viewMode === 'custom' || viewMode === 'weekly') && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700"
              >
                {['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR'].map((day) => (
                  <div key={day} className="py-4 text-center text-[10px] font-black text-gray-400 tracking-widest">
                    {day}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex-1 overflow-visible">
            <div className={`grid ${
              viewMode === 'daily' ? 'grid-cols-1' :
              viewMode === 'weekly' ? 'grid-cols-7' :
              viewMode === 'monthly' ? 'grid-cols-7' :
              viewMode === 'custom' ? 'grid-cols-7' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {calendarData.map((period, index) => {
                const isCurrentPeriod = viewMode === 'monthly' ? 
                  period.startDate.getMonth() === currentDate.getMonth() :
                  viewMode === 'yearly' ? 
                  period.startDate.getMonth() === new Date().getMonth() && period.startDate.getFullYear() === new Date().getFullYear() :
                  viewMode === 'custom' ? true :
                  period.startDate.toDateString() === new Date().toDateString();
                
                const isToday = period.startDate.toDateString() === new Date().toDateString();
                          
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`min-h-[160px] p-4 border-r border-b border-gray-100 dark:border-gray-700 group/cell transition-all duration-300 ${
                      isCurrentPeriod 
                        ? 'bg-white dark:bg-gray-800' 
                        : 'bg-gray-50/50 dark:bg-gray-900/50'
                    } ${
                      isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                    } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-black tracking-tighter ${
                          isToday ? 'text-blue-600 dark:text-blue-400' : 
                          isCurrentPeriod ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'
                        }`}>
                          {period.startDate.getDate()}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {period.startDate.toLocaleDateString('tr-TR', { month: 'short' })}
                        </span>
                      </div>
                      {isToday && (
                        <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-blue-500/40">
                          BUGÜN
                        </span>
                      )}
                    </div>
                    
                    {/* Totals Summary */}
                    {(period.totals.TRY.collection > 0 || period.totals.TRY.payment > 0) && (
                      <div 
                        className="flex flex-col gap-1 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setSelectedPeriod(period);
                          setIsPeriodModalOpen(true);
                        }}
                      >
                        {period.totals.TRY.collection > 0 && (
                          <div className="flex items-center text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                            <Plus className="w-3 h-3 mr-1" /> {formatCurrency(period.totals.TRY.collection, 'TRY')}
                          </div>
                        )}
                        {period.totals.TRY.payment > 0 && (
                          <div className="flex items-center text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-800/30">
                            <Plus className="w-3 h-3 mr-1 rotate-45" /> {formatCurrency(period.totals.TRY.payment, 'TRY')}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Item List */}
                    <div className="space-y-2">
                      {period.items.slice(0, 2).map((item: CashFlowItem) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.02, x: 2 }}
                          onClick={() => {
                            setSelectedItem(item);
                            setIsModalOpen(true);
                          }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all shadow-sm ${
                            item.type === 'collection'
                              ? 'bg-white dark:bg-gray-700 border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-500' 
                              : 'bg-white dark:bg-gray-700 border-rose-100 dark:border-rose-800/50 hover:border-rose-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[8px] font-black uppercase tracking-widest ${item.type === 'collection' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.type === 'collection' ? 'TAHSİLAT' : 'ÖDEME'}
                            </span>
                            <span className="text-[9px] font-black text-gray-900 dark:text-white">
                              {formatCurrency(item.amount, item.currency)}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 truncate group-hover/cell:whitespace-normal transition-all">
                            {item.project_reference || item.project_title}
                          </p>
                        </motion.div>
                      ))}
                      {period.items.length > 2 && (
                        <button 
                          onClick={() => {
                            setCurrentDate(period.startDate);
                            setViewMode('daily');
                          }}
                          className="w-full py-1 text-[9px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest text-center"
                        >
                          +{period.items.length - 2} DİĞER
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Modern Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl max-w-2xl w-full relative z-10 overflow-hidden border border-gray-200 dark:border-gray-800"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-3xl ${selectedItem.type === 'collection' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600'}`}>
                      {selectedItem.type === 'collection' ? <DollarSign className="w-8 h-8" /> : <TrendingUp className="w-8 h-8 rotate-180" />}
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                        {selectedItem.type === 'collection' ? 'Tahsilat İşlemi' : 'Ödeme İşlemi'}
                      </h2>
                      <p className="text-xs font-bold text-gray-500 mt-0.5">#{selectedItem.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">İşlem Tutarı</span>
                      <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
                        {formatCurrency(selectedItem.amount, selectedItem.currency)}
                      </h2>
                    </div>
                    {selectedItem.currency !== 'TRY' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">TL Karşılığı</span>
                        <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                          {formatCurrency(selectedItem.amount * (selectedItem.exchange_rate || 1), 'TRY')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-y-8 gap-x-12 py-8 border-y border-gray-100 dark:border-gray-800">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">İLGİLİ PROJE / REFERANS</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white leading-snug">{selectedItem.project_title || 'Genel İşlem'}</p>
                      <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{selectedItem.project_reference || 'REF YOK'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                          {formatDate(selectedItem.project_start_date)} - {formatDate(selectedItem.project_end_date)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {selectedItem.type === 'collection' ? 'MÜŞTERİ / ACENTE' : 'OTEL / TEDARİKÇİ'}
                      </p>
                      <p className="text-sm font-black text-gray-900 dark:text-white leading-snug">
                        {selectedItem.type === 'collection' 
                          ? (selectedItem.project_company || selectedItem.agency_name || 'Bireysel')
                          : (selectedItem.hotel || selectedItem.hotel_name || 'Tanımlanmamış')
                        }
                      </p>
                      {selectedItem.type === 'collection' && selectedItem.agency_name && selectedItem.agency_name !== selectedItem.project_company && (
                        <p className="text-[10px] font-bold text-gray-400">{selectedItem.agency_name}</p>
                      )}
                      {selectedItem.type === 'payment' && selectedItem.hotel_name && selectedItem.hotel_name !== selectedItem.hotel && (
                        <p className="text-[10px] font-bold text-gray-400">{selectedItem.hotel_name}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PLANLANAN TARİH</p>
                      <div className="flex items-center text-sm font-black text-gray-900 dark:text-white">
                        <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                        {formatDate(selectedItem.date)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">İŞLEM TÜRÜ / KUR</p>
                      <div className="flex flex-col gap-1.5">
                        <span className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          selectedItem.type === 'collection' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                          {selectedItem.collection_type || selectedItem.payment_type || 'KATEGORİSİZ'}
                        </span>
                        {selectedItem.exchange_rate > 1 && (
                          <span className="text-[10px] font-bold text-gray-400">Kur: 1 {selectedItem.currency} = {selectedItem.exchange_rate.toFixed(4)} TRY</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/50">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">AÇIKLAMA VE NOTLAR</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-bold leading-relaxed">
                        {selectedItem.description || 'Bu işlem için ek bir açıklama girilmemiş.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <div className="flex gap-2">
                      {selectedItem.project_id && (
                        <button className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all">
                          PROJEYE GİT
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-8 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl text-[10px] font-black shadow-xl hover:scale-105 transition-all active:scale-95"
                    >
                      KAPAT
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Daily Summary Modal */}
      <AnimatePresence>
        {isPeriodModalOpen && selectedPeriod && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPeriodModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl max-w-3xl w-full relative z-10 overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-3xl">
                      <CalendarIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">GÜNLÜK ÖZET</h2>
                      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        {formatDate(selectedPeriod.startDate)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPeriodModalOpen(false)}
                    className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-red-500 transition-all hover:bg-red-50"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">TOPLAM TAHSİLAT</p>
                    <p className="text-xl font-black text-emerald-600">{formatCurrency(selectedPeriod.totals.TRY.collection, 'TRY')}</p>
                  </div>
                  <div className="bg-rose-50/50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100/50 dark:border-rose-800/30">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">TOPLAM ÖDEME</p>
                    <p className="text-xl font-black text-rose-600">{formatCurrency(selectedPeriod.totals.TRY.payment, 'TRY')}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="space-y-4">
                  {selectedPeriod.items.length > 0 ? (
                    selectedPeriod.items.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item);
                          setIsModalOpen(true);
                        }}
                        className={`group p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${
                          item.type === 'collection' 
                            ? 'bg-white dark:bg-gray-800/50 border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-500' 
                            : 'bg-white dark:bg-gray-800/50 border-rose-100 dark:border-rose-800/50 hover:border-rose-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                              item.type === 'collection' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {item.collection_type || item.payment_type || 'İŞLEM'}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">#{item.id.slice(0, 8)}</span>
                          </div>
                          <span className={`text-sm font-black ${item.type === 'collection' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(item.amount, item.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[400px]">
                              {item.project_title || 'Genel İşlem'}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 truncate max-w-[400px]">
                              {item.type === 'collection' 
                                ? (item.project_company || item.agency_name || 'Bireysel')
                                : (item.hotel || item.hotel_name || 'Tedarikçi')
                              } • {item.description || 'Açıklama yok'}
                            </p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400 font-bold">Bu tarihte herhangi bir işlem bulunamadı.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  onClick={() => setIsPeriodModalOpen(false)}
                  className="px-8 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl text-[10px] font-black shadow-xl hover:scale-105 transition-all"
                >
                  KAPAT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  );
}

