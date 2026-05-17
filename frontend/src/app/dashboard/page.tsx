'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  Plane, 
  Calendar, 
  RefreshCw, 
  ChevronRight, 
  Briefcase, 
  Hotel, 
  Ticket,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  agenciesService,
  categoriesService,
  hotelsService,
  projectCollectionPlansService,
  projectHumanResourcesService,
  projectPaymentPlansService,
  projectsService,
  projectTransfersService,
  quotesService,
  SejourService,
  suppliersService,
  ticketOptionsService,
  ticketPaymentPlansService
} from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import { DateRangeFieldAccounting } from '@/components/accounting/DateRangeFieldAccounting';
import { usePermissions, Module } from '@/lib/permissions';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';


const TurkishLiraIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M6 18V6c0-1 1-2 2-2h4c1 0 2 1 2 2v4c0 1-1 2-2 2H6" />
    <path d="M14 10H6" />
    <path d="M14 14H6" />
  </svg>
);

type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

type DashboardState = {
  projects: any[];
  quotes: any[];
  sejours: any[];
  tickets: any[];
  projectTransfers: any[];
  hrRows: any[];
  collectionPlans: any[];
  paymentPlans: any[];
  ticketPlans: any[];
  categoryById: Record<string, string>;
  agencyById: Record<string, string>;
  hotelById: Record<string, string>;
  supplierById: Record<string, string>;
  rpProjectRows: any[];
  rpSejourRows: any[];
  reportWarnings: string[];
  salesItems?: any[];
  purchaseItems?: any[];
};

const toNumber = (value: any) => Number(value || 0);
const parseDateSafe = (value: any) => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    const [d, m, y] = value.split('.');
    const dt = new Date(`${y}-${m}-${d}T00:00:00`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const formatMoney = (n: number) => new Intl.NumberFormat('tr-TR', { 
  style: 'currency', 
  currency: 'TRY', 
  maximumFractionDigits: 0 
}).format(n || 0);

const formatInt = (n: number) => new Intl.NumberFormat('tr-TR').format(n || 0);
const formatMillion = (n: number) => `${(toNumber(n) / 1_000_000).toFixed(2)}M`;
const normalizeStatus = (status: any) => String(status || '').toLocaleLowerCase('tr-TR').trim();

const shortDate = (value: any) => {
  const dt = parseDateSafe(value);
  return dt ? dt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : '-';
};

const getPeriodRange = (period: PeriodFilter, customStart?: string, customEnd?: string) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === 'week') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === 'custom') {
    const cs = customStart ? parseDateSafe(customStart) : null;
    const ce = customEnd ? parseDateSafe(customEnd) : null;
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

// --- COMPONENTS ---

function DashboardCard({ 
  title, 
  subtitle, 
  href, 
  icon: Icon, 
  children,
  className = "" 
}: { 
  title: string; 
  subtitle?: string; 
  href?: string; 
  icon?: any; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="text-blue-600 dark:text-blue-400">
              <Icon size={18} />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-none">{title}</h3>
            {subtitle && <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">{subtitle}</p>}
          </div>
        </div>
        {href && (
          <Link href={href} className="text-gray-400 hover:text-blue-600 transition-colors">
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
}

function StatBox({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  color = "blue",
  subValue
}: { 
  label: string; 
  value: string; 
  icon: any; 
  trend?: { type: 'up' | 'down', text: string }; 
  color?: string;
  subValue?: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-800",
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5 flex flex-col justify-between`}>
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${colors[color] || colors.blue} border`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold ${
            trend.type === 'up' ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {trend.type === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend.text}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
        <h4 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{value}</h4>
        {subValue && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-bold">{subValue}</p>}
      </div>
    </div>
  );
}

function ProgressList({ rows, money }: { rows: Array<{ name: string; amount?: number; count?: number }>; money?: boolean }) {
  const max = Math.max(...rows.map((r) => r.amount || r.count || 0), 1);
  return (
    <div className="space-y-3.5">
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4 italic">Veri bulunamadı</p>
      ) : (
        rows.map((r) => {
          const value = r.amount || r.count || 0;
          const pct = (value / max) * 100;
          return (
            <div key={r.name} className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-gray-700 dark:text-gray-300 truncate pr-2 uppercase tracking-wide">{r.name}</span>
                <span className="text-gray-900 dark:text-white whitespace-nowrap">
                  {money ? formatMoney(value) : formatInt(value)}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" 
                  style={{ width: `${pct}%` }} 
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function BreakdownTable({ rows }: { rows: Array<{ name: string; count: number; revenue: number; cost: number }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 uppercase font-black tracking-widest">
            <th className="pb-2 text-left">İsim</th>
            <th className="pb-2 text-right px-2">Proje</th>
            <th className="pb-2 text-right px-2">Ciro</th>
            <th className="pb-2 text-right pl-2">Kar/Zarar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {rows.map((r) => {
            const profit = r.revenue - r.cost;
            return (
              <tr key={r.name} className="group">
                <td className="py-2.5 font-bold text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{r.name}</td>
                <td className="py-2.5 px-2 text-right font-black text-gray-900 dark:text-white">{formatInt(r.count)}</td>
                <td className="py-2.5 px-2 text-right font-black text-gray-500 dark:text-gray-400">{formatMillion(r.revenue)}</td>
                <td className={`py-2.5 pl-2 text-right font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatMillion(profit)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RevenueChart({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
          <XAxis 
            dataKey="name" 
            fontSize={10} 
            tick={{ fill: '#9CA3AF' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            fontSize={10} 
            tick={{ fill: '#9CA3AF' }} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number) => [formatMoney(value), '']}
          />
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
          <Bar dataKey="revenue" name="Ciro" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="cost" name="Maliyet" fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusPieChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- MAIN PAGE ---

export default function DashboardPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodFilter>('year');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [data, setData] = useState<DashboardState>({
    projects: [],
    quotes: [],
    sejours: [],
    tickets: [],
    projectTransfers: [],
    hrRows: [],
    collectionPlans: [],
    paymentPlans: [],
    ticketPlans: [],
    categoryById: {},
    agencyById: {},
    hotelById: {},
    supplierById: {},
    rpProjectRows: [],
    rpSejourRows: [],
    reportWarnings: [],
    salesItems: [],
    purchaseItems: []
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const fetchView = async (viewName: string) => {
        const { data: viewData, error } = await supabase.from(viewName).select('*');
        if (error) throw error;
        return Array.isArray(viewData) ? viewData : [];
      };

      const [projectsRes, quotesRes, sejoursRes, ticketsRes, categoriesRes, collectionPlanRes, paymentPlanRes, ticketPlanRes, agenciesRes, hotelsRes, suppliersRes, rpProjectRes, rpSejourRes, salesItemsRes, purchaseItemsRes] = await Promise.allSettled([
        projectsService.getAll(),
        quotesService.getAll(),
        SejourService.getSejours(),
        ticketOptionsService.getAll(),
        categoriesService.getAll(),
        projectCollectionPlansService.getAll(),
        projectPaymentPlansService.getAll(),
        ticketPaymentPlansService.getAll(),
        agenciesService.getAll(),
        hotelsService.getAll(),
        suppliersService.getAll(),
        fetchView('vw_rp_proje_satis_maliyet'),
        fetchView('vw_rp_sejour_kar_zarar'),
        supabase.from('project_sales_items').select('project_id, hotel_id, total_price, fx'),
        supabase.from('project_purchase_items').select('project_id, hotel_id, total_price, fx')
      ]);

      const safe = (r: PromiseSettledResult<any>) => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []);
      const safeSupabase = (r: PromiseSettledResult<any>) => (r.status === 'fulfilled' && r.value && Array.isArray(r.value.data) ? r.value.data : []);
      const projects = safe(projectsRes);
      const quotes = safe(quotesRes);
      const sejours = safe(sejoursRes);
      const tickets = safe(ticketsRes);
      const categories = safe(categoriesRes);
      const agencies = safe(agenciesRes);
      const hotels = safe(hotelsRes);
      const suppliers = safe(suppliersRes);
      const rpProjectRows = safe(rpProjectRes);
      const rpSejourRows = safe(rpSejourRes);
      const salesItems = safeSupabase(salesItemsRes);
      const purchaseItems = safeSupabase(purchaseItemsRes);

      const categoryById: Record<string, string> = {};
      const agencyById: Record<string, string> = {};
      const hotelById: Record<string, string> = {};
      const supplierById: Record<string, string> = {};
      categories.forEach((c: any) => { categoryById[c.id] = c?.name || ''; });
      agencies.forEach((x: any) => { agencyById[x.id] = x?.name || ''; });
      hotels.forEach((x: any) => { hotelById[x.id] = x?.name || ''; });
      suppliers.forEach((x: any) => { supplierById[x.id] = x?.name || ''; });

      const projectIds = projects.map((p: any) => p.id).filter(Boolean);
      const [transferBuckets, hrBuckets] = await Promise.all([
        Promise.all(projectIds.map((id: string) => projectTransfersService.getByProjectId(id).catch(() => []))),
        Promise.all(projectIds.map((id: string) => projectHumanResourcesService.getByProjectId(id).catch(() => [])))
      ]);

      setData({
        projects,
        quotes,
        sejours,
        tickets,
        projectTransfers: transferBuckets.flat(),
        hrRows: hrBuckets.flat(),
        collectionPlans: safe(collectionPlanRes),
        paymentPlans: safe(paymentPlanRes),
        ticketPlans: safe(ticketPlanRes),
        categoryById,
        agencyById,
        hotelById,
        supplierById,
        rpProjectRows,
        rpSejourRows,
        reportWarnings: [],
        salesItems,
        purchaseItems
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Dashboard loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const {
      projects,
      quotes,
      sejours,
      tickets,
      projectTransfers,
      hrRows,
      categoryById,
      supplierById,
      hotelById,
      rpProjectRows,
      rpSejourRows,
      collectionPlans,
      paymentPlans,
      ticketPlans,
      salesItems,
      purchaseItems
    } = data;

    const hasCustomRange = period !== 'custom' || (customStartDate && customEndDate);
    const range = hasCustomRange ? getPeriodRange(period, customStartDate, customEndDate) : null;

    const filteredQuotes = range ? quotes.filter((q: any) => inRange(q.created_at || q.quote_date || q.option_date, range)) : quotes;
    const filteredProjects = range ? projects.filter((p: any) => inRange(p.start_date || p.created_at, range)) : projects;
    const filteredSejours = range ? sejours.filter((s: any) => inRange(s.checkInDate || s.check_in_date || s.created_at, range)) : sejours;
    const filteredRpProjects = range ? rpProjectRows.filter((r: any) => inRange(r.organizasyon_tarihi, range)) : rpProjectRows;
    const filteredRpSejours = range ? rpSejourRows.filter((r: any) => inRange(r.giris_tarihi, range)) : rpSejourRows;
    const filteredTickets = range ? tickets.filter((t: any) => inRange(t.entry_date || t.created_at || t.departure_date, range)) : tickets;
    const filteredTransfers = range ? projectTransfers.filter((tr: any) => inRange(tr.date || tr.transfer_date || tr.created_at, range)) : projectTransfers;
    const filteredHrRows = range ? hrRows.filter((row: any) => inRange(row.date || row.created_at, range)) : hrRows;
    const filteredCollectionPlans = range ? collectionPlans.filter((p: any) => inRange(p.date || p.created_at, range)) : collectionPlans;
    const filteredTicketPlans = range ? ticketPlans.filter((p: any) => inRange(p.date || p.created_at || p.due_date, range)) : ticketPlans;

    const quotePending = filteredQuotes.filter((q: any) => ['beklemede', 'teklif'].includes(normalizeStatus(q.status)));
    const quoteOption = filteredQuotes.filter((q: any) => ['opsiyon', 'option', 'optional', '1'].includes(String(q.option || '').toLowerCase()) || parseDateSafe(q.option_date));
    const quoteAgency = filteredQuotes.filter((q: any) => !!q.agency_id || (q.company_name && String(q.company_name).trim().length > 0));
    const quoteConfirmed = filteredQuotes.filter((q: any) => normalizeStatus(q.status).includes('konfirme') || normalizeStatus(q.status).includes('confirm'));
    const quoteTotal = quotePending.length + quoteOption.length + quoteConfirmed.length;

    const projectRevenue = filteredRpProjects.reduce((sum, p) => sum + toNumber(p.satis_tl), 0);
    const projectCost = filteredRpProjects.reduce((sum, p) => sum + toNumber(p.maliyet_tl), 0);
    const sejourRevenue = filteredRpSejours.reduce((sum, s) => sum + toNumber(s.satis_tl), 0);
    const sejourCost = filteredRpSejours.reduce((sum, s) => sum + toNumber(s.maliyet_tl), 0);

    const sejourStatusCounts = filteredRpSejours.reduce((acc, s) => {
      const k = normalizeStatus(s.durum);
      if (k.includes('konfirme') || k.includes('confirm')) acc.confirmed += 1;
      else if (k.includes('iptal') || k.includes('cancel')) acc.cancelled += 1;
      else acc.pending += 1;
      return acc;
    }, { pending: 0, cancelled: 0, confirmed: 0 });

    const byAgency: Record<string, { count: number; revenue: number; cost: number }> = {};
    const byHotel: Record<string, { count: number; revenue: number; cost: number }> = {};
    filteredRpProjects.forEach((p) => {
      const agency = p.acente || 'Belirtilmemiş';
      if (!byAgency[agency]) byAgency[agency] = { count: 0, revenue: 0, cost: 0 };
      byAgency[agency].count += 1;
      byAgency[agency].revenue += toNumber(p.satis_tl);
      byAgency[agency].cost += toNumber(p.maliyet_tl);

      // Otel bazlı verilerde projeye ait tüm otelleri (hotels_data) ayrı ayrı çek
      let projectHotels: string[] = [];
      const fullProj = projects.find((proj) => proj.id === p.project_id);
      if (fullProj && Array.isArray(fullProj.hotels_data) && fullProj.hotels_data.length > 0) {
        projectHotels = fullProj.hotels_data
          .map((h: any) => {
            const hId = h.hotel_id;
            return hId ? hotelById[hId] : null;
          })
          .filter(Boolean) as string[];
      }

      const uniqueHotels = Array.from(new Set(projectHotels));
      if (uniqueHotels.length === 0) {
        uniqueHotels.push(p.otel || 'Belirtilmemiş');
      }

      // Helper to resolve hotel name for a sales/purchase item
      const getHotelNameForItem = (item: any) => {
        if (!item.hotel_id) return null;
        if (fullProj && Array.isArray(fullProj.hotels_data)) {
          const matchedTab = fullProj.hotels_data.find(
            (h: any) => h.id === item.hotel_id || h.hotel_id === item.hotel_id
          );
          if (matchedTab && matchedTab.hotel_id) {
            return hotelById[matchedTab.hotel_id] || null;
          }
        }
        return hotelById[item.hotel_id] || null;
      };

      // Filter sales and purchase items for this project
      const projSales = (salesItems || []).filter((item: any) => item.project_id === p.project_id);
      const projPurchases = (purchaseItems || []).filter((item: any) => item.project_id === p.project_id);

      // Increment count for all hotels of this project
      uniqueHotels.forEach((hotelName) => {
        if (!byHotel[hotelName]) byHotel[hotelName] = { count: 0, revenue: 0, cost: 0 };
        byHotel[hotelName].count += 1;
      });

      // Distribute sales ciro
      if (projSales.length > 0) {
        projSales.forEach((item: any) => {
          const itemVal = toNumber(item.total_price) * toNumber(item.fx || 1);
          const resolvedHotel = getHotelNameForItem(item);
          if (resolvedHotel && uniqueHotels.includes(resolvedHotel)) {
            byHotel[resolvedHotel].revenue += itemVal;
          } else {
            // General/Unassigned item: distribute equally among all hotels of the project
            const share = itemVal / uniqueHotels.length;
            uniqueHotels.forEach((hotelName) => {
              byHotel[hotelName].revenue += share;
            });
          }
        });
      } else if (toNumber(p.satis_tl) > 0) {
        // Fallback: divide overall satis_tl equally
        const share = toNumber(p.satis_tl) / uniqueHotels.length;
        uniqueHotels.forEach((hotelName) => {
          byHotel[hotelName].revenue += share;
        });
      }

      // Distribute purchase cost
      if (projPurchases.length > 0) {
        projPurchases.forEach((item: any) => {
          const itemVal = toNumber(item.total_price) * toNumber(item.fx || 1);
          const resolvedHotel = getHotelNameForItem(item);
          if (resolvedHotel && uniqueHotels.includes(resolvedHotel)) {
            byHotel[resolvedHotel].cost += itemVal;
          } else {
            // General/Unassigned item: distribute equally among all hotels of the project
            const share = itemVal / uniqueHotels.length;
            uniqueHotels.forEach((hotelName) => {
              byHotel[hotelName].cost += share;
            });
          }
        });
      } else if (toNumber(p.maliyet_tl) > 0) {
        // Fallback: divide overall maliyet_tl equally
        const share = toNumber(p.maliyet_tl) / uniqueHotels.length;
        uniqueHotels.forEach((hotelName) => {
          byHotel[hotelName].cost += share;
        });
      }
    });

    const airlineRevenue: Record<string, number> = {};
    filteredTickets.forEach((t) => {
      const airline = t.airline || t.flight_type || 'Tanımsız';
      airlineRevenue[airline] = (airlineRevenue[airline] || 0) + toNumber(t.total_amount || t.price);
    });

    const transferRevenue: Record<string, number> = {};
    const transferVehicleBySupplier: Record<string, number> = {};
    filteredTransfers.forEach((tr: any) => {
      const supplier = tr.supplier_name || supplierById[tr.supplier_id] || 'Tedarikçi';
      const vehicle = tr.vehicle_type || 'Araç';
      transferRevenue[supplier] = (transferRevenue[supplier] || 0) + toNumber(tr.amount || tr.price);
      const key = `${supplier} / ${vehicle}`;
      transferVehicleBySupplier[key] = (transferVehicleBySupplier[key] || 0) + 1;
    });

    const guideRevenue: Record<string, number> = {};
    const partTimeRevenue: Record<string, number> = {};
    filteredHrRows.forEach((row: any) => {
      const cat = (categoryById[row.sub_category_id] || row.sub_category_name || '').toLocaleLowerCase('tr-TR');
      const supplier = row.supplier_name || supplierById[row.supplier_id] || 'Tedarikçi';
      const amount = toNumber(row.amount || row.cost);
      if (cat.includes('rehber') || cat.includes('guide')) guideRevenue[supplier] = (guideRevenue[supplier] || 0) + amount;
      if (cat.includes('part') || cat.includes('yarı')) partTimeRevenue[supplier] = (partTimeRevenue[supplier] || 0) + amount;
    });

    const calendarItems = [
      ...filteredRpSejours.filter(s => normalizeStatus(s.durum).includes('konfirme')).map(s => ({
        date: s.giris_tarihi,
        type: 'Sejour',
        title: s.voucher_no || 'Sejour',
        amount: toNumber(s.satis_tl),
        href: '/sejour',
        color: 'emerald'
      })),
      ...filteredRpProjects.map(p => ({
        date: p.organizasyon_tarihi,
        type: 'Proje',
        title: p.referans_no || p.firma || 'Proje',
        amount: toNumber(p.satis_tl),
        href: '/projects',
        color: 'blue'
      })),
      ...filteredCollectionPlans.map(p => ({
        date: p.date,
        type: 'Tahsilat',
        title: p.description || 'Tahsilat',
        amount: toNumber(p.amount),
        href: '/accounting/cash-flow',
        color: 'purple'
      })),
    ].filter(i => parseDateSafe(i.date)).sort((a, b) => (parseDateSafe(a.date)?.getTime() || 0) - (parseDateSafe(b.date)?.getTime() || 0)).slice(0, 12);

    const ticketOptionCount = filteredTickets.filter((t: any) => normalizeStatus(t.status).includes('opsiyon') || normalizeStatus(t.status).includes('option')).length;
    const ticketPendingPaymentCount = filteredTicketPlans.filter((p: any) => !normalizeStatus(p.status).includes('ödendi')).length;

    return {
      projectRevenue,
      projectProfit: projectRevenue - projectCost,
      projectCost,
      sejourRevenue,
      sejourProfit: sejourRevenue - sejourCost,
      sejourCost,
      quotePending,
      quoteOption,
      quoteAgency,
      quoteConfirmed,
      quoteTotal,
      sejourStatusCounts,
      byAgency: Object.entries(byAgency).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 6),
      byHotel: Object.entries(byHotel).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 6),
      airlineRevenue: Object.entries(airlineRevenue).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 6),
      transferRevenue: Object.entries(transferRevenue).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 6),
      transferVehicleCount: Object.entries(transferVehicleBySupplier).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8),
      guideRevenue: Object.entries(guideRevenue).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 6),
      partTimeRevenue: Object.entries(partTimeRevenue).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 6),
      ticketOptionCount,
      ticketPendingPaymentCount,
      calendarItems
    };
  }, [data, period, customStartDate, customEndDate]);

  if (permissionsLoading) return <LoadingSpinner message="Yükleniyor..." />;
  if (!canView(Module.DASHBOARD)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center transition-colors duration-200">
          <XCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Erişim Engellendi</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 transition-colors duration-200">Dashboard sayfasını görüntüleme yetkiniz bulunmamaktadır.</p>
          <Link href="/" className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Ana Sayfaya Dön</Link>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Analizler hazırlanıyor..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full p-4 md:p-6 lg:p-8">
      {/* Header - Aligned Left */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Yönetim Paneli</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-start">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
            {([
              { id: 'today', label: 'Bugün' },
              { id: 'week', label: 'Hafta' },
              { id: 'month', label: 'Ay' },
              { id: 'year', label: 'Yıl' },
              { id: 'custom', label: 'Özel' }
            ] as const).map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                  period === item.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {period === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="w-72"
              >
                <DateRangeFieldAccounting 
                  label="" 
                  startValue={customStartDate} 
                  endValue={customEndDate} 
                  onStartChange={setCustomStartDate} 
                  onEndChange={setCustomEndDate} 
                  hideLabel 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={loadDashboard}
            className="p-2.5 bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            title="Yenile"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatBox 
          label="Proje Ciro" 
          value={formatMoney(metrics.projectRevenue)} 
          icon={TurkishLiraIcon} 
          color="blue"
          subValue="Dönemsel Toplam"
          trend={{ type: 'up', text: '12%' }}
        />
        <StatBox 
          label="Sejour Ciro" 
          value={formatMoney(metrics.sejourRevenue)} 
          icon={Building2} 
          color="emerald"
          subValue="Dönemsel Toplam"
          trend={{ type: 'up', text: '8%' }}
        />
        <StatBox 
          label="Kümülatif Kar" 
          value={formatMoney(metrics.projectProfit + metrics.sejourProfit)} 
          icon={TrendingUp} 
          color="purple"
          subValue="Proje + Sejour Net"
          trend={{ type: 'up', text: '15%' }}
        />
        <StatBox 
          label="Bekleyen Talepler" 
          value={formatInt(metrics.quotePending.length)} 
          icon={Clock} 
          color="amber"
          subValue={`${metrics.quoteTotal} Toplam Teklif`}
        />
      </div>

      {/* Detailed Info Panels */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <DashboardCard title="Talep & Teklif" href="/quotes" icon={Clock}>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Talepler</p>
              <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">{formatInt(metrics.quotePending.length)}</p>
            </div>
            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opsiyon</p>
              <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">{formatInt(metrics.quoteOption.length)}</p>
            </div>
            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acente</p>
              <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">{formatInt(metrics.quoteAgency.length)}</p>
            </div>
            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Konfirme</p>
              <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">{formatInt(metrics.quoteConfirmed.length)}</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Proje Verimliliği" href="/projects" icon={Briefcase}>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700/50 pb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ciro</span>
              <span className="text-xs font-black text-gray-900 dark:text-white">{formatMoney(metrics.projectRevenue)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700/50 pb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Maliyet</span>
              <span className="text-xs font-black text-gray-900 dark:text-white">{formatMoney(metrics.projectCost)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Net Kar</span>
              <span className={`text-base font-black ${metrics.projectProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatMoney(metrics.projectProfit)}
              </span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Sejour Analizi" href="/sejour" icon={Hotel}>
          <div className="flex flex-col h-full">
            <StatusPieChart 
              data={[
                { name: 'Konfirme', value: metrics.sejourStatusCounts.confirmed, color: '#10B981' },
                { name: 'Bekleyen', value: metrics.sejourStatusCounts.pending, color: '#F59E0B' },
                { name: 'İptal', value: metrics.sejourStatusCounts.cancelled, color: '#EF4444' }
              ]} 
            />
            <div className="space-y-3 mt-auto">
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gelir</span>
                <span className="text-sm font-black text-emerald-600">{formatMoney(metrics.sejourRevenue)}</span>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Bilet & Finans" href="/tickets/options" icon={Ticket}>
          <div className="space-y-3">
            <div className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 p-3">
              <p className="text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest">Bilet Opsiyonları</p>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400">{formatInt(metrics.ticketOptionCount)} Adet</p>
            </div>
            <div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10 p-3">
              <p className="text-[10px] font-black text-red-800 dark:text-red-300 uppercase tracking-widest">Bekleyen Ödemeler</p>
              <p className="text-lg font-black text-red-600 dark:text-red-400">{formatInt(metrics.ticketPendingPaymentCount)} İşlem</p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Data Grids & Charts Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-8">
        <DashboardCard title="Acente Bazlı Hacim" subtitle="Ciro ve Karlılık Grafiği" icon={Users}>
          <RevenueChart data={metrics.byAgency} />
        </DashboardCard>
        <DashboardCard title="Otel Bazlı Veriler" subtitle="Konaklama İstatistikleri" icon={Hotel}>
          <BreakdownTable rows={metrics.byHotel} />
        </DashboardCard>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <DashboardCard title="Havayolu Dağılımı" href="/operations/tickets" icon={Plane}>
          <ProgressList rows={metrics.airlineRevenue} money />
        </DashboardCard>
        <DashboardCard title="Transfer Tedarikçileri" href="/operations/transfers" icon={Building2}>
          <ProgressList rows={metrics.transferRevenue} money />
        </DashboardCard>
        <DashboardCard title="Araç Tipi Kullanımı" icon={Users}>
          <ProgressList rows={metrics.transferVehicleCount} />
        </DashboardCard>
        <DashboardCard title="İnsan Kaynakları" icon={Users}>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Kokartlı Rehber</p>
              <ProgressList rows={metrics.guideRevenue} money />
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Part-Time Personel</p>
              <ProgressList rows={metrics.partTimeRevenue} money />
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Operational Flow */}
      <DashboardCard title="Operasyonel Akış" subtitle="Yaklaşan İşlemler" icon={Calendar} className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.calendarItems.length === 0 ? (
            <p className="col-span-full text-center text-gray-400 py-12 italic text-sm">Yaklaşan işlem bulunamadı.</p>
          ) : (
            metrics.calendarItems.map((item, idx) => (
              <Link 
                key={idx}
                href={item.href}
                className="group border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl hover:border-blue-600 dark:hover:border-blue-400 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">{item.type}</span>
                  <span className="text-[9px] font-bold text-gray-400">{shortDate(item.date)}</span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">{item.title}</h4>
                <p className="mt-3 text-sm font-black text-gray-700 dark:text-gray-300">{formatMoney(item.amount)}</p>
              </Link>
            ))
          )}
        </div>
      </DashboardCard>

      {/* Footer */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-800 mt-8 transition-colors duration-200">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors duration-200">
          Son Güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
        </p>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors duration-200">
          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Sistem Aktif
        </div>
      </div>
    </div>
  );
}
