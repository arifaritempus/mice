"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Landmark,
  Award,
  Target,
  Calendar,
  RefreshCw,
  Hotel,
  Plane,
  Bus,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Briefcase,
  Ticket,
  PartyPopper,
  Filter,
  Maximize2,
  X,
  Building2,
} from "lucide-react";
import {
  agenciesService,
  categoriesService,
  hotelsService,
  projectCollectionPlansService,
  projectPaymentPlansService,
  projectsService,
  projectTransfersService,
  quotesService,
  SejourService,
  suppliersService,
  marketingService,
  usersService,
  projectUsersService,
} from "@/lib/supabaseService";
import { supabase } from "@/lib/supabase";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

import CalendarComponent from "react-calendar";
import "react-calendar/dist/Calendar.css";

// --- CountUp Component ---
const CountUp = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  language = "tr",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  language?: string;
}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 1500;
    let startTime: null | number = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(progress * (end - start) + start);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [value]);
  return (
    <span>
      {prefix}
      {new Intl.NumberFormat(language === "en" ? "en-US" : "tr-TR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(count)}
      {suffix}
    </span>
  );
};

// --- Formatters ---
const formatMoney = (n: number, language: string = "tr") =>
  new Intl.NumberFormat(language === "en" ? "en-US" : "tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n || 0);
const formatInt = (n: number, language: string = "tr") => new Intl.NumberFormat(language === "en" ? "en-US" : "tr-TR").format(n || 0);
const parseDateSafe = (value: any) => {
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

type PeriodFilter = "today" | "week" | "month" | "lastMonth" | "year" | "lastYear" | "custom" | "all";

const getPeriodRange = (
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string,
) => {
  if (period === "all") {
    return { start: new Date("2000-01-01"), end: new Date("2099-12-31") };
  }
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === "lastMonth") {
    start.setMonth(now.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(now.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === "lastYear") {
    start.setFullYear(now.getFullYear() - 1, 0, 1);
    start.setHours(0, 0, 0, 0);
    end.setFullYear(now.getFullYear() - 1, 11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === "custom" && customStart && customEnd) {
    const cs = parseDateSafe(customStart);
    const ce = parseDateSafe(customEnd);
    if (cs && ce) {
      cs.setHours(0, 0, 0, 0);
      ce.setHours(23, 59, 59, 999);
      return { start: cs, end: ce };
    }
  }
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  end.setMonth(start.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const inRange = (value: any, range: { start: Date; end: Date }) => {
  const dt = parseDateSafe(value);
  if (!dt) return false;
  return dt >= range.start && dt <= range.end;
};

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#d946ef",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
];

// --- Chart Custom Tooltips ---
const CustomTooltip = ({ active, payload, label, language = "tr", t = (k: any) => k }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Check if data is an object with our custom fields (Ciro, Maliyet, Kar/Zarar, Marj vb.)
    // If it has them, render all relevant fields.
    // Otherwise fallback to default payload.map
    
    // Check for our custom fields (from hotelData, agencyData, projectEfficiencyData, sejourEfficiencyData)
    if (data && ('Ciro' in data || 'Satış' in data || 'Maliyet' in data || 'Kar/Zarar' in data || 'Adet' in data)) {
      const formatMoneySafe = (val: any) => formatMoney(val, language);
      return (
        <div className="bg-v3-surface backdrop-blur-md border border-v3-border p-3 rounded-xl shadow-lg z-50 relative min-w-[150px]">
          <p className="text-v3-text font-bold mb-2 pb-2 border-b border-v3-border">{label}</p>
          {('Proje Ref' in data) && <p className="text-v3-text/90 text-[11px] flex justify-between gap-4 font-mono mb-1"><span>{t('dashboard.projectRef') || "Ref:"}</span> <span>{data['Proje Ref']}</span></p>}
          {('Firma' in data) && <p className="text-v3-text/90 text-[11px] flex justify-between gap-4 font-mono mb-1"><span>{t('home.company') || "Firma:"}</span> <span className="truncate max-w-[120px]">{data['Firma']}</span></p>}
          {('Tarih' in data) && <p className="text-v3-text/90 text-[11px] flex justify-between gap-4 font-mono mb-2 border-b border-v3-border pb-2"><span>{t('home.date') || "Tarih:"}</span> <span>{data['Tarih']}</span></p>}
          {('Ciro' in data) && <p className="text-emerald-600 dark:text-emerald-400 text-[11px] flex justify-between gap-4 font-mono"><span>{t('dashboard.totalRevShort') || "Ciro:"}</span> <span>{formatMoneySafe(data['Ciro'])}</span></p>}
          {('Satış' in data) && <p className="text-emerald-600 dark:text-emerald-400 text-[11px] flex justify-between gap-4 font-mono"><span>{t('dashboard.sales') || "Satış:"}</span> <span>{formatMoneySafe(data['Satış'])}</span></p>}
          {('Maliyet' in data) && <p className="text-rose-600 dark:text-rose-400 text-[11px] flex justify-between gap-4 font-mono"><span>{t('dashboard.totalCostShort') || "Maliyet:"}</span> <span>{formatMoneySafe(data['Maliyet'])}</span></p>}
          {('Kar/Zarar' in data) && <p className={`text-[11px] flex justify-between gap-4 font-mono ${(data['Kar/Zarar'] || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}><span>{t('dashboard.profitLoss') || "Kar/Zarar:"}</span> <span>{formatMoneySafe(data['Kar/Zarar'])}</span></p>}
          {('Kar' in data) && <p className={`text-[11px] flex justify-between gap-4 font-mono ${(data['Kar'] || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}><span>{t('dashboard.profit') || "Kâr:"}</span> <span>{formatMoneySafe(data['Kar'])}</span></p>}
          {('Marj' in data) && <p className="text-amber-600 dark:text-amber-400 text-[11px] flex justify-between gap-4 font-mono"><span>{t('dashboard.margin') || "Marj:"}</span> <span>%{data['Marj']}</span></p>}
          {('Adet' in data) && <p className="text-cyan-600 dark:text-cyan-400 text-[11px] flex justify-between gap-4 font-mono"><span>{t('dashboard.count') || "Adet:"}</span> <span>{data['Adet']}</span></p>}
          {('value' in data && !('Ciro' in data) && !('Adet' in data)) && <p className="text-v3-text text-[11px] flex justify-between gap-4 font-mono"><span>{t('dashboard.value') || "Değer:"}</span> <span>{data['value']}</span></p>}
        </div>
      );
    }

    return (
      <div className="bg-v3-surface backdrop-blur-md border border-v3-border p-3 rounded-xl shadow-lg z-50 relative">
        <p className="text-v3-text font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          const isMoney =
            [
              "Tahsilat",
              "Ödeme",
              "Ciro",
              "Kâr",
              "Maliyet",
              "Satis",
              "Satış",
              "Kar/Zarar",
              "Hacim",
              "Tutar",
            ].includes(entry.name) || String(entry.name).includes("TRY");
          return (
            <p key={index} className="text-sm flex items-center gap-2 font-mono">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="text-v3-text/90">{entry.name}:</span>
              <span className="text-v3-text font-bold">
                {isMoney ? formatMoney(entry.value, language) : formatInt(entry.value, language)}
              </span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

// --- Components ---
const GlassCard = ({ children, className = "", glowColor = "", onExpand = null }: any) => (
  <div
    className={`relative bg-white dark:bg-v3-surface rounded-3xl overflow-visible shadow-lg border border-slate-100 dark:border-v3-border group ${className}`}
  >
    {glowColor && (
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 bg-${glowColor}-500/20 blur-3xl rounded-full pointer-events-none`}
      />
    )}
      {onExpand && (
      <button onClick={onExpand} className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-v3-border/50 hover:bg-white dark:hover:bg-v3-surface rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm border border-slate-200 dark:border-v3-border" title="Tam Ekran Göster">
        <Maximize2 size={16} className="text-v3-text" />
      </button>
    )}
    {children}
  </div>
);

const KPICard = ({
  title,
  value,
  icon: Icon,
  color,
  isMoney = false,
  suffix = "",
  decimals = 0,
  trend,
  language = "tr",
}: any) => {
  const colors: Record<string, string> = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/20 border-blue-500/30",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-500/20 border-rose-500/30",
    fuchsia: "text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/20 border-fuchsia-500/30",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/20 border-amber-500/30",
    violet: "text-violet-600 dark:text-violet-400 bg-violet-500/20 border-violet-500/30",
    cyan: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/20 border-cyan-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-v3-surface p-5 flex flex-col justify-between relative overflow-hidden group shadow-lg border border-slate-100 dark:border-v3-border rounded-3xl`}
    >
      <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={100} />
      </div>
      <div className="flex justify-between items-start z-10">
        <div
          className={`p-2.5 rounded-xl ${colors[color] || colors.blue} shadow-[0_4px_15px_rgba(0,0,0,0.02)]`}
        >
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${trend >= 0 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"}`}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4 z-10">
        <p className="text-[9px] font-black text-v3-muted uppercase tracking-widest leading-tight">
          {title}
        </p>
        <h4 className="text-xl lg:text-2xl font-black text-v3-text mt-1 tracking-tight truncate">
          {isMoney ? (
            <CountUp value={value} prefix="₺" decimals={decimals} language={language} />
          ) : (
            <CountUp value={value} suffix={suffix} decimals={decimals} language={language} />
          )}
        </h4>
      </div>
    </motion.div>
  );
};

export default function UltimateDashboard() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("year");
  const [customDate, setCustomDate] = useState({ start: "", end: "" });
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState("Tümü");
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);

  const getFullscreenTitle = (chartId: string | null) => {
    switch (chartId) {
      case 'funnel': return t('dashboard.funnelTitle' as any) || "SATIS HUNISI";
      case 'agency': return t('dashboard.agencyTop10' as any) || "EN YÜKSEK 10 ACENTE";
      case 'hotel': return t('dashboard.hotelRevenue' as any) || "EN YÜKSEK 10 OTEL";
      case 'projEff': return t('dashboard.projEff' as any) || "PROJE EKİP VERİMLİLİĞİ";
      case 'sejEff': return t('dashboard.sejEff' as any) || "SEJOUR EKİP VERİMLİLİĞİ";
      case 'supplier': return t('dashboard.supplierCost' as any) || "TEDARİKÇİ MALİYETLERİ";
      case 'airline': return t('dashboard.airlineDistribution' as any) || "HAVAYOLU DAĞILIMI";
      case 'vehicle': return t('dashboard.vehicleUsage' as any) || "ARAÇ TİPİ KULLANIMI";
      case 'transferSupplier': return t('dashboard.transferSuppliers' as any) || "TRANSFER TEDARİKÇİ DAĞILIMI";
      case 'conversion': return t('dashboard.conversionChart' as any) || "TEKLİF & PROJE DÖNÜŞÜM GRAFİĞİ";
      default: return t('dashboard.fullscreenView' as any) || "TAM EKRAN GÖRÜNÜM";
    }
  };


  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState<"month"|"year"|"decade"|"century">("month");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSelectedCalendarDate(null); setFullscreenChart(null); }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    const now = new Date();
    if (period === "month") {
      setCalendarViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
      setCalendarViewMode("month");
    } else if (period === "lastMonth") {
      setCalendarViewDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      setCalendarViewMode("month");
    } else if (period === "year") {
      setCalendarViewDate(new Date(now.getFullYear(), 0, 1));
      setCalendarViewMode("year");
    } else if (period === "lastYear") {
      setCalendarViewDate(new Date(now.getFullYear() - 1, 0, 1));
      setCalendarViewMode("year");
    } else if (period === "all") {
      setCalendarViewMode("year");
    }
  }, [period]);

  const [data, setData] = useState<any>({
    rpProjectRows: [],
    rpSejourRows: [],
    collectionPlans: [],
    paymentPlans: [],
    marketingInteractions: [],
    quotes: [],
    projects: [],
    salesItems: [],
    purchaseItems: [],
    categories: [],
    agencies: [],
    sejours: [],
    transfers: [],
    flights: [],
    hrRows: [],
    accommodations: [],
    hotels: [],
    suppliers: [],
    events: [],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const fetchView = async (v: string) =>
        (await supabase.from(v).select("*")).data || [];

      const [
        rpProj,
        rpSej,
        cols,
        pays,
        mkt,
        qts,
        prj,
        sales,
        purch,
        cats,
        agn,
        sejs,
        allUsers,
        trns,
        flg,
        hr,
        htl,
        sup,
        evts,
        accs,
        projUsersData,
      ] = await Promise.all([
        fetchView("vw_rp_proje_satis_maliyet"),
        fetchView("vw_rp_sejour_kar_zarar"),
        projectCollectionPlansService.getAll(),
        projectPaymentPlansService.getAll(),
        marketingService.interactions.getAll(),
        quotesService.getAll(),
        projectsService.getAll(),
        supabase.from("project_sales_items").select("*"),
        supabase.from("project_purchase_items").select("*"),
        categoriesService.getAll(),
        agenciesService.getAll(),
        SejourService.getSejours(),
        usersService.getAll().catch(() => []),
        supabase.from("project_transfer_tour").select("*"),
        supabase.from("project_flight_tickets").select("*"),
        Promise.resolve({ data: [] }),
        hotelsService.getAll(),
        suppliersService.getAll(),
        Promise.resolve({ data: [] }),
        supabase.from("project_accommodation_items").select("*"),
        projectUsersService.getAll().catch(() => []),
      ]);

      setData({
        rpProjectRows: rpProj,
        rpSejourRows: rpSej,
        collectionPlans: Array.isArray(cols) ? cols : [],
        paymentPlans: Array.isArray(pays) ? pays : [],
        marketingInteractions: Array.isArray(mkt) ? mkt : [],
        quotes: Array.isArray(qts) ? qts : [],
        projects: Array.isArray(prj) ? prj : [],
        salesItems: sales.data || [],
        purchaseItems: purch.data || [],
        categories: Array.isArray(cats) ? cats : [],
        agencies: Array.isArray(agn) ? agn : [],
        sejours: Array.isArray(sejs) ? sejs : [],
        users: Array.isArray(allUsers) ? allUsers : [],
        transfers: trns.data || [],
        flights: flg.data || [],
        hrRows: hr.data || [],
        accommodations: accs.data || [],
        projectUsers: Array.isArray(projUsersData) ? projUsersData : [],
        hotels: Array.isArray(htl) ? htl : [],
        suppliers: Array.isArray(sup) ? sup : [],
        events: evts.data || [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const m = useMemo(() => {
    const loc = language === 'en' ? 'en-US' : 'tr-TR';
    const range = getPeriodRange(period, customDate.start, customDate.end);

    // Filtering base data
    const fProj = data.rpProjectRows.filter((r: any) =>
      inRange(r.cikis_tarihi || r.end_date || r.created_at, range),
    );
    const fSej = data.rpSejourRows.filter((r: any) =>
      inRange(r.cikis_tarihi || r.checkOutDate || r.created_at, range) &&
      (r.durum || "").toUpperCase().includes("KONF")
    );
    const fCols = data.collectionPlans.filter((c: any) =>
      inRange(c.due_date || c.date, range),
    );
    const fPays = data.paymentPlans.filter((p: any) =>
      inRange(p.due_date || p.date, range),
    );
    const fQts = data.quotes.filter((q: any) =>
      inRange(q.created_at || q.option_date, range),
    );
    const fTransfers = data.transfers.filter((t: any) =>
      inRange(t.transfer_date || t.created_at, range),
    );
    const fFlights = data.flights.filter((f: any) =>
      inRange(f.donus_tarihi || f.gidis_tarihi || f.created_at, range),
    );
    const fHr = data.hrRows.filter((h: any) =>
      inRange(h.end_date || h.start_date || h.created_at, range),
    );
    const fEvents = data.events.filter((e: any) =>
      inRange(e.end_date || e.event_date || e.created_at, range),
    );
    const fMkt = data.marketingInteractions.filter((m: any) =>
      inRange(m.created_at || m.date, range),
    );
    const fAccs = (data.accommodations || []).filter((a: any) =>
      inRange(a.check_out_date || a.created_at, range),
    );

    // KPI: Revenues
    const projectIdsInRange = fProj.map((p: any) => p.project_id);
    const miceRev = data.salesItems.filter((s: any) => projectIdsInRange.includes(s.project_id)).reduce((acc: number, s: any) => acc + (Number(s.total_try) || (Number(s.total_price) * Number(s.fx)) || 0), 0);
    const miceCost = fProj.reduce(
      (acc: number, p: any) => acc + (Number(p.maliyet_tl) || 0),
      0,
    );
    const sejRev = fSej.reduce(
      (acc: number, s: any) => acc + (Number(s.satis_tl) || 0),
      0,
    );
    const sejCost = fSej.reduce(
      (acc: number, s: any) => acc + (Number(s.maliyet_tl) || 0),
      0,
    );
    
    // BILET CIRO
    const ucakKategoriIds = data.categories.filter((c: any) => c.name.toLowerCase().includes("ucak") || c.name.toLowerCase().includes("uçak")).map((c: any) => c.id);
    const projFlightRev = data.salesItems.filter((si: any) => projectIdsInRange.includes(si.project_id) && (ucakKategoriIds.includes(si.category) || ucakKategoriIds.includes(si.sub_category))).reduce((acc: number, f: any) => acc + (Number(f.total_try) || (Number(f.total_price) * Number(f.fx)) || 0), 0);
    const sejFlightRev = data.sejours.filter((s: any) => (s.status || "").toUpperCase().includes("KONF") && inRange(s.checkInDate || s.created_at, range)).reduce((acc: number, s: any) => {
      let flightsTotal = 0;
      if (s.flights && Array.isArray(s.flights)) {
        // Sejour flights mapped to price in SejourService
        flightsTotal = s.flights.reduce((sum: number, f: any) => sum + (Number(f.price) || 0), 0);
      }
      return acc + flightsTotal;
    }, 0);
    const flightRev = projFlightRev + sejFlightRev;

    const eventRev = fEvents.reduce(
      (acc: number, e: any) =>
        acc +
        (Number(e.total_tl) ||
          Number(e.total_price) ||
          Number(e.satis_fiyati) ||
          0),
      0,
    );
    const eventCost = fEvents.reduce(
      (acc: number, e: any) =>
        acc +
        (Number(e.maliyet_tl) ||
          Number(e.cost) ||
          Number(e.maliyet) ||
          0),
      0,
    );

    const totalRev = miceRev + sejRev + eventRev; // flightRev is already included in miceRev and sejRev!
    const totalCost = miceCost + sejCost + eventCost; // Assuming flights/events cost might be mapped if needed, or included in projects.
    const totalProfit = totalRev - totalCost;

    // Funnel Data
    const meetingEmails = fMkt.filter((m: any) => {
      const type = (m.interaction_type || m.type || "").toLowerCase();
      return type.includes("toplant") || type.includes("mail") || type.includes("e-posta");
    });
    // Use Set to count unique companies
    const uniqueInteractedCompanies = new Set(meetingEmails.map((m: any) => m.company_id || m.agency_id).filter(Boolean)).size;
    const totalMkt = uniqueInteractedCompanies > 0 ? uniqueInteractedCompanies : meetingEmails.length;

    const pendingQuotesArr = fQts.filter((q: any) => (q.status || "").toLowerCase() === "pending" || (q.status || "").toLowerCase() === "beklemede");
    const pendingQts = pendingQuotesArr.length;
    const pendingQtsValue = pendingQuotesArr.reduce((acc: number, q: any) => acc + (Number(q.total_amount) || Number(q.amount) || 0), 0);

    const wonQts = fQts.filter(
      (q: any) =>
        (q.status || "").toLowerCase().includes("konfirme") ||
        (q.status || "").toLowerCase() === "won",
    ).length;

    const funnelData = [
      {
        name: t('dashboard.interaction') || "Etkileşim (Toplantı/Mail)",
        value: totalMkt,
        fill: "#8b5cf6",
      },
      { name: t('dashboard.createdQuote') || "Oluşturulan Teklif", value: pendingQts, fill: "#3b82f6" },
      { name: t('dashboard.wonProject') || "Kazanılan Proje", value: wonQts, fill: "#10b981" },
    ];

    // Agency Analysis
    const agnMap: Record<
      string,
      { name: string; ciro: number; maliyet: number }
    > = {};
    
    const getAgencyName = (id: string, fallback: string) => {
      if (!id) return fallback;
      const found = data.agencies.find((a: any) => a.id === id);
      return found ? found.name : fallback;
    };

    fProj.forEach((p: any) => {
      const a = p.acente || getAgencyName(p.agency_id, p.musteri_adi || p.acente_adi || (t('dashboard.unknownAgency') || "Bilinmeyen Acente"));
      if (!agnMap[a]) agnMap[a] = { name: a, ciro: 0, maliyet: 0 };
      agnMap[a].ciro += Number(p.satis_tl) || 0;
      agnMap[a].maliyet += Number(p.maliyet_tl) || 0;
    });
    fSej.forEach((s: any) => {
      const a = s.acente || getAgencyName(s.agency_id, s.acente_adi || s.musteri_adi || (t('dashboard.unknownAgency') || "Bilinmeyen Acente"));
      if (!agnMap[a]) agnMap[a] = { name: a, ciro: 0, maliyet: 0 };
      agnMap[a].ciro += Number(s.satis_tl) || 0;
      agnMap[a].maliyet += Number(s.maliyet_tl) || 0;
    });
    const agencyData = Object.values(agnMap)
      .map((a) => ({
        name: a.name,
        Ciro: a.ciro,
        Maliyet: a.maliyet,
        "Kar/Zarar": a.ciro - a.maliyet,
        Marj: a.maliyet > 0 ? Math.round(((a.ciro - a.maliyet) / a.maliyet) * 100) : (a.ciro > 0 ? 100 : 0),
      }))
      .sort((a, b) => b.Ciro - a.Ciro);

    // Hotel Analysis
    const htlMap: Record<string, { ciro: number; maliyet: number }> = {};
    const getHotelName = (id: string, fallback: string) => {
      const found = data.hotels.find((h: any) => h.id === id);
      return found ? found.name : fallback;
    };
    
    // Proje satış ve maliyetlerini hotel_id bazında dağıt
    const projSalesInRange = data.salesItems.filter((s: any) => projectIdsInRange.includes(s.project_id));
    const projPurchInRange = data.purchaseItems.filter((p: any) => projectIdsInRange.includes(p.project_id));
    
    projSalesInRange.forEach((si: any) => {
      const h = getHotelName(si.hotel_id, t('dashboard.unknownHotelProject') || "Bilinmeyen Otel (Proje)");
      if (!htlMap[h]) htlMap[h] = { ciro: 0, maliyet: 0 };
      htlMap[h].ciro += (Number(si.total_try) || (Number(si.total_price) * Number(si.fx)) || 0);
    });
    
    projPurchInRange.forEach((pi: any) => {
      const h = getHotelName(pi.hotel_id, t('dashboard.unknownHotelProject') || "Bilinmeyen Otel (Proje)");
      if (!htlMap[h]) htlMap[h] = { ciro: 0, maliyet: 0 };
      htlMap[h].maliyet += (Number(pi.total_try) || (Number(pi.total_price) * Number(pi.fx)) || 0);
    });

    fSej.forEach((s: any) => {
      const h = s.otel || s.hotel_name || s.hotelName || getHotelName(s.hotel_id, t('dashboard.unknownHotel') || "Bilinmeyen Otel");
      if (!htlMap[h]) htlMap[h] = { ciro: 0, maliyet: 0 };
      htlMap[h].ciro += (Number(s.satis_tl) || 0);
      htlMap[h].maliyet += (Number(s.maliyet_tl) || 0);
    });

    const hotelData = Object.keys(htlMap)
      .map((k) => ({ 
        name: k, 
        Ciro: htlMap[k].ciro,
        Satış: htlMap[k].ciro, // Added for fallback in the BarChart
        Maliyet: htlMap[k].maliyet,
        "Kar/Zarar": htlMap[k].ciro - htlMap[k].maliyet,
        Marj: htlMap[k].maliyet > 0 ? Math.round(((htlMap[k].ciro - htlMap[k].maliyet) / htlMap[k].maliyet) * 100) : (htlMap[k].ciro > 0 ? 100 : 0),
      }))
      .sort((a, b) => b.Ciro - a.Ciro);

    // Airline Distribution
    const airMap: Record<string, number> = {};
    fFlights.forEach((f: any) => {
      const a = f.airline || f.havayolu || t('home.other') || "Diğer";
      airMap[a] = (airMap[a] || 0) + 1;
    });
    const airlineData = Object.keys(airMap)
      .map((k) => ({ name: k, Adet: airMap[k] }))
      .sort((a, b) => b.Adet - a.Adet);

    // Vehicle Types
    const vehMap: Record<string, number> = {};
    fTransfers.forEach((transferItem: any) => {
      const v = transferItem.vehicle_type || transferItem.arac_tipi || t('home.other') || "Diğer";
      vehMap[v] = (vehMap[v] || 0) + 1;
    });
    const vehicleData = Object.keys(vehMap)
      .map((k) => ({ name: k, Adet: vehMap[k] }))
      .sort((a, b) => b.Adet - a.Adet);

    // HR Types
    const hrMap: Record<string, number> = {};
    fHr.forEach((h: any) => {
      const r = h.role || h.personnel_type || h.type || t('home.other') || "Diğer";
      hrMap[r] = (hrMap[r] || 0) + 1;
    });
    const hrData = Object.keys(hrMap)
      .map((k) => ({ name: k, Adet: hrMap[k] }))
      .sort((a, b) => b.Adet - a.Adet);

    // New Chart: Project Efficiency (Aylık Toplu)
    const projMonthlyMap: Record<string, any> = {};
    fProj.forEach((p: any) => {
      const c = Number(p.satis_tl) || 0;
      const m = Number(p.maliyet_tl) || 0;
      const dateStr = p.cikis_tarihi || p.end_date || p.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const monthKey = date.toLocaleDateString(loc, { month: "short", year: "numeric" });
      const sortKey = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      
      if (!projMonthlyMap[sortKey]) {
        projMonthlyMap[sortKey] = { sortKey, name: monthKey, Ciro: 0, Maliyet: 0, "Kar/Zarar": 0 };
      }
      projMonthlyMap[sortKey].Ciro += c;
      projMonthlyMap[sortKey].Maliyet += m;
      projMonthlyMap[sortKey]["Kar/Zarar"] += (c - m);
    });
    
    const projectEfficiencyData = Object.values(projMonthlyMap)
      .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey))
      .map((item: any) => {
      item.Satış = item.Ciro; // Fallback for charts
      item.Marj = item.Maliyet > 0 ? Math.round((item["Kar/Zarar"] / item.Maliyet) * 100) : 0;
      return item;
    });

    // New Chart: Sejour Efficiency (Aylık Toplu)
    const sejMonthlyMap: Record<string, any> = {};
    fSej.forEach((s: any) => {
      const c = Number(s.satis_tl) || 0;
      const m = Number(s.maliyet_tl) || 0;
      const dateStr = s.cikis_tarihi || s.checkOutDate || s.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const monthKey = date.toLocaleDateString(loc, { month: "short", year: "numeric" });
      const sortKey = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      
      if (!sejMonthlyMap[sortKey]) {
        sejMonthlyMap[sortKey] = { sortKey, name: monthKey, Ciro: 0, Maliyet: 0, "Kar/Zarar": 0 };
      }
      sejMonthlyMap[sortKey].Ciro += c;
      sejMonthlyMap[sortKey].Maliyet += m;
      sejMonthlyMap[sortKey]["Kar/Zarar"] += (c - m);
    });
    
    const sejourEfficiencyData = Object.values(sejMonthlyMap)
      .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey))
      .map((item: any) => {
      item.Satış = item.Ciro; // Fallback for charts
      item.Marj = item.Maliyet > 0 ? Math.round((item["Kar/Zarar"] / item.Maliyet) * 100) : 0;
      return item;
    });

    // New Chart: Aylık Finansal Özet (Ciro, Maliyet, Kar, Marj)
    const monthlyFinMap: Record<string, any> = {};

    fProj.forEach((p: any) => {
      const c = Number(p.satis_tl) || 0;
      const m = Number(p.maliyet_tl) || 0;
      const dateStr = p.cikis_tarihi || p.end_date || p.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const sortKey = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      const monthName = date.toLocaleDateString(loc, { month: "short", year: "numeric" });
      
      if (!monthlyFinMap[sortKey]) {
        monthlyFinMap[sortKey] = { sortKey, name: monthName, Ciro: 0, Maliyet: 0, "Kar/Zarar": 0 };
      }
      monthlyFinMap[sortKey].Ciro += c;
      monthlyFinMap[sortKey].Maliyet += m;
      monthlyFinMap[sortKey]["Kar/Zarar"] += (c - m);
    });

    fSej.forEach((s: any) => {
      const c = Number(s.satis_tl) || 0;
      const m = Number(s.maliyet_tl) || 0;
      const dateStr = s.cikis_tarihi || s.checkOutDate || s.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const sortKey = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      const monthName = date.toLocaleDateString(loc, { month: "short", year: "numeric" });
      
      if (!monthlyFinMap[sortKey]) {
        monthlyFinMap[sortKey] = { sortKey, name: monthName, Ciro: 0, Maliyet: 0, "Kar/Zarar": 0 };
      }
      monthlyFinMap[sortKey].Ciro += c;
      monthlyFinMap[sortKey].Maliyet += m;
      monthlyFinMap[sortKey]["Kar/Zarar"] += (c - m);
    });

    fEvents.forEach((e: any) => {
      const c = Number(e.total_tl) || Number(e.total_price) || Number(e.satis_fiyati) || 0;
      const m = Number(e.maliyet_tl) || Number(e.cost) || Number(e.maliyet) || 0;
      const dateStr = e.event_date || e.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const sortKey = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      const monthName = date.toLocaleDateString(loc, { month: "short", year: "numeric" });
      
      if (!monthlyFinMap[sortKey]) {
        monthlyFinMap[sortKey] = { sortKey, name: monthName, Ciro: 0, Maliyet: 0, "Kar/Zarar": 0 };
      }
      monthlyFinMap[sortKey].Ciro += c;
      monthlyFinMap[sortKey].Maliyet += m;
      monthlyFinMap[sortKey]["Kar/Zarar"] += (c - m);
    });

    const monthlyFinancialData = Object.values(monthlyFinMap)
      .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey))
      .map((item: any) => {
         item.Marj = item.Maliyet > 0 ? Math.round((item["Kar/Zarar"] / item.Maliyet) * 100) : 0;
         return item;
      });

    // New Chart: Transfer Suppliers
    const getSupplierName = (id: string, fallback: string) => {
      if (!id) return fallback;
      const found = data.suppliers.find((s: any) => s.id === id);
      return found ? found.name : fallback;
    };

    // New Chart: Teklif & Proje Dönüşüm (Conversion Chart)
    const conversionMap: Record<string, any> = {};
    
    const addConversion = (dateStr: string, type: string) => {
      if (!dateStr) return;
      const date = new Date(dateStr);
      const monthKey = date.toLocaleDateString(loc, { month: "short", year: "numeric" });
      const ts = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      
      if (!conversionMap[monthKey]) {
        conversionMap[monthKey] = {
          name: monthKey,
          timestamp: ts,
          "Bekleyen Teklif": 0,
          "İptal Olan Teklif": 0,
          "Konfirme Teklif": 0,
          "Tamamlanan Proje": 0,
        };
      }
      conversionMap[monthKey][type] += 1;
    };

    fQts.forEach((q: any) => {
      const st = (q.status || "").toUpperCase();
      const dateStr = q.created_at || q.option_date;
      if (st.includes('BEKLE') || st === 'PENDING') {
        addConversion(dateStr, 'Bekleyen Teklif');
      } else if (st.includes('İPTAL') || st === 'REJECTED' || st.includes('IPTAL')) {
        addConversion(dateStr, 'İptal Olan Teklif');
      } else if (st.includes('KONFİRME') || st.includes('ONAY') || st === 'APPROVED') {
        addConversion(dateStr, 'Konfirme Teklif');
      } else {
        addConversion(dateStr, 'Bekleyen Teklif');
      }
    });

    const fActualProj = data.projects.filter((p: any) => inRange(p.start_date || p.created_at, range));
    fActualProj.forEach((p: any) => {
      const st = (p.status || "").toLowerCase();
      const dateStr = p.start_date || p.created_at;
      if (st === 'completed' || st === 'tamamlandı') {
        addConversion(dateStr, 'Tamamlanan Proje');
      }
    });

    const conversionChartData = Object.values(conversionMap).sort((a: any, b: any) => a.timestamp - b.timestamp);

    // New Chart: Supplier Cost Analysis
    const supplierCostMap: Record<string, number> = {};

    data.purchaseItems.forEach((pi: any) => {
      const dateStr = pi.invoice_date || pi.created_at;
      if (!inRange(dateStr, range)) return;
      if (!pi.supplier_id) return; // Skip hotels and unknown
      const sName = getSupplierName(pi.supplier_id, null);
      if (!sName) return; // Skip if still not found
      const cost = Number(pi.total_try) || (Number(pi.total_price) * Number(pi.fx || 1)) || Number(pi.total_price) || 0;
      supplierCostMap[sName] = (supplierCostMap[sName] || 0) + cost;
    });

    data.sejours.forEach((s: any) => {
      const dateStr = s.checkInDate || s.created_at;
      if (!inRange(dateStr, range)) return;
      
      if (s.flights && Array.isArray(s.flights)) {
         s.flights.forEach((f: any) => {
            if (!f.ticketingProvider) return;
            const sName = getSupplierName(f.ticketingProvider, null);
            if (!sName) return;
            const cost = Number(f.costPrice) || Number(f.price) || 0;
            supplierCostMap[sName] = (supplierCostMap[sName] || 0) + cost;
         });
      }
      
      if (s.transfers && Array.isArray(s.transfers)) {
         s.transfers.forEach((t: any) => {
            if (!t.supplierId && !t.provider) return;
            const sName = getSupplierName(t.supplierId || t.provider, null);
            if (!sName) return;
            const cost = Number(t.costPrice) || Number(t.price) || 0;
            supplierCostMap[sName] = (supplierCostMap[sName] || 0) + cost;
         });
      }
      
      if (s.extraServices && Array.isArray(s.extraServices)) {
         s.extraServices.forEach((ex: any) => {
            if (!ex.supplierId) return;
            const sName = getSupplierName(ex.supplierId, null);
            if (!sName) return;
            const cost = Number(ex.costPrice) || Number(ex.price) || 0;
            supplierCostMap[sName] = (supplierCostMap[sName] || 0) + cost;
         });
      }
    });

    const supplierCostData = Object.keys(supplierCostMap).map(k => ({
      name: k,
      Maliyet: Math.round(supplierCostMap[k])
    })).sort((a,b) => b.Maliyet - a.Maliyet);
    const supMap: Record<string, number> = {};
    fTransfers.forEach((transferItem: any) => {
      const s = getSupplierName(transferItem.supplier_id, t('dashboard.unknownSupplier') || "Bilinmeyen Tedarikçi");
      supMap[s] = (supMap[s] || 0) + 1;
    });
    const transferSupplierData = Object.keys(supMap)
      .map((k) => ({ name: k, Adet: supMap[k] }))
      .sort((a, b) => b.Adet - a.Adet);

    // Operational Flow (Calendar Ops)
    const allOps: any[] = [];
    
    const addOp = (startDate: any, endDate: any, category: string, title: string, color: string) => {
      let current = parseDateSafe(startDate);
      const end = parseDateSafe(endDate) || current;
      if (!current) return;
      
      const startMs = new Date(current).setHours(0,0,0,0);
      const endMs = new Date(end).setHours(0,0,0,0);
      const opId = category + '-' + title + '-' + startMs;
      
      // Prevent infinite loops if dates are somehow invalid but parsed
      let safetyCount = 0;
      while (current <= end && safetyCount < 365) {
        const currMs = new Date(current).setHours(0,0,0,0);
        allOps.push({
          id: opId,
          date: new Date(current),
          category,
          title,
          color,
          isStart: currMs === startMs,
          isEnd: currMs === endMs,
          endDate: new Date(endMs)
        });
        current.setDate(current.getDate() + 1);
        safetyCount++;
      }
    };

    data.projects.forEach((p: any) => {
      const code = p.code || p.reference || p.proje_adi;
      const firma = p.company_name || "-";
      const acenteObj = data.agencies?.find((a:any) => a.id === p.agency_id);
      const acente = acenteObj?.name || p.agency_name || "-";
      const sd = p.start_date || p.created_at;
      const ed = p.end_date || sd;
      const cIn = new Date(sd).toLocaleDateString(loc);
      const cOut = new Date(ed).toLocaleDateString(loc);
      
      addOp(sd, ed, t('home.project') || "Proje", `${t('home.project') || "Proje"}: ${code} | C-IN: ${cIn} | C-OUT: ${cOut} | ${t('home.company') || "Firma"}: ${firma} | ${t('home.agency') || "Acente"}: ${acente}`, "bg-blue-500");
      // Ekip
      if (p.team_members || p.manager_id) {
        const hotel = getHotelName(p.hotel_id, "-");
        let sorumluList: string[] = [];
        
        // 1. Projeye atanmış tüm kullanıcıları project_users'dan çek
        if (data.projectUsers) {
          const matchedUserIds = data.projectUsers.filter((pu:any) => pu.project_id === p.id).map((pu:any) => pu.user_id);
          matchedUserIds.forEach((uid:string) => {
            const userObj = data.users?.find((u:any) => u.id === uid);
            if (userObj && (userObj.full_name || userObj.name)) {
              sorumluList.push(userObj.full_name || userObj.name);
            }
          });
        }
        
        // 2. Yoksa manager_id'ye bak
        if (sorumluList.length === 0 && p.manager_id) {
          const userObj = data.users?.find((u:any) => u.id === p.manager_id);
          if (userObj && (userObj.full_name || userObj.name)) {
            sorumluList.push(userObj.full_name || userObj.name);
          }
        }
        
        const sorumlular = sorumluList.length > 0 ? sorumluList.join(", ") : "Belirtilmemiş";
        
        addOp(sd, ed, t('dashboard.team') || "Ekip", `${t('dashboard.team') || "Ekip"}: ${code} | ${t('home.manager') || "Sorumlu"}: ${sorumlular} | ${t('home.hotel') || "Otel"}: ${hotel} | ${t('home.company') || "Firma"}: ${firma} | ${t('home.agency') || "Acente"}: ${acente}`, "bg-indigo-500");
      }
    });

    data.sejours.forEach((s: any) => {
      const status = (s.status || "").toUpperCase();
      if (status.includes("İPTAL") || status.includes("IPTAL") || status.includes("CANCEL")) return;
      
      const hotel = s.hotelName || s.hotel_name || s.rooms?.[0]?.hotelName || s.hotels?.name || getHotelName(s.hotel_id, "-");
      const acente = s.agencyName || s.agencies?.name || s.agency_name || "-";
      const sd = s.checkInDate || s.check_in_date || s.created_at;
      const ed = s.checkOutDate || s.check_out_date || sd;
      const voucher = s.voucherNumber || s.voucher_number || "-";
      const customer = s.customerName || s.customer_name || "-";
      const cIn = new Date(sd).toLocaleDateString(loc);
      const cOut = new Date(ed).toLocaleDateString(loc);
      
      addOp(sd, ed, "Sejour", `Sejour: Voucher: ${voucher} | C-IN: ${cIn} | C-OUT: ${cOut} | ${t('home.guest') || "Misafir"}: ${customer} | ${t('home.agency') || "Acente"}: ${acente} | ${t('home.hotel') || "Otel"}: ${hotel}`, "bg-emerald-500");
    });

    // Sadece Proje, Sejour ve Ekip istendiği için diğerleri yoruma alındı:
    /*
    data.flights.forEach((f: any) => {
      const sd = f.gidis_tarihi || f.created_at;
      const ed = f.donus_tarihi || sd;
      addOp(sd, ed, "Bilet", `Uçuş: ${f.airline || f.havayolu}`, "bg-amber-500");
    });

    data.transfers.forEach((t: any) => {
      const sd = t.transfer_date || t.created_at;
      addOp(sd, sd, "Transfer", `Transfer: ${t.vehicle_type || t.route}`, "bg-fuchsia-500");
    });

    data.hrRows.forEach((h: any) => {
      const role = (h.role || h.personnel_type || h.type || "").toLowerCase();
      const sd = h.start_date || h.created_at;
      const ed = h.end_date || sd;
      if (role.includes("part") || role.includes("time")) {
        addOp(sd, ed, "Part-Time", `Part-Time: ${h.name || h.personnel_name}`, "bg-orange-500");
      } else if (role.includes("rehber") || role.includes("guide")) {
        addOp(sd, ed, "Rehber", `Rehber: ${h.name || h.personnel_name}`, "bg-teal-500");
      }
    });
    */

    const opDurations: Record<string, {start: Date, end: Date}> = {};
    allOps.forEach(op => {
      if (!opDurations[op.id]) opDurations[op.id] = {start: op.date, end: op.date};
      if (op.date < opDurations[op.id].start) opDurations[op.id].start = op.date;
      if (op.date > opDurations[op.id].end) opDurations[op.id].end = op.date;
    });

    const assignedRows: Record<string, number> = {};
    const getOccupiedRows = (date: Date) => {
      const activeOps = Object.keys(opDurations).filter(id => {
        return date.getTime() >= opDurations[id].start.getTime() && 
               date.getTime() <= opDurations[id].end.getTime() && 
               assignedRows[id] !== undefined;
      });
      return activeOps.map(id => assignedRows[id]);
    };

    const uniqueOpIds = Object.keys(opDurations).sort((a, b) => {
      const startDiff = opDurations[a].start.getTime() - opDurations[b].start.getTime();
      if (startDiff !== 0) return startDiff;
      const durA = opDurations[a].end.getTime() - opDurations[a].start.getTime();
      const durB = opDurations[b].end.getTime() - opDurations[b].start.getTime();
      return durB - durA;
    });

    uniqueOpIds.forEach(id => {
      const { start, end } = opDurations[id];
      let row = 0;
      let conflict = true;
      while (conflict && row < 20) {
        conflict = false;
        let curr = new Date(start);
        while (curr.getTime() <= end.getTime()) {
          if (getOccupiedRows(curr).includes(row)) {
            conflict = true;
            break;
          }
          curr.setDate(curr.getDate() + 1);
        }
        if (conflict) row++;
      }
      assignedRows[id] = row;
    });

    allOps.forEach(op => {
      op.rowIndex = assignedRows[op.id] || 0;
    });

    return {
      totalRev,
      miceRev,
      sejRev,
      totalCost,
      totalProfit,
      flightRev,
      eventRev,
      funnelData,
      totalMkt,
      pendingQts,
      pendingQtsValue,
      wonQts,
      agencyData,
      hotelData,
      airlineData,
      vehicleData,
      hrData,
      projectEfficiencyData,
      sejourEfficiencyData,
      transferSupplierData,
      conversionChartData,
      supplierCostData,
      monthlyFinancialData,



      allOps,
    };
  }, [
    period,
    customDate,
    data.rpProjectRows,
    data.rpSejourRows,
    data.collectionPlans,
    data.paymentPlans,
    data.marketingInteractions,
    data.quotes,
    data.transfers,
    data.flights,
    data.hrRows,
    data.events,
    data.agencies,
    data.hotels,
    data.sejours,
    data.suppliers,
    data.accommodations,
  ]);


  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-v3-bg">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-y-auto overflow-x-hidden pt-4 pb-10 px-4 gap-4">
      {/* Top Header: Title & Filters */}
      <div className="shrink-0 flex flex-col gap-3 z-10">
        <div className="flex flex-wrap items-center justify-start gap-8">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
              {t('dashboard.title') || "Dashboard"}
            </h1>
            <p className="text-xs text-v3-muted mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2 p-1 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl w-fit h-[40px]">
              {(
                [
                  { id: "today", label: t('home.today') || "Bugün" },
                  { id: "week", label: t('home.thisWeek') || "Bu Hafta" },
                  { id: "month", label: t('home.thisMonth') || "Bu Ay" },
                  { id: "lastMonth", label: t('home.lastMonth') || "Geçen Ay" },
                  { id: "year", label: t('home.thisYear') || "Bu Yıl" },
                  { id: "lastYear", label: t('home.lastYear') || "Geçen Yıl" },
                  { id: "all", label: t('home.all') || "Tümü" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPeriod(item.id as PeriodFilter);
                    setShowCustomDate(false);
                  }}
                  className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                    period === item.id
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                      : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setPeriod("custom");
                  setShowCustomDate(true);
                }}
                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center gap-1 ${
                  period === "custom"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                    : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"
                }`}
              >
                <Calendar size={14} />
                {t('home.customDate') || "Özel Tarih"}
              </button>
            </div>

            <AnimatePresence>
              {showCustomDate && (
                  <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-end gap-2"
                >
                  <div className="w-64">
                    <ResponsiveDateRangeField
                      label={t('home.dateRange') || "Tarih Aralığı"}
                      startValue={customDate.start}
                      endValue={customDate.end}
                      onStartChange={(val) =>
                        setCustomDate((prev) => ({ ...prev, start: val }))
                      }
                      onEndChange={(val) =>
                        setCustomDate((prev) => ({ ...prev, end: val }))
                      }
                      onApply={() => loadData()}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={loadData}
              className="bg-v3-border border border-v3-border hover:bg-v3-surface text-v3-text px-4 py-2 rounded-xl transition-all duration-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 ml-1 h-[40px]"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {t('home.refresh') || "Yenile"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 relative">
        {/* ROW 1: KONSOLİDE FİNANS & CİRO DAĞILIMI */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 relative z-10">
          <KPICard title={t('dashboard.totalRevenue')} value={m.totalRev} isMoney icon={Landmark} color="emerald" language={language} />
          <KPICard title={t('dashboard.totalCost')} value={m.totalCost} isMoney icon={TrendingDown} color="rose" language={language} />
          <KPICard title={t('dashboard.miceRevenue')} value={m.miceRev} isMoney icon={Briefcase} color="blue" language={language} />
          <KPICard title={t('dashboard.sejourRevenue')} value={m.sejRev} isMoney icon={Hotel} color="cyan" language={language} />
          <KPICard title={t('dashboard.flightRevenue')} value={m.flightRev} isMoney icon={Ticket} color="amber" language={language} />
          <KPICard title={t('dashboard.totalProfit')} value={m.totalProfit} isMoney icon={Award} color="fuchsia" language={language} />
        </div>

        {/* ROW 1.5: AYLIK FİNANSAL ÖZET */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 relative z-10">
          <div className="xl:col-span-12 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="fuchsia">
              <h2 className="text-lg font-black text-v3-text flex items-center gap-2">
                <BarChart3 size={18} className="text-fuchsia-600 dark:text-fuchsia-400" /> {t('dashboard.monthlyFinSummary') || "Aylık Finansal Özet"}
              </h2>
              <p className="text-[10px] text-v3-muted uppercase tracking-widest mb-4">
                {t('dashboard.monthlyFinSummaryDesc')}
              </p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 pt-2">
                {m.monthlyFinancialData.map((row: any, i: number) => (
                  <div key={i} className="min-w-[140px] shrink-0 bg-v3-border border border-v3-border rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group hover:bg-v3-surface transition-all duration-300">
                    <div className="absolute -right-4 -top-6 text-v3-text opacity-5 text-5xl font-black pointer-events-none group-hover:opacity-10 transition-opacity duration-300">
                      {row.name.split(' ')[0]}
                    </div>
                    <h3 className="font-bold text-v3-text text-sm relative z-10">{row.name}</h3>
                    
                    <div className="flex flex-col gap-1.5 relative z-10">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-v3-muted">{t('dashboard.totalRevShort') || "Ciro"}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">{formatMoney(row.Ciro, language)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-v3-muted">{t('dashboard.totalCostShort') || "Maliyet"}</span>
                        <span className="text-rose-600 dark:text-rose-400 font-mono font-medium">{formatMoney(row.Maliyet, language)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-2 border-t border-v3-border flex justify-between items-end relative z-10">
                      <div>
                        <p className="text-[8px] text-v3-muted uppercase tracking-widest mb-1">{t('dashboard.profitLoss') || "Kâr/Zarar"}</p>
                        <p className={`font-black text-xs ${row['Kar/Zarar'] >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatMoney(row['Kar/Zarar'], language)}
                        </p>
                      </div>
                      <div className="bg-v3-surface px-1.5 py-0.5 rounded-lg border border-v3-border shadow-inner">
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px]">%{row.Marj}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {m.monthlyFinancialData.length > 0 && (
                  <div className="min-w-[180px] shrink-0 bg-slate-800 dark:bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group shadow-xl">
                    <div className="absolute -right-6 -bottom-6 text-slate-700/50 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                      <BarChart3 size={80} />
                    </div>
                    <h3 className="font-black text-white text-sm relative z-10">{t('dashboard.annualTotal') || "Yıllık Toplam"}</h3>
                    
                    <div className="flex flex-col gap-1.5 relative z-10">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-300">{t('dashboard.totalRevShort') || "Top. Ciro"}</span>
                        <span className="text-emerald-400 font-mono font-bold">{formatMoney(m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row.Ciro, 0), language)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-300">{t('dashboard.totalCostShort') || "Top. Mal."}</span>
                        <span className="text-rose-400 font-mono font-bold">{formatMoney(m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row.Maliyet, 0), language)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-2 border-t border-slate-700 flex justify-between items-end relative z-10">
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.netProfit') || "NET KÂR"}</p>
                        <p className="font-black text-xs text-emerald-400">
                          {formatMoney(m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row['Kar/Zarar'], 0), language)}
                        </p>
                      </div>
                      <div className="bg-slate-700 px-1.5 py-0.5 rounded-lg border border-slate-600">
                        <span className="text-white font-mono font-black text-xs">
                          %{m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row.Maliyet, 0) > 0 ? Math.round((m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row['Kar/Zarar'], 0) / m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row.Maliyet, 0)) * 100) : (m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row.Ciro, 0) > 0 ? 100 : 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* ROW 2: PAZARLAMA HUNİSİ & ACENTE ANALİZİ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 relative z-10">
          {/* Marketing Funnel */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="violet" onExpand={() => setFullscreenChart('funnel')}>
              <h2 className="text-lg font-black text-v3-text flex items-center gap-2">
                <Target size={18} className="text-violet-600 dark:text-violet-400" /> {t('dashboard.marketingFunnel') || "Pazarlama Hunisi"}
              </h2>
              <p className="text-[10px] text-v3-muted uppercase tracking-widest mb-4">
                {t('dashboard.marketingFunnelDesc')}
              </p>
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {m.funnelData.reduce((a:number, b:any) => a + (b.value||0), 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                      <AlertCircle size={32} className="text-violet-500 mb-2" />
                      <span className="text-xs font-bold text-center">{t('dashboard.noMarketingData') || "Henüz Pazarlama Verisi Yok"}</span>
                    </div>
                  ) : (
                  <FunnelChart>
                    <Tooltip content={<CustomTooltip t={t} language={language} />} />
                    <Funnel
                      dataKey="value"
                      data={m.funnelData}
                      isAnimationActive
                    >
                      <LabelList
                        position="right"
                        fill="var(--v3-text)"
                        stroke="none"
                        dataKey="name"
                        fontSize={11}
                      />
                    </Funnel>
                  </FunnelChart>)}
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-v3-border">
                <div>
                  <p className="text-[10px] text-v3-muted uppercase tracking-widest">
                    {t('dashboard.pendingQuoteRev') || "Bekleyen Teklif Ciro"}
                  </p>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {formatMoney(m.pendingQtsValue, language)}
                  </p>
                  <p className="text-xs text-v3-muted">
                    {m.pendingQts} {t('dashboard.quoteCountText') || "Adet Teklif"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-v3-muted uppercase tracking-widest">
                    {t('dashboard.wonQuote') || "Kazanılan Teklif"}
                  </p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {m.wonQts} {t('dashboard.projectedCountText') || "Adet"}
                  </p>
                  <p className="text-xs text-v3-muted">{t('dashboard.projectedLabel') || "Projeleşen"}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Agency Volume & Profit */}
          <div className="xl:col-span-8 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="blue" onExpand={() => setFullscreenChart('agency')}>
              <h2 className="text-lg font-black text-v3-text flex items-center gap-2">
                <Building2 size={18} className="text-blue-600 dark:text-blue-400" /> {t('dashboard.agencyVolume') || "Acente Bazlı Hacim ve Kârlılık"}
              </h2>
              <p className="text-[10px] text-v3-muted uppercase tracking-widest mb-4">
                {t('dashboard.agencyVolumeDesc')}
              </p>
              <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={m.agencyData.slice(0, 10)}
                    margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--v3-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={90}
                      interval={0}
                      tickFormatter={(val: string) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#10b981"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `%${v}`}
                    />
                    <Tooltip
                      content={<CustomTooltip t={t} language={language} />}
                      cursor={{ fill: "#ffffff05" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "11px" }}
                      verticalAlign="top"
                      height={36}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="Ciro"
                      name={t('dashboard.sales') || "Ciro"}
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={24}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="Marj"
                      name={t('dashboard.margin') || "Marj"}
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#020617",
                        stroke: "#10b981",
                        strokeWidth: 2,
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* ROW 3: HOTEL & EFFICIENCY ANALYSIS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 relative z-10">
          {/* Top Hotels */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="cyan" onExpand={() => setFullscreenChart('hotel')}>
              <h2 className="text-lg font-black text-v3-text flex items-center gap-2">
                <Hotel size={18} className="text-cyan-600 dark:text-cyan-400" /> {t('dashboard.hotelRevenue') || "Otel Bazlı Ciro Analizi"}
              </h2>
              <p className="text-[10px] text-v3-muted uppercase tracking-widest mb-4">
                {t('dashboard.hotelRevenueDesc')}
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.hotelData.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--v3-border)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="var(--v3-muted)"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      width={130}
                      tickFormatter={(v) => v && v.length > 20 ? v.substring(0, 20) + "..." : v}
                    />
                    <Tooltip
                      content={<CustomTooltip t={t} language={language} />}
                      cursor={{ fill: "#ffffff05" }}
                    />
                    <Bar
                      dataKey="Satış"
                      name={t('dashboard.sales') || "Satış"}
                      fill="#06b6d4"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    >
                      {m.hotelData.slice(0, 10).map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          opacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Project Efficiency */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="emerald" onExpand={() => setFullscreenChart('projEff')}>
              <h2 className="text-lg font-black text-v3-text flex items-center gap-2">
                <Target size={18} className="text-emerald-600 dark:text-emerald-400" /> {t('dashboard.projectEfficiency') || "Proje Verimliliği"}
              </h2>
              <p className="text-[10px] text-v3-muted uppercase tracking-widest mb-4">
                {t('dashboard.projectEfficiencyDesc')}
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.projectEfficiencyData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <YAxis type="category" dataKey="name" stroke="var(--v3-muted)" fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <Tooltip content={<CustomTooltip t={t} language={language} />} cursor={{ fill: "#ffffff05" }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Ciro" name={t('dashboard.sales') || "Ciro"} fill="#10b981" radius={[0, 4, 4, 0]} barSize={8} />
                    <Bar dataKey="Maliyet" name={t('dashboard.cost') || "Maliyet"} fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={8} />
                    <Bar dataKey="Kar/Zarar" name={t('dashboard.profitLoss') || "Kar/Zarar"} fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Sejour Efficiency */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="blue" onExpand={() => setFullscreenChart('sejEff')}>
              <h2 className="text-lg font-black text-v3-text flex items-center gap-2">
                <Hotel size={18} className="text-blue-600 dark:text-blue-400" /> {t('dashboard.sejourEfficiency') || "Sejour Verimliliği"}
              </h2>
              <p className="text-[10px] text-v3-muted uppercase tracking-widest mb-4">
                {t('dashboard.sejourEfficiencyDesc')}
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.sejourEfficiencyData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(1)}K`} />
                    <YAxis type="category" dataKey="name" stroke="var(--v3-muted)" fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <Tooltip content={<CustomTooltip t={t} language={language} />} cursor={{ fill: "#ffffff05" }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Ciro" name={t('dashboard.sales') || "Ciro"} fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={8} />
                    <Bar dataKey="Maliyet" name={t('dashboard.cost') || "Maliyet"} fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={8} />
                    <Bar dataKey="Kar/Zarar" name={t('dashboard.profitLoss') || "Kar/Zarar"} fill="#10b981" radius={[0, 4, 4, 0]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* ROW 4: TRANSPORT & SUPPLIERS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 relative z-10">
          {/* Airlines */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="amber" onExpand={() => setFullscreenChart('airline')}>
              <h2 className="text-md font-black text-v3-text flex items-center gap-2">
                <Plane size={16} className="text-amber-600 dark:text-amber-400" /> {t('dashboard.airlineDistribution') || "Havayolu Dağılımı"}
              </h2>
              <div className="flex-1 min-h-[180px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={m.airlineData}
                      dataKey="Adet"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                    >
                      {m.airlineData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip t={t} language={language} />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Vehicles */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="fuchsia" onExpand={() => setFullscreenChart('vehicle')}>
              <h2 className="text-md font-black text-v3-text flex items-center gap-2">
                <Bus size={16} className="text-fuchsia-600 dark:text-fuchsia-400" /> {t('dashboard.vehicleUsage') || "Araç Tipi Kullanımı"}
              </h2>
              <div className="flex-1 min-h-[180px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={m.vehicleData}
                      dataKey="Adet"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {m.vehicleData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[(index + 3) % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip t={t} language={language} />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Transfer Suppliers */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="rose" onExpand={() => setFullscreenChart('transferSupplier')}>
              <h2 className="text-md font-black text-v3-text flex items-center gap-2">
                <Building2 size={16} className="text-rose-600 dark:text-rose-400" /> {t('dashboard.transferSuppliers') || "Transfer Tedarikçi Dağılımı"}
              </h2>
              <div className="flex-1 min-h-[180px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={m.transferSupplierData}
                      dataKey="Adet"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {m.transferSupplierData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[(index + 5) % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip t={t} language={language} />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* ROW 5: OPERATIONAL FLOW */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
          {/* Operational Flow */}
          {/* Conversion Chart (Teklif -> Proje Dönüşüm) */}
          {/* Conversion Chart (Teklif -> Proje Dönüşüm) */}
          <div className="xl:col-span-8 flex flex-col mb-4">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="emerald" onExpand={() => setFullscreenChart('conversion')}>
              <h2 className="text-lg font-black text-v3-text flex items-center gap-2">
                <Target size={18} className="text-emerald-600 dark:text-emerald-400" /> {t('dashboard.conversionChart') || "Teklif & Proje Dönüşüm Grafiği"}
              </h2>
              <p className="text-[10px] text-v3-muted uppercase tracking-widest mb-4">
                {t('dashboard.conversionChartDesc')}
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.conversionChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip t={t} language={language} />} cursor={{ fill: "#ffffff05" }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Bekleyen Teklif" name={t('dashboard.pendingQuote') || "Bekleyen Teklif"} fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={12} stackId="a" />
                    <Bar dataKey="İptal Olan Teklif" name={t('dashboard.canceledQuote') || "İptal Olan Teklif"} fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} stackId="a" />
                    <Bar dataKey="Konfirme Teklif" name={t('dashboard.confirmedQuote') || "Konfirme Teklif"} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} stackId="a" />
                    <Bar dataKey="Tamamlanan Proje" name={t('dashboard.completedProject') || "Tamamlanan Proje"} fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} stackId="b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Supplier Cost Analysis */}
          <div className="xl:col-span-4 flex flex-col mb-4">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="rose" onExpand={() => setFullscreenChart('supplier')}>
              <h2 className="text-lg font-black text-v3-text flex items-center gap-2">
                <Building2 size={18} className="text-rose-600 dark:text-rose-400" /> {t('dashboard.supplierCost') || "Tedarikçi Gider Analizi"}
              </h2>
              <p className="text-[10px] text-v3-muted uppercase tracking-widest mb-4">
                {t('dashboard.supplierCostDesc')}
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.supplierCostData.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 }).format(value)} />
                    <YAxis dataKey="name" type="category" width={110} stroke="var(--v3-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val: string) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
                    <Tooltip content={<CustomTooltip t={t} language={language} />} cursor={{ fill: "#ffffff05" }} />
                    <Bar dataKey="Maliyet" name={t('dashboard.cost') || "Maliyet"} fill="#fb7185" radius={[0, 4, 4, 0]} barSize={12}>
                      {m.supplierCostData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#fb7185" : "#f43f5e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <div className="xl:col-span-12 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="blue">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <div>
                  <h2 className="text-lg font-black text-v3-text flex items-center gap-2">
                    <Clock size={18} className="text-blue-600 dark:text-blue-400" /> {t('dashboard.calendar') || "Operasyonel Takvim"}
                  </h2>
                  <p className="text-[10px] text-v3-muted uppercase tracking-widest">
                    {t('dashboard.calendarDesc')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[t('home.all') || "Tümü", t('home.project') || "Proje", "Sejour", t('dashboard.team') || "Ekip"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setCalendarFilter(f)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                        calendarFilter === f 
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
                          : "bg-v3-border text-v3-text/90 hover:bg-v3-surface"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full bg-v3-border rounded-2xl p-4 border border-v3-border overflow-hidden relative dashboard-calendar">
                <style dangerouslySetInnerHTML={{__html: `
                  .dashboard-calendar .react-calendar {
                    width: 100%;
                    background: transparent;
                    border: none;
                    font-family: inherit;
                    color: var(--v3-text);
                  }
                  .dashboard-calendar .react-calendar__navigation button {
                    color: var(--v3-text);
                    font-weight: bold;
                    border-radius: 8px;
                  }
                  .dashboard-calendar .react-calendar__navigation button:enabled:hover,
                  .dashboard-calendar .react-calendar__navigation button:enabled:focus {
                    background-color: var(--v3-border);
                  }
                  .dashboard-calendar .react-calendar__month-view__days__day {
                    color: var(--v3-text);
                    border: 1px solid var(--v3-border);
                    min-height: 120px;
                    height: auto;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    padding: 4px;
                    overflow: visible !important;
                  }
                  .dashboard-calendar .react-calendar__month-view__days {
                    overflow: visible !important;
                  }
                  .dashboard-calendar .react-calendar__tile {
                    overflow: visible !important;
                  }
                  .dashboard-calendar .react-calendar__month-view__days__day--neighboringMonth {
                    color: var(--v3-muted);
                  }
                  .dashboard-calendar .react-calendar__tile:enabled:hover,
                  .dashboard-calendar .react-calendar__tile:enabled:focus {
                    background-color: var(--v3-border);
                  }
                  .dashboard-calendar .react-calendar__tile--now {
                    background-color: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.5);
                  }
                  .dashboard-calendar .react-calendar__tile--active {
                    background-color: var(--v3-border) !important;
                    color: var(--v3-text);
                  }
                  .dashboard-calendar abbr {
                    text-decoration: none;
                    font-weight: bold;
                    margin-bottom: 4px;
                    display: block;
                    width: 100%;
                    text-align: right;
                    font-size: 12px;
                  }
                  .dashboard-calendar .react-calendar__month-view__weekdays {
                    text-transform: uppercase;
                    font-weight: bold;
                    font-size: 10px;
                    color: #94a3b8;
                    margin-bottom: 8px;
                  }
                `}} />
                <CalendarComponent
                  locale={language === 'en' ? 'en-US' : 'tr-TR'}
                  className="dashboard-calendar w-full border-none shadow-sm rounded-xl p-2 bg-v3-border0 backdrop-blur-sm"
                  view={calendarViewMode}
                  onViewChange={({ view }) => setCalendarViewMode(view as any)}
                  activeStartDate={calendarViewDate}
                  onActiveStartDateChange={({ activeStartDate }) => {
                    if (activeStartDate) setCalendarViewDate(activeStartDate);
                  }}
                  onClickDay={(value) => setSelectedCalendarDate(value)}
                  tileContent={({ date, view }) => {
                    if (view === 'year') {
                      const monthOps = m.allOps.filter((op: any) => 
                        op.date.getMonth() === date.getMonth() && 
                        op.date.getFullYear() === date.getFullYear() &&
                        (calendarFilter === 'Tümü' || op.category === calendarFilter)
                      );
                      if (monthOps.length > 0) {
                        return (
                          <div className="flex justify-center mt-2">
                            <div className="w-2 h-2 bg-brand-500 rounded-full shadow-sm" title={`${monthOps.length} Operasyon`}></div>
                          </div>
                        );
                      }
                    }
                    if (view === 'month') {
                      const dayOps = m.allOps.filter((op: any) => 
                        op.date.toDateString() === date.toDateString() && 
                        (calendarFilter === 'Tümü' || op.category === calendarFilter)
                      );
                      
                      if (dayOps.length > 0) {
                        const maxRowIndexForDay = Math.max(...dayOps.map((op: any) => op.rowIndex), -1);
                        const containerHeight = (maxRowIndexForDay + 1) * 19;
                        
                        return (
                          <div className="relative w-full mt-1 overflow-visible" style={{ height: `${containerHeight}px` }}>
                            {dayOps.map((op: any) => {
                              const currentDate = new Date(op.date);
                              const currentDayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday ...
                              const isSegmentStart = op.isStart || currentDayOfWeek === 1;
                              
                              // ONLY render the div on the start of a segment (actual start or Monday)
                              if (!isSegmentStart) {
                                return null;
                              }
                              
                              // Calculate how many days this segment spans
                              let span = 1;
                              const endDate = op.endDate ? new Date(op.endDate) : currentDate;
                              let tempDate = new Date(currentDate);
                              
                              // Stop spanning if we hit the end date OR if we hit Sunday (0)
                              while (tempDate.getTime() < endDate.getTime() && tempDate.getDay() !== 0) {
                                span++;
                                tempDate.setDate(tempDate.getDate() + 1);
                              }
                              
                              let extraClasses = "rounded-sm z-20";
                              if (!op.isStart && !op.isEnd) {
                                extraClasses = "rounded-none z-20";
                              } else if (!op.isStart && op.isEnd) {
                                extraClasses = "rounded-l-none rounded-r-sm z-20";
                              } else if (op.isStart && !op.isEnd) {
                                extraClasses = "rounded-l-sm rounded-r-none z-20";
                              }

                              return (
                                <div 
                                  key={op.id} 
                                  className={`absolute left-0 h-[16px] text-[9px] leading-[16px] px-1.5 truncate text-left text-white ${op.color} shadow-sm ${extraClasses}`}
                                  style={{ 
                                    top: `${op.rowIndex * 19}px`,
                                    width: `calc(${span * 100}% + ${(span - 1) * 8}px + ${(span - 1) * 2}px)`,
                                    marginLeft: !op.isStart ? "-5px" : "0px",
                                    paddingLeft: !op.isStart ? "5px" : "6px",
                                  }}
                                  title={op.title}
                                >
                                  {op.title}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                    }
                    return null;
                  }}
                />
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Detay Modalı */}
      <AnimatePresence>
        {selectedCalendarDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedCalendarDate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-v3-bg rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-v3-surface/50">
                <h3 className="text-lg font-bold text-slate-800 dark:text-v3-text flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-500" />
                  {selectedCalendarDate.toLocaleDateString("tr-TR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <button
                  onClick={() => setSelectedCalendarDate(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-v3-muted"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {(() => {
                  const ops = m.allOps.filter((op:any) => op.date.toDateString() === selectedCalendarDate.toDateString());
                  if (ops.length === 0) {
                    return <div className="text-center text-v3-muted py-8">{t('dashboard.noOpData') || "Bu tarihte herhangi bir operasyon kaydı bulunmuyor."}</div>;
                  }
                  
                  const filteredOps = calendarFilter === "Tümü" ? ops : ops.filter((op: any) => op.category === calendarFilter);
                  
                  if (filteredOps.length === 0) {
                    return <div className="text-center text-v3-muted py-8">{t('dashboard.noFilterData') || "Seçili filtreye uygun kayıt bulunmuyor."}</div>;
                  }

                  return filteredOps.map((op: any, i: number) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-v3-surface/30 hover:bg-slate-100 dark:hover:bg-v3-surface transition-colors">
                      <div className={`w-2 rounded-full ${op.color}`} />
                      <div className="flex-1">
                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-v3-muted`}>
                          {op.category}
                        </div>
                        <div className="text-sm text-slate-700 dark:text-v3-text/90 whitespace-pre-wrap leading-relaxed">
                          {op.title.split(' | ').map((part:string, idx:number) => (
                            <div key={idx} className="mb-0.5">
                              {part}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    
      <AnimatePresence>
        {fullscreenChart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/90 dark:bg-v3-bg/95 backdrop-blur-md flex flex-col p-6 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-v3-text uppercase tracking-widest">{getFullscreenTitle(fullscreenChart)}</h2>
              <button onClick={() => setFullscreenChart(null)} className="p-3 bg-white dark:bg-v3-surface rounded-full shadow-lg border border-slate-200 dark:border-v3-border hover:bg-slate-50 dark:hover:bg-v3-border transition-colors">
                <X size={24} className="text-v3-text" />
              </button>
            </div>
            <div className="flex-1 bg-white dark:bg-v3-surface rounded-3xl shadow-xl border border-slate-200 dark:border-v3-border p-6 overflow-y-auto no-scrollbar">
              <div className="w-full h-full min-h-[600px]">
                {/* Render the full chart based on ID */}
                {fullscreenChart === 'funnel' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Funnel dataKey="value" data={m.funnelData} isAnimationActive>
                        <LabelList position="right" fill="var(--v3-text)" stroke="none" dataKey="name" fontSize={14} />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'agency' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={m.agencyData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={100} interval={0} tickFormatter={(val: string) => val.length > 25 ? val.substring(0, 25) + '...' : val} />
                      <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `%${v}`} />
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Ciro" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('dashboard.sales') || "Satış"} />
                      <Line yAxisId="right" type="monotone" dataKey="Marj" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} name={t('dashboard.margin') || "Marj"} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'hotel' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={m.hotelData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={100} interval={0} tickFormatter={(val: string) => val.length > 25 ? val.substring(0, 25) + '...' : val} />
                      <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `%${v}`} />
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Ciro" fill="#06b6d4" radius={[4, 4, 0, 0]} name={t('dashboard.sales') || "Satış"} />
                      <Line yAxisId="right" type="monotone" dataKey="Marj" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} name={t('dashboard.margin') || "Marj"} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'projEff' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={m.projectEfficiencyData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `%${v}`} />
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Ciro" fill="#10b981" radius={[4, 4, 0, 0]} name={t('dashboard.totalRevShort') || "Ciro"} />
                      <Line yAxisId="right" type="monotone" dataKey="Marj" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} name={t('dashboard.margin') || "Marj"} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
                
                {fullscreenChart === 'airline' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={m.airlineData} cx="50%" cy="50%" innerRadius={120} outerRadius={160} paddingAngle={2} dataKey="Adet" nameKey="name" label={(entry) => entry.name}>
                        {m.airlineData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'vehicle' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={m.vehicleData} cx="50%" cy="50%" innerRadius={120} outerRadius={160} paddingAngle={2} dataKey="Adet" nameKey="name" label={(entry) => entry.name}>
                        {m.vehicleData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'transferSupplier' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={m.transferSupplierData} cx="50%" cy="50%" innerRadius={120} outerRadius={160} paddingAngle={2} dataKey="Adet" nameKey="name" label={(entry) => entry.name}>
                        {m.transferSupplierData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'conversion' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={m.conversionChartData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip t={t} language={language} />} cursor={{ fill: "#ffffff05" }} />
                      <Legend />
                      <Bar dataKey="Bekleyen Teklif" name={t('dashboard.pendingQuote') || "Bekleyen Teklif"} fill="#fbbf24" radius={[4, 4, 0, 0]} stackId="a" />
                      <Bar dataKey="İptal Olan Teklif" name={t('dashboard.canceledQuote') || "İptal Olan Teklif"} fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
                      <Bar dataKey="Konfirme Teklif" name={t('dashboard.confirmedQuote') || "Konfirme Teklif"} fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                      <Bar dataKey="Tamamlanan Proje" name={t('dashboard.completedProject') || "Tamamlanan Proje"} fill="#10b981" radius={[4, 4, 0, 0]} stackId="b" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'supplier' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={m.supplierCostData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={100} interval={0} tickFormatter={(val: string) => val.length > 25 ? val.substring(0, 25) + '...' : val} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Legend />
                      <Bar dataKey="Maliyet" fill="#e11d48" radius={[4, 4, 0, 0]} name={t('dashboard.cost') || "Maliyet"} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {fullscreenChart === 'sejEff' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={m.sejourEfficiencyData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `%${v}`} />
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Ciro" fill="#f59e0b" radius={[4, 4, 0, 0]} name={t('dashboard.totalRevShort') || "Ciro"} />
                      <Line yAxisId="right" type="monotone" dataKey="Marj" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} name={t('dashboard.margin') || "Marj"} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'airline' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={m.airlineData} cx="50%" cy="50%" innerRadius={120} outerRadius={160} paddingAngle={2} dataKey="Adet">
                        {m.airlineData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '14px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'vehicle' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={m.vehicleData} cx="50%" cy="50%" innerRadius={120} outerRadius={160} paddingAngle={2} dataKey="Adet">
                        {m.vehicleData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '14px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'supplierTransfer' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={m.transferSupplierData} cx="50%" cy="50%" innerRadius={120} outerRadius={160} paddingAngle={2} dataKey="Adet">
                        {m.transferSupplierData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '14px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'quoteConv' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={m.conversionChartData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={100} interval={0} tickFormatter={(val: string) => val.length > 25 ? val.substring(0, 25) + '...' : val} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Bar dataKey="Tutar" fill="#6366f1" radius={[4, 4, 0, 0]} name={t('dashboard.amount' as any) || "Tutar"} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {fullscreenChart === 'supplierCost' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={m.supplierCostData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--v3-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={100} interval={0} tickFormatter={(val: string) => val.length > 25 ? val.substring(0, 25) + '...' : val} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip content={<CustomTooltip t={t} language={language} />} />
                      <Bar dataKey="Maliyet" fill="#f43f5e" radius={[4, 4, 0, 0]} name={t('dashboard.totalCostShort') || "Maliyet"} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
