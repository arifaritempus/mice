const fs = require('fs');

const content = `// MICE Management System - The Ultimate WOW Dashboard
'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, MoreVertical, TrendingDown, Users, Building2, Plane, 
  Calendar, RefreshCw, ChevronRight, Briefcase, Hotel, Ticket,
  BarChart3, PieChart as PieChartIcon, ArrowUpRight, Clock, CheckCircle2, AlertCircle,
  XCircle, Megaphone, Target, Mail, MousePointerClick, Phone, MessageSquare,
  Wallet, ShieldAlert, Award, ArrowDownRight, DollarSign, Bus, Activity, Landmark
} from 'lucide-react';
import {
  agenciesService, categoriesService, hotelsService,
  projectCollectionPlansService, projectHumanResourcesService,
  projectPaymentPlansService, projectsService, projectTransfersService,
  quotesService, SejourService, suppliersService, ticketOptionsService,
  ticketPaymentPlansService, marketingService
} from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';

// --- CountUp Component ---
const CountUp = ({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) { setCount(end); return; }
    const duration = 1500;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(progress * (end - start) + start);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [value]);
  return <span>{prefix}{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(count)}{suffix}</span>;
};

// --- Formatters ---
const formatMoney = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n || 0);
const formatInt = (n: number) => new Intl.NumberFormat('tr-TR').format(n || 0);
const parseDateSafe = (value: any) => {
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

const getPeriodRange = (period: PeriodFilter, customStart?: string, customEnd?: string) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (period === 'today') {
    start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999); return { start, end };
  }
  if (period === 'week') {
    const day = now.getDay(); const diff = day === 0 ? -6 : 1 - day;
    start.setDate(now.getDate() + diff); start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999); return { start, end };
  }
  if (period === 'year') {
    start.setMonth(0, 1); start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31); end.setHours(23, 59, 59, 999); return { start, end };
  }
  if (period === 'custom' && customStart && customEnd) {
    const cs = parseDateSafe(customStart); const ce = parseDateSafe(customEnd);
    if (cs && ce) { cs.setHours(0,0,0,0); ce.setHours(23,59,59,999); return { start: cs, end: ce }; }
  }
  start.setDate(1); start.setHours(0, 0, 0, 0);
  end.setMonth(start.getMonth() + 1, 0); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const inRange = (value: any, range: { start: Date; end: Date }) => {
  const dt = parseDateSafe(value);
  if (!dt) return false;
  return dt >= range.start && dt <= range.end;
};

// --- Chart Custom Tooltips ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a]/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl z-50 relative">
        <p className="text-white font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          // Eğer Değer para birimiyse formatla, yoksa sayı formatında göster
          const isMoney = ['Tahsilat', 'Ödeme', 'Ciro', 'Kâr', 'Maliyet', 'Satis'].includes(entry.name) || entry.name.includes('TRY');
          const val = isMoney ? formatMoney(entry.value) : formatInt(entry.value);
          return (
            <div key={index} className="flex items-center justify-between gap-6 text-xs mb-1">
              <span style={{ color: entry.color }} className="font-semibold">{entry.name}</span>
              <span className="text-white font-mono">{val}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// --- Components ---
const GlassCard = ({ children, className = '', glowColor = '' }: any) => (
  <div className={\`relative bg-[#0f172a]/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-visible \${className}\`}>
    {glowColor && <div className={\`absolute -top-10 -right-10 w-40 h-40 bg-\${glowColor}-500/20 blur-3xl rounded-full pointer-events-none\`} />}
    {children}
  </div>
);

const KPICard = ({ title, value, icon: Icon, color, isMoney = false, trend }: any) => {
  const colors: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    emerald: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
    rose: "text-rose-400 bg-rose-500/20 border-rose-500/30",
    fuchsia: "text-fuchsia-400 bg-fuchsia-500/20 border-fuchsia-500/30",
    amber: "text-amber-400 bg-amber-500/20 border-amber-500/30",
    violet: "text-violet-400 bg-violet-500/20 border-violet-500/30",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={\`glass-card p-6 flex flex-col justify-between relative overflow-hidden group border border-white/5 bg-gradient-to-br from-white/5 to-transparent rounded-3xl\`}>
      <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={120} />
      </div>
      <div className="flex justify-between items-start z-10">
        <div className={\`p-3 rounded-2xl \${colors[color] || colors.blue} border shadow-[0_0_20px_rgba(0,0,0,0.3)]\`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={\`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg \${trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}\`}>
            {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-6 z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h4 className="text-3xl font-black text-white mt-1 tracking-tight">
          {isMoney ? <CountUp value={value} prefix="₺" /> : <CountUp value={value} />}
        </h4>
      </div>
    </motion.div>
  );
};

export default function UltimateDashboard() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('year');
  const [customDate, setCustomDate] = useState({ start: '', end: '' });
  const [showCustomDate, setShowCustomDate] = useState(false);
  
  const [data, setData] = useState<any>({
    rpProjectRows: [], rpSejourRows: [],
    collectionPlans: [], paymentPlans: [],
    marketingInteractions: [], quotes: [], projects: [],
    salesItems: [], purchaseItems: [], categories: [], agencies: [],
    sejours: [], transfers: [], flights: [], hrRows: [], hotels: [], suppliers: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const fetchView = async (v: string) => (await supabase.from(v).select('*')).data || [];
      
      const [rpProj, rpSej, cols, pays, mkt, qts, prj, sales, purch, cats, agn, sejs, trns, flg, hr, htl, sup] = await Promise.all([
        fetchView('vw_rp_proje_satis_maliyet'),
        fetchView('vw_rp_sejour_kar_zarar'),
        projectCollectionPlansService.getAll(),
        projectPaymentPlansService.getAll(),
        marketingService.interactions.getAll(),
        quotesService.getAll(),
        projectsService.getAll(),
        supabase.from('project_sales_items').select('*, categories(name)'),
        supabase.from('project_purchase_items').select('*, categories(name)'),
        categoriesService.getAll(),
        agenciesService.getAll(),
        SejourService.getSejours(),
        supabase.from('project_transfer_tour').select('*, suppliers(name)'),
        supabase.from('project_flight_tickets').select('*'),
        supabase.from('project_human_resources').select('*'),
        hotelsService.getAll(),
        suppliersService.getAll()
      ]);

      setData({
        rpProjectRows: rpProj, rpSejourRows: rpSej,
        collectionPlans: Array.isArray(cols) ? cols : [], paymentPlans: Array.isArray(pays) ? pays : [],
        marketingInteractions: Array.isArray(mkt) ? mkt : [], quotes: Array.isArray(qts) ? qts : [], 
        projects: Array.isArray(prj) ? prj : [], salesItems: sales.data || [], purchaseItems: purch.data || [],
        categories: Array.isArray(cats) ? cats : [], agencies: Array.isArray(agn) ? agn : [],
        sejours: Array.isArray(sejs) ? sejs : [], transfers: trns.data || [], flights: flg.data || [],
        hrRows: hr.data || [], hotels: Array.isArray(htl) ? htl : [], suppliers: Array.isArray(sup) ? sup : []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const m = useMemo(() => {
    const range = getPeriodRange(period, customDate.start, customDate.end);
    
    // Filtering
    const fProj = data.rpProjectRows.filter((r:any) => inRange(r.organizasyon_tarihi || r.created_at, range));
    const fSej = data.rpSejourRows.filter((r:any) => inRange(r.giris_tarihi || r.created_at, range));
    const fCols = data.collectionPlans.filter((c:any) => inRange(c.due_date || c.date, range));
    const fPays = data.paymentPlans.filter((p:any) => inRange(p.due_date || p.date, range));
    const fQts = data.quotes.filter((q:any) => inRange(q.created_at || q.option_date, range));
    const fTransfers = data.transfers.filter((t:any) => inRange(t.transfer_date || t.created_at, range));
    const fFlights = data.flights.filter((f:any) => inRange(f.gidis_tarihi || f.created_at, range));
    const fHr = data.hrRows.filter((h:any) => inRange(h.start_date || h.created_at, range));
    const fSales = data.salesItems.filter((s:any) => inRange(s.created_at, range));
    
    // KPI 1: Total Revenue & Profit (MICE + Sejour)
    const miceRev = fProj.reduce((acc:number, p:any) => acc + (Number(p.satis_tl)||0), 0);
    const miceCost = fProj.reduce((acc:number, p:any) => acc + (Number(p.maliyet_tl)||0), 0);
    const sejRev = fSej.reduce((acc:number, s:any) => acc + (Number(s.satis_tl)||0), 0);
    const sejCost = fSej.reduce((acc:number, s:any) => acc + (Number(s.maliyet_tl)||0), 0);
    
    const totalRev = miceRev + sejRev;
    const totalProfit = (miceRev - miceCost) + (sejRev - sejCost);

    // KPI 2: Cash Flow (Collections vs Payments)
    const fxRate = 35; // Generic static rate for projection if currency is not TRY. Real app would map per currency.
    const pendingCols = fCols.filter((c:any) => (c.status||'').toLowerCase() !== 'paid').reduce((acc:number, c:any) => acc + (Number(c.amount)||0) * (c.currency === 'TRY' ? 1 : fxRate), 0);
    const pendingPays = fPays.filter((p:any) => (p.status||'').toLowerCase() !== 'paid').reduce((acc:number, p:any) => acc + (Number(p.amount)||0) * (p.currency === 'TRY' ? 1 : fxRate), 0);
    const netPosition = pendingCols - pendingPays;

    // KPI 3: Quotes Conversion
    const wonQts = fQts.filter((q:any) => (q.status||'').toLowerCase().includes('konfirme')).length;
    const convRate = fQts.length > 0 ? Math.round((wonQts / fQts.length) * 100) : 0;

    // Chart 1: Cash Flow Projection by Month
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const cashFlowData = months.map((m, i) => {
      const monthCols = data.collectionPlans.filter((c:any) => {
        const d = parseDateSafe(c.due_date || c.date); return d && d.getMonth() === i;
      }).reduce((acc:number, c:any) => acc + (Number(c.amount)||0) * (c.currency === 'TRY' ? 1 : fxRate), 0);
      const monthPays = data.paymentPlans.filter((p:any) => {
        const d = parseDateSafe(p.due_date || p.date); return d && d.getMonth() === i;
      }).reduce((acc:number, p:any) => acc + (Number(p.amount)||0) * (p.currency === 'TRY' ? 1 : fxRate), 0);
      return { name: m, Tahsilat: monthCols, Ödeme: monthPays };
    });

    // Chart 2: Category Breakdown (MICE)
    const categoryMap: Record<string, number> = {};
    fSales.forEach((si:any) => {
      const catName = si.categories?.name || 'Diğer Hizmetler';
      categoryMap[catName] = (categoryMap[catName] || 0) + (Number(si.total_try) || (Number(si.total_price)*fxRate) || 0);
    });
    const donutData = Object.keys(categoryMap).map(k => ({ name: k, value: categoryMap[k] })).sort((a,b)=>b.value-a.value).slice(0,5);
    const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];
    donutData.forEach((d, i) => { (d as any).color = COLORS[i % COLORS.length]; });

    // Chart 3: Top Agencies Profitability (MICE + Sejour)
    const agMap: Record<string, { rev: number, cost: number }> = {};
    fProj.forEach((p:any) => {
      const agName = p.acente_adi || 'Bilinmiyor';
      if(!agMap[agName]) agMap[agName] = { rev:0, cost:0 };
      agMap[agName].rev += Number(p.satis_tl)||0;
      agMap[agName].cost += Number(p.maliyet_tl)||0;
    });
    fSej.forEach((s:any) => {
      const agName = s.acente_adi || 'Bilinmiyor';
      if(!agMap[agName]) agMap[agName] = { rev:0, cost:0 };
      agMap[agName].rev += Number(s.satis_tl)||0;
      agMap[agName].cost += Number(s.maliyet_tl)||0;
    });
    const agData = Object.keys(agMap).map(k => ({ name: k, Ciro: agMap[k].rev, Kâr: agMap[k].rev - agMap[k].cost }))
      .sort((a,b) => b.Kâr - a.Kâr).slice(0, 6);

    // Airlines Distribution
    const airlineMap: Record<string, number> = {};
    fFlights.forEach((f:any) => {
      const al = f.havayolu || 'Diğer';
      airlineMap[al] = (airlineMap[al] || 0) + 1;
    });
    const airlineData = Object.keys(airlineMap).map(k => ({ name: k, Adet: airlineMap[k] })).sort((a,b)=>b.Adet-a.Adet).slice(0, 5);

    // Hotels Distribution (Top 5 Hotels)
    const hotelMap: Record<string, number> = {};
    fSej.forEach((s:any) => {
      const ht = s.otel_adi || 'Diğer';
      hotelMap[ht] = (hotelMap[ht] || 0) + (Number(s.satis_tl) || 0);
    });
    const hotelData = Object.keys(hotelMap).map(k => ({ name: k, Ciro: hotelMap[k] })).sort((a,b)=>b.Ciro-a.Ciro).slice(0, 5);

    // Transfers Distribution (Vehicle types / Suppliers)
    const supplierMap: Record<string, number> = {};
    fTransfers.forEach((t:any) => {
      const sp = t.suppliers?.name || t.tedarikci_adi || 'Diğer';
      supplierMap[sp] = (supplierMap[sp] || 0) + 1;
    });
    const transferData = Object.keys(supplierMap).map(k => ({ name: k, Adet: supplierMap[k] })).sort((a,b)=>b.Adet-a.Adet).slice(0,5);

    // Marketing Funnel
    const totalInteractions = data.marketingInteractions.filter((i:any) => inRange(i.interaction_date || i.appointment_date, range)).length;
    
    // Unpaid & Critical Invoices Table
    const topPendingCols = fCols.filter((c:any) => (c.status||'').toLowerCase() !== 'paid')
      .map((c:any) => {
        const p = data.projects.find((pr:any) => pr.id === c.project_id);
        return { name: p?.title || p?.company_name || 'İsimsiz Proje', val: Number(c.amount) * (c.currency==='TRY'?1:fxRate), date: c.due_date || c.date };
      }).sort((a,b)=>b.val-a.val).slice(0, 5);

    return {
      totalRev, totalProfit, netPosition, pendingCols, pendingPays,
      wonQts, totalQts: fQts.length, convRate,
      cashFlowData, donutData, agData, totalInteractions,
      activeOps: fProj.length + fSej.length + data.transfers.length,
      miceRev, sejRev,
      airlineData, hotelData, transferData, hrCount: fHr.length, flightCount: fFlights.length, transferCount: fTransfers.length,
      topPendingCols
    };
  }, [data, period, customDate]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#020617]"><div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-8 font-sans selection:bg-fuchsia-500/30 overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-900/20 blur-[150px] rounded-full" />
      </div>

      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-fuchsia-400 to-emerald-400 pb-2">
            Ultimate Dashboard
          </h1>
          <p className="text-slate-400 font-medium tracking-wide flex items-center gap-2">
            <Activity size={16} className="text-emerald-500 animate-pulse" />
            Tüm Sistem Projeksiyonları ve Finansal Analizler
          </p>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
          {([
            { id: 'today', label: 'Bugün' }, { id: 'week', label: 'Bu Hafta' },
            { id: 'month', label: 'Bu Ay' }, { id: 'year', label: 'Bu Yıl' }
          ] as const).map((item) => (
            <button key={item.id} onClick={() => { setPeriod(item.id as PeriodFilter); setShowCustomDate(false); }}
              className={\`px-5 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 \${
                period === item.id ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }\`}
            >{item.label}</button>
          ))}
          <button onClick={() => { setPeriod('custom'); setShowCustomDate(true); }}
            className={\`px-5 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 \${
              period === 'custom' ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }\`}
          ><Calendar size={14} /> Özel</button>
        </div>
      </div>

      <AnimatePresence>
        {showCustomDate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 relative z-10">
            <div className="flex items-center gap-4 bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl w-fit shadow-2xl">
              <input type="date" value={customDate.start} onChange={(e) => setCustomDate(p => ({ ...p, start: e.target.value }))} className="bg-black/30 border border-white/10 text-white text-sm px-4 py-2 rounded-xl focus:outline-none focus:border-fuchsia-500/50 transition-colors" />
              <span className="text-slate-500 font-black">-</span>
              <input type="date" value={customDate.end} onChange={(e) => setCustomDate(p => ({ ...p, end: e.target.value }))} className="bg-black/30 border border-white/10 text-white text-sm px-4 py-2 rounded-xl focus:outline-none focus:border-fuchsia-500/50 transition-colors" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 1: Giant KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
        <KPICard title="Konsolide Toplam Ciro" value={m.totalRev} isMoney icon={TrendingUp} color="emerald" trend={12} />
        <KPICard title="Konsolide Kümülatif Kâr" value={m.totalProfit} isMoney icon={Award} color="fuchsia" trend={8} />
        <KPICard title="Net Nakit Pozisyonu" value={m.netPosition} isMoney icon={Landmark} color={m.netPosition >= 0 ? "blue" : "rose"} />
        <KPICard title="Teklif Dönüşüm Oranı" value={m.convRate} suffix="%" icon={Target} color="amber" trend={5} />
      </div>

      {/* Row 2: Cash Flow & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 relative z-10">
        {/* Cash Flow Area Chart */}
        <div className="lg:col-span-8">
          <GlassCard className="p-6 h-full" glowColor="blue">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black tracking-wide text-white">Nakit Akışı Projeksiyonu</h2>
                <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Önümüzdeki aylara göre tahsilat ve ödeme vadeleri (TRY)</p>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]"><Activity size={24}/></div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={m.cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTahsilat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOdeme" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} tickFormatter={(v) => \`\${(v/1000000).toFixed(1)}M\`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.2 }} />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} iconType="circle" />
                  <Area type="monotone" dataKey="Tahsilat" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTahsilat)" />
                  <Area type="monotone" dataKey="Ödeme" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorOdeme)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Categories Donut Chart */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <GlassCard className="p-6 flex-1" glowColor="fuchsia">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black tracking-wide">Proje Kategori Dağılımı</h2>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Ciro Getiren Kalemler</p>
              </div>
              <div className="p-2 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl border border-fuchsia-500/20"><PieChartIcon size={20}/></div>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={m.donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {m.donutData.map((entry, index) => <Cell key={\`cell-\${index}\`} fill={(entry as any).color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex-1 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border-indigo-500/20">
            <h2 className="text-xs font-black tracking-widest uppercase text-indigo-400 mb-4 flex items-center gap-2"><Building2 size={16}/> Departman Ciroları</h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-300">MICE Projeleri</span><span className="text-white font-mono">{formatMoney(m.miceRev)}</span></div>
                <div className="h-1.5 bg-indigo-950 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{width: \`\${Math.max((m.miceRev/m.totalRev)*100, 5)}%\`}}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-300">Sejour & Otel</span><span className="text-white font-mono">{formatMoney(m.sejRev)}</span></div>
                <div className="h-1.5 bg-blue-950 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width: \`\${Math.max((m.sejRev/m.totalRev)*100, 5)}%\`}}></div></div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Row 3: Profitability, Funnel & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Agency Profitability Composed Chart */}
        <div className="lg:col-span-6">
          <GlassCard className="p-6 h-full" glowColor="amber">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black tracking-wide">Top 6 Acente: Hacim & Kârlılık</h2>
                <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">En Yüksek Ciro ve Kâr (MICE + Sejour)</p>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]"><BarChart3 size={24}/></div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={m.agData} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(v) => \`\${(v/1000000).toFixed(1)}M\`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="Ciro" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
                  <Line yAxisId="left" type="monotone" dataKey="Kâr" stroke="#10b981" strokeWidth={5} dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#0f172a' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Operational Distribution & Funnel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <GlassCard className="p-6 flex-1 border-violet-500/20">
            <h2 className="text-xs font-black tracking-widest uppercase text-violet-400 mb-6 flex items-center gap-2"><Users size={16}/> Operasyon & İK Hacmi</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-300 flex items-center gap-2"><Ticket size={14}/> Kesilen Bilet</span>
                  <span className="text-white bg-white/10 px-2 py-1 rounded-lg">{m.flightCount}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-300 flex items-center gap-2"><Bus size={14}/> Toplam Transfer</span>
                  <span className="text-white bg-white/10 px-2 py-1 rounded-lg">{m.transferCount}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-300 flex items-center gap-2"><Briefcase size={14}/> Görevlendirilen İK</span>
                  <span className="text-white bg-white/10 px-2 py-1 rounded-lg">{m.hrCount}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-300 flex items-center gap-2"><MessageSquare size={14}/> Pazarlama Görüşmesi</span>
                  <span className="text-white bg-white/10 px-2 py-1 rounded-lg">{m.totalInteractions}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex-1 bg-gradient-to-br from-rose-500/10 to-orange-500/10 border-rose-500/20 flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                <ShieldAlert size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest text-rose-400 uppercase">Risk: Gecikmiş Tahsilatlar</p>
                <h3 className="text-2xl font-black text-white mt-1 font-mono"><CountUp value={m.pendingCols} prefix="₺" /></h3>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Top Pending Collections List */}
        <div className="lg:col-span-3">
          <GlassCard className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black tracking-widest uppercase text-white flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-500"/> Acil Tahsilatlar
              </h2>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {m.topPendingCols.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <CheckCircle2 size={32} className="text-emerald-500 mb-2"/>
                  <span className="text-xs font-bold">Bekleyen kritik tahsilat yok.</span>
                </div>
              ) : (
                m.topPendingCols.map((col: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                    <p className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors" title={col.name}>{col.name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded-md">{col.date || '-'}</span>
                      <span className="text-sm font-black text-rose-400">{formatMoney(col.val)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

      </div>

    </div>
  );
}
`;

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log('Done writing');
