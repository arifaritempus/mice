'use client';

import { useState, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { format as formatDateFns, isValid as isValidDate, parseISO } from 'date-fns';
import { useTheme } from '@/components/providers/ThemeProvider';
import { ticketOptionsService, ticketPaymentPlansService, ticketPaymentRecordsService } from '@/lib/supabaseService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePermissions, Module } from '@/lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/Modal';
import { getLogosForExcel } from '@/utils/logoUtils';
import { 
  Calendar as CalendarIcon, 
  Search, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  ArrowUpRight,
  TrendingUp,
  Download,
  Users,
  Ticket as TicketIcon,
  CreditCard,
  DollarSign
} from 'lucide-react';

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
  project_code?: string;
  reference_code?: string;
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
  date: string;
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
  type: 'installment' | 'payment' | 'combined';
}

interface CalendarPeriod {
  startDate: Date;
  endDate: Date;
  tickets: CalendarDay[];
  totals: {
    TRY: number;
    USD: number;
    EUR: number;
    GBP: number;
  };
  totalPassengers: number;
  uniqueTicketCount?: number;
}

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function TicketCalendarPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [confirmedTickets, setConfirmedTickets] = useState<ConfirmedTicket[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  
  // Unified Search State
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Modal state'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<CalendarDay | null>(null);
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

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (!searchTokens.includes(searchQuery.trim())) {
        setSearchTokens([...searchTokens, searchQuery.trim()]);
      }
      setSearchQuery('');
    } else if (e.key === 'Backspace' && !searchQuery && searchTokens.length > 0) {
      setSearchTokens(searchTokens.slice(0, -1));
    }
  };

  const removeSearchToken = (token: string) => {
    setSearchTokens(searchTokens.filter(t => t !== token));
  };

  const clearAllFilters = () => {
    setSearchTokens([]);
    setSearchQuery('');
  };

  // Veri yükleme
  useEffect(() => {
    const loadData = async () => {
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;
      try {
        setLoading(true);
        const [tickets, plans, records] = await Promise.all([
          ticketOptionsService.getAll(),
          ticketPaymentPlansService.getAll(),
          ticketPaymentRecordsService.getAll()
        ]);

        setConfirmedTickets((tickets || []).filter((t: any) => t.status === 'confirmed'));
        setPaymentPlans(plans || []);
        setPaymentRecords((records || []).map((r: any) => ({
          ...r,
          payment_date: toCalendarYmd(r.payment_date),
          currency: r.currency || 'TRY'
        })));
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        hasLoadedRef.current = false;
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filtrelenmiş Biletler (Unified Search)
  const filteredTickets = useMemo(() => {
    return confirmedTickets.filter(ticket => {
      if (searchTokens.length === 0) return true;
      const searchableText = [
        ticket.voucher_no,
        ticket.agent,
        ticket.company_name,
        ticket.pnr,
        ticket.supplier,
        ticket.airline
      ].join(' ').toLowerCase();
      
      return searchTokens.every(token => searchableText.includes(token.toLowerCase()));
    });
  }, [confirmedTickets, searchTokens]);

  // Tüm Taksitler (Filtrelenmiş Biletlerin Taksitleri)
  const allInstallments = useMemo(() => {
    const list: (Installment & { ticket: ConfirmedTicket })[] = [];
    paymentPlans.forEach(plan => {
      const ticket = filteredTickets.find(t => t.id === plan.ticket_id);
      if (ticket) {
        (plan.installments || []).forEach(inst => {
          list.push({ ...inst, ticket });
        });
      }
    });
    return list;
  }, [paymentPlans, filteredTickets]);

  // Aktif görünüm aralığı (Gün/Hafta/Ay/Yıl)
  const activeViewRange = useMemo(() => {
    let start = new Date(currentDate);
    let end = new Date(currentDate);

    if (viewMode === 'daily') {
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (viewMode === 'weekly') {
      const d = start.getDay();
      const diff = start.getDate() - d + (d === 0 ? -6 : 1);
      start = new Date(start.setDate(diff));
      start.setHours(0,0,0,0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23,59,59,999);
    } else if (viewMode === 'monthly') {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (viewMode === 'yearly') {
      start = new Date(start.getFullYear(), 0, 1);
      end = new Date(start.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    return { start, end };
  }, [currentDate, viewMode]);

  // Özet Kartları İçin Toplamlar (Search + Departure + Aktif Görünüm Aralığı)
  const statsTotals = useMemo(() => {
    const instTotals = { TRY: 0, USD: 0, EUR: 0, GBP: 0 };
    const payTotals = { TRY: 0, USD: 0, EUR: 0, GBP: 0 };

    const startStr = dayKey(activeViewRange.start);
    const endStr = dayKey(activeViewRange.end);

    allInstallments.forEach(inst => {
      const dStr = toCalendarYmd(inst.date);
      if (dStr >= startStr && dStr <= endStr) {
        const curr = (inst.currency || 'TRY') as keyof typeof instTotals;
        if (instTotals[curr] !== undefined) instTotals[curr] += inst.amount;
      }
    });

    paymentRecords.forEach(rec => {
      const ticket = filteredTickets.find(t => t.id === rec.ticket_id);
      if (!ticket) return;

      const dStr = toCalendarYmd(rec.payment_date);
      if (dStr >= startStr && dStr <= endStr) {
        const curr = (rec.currency || 'TRY') as keyof typeof payTotals;
        if (payTotals[curr] !== undefined) payTotals[curr] += rec.amount;
      }
    });

    return { instTotals, payTotals };
  }, [allInstallments, paymentRecords, filteredTickets, activeViewRange]);

  const calculateTotalsByCurrency = (items: CalendarDay[]) => {
    const totals = { TRY: 0, USD: 0, EUR: 0, GBP: 0 };
    items.forEach(item => {
      const currency = (item.installment?.currency || item.payment?.currency || item.currency || 'TRY') as keyof typeof totals;
      const amount = item.installment?.amount || item.payment?.amount || 0;
      if (totals[currency] !== undefined) totals[currency] += amount;
    });
    return totals;
  };

  const generateYearlyView = (year: number): CalendarPeriod[] => {
    const periods: CalendarPeriod[] = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const monthStr = monthStart.toLocaleDateString('tr-TR', { month: 'long' });
      
      const monthTickets: CalendarDay[] = [];
      const processedTickets = new Set<string>();
      
      allInstallments.forEach(inst => {
        const instDate = toCalendarYmd(inst.date);
        if (instDate >= dayKey(monthStart) && instDate <= dayKey(monthEnd)) {
          monthTickets.push({ ...inst.ticket, installment: inst, type: 'installment' });
          processedTickets.add(inst.ticket.id);
        }
      });

      paymentRecords.forEach(pay => {
        const ticket = filteredTickets.find(t => t.id === pay.ticket_id);
        if (ticket && pay.payment_date >= dayKey(monthStart) && pay.payment_date <= dayKey(monthEnd)) {
          monthTickets.push({ ...ticket, payment: pay, type: 'payment' });
          processedTickets.add(ticket.id);
        }
      });
      
      periods.push({
        startDate: monthStart,
        endDate: monthEnd,
        tickets: monthTickets,
        totals: calculateTotalsByCurrency(monthTickets),
        totalPassengers: monthTickets.reduce((sum, t) => sum + (t.passenger_count || 0), 0),
        uniqueTicketCount: processedTickets.size
      });
    }
    return periods;
  };

  const generateDailyView = (date: Date): CalendarPeriod[] => {
    const dateStr = dayKey(date);
    const dayTickets: CalendarDay[] = [];
    allInstallments.forEach(inst => {
      if (toCalendarYmd(inst.date) === dateStr) dayTickets.push({ ...inst.ticket, installment: inst, type: 'installment' });
    });
    paymentRecords.forEach(pay => {
      const ticket = filteredTickets.find(t => t.id === pay.ticket_id);
      if (ticket && toCalendarYmd(pay.payment_date) === dateStr) dayTickets.push({ ...ticket, payment: pay, type: 'payment' });
    });
    return [{ startDate: date, endDate: date, tickets: dayTickets, totals: calculateTotalsByCurrency(dayTickets), totalPassengers: dayTickets.reduce((sum, t) => sum + (t.passenger_count || 0), 0) }];
  };

  const generateWeeklyView = (date: Date): CalendarPeriod[] => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1));
    const periods: CalendarPeriod[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const dStr = dayKey(d);
      const tickets: CalendarDay[] = [];
      allInstallments.forEach(inst => { if (toCalendarYmd(inst.date) === dStr) tickets.push({ ...inst.ticket, installment: inst, type: 'installment' }); });
      paymentRecords.forEach(pay => {
        const ticket = filteredTickets.find(t => t.id === pay.ticket_id);
        if (ticket && toCalendarYmd(pay.payment_date) === dStr) tickets.push({ ...ticket, payment: pay, type: 'payment' });
      });
      periods.push({ startDate: d, endDate: d, tickets, totals: calculateTotalsByCurrency(tickets), totalPassengers: tickets.reduce((sum, t) => sum + (t.passenger_count || 0), 0) });
    }
    return periods;
  };

  const generateMonthlyView = (year: number, month: number): CalendarPeriod[] => {
    const start = new Date(year, month, 1);
    const firstDay = start.getDay();
    start.setDate(start.getDate() - (firstDay === 0 ? 6 : firstDay - 1));
    const periods: CalendarPeriod[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const dStr = dayKey(d);
      const tickets: CalendarDay[] = [];
      allInstallments.forEach(inst => { if (toCalendarYmd(inst.date) === dStr) tickets.push({ ...inst.ticket, installment: inst, type: 'installment' }); });
      paymentRecords.forEach(pay => {
        const ticket = filteredTickets.find(t => t.id === pay.ticket_id);
        if (ticket && toCalendarYmd(pay.payment_date) === dStr) tickets.push({ ...ticket, payment: pay, type: 'payment' });
      });
      periods.push({ startDate: d, endDate: d, tickets, totals: calculateTotalsByCurrency(tickets), totalPassengers: tickets.reduce((sum, t) => sum + (t.passenger_count || 0), 0) });
    }
    return periods;
  };

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    switch (viewMode) {
      case 'daily': return generateDailyView(currentDate);
      case 'weekly': return generateWeeklyView(currentDate);
      case 'monthly': return generateMonthlyView(year, month);
      case 'yearly': return generateYearlyView(year);
      default: return generateMonthlyView(year, month);
    }
  }, [viewMode, currentDate, allInstallments, paymentRecords, filteredTickets]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY' }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    const parsed = parseCalendarDate(dateString);
    return parsed ? parsed.toLocaleDateString('tr-TR') : '-';
  };

  const goToPreviousPeriod = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'daily') d.setDate(d.getDate() - 1);
      else if (viewMode === 'weekly') d.setDate(d.getDate() - 7);
      else if (viewMode === 'monthly') d.setMonth(d.getMonth() - 1);
      else if (viewMode === 'yearly') d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  };

  const goToNextPeriod = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'daily') d.setDate(d.getDate() + 1);
      else if (viewMode === 'weekly') d.setDate(d.getDate() + 7);
      else if (viewMode === 'monthly') d.setMonth(d.getMonth() + 1);
      else if (viewMode === 'yearly') d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  };

  const getViewTitle = () => {
    if (viewMode === 'daily') return currentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    if (viewMode === 'weekly') {
      const s = new Date(currentDate); s.setDate(s.getDate() - s.getDay() + (s.getDay() === 0 ? -6 : 1));
      const e = new Date(s); e.setDate(e.getDate() + 6);
      return `${s.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${e.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (viewMode === 'monthly') return currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    return currentDate.getFullYear().toString();
  };

  const exportCalendarExcel = async (filterCurr?: string) => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bilet Takvimi');
    sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } } as any;

    // Header band
    const top = sheet.addRow([]); top.height = 48; sheet.mergeCells('A1:I1');
    for (let c = 1; c <= 9; c++) { sheet.getRow(1).getCell(c).value=''; sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any; }
    
    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(true); // Koyu band için dark (beyaz) logolar
    const inchToPx = (inch: number) => Math.round(inch * 96);
    const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
    if (iconLogoBase64) { 
      const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) }); 
      sheet.addImage(iconId, { tl: { col: 0.1, row: 0.1 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any); 
    }
    if (wordmarkLogoBase64) { 
      const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) }); 
      sheet.addImage(markId, { tl: { col: 6.8, row: 0.23 }, ext: { width: inchToPx(2.1), height: inchToPx(0.50) } as any } as any); 
    }

    const columns = [
      { header: 'TARİH', key: 'date', width: 14 },
      { header: 'TÜR', key: 'type', width: 12 },
      { header: 'VOUCHER NO', key: 'voucher_no', width: 18 },
      { header: 'ACENTE', key: 'agent', width: 25 },
      { header: 'FİRMA ADI', key: 'company_name', width: 25 },
      { header: 'TUTAR', key: 'amount', width: 16 },
      { header: 'DÖVİZ', key: 'currency', width: 10 },
      { header: 'GÜZERGAH', key: 'route', width: 30 },
      { header: 'PNR', key: 'pnr', width: 15 }
    ];
    sheet.columns = columns;

    // Header values row
    const headerRow = sheet.addRow(columns.map(c => c.header));
    headerRow.height = 18;
    headerRow.eachCell((cell) => { 
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any; 
      cell.alignment = { vertical: 'middle', horizontal: 'center' } as any; 
    });

    const data: any[] = [];
    allInstallments.forEach(inst => {
      if (filterCurr && inst.currency !== filterCurr) return;
      data.push({
        date: toCalendarYmd(inst.date),
        type: 'Taksit',
        voucher_no: inst.ticket.voucher_no,
        agent: inst.ticket.agent,
        company_name: inst.ticket.company_name || '',
        amount: inst.amount,
        currency: inst.currency,
        route: inst.ticket.route || '',
        pnr: inst.ticket.pnr || ''
      });
    });

    paymentRecords.forEach(pay => {
      if (filterCurr && pay.currency !== filterCurr) return;
      const ticket = filteredTickets.find(t => t.id === pay.ticket_id);
      if (!ticket) return;
      data.push({
        date: toCalendarYmd(pay.payment_date),
        type: 'Ödeme',
        voucher_no: ticket.voucher_no,
        agent: ticket.agent,
        company_name: ticket.company_name || '',
        amount: pay.amount,
        currency: pay.currency || 'TRY',
        route: ticket.route || '',
        pnr: ticket.pnr || ''
      });
    });

    data.sort((a, b) => a.date.localeCompare(b.date));

    // Data rows
    data.forEach(row => {
      const dataRow = sheet.addRow({
        ...row,
        date: row.date ? new Date(row.date).toLocaleDateString('tr-TR') : ''
      });
      dataRow.getCell('amount').numFmt = '#,##0.00';
      dataRow.getCell('amount').alignment = { horizontal: 'right' };
      dataRow.eachCell((cell) => {
        cell.alignment = { ...cell.alignment, vertical: 'middle' } as any;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bilet_takvimi_${filterCurr || 'tum_para_birimleri'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (permissionsLoading || loading) return <LoadingSpinner message="Bilet takvimi hazırlanıyor..." />;
  if (!canView(Module.TICKETS)) return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 font-black uppercase text-gray-400">Yetki Gerekli</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 w-full">
      {/* Premium Sticky Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 px-4 py-4 lg:px-8">
        <div className="max-w-[1600px] mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                <TicketIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Bilet Takvimi</h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Ödeme Takibi ve Planlama</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700">
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase ${viewMode === mode ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {mode === 'daily' ? 'GÜN' : mode === 'weekly' ? 'HAFTA' : mode === 'monthly' ? 'AY' : 'YIL'}
                  </button>
                ))}
              </div>

              <div className="relative group w-72">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 pl-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[1.5rem] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all min-h-[48px]">
                  {searchTokens.map((token, idx) => (
                    <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black tracking-tight">
                      {token}
                      <button onClick={() => removeSearchToken(token)} className="hover:text-red-500"><Plus className="w-2.5 h-2.5 rotate-45" /></button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={searchTokens.length === 0 ? "Ara..." : ""}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-900 dark:text-white h-8"
                  />
                </div>
              </div>

              <button
                onClick={clearAllFilters}
                className="p-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                title="Filtreleri Temizle"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => exportCalendarExcel()}
                className="flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.1em] hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20"
              >
                <Download className="w-4 h-4" />
                Dışa Aktar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-8 space-y-6">
        {/* Currency Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['TRY', 'USD', 'EUR', 'GBP'].map(curr => (
            <div key={curr} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{curr} ÖZETİ</span>
                </div>
                <button
                  onClick={() => exportCalendarExcel(curr)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                  title={`${curr} Bazlı Excel İndir`}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase">TOPLAM</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatCurrency(statsTotals.instTotals[curr as keyof typeof statsTotals.instTotals], curr)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[600px] flex flex-col">
          {(viewMode === 'monthly' || viewMode === 'weekly') && (
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day) => (
                <div key={day} className="py-4 text-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{day}</span>
                </div>
              ))}
            </div>
          )}

          <div className={`grid flex-1 ${
            viewMode === 'daily' ? 'grid-cols-1' :
            viewMode === 'weekly' ? 'grid-cols-7' :
            viewMode === 'yearly' ? 'grid-cols-4' :
            'grid-cols-7'
          }`}>
            {calendarData.map((period, idx) => {
              const isToday = period.startDate.toDateString() === new Date().toDateString();
              const isCurrentMonth = period.startDate.getMonth() === currentDate.getMonth();
              
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.005 }}
                  key={idx}
                  onClick={() => {
                    if (period.tickets.length > 0) {
                      setSelectedPeriod(period);
                      setIsPeriodModalOpen(true);
                    }
                  }}
                  className={`min-h-[160px] p-5 border-r border-b border-gray-100 dark:border-gray-800 group relative transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                    !isCurrentMonth && viewMode === 'monthly' ? 'bg-gray-50/10 dark:bg-gray-900/10 opacity-30' : 'bg-white dark:bg-gray-900'
                  } ${isToday ? 'bg-blue-50/20 dark:bg-blue-900/5 ring-1 ring-inset ring-blue-500/20' : ''}`}
                >
                  <div className="absolute inset-0 border border-gray-100 dark:border-gray-800/50 m-2 rounded-3xl group-hover:border-blue-500/20 transition-all" />
                  <div className="relative flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      isToday ? 'px-2 py-1 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-500/30' :
                      isCurrentMonth || viewMode === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-700'
                    }`}>
                      {viewMode === 'yearly' 
                        ? period.startDate.toLocaleDateString('tr-TR', { month: 'long' }) 
                        : `${period.startDate.getDate()} ${period.startDate.toLocaleDateString('tr-TR', { month: 'short' })}`}
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    {/* Currency Totals Summary */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Object.entries(period.totals).map(([curr, total]) => total > 0 && (
                        <div key={curr} className="flex items-center gap-1 text-[8px] font-black bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-md border border-blue-100/50 dark:border-blue-800/30">
                          <span className="text-blue-600 dark:text-blue-400">{curr}</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(total, curr).replace(/[^\d,. ]/g, '')}</span>
                        </div>
                      ))}
                    </div>

                    {/* Movement List Preview */}
                    <div className="space-y-1 overflow-hidden">
                      {period.tickets.slice(0, 3).map((ticket, tIdx) => (
                        <div key={tIdx} className="text-[9px] leading-tight p-1.5 bg-gray-50 dark:bg-gray-800/80 rounded-lg border border-gray-100 dark:border-gray-700/50 group-hover:border-blue-500/30 transition-colors">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-black text-blue-600 dark:text-blue-400 tracking-tighter truncate max-w-[60px]">{ticket.voucher_no}</span>
                            <span className="font-black text-gray-900 dark:text-white ml-1">
                              {formatCurrency(ticket.installment?.amount || ticket.payment?.amount || 0, ticket.installment?.currency || ticket.payment?.currency || 'TRY').replace(/[^\d,. ]/g, '')}
                            </span>
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 font-bold truncate">
                            {ticket.agent || ticket.company_name || '-'}
                          </div>
                          <div className="text-[8px] text-gray-400 dark:text-gray-500 mt-0.5 truncate tracking-tighter">
                            {ticket.route || ticket.pnr || '-'}
                          </div>
                        </div>
                      ))}
                      {period.tickets.length > 3 && (
                        <div className="text-[8px] font-black text-blue-500 uppercase px-1 pt-1 flex items-center gap-1 animate-pulse">
                          <Plus className="w-2 h-2" /> {period.tickets.length - 3} HAREKET DAHA
                        </div>
                      )}
                      {period.tickets.length > 0 && period.tickets.length <= 3 && (
                        <div className="text-[8px] font-black text-gray-300 dark:text-gray-600 uppercase px-1 pt-1 flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                          <Plus className="w-2 h-2" /> DETAYLAR
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Details Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isModalOpen && selectedTicket && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={`p-5 rounded-3xl ${selectedTicket.type === 'installment' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}>
                        <TicketIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{selectedTicket.voucher_no}</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{selectedTicket.type === 'installment' ? 'Taksit Detayı' : 'Ödeme Detayı'}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-red-500 transition-all"><Plus className="w-6 h-6 rotate-45" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ACENTA / FİRMA / TEDARİKÇİ</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                          {selectedTicket.agent}<br/>
                          <span className="text-xs text-gray-500">{selectedTicket.company_name || '-'}</span><br/>
                          <span className="text-[10px] font-black text-blue-600/50 tracking-widest">Tedarikçi: {selectedTicket.supplier || '-'}</span>
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">HAVAYOLU</p>
                          <p className="text-[11px] font-bold text-gray-900 dark:text-white">{selectedTicket.airline || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">UÇUŞ TİPİ</p>
                          <p className="text-[11px] font-bold text-gray-900 dark:text-white">{selectedTicket.flight_type || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">GÜZERGAH / PNR</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tighter">{selectedTicket.route || '-'}<br/><span className="text-xs text-blue-600">{selectedTicket.pnr || '-'}</span></p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">YOLCU SAYISI</p>
                          <p className="text-[11px] font-bold text-gray-900 dark:text-white">{selectedTicket.passenger_count || 0} PAX</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">KAYIT TARİHİ</p>
                          <p className="text-[11px] font-bold text-gray-900 dark:text-white">{formatDate(selectedTicket.entry_date || '')}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">PROJE KODU</p>
                          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{selectedTicket.project_code || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">REF. KODU</p>
                          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{selectedTicket.reference_code || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2rem]">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">HAREKET TUTARI</p>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                          {formatCurrency(selectedTicket.installment?.amount || selectedTicket.payment?.amount || 0, selectedTicket.installment?.currency || selectedTicket.payment?.currency || 'TRY')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">TOPLAM BİLET MALİYETİ</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                          {formatCurrency(selectedTicket.total_cost || 0, selectedTicket.currency || 'TRY')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">İŞLEM TARİHİ</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                          {formatDate(selectedTicket.installment?.date || selectedTicket.payment?.payment_date || '')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="w-full py-5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-[2rem] font-black text-[11px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-900/20 dark:shadow-white/10">KAPAT</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Period Summary Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isPeriodModalOpen && selectedPeriod && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPeriodModalOpen(false)} className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><CalendarIcon className="w-6 h-6" /></div>
                    <div>
                      <h2 className="text-[10px] font-black text-gray-400 tracking-[0.2em]">DÖNEM HAREKETLERİ</h2>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{formatDate(selectedPeriod.startDate.toISOString())}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsPeriodModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-xl hover:text-red-500 transition-all"><Plus className="w-5 h-5 rotate-45" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                  {selectedPeriod.tickets.map((t, i) => (
                    <div key={i} onClick={() => { setSelectedTicket(t); setIsModalOpen(true); }} className="group p-5 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-transparent hover:border-blue-500/50 hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${t.type === 'installment' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {t.type === 'installment' ? <TicketIcon className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 mb-0.5">{t.type === 'installment' ? 'TAKSİT' : 'ÖDEME'}</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white">{t.voucher_no} • {t.agent}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                          {formatCurrency(t.installment?.amount || t.payment?.amount || 0, t.installment?.currency || t.payment?.currency || 'TRY')}
                        </p>
                        <div className="flex items-center justify-end gap-1 text-[8px] font-black text-blue-500 tracking-tighter mt-1">DETAY <ArrowUpRight className="w-2 h-2" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
}
