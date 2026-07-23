"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import {
  format as formatDateFns,
  isValid as isValidDate,
  parseISO,
} from "date-fns";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  ticketOptionsService,
  ticketPaymentPlansService,
  ticketPaymentRecordsService,
} from "@/lib/supabaseService";
import LoadingSpinner from "@/components/LoadingSpinner";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import { usePermissions, Module } from "@/lib/permissions";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import { getLogosForExcel } from "@/utils/logoUtils";
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
  DollarSign,
} from "lucide-react";

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
  status: "active" | "inactive";
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
  payment_method: "credit_card" | "bank_transfer" | "cash" | "online";
  notes?: string;
  recipient: string;
}

interface CalendarDay extends ConfirmedTicket {
  installment?: Installment;
  paymentPlan?: PaymentPlan;
  payment?: PaymentRecord;
  type: "installment" | "payment" | "combined";
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

type ViewMode = "daily" | "weekly" | "monthly" | "yearly";

export default function TicketCalendarPage() {
  const { t, language } = useLanguage();
  const locale = language === "en" ? "en-US" : "tr-TR";
  const { canView, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [confirmedTickets, setConfirmedTickets] = useState<ConfirmedTicket[]>(
    [],
  );
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);

  // Unified Search State
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Modal state'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<CalendarDay | null>(
    null,
  );
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<CalendarPeriod | null>(
    null,
  );

  // Takvim State'leri
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");

  const { isDark } = useTheme();

  const dayKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const toCalendarYmd = (value: string | Date | null | undefined): string => {
    if (value == null) return "";
    if (value instanceof Date)
      return Number.isNaN(value.getTime()) ? "" : dayKey(value);
    const trimmed = String(value).trim();
    if (!trimmed) return "";
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? "" : dayKey(parsed);
  };

  const parseCalendarDate = (value?: string | null): Date | null => {
    const ymd = toCalendarYmd(value ?? "");
    if (!ymd) return null;
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      if (!searchTokens.includes(searchQuery.trim())) {
        setSearchTokens([...searchTokens, searchQuery.trim()]);
      }
      setSearchQuery("");
    } else if (
      e.key === "Backspace" &&
      !searchQuery &&
      searchTokens.length > 0
    ) {
      setSearchTokens(searchTokens.slice(0, -1));
    }
  };

  const removeSearchToken = (token: string) => {
    setSearchTokens(searchTokens.filter((t) => t !== token));
  };

  const clearAllFilters = () => {
    setSearchTokens([]);
    setSearchQuery("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setIsPeriodModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
          ticketPaymentRecordsService.getAll(),
        ]);

        setConfirmedTickets(
          (tickets || []).filter((t: any) => t.status === "confirmed"),
        );
        setPaymentPlans(plans || []);
        setPaymentRecords(
          (records || []).map((r: any) => ({
            ...r,
            payment_date: toCalendarYmd(r.payment_date),
            currency: r.currency,
          })),
        );
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
        hasLoadedRef.current = false;
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filtrelenmiş Biletler (Unified Search)
  const filteredTickets = useMemo(() => {
    return confirmedTickets.filter((ticket) => {
      const terms = [...searchTokens, searchQuery.trim()].filter(Boolean);
      if (terms.length === 0) return true;
      const searchableText = [
        ticket.voucher_no,
        ticket.agent,
        ticket.company_name,
        ticket.pnr,
        ticket.supplier,
        ticket.airline,
      ]
        .join(" ")
        .toLowerCase();

      return terms.every((token) =>
        searchableText.includes(token.toLowerCase()),
      );
    });
  }, [confirmedTickets, searchTokens, searchQuery]);

  // Tüm Taksitler (Filtrelenmiş Biletlerin Taksitleri)
  const allInstallments = useMemo(() => {
    const list: (Installment & { ticket: ConfirmedTicket })[] = [];
    paymentPlans.forEach((plan) => {
      const ticket = filteredTickets.find((t) => t.id === plan.ticket_id);
      if (ticket) {
        (plan.installments || []).forEach((inst) => {
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

    if (viewMode === "daily") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === "weekly") {
      const d = start.getDay();
      const diff = start.getDate() - d + (d === 0 ? -6 : 1);
      start = new Date(start.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === "monthly") {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
      end = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
    } else if (viewMode === "yearly") {
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

    allInstallments.forEach((inst) => {
      const dStr = toCalendarYmd(inst.date);
      if (dStr >= startStr && dStr <= endStr) {
        const curr = (inst.currency || inst.ticket.currency || "TRY") as keyof typeof instTotals;
        if (instTotals[curr] !== undefined) instTotals[curr] += inst.amount;
      }
    });

    paymentRecords.forEach((rec) => {
      const ticket = filteredTickets.find((t) => t.id === rec.ticket_id);
      if (!ticket) return;

      const dStr = toCalendarYmd(rec.payment_date);
      if (dStr >= startStr && dStr <= endStr) {
        const curr = (rec.currency || ticket.currency || "TRY") as keyof typeof payTotals;
        if (payTotals[curr] !== undefined) payTotals[curr] += rec.amount;
      }
    });

    return { instTotals, payTotals };
  }, [allInstallments, paymentRecords, filteredTickets, activeViewRange]);

  const calculateTotalsByCurrency = (items: CalendarDay[]) => {
    const totals = { TRY: 0, USD: 0, EUR: 0, GBP: 0 };
    items.forEach((item) => {
      const currency = (item.installment?.currency ||
        item.payment?.currency ||
        item.currency ||
        "TRY") as keyof typeof totals;
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
      const monthStr = monthStart.toLocaleDateString(locale, {
        month: "long",
      });

      const monthTickets: CalendarDay[] = [];
      const processedTickets = new Set<string>();

      allInstallments.forEach((inst) => {
        const instDate = toCalendarYmd(inst.date);
        if (instDate >= dayKey(monthStart) && instDate <= dayKey(monthEnd)) {
          monthTickets.push({
            ...inst.ticket,
            installment: inst,
            type: "installment",
          });
          processedTickets.add(inst.ticket.id);
        }
      });

      paymentRecords.forEach((pay) => {
        const ticket = filteredTickets.find((t) => t.id === pay.ticket_id);
        if (
          ticket &&
          pay.payment_date >= dayKey(monthStart) &&
          pay.payment_date <= dayKey(monthEnd)
        ) {
          monthTickets.push({ ...ticket, payment: pay, type: "payment" });
          processedTickets.add(ticket.id);
        }
      });

      periods.push({
        startDate: monthStart,
        endDate: monthEnd,
        tickets: monthTickets,
        totals: calculateTotalsByCurrency(monthTickets),
        totalPassengers: monthTickets.reduce(
          (sum, t) => sum + (t.passenger_count || 0),
          0,
        ),
        uniqueTicketCount: processedTickets.size,
      });
    }
    return periods;
  };

  const generateDailyView = (date: Date): CalendarPeriod[] => {
    const dateStr = dayKey(date);
    const dayTickets: CalendarDay[] = [];
    allInstallments.forEach((inst) => {
      if (toCalendarYmd(inst.date) === dateStr)
        dayTickets.push({
          ...inst.ticket,
          installment: inst,
          type: "installment",
        });
    });
    paymentRecords.forEach((pay) => {
      const ticket = filteredTickets.find((t) => t.id === pay.ticket_id);
      if (ticket && toCalendarYmd(pay.payment_date) === dateStr)
        dayTickets.push({ ...ticket, payment: pay, type: "payment" });
    });
    return [
      {
        startDate: date,
        endDate: date,
        tickets: dayTickets,
        totals: calculateTotalsByCurrency(dayTickets),
        totalPassengers: dayTickets.reduce(
          (sum, t) => sum + (t.passenger_count || 0),
          0,
        ),
      },
    ];
  };

  const generateWeeklyView = (date: Date): CalendarPeriod[] => {
    const start = new Date(date);
    start.setDate(
      start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1),
    );
    const periods: CalendarPeriod[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dStr = dayKey(d);
      const tickets: CalendarDay[] = [];
      allInstallments.forEach((inst) => {
        if (toCalendarYmd(inst.date) === dStr)
          tickets.push({
            ...inst.ticket,
            installment: inst,
            type: "installment",
          });
      });
      paymentRecords.forEach((pay) => {
        const ticket = filteredTickets.find((t) => t.id === pay.ticket_id);
        if (ticket && toCalendarYmd(pay.payment_date) === dStr)
          tickets.push({ ...ticket, payment: pay, type: "payment" });
      });
      periods.push({
        startDate: d,
        endDate: d,
        tickets,
        totals: calculateTotalsByCurrency(tickets),
        totalPassengers: tickets.reduce(
          (sum, t) => sum + (t.passenger_count || 0),
          0,
        ),
      });
    }
    return periods;
  };

  const generateMonthlyView = (
    year: number,
    month: number,
  ): CalendarPeriod[] => {
    const start = new Date(year, month, 1);
    const firstDay = start.getDay();
    start.setDate(start.getDate() - (firstDay === 0 ? 6 : firstDay - 1));
    const periods: CalendarPeriod[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dStr = dayKey(d);
      const tickets: CalendarDay[] = [];
      allInstallments.forEach((inst) => {
        if (toCalendarYmd(inst.date) === dStr)
          tickets.push({
            ...inst.ticket,
            installment: inst,
            type: "installment",
          });
      });
      paymentRecords.forEach((pay) => {
        const ticket = filteredTickets.find((t) => t.id === pay.ticket_id);
        if (ticket && toCalendarYmd(pay.payment_date) === dStr)
          tickets.push({ ...ticket, payment: pay, type: "payment" });
      });
      periods.push({
        startDate: d,
        endDate: d,
        tickets,
        totals: calculateTotalsByCurrency(tickets),
        totalPassengers: tickets.reduce(
          (sum, t) => sum + (t.passenger_count || 0),
          0,
        ),
      });
    }
    return periods;
  };

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    switch (viewMode) {
      case "daily":
        return generateDailyView(currentDate);
      case "weekly":
        return generateWeeklyView(currentDate);
      case "monthly":
        return generateMonthlyView(year, month);
      case "yearly":
        return generateYearlyView(year);
      default:
        return generateMonthlyView(year, month);
    }
  }, [viewMode, currentDate, allInstallments, paymentRecords, filteredTickets]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "TRY",
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    const parsed = parseCalendarDate(dateString);
    return parsed ? parsed.toLocaleDateString(locale) : "-";
  };

  const goToPreviousPeriod = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "daily") d.setDate(d.getDate() - 1);
      else if (viewMode === "weekly") d.setDate(d.getDate() - 7);
      else if (viewMode === "monthly") d.setMonth(d.getMonth() - 1);
      else if (viewMode === "yearly") d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  };

  const goToNextPeriod = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "daily") d.setDate(d.getDate() + 1);
      else if (viewMode === "weekly") d.setDate(d.getDate() + 7);
      else if (viewMode === "monthly") d.setMonth(d.getMonth() + 1);
      else if (viewMode === "yearly") d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getViewTitle = () => {
    if (viewMode === "daily")
      return currentDate.toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    if (viewMode === "weekly") {
      const s = new Date(currentDate);
      s.setDate(s.getDate() - s.getDay() + (s.getDay() === 0 ? -6 : 1));
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      return `${s.toLocaleDateString(locale, { day: "numeric", month: "short" })} - ${e.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`;
    }
    if (viewMode === "monthly")
      return currentDate.toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
      });
    return currentDate.getFullYear().toString();
  };

  const exportCalendarExcel = async (filterCurr?: string) => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Bilet Takvimi");
    sheet.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      paperSize: 9,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.3,
        bottom: 0.3,
        header: 0.1,
        footer: 0.1,
      },
    } as any;

    // Header band
    const top = sheet.addRow([]);
    top.height = 48;
    sheet.mergeCells("A1:I1");
    for (let c = 1; c <= 9; c++) {
      sheet.getRow(1).getCell(c).value = "";
      sheet.getRow(1).getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF232F38" },
      } as any;
    }

    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64, iconWidth, iconHeight, wordmarkWidth, wordmarkHeight } = await getLogosForExcel(true); // Koyu band için dark (beyaz) logolar
    const inchToPx = (inch: number) => Math.round(inch * 96);
    const guessExt = (dataUrl: string): "png" | "jpeg" =>
      (dataUrl || "").includes("image/png") ? "png" : "jpeg";
    if (iconLogoBase64) {
      const iconId = workbook.addImage({
        base64: iconLogoBase64,
        extension: guessExt(iconLogoBase64),
      });
      sheet.addImage(iconId, {
        tl: { col: 0.1, row: 0.1 },
        ext: { width: (typeof iconWidth !== "undefined" ? iconWidth : 120), height: (typeof iconHeight !== "undefined" ? iconHeight : 60) } as any,
      } as any);
    }
    if (wordmarkLogoBase64) {
      const markId = workbook.addImage({
        base64: wordmarkLogoBase64,
        extension: guessExt(wordmarkLogoBase64),
      });
      sheet.addImage(markId, {
        tl: { col: 6.8, row: 0.23 },
        ext: { width: (typeof iconWidth !== "undefined" ? iconWidth : 120), height: (typeof iconHeight !== "undefined" ? iconHeight : 60) } as any,
      } as any);
    }

    const columns = [
      { header: t('ticketsCalendar.colDate') || "TARİH", key: "date", width: 14 },
      { header: t('ticketsCalendar.colType') || "TÜR", key: "type", width: 12 },
      { header: t('ticketsPayments.excelVoucherNo') || "VOUCHER NO", key: "voucher_no", width: 16 },
      { header: t('ticketsPayments.excelAgent') || "ACENTE", key: "agent", width: 20 },
      { header: t('ticketsCalendar.colCompany') || "FİRMA ADI", key: "company_name", width: 25 },
      { header: t('ticketsCalendar.colAmount') || "TUTAR", key: "amount", width: 14 },
      { header: t('ticketsCalendar.colCurrency') || "DÖVİZ", key: "currency", width: 10 },
      { header: t('ticketsCalendar.colRoute') || "GÜZERGAH", key: "route", width: 30 },
      { header: t('ticketsPayments.excelPNR') || "PNR", key: "pnr", width: 15 },
    ];
    sheet.columns = columns;

    // Header values row
    const headerRow = sheet.addRow(columns.map((c) => c.header));
    headerRow.height = 18;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2F3B46" },
      } as any;
      cell.alignment = { vertical: "middle", horizontal: "center" } as any;
    });

    const data: any[] = [];
    allInstallments.forEach((inst) => {
      if (filterCurr && inst.currency !== filterCurr) return;
      data.push({
        date: toCalendarYmd(inst.date),
        type: t('ticketsCalendar.lblInstallment') || "Taksit",
        voucher_no: inst.ticket.voucher_no,
        agent: inst.ticket.agent,
        company_name: inst.ticket.company_name || "",
        amount: inst.amount,
        currency: inst.currency,
        route: inst.ticket.route || "",
        pnr: inst.ticket.pnr || "",
      });
    });

    paymentRecords.forEach((pay) => {
      if (filterCurr && pay.currency !== filterCurr) return;
      const ticket = filteredTickets.find((t) => t.id === pay.ticket_id);
      if (!ticket) return;
      data.push({
        date: toCalendarYmd(pay.payment_date),
        type: t('ticketsCalendar.lblPayment') || "Ödeme",
        voucher_no: ticket.voucher_no,
        agent: ticket.agent,
        company_name: ticket.company_name || "",
        amount: pay.amount,
        currency: pay.currency || "TRY",
        route: ticket.route || "",
        pnr: ticket.pnr || "",
      });
    });

    data.sort((a, b) => a.date.localeCompare(b.date));

    // Data rows
    data.forEach((row) => {
      const dataRow = sheet.addRow({
        ...row,
        date: row.date ? new Date(row.date).toLocaleDateString(locale) : "",
      });
      dataRow.getCell("amount").numFmt = "#,##0.00";
      dataRow.getCell("amount").alignment = { horizontal: "right" };
      dataRow.eachCell((cell) => {
        cell.alignment = { ...cell.alignment, vertical: "middle" } as any;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bilet_takvimi_${filterCurr || "tum_para_birimleri"}_${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (permissionsLoading || loading)
    return <LoadingSpinner message={t('ticketsCalendar.loading') || "Bilet takvimi hazırlanıyor..."} />;
  if (!canView(Module.TICKETS))
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent font-black uppercase text-gray-400">
        {t('common.unauthorized') || "Yetki Gerekli"}
      </div>
    );

  return (
    <div className="h-full w-full p-4 sm:p-8 flex flex-col gap-6 overflow-y-auto overflow-x-hidden custom-scrollbar font-sans text-v3-text">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0 space-y-2">
        {/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
              {t('ticketsCalendar.title') || "Bilet Takvimi"}
            </h1>
            <p className="text-xs text-v3-muted mt-1">
              {t('ticketsCalendar.desc') || "Takvim üzerinden bilet hareketlerinizi yönetin"}
            </p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Navigation Controls */}
            <div className="flex items-center gap-1 h-10 bg-black/5 dark:bg-white/5 px-1 rounded-xl border border-v3-border shrink-0">
              <button
                onClick={goToPreviousPeriod}
                className="p-1.5 text-v3-muted hover:text-v3-text rounded-lg hover:bg-v3-surface transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 min-w-[120px] text-center flex items-center justify-center">
                <span className="text-[11px] font-semibold text-v3-text uppercase tracking-wider">
                  {getViewTitle()}
                </span>
              </div>
              <button
                onClick={goToNextPeriod}
                className="p-1.5 text-v3-muted hover:text-v3-text rounded-lg hover:bg-v3-surface transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex h-10 bg-v3-surface p-1 rounded-xl border border-v3-border shrink-0">
              {(["daily", "weekly", "monthly", "yearly"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 rounded-lg text-[10px] font-semibold transition-all uppercase flex items-center justify-center ${viewMode === mode ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30" : "text-v3-muted hover:text-v3-text"}`}
                  >
                    {mode === "daily"
                      ? t('ticketsCalendar.viewDaily') || "GÜN"
                      : mode === "weekly"
                        ? t('ticketsCalendar.viewWeekly') || "HAFTA"
                        : mode === "monthly"
                          ? t('ticketsCalendar.viewMonthly') || "AY"
                          : t('ticketsCalendar.viewYearly') || "YIL"}
                  </button>
                ),
              )}
            </div>

            {/* Search */}
            <div className="flex-[2] w-full sm:w-auto sm:min-w-[300px]">
              <MultiTokenFilterInput
                label={t('ticketsCalendar.phSearch') || "Genel Arama (Voucher, PNR, Firma vb.)"}
                tokens={searchTokens}
                inputValue={searchQuery}
                suggestions={[]}
                onInputChange={setSearchQuery}
                onAddToken={(val) => {
                  const trimmed = val.trim();
                  if (trimmed && !searchTokens.includes(trimmed)) {
                    setSearchTokens((prev) => [...prev, trimmed]);
                    setSearchQuery("");
                  }
                }}
                onRemoveToken={(val) =>
                  setSearchTokens((prev) => prev.filter((t) => t !== val))
                }
              />
            </div>

            {/* Clear Button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-10 h-10 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
                title={t('ticketsCalendar.filterClear') || "Filtreleri Temizle"}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Excel Button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => exportCalendarExcel()}
                className="bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('ticketsCalendar.btnDownloadExcel') || "Excel İndir"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col space-y-4">
          {/* Currency Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            {["TRY", "USD", "EUR", "GBP"].map((curr) => (
              <div
                key={curr}
                className="bg-v3-surface backdrop-blur-md p-4 rounded-2xl border border-v3-border shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-v3-text uppercase tracking-wider mb-2">
                      {curr} {t('ticketsCalendar.summary') || "ÖZETİ"}
                    </h3>
                  </div>
                  <button
                    onClick={() => exportCalendarExcel(curr)}
                    className="absolute top-2 right-2 p-1.5 text-blue-600 dark:text-blue-400 hover:text-v3-text bg-blue-500/10 hover:bg-blue-500/30 rounded-lg transition-all border border-blue-500/20"
                    title={`${curr} Bazlı ${t('ticketsCalendar.btnDownloadExcel') || "Excel İndir"}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-v3-muted uppercase">
                    TOPLAM
                  </p>
                  <p className="text-xl font-bold text-v3-text">
                    {formatCurrency(
                      (statsTotals.instTotals[
                        curr as keyof typeof statsTotals.instTotals
                      ] || 0) + (statsTotals.payTotals[
                        curr as keyof typeof statsTotals.payTotals
                      ] || 0),
                      curr,
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Grid Container */}
          <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-v3-border flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-x-auto custom-scrollbar">
              {(viewMode === "monthly" || viewMode === "weekly") && (
                <div className="grid grid-cols-7 min-w-[800px] lg:min-w-0 border-b border-v3-border bg-v3-surface shrink-0">
                  {(
                    [
                      t('common.dayMon') || "Pazartesi",
                      t('common.dayTue') || "Salı",
                      t('common.dayWed') || "Çarşamba",
                      t('common.dayThu') || "Perşembe",
                      t('common.dayFri') || "Cuma",
                      t('common.daySat') || "Cumartesi",
                      t('common.daySun') || "Pazar",
                    ] as string[]
                  ).map((day) => (
                    <div key={day} className="py-3 text-center">
                      <span className="text-[10px] font-semibold text-v3-muted uppercase tracking-widest">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Scrollable grid body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div
                  className={`grid min-h-full ${
                    viewMode === "daily"
                      ? "grid-cols-1"
                      : viewMode === "weekly"
                        ? "grid-cols-7 min-w-[800px] lg:min-w-0"
                        : viewMode === "yearly"
                          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                          : "grid-cols-7 min-w-[800px] lg:min-w-0"
                  }`}
                >
                {calendarData.map((period, idx) => {
                  const isToday =
                    period.startDate.toDateString() ===
                    new Date().toDateString();
                  const isCurrentMonth =
                    period.startDate.getMonth() === currentDate.getMonth();

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
                      className={`min-h-[120px] p-3 border-r border-b border-v3-border group relative transition-all cursor-pointer ${!isCurrentMonth && viewMode === "monthly" ? "bg-transparent opacity-40" : "bg-transparent hover:bg-v3-surface"} ${isToday ? "bg-blue-500/10 border-blue-500/30" : ""}`}
                    >
                      <div className="absolute inset-0 border border-white/0 m-1 rounded-xl group-hover:border-v3-border transition-all pointer-events-none" />
                      <div className="relative flex justify-between items-start mb-4">
                        <span
                          className={`text-[11px] font-semibold tracking-wider ${isToday ? "px-2 py-0.5 bg-blue-500/40 text-white rounded-md" : isCurrentMonth || viewMode === "yearly" ? "text-v3-text" : "text-v3-muted"}`}
                        >
                          {viewMode === "yearly"
                            ? period.startDate.toLocaleDateString(locale, {
                                month: "long",
                              })
                            : `${period.startDate.getDate()} ${period.startDate.toLocaleDateString(locale, { month: "short" })}`}
                        </span>
                      </div>

                      <div className="space-y-1.5 mt-2">
                        {/* Currency Totals Summary */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {Object.entries(period.totals).map(
                            ([curr, total]) =>
                              total > 0 && (
                                <div
                                  key={curr}
                                  className="flex items-center gap-1 text-[9px] font-semibold bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30"
                                >
                                  <span className="text-blue-600 dark:text-blue-300">{curr}</span>
                                  <span className="text-v3-text">
                                    {formatCurrency(total, curr)}
                                  </span>
                                </div>
                              ),
                          )}
                        </div>

                        {/* Movement List Preview */}
                        <div className="space-y-1 overflow-hidden">
                          {period.tickets.slice(0, 3).map((ticket, tIdx) => (
                            <div
                              key={tIdx}
                              className="text-[9px] leading-tight p-1.5 bg-v3-surface rounded-md border border-v3-border group-hover:border-v3-border transition-colors"
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-semibold text-blue-600 dark:text-blue-400 tracking-tighter truncate max-w-[60px]">
                                  {ticket.voucher_no}
                                </span>
                                <span className="font-semibold text-v3-text ml-1">
                                  {formatCurrency(
                                    ticket.installment?.amount ||
                                      ticket.payment?.amount ||
                                      0,
                                    ticket.installment?.currency ||
                                      ticket.payment?.currency ||
                                      ticket.currency ||
                                      "TRY",
                                  )}
                                </span>
                              </div>
                              <div className="text-v3-text font-semibold truncate mt-0.5">
                                {ticket.agent || ticket.company_name || "-"}
                              </div>
                              <div
                                className="text-[8px] text-v3-muted mt-0.5 truncate tracking-tighter"
                                title={[
                                  ticket.project_code,
                                  ticket.reference_code,
                                  ticket.route,
                                  ticket.pnr,
                                ]
                                  .filter(Boolean)
                                  .join(" • ")}
                              >
                                {[
                                  ticket.project_code,
                                  ticket.reference_code,
                                  ticket.route,
                                  ticket.pnr,
                                ]
                                  .filter(Boolean)
                                  .join(" • ") || "-"}
                              </div>
                            </div>
                          ))}
                          {period.tickets.length > 3 && (
                            <div className="text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase px-1 pt-1 flex items-center gap-1 animate-pulse">
                              <Plus className="w-2 h-2" />{" "}
                              {period.tickets.length - 3} HAREKET DAHA
                            </div>
                          )}
                          {period.tickets.length > 0 &&
                            period.tickets.length <= 3 && (
                              <div className="text-[8px] font-bold text-v3-muted uppercase px-1 pt-1 flex items-center gap-1 group-hover:text-blue-600 dark:text-blue-400 transition-colors">
                                <Plus className="w-2 h-2" /> {t('common.details') || "DETAYLAR"}
                              </div>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {isModalOpen && selectedTicket && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsModalOpen(false)}
                    className="absolute inset-0 bg-gray-950/80 backdrop-blur-md"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-v3-surface border border-v3-border rounded-[3rem] shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                  >
                    <div className="p-10 space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div
                            className={`p-5 rounded-3xl ${selectedTicket.type === "installment" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "bg-green-100 dark:bg-green-900/30 text-green-600"}`}
                          >
                            <TicketIcon className="w-8 h-8" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-v3-text tracking-tight">
                              {selectedTicket.voucher_no}
                            </h2>
                            <h3 className="font-semibold text-lg text-v3-text">
                              {selectedTicket.type === "installment"
                                ? t('ticketsCalendar.modalTitleInstallment') || "Taksit Detayı"
                                : t('ticketsCalendar.modalTitlePayment') || "Ödeme Detayı"}
                            </h3>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsModalOpen(false)}
                          className="p-3 bg-white/10 text-gray-400 rounded-2xl hover:text-red-500 transition-all"
                        >
                          <Plus className="w-6 h-6 rotate-45" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                        <div className="space-y-6">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                              {t('ticketsCalendar.lblAgentCompany') || "ACENTA / FİRMA / TEDARİKÇİ"}
                            </p>
                            <p className="text-sm font-bold text-v3-text leading-tight">
                              {selectedTicket.agent}
                              <br />
                              <span className="text-xs text-gray-500">
                                {selectedTicket.company_name || "-"}
                              </span>
                              <br />
                              <span className="text-[10px] font-black text-blue-600/50 tracking-widest">
                                {t('ticketsCalendar.lblSupplier') || "Tedarikçi:"} {selectedTicket.supplier || "-"}
                              </span>
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                                {t('home.airline') || "HAVAYOLU"}
                              </p>
                              <p className="text-[11px] font-bold text-v3-text">
                                {selectedTicket.airline || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                                {t('ticketsCalendar.lblFlightType') || "UÇUŞ TİPİ"}
                              </p>
                              <p className="text-[11px] font-bold text-v3-text">
                                {selectedTicket.flight_type || "-"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">
                              {t('ticketsCalendar.lblRoutePNR') || "GÜZERGAH / PNR"}
                            </p>
                            <p className="text-sm font-bold text-v3-text tracking-tighter">
                              {selectedTicket.route || "-"}
                              <br />
                              <span className="text-xs text-blue-600">
                                {selectedTicket.pnr || "-"}
                              </span>
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                                {t('ticketsPayments.excelPaxCount') || "YOLCU SAYISI"}
                              </p>
                              <p className="text-[11px] font-bold text-v3-text">
                                {selectedTicket.passenger_count || 0} PAX
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                                {t('ticketsCalendar.lblRegDate') || "KAYIT TARİHİ"}
                              </p>
                              <p className="text-[11px] font-bold text-v3-text">
                                {formatDate(selectedTicket.entry_date || "")}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-v3-border">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                                {t('ticketsCalendar.lblProjectCode') || "PROJE KODU"}
                              </p>
                              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                {selectedTicket.project_code || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">
                                {t('ticketsCalendar.lblRefCode') || "REF. KODU"}
                              </p>
                              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                {selectedTicket.reference_code || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-6 bg-black/5 dark:bg-white/5 p-6 rounded-[2rem]">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">
                              {t('ticketsCalendar.lblTransactionAmount') || "HAREKET TUTARI"}
                            </p>
                            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                              {formatCurrency(
                                selectedTicket.installment?.amount ||
                                  selectedTicket.payment?.amount ||
                                  0,
                                selectedTicket.installment?.currency ||
                                  selectedTicket.payment?.currency ||
                                  selectedTicket.currency ||
                                  "TRY",
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">
                              {t('ticketsCalendar.lblTotalCost') || "TOPLAM BİLET MALİYETİ"}
                            </p>
                            <p className="text-sm font-black text-v3-text">
                              {formatCurrency(
                                selectedTicket.total_cost || 0,
                                selectedTicket.currency || "TRY",
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">
                              {t('ticketsCalendar.lblTransactionDate') || "İŞLEM TARİHİ"}
                            </p>
                            <p className="text-sm font-black text-v3-text">
                              {formatDate(
                                selectedTicket.installment?.date ||
                                  selectedTicket.payment?.payment_date ||
                                  "",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="w-full py-5 bg-gray-900 dark:bg-white dark:text-gray-900 text-v3-text rounded-[2rem] font-black text-[11px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-900/20 dark:shadow-white/10"
                      >
                        {t('common.close') || "KAPAT"}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body,
          )}

        {/* Period Summary Modal */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {isPeriodModalOpen && selectedPeriod && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsPeriodModalOpen(false)}
                    className="absolute inset-0 bg-gray-950/80 backdrop-blur-md"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-3xl bg-v3-surface border border-v3-border rounded-[3rem] shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh]"
                  >
                    <div className="p-8 border-b border-v3-border flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
                          <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-[10px] font-black text-gray-400 tracking-[0.2em]">
                            {t('ticketsCalendar.lblPeriodMovements') || "DÖNEM HAREKETLERİ"}
                          </h2>
                          <p className="text-xl font-black text-v3-text">
                            {formatDate(selectedPeriod.startDate.toISOString())}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsPeriodModalOpen(false)}
                        className="p-2 bg-white/10 text-gray-400 rounded-xl hover:text-red-500 transition-all"
                      >
                        <Plus className="w-5 h-5 rotate-45" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                      {selectedPeriod.tickets.map((item, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setSelectedTicket(item);
                            setIsModalOpen(true);
                          }}
                          className="group p-5 bg-black/5 dark:bg-white/5 rounded-3xl border border-transparent hover:border-blue-500/50 hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-2xl ${item.type === "installment" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}
                            >
                              {item.type === "installment" ? (
                                <TicketIcon className="w-5 h-5" />
                              ) : (
                                <CreditCard className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 mb-0.5">
                                {item.type === "installment" ? (t('ticketsCalendar.lblInstallment') || "TAKSİT").toUpperCase() : (t('ticketsCalendar.lblPayment') || "ÖDEME").toUpperCase()}
                              </p>
                              <p className="text-sm font-black text-v3-text">
                                {item.voucher_no} • {item.agent}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-v3-text">
                              {formatCurrency(
                                item.installment?.amount || item.payment?.amount || 0,
                                item.installment?.currency ||
                                  item.payment?.currency ||
                                  item.currency ||
                                  "TRY",
                              )}
                            </p>
                            <div className="flex items-center justify-end gap-1 text-[8px] font-black text-blue-600 dark:text-blue-400 tracking-tighter mt-1">
                              {t('common.detail') || "DETAY"} <ArrowUpRight className="w-2 h-2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body,
          )}
      </div>
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
