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
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
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
      {new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(count)}
      {suffix}
    </span>
  );
};

// --- Formatters ---
const formatMoney = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n || 0);
const formatInt = (n: number) => new Intl.NumberFormat("tr-TR").format(n || 0);
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
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Check if data is an object with our custom fields (Ciro, Maliyet, Kar/Zarar, Marj vb.)
    // If it has them, render all relevant fields.
    // Otherwise fallback to default payload.map
    
    // Check for our custom fields (from hotelData, agencyData, projectEfficiencyData, sejourEfficiencyData)
    if (data && ('Ciro' in data || 'Satış' in data || 'Maliyet' in data || 'Kar/Zarar' in data || 'Adet' in data)) {
      const formatMoneySafe = (val: any) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(val || 0);
      return (
        <div className="bg-[#0f172a]/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 relative min-w-[150px]">
          <p className="text-white font-bold mb-2 pb-2 border-b border-white/10">{label}</p>
          {('Proje Ref' in data) && <p className="text-slate-300 text-[11px] flex justify-between gap-4 font-mono mb-1"><span>Ref:</span> <span>{data['Proje Ref']}</span></p>}
          {('Firma' in data) && <p className="text-slate-300 text-[11px] flex justify-between gap-4 font-mono mb-1"><span>Firma:</span> <span className="truncate max-w-[120px]">{data['Firma']}</span></p>}
          {('Tarih' in data) && <p className="text-slate-300 text-[11px] flex justify-between gap-4 font-mono mb-2 border-b border-white/10 pb-2"><span>Tarih:</span> <span>{data['Tarih']}</span></p>}
          {('Ciro' in data) && <p className="text-emerald-400 text-[11px] flex justify-between gap-4 font-mono"><span>Ciro:</span> <span>{formatMoneySafe(data['Ciro'])}</span></p>}
          {('Satış' in data) && <p className="text-emerald-400 text-[11px] flex justify-between gap-4 font-mono"><span>Satış:</span> <span>{formatMoneySafe(data['Satış'])}</span></p>}
          {('Maliyet' in data) && <p className="text-rose-400 text-[11px] flex justify-between gap-4 font-mono"><span>Maliyet:</span> <span>{formatMoneySafe(data['Maliyet'])}</span></p>}
          {('Kar/Zarar' in data) && <p className={`text-[11px] flex justify-between gap-4 font-mono ${(data['Kar/Zarar'] || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}><span>Kar/Zarar:</span> <span>{formatMoneySafe(data['Kar/Zarar'])}</span></p>}
          {('Kar' in data) && <p className={`text-[11px] flex justify-between gap-4 font-mono ${(data['Kar'] || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}><span>Kâr:</span> <span>{formatMoneySafe(data['Kar'])}</span></p>}
          {('Marj' in data) && <p className="text-amber-400 text-[11px] flex justify-between gap-4 font-mono"><span>Marj:</span> <span>%{data['Marj']}</span></p>}
          {('Adet' in data) && <p className="text-cyan-400 text-[11px] flex justify-between gap-4 font-mono"><span>Adet:</span> <span>{data['Adet']}</span></p>}
          {('value' in data && !('Ciro' in data) && !('Adet' in data)) && <p className="text-white text-[11px] flex justify-between gap-4 font-mono"><span>Değer:</span> <span>{data['value']}</span></p>}
        </div>
      );
    }

    return (
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 relative">
        <p className="text-white font-bold mb-2">{label}</p>
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
              <span className="text-slate-300">{entry.name}:</span>
              <span className="text-white font-bold">
                {isMoney ? formatMoney(entry.value) : formatInt(entry.value)}
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
const GlassCard = ({ children, className = "", glowColor = "" }: any) => (
  <div
    className={`relative bg-[#0f172a]/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-visible ${className}`}
  >
    {glowColor && (
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 bg-${glowColor}-500/20 blur-3xl rounded-full pointer-events-none`}
      />
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
}: any) => {
  const colors: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    emerald: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
    rose: "text-rose-400 bg-rose-500/20 border-rose-500/30",
    fuchsia: "text-fuchsia-400 bg-fuchsia-500/20 border-fuchsia-500/30",
    amber: "text-amber-400 bg-amber-500/20 border-amber-500/30",
    violet: "text-violet-400 bg-violet-500/20 border-violet-500/30",
    cyan: "text-cyan-400 bg-cyan-500/20 border-cyan-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 flex flex-col justify-between relative overflow-hidden group border border-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-3xl`}
    >
      <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={100} />
      </div>
      <div className="flex justify-between items-start z-10">
        <div
          className={`p-2.5 rounded-xl ${colors[color] || colors.blue} border shadow-[0_0_20px_rgba(0,0,0,0.3)]`}
        >
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${trend >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4 z-10">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">
          {title}
        </p>
        <h4 className="text-xl lg:text-2xl font-black text-white mt-1 tracking-tight truncate">
          {isMoney ? (
            <CountUp value={value} prefix="₺" decimals={decimals} />
          ) : (
            <CountUp value={value} suffix={suffix} decimals={decimals} />
          )}
        </h4>
      </div>
    </motion.div>
  );
};

export default function UltimateDashboard() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("year");
  const [customDate, setCustomDate] = useState({ start: "", end: "" });
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState("Tümü");

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState<"month"|"year"|"decade"|"century">("month");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCalendarDate(null);
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
        supabase.from("project_human_resources").select("*"),
        hotelsService.getAll(),
        suppliersService.getAll(),
        supabase.from("project_events_activities").select("*"),
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
    const range = getPeriodRange(period, customDate.start, customDate.end);

    // Filtering base data
    const fProj = data.rpProjectRows.filter((r: any) =>
      inRange(r.organizasyon_tarihi || r.created_at, range),
    );
    const fSej = data.rpSejourRows.filter((r: any) =>
      inRange(r.giris_tarihi || r.created_at, range),
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
      inRange(f.gidis_tarihi || f.created_at, range),
    );
    const fHr = data.hrRows.filter((h: any) =>
      inRange(h.start_date || h.created_at, range),
    );
    const fEvents = data.events.filter((e: any) =>
      inRange(e.event_date || e.created_at, range),
    );
    const fMkt = data.marketingInteractions.filter((m: any) =>
      inRange(m.created_at || m.date, range),
    );
    const fAccs = (data.accommodations || []).filter((a: any) =>
      inRange(a.check_in_date || a.created_at, range),
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
        name: "Etkileşim (Toplantı/Mail)",
        value: totalMkt,
        fill: "#8b5cf6",
      },
      { name: "Oluşturulan Teklif", value: pendingQts, fill: "#3b82f6" },
      { name: "Kazanılan Proje", value: wonQts, fill: "#10b981" },
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
      const a = p.acente || getAgencyName(p.agency_id, p.musteri_adi || p.acente_adi || "Bilinmeyen Acente");
      if (!agnMap[a]) agnMap[a] = { name: a, ciro: 0, maliyet: 0 };
      agnMap[a].ciro += Number(p.satis_tl) || 0;
      agnMap[a].maliyet += Number(p.maliyet_tl) || 0;
    });
    fSej.forEach((s: any) => {
      const a = s.acente || getAgencyName(s.agency_id, s.acente_adi || s.musteri_adi || "Bilinmeyen Acente");
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
        Marj: a.ciro > 0 ? Math.round(((a.ciro - a.maliyet) / a.ciro) * 100) : 0,
      }))
      .sort((a, b) => b.Ciro - a.Ciro)
      .slice(0, 10);

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
      const h = getHotelName(si.hotel_id, "Bilinmeyen Otel (Proje)");
      if (!htlMap[h]) htlMap[h] = { ciro: 0, maliyet: 0 };
      htlMap[h].ciro += (Number(si.total_try) || (Number(si.total_price) * Number(si.fx)) || 0);
    });
    
    projPurchInRange.forEach((pi: any) => {
      const h = getHotelName(pi.hotel_id, "Bilinmeyen Otel (Proje)");
      if (!htlMap[h]) htlMap[h] = { ciro: 0, maliyet: 0 };
      htlMap[h].maliyet += (Number(pi.total_try) || (Number(pi.total_price) * Number(pi.fx)) || 0);
    });

    fSej.forEach((s: any) => {
      const h = s.otel || s.hotel_name || s.hotelName || getHotelName(s.hotel_id, "Bilinmeyen Otel");
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
        Marj: htlMap[k].ciro > 0 ? Math.round(((htlMap[k].ciro - htlMap[k].maliyet) / htlMap[k].ciro) * 100) : 0,
      }))
      .sort((a, b) => b.Ciro - a.Ciro)
      .slice(0, 10);

    // Airline Distribution
    const airMap: Record<string, number> = {};
    fFlights.forEach((f: any) => {
      const a = f.airline || f.havayolu || "Diğer";
      airMap[a] = (airMap[a] || 0) + 1;
    });
    const airlineData = Object.keys(airMap)
      .map((k) => ({ name: k, Adet: airMap[k] }))
      .sort((a, b) => b.Adet - a.Adet);

    // Vehicle Types
    const vehMap: Record<string, number> = {};
    fTransfers.forEach((t: any) => {
      const v = t.vehicle_type || t.arac_tipi || "Diğer";
      vehMap[v] = (vehMap[v] || 0) + 1;
    });
    const vehicleData = Object.keys(vehMap)
      .map((k) => ({ name: k, Adet: vehMap[k] }))
      .sort((a, b) => b.Adet - a.Adet);

    // HR Types
    const hrMap: Record<string, number> = {};
    fHr.forEach((h: any) => {
      const r = h.role || h.personnel_type || h.type || "Diğer";
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
      const dateStr = p.organizasyon_tarihi || p.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const monthKey = date.toLocaleDateString("tr-TR", { month: "short", year: "numeric" });
      
      if (!projMonthlyMap[monthKey]) {
        projMonthlyMap[monthKey] = { name: monthKey, Ciro: 0, Maliyet: 0, "Kar/Zarar": 0 };
      }
      projMonthlyMap[monthKey].Ciro += c;
      projMonthlyMap[monthKey].Maliyet += m;
      projMonthlyMap[monthKey]["Kar/Zarar"] += (c - m);
    });
    
    const projectEfficiencyData = Object.values(projMonthlyMap).map((item: any) => {
      item.Marj = item.Ciro > 0 ? Math.round((item["Kar/Zarar"] / item.Ciro) * 100) : 0;
      return item;
    });

    // New Chart: Sejour Efficiency (Aylık Toplu)
    const sejMonthlyMap: Record<string, any> = {};
    fSej.forEach((s: any) => {
      const c = Number(s.satis_tl) || 0;
      const m = Number(s.maliyet_tl) || 0;
      const dateStr = s.giris_tarihi || s.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const monthKey = date.toLocaleDateString("tr-TR", { month: "short", year: "numeric" });
      
      if (!sejMonthlyMap[monthKey]) {
        sejMonthlyMap[monthKey] = { name: monthKey, Ciro: 0, Maliyet: 0, "Kar/Zarar": 0 };
      }
      sejMonthlyMap[monthKey].Ciro += c;
      sejMonthlyMap[monthKey].Maliyet += m;
      sejMonthlyMap[monthKey]["Kar/Zarar"] += (c - m);
    });
    
    const sejourEfficiencyData = Object.values(sejMonthlyMap).map((item: any) => {
      item.Marj = item.Ciro > 0 ? Math.round((item["Kar/Zarar"] / item.Ciro) * 100) : 0;
      return item;
    });

    // New Chart: Aylık Finansal Özet (Ciro, Maliyet, Kar, Marj)
    const monthlyFinMap: Record<string, any> = {};

    fProj.forEach((p: any) => {
      const c = Number(p.satis_tl) || 0;
      const m = Number(p.maliyet_tl) || 0;
      const dateStr = p.organizasyon_tarihi || p.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const sortKey = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      const monthName = date.toLocaleDateString("tr-TR", { month: "short", year: "numeric" });
      
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
      const dateStr = s.giris_tarihi || s.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const sortKey = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      const monthName = date.toLocaleDateString("tr-TR", { month: "short", year: "numeric" });
      
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
      const monthName = date.toLocaleDateString("tr-TR", { month: "short", year: "numeric" });
      
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
         item.Marj = item.Ciro > 0 ? Math.round((item["Kar/Zarar"] / item.Ciro) * 100) : 0;
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
      const monthKey = date.toLocaleDateString("tr-TR", { month: "short", year: "numeric" });
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
    })).sort((a,b) => b.Maliyet - a.Maliyet).slice(0, 10);
    const supMap: Record<string, number> = {};
    fTransfers.forEach((t: any) => {
      const s = getSupplierName(t.supplier_id, "Bilinmeyen Tedarikçi");
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
      
      // Prevent infinite loops if dates are somehow invalid but parsed
      let safetyCount = 0;
      while (current <= end && safetyCount < 365) {
        allOps.push({
          date: new Date(current),
          category,
          title,
          color
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
      const cIn = new Date(sd).toLocaleDateString("tr-TR");
      const cOut = new Date(ed).toLocaleDateString("tr-TR");
      
      addOp(sd, ed, "Proje", `Proje: ${code} | C-IN: ${cIn} | C-OUT: ${cOut} | Firma: ${firma} | Acente: ${acente}`, "bg-blue-500");
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
        
        addOp(sd, ed, "Ekip", `Ekip: ${code} | Sorumlu: ${sorumlular} | Otel: ${hotel} | Firma: ${firma} | Acente: ${acente}`, "bg-indigo-500");
      }
    });

    data.sejours.forEach((s: any) => {
      const hotel = s.hotelName || s.hotel_name || s.rooms?.[0]?.hotelName || s.hotels?.name || getHotelName(s.hotel_id, "-");
      const acente = s.agencyName || s.agencies?.name || s.agency_name || "-";
      const sd = s.checkInDate || s.check_in_date || s.created_at;
      const ed = s.checkOutDate || s.check_out_date || sd;
      const voucher = s.voucherNumber || s.voucher_number || "-";
      const customer = s.customerName || s.customer_name || "-";
      const cIn = new Date(sd).toLocaleDateString("tr-TR");
      const cOut = new Date(ed).toLocaleDateString("tr-TR");
      
      addOp(sd, ed, "Sejour", `Sejour: Voucher: ${voucher} | C-IN: ${cIn} | C-OUT: ${cOut} | Misafir: ${customer} | Acente: ${acente} | Otel: ${hotel}`, "bg-emerald-500");
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
      <div className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden pt-4 pb-10 px-4 gap-4 custom-scrollbar">
      {/* Top Header: Title & Filters */}
      <div className="shrink-0 flex flex-col gap-3 z-10">
        <div className="flex flex-wrap items-center justify-start gap-8">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-white glow-text">
              Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Detaylı Ciro, Hacim ve Operasyon Haritası.
            </p>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2 p-1 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl w-fit h-[40px]">
              {(
                [
                  { id: "today", label: "Bugün" },
                  { id: "week", label: "Bu Hafta" },
                  { id: "month", label: "Bu Ay" },
                  { id: "lastMonth", label: "Geçen Ay" },
                  { id: "year", label: "Bu Yıl" },
                  { id: "lastYear", label: "Geçen Yıl" },
                  { id: "all", label: "Tümü" },
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
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
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
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Calendar size={14} />
                Özel Tarih
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
                      label="Tarih Aralığı"
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
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-all duration-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 ml-1 h-[40px]"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Yenile
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative custom-scrollbar pr-2 relative">
        {/* ROW 1: KONSOLİDE FİNANS & CİRO DAĞILIMI */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 relative z-10">
          <KPICard title="Toplam Ciro" value={m.totalRev} isMoney icon={Landmark} color="emerald" />
          <KPICard title="Toplam Maliyet" value={m.totalCost} isMoney icon={TrendingDown} color="rose" />
          <KPICard title="MICE (Proje) Ciro" value={m.miceRev} isMoney icon={Briefcase} color="blue" />
          <KPICard title="Sejour (Otel) Ciro" value={m.sejRev} isMoney icon={Hotel} color="cyan" />
          <KPICard title="Bilet Ciro" value={m.flightRev} isMoney icon={Ticket} color="amber" />
          <KPICard title="Toplam Kâr" value={m.totalProfit} isMoney icon={Award} color="fuchsia" />
        </div>

        {/* ROW 1.5: AYLIK FİNANSAL ÖZET */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 relative z-10">
          <div className="xl:col-span-12 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="fuchsia">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-fuchsia-400" /> Aylık Finansal Özet
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                Toplam Ciro, Maliyet, Kâr Tutarı ve Kâr Marjı Analizi (Takvim Yılı)
              </p>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-4 pt-2">
                {m.monthlyFinancialData.map((row: any, i: number) => (
                  <div key={i} className="min-w-[140px] shrink-0 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group hover:bg-white/10 transition-all duration-300">
                    <div className="absolute -right-4 -top-6 text-white/[0.03] text-5xl font-black pointer-events-none group-hover:text-white/[0.06] transition-colors duration-300">
                      {row.name.split(' ')[0]}
                    </div>
                    <h3 className="font-bold text-white text-sm relative z-10">{row.name}</h3>
                    
                    <div className="flex flex-col gap-1.5 relative z-10">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Ciro</span>
                        <span className="text-emerald-400 font-mono font-medium">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(row.Ciro)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Maliyet</span>
                        <span className="text-rose-400 font-mono font-medium">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(row.Maliyet)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-2 border-t border-white/10 flex justify-between items-end relative z-10">
                      <div>
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest mb-1">Kâr/Zarar</p>
                        <p className={`font-black text-xs ${row['Kar/Zarar'] >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(row['Kar/Zarar'])}
                        </p>
                      </div>
                      <div className="bg-[#0f172a]/80 px-1.5 py-0.5 rounded-lg border border-white/10 shadow-inner">
                        <span className="text-amber-400 font-mono font-bold text-[10px]">%{row.Marj}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {m.monthlyFinancialData.length === 0 && (
                  <div className="w-full p-8 text-center text-slate-500 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                    Bu tarih aralığı için finansal veri bulunmuyor.
                  </div>
                )}

                {m.monthlyFinancialData.length > 0 && (
                  <div className="min-w-[180px] shrink-0 bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 border border-fuchsia-500/30 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group shadow-lg shadow-fuchsia-500/10">
                    <div className="absolute -right-6 -bottom-6 text-fuchsia-500/10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                      <BarChart3 size={80} />
                    </div>
                    <h3 className="font-black text-fuchsia-100 text-sm relative z-10">Yıllık Toplam</h3>
                    
                    <div className="flex flex-col gap-1.5 relative z-10">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-fuchsia-200/70">Top. Ciro</span>
                        <span className="text-emerald-300 font-mono font-bold">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row.Ciro, 0))}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-fuchsia-200/70">Top. Mal.</span>
                        <span className="text-rose-300 font-mono font-bold">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row.Maliyet, 0))}</span>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-2 border-t border-fuchsia-500/30 flex justify-between items-end relative z-10">
                      <div>
                        <p className="text-[9px] text-fuchsia-300/70 uppercase tracking-widest mb-1">Net Kâr</p>
                        <p className={`font-black text-sm ${m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row['Kar/Zarar'], 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row['Kar/Zarar'], 0))}
                        </p>
                      </div>
                      <div className="bg-[#4a044e]/50 px-1.5 py-0.5 rounded-lg border border-fuchsia-500/30 backdrop-blur-md">
                        <span className="text-fuchsia-300 font-mono font-black text-xs">
                          %{m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row.Ciro, 0) > 0 ? Math.round((m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row['Kar/Zarar'], 0) / m.monthlyFinancialData.reduce((acc: number, row: any) => acc + row.Ciro, 0)) * 100) : 0}
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
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="violet">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Target size={18} className="text-violet-400" /> Pazarlama
                Hunisi
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                Etkileşimden Projeye Dönüşüm
              </p>
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {m.funnelData.reduce((a:number, b:any) => a + (b.value||0), 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                      <AlertCircle size={32} className="text-violet-500 mb-2" />
                      <span className="text-xs font-bold text-center">Henüz Pazarlama Verisi Yok</span>
                    </div>
                  ) : (
                  <FunnelChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Funnel
                      dataKey="value"
                      data={m.funnelData}
                      isAnimationActive
                    >
                      <LabelList
                        position="right"
                        fill="#fff"
                        stroke="none"
                        dataKey="name"
                        fontSize={11}
                      />
                    </Funnel>
                  </FunnelChart>)}
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Bekleyen Teklif Ciro
                  </p>
                  <p className="text-xl font-black text-amber-400 mt-1">
                    {formatMoney(m.pendingQtsValue)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {m.pendingQts} Adet Teklif
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Kazanılan Teklif
                  </p>
                  <p className="text-xl font-black text-emerald-400 mt-1">
                    {m.wonQts} Adet
                  </p>
                  <p className="text-xs text-slate-500">Projeleşen</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Agency Volume & Profit */}
          <div className="xl:col-span-8 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="blue">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Building2 size={18} className="text-blue-400" /> Acente Bazlı
                Hacim ve Kârlılık
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                En çok ciro üreten ilk 10 acente (MICE + Sejour)
              </p>
              <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={m.agencyData}
                    margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff10"
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
                      height={60}
                      interval={0}
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
                      content={<CustomTooltip />}
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
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={24}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="Marj"
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
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="cyan">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Hotel size={18} className="text-cyan-400" /> Otel Bazlı Ciro
                Analizi
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                En Yüksek Cirolu 10 Otel
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.hotelData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff10"
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
                      stroke="#cbd5e1"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "#ffffff05" }}
                    />
                    <Bar
                      dataKey="Satış"
                      fill="#06b6d4"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    >
                      {m.hotelData.map((entry: any, index: number) => (
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
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="emerald">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Target size={18} className="text-emerald-400" /> Proje Verimliliği
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                En Yüksek Cirolu MICE Projeleri
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.projectEfficiencyData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff05" }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Ciro" fill="#10b981" radius={[0, 4, 4, 0]} barSize={8} />
                    <Bar dataKey="Maliyet" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={8} />
                    <Bar dataKey="Kar/Zarar" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Sejour Efficiency */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="blue">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Hotel size={18} className="text-blue-400" /> Sejour Verimliliği
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                Konfirme Sejour Rezervasyonları
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.sejourEfficiencyData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(1)}K`} />
                    <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff05" }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Ciro" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={8} />
                    <Bar dataKey="Maliyet" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={8} />
                    <Bar dataKey="Kar/Zarar" fill="#10b981" radius={[0, 4, 4, 0]} barSize={8} />
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
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="amber">
              <h2 className="text-md font-black text-white flex items-center gap-2">
                <Plane size={16} className="text-amber-400" /> Havayolu Dağılımı
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
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Vehicles */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="fuchsia">
              <h2 className="text-md font-black text-white flex items-center gap-2">
                <Bus size={16} className="text-fuchsia-400" /> Araç Tipi Kullanımı
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
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Transfer Suppliers */}
          <div className="xl:col-span-4 flex flex-col">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="rose">
              <h2 className="text-md font-black text-white flex items-center gap-2">
                <Building2 size={16} className="text-rose-400" /> Transfer Tedarikçi Dağılımı
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
                    <Tooltip content={<CustomTooltip />} />
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
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="emerald">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Target size={18} className="text-emerald-400" /> Teklif & Proje Dönüşüm Grafiği
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                Aylık Teklif Durumları ve Tamamlanan Projeler
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.conversionChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff05" }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Bekleyen Teklif" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={12} stackId="a" />
                    <Bar dataKey="İptal Olan Teklif" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} stackId="a" />
                    <Bar dataKey="Konfirme Teklif" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} stackId="a" />
                    <Bar dataKey="Tamamlanan Proje" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} stackId="b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Supplier Cost Analysis */}
          <div className="xl:col-span-4 flex flex-col mb-4">
            <GlassCard className="p-5 flex-1 flex flex-col" glowColor="rose">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Building2 size={18} className="text-rose-400" /> Tedarikçi Gider Analizi
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">
                MICE ve Sejour Tedarikçi Maliyetleri (En Yüksek 10)
              </p>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={m.supplierCostData}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 }).format(value)} />
                    <YAxis dataKey="name" type="category" width={80} stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff05" }} />
                    <Bar dataKey="Maliyet" fill="#fb7185" radius={[0, 4, 4, 0]} barSize={12}>
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
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Clock size={18} className="text-blue-400" /> Operasyonel Takvim
                  </h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Proje, Sejour, Uçuş, Transfer ve İK Akışı
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Tümü", "Proje", "Sejour", "Ekip"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setCalendarFilter(f)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                        calendarFilter === f 
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
                          : "bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full bg-white/5 rounded-2xl p-4 border border-white/10 overflow-hidden relative dashboard-calendar">
                <style dangerouslySetInnerHTML={{__html: `
                  .dashboard-calendar .react-calendar {
                    width: 100%;
                    background: transparent;
                    border: none;
                    font-family: inherit;
                    color: white;
                  }
                  .dashboard-calendar .react-calendar__navigation button {
                    color: white;
                    font-weight: bold;
                    border-radius: 8px;
                  }
                  .dashboard-calendar .react-calendar__navigation button:enabled:hover,
                  .dashboard-calendar .react-calendar__navigation button:enabled:focus {
                    background-color: rgba(255, 255, 255, 0.1);
                  }
                  .dashboard-calendar .react-calendar__month-view__days__day {
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    height: 100px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    padding: 4px;
                  }
                  .dashboard-calendar .react-calendar__month-view__days__day--neighboringMonth {
                    color: rgba(255, 255, 255, 0.2);
                  }
                  .dashboard-calendar .react-calendar__tile:enabled:hover,
                  .dashboard-calendar .react-calendar__tile:enabled:focus {
                    background-color: rgba(255, 255, 255, 0.05);
                  }
                  .dashboard-calendar .react-calendar__tile--now {
                    background-color: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.5);
                  }
                  .dashboard-calendar .react-calendar__tile--active {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                    color: white;
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
                  className="dashboard-calendar w-full border-none shadow-sm rounded-xl p-2 bg-white/50 backdrop-blur-sm"
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
                        const visibleOps = dayOps.slice(0, 3);
                        const hiddenCount = dayOps.length - 3;
                        
                        return (
                          <div className="flex flex-col gap-1 w-full max-h-[70px] overflow-hidden mt-1">
                            {visibleOps.map((op: any, i: number) => (
                              <div 
                                key={i} 
                                className={`text-[9px] leading-tight px-1.5 py-0.5 rounded-sm truncate text-white ${op.color} shadow-sm`}
                                title={op.title}
                              >
                                {op.title}
                              </div>
                            ))}
                            {hiddenCount > 0 && (
                              <div className="text-[9px] font-bold text-center text-slate-400 bg-slate-800/50 rounded-sm py-0.5 shadow-sm">
                                +{hiddenCount} Operasyon
                              </div>
                            )}
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
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-500" />
                  {selectedCalendarDate.toLocaleDateString("tr-TR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <button
                  onClick={() => setSelectedCalendarDate(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {(() => {
                  const ops = m.allOps.filter((op:any) => op.date.toDateString() === selectedCalendarDate.toDateString());
                  if (ops.length === 0) {
                    return <div className="text-center text-slate-500 py-8">Bu tarihte herhangi bir operasyon kaydı bulunmuyor.</div>;
                  }
                  
                  const filteredOps = calendarFilter === "Tümü" ? ops : ops.filter((op: any) => op.category === calendarFilter);
                  
                  if (filteredOps.length === 0) {
                    return <div className="text-center text-slate-500 py-8">Seçili filtreye uygun kayıt bulunmuyor.</div>;
                  }

                  return filteredOps.map((op: any, i: number) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className={`w-2 rounded-full ${op.color}`} />
                      <div className="flex-1">
                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400`}>
                          {op.category}
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
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

    </div>
  );
}
