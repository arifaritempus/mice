'use client';

import { useState, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useTheme } from '@/components/providers/ThemeProvider';
import { ticketOptionsService, ticketPaymentPlansService, ticketPaymentRecordsService } from '@/lib/supabaseService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePermissions, Module } from '@/lib/permissions';

interface ConfirmedTicket {
  id: string;
  voucher_no: string;
  agent: string;
  company_name?: string;
  supplier?: string;
  airline?: string;
  group_ref_no?: string;
  flight_type?: string;
  route?: string;
  passenger_count?: number;
  pp_cost?: number;
  status: string;
  departure_date?: string;
  return_date?: string;
  option_end_date?: string;
  option_end_time?: string;
  pnr?: string;
  entry_date?: string;
  total_cost: number;
  currency: string;
}

interface PaymentPlan {
  id: string;
  ticket_id: string;
  installments: Installment[];
  total_amount: number;
  total_percentage: number;
  currency: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Installment {
  id: string;
  date: string; // due_date yerine date
  percentage: number;
  amount: number;
  currency: string;
}

interface PaymentRecord {
  id: string;
  payment_plan_id: string;
  ticket_id: string;
  amount: number;
  currency?: string;
  payment_date: string;
  payment_method: 'credit_card' | 'bank_transfer' | 'cash' | 'online';
  notes?: string;
  recipient: string;
}

interface CalendarDay extends ConfirmedTicket {
  installment?: Installment;
  paymentPlan?: PaymentPlan;
  payment?: PaymentRecord;
  type: 'installment' | 'payment' | 'combined'; // Taksit, ödeme veya birleştirilmiş
}

interface CalendarPeriod {
  startDate: Date;
  endDate: Date;
  tickets: CalendarDay[];
  totals: {
    TRY: number;
    USD: number;
    EUR: number;
  };
  totalPassengers: number;
  uniqueTicketCount?: number; // Yeni eklenen alan
}

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

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

  return (
    <div className="min-w-0 relative" ref={containerRef}>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 truncate" title={label}>{label}</label>
      <div className="flex gap-1">
        <input
          value={startText}
          onChange={(e) => {
            const v = e.target.value;
            setStartText(v);
            const parsed = parseTypedDate(v);
            if (parsed !== null) onStartChange(parsed);
          }}
          onFocus={openCalendar}
          placeholder="gg.aa.yyyy"
          className="w-full h-7 px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-[11px]"
        />
        <input
          value={endText}
          onChange={(e) => {
            const v = e.target.value;
            setEndText(v);
            const parsed = parseTypedDate(v);
            if (parsed !== null) onEndChange(parsed);
          }}
          onFocus={openCalendar}
          placeholder="gg.aa.yyyy"
          className="w-full h-7 px-1.5 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-[11px]"
        />
      </div>
      {isCalendarOpen && typeof document !== 'undefined' && createPortal(
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

export default function TicketCalendarPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [confirmedTickets, setConfirmedTickets] = useState<ConfirmedTicket[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  
  // Arama ve Filtreleme State'leri
  const [companyTokens, setCompanyTokens] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [agencyTokens, setAgencyTokens] = useState<string[]>([]);
  const [agencyInput, setAgencyInput] = useState('');
  const [pnrTokens, setPnrTokens] = useState<string[]>([]);
  const [pnrInput, setPnrInput] = useState('');
  const [voucherTokens, setVoucherTokens] = useState<string[]>([]);
  const [voucherInput, setVoucherInput] = useState('');
  const [departureDateRange, setDepartureDateRange] = useState({ startDate: '', endDate: '' });
  const [paymentDateRange, setPaymentDateRange] = useState({ startDate: '', endDate: '' });
  
  // Modal state'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<CalendarDay | null>(null);
  
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

  const addToken = (
    raw: string,
    tokens: string[],
    setTokens: Dispatch<SetStateAction<string[]>>,
    setInput: Dispatch<SetStateAction<string>>
  ) => {
    const parts = raw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const lowerSet = new Set(tokens.map((t) => t.toLowerCase()));
    const next = [...tokens];
    for (const p of parts) {
      const k = p.toLowerCase();
      if (!lowerSet.has(k)) {
        next.push(p);
        lowerSet.add(k);
      }
    }
    setTokens(next);
    setInput('');
  };

  const removeLastToken = (setTokens: Dispatch<SetStateAction<string[]>>) => {
    setTokens((prev) => prev.slice(0, -1));
  };

  const companyTerms = useMemo(() => [...companyTokens, companyInput.trim()].filter(Boolean).map((v) => v.toLowerCase()), [companyTokens, companyInput]);
  const agencyTerms = useMemo(() => [...agencyTokens, agencyInput.trim()].filter(Boolean).map((v) => v.toLowerCase()), [agencyTokens, agencyInput]);
  const pnrTerms = useMemo(() => [...pnrTokens, pnrInput.trim()].filter(Boolean).map((v) => v.toLowerCase()), [pnrTokens, pnrInput]);
  const voucherTerms = useMemo(() => [...voucherTokens, voucherInput.trim()].filter(Boolean).map((v) => v.toLowerCase()), [voucherTokens, voucherInput]);

  // Veri yükleme - Supabase'den
  useEffect(() => {
    const loadData = async () => {
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;
      
      try {
        setLoading(true);
        
        // 1. Supabase'den confirmed biletleri çek
        const allTickets = await ticketOptionsService.getAll();
        const confirmed = allTickets
          .filter((ticket: any) => ticket.status === 'confirmed')
          .map((ticket: any) => ({
            ...ticket,
            departure_date: toCalendarYmd(ticket.departure_date),
            return_date: toCalendarYmd(ticket.return_date),
            option_end_date: toCalendarYmd(ticket.option_end_date),
            entry_date: toCalendarYmd(ticket.entry_date),
            departure_time: ticket.departure_time || '',
            return_time: ticket.return_time || '',
            option_end_time: ticket.option_end_time || '',
            pnr: ticket.pnr || '',
            group_ref_no: ticket.group_ref_no || '',
            route: ticket.route || ''
          }));
        setConfirmedTickets(confirmed);

        // 2. Supabase'den ödeme planlarını çek
        const plans = await ticketPaymentPlansService.getAll();
        const formattedPlans = plans.map((plan: any) => ({
          ...plan,
          installments: Array.isArray(plan.installments) ? plan.installments : [],
          created_at: plan.created_at || new Date().toISOString(),
          updated_at: plan.updated_at || new Date().toISOString()
        }));
        setPaymentPlans(formattedPlans);

        // 3. Supabase'den ödeme kayıtlarını çek
        const records = await ticketPaymentRecordsService.getAll();
        const formattedRecords = records.map((record: any) => ({
          ...record,
          payment_date: toCalendarYmd(record.payment_date),
          notes: record.notes || '',
          recipient: record.recipient || '',
          currency: record.currency || 'TRY'
        }));
        setPaymentRecords(formattedRecords);

      } catch (error) {
        console.error('Genel veri yükleme hatası:', error);
        hasLoadedRef.current = false; // Hata durumunda tekrar denemeye izin ver
      } finally {
        setLoading(false);
      }
    };
    
    if (!permissionsLoading) {
      if (canView(Module.TICKETS)) {
        loadData();
      } else {
        setLoading(false);
      }
    }
  }, [permissionsLoading, canView, toCalendarYmd]);


  // Döviz cinslerine göre toplam hesaplama
  const calculateTotalsByCurrency = (tickets: CalendarDay[]) => {
    return tickets.reduce((acc, ticket) => {
      const currency = ticket.currency || 'TRY';
      if (!acc[currency as keyof typeof acc]) {
        acc[currency as keyof typeof acc] = 0;
      }
      acc[currency as keyof typeof acc] += ticket.total_cost || 0;
      return acc;
    }, { TRY: 0, USD: 0, EUR: 0 } as { TRY: number; USD: number; EUR: number });
  };

  // Günlük görünüm
  const generateDailyView = (date: Date): CalendarPeriod[] => {
    const dayTickets: CalendarDay[] = [];
    
    filteredTickets.forEach(ticket => {
      // Biletin ödeme planını bul
      const ticketPaymentPlan = paymentPlans.find(plan => plan.ticket_id === ticket.id);
      
      if (ticketPaymentPlan && ticketPaymentPlan.installments) {
        // Her taksit için ayrı giriş oluştur
        ticketPaymentPlan.installments.forEach(installment => {
          if (installment.date) { // due_date yerine date kontrolü
            const installmentDate = toCalendarYmd(installment.date);
            if (installmentDate === dayKey(date)) {
              dayTickets.push({
                ...ticket,
                installment: installment,
                paymentPlan: ticketPaymentPlan,
                type: 'installment'
              });
            }
          }
        });
      }
      
      // Bu bilet için yapılan ödemeleri bul
      const ticketPayments = paymentRecords.filter(record => record.ticket_id === ticket.id);
      
      ticketPayments.forEach(payment => {
        if (payment.payment_date) {
          const paymentDate = toCalendarYmd(payment.payment_date);
          
          if (paymentDate === dayKey(date)) {
            dayTickets.push({
              ...ticket,
              payment: payment,
              type: 'payment' // Ödeme olduğunu belirt
            });
          }
        }
      });
    });
    
    const totals = calculateTotalsByCurrency(dayTickets);
    const totalPassengers = dayTickets.reduce((sum, ticket) => sum + (ticket.passenger_count || 0), 0);
    
    return [{
      startDate: date,
      endDate: date,
      tickets: dayTickets,
      totals,
      totalPassengers
    }];
  };

  // Haftalık görünüm
  const generateWeeklyView = (date: Date): CalendarPeriod[] => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const periods: CalendarPeriod[] = [];
    
    // Optimizasyon: Taksitleri tarihe göre Map'le
    const installmentsByDate = new Map<string, CalendarDay[]>();
    filteredTickets.forEach(ticket => {
      const ticketPaymentPlan = paymentPlans.find(plan => plan.ticket_id === ticket.id);
      if (ticketPaymentPlan?.installments) {
        ticketPaymentPlan.installments.forEach(installment => {
          if (installment.date) {
            const dateStr = toCalendarYmd(installment.date);
            if (!installmentsByDate.has(dateStr)) installmentsByDate.set(dateStr, []);
            installmentsByDate.get(dateStr)!.push({
              ...ticket,
              installment,
              paymentPlan: ticketPaymentPlan,
              type: 'installment'
            });
          }
        });
      }
    });

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dateStr = dayKey(dayDate);
      
      const dayTickets = installmentsByDate.get(dateStr) || [];
      const totals = calculateTotalsByCurrency(dayTickets);
      const totalPassengers = dayTickets.reduce((sum, ticket) => sum + (ticket.passenger_count || 0), 0);
      
      periods.push({
        startDate: dayDate,
        endDate: dayDate,
        tickets: dayTickets,
        totals,
        totalPassengers
      });
    }
    
    return periods;
  };

  // Aylık görünüm
  const generateMonthlyView = (year: number, month: number): CalendarPeriod[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const periods: CalendarPeriod[] = [];
    
    // Optimizasyon: Taksitleri ve Ödemeleri tarihe göre Map'le
    const itemsByDate = new Map<string, CalendarDay[]>();
    
    filteredTickets.forEach(ticket => {
      // 1. Taksitleri ekle
      const ticketPaymentPlan = paymentPlans.find(plan => plan.ticket_id === ticket.id);
      if (ticketPaymentPlan?.installments) {
        ticketPaymentPlan.installments.forEach(installment => {
          if (installment.date) {
            const dateStr = toCalendarYmd(installment.date);
            if (!itemsByDate.has(dateStr)) itemsByDate.set(dateStr, []);
            itemsByDate.get(dateStr)!.push({
              ...ticket,
              installment,
              paymentPlan: ticketPaymentPlan,
              type: 'installment'
            });
          }
        });
      }

      // 2. Ödemeleri ekle
      const ticketPayments = paymentRecords.filter(record => record.ticket_id === ticket.id);
      ticketPayments.forEach(payment => {
        if (payment.payment_date) {
          const dateStr = toCalendarYmd(payment.payment_date);
          if (!itemsByDate.has(dateStr)) itemsByDate.set(dateStr, []);
          itemsByDate.get(dateStr)!.push({
            ...ticket,
            payment,
            type: 'payment'
          });
        }
      });
    });

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = dayKey(date);
      
      const dayTickets = itemsByDate.get(dateStr) || [];
      const totals = calculateTotalsByCurrency(dayTickets);
      const totalPassengers = dayTickets.reduce((sum, ticket) => sum + (ticket.passenger_count || 0), 0);
      
      periods.push({
        startDate: date,
        endDate: date,
        tickets: dayTickets,
        totals,
        totalPassengers
      });
    }
    
    return periods;
  };

  // Yıllık görünüm
  const generateYearlyView = (year: number): CalendarPeriod[] => {
    const periods: CalendarPeriod[] = [];
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      
      const monthTickets: CalendarDay[] = [];
      const processedTicketsForTotal = new Set(); // Toplam hesaplama için hangi biletler işlendi
      
      filteredTickets.forEach(ticket => {
        // Biletin ödeme planını bul
        const ticketPaymentPlan = paymentPlans.find(plan => plan.ticket_id === ticket.id);
        
        // Bu ay içindeki taksitleri bul
        const monthInstallments = ticketPaymentPlan ? ticketPaymentPlan.installments.filter(installment => {
          if (installment.date) {
            const installmentDate = toCalendarYmd(installment.date);
            return installmentDate >= dayKey(monthStart) && installmentDate <= dayKey(monthEnd);
          }
          return false;
        }) : [];
        
        // Bu bilet için yapılan ödemeleri bul
        const ticketPayments = paymentRecords.filter(record => record.ticket_id === ticket.id);
        const monthPayments = ticketPayments.filter(payment => {
          if (payment.payment_date) {
            const paymentDate = toCalendarYmd(payment.payment_date);
            return paymentDate >= dayKey(monthStart) && paymentDate <= dayKey(monthEnd);
          }
          return false;
        });
        
        // Eğer bu ay içinde taksit varsa, taksit kartı ekle
        if (monthInstallments.length > 0) {
          monthInstallments.forEach(installment => {
            monthTickets.push({
              ...ticket,
              type: 'installment',
              installment: installment,
              paymentPlan: ticketPaymentPlan
            });
          });
        }
        
        // Eğer bu ay içinde ödeme varsa, ödeme kartı ekle
        if (monthPayments.length > 0) {
          monthPayments.forEach(payment => {
            monthTickets.push({
              ...ticket,
              type: 'payment',
              payment: payment
            });
          });
        }
        
        // Toplam hesaplama için bilet işlendi olarak işaretle (sadece bir kez)
        if ((monthInstallments.length > 0 || monthPayments.length > 0) && !processedTicketsForTotal.has(ticket.id)) {
          processedTicketsForTotal.add(ticket.id);
        }
      });
      
      // Toplam hesaplama için sadece işlenen biletleri kullan
      const ticketsForTotal = filteredTickets.filter(ticket => processedTicketsForTotal.has(ticket.id));
      // ticketsForTotal'ı CalendarDay[] tipine dönüştür
      const ticketsForTotalWithType: CalendarDay[] = ticketsForTotal.map(ticket => ({
        ...ticket,
        type: 'combined' // Varsayılan tip
      }));
      const totals = calculateTotalsByCurrency(ticketsForTotalWithType);
      const totalPassengers = ticketsForTotal.reduce((sum, ticket) => sum + (ticket.passenger_count || 0), 0);
      
      // Benzersiz bilet sayısını hesapla (taksit/ödeme sayısı değil)
      const uniqueTicketCount = ticketsForTotal.length;
      
      periods.push({
        startDate: monthStart,
        endDate: monthEnd,
        tickets: monthTickets,
        totals,
        totalPassengers,
        uniqueTicketCount // Benzersiz bilet sayısını ekle
      });
    }
    
    return periods;
  };

  // Filtrelenmiş biletler
  const filteredTickets = useMemo(() => {
    if (confirmedTickets.length === 0) {
      return [];
    }
    
    const filtered = confirmedTickets.filter(ticket => {
      // Metin filtreleri
      if (companyTerms.length) {
        const target = (ticket.company_name || '').toLowerCase();
        if (!companyTerms.some((term) => target.includes(term))) return false;
      }
      if (agencyTerms.length) {
        const target = (ticket.agent || '').toLowerCase();
        if (!agencyTerms.some((term) => target.includes(term))) return false;
      }
      if (pnrTerms.length) {
        const target = (ticket.pnr || '').toLowerCase();
        if (!pnrTerms.some((term) => target.includes(term))) return false;
      }
      if (voucherTerms.length) {
        const voucher = (ticket.voucher_no || '').toLowerCase();
        const reference = (ticket.group_ref_no || '').toLowerCase();
        if (!voucherTerms.some((term) => voucher.includes(term) || reference.includes(term))) return false;
      }
      
      // Gidiş tarihi filtreleme (YMD karşılaştırma)
      let matchesDepartureStart = true;
      let matchesDepartureEnd = true;
      const depYmd = toCalendarYmd(ticket.departure_date);
      const retYmd = toCalendarYmd(ticket.return_date);
      if (departureDateRange.startDate && depYmd) {
        matchesDepartureStart = depYmd >= departureDateRange.startDate;
      }
      if (departureDateRange.endDate) {
        if (retYmd) matchesDepartureEnd = retYmd <= departureDateRange.endDate;
        else if (depYmd) matchesDepartureEnd = depYmd <= departureDateRange.endDate;
      }
      
      if (!matchesDepartureStart || !matchesDepartureEnd) {
        return false;
      }
      
      // Ödeme tarihi filtreleme (taksit tarihlerine göre)
      let matchesPaymentStart = true;
      let matchesPaymentEnd = true;
      
      // Eğer ödeme tarihi filtresi girilmemişse, tüm biletleri göster
      if (paymentDateRange.startDate || paymentDateRange.endDate) {
        // Bu bilet için ödeme planını bul
        const ticketPaymentPlan = paymentPlans.find(plan => plan.ticket_id === ticket.id);
        
        if (ticketPaymentPlan && ticketPaymentPlan.installments) {
          // Taksit tarihlerini kontrol et
          const hasMatchingInstallment = ticketPaymentPlan.installments.some(installment => {
            if (!installment.date) return false; // due_date yerine date kontrolü
            
            const installmentDate = toCalendarYmd(installment.date);
            let matchesStart = true;
            let matchesEnd = true;
            
            if (paymentDateRange.startDate) {
              matchesStart = installmentDate >= paymentDateRange.startDate;
            }
            if (paymentDateRange.endDate) {
              matchesEnd = installmentDate <= paymentDateRange.endDate;
            }
            
            return matchesStart && matchesEnd;
          });
          
          if (!hasMatchingInstallment) {
            console.log('Bilet taksit tarihi filtresinde elendi:', ticket.voucher_no, 'Taksit tarihleri:', ticketPaymentPlan.installments.map(i => i.date));
            return false;
          }
        } else {
          // Eğer ödeme planı yoksa, bilet entry_date'ini kontrol et
          const entryYmd = toCalendarYmd(ticket.entry_date);
          if (paymentDateRange.startDate && entryYmd) {
            matchesPaymentStart = entryYmd >= paymentDateRange.startDate;
          }
          
          if (paymentDateRange.endDate && entryYmd) {
            matchesPaymentEnd = entryYmd <= paymentDateRange.endDate;
          }
          
          if (!matchesPaymentStart || !matchesPaymentEnd) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    return filtered;
  }, [confirmedTickets, companyTerms, agencyTerms, pnrTerms, voucherTerms, departureDateRange.startDate, departureDateRange.endDate, paymentDateRange.startDate, paymentDateRange.endDate, paymentPlans]);

  // Takvim verileri
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
      default:
        return generateMonthlyView(year, month);
    }
  }, [currentDate, viewMode, filteredTickets]);

  // Ödeme durumu hesaplama
  const getTicketPaymentStatus = (ticketId: string) => {
    const ticketPlan = paymentPlans.find(plan => plan.ticket_id === ticketId);
    if (!ticketPlan) return 'pending';
    
    const ticketPayments = paymentRecords.filter(record => record.ticket_id === ticketId);
    const totalPaid = ticketPayments.reduce((sum, record) => sum + (record.amount || 0), 0);
    const totalAmount = ticketPlan.total_amount;
    
    if (totalPaid >= totalAmount) return 'completed';
    if (totalPaid > 0) return 'partial';
    return 'pending';
  };

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
      default:
        return '';
    }
  };

  // Tüm taksitler
  const allInstallments = useMemo(() => {
    const filteredTicketIds = new Set(filteredTickets.map(t => t.id));
    return paymentPlans
      .filter(plan => filteredTicketIds.has(plan.ticket_id))
      .flatMap(plan => plan.installments || []);
  }, [paymentPlans, filteredTickets]);

  // Tarih aralığı hesaplama fonksiyonu
  const getDateRange = (viewMode: ViewMode, currentDate: Date) => {
    let startDate: Date;
    let endDate: Date;
    
    switch (viewMode) {
      case 'daily':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
        break;
      case 'weekly':
        // Pazartesi başlangıçlı hafta hesaplama
        const startOfWeek = new Date(currentDate);
        const dayOfWeek = currentDate.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Pazar ise -6, diğerleri için 1-dayOfWeek
        startOfWeek.setDate(currentDate.getDate() + daysToMonday);
        startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        endDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7);
        break;
      case 'monthly':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        break;
      case 'yearly':
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        endDate = new Date(currentDate.getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    return { startDate, endDate };
  };

  // viewMode'a göre filtrelenmiş biletleri hesapla
  const getFilteredTicketsByViewMode = useMemo(() => {
    const { startDate, endDate } = getDateRange(viewMode, currentDate);
    
    console.log(`Bilet filtreleme (${viewMode}):`, {
      startDate: dayKey(startDate),
      endDate: dayKey(endDate),
      currentDate: dayKey(currentDate),
      dayOfWeek: currentDate.getDay(),
      daysToMonday: viewMode === 'weekly' ? (currentDate.getDay() === 0 ? -6 : 1 - currentDate.getDay()) : 'N/A'
    });
    
    return filteredTickets.filter(ticket => {
      if (!ticket.entry_date) return false;
      const ticketDate = toCalendarYmd(ticket.entry_date);
      return ticketDate >= dayKey(startDate) && ticketDate < dayKey(endDate);
    });
  }, [filteredTickets, viewMode, currentDate]);

  // Taksit toplamları - viewMode'a göre filtrelenmiş
  const installmentTotals = useMemo(() => {
    const { startDate, endDate } = getDateRange(viewMode, currentDate);
    
    // Taksitleri filtrele
    const filteredInstallments = allInstallments.filter(installment => {
      const installmentDate = toCalendarYmd(installment.date);
      return installmentDate >= dayKey(startDate) && installmentDate < dayKey(endDate);
    });
    
    // Döviz cinslerine göre toplam hesapla
    return filteredInstallments.reduce((acc, installment) => {
      const currency = installment.currency || 'TRY';
      if (!acc[currency as keyof typeof acc]) {
        acc[currency as keyof typeof acc] = 0;
      }
      acc[currency as keyof typeof acc] += installment.amount || 0;
      return acc;
    }, { TRY: 0, USD: 0, EUR: 0, GBP: 0 } as { TRY: number; USD: number; EUR: number; GBP: number });
  }, [allInstallments, viewMode, currentDate]);

  // Ödeme toplamları - viewMode'a göre filtrelenmiş
  const paymentTotals = useMemo(() => {
    const { startDate, endDate } = getDateRange(viewMode, currentDate);
    const filteredTicketIds = new Set(filteredTickets.map(t => t.id));
    
    // Ödemeleri filtrele (Hem tarih hem de bilet filtresi)
    const filteredPayments = paymentRecords.filter(payment => {
      if (!filteredTicketIds.has(payment.ticket_id)) return false;
      const paymentDate = toCalendarYmd(payment.payment_date);
      return paymentDate >= dayKey(startDate) && paymentDate < dayKey(endDate);
    });
    
    // Döviz cinslerine göre toplam hesapla
    const totals = filteredPayments.reduce((acc, payment) => {
      let currency = payment.currency;
      
      if (!currency) {
        const relatedTicket = filteredTickets.find(ticket => ticket.id === payment.ticket_id);
        currency = relatedTicket?.currency || 'TRY';
      }
      
      if (!acc[currency as keyof typeof acc]) {
        acc[currency as keyof typeof acc] = 0;
      }
      acc[currency as keyof typeof acc] += payment.amount || 0;
      return acc;
    }, { TRY: 0, USD: 0, EUR: 0, GBP: 0 } as { TRY: number; USD: number; EUR: number; GBP: number });
    
    return totals;
  }, [paymentRecords, viewMode, currentDate, filteredTickets]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yetkiler kontrol ediliyor..." />;
  }

  if (!canView(Module.TICKETS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <a href="/tickets" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Biletlere Dön
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Bilet takvimi yükleniyor..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-3 mx-4 sm:mx-6 lg:mx-8">
            <div className="flex items-center justify-between">
              <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              🎫 Bilet Takvim Takip
                </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Biletlerinizi takvim görünümünde takip edin
                </p>
              </div>
              <div className="text-right">
            <div className="text-xs font-medium text-gray-900 dark:text-white">
              Toplam Bilet: <span className="text-blue-600 dark:text-blue-400">{filteredTickets.length}</span> / {confirmedTickets.length}
                </div>
            <div className="text-xs font-medium text-gray-900 dark:text-white">
              Toplam Taksit: <span className="text-green-600 dark:text-green-400">{allInstallments.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Arama ve Filtreleme */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-3 mx-4 sm:mx-6 lg:mx-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">
            🔍 Arama ve Filtreleme
          </h2>
          <button
            onClick={() => {
              setCompanyTokens([]);
              setCompanyInput('');
              setAgencyTokens([]);
              setAgencyInput('');
              setPnrTokens([]);
              setPnrInput('');
              setVoucherTokens([]);
              setVoucherInput('');
              setDepartureDateRange({ startDate: '', endDate: '' });
              setPaymentDateRange({ startDate: '', endDate: '' });
            }}
            className="bg-red-600 text-white px-2 py-1.5 rounded hover:bg-red-700 transition-colors text-xs flex items-center gap-1"
          >
            🗑️ Filtreleri Temizle
          </button>
        </div>
        
        <div
          className="grid w-full min-w-0 items-end gap-2"
          style={{ gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1.3fr) minmax(0,1fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.85fr)' }}
        >
          <DateRangeField
            label="Gidiş Dönüş Tarihi"
            startValue={departureDateRange.startDate}
            endValue={departureDateRange.endDate}
            onStartChange={(value) => setDepartureDateRange(prev => ({ ...prev, startDate: value }))}
            onEndChange={(value) => setDepartureDateRange(prev => ({ ...prev, endDate: value }))}
          />
          <DateRangeField
            label="Ödeme Başlangıç Bitiş Tarihi"
            startValue={paymentDateRange.startDate}
            endValue={paymentDateRange.endDate}
            onStartChange={(value) => setPaymentDateRange(prev => ({ ...prev, startDate: value }))}
            onEndChange={(value) => setPaymentDateRange(prev => ({ ...prev, endDate: value }))}
          />
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Voucher No</label>
            <div className="w-full h-7 px-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto">
              {voucherTokens.length > 0 && (
                <button
                  type="button"
                  className="shrink-0 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-[10px]"
                  onClick={() => removeLastToken(setVoucherTokens)}
                  title={voucherTokens.join(', ')}
                >
                  <span>+{voucherTokens.length}</span><span>x</span>
                </button>
              )}
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToken(voucherInput, voucherTokens, setVoucherTokens, setVoucherInput);
                  }
                  if (e.key === 'Backspace' && voucherInput.length === 0 && voucherTokens.length > 0) {
                    removeLastToken(setVoucherTokens);
                  }
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-gray-900 dark:text-white text-[11px]"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Firma Adı</label>
            <div className="w-full h-7 px-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto">
              {companyTokens.length > 0 && (
                <button
                  type="button"
                  className="shrink-0 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-[10px]"
                  onClick={() => removeLastToken(setCompanyTokens)}
                  title={companyTokens.join(', ')}
                >
                  <span>+{companyTokens.length}</span><span>x</span>
                </button>
              )}
              <input
                type="text"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToken(companyInput, companyTokens, setCompanyTokens, setCompanyInput);
                  }
                  if (e.key === 'Backspace' && companyInput.length === 0 && companyTokens.length > 0) {
                    removeLastToken(setCompanyTokens);
                  }
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-gray-900 dark:text-white text-[11px]"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Acente Adı</label>
            <div className="w-full h-7 px-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto">
              {agencyTokens.length > 0 && (
                <button
                  type="button"
                  className="shrink-0 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-[10px]"
                  onClick={() => removeLastToken(setAgencyTokens)}
                  title={agencyTokens.join(', ')}
                >
                  <span>+{agencyTokens.length}</span><span>x</span>
                </button>
              )}
              <input
                type="text"
                value={agencyInput}
                onChange={(e) => setAgencyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToken(agencyInput, agencyTokens, setAgencyTokens, setAgencyInput);
                  }
                  if (e.key === 'Backspace' && agencyInput.length === 0 && agencyTokens.length > 0) {
                    removeLastToken(setAgencyTokens);
                  }
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-gray-900 dark:text-white text-[11px]"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">PNR</label>
            <div className="w-full h-7 px-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto">
              {pnrTokens.length > 0 && (
                <button
                  type="button"
                  className="shrink-0 inline-flex items-center gap-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-[10px]"
                  onClick={() => removeLastToken(setPnrTokens)}
                  title={pnrTokens.join(', ')}
                >
                  <span>+{pnrTokens.length}</span><span>x</span>
                </button>
              )}
              <input
                type="text"
                value={pnrInput}
                onChange={(e) => setPnrInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToken(pnrInput, pnrTokens, setPnrTokens, setPnrInput);
                  }
                  if (e.key === 'Backspace' && pnrInput.length === 0 && pnrTokens.length > 0) {
                    removeLastToken(setPnrTokens);
                  }
                }}
                placeholder="Yaz, Enter ile ekle"
                className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-gray-900 dark:text-white text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Takvim Kontrolleri */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 mx-4 sm:mx-6 lg:mx-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousPeriod}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ⬅️
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getViewTitle()}
            </h2>
            
            <button
              onClick={goToNextPeriod}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ➡️
            </button>
                      </div>
          
                    <div className="flex items-center gap-3">
            {/* Görünüm Seçici Buton Grubu */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'daily'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                📅 Günlük
              </button>
              
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'weekly'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                📊 Haftalık
              </button>
              
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'monthly'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                🗓️ Aylık
              </button>
              
              <button
                onClick={() => setViewMode('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'yearly'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                📈 Yıllık
              </button>
                      </div>
                    </div>
                  </div>
                </div>

      {/* Döviz Cinslerine Göre Toplamlar */}
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:mx-8 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* TRY */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">TRY Toplam</div>
            <div className="space-y-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Taksit: <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(installmentTotals.TRY, 'TRY')}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ödeme: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(paymentTotals.TRY, 'TRY')}</span>
              </div>
                      </div>
                          </div>
          
          {/* EUR */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">EUR Toplam</div>
            <div className="space-y-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Taksit: <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(installmentTotals.EUR, 'EUR')}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ödeme: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(paymentTotals.EUR, 'EUR')}</span>
              </div>
                      </div>
                    </div>
                    
          {/* USD */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">USD Toplam</div>
            <div className="space-y-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Taksit: <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(installmentTotals.USD, 'USD')}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ödeme: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(paymentTotals.USD, 'USD')}</span>
              </div>
                      </div>
                      </div>
          
          {/* GBP */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">GBP Toplam</div>
            <div className="space-y-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Taksit: <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(installmentTotals.GBP || 0, 'GBP')}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ödeme: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(paymentTotals.GBP || 0, 'GBP')}</span>
              </div>
                      </div>
                    </div>
                  </div>
                </div>

      {/* Takvim */}
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Görünüm moduna göre başlıklar */}
          {viewMode === 'monthly' && (
            <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
              {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                  {day}
                    </div>
              ))}
            </div>
          )}
          
          {/* Takvim içeriği */}
          <div className={`grid ${
            viewMode === 'daily' ? 'grid-cols-1' :
            viewMode === 'weekly' ? 'grid-cols-7' :
            viewMode === 'monthly' ? 'grid-cols-7' :
            'grid-cols-3 md:grid-cols-4'
          }`}>
            {calendarData.map((period, index) => {
              const isCurrentPeriod = viewMode === 'monthly' ? 
                period.startDate.getMonth() === currentDate.getMonth() :
                viewMode === 'yearly' ? 
                period.startDate.getMonth() === new Date().getMonth() && period.startDate.getFullYear() === new Date().getFullYear() :
                period.startDate.toDateString() === new Date().toDateString();
              
              const isToday = period.startDate.toDateString() === new Date().toDateString();
                        
                        return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-600 last:border-r-0 ${
                    isCurrentPeriod 
                      ? 'bg-white dark:bg-gray-800' 
                      : 'bg-gray-50 dark:bg-gray-700'
                  } ${
                    isToday ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {/* Dönem başlığı */}
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentPeriod 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {viewMode === 'daily' ? period.startDate.getDate() :
                     viewMode === 'weekly' ? period.startDate.getDate() :
                     viewMode === 'monthly' ? period.startDate.getDate() :
                     period.startDate.toLocaleDateString('tr-TR', { month: 'short' })}
                            </div>
                  
                  {/* Bilet bilgileri */}
                  {period.tickets.length > 0 && (
                    <div className="space-y-1">
                      {/* Toplam bilgiler */}
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        🎫 {period.uniqueTicketCount || period.tickets.length} Bilet
                          </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        👥 {period.totalPassengers} Pax
                    </div>
                      
                      {/* Döviz cinslerine göre toplamlar */}
                      {period.totals.TRY > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          💰 TRY: {formatCurrency(period.totals.TRY, 'TRY')}
                  </div>
                )}
                      {period.totals.USD > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          💰 USD: {formatCurrency(period.totals.USD, 'USD')}
                    </div>
                      )}
                      {period.totals.EUR > 0 && (
                        <div className="text-xs text-purple-600 dark:text-purple-400">
                          💰 EUR: {formatCurrency(period.totals.EUR, 'EUR')}
                            </div>
                      )}
                      
                      {/* Mini bilet kartları */}
                      <div className="space-y-1 mt-2">
                        {period.tickets.map((ticket: CalendarDay) => {
                          const paymentStatus = getTicketPaymentStatus(ticket.id);
                          const statusIcon = paymentStatus === 'completed' ? '✅' : 
                                           paymentStatus === 'partial' ? '⏳' : '❌';
                          
                          // Bu bilet için ödeme planını bul
                          const ticketPaymentPlan = ticket.paymentPlan || paymentPlans.find(plan => plan.ticket_id === ticket.id);
                          const ticketPayments = paymentRecords.filter(record => record.ticket_id === ticket.id);
                          
                          // Kart rengini belirle
                          const isInstallment = ticket.type === 'installment';
                          const isPayment = ticket.type === 'payment';
                          const isCombined = ticket.type === 'combined';
                          
                          const cardClass = isInstallment 
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                            : isPayment
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                            : isCombined
                            ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                            : "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900/40";
                          
                          const typeIcon = isInstallment ? "📅" : isPayment ? "💳" : isCombined ? "📅💳" : "🎫";
                          const typeText = isInstallment ? "Taksit" : isPayment ? "Ödeme" : isCombined ? "Birleştirilmiş" : "Bilet";
                          
                          return (
                            <div
                              key={`${ticket.id}-${ticket.type}-${ticket.installment?.id || ticket.payment?.id}`}
                              className={`p-2 rounded text-xs cursor-pointer transition-all hover:scale-105 ${
                                isInstallment 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' 
                                  : isPayment 
                                  ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
                                  : isCombined
                                  ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700'
                                  : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                              }`}
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setIsModalOpen(true);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{ticket.voucher_no} {statusIcon}</span>
                                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                  {typeIcon} {typeText}
                              </span>
                            </div>
                              
                              {/* Taksit detayı */}
                              {ticket.installment && (
                                <div className="text-xs text-gray-800 dark:text-gray-200 mt-1 font-medium">
                                  💰 {formatCurrency(ticket.installment.amount, ticket.installment.currency)}
                                  <br />
                                  📅 {formatDate(ticket.installment.date)}
                          </div>
                              )}
                              
                              {/* Ödeme detayı */}
                              {ticket.payment && (
                                <div className="text-xs text-gray-800 dark:text-gray-200 mt-1 font-medium">
                                  💰 {formatCurrency(ticket.payment.amount, ticket.currency)}
                                  <br />
                                  📅 {formatDate(ticket.payment.payment_date)}
                  </div>
                )}

                              {/* Ödeme durumu */}
                              {ticketPaymentPlan && (
                                <div className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">
                                  💳 {ticketPayments.length} Ödeme
                    </div>
                              )}
                    </div>
                          );
                        })}
                        
                        {/* "+X daha" yazısı kaldırıldı */}
                  </div>
                </div>
                  )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Özet Bilgiler */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Bilet</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{confirmedTickets.length}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Taksit</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{allInstallments.length}</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Tamamlanan Ödemeler</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {confirmedTickets.filter(ticket => getTicketPaymentStatus(ticket.id) === 'completed').length}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Bekleyen Ödemeler</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {confirmedTickets.filter(ticket => getTicketPaymentStatus(ticket.id) === 'pending').length}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bilet Detay Modal'ı */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  🎫 Bilet Detayları
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedTicket.voucher_no} - {selectedTicket.agent}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              {/* Bilet Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">✈️ Bilet Bilgileri</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Voucher No:</span> {selectedTicket.voucher_no}</div>
                    <div><span className="font-medium">Acenta:</span> {selectedTicket.agent}</div>
                    <div><span className="font-medium">Şirket:</span> {selectedTicket.company_name || '-'}</div>
                    <div><span className="font-medium">Tedarikçi:</span> {selectedTicket.supplier || '-'}</div>
                    <div><span className="font-medium">Havayolu:</span> {selectedTicket.airline || '-'}</div>
                    <div><span className="font-medium">Gidiş:</span> {selectedTicket.departure_date ? formatDate(selectedTicket.departure_date) : '-'}</div>
                    <div><span className="font-medium">Dönüş:</span> {selectedTicket.return_date ? formatDate(selectedTicket.return_date) : '-'}</div>
                    <div><span className="font-medium">Yolcu:</span> {selectedTicket.passenger_count || 0}</div>
                    <div><span className="font-medium">Tutar:</span> {formatCurrency(selectedTicket.total_cost, selectedTicket.currency)}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">💰 Ödeme Bilgileri</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Toplam Tutar:</span> {formatCurrency(selectedTicket.total_cost, selectedTicket.currency)}</div>
                    <div><span className="font-medium">Döviz:</span> {selectedTicket.currency}</div>
                    <div><span className="font-medium">Durum:</span> {selectedTicket.status}</div>
                  </div>
                </div>
              </div>
              
              {/* Ödeme Planı */}
              {selectedTicket.paymentPlan && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">📅 Ödeme Planı</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedTicket.paymentPlan.installments.map((installment, index) => (
                      <div key={installment.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Taksit {index + 1}
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          <div>📅 {formatDate(installment.date)}</div>
                          <div>💰 {formatCurrency(installment.amount, installment.currency)}</div>
                          <div>📊 %{installment.percentage}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Yapılan Ödemeler */}
              {selectedTicket.payment && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">💳 Yapılan Ödeme</h3>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Ödeme Tarihi:</span> {formatDate(selectedTicket.payment.payment_date)}</div>
                      <div><span className="font-medium">Tutar:</span> {formatCurrency(selectedTicket.payment.amount, selectedTicket.currency)}</div>
                      <div><span className="font-medium">Ödeme Yöntemi:</span> {selectedTicket.payment.payment_method || '-'}</div>
                      <div><span className="font-medium">Alıcı:</span> {selectedTicket.payment.recipient || '-'}</div>
                      {selectedTicket.payment.notes && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Notlar:</span> {selectedTicket.payment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
