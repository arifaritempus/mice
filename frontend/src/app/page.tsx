'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Users, 
  Hotel, 
  Plane, 
  Truck, 
  Plus, 
  ChevronRight, 
  TrendingUp,
  Clock,
  Briefcase,
  FileText,
  UserCheck,
  ArrowUpRight,
  RefreshCcw,
  Search,
  FilePlus
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  projectsService,
  SejourService,
  projectTransfersService,
  ticketOptionsService,
  projectHumanResourcesService,
  categoriesService
} from '@/lib/supabaseService';
import { Module, usePermissions } from '@/lib/permissions';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface Project {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  client_name: string;
  budget: number;
  revenue: number;
  title?: string;
  company_name?: string;
}

interface Sejour {
  id: string;
  name: string;
  hotel_name: string;
  start_date: string;
  end_date: string;
  guest_count: number;
  total_cost: number;
  status: string;
  voucherNumber?: string;
  voucher_number?: string;
  customerName?: string;
  customer_name?: string;
  checkInDate?: string;
  check_in_date?: string;
  checkOutDate?: string;
  check_out_date?: string;
  totalAmount?: number;
  total_amount?: number;
  rooms?: { hotelName?: string }[];
}

interface Transfer {
  id: string;
  type: string;
  pickup_location: string;
  dropoff_location: string;
  date: string;
  guest_count: number;
  cost: number;
  status: string;
  service_type?: string;
  transfer_type?: string;
  transfer_date?: string;
  passenger_count?: number;
  cost_amount?: number;
}

interface Ticket {
  id: string;
  flight_number: string;
  departure: string;
  arrival: string;
  date: string;
  passenger_count: number;
  cost: number;
  status: string;
  airline?: string;
  flight_type?: string;
  voucher_no?: string;
  departure_date?: string;
  entry_date?: string;
  return_date?: string;
  total_cost?: number;
}

interface Guide {
  id: string;
  name: string;
  service_date: string;
  location: string;
  guest_count: number;
  cost: number;
  status: string;
  description?: string;
  date?: string;
  created_at?: string;
  hotel?: string;
  amount?: number;
  sub_category_id?: string;
  sub_category_name?: string;
}

interface PartTime {
  id: string;
  name: string;
  service_date: string;
  location: string;
  hours: number;
  hourly_rate: number;
  status: string;
  description?: string;
  date?: string;
  created_at?: string;
  hotel?: string;
  sub_category_id?: string;
  sub_category_name?: string;
}

interface DashboardData {
  upcomingProjects: Project[];
  upcomingSejours: Sejour[];
  upcomingTransfers: Transfer[];
  upcomingTickets: Ticket[];
  upcomingGuides: Guide[];
  upcomingPartTime: PartTime[];
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];

export default function HomePage() {
  const { canCreate, loading: permissionsLoading } = usePermissions();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    upcomingProjects: [],
    upcomingSejours: [],
    upcomingTransfers: [],
    upcomingTickets: [],
    upcomingGuides: [],
    upcomingPartTime: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('activity');

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [projectsRes, sejoursRes, ticketsRes, categoriesRes] = await Promise.allSettled([
        projectsService.getAll(),
        SejourService.getSejours(),
        ticketOptionsService.getAll(),
        categoriesService.getAll()
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

      const filterUpcoming = <T extends Record<string, unknown>>(items: T[], dateField: string): T[] => {
        return items.filter(item => {
          const dateVal = item[dateField] || item.start_date || item.check_in_date || item.transfer_date || item.flight_date || item.service_date || item.date;
          if (!dateVal) return false;
          const itemDate = new Date(dateVal as string);
          return itemDate >= today && itemDate <= thirtyDaysFromNow;
        }).sort((a, b) => {
          const aDateStr = a[dateField] || a.start_date || a.check_in_date || a.transfer_date || a.flight_date || a.service_date || a.date;
          const bDateStr = b[dateField] || b.start_date || b.check_in_date || b.transfer_date || b.flight_date || b.service_date || b.date;
          const aDate = new Date(aDateStr as string).getTime();
          const bDate = new Date(bDateStr as string).getTime();
          return aDate - bDate;
        }).slice(0, 5);
      };

      const projects = projectsRes.status === 'fulfilled' ? (projectsRes.value as Project[]) : [];
      const mappedProjects = projects.map(p => ({
        ...p,
        name: p.title || p.name || 'Untitled',
        client_name: p.company_name || p.client_name || 'Bilinmeyen Müşteri'
      }));

      const sejoursRaw = sejoursRes.status === 'fulfilled' ? sejoursRes.value : [];
      const sejours = (Array.isArray(sejoursRaw) ? sejoursRaw : ((sejoursRaw as { data?: Sejour[] }).data || [])) as any[];
      const mappedSejours = sejours.map(s => ({
        ...s,
        name: s.voucherNumber || s.voucher_number || s.customerName || s.customer_name || 'Sejour',
        start_date: s.checkInDate || s.check_in_date || '',
        end_date: s.checkOutDate || s.check_out_date || '',
        hotel_name: s.rooms?.[0]?.hotelName || s.hotel_name || '',
        guest_count: s.rooms?.length || 0,
        total_cost: s.totalAmount || s.total_amount || 0
      }));

      // Project Transfers
      const activeProjects = mappedProjects.filter(p => (p.status || '').toLowerCase() === 'active');
      const transferBuckets = await Promise.all(
        activeProjects.map(p => projectTransfersService.getByProjectId(p.id).catch(() => []))
      );
      const projectTransfers = (transferBuckets.flat() as Transfer[]).map(t => ({
        id: t.id,
        type: t.service_type || t.transfer_type || 'Transfer',
        pickup_location: t.pickup_location || '',
        dropoff_location: t.dropoff_location || '',
        date: t.date || t.transfer_date || '',
        guest_count: t.passenger_count || 0,
        cost: t.cost_amount || 0,
        status: t.status || 'confirmed'
      }));

      // Sejour Transfers
      const sejourTransfers = sejours.flatMap(s => (s.transfers || []).map((t: any) => ({
        id: t.id,
        type: t.type || t.transferType || 'Sejour Transfer',
        pickup_location: t.direction === 'arrival' ? 'Havalimanı' : (t.routeDescription || 'Otel'),
        dropoff_location: t.direction === 'arrival' ? (t.routeDescription || 'Otel') : 'Havalimanı',
        date: t.date || s.check_in_date || s.checkInDate || '',
        guest_count: s.guest_count || 0,
        cost: t.price || 0,
        status: 'confirmed'
      })));

      const allTransfers = [...projectTransfers, ...sejourTransfers];

      // Project HR
      const hrBuckets = await Promise.all(
        activeProjects.map(p => projectHumanResourcesService.getByProjectId(p.id).catch(() => []))
      );
      const hrRows = hrBuckets.flat() as (Guide & PartTime)[];

      const categories = categoriesRes.status === 'fulfilled' ? (categoriesRes.value as { id: string; name: string }[]) : [];
      const categoryById: Record<string, { id: string; name: string }> = {};
      categories.forEach(c => { categoryById[c.id] = c; });

      const mappedGuides = hrRows
        .filter(r => {
          const n = (categoryById[r.sub_category_id || '']?.name || r.sub_category_name || '').toString().toLowerCase();
          return n.includes('rehber') || n.includes('guide');
        })
        .map(r => ({
          id: r.id,
          name: r.description || 'Kokartli Rehber',
          service_date: r.date || r.created_at || '',
          location: r.hotel || '',
          guest_count: 0,
          cost: r.amount || 0,
          status: 'confirmed'
        }));

      const mappedPartTime = hrRows
        .filter(r => {
          const n = (categoryById[r.sub_category_id || '']?.name || r.sub_category_name || '').toString().toLowerCase();
          return (n.includes('part') && n.includes('time')) || n.includes('yari zamanli') || n.includes('insan kaynak');
        })
        .map(r => ({
          id: r.id,
          name: r.description || 'Part-Time',
          service_date: r.date || r.created_at || '',
          location: r.hotel || '',
          hours: 0,
          hourly_rate: 0,
          status: 'confirmed'
        }));

      // Sejour Extras (Guides & Part-Time)
      const sejourExtras = sejours.flatMap(s => (s.extraServices || []).map((e: any) => {
        const n = (e.serviceTypeName || '').toLowerCase();
        const isGuide = n.includes('rehber') || n.includes('guide');
        const isPartTime = (n.includes('part') && n.includes('time')) || n.includes('yari zamanli') || n.includes('insan kaynak');

        return {
          id: e.id,
          name: e.serviceName || e.serviceTypeName || 'Ek Hizmet',
          service_date: s.checkInDate || s.check_in_date || '',
          location: e.supplierName || '',
          cost: e.price || 0,
          status: 'confirmed',
          isGuide,
          isPartTime
        };
      }));

      const allGuides = [...mappedGuides, ...sejourExtras.filter(e => e.isGuide)];
      const allPartTime = [...mappedPartTime, ...sejourExtras.filter(e => e.isPartTime)];

      // Tickets (Project Options + Sejour Flights)
      const tickets = ticketsRes.status === 'fulfilled' ? (ticketsRes.value as Ticket[]) : [];
      const mappedTickets = tickets
        .filter(t => (t.status || '').toLowerCase() === 'confirmed')
        .map(t => ({
          id: t.id,
          flight_number: t.airline || t.flight_type || t.voucher_no || 'Bilet',
          departure: t.departure_date || '',
          arrival: t.return_date || '',
          date: t.departure_date || t.entry_date || '',
          passenger_count: t.passenger_count || 0,
          cost: t.total_cost || 0,
          status: t.status || 'confirmed'
        }));

      const sejourFlights = sejours.flatMap(s => (s.flights || []).map((f: any) => ({
        id: f.id,
        flight_number: f.flightNo || f.airline || 'Sejour Uçuş',
        departure: f.route || '',
        arrival: '',
        date: f.flightDate || f.departureDate || '',
        passenger_count: f.totalPassengers || 0,
        cost: f.totalPrice || 0,
        status: 'confirmed'
      })));

      const allTickets = [...mappedTickets, ...sejourFlights];

      setDashboardData({
        upcomingProjects: filterUpcoming(mappedProjects, 'start_date'),
        upcomingSejours: filterUpcoming(mappedSejours, 'start_date'),
        upcomingTransfers: filterUpcoming(allTransfers, 'date'),
        upcomingTickets: filterUpcoming(allTickets, 'date'),
        upcomingGuides: filterUpcoming(allGuides, 'service_date'),
        upcomingPartTime: filterUpcoming(allPartTime, 'service_date')
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Dashboard data yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const chartData = useMemo(() => [
    { name: 'Projeler', count: dashboardData.upcomingProjects.length, color: COLORS[0] },
    { name: 'Sejourlar', count: dashboardData.upcomingSejours.length, color: COLORS[1] },
    { name: 'Transferler', count: dashboardData.upcomingTransfers.length, color: COLORS[2] },
    { name: 'Biletler', count: dashboardData.upcomingTickets.length, color: COLORS[3] },
    { name: 'Rehberler', count: dashboardData.upcomingGuides.length, color: COLORS[4] },
    { name: 'Part-Time', count: dashboardData.upcomingPartTime.length, color: COLORS[5] },
  ].filter(d => d.count > 0), [dashboardData]);

  const stats = useMemo(() => [
    { label: 'Aktif Projeler', value: dashboardData.upcomingProjects.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Bekleyen Sejourlar', value: dashboardData.upcomingSejours.length, icon: Hotel, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Bugünkü Transferler', value: dashboardData.upcomingTransfers.length, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Personel Talepleri', value: dashboardData.upcomingPartTime.length, icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' },
  ], [dashboardData]);

  if (permissionsLoading) return <LoadingSpinner message="Sistem hazırlanıyor..." />;

  const DashboardCard = ({ title, icon: Icon, children, link, color }: { title: string; icon: React.ElementType; children: React.ReactNode; link: string; color: string }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full group hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider">{title}</h3>
        </div>
        <Link href={link} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>
      <div className="p-4 flex-1 space-y-2">
        {children}
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-3">
        <Clock className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Yakın zamanda kayıt bulunmuyor</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-4 md:p-6 lg:p-8 font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-500 flex flex-col">
      
      {/* Premium Header Section */}
      <header className="w-full mb-8 flex flex-col gap-4 text-left">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-3 mb-1">
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <RefreshCcw className="w-2.5 h-2.5 animate-spin-slow" />
              Son Güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Ana Sayfa
          </h1>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-wrap gap-2 justify-start"
        >
          {canCreate(Module.QUOTES) && (
            <Link href="/quotes/create" className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-slate-900/10 dark:shadow-white/5">
              <FilePlus className="w-3.5 h-3.5" />
              Yeni Teklif
            </Link>
          )}
          {canCreate(Module.SEJOUR) && (
            <Link href="/sejour/create" className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all shadow-sm">
              <Hotel className="w-3.5 h-3.5 text-blue-600" />
              Yeni Sejour
            </Link>
          )}
        </motion.div>
      </header>

      <main className="w-full flex-1 flex flex-col space-y-12">
        {/* Loading overlay for data refresh */}
        {loading && !dashboardData.upcomingProjects.length && (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner message="Veriler yükleniyor..." compact />
          </div>
        )}

        {!loading && (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:border-blue-200 dark:hover:border-slate-700 transition-all duration-300 group"
                >
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-105 transition-transform duration-500`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Section 1: Aktif Akış (Cards) */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs">Aktif Akış</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Dashboard Cards for different modules */}
                <DashboardCard title="Yaklaşan Projeler" icon={Briefcase} link="/projects" color="text-blue-600">
                  {dashboardData.upcomingProjects.length > 0 ? dashboardData.upcomingProjects.map((p, i) => (
                    <div key={`project-${p.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{p.client_name}</p>
                      </div>
                      <span className="text-[10px] font-black text-blue-600 whitespace-nowrap">{new Date(p.start_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>

                <DashboardCard title="Sejour & Konaklama" icon={Hotel} link="/sejour" color="text-emerald-600">
                  {dashboardData.upcomingSejours.length > 0 ? dashboardData.upcomingSejours.map((s, i) => (
                    <div key={`sejour-${s.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{s.hotel_name}</p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 whitespace-nowrap">{new Date(s.start_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>

                <DashboardCard title="Transferler" icon={Truck} link="/operations/transfers" color="text-indigo-600">
                  {dashboardData.upcomingTransfers.length > 0 ? dashboardData.upcomingTransfers.map((t, i) => (
                    <div key={`transfer-${t.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{t.pickup_location} → {t.dropoff_location}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{t.type}</p>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 whitespace-nowrap">{new Date(t.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>

                <DashboardCard title="Uçuş & Biletler" icon={Plane} link="/tickets/options" color="text-amber-600">
                  {dashboardData.upcomingTickets.length > 0 ? dashboardData.upcomingTickets.map((t, i) => (
                    <div key={`ticket-${t.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{t.flight_number}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{t.passenger_count} Yolcu</p>
                      </div>
                      <span className="text-[10px] font-black text-amber-600 whitespace-nowrap">{new Date(t.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>

                <DashboardCard title="PERSONEL PLANLAMASI" icon={Users} link="/operations/part-time" color="text-rose-600">
                  {dashboardData.upcomingPartTime.length > 0 ? dashboardData.upcomingPartTime.map((p, i) => (
                    <div key={`pt-${p.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{p.location}</p>
                      </div>
                      <span className="text-[10px] font-black text-rose-600 whitespace-nowrap">{new Date(p.service_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>

                <DashboardCard title="KOKARTLI REHBERLER" icon={UserCheck} link="/operations/guides" color="text-purple-600">
                  {dashboardData.upcomingGuides.length > 0 ? dashboardData.upcomingGuides.map((g, i) => (
                    <div key={`guide-${g.id}-${i}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{g.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{g.location}</p>
                      </div>
                      <span className="text-[10px] font-black text-purple-600 whitespace-nowrap">{new Date(g.service_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )) : <EmptyState />}
                </DashboardCard>
              </div>
            </div>

            {/* Section 2: Genel Bakış (Overview) */}
            <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs">Genel Bakış</h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Visual Analytics */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-fit">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-xs mb-1">Operasyonel Dağılım</h2>
                      <p className="text-[10px] text-slate-500 font-medium italic">Gelecek 30 günlük planlanan işlemler</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+12% Artış</span>
                    </div>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }}
                          dy={10}
                        />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{payload[0].payload.name}</p>
                                  <p className="text-base font-black text-slate-900 dark:text-white">{payload[0].value} Kayıt</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={35}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick Actions / Shortcut Cards */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                    <h3 className="text-xl font-black tracking-tight mb-3 leading-tight">İşinizi <br/>Kolaylaştırın</h3>
                    <p className="text-blue-100 text-[10px] font-medium mb-6 leading-relaxed">Hızlı işlem panelini kullanarak saniyeler içerisinde yeni kayıtlar oluşturabilirsiniz.</p>
                    <div className="grid grid-cols-2 gap-2">
                      {canCreate(Module.QUOTES) && (
                        <Link href="/quotes/create" className="p-3 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-colors flex flex-col gap-2">
                          <Plus className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Teklif</span>
                        </Link>
                      )}
                      {canCreate(Module.SEJOUR) && (
                        <Link href="/sejour/create" className="p-3 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-colors flex flex-col gap-2">
                          <Hotel className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Sejour</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 className="font-black text-slate-900 dark:text-white tracking-tight uppercase text-[10px] mb-4">Hızlı Erişim</h3>
                    <div className="space-y-2">
                      <Link href="/reports" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:bg-blue-600 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <FileText className="w-3.5 h-3.5 text-blue-600 group-hover:text-white" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-white">Raporlar</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-white" />
                      </Link>
                      <Link href="/users" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:bg-emerald-600 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-white">Kullanıcılar</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-white" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
