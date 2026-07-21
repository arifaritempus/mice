"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  projectCollectionPlansService,
  projectPaymentPlansService,
  projectsService,
  ticketPaymentPlansService,
  ticketOptionsService,
} from "@/lib/supabaseService";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar as CalendarIcon,
  ArrowUpRight,
  Plus,
  X,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "lucide-react";
import Modal from "@/components/Modal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { usePermissions, Module } from "@/lib/permissions";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber, formatDate, formatCurrency } from "@/utils/formatters";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import { DateRangeFieldAccounting } from "@/components/accounting/DateRangeFieldAccounting";
import { getLogosForExcel } from "@/utils/logoUtils";

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
  type: "collection" | "payment"; // Tahsilat veya Ödeme
  collection_type?: string;
  payment_type?: string;
  hotel?: string;
  exchange_rate?: number;
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

type ViewMode = "daily" | "weekly" | "monthly" | "yearly" | "custom";

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
  status: "active" | "inactive";
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
  const [ticketPaymentPlans, setTicketPaymentPlans] = useState<
    TicketPaymentPlan[]
  >([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Arama ve Filtreleme State'leri
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  // Modal state'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CashFlowItem | null>(null);

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

  // ESC tuşu ile modal kapatma
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isModalOpen]);

  // ViewMode değiştiğinde tarih aralığını hesaplama
  useEffect(() => {
    if (viewMode === "custom") {
      // Özel modda dateStart ve dateEnd kullanıcı tarafından belirlenir
      return;
    }

    // Günlük görünümde currentDate'i kullan, diğerlerinde bugünü kullan
    const referenceDate = viewMode === "daily" ? currentDate : new Date();
    let start: Date;
    let end: Date = new Date(referenceDate);

    switch (viewMode) {
      case "daily": {
        start = new Date(referenceDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "weekly": {
        const dayOfWeek = referenceDate.getDay();
        const diff =
          referenceDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const tempDate = new Date(referenceDate);
        tempDate.setDate(diff);
        start = new Date(tempDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "monthly": {
        start = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          1,
        );
        start.setHours(0, 0, 0, 0);
        end = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth() + 1,
          0,
        );
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "yearly": {
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
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
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
          console.error("❌ Tahsilat planları yükleme hatası:", colError);
          setCollectionPlans([]);
        }

        // 2. Supabase'den ödeme planlarını çek
        try {
          const payments = await projectPaymentPlansService.getAll();
          setPaymentPlans(Array.isArray(payments) ? payments : []);
        } catch (payError) {
          console.error("❌ Ödeme planları yükleme hatası:", payError);
          setPaymentPlans([]);
        }

        // 3. Supabase'den ticket ödeme planlarını çek
        try {
          const ticketPlans = await ticketPaymentPlansService.getAll();
          const formattedTicketPlans = (
            Array.isArray(ticketPlans) ? ticketPlans : []
          ).map((plan: any) => ({
            ...plan,
            installments: Array.isArray(plan.installments)
              ? plan.installments
              : [],
          }));
          setTicketPaymentPlans(formattedTicketPlans);
        } catch (ticketPayError) {
          console.error(
            "❌ Ticket ödeme planları yükleme hatası:",
            ticketPayError,
          );
          setTicketPaymentPlans([]);
        }

        // 4. Supabase'den ticket'ları çek (bilet bilgileri için)
        try {
          const allTickets = await ticketOptionsService.getAll();
          const confirmedTickets = (Array.isArray(allTickets) ? allTickets : [])
            .filter((ticket: any) => ticket.status === "confirmed")
            .map((ticket: any) => ({
              id: ticket.id,
              voucher_no: ticket.voucher_no || "",
              agent: ticket.agent || "",
              company_name: ticket.company_name || "",
              supplier: ticket.supplier || "",
              total_cost: Number(ticket.total_cost || 0),
              currency: ticket.currency || "TRY",
              status: ticket.status || "",
              departure_date: toCalendarYmd(ticket.departure_date),
              return_date: toCalendarYmd(ticket.return_date),
            }));
          setTickets(confirmedTickets);
        } catch (ticketError) {
          console.error("❌ Ticket yükleme hatası:", ticketError);
          setTickets([]);
        }
      } catch (error) {
        console.error("❌ Genel veri yükleme hatası:", error);
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
        collectionPlans.forEach((plan) => {
          if (!plan || !plan.id) return;

          const project = plan.projects || null;
          items.push({
            id: plan.id,
            project_id: plan.project_id || "",
            project_title: project?.title || "",
            project_company: project?.company_name || "",
            project_reference: project?.reference || "",
            project_start_date: project?.start_date || "",
            project_end_date: project?.end_date || "",
            agency_name: project?.agencies?.name || "",
            hotel_name: project?.hotels?.name || "",
            date: toCalendarYmd(plan.date),
            amount: Number(plan.amount || 0),
            currency: plan.currency || "TRY",
            total_try: Number(plan.total_try || plan.totalTRY || 0),
            description: plan.description || "",
            type: "collection",
            collection_type: plan.collection_type || "",
          });
        });
      }

      // Ödeme planları
      if (Array.isArray(paymentPlans)) {
        paymentPlans.forEach((plan) => {
          if (!plan || !plan.id) return;

          const project = plan.projects || null;
          // Otel/tedarikçi bilgisini önce plan.hotel'den, sonra project.hotels.name'den al
          const hotelValue = plan.hotel || project?.hotels?.name || "";

          items.push({
            id: plan.id,
            project_id: plan.project_id || "",
            project_title: project?.title || "",
            project_company: project?.company_name || "",
            project_reference: project?.reference || "",
            project_start_date: project?.start_date || "",
            project_end_date: project?.end_date || "",
            agency_name: project?.agencies?.name || "",
            hotel_name: project?.hotels?.name || "",
            date: toCalendarYmd(plan.date),
            amount: Number(plan.amount || 0),
            currency: plan.currency || "TRY",
            total_try: Number(plan.total_try || plan.totalTRY || 0),
            description: plan.description || "",
            type: "payment",
            payment_type: plan.payment_type || "",
            hotel: hotelValue, // plan.hotel veya project.hotels.name
          });
        });
      }

      // Ticket ödeme planları (her installment ayrı bir ödeme olarak)
      if (Array.isArray(ticketPaymentPlans) && Array.isArray(tickets)) {
        ticketPaymentPlans.forEach((plan) => {
          if (
            !plan ||
            !plan.id ||
            !plan.installments ||
            plan.installments.length === 0
          )
            return;

          const ticket = tickets.find((t) => t.id === plan.ticket_id);

          plan.installments.forEach((installment: any) => {
            if (!installment || !installment.date) return;

            // Ticket'tan supplier bilgisini al (otel/tedarikçi)
            const supplier = ticket?.supplier || "";

            items.push({
              id: `ticket-${plan.id}-${installment.id}`,
              project_id: plan.ticket_id || "",
              project_title: ticket?.voucher_no || "",
              project_company: ticket?.company_name || "",
              project_reference: ticket?.voucher_no || "",
              project_start_date: toCalendarYmd(ticket?.departure_date),
              project_end_date: toCalendarYmd(ticket?.return_date),
              agency_name: ticket?.agent || "",
              hotel_name: "",
              date: toCalendarYmd(installment.date),
              amount: Number(installment.amount || 0),
              currency: installment.currency || plan.currency || "TRY",
              total_try: 0, // Ticket ödemelerinde total_try yok, hesaplanabilir ama şimdilik 0
              description: `Bilet Ödeme Planı - ${ticket?.voucher_no || ""}`,
              type: "payment",
              payment_type: "bilet",
              hotel: supplier, // Ticket ödemelerinde supplier bilgisini hotel alanına koy
            });
          });
        });
      }
    } catch (error) {
      console.error("❌ CashFlowItem oluşturma hatası:", error);
    }

    return items;
  }, [collectionPlans, paymentPlans, ticketPaymentPlans, tickets]);

  // Filtrelenmiş items
  const filteredItems = useMemo(() => {
    let filtered = cashFlowItems;

    // Arama ve Token Filtresi
    if (searchTerm || searchTokens.length > 0) {
      filtered = filtered.filter((item) => {
        const searchString = [
          item.project_title,
          item.project_company,
          item.agency_name,
          item.hotel_name,
          item.hotel,
          item.description,
          item.project_reference,
          item.collection_type,
          item.payment_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        let matchesSearch = true;

        if (searchTerm && !searchString.includes(searchTerm.toLowerCase())) {
          matchesSearch = false;
        }

        if (
          searchTokens.length > 0 &&
          !searchTokens.every((t) => searchString.includes(t.toLowerCase()))
        ) {
          matchesSearch = false;
        }

        return matchesSearch;
      });
    }

    // Tarih filtresi
    if (dateStart) {
      filtered = filtered.filter((item) => {
        const itemDate = toCalendarYmd(item.date);
        return itemDate >= dateStart;
      });
    }

    if (dateEnd) {
      filtered = filtered.filter((item) => {
        const itemDate = toCalendarYmd(item.date);
        return itemDate <= dateEnd;
      });
    }

    return filtered;
  }, [cashFlowItems, searchTerm, searchTokens, dateStart, dateEnd]);

  // Takvim görünümleri
  const generateDailyView = (date: Date): CalendarPeriod[] => {
    // Günlük görünümde tüm filteredItems'ı kullan (tarih filtresi zaten uygulanmış)
    // Sadece seçilen günün verilerini göster
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayItems = filteredItems.filter((item) => {
      if (!item.date) return false;
      const itemDate = toCalendarYmd(item.date);
      return itemDate >= dayKey(dayStart) && itemDate <= dayKey(dayEnd);
    });

    const totals = calculateTotalsByCurrency(dayItems);

    return [
      {
        startDate: date,
        endDate: date,
        items: dayItems,
        totals,
      },
    ];
  };

  const generateWeeklyView = (date: Date): CalendarPeriod[] => {
    const weekStart = new Date(date);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    weekStart.setDate(diff);

    const periods: CalendarPeriod[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);

      const dayItems = filteredItems.filter((item) => {
        const itemDate = toCalendarYmd(item.date);
        return itemDate === dayKey(dayDate);
      });

      const totals = calculateTotalsByCurrency(dayItems);

      periods.push({
        startDate: dayDate,
        endDate: dayDate,
        items: dayItems,
        totals,
      });
    }

    return periods;
  };

  const generateMonthlyView = (
    year: number,
    month: number,
  ): CalendarPeriod[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const periods: CalendarPeriod[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dayItems = filteredItems.filter((item) => {
        const itemDate = toCalendarYmd(item.date);
        return itemDate === dayKey(date);
      });

      const totals = calculateTotalsByCurrency(dayItems);

      periods.push({
        startDate: date,
        endDate: date,
        items: dayItems,
        totals,
      });
    }

    return periods;
  };

  const generateYearlyView = (year: number): CalendarPeriod[] => {
    const periods: CalendarPeriod[] = [];

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      const monthItems = filteredItems.filter((item) => {
        const itemDate = toCalendarYmd(item.date);
        return itemDate >= dayKey(monthStart) && itemDate <= dayKey(monthEnd);
      });

      const totals = calculateTotalsByCurrency(monthItems);

      periods.push({
        startDate: monthStart,
        endDate: monthEnd,
        items: monthItems,
        totals,
      });
    }

    return periods;
  };

  // Döviz cinslerine göre toplam hesaplama
  const calculateTotalsByCurrency = (items: CashFlowItem[]) => {
    return items.reduce(
      (acc, item) => {
        const currency = item.currency || "TRY";
        const key = currency as keyof typeof acc;

        if (!acc[key]) {
          acc[key] = { collection: 0, payment: 0 };
        }

        if (item.type === "collection") {
          acc[key].collection += item.amount || 0;
        } else {
          acc[key].payment += item.amount || 0;
        }

        return acc;
      },
      {
        TRY: { collection: 0, payment: 0 },
        USD: { collection: 0, payment: 0 },
        EUR: { collection: 0, payment: 0 },
        GBP: { collection: 0, payment: 0 },
      } as {
        TRY: { collection: number; payment: number };
        USD: { collection: number; payment: number };
        EUR: { collection: number; payment: number };
        GBP: { collection: number; payment: number };
      },
    );
  };

  // Takvim verisi
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
      case "custom": {
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
          end.setTime(start.getTime() + 730 * 24 * 60 * 60 * 1000);
        }

        // filteredItems'ı tarih bazında grupla (performans optimizasyonu)
        // Bu sayede her gün için filter işlemi yapmak yerine direkt Map'ten alıyoruz
        const itemsByDate = new Map<string, CashFlowItem[]>();
        filteredItems.forEach((item) => {
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
            console.warn("Geçersiz tarih:", item.date);
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
            totals,
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
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency || "TRY",
    }).format(amount || 0);
  };

  // Tarih formatı
  const formatDate = (dateValue: string | Date) => {
    if (dateValue instanceof Date) return dateValue.toLocaleDateString("tr-TR");
    const parsed = parseCalendarDate(dateValue);
    return parsed ? parsed.toLocaleDateString("tr-TR") : "-";
  };

  // Takvim navigasyonu
  const goToPreviousPeriod = () => {
    setCurrentDate((prev) => {
      switch (viewMode) {
        case "daily":
          return new Date(prev.getTime() - 24 * 60 * 60 * 1000);
        case "weekly":
          return new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "monthly":
          return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
        case "yearly":
          return new Date(prev.getFullYear() - 1, 0, 1);
        default:
          return prev;
      }
    });
  };

  const goToNextPeriod = () => {
    setCurrentDate((prev) => {
      switch (viewMode) {
        case "daily":
          return new Date(prev.getTime() + 24 * 60 * 60 * 1000);
        case "weekly":
          return new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000);
        case "monthly":
          return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
        case "yearly":
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
      case "daily":
        return currentDate.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      case "weekly":
        const weekStart = new Date(currentDate);
        const dayOfWeek = currentDate.getDay();
        const diff =
          currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        weekStart.setDate(diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}`;
      case "monthly":
        return currentDate.toLocaleDateString("tr-TR", {
          month: "long",
          year: "numeric",
        });
      case "yearly":
        return currentDate.getFullYear().toString();
      case "custom":
        if (dateStart && dateEnd) {
          const start = parseCalendarDate(dateStart);
          const end = parseCalendarDate(dateEnd);
          if (!start || !end) return "Özel Tarih Aralığı";
          return `${start.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}`;
        }
        return "Özel Tarih Aralığı";
      default:
        return "";
    }
  };
  // Excel Export
  const exportCashFlowExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Nakit Akışı");
    sheet.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      paperSize: 9,
      margins: {
        left: 0.2,
        right: 0.2,
        top: 0.3,
        bottom: 0.3,
        header: 0.1,
        footer: 0.1,
      },
    } as any;

    // Header band
    const top = sheet.addRow([]);
    top.height = 48;
    sheet.mergeCells("A1:L1");
    for (let c = 1; c <= 12; c++) {
      sheet.getRow(1).getCell(c).value = "";
      sheet.getRow(1).getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF232F38" },
      } as any;
    }

    // Logos
    const { iconLogoBase64, wordmarkLogoBase64, iconWidth, iconHeight, wordmarkWidth, wordmarkHeight } = await getLogosForExcel(true);
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
        tl: { col: 10.2, row: 0.23 },
        ext: { width: (typeof iconWidth !== "undefined" ? iconWidth : 120), height: (typeof iconHeight !== "undefined" ? iconHeight : 60) } as any,
      } as any);
    }

    const columns = [
      { header: "TARİH", key: "date", width: 14 },
      { header: "TÜR", key: "type", width: 12 },
      { header: "KATEGORİ", key: "category", width: 15 },
      { header: "PROJE / BİLET", key: "project", width: 25 },
      { header: "FİRMA / ACENTE", key: "company", width: 25 },
      { header: "REFERANS", key: "reference", width: 18 },
      { header: "OTEL / TEDARİKÇİ", key: "hotel", width: 25 },
      { header: "AÇIKLAMA", key: "description", width: 30 },
      { header: "TUTAR", key: "amount", width: 16 },
      { header: "DÖVİZ", key: "currency", width: 10 },
      { header: "KUR", key: "rate", width: 10 },
      { header: "TOPLAM (TRY)", key: "total_try", width: 18 },
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

    // Data rows
    const data = [...filteredItems].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    data.forEach((item) => {
      const row = sheet.addRow({
        date: item.date ? new Date(item.date).toLocaleDateString("tr-TR") : "",
        type: item.type === "collection" ? "Tahsilat" : "Ödeme",
        category:
          item.type === "collection"
            ? item.collection_type || "-"
            : item.payment_type || "-",
        project: item.project_title || "-",
        company: item.project_company || item.agency_name || "-",
        reference: item.project_reference || "-",
        hotel: item.hotel || item.hotel_name || "-",
        description: item.description || "-",
        amount: item.amount,
        currency: item.currency,
        rate: item.exchange_rate || 0,
        total_try: item.total_try || 0,
      });

      row.getCell("amount").numFmt = "#,##0.00";
      row.getCell("total_try").numFmt = "#,##0.00";
      row.getCell("rate").numFmt = "#,##0.0000";

      row.getCell("amount").alignment = { horizontal: "right" };
      row.getCell("total_try").alignment = { horizontal: "right" };
      row.getCell("rate").alignment = { horizontal: "right" };

      row.eachCell((cell) => {
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
    link.download = `nakit_akisi_${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (!canView(Module.CASH_FLOW)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text glow-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </p>
          <a
            href="/"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
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
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      {/* Premium Sticky Header */}
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2 shrink-0">
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
              Nakit Akışı Takvimi
            </h1>
            <p className="text-xs text-v3-muted mt-1">
              Takvim üzerinden nakit akışınızı yönetin
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            <div className="flex items-center h-10 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-v3-border shrink-0 min-w-[200px]">
              <button
                onClick={goToPreviousPeriod}
                className="p-1.5 text-v3-muted hover:text-v3-text rounded-lg hover:bg-v3-surface transition-all shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center flex items-center justify-center">
                <span className="text-[11px] font-semibold text-v3-text uppercase tracking-wider">
                  {getViewTitle()}
                </span>
              </div>
              <button
                onClick={goToNextPeriod}
                className="p-1.5 text-v3-muted hover:text-v3-text rounded-lg hover:bg-v3-surface transition-all shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex h-10 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-v3-border shrink-0">
              {(["daily", "weekly", "monthly", "yearly"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 rounded-lg text-[10px] font-semibold transition-all uppercase flex items-center justify-center ${viewMode === mode ? "bg-v3-primary text-white shadow-md shadow-v3-primary/30 scale-105" : "text-v3-muted hover:text-v3-text hover:bg-black/10 dark:hover:bg-white/10"}`}
                  >
                    {mode === "daily"
                      ? "GÜN"
                      : mode === "weekly"
                        ? "HAFTA"
                        : mode === "monthly"
                          ? "AY"
                          : "YIL"}
                  </button>
                ),
              )}
            </div>

            <div className="flex-[2] min-w-[300px]">
              <MultiTokenFilterInput
                label="GENEL ARAMA (VOUCHER, PNR, FİRMA VB.)"
                tokens={searchTokens}
                inputValue={searchTerm}
                suggestions={[]}
                onInputChange={setSearchTerm}
                onAddToken={(val) => {
                  const trimmed = val.trim();
                  if (trimmed && !searchTokens.includes(trimmed)) {
                    setSearchTokens((prev) => [...prev, trimmed]);
                    setSearchTerm("");
                  }
                }}
                onRemoveToken={(val) =>
                  setSearchTokens((prev) => prev.filter((t) => t !== val))
                }
              />
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSearchTokens([]);
                  setViewMode("monthly");
                  setCurrentDate(new Date());
                }}
                className="w-10 h-10 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
                title="Filtreleri Temizle"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => exportCashFlowExcel()}
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] px-4 h-10 rounded-xl transition-all duration-300 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 uppercase"
              >
                <Download size={14} /> Excel İndir
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-v3-border overflow-hidden shadow-inner flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Currency Perspective Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "TRY", key: "TRY", color: "blue" },
                { label: "EUR", key: "EUR", color: "emerald" },
                { label: "USD", key: "USD", color: "indigo" },
                { label: "GBP", key: "GBP", color: "amber" },
              ].map((curr) => (
                <motion.div
                  key={curr.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-v3-surface backdrop-blur-md rounded-3xl border border-v3-border p-5 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg bg-${curr.color}-50 dark:bg-${curr.color}-900/30 text-${curr.color}-600 dark:text-${curr.color}-400 border border-${curr.color}-100 dark:border-${curr.color}-800`}
                      >
                        {curr.label} TOPLAM
                      </span>
                      <div
                        className={`p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-v3-muted group-hover:text-${curr.color}-500 transition-colors`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-v3-muted">
                          TAHSİLAT
                        </span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(
                            allPeriodTotals[
                              curr.key as keyof typeof allPeriodTotals
                            ].collection,
                            curr.key,
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-v3-muted">
                          ÖDEME
                        </span>
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                          {formatCurrency(
                            allPeriodTotals[
                              curr.key as keyof typeof allPeriodTotals
                            ].payment,
                            curr.key,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`absolute -right-4 -bottom-4 w-20 h-20 bg-${curr.color}-500/5 rounded-full blur-2xl group-hover:bg-${curr.color}-500/10 transition-all`}
                  />
                </motion.div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[600px] flex flex-col mb-8">
              {(viewMode === "monthly" ||
                viewMode === "weekly" ||
                viewMode === "custom") && (
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  {[
                    "Pazartesi",
                    "Salı",
                    "Çarşamba",
                    "Perşembe",
                    "Cuma",
                    "Cumartesi",
                    "Pazar",
                  ].map((day) => (
                    <div key={day} className="py-4 text-center">
                      <span className="text-[10px] font-black text-v3-muted uppercase tracking-[0.2em]">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={`grid flex-1 ${
                  viewMode === "daily"
                    ? "grid-cols-1"
                    : viewMode === "weekly"
                      ? "grid-cols-7"
                      : viewMode === "yearly"
                        ? "grid-cols-4"
                        : viewMode === "custom"
                          ? "grid-cols-7"
                          : "grid-cols-7"
                }`}
              >
                {calendarData.map((period, idx) => {
                  const isToday =
                    period.startDate.toDateString() ===
                    new Date().toDateString();
                  const isCurrentPeriod =
                    viewMode === "monthly"
                      ? period.startDate.getMonth() === currentDate.getMonth()
                      : viewMode === "yearly"
                        ? period.startDate.getMonth() ===
                            new Date().getMonth() &&
                          period.startDate.getFullYear() ===
                            new Date().getFullYear()
                        : viewMode === "custom"
                          ? true
                          : period.startDate.toDateString() ===
                            new Date().toDateString();

                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.005 }}
                      key={idx}
                      onClick={() => {
                        if (period.items.length > 0) {
                          setSelectedPeriod(period);
                          setIsPeriodModalOpen(true);
                        }
                      }}
                      className={`min-h-[160px] p-5 border-r border-b border-gray-100 dark:border-gray-800 group relative transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                        !isCurrentPeriod && viewMode === "monthly"
                          ? "bg-gray-50/10 dark:bg-gray-900/10 opacity-30"
                          : "bg-white dark:bg-gray-900"
                      } ${isToday ? "bg-blue-500/10/20 dark:bg-blue-900/5 ring-1 ring-inset ring-blue-500/20" : ""}`}
                    >
                      <div className="absolute inset-0 border border-gray-100 dark:border-gray-800/50 m-2 rounded-3xl group-hover:border-blue-500/20 transition-all" />
                      <div className="relative flex justify-between items-start mb-4">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${
                            isToday
                              ? "px-2 py-1 bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/30"
                              : isCurrentPeriod || viewMode === "yearly"
                                ? "text-v3-text glow-text"
                                : "text-v3-muted/50 dark:text-v3-muted/30"
                          }`}
                        >
                          {viewMode === "yearly"
                            ? period.startDate.toLocaleDateString("tr-TR", {
                                month: "long",
                              })
                            : `${period.startDate.getDate()} ${period.startDate.toLocaleDateString("tr-TR", { month: "short" })}`}
                        </span>
                      </div>

                      <div className="space-y-1.5 mt-2">
                        {/* Currency Totals Summary */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {["TRY", "USD", "EUR", "GBP"].map((curr) => {
                            const coll =
                              period.totals[curr as keyof typeof period.totals]
                                .collection;
                            const pay =
                              period.totals[curr as keyof typeof period.totals]
                                .payment;

                            if (coll === 0 && pay === 0) return null;

                            return (
                              <div
                                key={curr}
                                className="flex flex-col gap-0.5 w-full"
                              >
                                {coll > 0 && (
                                  <div className="flex items-center gap-1 text-[8px] font-black bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-md border border-emerald-100/50 dark:border-emerald-800/30 w-full justify-between">
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                                      <TrendingUp className="w-2 h-2 mr-0.5" />{" "}
                                      {curr}
                                    </span>
                                    <span className="text-v3-text glow-text">
                                      {formatCurrency(coll, curr)}
                                    </span>
                                  </div>
                                )}
                                {pay > 0 && (
                                  <div className="flex items-center gap-1 text-[8px] font-black bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded-md border border-rose-100/50 dark:border-rose-800/30 w-full justify-between">
                                    <span className="text-rose-600 dark:text-rose-400 flex items-center">
                                      <TrendingDown className="w-2 h-2 mr-0.5" />{" "}
                                      {curr}
                                    </span>
                                    <span className="text-v3-text glow-text">
                                      {formatCurrency(pay, curr)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Movement List Preview */}
                        <div className="space-y-1 overflow-hidden">
                          {period.items.slice(0, 3).map((item, tIdx) => (
                            <div
                              key={tIdx}
                              className={`text-[9px] leading-tight p-1.5 rounded-lg border group-hover:border-blue-500/30 transition-colors ${
                                item.type === "collection"
                                  ? "bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-800/30"
                                  : "bg-rose-50/30 dark:bg-rose-900/10 border-rose-100/50 dark:border-rose-800/30"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span
                                  className={`font-black tracking-tighter truncate max-w-[60px] ${item.type === "collection" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                                >
                                  {item.project_title || "İşlem"}
                                </span>
                                <span className="font-black text-v3-text glow-text ml-1">
                                  {formatCurrency(item.amount, item.currency)}
                                </span>
                              </div>
                              <div className="text-v3-muted font-bold truncate">
                                {item.type === "collection"
                                  ? item.project_company ||
                                    item.agency_name ||
                                    "Bireysel"
                                  : item.hotel ||
                                    item.hotel_name ||
                                    "Tedarikçi"}
                              </div>
                              <div className="text-[8px] text-v3-muted mt-0.5 truncate tracking-tighter">
                                {item.description ||
                                  item.collection_type ||
                                  item.payment_type ||
                                  "-"}
                              </div>
                            </div>
                          ))}
                          {period.items.length > 3 && (
                            <div className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase px-1 pt-1 flex items-center gap-1 animate-pulse">
                              <Plus className="w-2 h-2" />{" "}
                              {period.items.length - 3} HAREKET DAHA
                            </div>
                          )}
                          {period.items.length > 0 &&
                            period.items.length <= 3 && (
                              <div className="text-[8px] font-black text-v3-muted uppercase px-1 pt-1 flex items-center gap-1 group-hover:text-blue-600 dark:text-blue-400 transition-colors">
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
          </div>
        </main>

        {/* Modern Detail Modal */}
        <Modal
          isOpen={isModalOpen && !!selectedItem}
          onClose={() => setIsModalOpen(false)}
          title={
            selectedItem?.type === "collection"
              ? "TAHSİLAT DETAYI"
              : "ÖDEME DETAYI"
          }
          maxWidth="max-w-2xl"
        >
          {selectedItem && (
            <div className="flex flex-col space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-4 rounded-3xl ${selectedItem.type === "collection" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600" : "bg-rose-50 dark:bg-rose-900/30 text-rose-600"}`}
                  >
                    {selectedItem.type === "collection" ? (
                      <TrendingUpIcon className="w-8 h-8" />
                    ) : (
                      <TrendingDownIcon className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-v3-muted uppercase tracking-widest leading-none mb-1">
                      İŞLEM TUTARI
                    </p>
                    <p
                      className={`text-3xl font-black tracking-tight ${selectedItem.type === "collection" ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {formatCurrency(
                        selectedItem.amount,
                        selectedItem.currency,
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-blue-500/10 dark:bg-blue-900/20 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/50">
                    #{selectedItem.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-8 gap-x-12 py-8 border-y border-gray-100 dark:border-gray-800 responsive-filter-grid">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-v3-muted uppercase tracking-widest">
                    İLGİLİ PROJE / REFERANS
                  </p>
                  <p className="text-sm font-black text-v3-text glow-text leading-snug">
                    {selectedItem.project_title || "Genel İşlem"}
                  </p>
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                    {selectedItem.project_reference || "REF YOK"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-v3-muted bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-v3-border">
                      {formatDate(selectedItem.project_start_date)} -{" "}
                      {formatDate(selectedItem.project_end_date)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-v3-muted uppercase tracking-widest">
                    {selectedItem.type === "collection"
                      ? "MÜŞTERİ / ACENTE"
                      : "OTEL / TEDARİKÇİ"}
                  </p>
                  <p className="text-sm font-black text-v3-text glow-text leading-snug">
                    {selectedItem.type === "collection"
                      ? selectedItem.project_company ||
                        selectedItem.agency_name ||
                        "Bireysel"
                      : selectedItem.hotel ||
                        selectedItem.hotel_name ||
                        "Tanımlanmamış"}
                  </p>
                  {selectedItem.type === "collection" &&
                    selectedItem.agency_name &&
                    selectedItem.agency_name !==
                      selectedItem.project_company && (
                      <p className="text-[10px] font-bold text-v3-muted">
                        {selectedItem.agency_name}
                      </p>
                    )}
                  {selectedItem.type === "payment" &&
                    selectedItem.hotel_name &&
                    selectedItem.hotel_name !== selectedItem.hotel && (
                      <p className="text-[10px] font-bold text-v3-muted">
                        {selectedItem.hotel_name}
                      </p>
                    )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-v3-muted uppercase tracking-widest">
                    PLANLANAN TARİH
                  </p>
                  <div className="flex items-center text-sm font-black text-v3-text glow-text">
                    <CalendarIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                    {formatDate(selectedItem.date)}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-v3-muted uppercase tracking-widest">
                    İŞLEM TÜRÜ / KUR
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <span
                      className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        selectedItem.type === "collection"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                      }`}
                    >
                      {selectedItem.collection_type ||
                        selectedItem.payment_type ||
                        "KATEGORİSİZ"}
                    </span>
                    {selectedItem.exchange_rate > 1 && (
                      <span className="text-[10px] font-bold text-v3-muted">
                        Kur: 1 {selectedItem.currency} ={" "}
                        {selectedItem.exchange_rate.toFixed(4)} TRY
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-3xl border border-gray-100 dark:border-v3-border">
                  <p className="text-[10px] font-black text-v3-muted uppercase tracking-widest mb-2">
                    AÇIKLAMA VE NOTLAR
                  </p>
                  <p className="text-sm text-v3-text font-bold leading-relaxed">
                    {selectedItem.description ||
                      "Bu işlem için ek bir açıklama girilmemiş."}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2">
                  {selectedItem.project_id && (
                    <button className="px-6 py-3 bg-v3-surface text-v3-text rounded-2xl text-[10px] font-black hover:bg-blue-500 hover:text-white transition-all uppercase tracking-widest">
                      PROJEYE GİT
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl text-[10px] font-black shadow-xl hover:scale-105 transition-all active:scale-95 uppercase tracking-widest"
                >
                  KAPAT
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Daily Summary Modal */}
        <Modal
          isOpen={isPeriodModalOpen && !!selectedPeriod}
          onClose={() => setIsPeriodModalOpen(false)}
          title="GÜNLÜK ÖZET"
          maxWidth="max-w-3xl"
        >
          {selectedPeriod && (
            <div className="flex flex-col space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 rounded-3xl">
                  <CalendarIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-v3-muted uppercase tracking-widest leading-none mb-1">
                    DÖNEM TARİHİ
                  </p>
                  <p className="text-2xl font-black text-v3-text glow-text tracking-tight">
                    {selectedPeriod.startDate
                      ? formatDate(selectedPeriod.startDate)
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {["TRY", "USD", "EUR", "GBP"].map((curr) => {
                  const coll =
                    selectedPeriod.totals[
                      curr as keyof typeof selectedPeriod.totals
                    ].collection;
                  const pay =
                    selectedPeriod.totals[
                      curr as keyof typeof selectedPeriod.totals
                    ].payment;

                  return (
                    <div
                      key={curr}
                      className="bg-v3-surface backdrop-blur-md p-4 rounded-2xl border border-v3-border shadow-sm space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-[10px] font-bold text-v3-muted uppercase tracking-widest">
                          {curr} ÖZETİ
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-emerald-500">
                            TAHSİLAT
                          </span>
                          <span className="text-sm font-black text-v3-text glow-text">
                            {formatCurrency(coll, curr)}
                          </span>
                        </div>
                        <div className="h-[1px] w-full bg-v3-border" />
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-rose-500">
                            ÖDEME
                          </span>
                          <span className="text-sm font-black text-v3-text glow-text">
                            {formatCurrency(pay, curr)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-4 pt-4">
                <p className="text-[10px] font-black text-v3-muted uppercase tracking-widest">
                  İŞLEM LİSTESİ
                </p>
                <div className="space-y-3">
                  {selectedPeriod.items.length > 0 ? (
                    selectedPeriod.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item);
                          setIsModalOpen(true);
                        }}
                        className={`group p-5 rounded-3xl border cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${
                          item.type === "collection"
                            ? "bg-v3-surface backdrop-blur-md/50 border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-500"
                            : "bg-v3-surface backdrop-blur-md/50 border-rose-100 dark:border-rose-800/50 hover:border-rose-500"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                item.type === "collection"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                              }`}
                            >
                              {item.collection_type ||
                                item.payment_type ||
                                "İŞLEM"}
                            </span>
                            <span className="text-[10px] font-bold text-v3-muted">
                              #{item.id.slice(0, 8)}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-black ${item.type === "collection" ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {formatCurrency(item.amount, item.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-v3-text glow-text truncate">
                              {item.project_title || "Genel İşlem"}
                            </p>
                            <p className="text-[10px] font-bold text-v3-muted truncate">
                              {item.type === "collection"
                                ? item.project_company ||
                                  item.agency_name ||
                                  "Bireysel"
                                : item.hotel ||
                                  item.hotel_name ||
                                  "Tedarikçi"}{" "}
                              • {item.description || "Açıklama yok"}
                            </p>
                          </div>
                          <ArrowUpRight className="w-5 h-5 text-v3-muted group-hover:text-blue-600 dark:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-v3-muted font-bold uppercase text-[10px] tracking-widest">
                        Bu tarihte herhangi bir işlem bulunamadı.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  onClick={() => setIsPeriodModalOpen(false)}
                  className="px-10 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl text-[10px] font-black shadow-xl hover:scale-105 transition-all uppercase tracking-widest"
                >
                  KAPAT
                </button>
              </div>
            </div>
          )}
        </Modal>
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
